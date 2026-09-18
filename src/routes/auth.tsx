import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in or join — AU Hub" },
      { name: "description", content: "Log in to AU Hub or create your student account to access notices, materials, exam prep, results and attendance." },
      { property: "og:title", content: "Sign in or join — AU Hub" },
      { property: "og:description", content: "Access your university hub: notices, materials, exam preparation, results and attendance." },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z
  .object({
    full_name: z.string().trim().min(2, "Please enter your full name").max(100),
    email: z.string().trim().email("Enter a valid email address").max(255),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirm: z.string(),
    student_id: z.string().trim().min(2, "Student ID is required").max(50),
    department: z.string().trim().min(1, "Department is required"),
    year: z.string().min(1, "Year is required"),
    semester: z.string().min(1, "Semester is required"),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

const DEPARTMENTS = ["CSE", "ECE", "EEE", "Mechanical", "Civil", "IT", "Chemical", "Commerce", "Science", "Arts"];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-destructive">{message}</p>;
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-10">
        <Link to="/" className="mx-auto">
          <Logo className="mb-6" />
        </Link>
        <div className="surface p-5 sm:p-7">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="grid w-full grid-cols-2 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg">
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg">
                Sign Up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your University. Your Resources. Your Hub.
        </p>
      </div>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [resetMode, setResetMode] = useState(false);

  const handleReset = async () => {
    if (!z.string().email().safeParse(email.trim()).success) {
      setError("Enter your registered email address first");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) {
      toast.error(err.message);
      return;
    }
    toast.success("Password reset link sent. Check your inbox.");
    setResetMode(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!z.string().email().safeParse(email.trim()).success) {
      setError("Enter a valid email address");
      return;
    }
    if (!password) {
      setError("Enter your password");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      setError(err.message === "Invalid login credentials" ? "Incorrect email or password" : err.message);
      return;
    }
    toast.success("Welcome back to AU Hub");
    navigate({ to: "/dashboard", replace: true });
  };

  if (resetMode) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Forgot password</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your registered email and we'll send you a reset link.
          </p>
        </div>
        <div>
          <Label htmlFor="reset-email">Email ID</Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            className="mt-1.5 h-11"
          />
          <FieldError message={error} />
        </div>
        <Button onClick={handleReset} disabled={loading} className="h-11 w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => setResetMode(false)}>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email ID</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@university.edu"
          className="mt-1.5 h-11"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative mt-1.5">
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <FieldError message={error} />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
          Remember me
        </label>
        <button type="button" onClick={() => setResetMode(true)} className="text-sm font-medium text-primary">
          Forgot password?
        </button>
      </div>
      <Button type="submit" disabled={loading} className="h-11 w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm: "",
    student_id: "",
    department: "",
    year: "",
    semester: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: values.email.trim(),
      password: values.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: values.full_name.trim(),
          student_id: values.student_id.trim(),
          department: values.department,
          year: values.year,
          semester: values.semester,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Welcome to AU Hub!");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Full Name</Label>
        <Input id="full_name" value={values.full_name} onChange={set("full_name")} className="mt-1.5 h-11" />
        <FieldError message={errors['full_name']} />
      </div>
      <div>
        <Label htmlFor="signup-email">Email ID</Label>
        <Input id="signup-email" type="email" value={values.email} onChange={set("email")} className="mt-1.5 h-11" />
        <FieldError message={errors['email']} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative mt-1.5">
            <Input
              id="signup-password"
              type={show ? "text" : "password"}
              value={values.password}
              onChange={set("password")}
              className="h-11 pr-11"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <FieldError message={errors['password']} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm Password</Label>
          <Input
            id="confirm"
            type={show ? "text" : "password"}
            value={values.confirm}
            onChange={set("confirm")}
            className="mt-1.5 h-11"
          />
          <FieldError message={errors['confirm']} />
        </div>
      </div>
      <div>
        <Label htmlFor="student_id">Student ID / Roll Number</Label>
        <Input id="student_id" value={values.student_id} onChange={set("student_id")} className="mt-1.5 h-11" />
        <FieldError message={errors['student_id']} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="department">Department</Label>
          <select
            id="department"
            value={values.department}
            onChange={set("department")}
            className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <FieldError message={errors['department']} />
        </div>
        <div>
          <Label htmlFor="year">Year</Label>
          <select
            id="year"
            value={values.year}
            onChange={set("year")}
            className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select</option>
            {[1, 2, 3, 4].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
          <FieldError message={errors['year']} />
        </div>
        <div>
          <Label htmlFor="semester">Semester</Label>
          <select
            id="semester"
            value={values.semester}
            onChange={set("semester")}
            className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
          <FieldError message={errors['semester']} />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="h-11 w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create my account"}
      </Button>
    </form>
  );
}
