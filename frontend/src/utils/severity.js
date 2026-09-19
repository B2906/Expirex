function numericSeverity(value) {
  if (value == null || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export function buildSeverityPercentiles(records = []) {
  const valid = records
    .map((record) => ({ id: record?.shipment_id, value: numericSeverity(record?.severity_score) }))
    .filter((record) => record.id && record.value != null)
    .sort((left, right) => left.value - right.value || String(left.id).localeCompare(String(right.id)))

  const result = new Map()
  if (!valid.length) return result
  if (valid.length === 1) {
    result.set(valid[0].id, 0)
    return result
  }

  let index = 0
  while (index < valid.length) {
    let end = index
    while (end + 1 < valid.length && valid[end + 1].value === valid[index].value) end += 1
    const averageRank = ((index + 1) + (end + 1)) / 2
    const percentile = (100 * (averageRank - 1)) / (valid.length - 1)
    for (let cursor = index; cursor <= end; cursor += 1) {
      result.set(valid[cursor].id, percentile)
    }
    index = end + 1
  }
  return result
}

export function severityPercentileLabel(percentile) {
  return percentile == null ? '—' : `${Math.round(percentile)} / 100`
}

export function rawSeverityLabel(value) {
  const numeric = numericSeverity(value)
  return numeric == null ? '—' : numeric.toFixed(3)
}

