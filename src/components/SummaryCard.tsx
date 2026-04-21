type SummaryCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: "default" | "green" | "red" | "amber";
};

const variantStyles = {
  default: "bg-surface border-border",
  green: "bg-accent-green-bg border-accent-green/20",
  red: "bg-accent-red-bg border-accent-red/20",
  amber: "bg-accent-amber-bg border-accent-amber/20",
};

export function SummaryCard({ title, value, subtitle, icon, variant = "default" }: SummaryCardProps) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className="mt-1 text-2xl font-bold text-text-heading">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-text-faint">{subtitle}</p>}
        </div>
        <div className="rounded-lg bg-surface p-2 shadow-sm">{icon}</div>
      </div>
    </div>
  );
}
