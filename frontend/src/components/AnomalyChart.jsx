export default function AnomalyChart({ counts = {} }) {
  const entries = Object.entries(counts)
  const total = entries.reduce((sum, [, count]) => sum + Number(count || 0), 0)

  if (!entries.length) {
    return <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No anomaly records are available.</p>
  }

  return (
    <div className="space-y-4">
      {entries.map(([type, count]) => {
        const percentage = total ? (Number(count) / total) * 100 : 0
        return (
          <div key={type}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium capitalize text-slate-700">{type.replaceAll('_', ' ')}</span>
              <span className="tabular text-slate-500">{count} <span className="text-xs">({percentage.toFixed(0)}%)</span></span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-teal-600 transition-all duration-500" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        )
      })}
      <p className="pt-1 text-xs text-slate-400">{total} anomaly records represented</p>
    </div>
  )
}
