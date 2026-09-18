export default function AnomalyBadge({ value }) {
  if (!value) {
    return <span className="text-sm text-slate-400">No anomaly</span>
  }

  const label = String(value).replaceAll('_', ' ')
  return (
    <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium capitalize text-amber-700">
      {label}
    </span>
  )
}
