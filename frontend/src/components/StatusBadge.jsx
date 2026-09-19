import { assessmentIcon, assessmentTone } from '../utils/confidence'

export default function StatusBadge({ value }) {
  const label = value == null || value === '' ? 'Not available' : String(value).replaceAll('_', ' ')
  const normalized = label.toLowerCase()
  const tone = normalized.includes('allocat') || normalized === 'in_transit' || normalized === 'in transit'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : normalized.includes('reject') || normalized.includes('misplac')
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-slate-100 text-slate-600 border-slate-200'

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${tone}`}>{label}</span>
}

export function DecisionAssessmentBadge({ value }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${assessmentTone(value)}`}>
      <span aria-hidden="true">{assessmentIcon(value)}</span>
      {value || 'CONFIDENCE UNAVAILABLE'}
    </span>
  )
}
