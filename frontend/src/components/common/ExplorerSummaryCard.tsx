interface ExplorerSummaryCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  iconBg?: string;
}

export function ExplorerSummaryCard({
  title,
  value,
  icon,
  description,
  iconBg = "bg-slate-800/70",
}: ExplorerSummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-white">
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-3 ${iconBg}`}>{icon}</div>
      </div>
      {description && (
        <p className="mt-3 text-xs text-slate-500">{description}</p>
      )}
    </div>
  );
}
