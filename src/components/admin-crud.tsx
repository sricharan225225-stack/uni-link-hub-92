import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CardSkeletonList, EmptyState, ErrorState } from "@/components/states";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "switch" | "select";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | boolean;
};

type Row = Record<string, any>;

export function AdminCrud({
  table,
  title,
  description,
  fields,
  orderBy,
  ascending = false,
  primaryField,
  secondaryFields = [],
}: {
  table: string;
  title: string;
  description?: string;
  fields: Field[];
  orderBy: string;
  ascending?: boolean;
  primaryField: string;
  secondaryFields?: string[];
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Row>({});
  const [toDelete, setToDelete] = useState<Row | null>(null);

  const key = ["admin", table];
  const { data, isLoading, error } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data: rows, error: err } = await supabase
        .from(table as never)
        .select("*")
        .order(orderBy, { ascending });
      if (err) throw err;
      return (rows ?? []) as Row[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries();
  };

  const blank = () => {
    const base: Row = {};
    fields.forEach((f) => {
      base[f.name] = f.defaultValue ?? (f.type === "switch" ? false : "");
    });
    return base;
  };

  const startCreate = () => {
    setEditing(null);
    setForm(blank());
    setOpen(true);
  };

  const startEdit = (row: Row) => {
    setEditing(row);
    const base: Row = {};
    fields.forEach((f) => {
      base[f.name] = row[f.name] ?? (f.type === "switch" ? false : "");
    });
    setForm(base);
    setOpen(true);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload: Row = {};
      for (const f of fields) {
        const raw = form[f.name];
        if (f.required && (raw === "" || raw === null || raw === undefined))
          throw new Error(`${f.label} is required`);
        if (f.type === "number") payload[f.name] = raw === "" ? null : Number(raw);
        else if (f.type === "switch") payload[f.name] = !!raw;
        else payload[f.name] = raw === "" ? null : String(raw).slice(0, 4000);
      }
      if (editing) {
        const { error: err } = await supabase
          .from(table as never)
          .update(payload as never)
          .eq("id", editing.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from(table as never).insert(payload as never);
        if (err) throw err;
      }
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      toast.success(editing ? "Changes saved" : "Created successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (row: Row) => {
      const { error: err } = await supabase.from(table as never).delete().eq("id", row.id);
      if (err) throw err;
    },
    onSuccess: () => {
      invalidate();
      setToDelete(null);
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <Button className="rounded-xl" onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add new
        </Button>
      </div>

      {isLoading ? (
        <CardSkeletonList count={3} />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState title="Nothing here yet" description="Use “Add new” to create the first entry." />
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((row) => (
            <li key={row.id} className="surface flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{String(row[primaryField] ?? "—")}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {secondaryFields
                    .map((f) => row[f])
                    .filter((v) => v !== null && v !== undefined && v !== "")
                    .join(" · ")}
                </p>
              </div>
              <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => startEdit(row)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete"
                onClick={() => setToDelete(row)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            {fields.map((f) => (
              <div key={f.name}>
                <Label htmlFor={f.name}>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={f.name}
                    value={form[f.name] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="mt-1.5 rounded-xl"
                    rows={4}
                  />
                ) : f.type === "switch" ? (
                  <div className="mt-2">
                    <Switch
                      id={f.name}
                      checked={!!form[f.name]}
                      onCheckedChange={(v) => setForm({ ...form, [f.name]: v })}
                    />
                  </div>
                ) : f.type === "select" ? (
                  <Select
                    value={form[f.name] ? String(form[f.name]) : ""}
                    onValueChange={(v) => setForm({ ...form, [f.name]: v })}
                  >
                    <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                      <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(f.options ?? []).map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={f.name}
                    type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                    value={form[f.name] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="mt-1.5 h-11 rounded-xl"
                  />
                )}
              </div>
            ))}
            <DialogFooter>
              <Button type="submit" className="rounded-xl" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes “{String(toDelete?.[primaryField] ?? "")}”. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => toDelete && remove.mutate(toDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
