import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type Notice = {
  id: string;
  title: string;
  description: string;
  category: string;
  important: boolean;
  attachment_url: string | null;
  published_at: string;
};

export type Material = {
  id: string;
  title: string;
  subject: string;
  department: string;
  year: number;
  semester: number;
  file_type: string;
  url: string | null;
  file_path?: string | null;
  category?: string;
  description: string | null;
  downloads: number;
  created_at: string;
};

export type ExamResource = {
  id: string;
  title: string;
  resource_type: string;
  subject: string;
  department: string;
  year: number;
  semester: number;
  mark_type: string | null;
  unit: string | null;
  body: string | null;
  url: string | null;
  created_at: string;
};

export function useNotices() {
  return useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Notice[];
    },
  });
}

export function useMaterials() {
  return useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_materials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Material[];
    },
  });
}

export function useExamResources() {
  return useQuery({
    queryKey: ["exam-resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_resources")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExamResource[];
    },
  });
}

export function useClassTimetable() {
  return useQuery({
    queryKey: ["class-timetable"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("class_timetable")
        .select("*")
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useExamTimetable() {
  return useQuery({
    queryKey: ["exam-timetable"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_timetable")
        .select("*")
        .order("exam_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useImportantLinks() {
  return useQuery({
    queryKey: ["important-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("important_links")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useResults() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["results", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("results")
        .select("*")
        .eq("student_id", user!.id)
        .order("semester", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAttendance() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["attendance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", user!.id)
        .order("subject", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const [{ data: items, error }, { data: reads }] = await Promise.all([
        supabase.from("notifications").select("*").order("created_at", { ascending: false }),
        user
          ? supabase.from("notification_reads").select("notification_id").eq("user_id", user.id)
          : Promise.resolve({ data: [] as { notification_id: string }[] }),
      ]);
      if (error) throw error;
      const readIds = new Set((reads ?? []).map((r) => r.notification_id));
      return (items ?? []).map((n) => ({ ...n, read: readIds.has(n.id) }));
    },
  });
}
