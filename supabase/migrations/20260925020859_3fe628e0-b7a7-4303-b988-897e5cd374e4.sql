
create type public.app_role as enum ('admin','student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  student_id text,
  department text,
  year integer,
  semester integer,
  avatar_url text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own or admin profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "own or admin profile update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin profile delete" on public.profiles for delete to authenticated
  using (public.has_role(auth.uid(),'admin'));

create policy "own or admin roles read" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

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
  insert into public.user_roles (user_id, role) values (new.id,'student') on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

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
  department text not null default 'CSE',
  year integer not null default 1,
  semester integer not null default 1,
  file_type text not null default 'PDF',
  url text,
  description text,
  downloads integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.exam_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  resource_type text not null default 'question_paper',
  subject text not null,
  department text not null default 'CSE',
  year integer not null default 1,
  semester integer not null default 1,
  mark_type text,
  unit text,
  body text,
  url text,
  created_at timestamptz not null default now()
);

create table public.class_timetable (
  id uuid primary key default gen_random_uuid(),
  department text not null default 'CSE',
  year integer not null default 1,
  semester integer not null default 1,
  day_of_week text not null default 'Monday',
  start_time text not null default '09:00 AM',
  end_time text not null default '10:00 AM',
  subject text not null,
  faculty text,
  room text,
  created_at timestamptz not null default now()
);

create table public.exam_timetable (
  id uuid primary key default gen_random_uuid(),
  department text not null default 'CSE',
  year integer not null default 1,
  semester integer not null default 1,
  exam_date date not null default current_date,
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

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  category text not null default 'General',
  created_at timestamptz not null default now()
);

create table public.results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  semester integer not null default 1,
  subject text not null,
  subject_code text not null default '',
  marks integer not null default 0,
  grade text not null default '',
  status text not null default 'Pass',
  gpa numeric,
  cgpa numeric,
  created_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  present integer not null default 0,
  total integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (notification_id, user_id)
);

do $$
declare t text;
begin
  foreach t in array array['notices','study_materials','exam_resources','class_timetable','exam_timetable','important_links','notifications']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant select on public.%I to anon', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('create policy "admin insert" on public.%I for insert to authenticated with check (public.has_role(auth.uid(),''admin''))', t);
    execute format('create policy "admin update" on public.%I for update to authenticated using (public.has_role(auth.uid(),''admin''))', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using (public.has_role(auth.uid(),''admin''))', t);
  end loop;

  foreach t in array array['results','attendance']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own or admin read" on public.%I for select to authenticated using (student_id = auth.uid() or public.has_role(auth.uid(),''admin''))', t);
    execute format('create policy "admin insert" on public.%I for insert to authenticated with check (public.has_role(auth.uid(),''admin''))', t);
    execute format('create policy "admin update" on public.%I for update to authenticated using (public.has_role(auth.uid(),''admin''))', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using (public.has_role(auth.uid(),''admin''))', t);
  end loop;
end $$;

grant select, insert, delete on public.notification_reads to authenticated;
grant all on public.notification_reads to service_role;
alter table public.notification_reads enable row level security;
create policy "own reads select" on public.notification_reads for select to authenticated using (user_id = auth.uid());
create policy "own reads insert" on public.notification_reads for insert to authenticated with check (user_id = auth.uid());
create policy "own reads delete" on public.notification_reads for delete to authenticated using (user_id = auth.uid());

insert into public.notices (title, description, category, important) values
 ('End Semester Exam Schedule Released','The end semester examination timetable for all departments is now available. Check the Timetable section for details.','Examination', true),
 ('Library Timings Extended','The central library will remain open until 10 PM during the examination period.','Campus', false),
 ('Annual Tech Fest Registrations Open','Register for AU TechFest 2026 before the deadline. Multiple events across departments.','Events', false),
 ('Semester Fee Payment Deadline','Last date for semester fee payment is approaching. Pay via the student portal.','Administration', true);

insert into public.study_materials (title, subject, department, year, semester, file_type, url, description, downloads) values
 ('Operating Systems — Complete Notes','Operating Systems','CSE',2,3,'PDF','https://example.com/os-notes.pdf','Unit-wise notes covering processes, scheduling, memory and file systems.',248),
 ('DBMS Lecture Slides','Database Systems','CSE',2,3,'Slides','https://example.com/dbms-slides.pdf','Lecture slides for the full semester.',176),
 ('Data Structures Workbook','Data Structures','CSE',2,3,'PDF','https://example.com/ds-workbook.pdf','Practice problems with solutions.',132),
 ('Digital Electronics Notes','Digital Electronics','ECE',2,3,'PDF','https://example.com/de-notes.pdf','Comprehensive unit notes.',94);

insert into public.exam_resources (title, resource_type, subject, department, year, semester, mark_type, unit, body, url) values
 ('Operating Systems — 2025 Question Paper','question_paper','Operating Systems','CSE',2,3,null,null,null,'https://example.com/os-2025.pdf'),
 ('DBMS — 2025 Question Paper','question_paper','Database Systems','CSE',2,3,null,null,null,'https://example.com/dbms-2025.pdf'),
 ('Operating Systems — Model Paper','model_paper','Operating Systems','CSE',2,3,null,null,null,'https://example.com/os-model.pdf'),
 ('Define deadlock and its conditions','important_questions','Operating Systems','CSE',2,3,'2','Unit 3','Explain the four necessary conditions for deadlock.',null),
 ('Explain paging with an example','important_questions','Operating Systems','CSE',2,3,'5','Unit 4','Describe paging, page tables and address translation.',null),
 ('Compare normalization forms 1NF to BCNF','important_questions','Database Systems','CSE',2,3,'10','Unit 2','Discuss each normal form with examples.',null),
 ('Quick Revision — CPU Scheduling','revision','Operating Systems','CSE',2,3,null,'Unit 2','FCFS, SJF, Round Robin and priority scheduling summary with formulas.',null);

insert into public.class_timetable (department, year, semester, day_of_week, start_time, end_time, subject, faculty, room) values
 ('CSE',2,3,'Monday','09:00 AM','10:00 AM','Operating Systems','Dr. R. Menon','B-204'),
 ('CSE',2,3,'Monday','10:15 AM','11:15 AM','Database Systems','Prof. S. Iyer','B-204'),
 ('CSE',2,3,'Tuesday','09:00 AM','10:00 AM','Data Structures','Dr. K. Rao','B-201'),
 ('CSE',2,3,'Wednesday','11:30 AM','12:30 PM','Computer Networks','Prof. A. Nair','B-205');

insert into public.exam_timetable (department, year, semester, exam_date, exam_time, subject, exam_type, venue) values
 ('CSE',2,3, current_date + 7,'10:00 AM','Operating Systems','Semester','Hall A'),
 ('CSE',2,3, current_date + 10,'10:00 AM','Database Systems','Semester','Hall A'),
 ('CSE',2,3, current_date + 14,'02:00 PM','Data Structures','Semester','Hall B');

insert into public.important_links (title, url, description, category) values
 ('University Website','https://www.example.edu','Official university homepage','University'),
 ('Student Portal','https://portal.example.edu','Attendance, fees and personal records','Portals'),
 ('Examination Portal','https://exams.example.edu','Hall tickets and exam registration','Portals'),
 ('Results Portal','https://results.example.edu','Semester results','Portals'),
 ('Digital Library','https://library.example.edu','E-books and journals','Academics');

insert into public.notifications (title, body, category) values
 ('New question papers uploaded','Previous year papers for Semester 3 are now available in the Exam Preparation Hub.','Exam Prep'),
 ('Exam timetable published','The end semester exam timetable is live. Check the Timetable section.','Examination'),
 ('New study materials added','Operating Systems and DBMS notes have been added to Study Materials.','Materials');
