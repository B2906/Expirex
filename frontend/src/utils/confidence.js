export const PROTOTYPE_CONFIDENCE_THRESHOLD = 90

function numericConfidence(value) {
  if (value == null || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function normalizedStatus(value) {
  return String(value ?? '').trim().toLowerCase().replaceAll('_', ' ')
}

function hasNoViableRecovery(status) {
  const normalized = normalizedStatus(status)
  return !normalized || normalized.includes('reject') || normalized.includes('unresolved') || normalized.includes('no viable') || normalized.includes('no allocation') || normalized.includes('not allocated') || normalized.includes('unallocated') || normalized === 'none'
}

export function assessRecoveryDecision(allocationStatus, confidenceValue) {
  const confidencePercent = numericConfidence(confidenceValue)
  const status = allocationStatus == null || allocationStatus === '' ? 'UNRESOLVED' : String(allocationStatus)

  if (hasNoViableRecovery(allocationStatus)) {
    return {
      allocationStatus: status,
      confidencePercent,
      decisionAssessment: 'NO VIABLE RECOVERY',
      reason: 'No persisted recovery allocation is available for this shipment.',
    }
  }

  if (confidencePercent == null) {
    return {
      allocationStatus: status,
      confidencePercent: null,
      decisionAssessment: 'CONFIDENCE UNAVAILABLE',
      reason: 'The persisted allocation has no Monte Carlo confidence record.',
    }
  }

  if (confidencePercent >= PROTOTYPE_CONFIDENCE_THRESHOLD) {
    return {
      allocationStatus: status,
      confidencePercent,
      decisionAssessment: 'RECOMMENDED',
      reason: 'Monte Carlo confidence meets the prototype automatic-recommendation threshold.',
    }
  }

  return {
    allocationStatus: status,
    confidencePercent,
    decisionAssessment: 'REVIEW REQUIRED',
    reason: 'Monte Carlo confidence is below the prototype automatic-recommendation threshold.',
  }
}

export function assessShipment(shipment = {}) {
  return assessRecoveryDecision(
    shipment.status ?? 'UNRESOLVED',
    shipment.confidence_percent_monte_carlo ?? shipment.confidence_percent,
  )
}

export function assessmentTone(assessment) {
  if (assessment === 'RECOMMENDED') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (assessment === 'REVIEW REQUIRED') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (assessment === 'NO VIABLE RECOVERY') return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

export function assessmentIcon(assessment) {
  if (assessment === 'RECOMMENDED') return '✓'
  if (assessment === 'REVIEW REQUIRED') return '⚠'
  if (assessment === 'NO VIABLE RECOVERY') return '×'
  return '—'
}
