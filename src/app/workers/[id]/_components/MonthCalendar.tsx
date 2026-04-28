import Link from "next/link";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function unitsLabel(units: number): string {
  if (units === 0) return "A";
  if (units === 0.5) return "½";
  if (units === 1) return "1";
  if (units === 1.5) return "OT";
  return String(units);
}

function unitsClass(units: number | undefined): string {
  if (units === undefined) return "bg-surface text-text-faint hover:bg-surface-alt";
  if (units === 0) return "bg-accent-red-bg text-accent-red hover:opacity-80";
  if (units === 0.5) return "bg-accent-amber-bg text-accent-amber hover:opacity-80";
  if (units === 1) return "bg-accent-green-bg text-accent-green hover:opacity-80";
  if (units === 1.5) return "bg-blue-100 text-primary hover:opacity-80";
  return "bg-surface-alt text-text-secondary";
}

export function MonthCalendar({
  workerId,
  year,
  month,
  entries,
}: {
  workerId: number;
  year: number;
  month: number; // 1-12
  entries: Map<string, number>;
}) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = firstOfMonth.getDay();

  // Build a 6-row × 7-col grid (42 cells) with leading nulls
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(firstOfMonth);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-heading">{monthLabel}</h3>
        <div className="flex items-center gap-2">
          <Link
            href={`/workers/${workerId}?year=${prevYear}&month=${prevMonth}`}
            className="rounded-md border border-border px-3 py-1 text-xs text-text-secondary hover:bg-surface-alt"
          >
            ‹ Prev
          </Link>
          <Link
            href={`/workers/${workerId}?year=${nextYear}&month=${nextMonth}`}
            className="rounded-md border border-border px-3 py-1 text-xs text-text-secondary hover:bg-surface-alt"
          >
            Next ›
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-muted">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 font-medium">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} className="aspect-square" />;
          }
          const dateStr = `${year}-${pad(month)}-${pad(day)}`;
          const units = entries.get(dateStr);
          return (
            <Link
              key={i}
              href={`/workers/${workerId}?year=${year}&month=${month}&date=${dateStr}#editor`}
              className={`aspect-square rounded-md flex flex-col items-center justify-center border border-border/50 transition-colors ${unitsClass(units)}`}
            >
              <span className="text-xs">{day}</span>
              {units !== undefined && (
                <span className="text-[10px] font-semibold">{unitsLabel(units)}</span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-accent-red-bg" /> Absent
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-accent-amber-bg" /> Half day
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-accent-green-bg" /> Full day
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-blue-100" /> Overtime
        </span>
      </div>
    </div>
  );
}
