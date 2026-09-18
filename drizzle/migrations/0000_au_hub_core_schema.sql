-- ROLES
create type public.app_role as enum ('admin','student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  student_id text,
  department text,
  year int,
  semester int,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

-- auto profile + student role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, student_id, department, year, semester)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.email,''),
    new.raw_user_meta_data->>'student_id',
    new.raw_user_meta_data->>'department',
    nullif(new.raw_user_meta_data->>'year','')::int,
    nullif(new.raw_user_meta_data->>'semester','')::int
  ) on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'student') on conflict do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- SHARED CONTENT TABLES
create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'General',
  important boolean not null default false,
  attachment_url text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.study_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  department text not null,
  year int not null default 1,
  semester int not null default 1,
  file_type text not null default 'pdf',
  url text,
  description text,
  downloads int not null default 0,
  created_at timestamptz not null default now()
);

create table public.exam_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  resource_type text not null default 'question_paper',
  subject text not null,
  department text not null,
  year int not null default 1,
  semester int not null default 1,
  mark_type text,
  unit text,
  body text,
  url text,
  created_at timestamptz not null default now()
);

create table public.class_timetable (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  year int not null default 1,
  semester int not null default 1,
  day_of_week text not null,
  start_time text not null,
  end_time text not null,
  subject text not null,
  faculty text,
  room text,
  created_at timestamptz not null default now()
);

create table public.exam_timetable (
  id uuid primary key default gen_random_uuid(),
  department text not null,
  year int not null default 1,
  semester int not null default 1,
  exam_date date not null,
  exam_time text not null default '10:00 AM',
  subject text not null,
  exam_type text not null default 'Semester',
  venue text,
  created_at timestamptz not null default now()
);

create table public.important_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  description text,
  category text not null default 'University',
  created_at timestamptz not null default now()
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  semester int not null,
  subject text not null,
  subject_code text not null default '',
  marks int not null default 0,
  grade text not null default '',
  status text not null default 'Pass',
  gpa numeric(3,2),
  cgpa numeric(3,2),
  created_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  present int not null default 0,
  total int not null default 0,
  semester int not null default 1,
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  category text not null default 'General',
  created_at timestamptz not null default now()
);

create table public.notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  unique (notification_id, user_id)
);

-- grants + rls for shared tables
do $$
declare t text;
begin
  foreach t in array array['notices','study_materials','exam_resources','class_timetable','exam_timetable','important_links','notifications']
  loop
    execute format('grant select on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.has_role(auth.uid(),''admin'')) with check (public.has_role(auth.uid(),''admin''))', t);
  end loop;
end $$;

grant select, insert, update, delete on public.results to authenticated;
grant all on public.results to service_role;
alter table public.results enable row level security;
create policy "own results" on public.results for select to authenticated using (auth.uid() = student_id or public.has_role(auth.uid(),'admin'));
create policy "admin manage results" on public.results for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

grant select, insert, update, delete on public.attendance to authenticated;
grant all on public.attendance to service_role;
alter table public.attendance enable row level security;
create policy "own attendance" on public.attendance for select to authenticated using (auth.uid() = student_id or public.has_role(auth.uid(),'admin'));
create policy "admin manage attendance" on public.attendance for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

grant select, insert, delete on public.notification_reads to authenticated;
grant all on public.notification_reads to service_role;
alter table public.notification_reads enable row level security;
create policy "own reads" on public.notification_reads for select to authenticated using (auth.uid() = user_id);
create policy "own reads insert" on public.notification_reads for insert to authenticated with check (auth.uid() = user_id);
create policy "own reads delete" on public.notification_reads for delete to authenticated using (auth.uid() = user_id);

-- SEED
insert into public.notices (title, description, category, important, published_at) values
('End Semester Examination Schedule Released','The end semester examination schedule for all departments has been published. Students are advised to check their exam timetable and hall ticket details.','Examination',true, now() - interval '1 day'),
('Library Timings Extended During Exams','The central library will remain open from 8:00 AM to 11:00 PM during the examination period.','Library',false, now() - interval '3 day'),
('Annual Tech Fest Registrations Open','Registrations for the annual technical festival are now open. Students can register through the student portal.','Events',false, now() - interval '5 day'),
('Fee Payment Deadline Reminder','The last date for semester fee payment is approaching. Late payments will attract a fine.','Administration',true, now() - interval '7 day');

insert into public.study_materials (title, subject, department, year, semester, file_type, description) values
('Data Structures Complete Notes','Data Structures','CSE',2,3,'pdf','Unit-wise complete notes covering arrays, linked lists, trees and graphs.'),
('Operating Systems Unit 1-3','Operating Systems','CSE',2,4,'pdf','Process management, scheduling and memory management.'),
('Digital Electronics Handbook','Digital Electronics','ECE',2,3,'pdf','Logic gates, combinational and sequential circuits.'),
('Engineering Mathematics III','Mathematics','CSE',2,3,'pdf','Complex analysis, transforms and numerical methods.'),
('Database Management Systems Slides','DBMS','CSE',3,5,'ppt','Lecture slides covering normalization and transactions.');

insert into public.exam_resources (title, resource_type, subject, department, year, semester, mark_type, unit, body) values
('Data Structures - Previous Paper 2024','question_paper','Data Structures','CSE',2,3,null,null,null),
('Operating Systems - Previous Paper 2024','question_paper','Operating Systems','CSE',2,4,null,null,null),
('DBMS - Model Paper','model_paper','DBMS','CSE',3,5,null,null,null),
('Define time complexity with an example','important_questions','Data Structures','CSE',2,3,'2','Unit 1','Expected answer: definition of asymptotic notation with a short example.'),
('Explain the working of a hash table with collision handling','important_questions','Data Structures','CSE',2,3,'5','Unit 3','Cover chaining and open addressing.'),
('Explain process scheduling algorithms with examples and comparison','important_questions','Operating Systems','CSE',2,4,'10','Unit 2','FCFS, SJF, Round Robin, Priority with Gantt charts.'),
('Quick Revision: Trees and Graphs','revision','Data Structures','CSE',2,3,null,'Unit 3','Key traversals, complexities and formulas.'),
('Key Formulas - Engineering Mathematics III','revision','Mathematics','CSE',2,3,null,'All Units','Laplace transforms, Fourier series and numerical methods formulas.');

insert into public.class_timetable (department, year, semester, day_of_week, start_time, end_time, subject, faculty, room) values
('CSE',2,3,'Monday','09:00','10:00','Data Structures','Dr. R. Sharma','B-204'),
('CSE',2,3,'Monday','10:00','11:00','Mathematics III','Dr. K. Rao','B-204'),
('CSE',2,3,'Tuesday','09:00','10:00','Digital Electronics','Prof. S. Nair','B-108'),
('CSE',2,3,'Wednesday','11:00','12:00','Data Structures Lab','Dr. R. Sharma','Lab-2'),
('CSE',2,3,'Thursday','09:00','10:00','Operating Systems','Dr. M. Iyer','B-204'),
('CSE',2,3,'Friday','10:00','11:00','Technical Communication','Ms. A. Das','B-110');

insert into public.exam_timetable (department, year, semester, exam_date, exam_time, subject, exam_type, venue) values
('CSE',2,3, current_date + 5, '10:00 AM','Data Structures','Semester','Hall A'),
('CSE',2,3, current_date + 8, '10:00 AM','Mathematics III','Semester','Hall A'),
('CSE',2,3, current_date + 12, '02:00 PM','Digital Electronics','Semester','Hall B'),
('CSE',2,3, current_date + 16, '10:00 AM','Operating Systems','Semester','Hall A');

insert into public.important_links (title, url, description, category) values
('Official University Website','https://www.andhrauniversity.edu.in','Main university portal','University'),
('Student Portal','https://www.andhrauniversity.edu.in','Access your student account','Student Services'),
('Examination Portal','https://www.andhrauniversity.edu.in','Exam forms and hall tickets','Examination'),
('Results Portal','https://www.andhrauniversity.edu.in','Check published results','Examination'),
('Digital Library','https://www.andhrauniversity.edu.in','E-books and journals','Library');

insert into public.notifications (title, body, category) values
('New exam timetable published','End semester exam timetable is now available in the Timetable section.','Exams'),
('New study material added','Data Structures complete notes have been uploaded.','Materials'),
('Important notice','Fee payment deadline is approaching.','Notices');
