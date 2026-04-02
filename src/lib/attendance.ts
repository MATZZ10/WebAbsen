export type AttendanceStatus = "present" | "late" | "sick" | "alpa";

export function getAttendanceLabel(status: AttendanceStatus) {
  switch (status) {
    case "present": return "Hadir";
    case "late": return "Terlambat";
    case "sick": return "Sakit";
    case "alpa": return "Alpa";
  }
}

export function getAttendanceTone(status: AttendanceStatus) {
  switch (status) {
    case "present": return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
    case "late": return "bg-amber-500/15 text-amber-300 border-amber-500/20";
    case "sick": return "bg-sky-500/15 text-sky-300 border-sky-500/20";
    case "alpa": return "bg-rose-500/15 text-rose-300 border-rose-500/20";
  }
}

export function toDateOnly(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

export function formatDateTime(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "medium" }).format(d);
}

export function getMonthRange(base = new Date()) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
  return { start, end };
}

export function getTodayRange(base = new Date()) {
  const start = new Date(base);
  start.setHours(0,0,0,0);
  const end = new Date(base);
  end.setHours(23,59,59,999);
  return { start, end };
}
