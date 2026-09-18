function formatPercent(value) {
  return value == null ? 'Not available' : `${Number(value).toFixed(1)}%`
}

export default function ConfidenceCard({ confidence }) {
  if (!confidence || !confidence.count) {
    return <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No Monte Carlo confidence records are available.</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Average</p>
        <p className="mt-2 text-2xl font-semibold text-teal-700">{formatPercent(confidence.average_percent)}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Range</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {formatPercent(confidence.minimum_percent)}–{formatPercent(confidence.maximum_percent)}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Shipments measured</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{confidence.count}</p>
      </div>
    </div>
  )
}
