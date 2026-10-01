import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const DEPTS = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT"];
const CATEGORIES = ["Notes", "Slides", "Question Paper", "Assignment", "Lab Manual", "Reference"];
const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] as string;
const ANON = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;

function fileTypeOf(f: File) {
  const n = f.name.toLowerCase();
  if (n.endsWith(".pdf")) return "pdf";
  if (/\.(docx?|txt|rtf)$/.test(n)) return "doc";
  if (/\.(pptx?)$/.test(n)) return "ppt";
  if (f.type.startsWith("image/")) return "image";
  return "file";
}

const selectCls =
  "mt-1.5 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function UploadMaterialButton() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [f, setF] = useState({
    title: "", subject: "", description: "", department: "CSE", year: "1", semester: "1", category: "Notes",
  });

  const reset = () => {
    setFile(null);
    setProgress(null);
    setF({ title: "", subject: "", description: "", department: "CSE", year: "1", semester: "1", category: "Notes" });
  };

  const uploadWithProgress = (path: string, token: string, body: File) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/study-materials/${path}`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("apikey", ANON);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.setRequestHeader("Content-Type", body.type || "application/octet-stream");
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else {
          let msg = `Upload failed (${xhr.status})`;
          try { msg = JSON.parse(xhr.responseText).message ?? msg; } catch { /* ignore */ }
          reject(new Error(msg));
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(body);
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim() || !f.subject.trim()) return toast.error("Title and subject are required");
    if (!file) return toast.error("Please select a file");
    if (file.size > 50 * 1024 * 1024) return toast.error("File must be under 50 MB");
    try {
      setProgress(0);
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Please sign in again");
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${f.department}/Y${f.year}S${f.semester}/${Date.now()}-${safe}`;
      await uploadWithProgress(path, token, file);
      const { error } = await supabase.from("study_materials").insert({
        title: f.title.trim().slice(0, 200),
        subject: f.subject.trim().slice(0, 120),
        description: f.description.trim().slice(0, 2000) || null,
        department: f.department,
        year: Number(f.year),
        semester: Number(f.semester),
        category: f.category,
        file_type: fileTypeOf(file),
        file_path: path,
      } as never);
      if (error) {
        await supabase.storage.from("study-materials").remove([path]);
        throw error;
      }
      toast.success("Material uploaded");
      qc.invalidateQueries({ queryKey: ["admin", "study_materials"] });
      qc.invalidateQueries({ queryKey: ["materials"] });
      setOpen(false);
      reset();
    } catch (err) {
      setProgress(null);
      toast.error((err as Error).message);
    }
  };

  const busy = progress !== null;

  return (
    <>
      <Button size="lg" className="w-full rounded-xl sm:w-auto" onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Upload Material
      </Button>
      <Dialog open={open} onOpenChange={(o) => !busy && (setOpen(o), o || reset())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Material</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <div>
              <Label htmlFor="um-title">Material title</Label>
              <Input id="um-title" className="mt-1.5 h-11 rounded-xl" value={f.title} maxLength={200}
                onChange={(e) => setF({ ...f, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="um-subject">Subject</Label>
              <Input id="um-subject" className="mt-1.5 h-11 rounded-xl" value={f.subject} maxLength={120}
                onChange={(e) => setF({ ...f, subject: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="um-desc">Description</Label>
              <Textarea id="um-desc" rows={3} className="mt-1.5 rounded-xl" value={f.description} maxLength={2000}
                onChange={(e) => setF({ ...f, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="um-dept">Department</Label>
                <select id="um-dept" className={selectCls} value={f.department}
                  onChange={(e) => setF({ ...f, department: e.target.value })}>
                  {DEPTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="um-cat">Category</Label>
                <select id="um-cat" className={selectCls} value={f.category}
                  onChange={(e) => setF({ ...f, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="um-year">Year</Label>
                <select id="um-year" className={selectCls} value={f.year}
                  onChange={(e) => setF({ ...f, year: e.target.value })}>
                  {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="um-sem">Semester</Label>
                <select id="um-sem" className={selectCls} value={f.semester}
                  onChange={(e) => setF({ ...f, semester: e.target.value })}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="um-file">Select PDF / file</Label>
              <Input id="um-file" type="file" className="mt-1.5 rounded-xl"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {file ? <p className="mt-1 text-xs text-muted-foreground">{file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p> : null}
            </div>
            {busy ? (
              <div className="space-y-1">
                <Progress value={progress ?? 0} />
                <p className="text-xs text-muted-foreground">Uploading… {progress}%</p>
              </div>
            ) : null}
            <DialogFooter>
              <Button type="submit" size="lg" className="w-full rounded-xl sm:w-auto" disabled={busy}>
                <Upload className="mr-2 h-4 w-4" />
                {busy ? "Uploading…" : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export async function openMaterialFile(filePath: string) {
  const { data, error } = await supabase.storage.from("study-materials").createSignedUrl(filePath, 600);
  if (error || !data) { toast.error(error?.message ?? "Could not open file"); return; }
  window.open(data.signedUrl, "_blank", "noopener");
}
