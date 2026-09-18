export default function ConfidenceIndicator({ value }) {
  if (value == null || Number.isNaN(Number(value))) {
    return <span className="text-sm text-slate-400">—</span>
  }

  const confidence = Number(value)
  return (
    <div className="flex min-w-[92px] items-center gap-2">
      <div className="h-1.5 w-12 rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-teal-600"
          style={{ width: `${Math.max(0, Math.min(100, confidence))}%` }}
        />
      </div>
      <span className="tabular text-xs text-slate-600">{confidence.toFixed(1)}%</span>
    </div>
  )
}
