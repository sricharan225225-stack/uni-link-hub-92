import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Link2,
  Megaphone,
  Percent,
  ArrowRight,
  Menu,
} from "lucide-react";
import { useState } from "react";

import heroImage from "@/assets/hero-students.jpg";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AU Hub — Everything You Need. One Student Hub." },
      {
        name: "description",
        content:
          "AU Hub brings university notices, study materials, exam preparation, timetables, results and attendance into one premium student platform.",
      },
      { property: "og:title", content: "AU Hub — Everything You Need. One Student Hub." },
      {
        property: "og:description",
        content:
          "Notices, study materials, exam preparation, timetables, results and attendance in one place.",
      },
    ],
  }),
  component: Landing,
});

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Exam Preparation", href: "#exam-prep" },
  { label: "Study Materials", href: "#materials" },
  { label: "About", href: "#about" },
];

const FEATURES = [
  { icon: Megaphone, title: "College Notices", text: "Official announcements, circulars and deadlines, sorted and searchable." },
  { icon: BookOpen, title: "Study Materials", text: "Notes, slides and references organised by department, year and subject." },
  { icon: GraduationCap, title: "Exam Preparation", text: "Previous papers, important questions, revision notes and model papers." },
  { icon: CalendarDays, title: "Timetable", text: "Class schedules and exam dates with upcoming exams highlighted." },
  { icon: ClipboardList, title: "Results", text: "Semester-wise marks, grades, GPA and CGPA in clean result cards." },
  { icon: Percent, title: "Attendance", text: "Overall and subject-wise attendance from authorised records." },
  { icon: Link2, title: "Important Links", text: "University, exam, library and student service portals in one list." },
  { icon: Bell, title: "Notifications", text: "Know the moment something new is published for your semester." },
];

function Landing() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background" id="home">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            <Link to="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/auth">
              <Button>Sign Up</Button>
            </Link>
          </div>
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => setOpen((o) => !o)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        {open ? (
          <div className="border-t border-border px-4 py-3 sm:hidden">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 text-sm font-medium text-muted-foreground">
                  {l.label}
                </a>
              ))}
              <Link to="/auth" className="mt-2">
                <Button className="w-full">Login / Sign Up</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div className="fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            Your University. Your Resources. Your Hub.
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
            Everything You Need. One Student Hub.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Access notices, study materials, exam preparation resources, timetables, results, attendance,
            and important university updates in one place.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/auth" className="sm:w-auto">
              <Button size="lg" className="h-12 w-full px-7 sm:w-auto">
                Get Started <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth" className="sm:w-auto">
              <Button size="lg" variant="outline" className="h-12 w-full px-7 sm:w-auto">
                Login
              </Button>
            </Link>
          </div>
        </div>
        <div className="fade-up overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-lift)]">
          <img
            src={heroImage}
            alt="University students studying together on campus"
            width={1280}
            height={960}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold sm:text-3xl">Built for everyday student life</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Every academic resource your semester needs, organised and always up to date.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="surface p-5 transition-transform duration-200 hover:-translate-y-1">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="exam-prep" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="hero-panel rounded-3xl p-8 sm:p-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">Exam Preparation Hub</h2>
          <p className="mt-3 max-w-2xl text-sm opacity-85">
            Previous question papers, 2-mark, 5-mark and 10-mark important questions, unit-wise revision
            notes, key formulas and model papers — organised by department, year, semester and subject.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Previous Papers", "Important Questions", "Revision Notes", "Model Papers"].map((t) => (
              <div key={t} className="rounded-2xl bg-white/10 p-4 text-sm font-semibold">
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="materials" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { title: "Organised library", text: "Department → Year → Semester → Subject → Material, so nothing gets lost." },
            { title: "Every format", text: "PDFs, documents, images and external links, all opened in one tap." },
            { title: "Always current", text: "Recent uploads and recommended materials surface at the top." },
          ].map((c) => (
            <div key={c.title} className="surface p-6">
              <h3 className="text-base font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="surface p-8 text-center sm:p-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">Stay Updated. Study Smarter. Stay Ahead.</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            AU Hub is built for the university community — students get one trusted place for academics,
            while administrators publish and manage everything securely.
          </p>
          <Link to="/auth">
            <Button size="lg" className="mt-7 h-12 px-8">
              Join AU Hub
            </Button>
          </Link>
        </div>

        <div className="surface fade-up mx-auto mt-6 max-w-xl rounded-3xl p-8 text-center shadow-[var(--shadow-lift)] sm:p-10">
          <img
            src="/founder.jpg"
            alt="Charan Naidu - Founder of AU Hub"
            loading="lazy"
            width={768}
            height={768}
            className="mx-auto h-28 w-28 rounded-full border border-border object-cover shadow-[var(--shadow-soft)]"
          />
          <h3 className="mt-5 text-xl font-semibold">Charan Naidu</h3>
          <p className="mt-1 text-sm font-medium uppercase tracking-wide text-primary">Founder &amp; Developer</p>
          <p className="mt-1 text-xs text-muted-foreground">AU Hub – Student App</p>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            “AU Hub is designed to bring important student resources into one convenient platform, including
            college notices, study materials, timetables, exam dates, results, attendance, and important AU links.”
          </p>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo />
          <p>Your University. Your Resources. Your Hub.</p>
        </div>
      </footer>
    </div>
  );
}
