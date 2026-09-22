import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Shield, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminCrud, type Field } from "@/components/admin-crud";
import { PageHeader } from "@/components/page-header";
import { CardSkeletonList, EmptyState, ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — AU Hub" },
      { name: "description", content: "Manage notices, materials, exam resources, timetables, results and students." },
      { property: "og:title", content: "Admin — AU Hub" },
      { property: "og:description", content: "Manage notices, materials, exam resources, timetables, results and students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const DEPARTMENTS = [
  "Computer Science and Engineering",
  "Electronics and Communication Engineering",
  "Electrical and Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Information Technology",
];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const deptField: Field = {
  name: "department",
  label: "Department",
  type: "select",
  options: DEPARTMENTS,
  required: true,
  defaultValue: DEPARTMENTS[0],
};
const yearField: Field = { name: "year", label: "Year", type: "number", defaultValue: 1, required: true };
const semField: Field = { name: "semester", label: "Semester", type: "number", defaultValue: 1, required: true };

function StudentsTab() {
  const [q, setQ] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const { data: rows, error: err } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw err;
      return rows ?? [];
    },
  });

  const rows = useMemo(() => {
    const list = (data ?? []) as Array<Record<string, any>>;
    if (!q.trim()) return list;
    const t = q.toLowerCase();
    return list.filter((p) =>
      `${p.full_name} ${p.email} ${p.student_id ?? ""} ${p.department ?? ""}`
        .toLowerCase()
        .includes(t),
    );
  }, [data, q]);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Students</h2>
        <p className="text-sm text-muted-foreground">
          Search registered students and copy their account ID to attach results or attendance.
        </p>
      </div>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, email, roll number…"
        className="mb-4 h-11 rounded-xl"
        aria-label="Search students"
      />
      {isLoading ? (
        <CardSkeletonList count={3} />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="No students found" />
      ) : (
        <ul className="space-y-3">
          {rows.map((p) => (
            <li key={p.id} className="surface flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.full_name || "Unnamed student"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[p.email, p.student_id, p.department, p.year && `Year ${p.year}`, p.semester && `Sem ${p.semester}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => {
                  navigator.clipboard.writeText(p.id);
                  toast.success("Account ID copied");
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy ID
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminPage() {
  const { data: isAdmin, isLoading } = useIsAdmin();

  if (isLoading) return <CardSkeletonList count={3} />;

  if (!isAdmin)
    return (
      <div>
        <PageHeader title="Admin" />
        <EmptyState
          icon={Shield}
          title="Administrator access required"
          description="This area is limited to college staff accounts."
        />
      </div>
    );

  return (
    <div>
      <PageHeader
        title="Admin dashboard"
        description="Manage everything students see — notices, materials, exam resources, timetables and records."
      />

      <Tabs defaultValue="notices">
        <TabsList className="mb-6 flex w-full flex-wrap justify-start rounded-xl">
          <TabsTrigger value="notices">Notices</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="exam">Exam prep</TabsTrigger>
          <TabsTrigger value="classes">Class timetable</TabsTrigger>
          <TabsTrigger value="exams">Exam timetable</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        <TabsContent value="notices">
          <AdminCrud
            table="notices"
            title="notice"
            description="Publish announcements and circulars."
            orderBy="published_at"
            primaryField="title"
            secondaryFields={["category", "published_at"]}
            fields={[
              { name: "title", label: "Title", required: true },
              { name: "description", label: "Description", type: "textarea", required: true },
              {
                name: "category",
                label: "Category",
                type: "select",
                options: ["General", "Examination", "Academic", "Events", "Fees", "Library"],
                defaultValue: "General",
                required: true,
              },
              { name: "important", label: "Mark as important", type: "switch" },
              { name: "attachment_url", label: "Attachment URL", placeholder: "https://…" },
            ]}
          />
        </TabsContent>

        <TabsContent value="materials">
          <AdminCrud
            table="study_materials"
            title="study material"
            description="Upload links to notes, slides and documents."
            orderBy="created_at"
            primaryField="title"
            secondaryFields={["subject", "department", "semester"]}
            fields={[
              { name: "title", label: "Title", required: true },
              { name: "subject", label: "Subject", required: true },
              deptField,
              yearField,
              semField,
              {
                name: "file_type",
                label: "File type",
                type: "select",
                options: ["pdf", "doc", "ppt", "image", "link"],
                defaultValue: "pdf",
                required: true,
              },
              { name: "url", label: "File / link URL", placeholder: "https://…" },
              { name: "description", label: "Description", type: "textarea" },
            ]}
          />
        </TabsContent>

        <TabsContent value="exam">
          <AdminCrud
            table="exam_resources"
            title="exam resource"
            description="Question papers, important questions, revision notes and model papers."
            orderBy="created_at"
            primaryField="title"
            secondaryFields={["subject", "resource_type", "mark_type", "unit"]}
            fields={[
              { name: "title", label: "Title", required: true },
              {
                name: "resource_type",
                label: "Resource type",
                type: "select",
                options: ["question_paper", "model_paper", "important_questions", "revision"],
                defaultValue: "question_paper",
                required: true,
              },
              { name: "subject", label: "Subject", required: true },
              deptField,
              yearField,
              semField,
              {
                name: "mark_type",
                label: "Mark weightage",
                type: "select",
                options: ["2 Mark", "5 Mark", "10 Mark"],
              },
              { name: "unit", label: "Unit", placeholder: "Unit 1" },
              { name: "body", label: "Content", type: "textarea" },
              { name: "url", label: "Resource URL", placeholder: "https://…" },
            ]}
          />
        </TabsContent>

        <TabsContent value="classes">
          <AdminCrud
            table="class_timetable"
            title="class"
            description="Weekly class schedule."
            orderBy="start_time"
            ascending
            primaryField="subject"
            secondaryFields={["day_of_week", "start_time", "end_time", "room"]}
            fields={[
              deptField,
              yearField,
              semField,
              {
                name: "day_of_week",
                label: "Day",
                type: "select",
                options: DAYS,
                defaultValue: "Monday",
                required: true,
              },
              { name: "start_time", label: "Start time", defaultValue: "09:00 AM", required: true },
              { name: "end_time", label: "End time", defaultValue: "10:00 AM", required: true },
              { name: "subject", label: "Subject", required: true },
              { name: "faculty", label: "Faculty" },
              { name: "room", label: "Room" },
            ]}
          />
        </TabsContent>

        <TabsContent value="exams">
          <AdminCrud
            table="exam_timetable"
            title="exam"
            description="Examination schedule."
            orderBy="exam_date"
            ascending
            primaryField="subject"
            secondaryFields={["exam_date", "exam_time", "exam_type", "venue"]}
            fields={[
              deptField,
              yearField,
              semField,
              { name: "exam_date", label: "Exam date", type: "date", required: true },
              { name: "exam_time", label: "Exam time", defaultValue: "10:00 AM", required: true },
              { name: "subject", label: "Subject", required: true },
              {
                name: "exam_type",
                label: "Exam type",
                type: "select",
                options: ["Semester", "Mid Term", "Internal", "Practical", "Supplementary"],
                defaultValue: "Semester",
                required: true,
              },
              { name: "venue", label: "Venue" },
            ]}
          />
        </TabsContent>

        <TabsContent value="results">
          <AdminCrud
            table="results"
            title="result"
            description="Attach results to a student using their account ID from the Students tab."
            orderBy="created_at"
            primaryField="subject"
            secondaryFields={["subject_code", "semester", "grade", "status"]}
            fields={[
              { name: "student_id", label: "Student account ID", required: true },
              semField,
              { name: "subject", label: "Subject", required: true },
              { name: "subject_code", label: "Subject code", required: true },
              { name: "marks", label: "Marks", type: "number", defaultValue: 0, required: true },
              { name: "grade", label: "Grade", required: true },
              {
                name: "status",
                label: "Status",
                type: "select",
                options: ["Pass", "Fail"],
                defaultValue: "Pass",
                required: true,
              },
              { name: "gpa", label: "GPA", type: "number" },
              { name: "cgpa", label: "CGPA", type: "number" },
            ]}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <AdminCrud
            table="attendance"
            title="attendance record"
            description="Update authorised attendance records only."
            orderBy="updated_at"
            primaryField="subject"
            secondaryFields={["present", "total", "semester"]}
            fields={[
              { name: "student_id", label: "Student account ID", required: true },
              { name: "subject", label: "Subject", required: true },
              { name: "present", label: "Classes present", type: "number", defaultValue: 0, required: true },
              { name: "total", label: "Total classes", type: "number", defaultValue: 0, required: true },
              semField,
            ]}
          />
        </TabsContent>

        <TabsContent value="links">
          <AdminCrud
            table="important_links"
            title="important link"
            orderBy="created_at"
            primaryField="title"
            secondaryFields={["category", "url"]}
            fields={[
              { name: "title", label: "Title", required: true },
              { name: "url", label: "URL", required: true, placeholder: "https://…" },
              { name: "description", label: "Description" },
              {
                name: "category",
                label: "Category",
                type: "select",
                options: ["University", "Examination", "Learning", "Library", "Student Services"],
                defaultValue: "University",
                required: true,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <AdminCrud
            table="notifications"
            title="notification"
            description="Send announcements to all students."
            orderBy="created_at"
            primaryField="title"
            secondaryFields={["category", "created_at"]}
            fields={[
              { name: "title", label: "Title", required: true },
              { name: "body", label: "Message", type: "textarea", required: true },
              {
                name: "category",
                label: "Category",
                type: "select",
                options: ["General", "Notices", "Materials", "Exams", "Results"],
                defaultValue: "General",
                required: true,
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="students">
          <StudentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
