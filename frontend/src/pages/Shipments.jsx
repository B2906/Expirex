import { useEffect, useMemo, useState } from 'react'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import Pagination from '../components/Pagination'
import SectionHeader from '../components/SectionHeader'
import ShipmentFilters from '../components/ShipmentFilters'
import ShipmentTable from '../components/ShipmentTable'
import { getShipments } from '../services/api'
import { buildSeverityPercentiles } from '../utils/severity'

const PAGE_SIZE = 20

function hasAnomaly(shipment) {
  return Boolean(shipment.deviation_type)
}

function confidenceValue(shipment) {
  const value = shipment.confidence_percent_monte_carlo ?? shipment.confidence_percent
  return value == null || Number.isNaN(Number(value)) ? null : Number(value)
}

function severityValue(shipment) {
  return shipment.severity_score == null || Number.isNaN(Number(shipment.severity_score))
    ? null
    : Number(shipment.severity_score)
}

export default function Shipments() {
  const [shipments, setShipments] = useState([])
  const [search, setSearch] = useState('')
  const [anomaly, setAnomaly] = useState('all')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [sortKey, setSortKey] = useState('affected')
  const [sortDirection, setSortDirection] = useState('desc')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    getShipments()
      .then((records) => active && setShipments(Array.isArray(records) ? records : []))
      .catch(() => active && setError('Unable to load shipments from the ExpireX backend.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const options = useMemo(() => {
    const anomalies = [...new Set(shipments.map((item) => item.deviation_type).filter(Boolean))]
      .sort()
      .map((value) => ({ value, label: value.replaceAll('_', ' ') }))
    const statuses = [...new Set(shipments.map((item) => item.status ?? item.current_status).filter(Boolean))]
      .sort()
      .map((value) => ({ value, label: value.replaceAll('_', ' ') }))
    const priorities = [...new Set(shipments.map((item) => item.priority).filter((value) => value != null))]
      .sort((left, right) => Number(left) - Number(right))
      .map((value) => ({ value: String(value), label: String(value) }))
    return {
      anomalies: [{ value: 'all', label: 'All anomalies' }, ...anomalies, { value: 'none', label: 'No anomaly' }],
      statuses: [{ value: 'all', label: 'All statuses' }, ...statuses],
      priorities: [{ value: 'all', label: 'All priorities' }, ...priorities],
    }
  }, [shipments])

  const filteredShipments = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = shipments.filter((item) => {
      const itemStatus = item.status ?? item.current_status
      const current = item.last_known_hub ?? item.current_hub
      const searchText = [item.shipment_id, item.origin_hub, current, item.destination_hub].filter(Boolean).join(' ').toLowerCase()
      return (
        (!query || searchText.includes(query)) &&
        (anomaly === 'all' || (anomaly === 'none' ? !hasAnomaly(item) : item.deviation_type === anomaly)) &&
        (status === 'all' || itemStatus === status) &&
        (priority === 'all' || String(item.priority) === priority) &&
        (severity === 'all' || (severity === 'available' ? severityValue(item) != null : severityValue(item) == null))
      )
    })

    return filtered.sort((left, right) => {
      if (sortKey === 'affected') return Number(hasAnomaly(right)) - Number(hasAnomaly(left))
      const leftValue = sortKey === 'severity' ? severityValue(left) : sortKey === 'confidence' ? confidenceValue(left) : sortKey === 'priority' ? Number(left.priority) : String(left.shipment_id || '')
      const rightValue = sortKey === 'severity' ? severityValue(right) : sortKey === 'confidence' ? confidenceValue(right) : sortKey === 'priority' ? Number(right.priority) : String(right.shipment_id || '')
      if (leftValue == null && rightValue == null) return 0
      if (leftValue == null) return 1
      if (rightValue == null) return -1
      const comparison = typeof leftValue === 'number' ? leftValue - rightValue : leftValue.localeCompare(rightValue)
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [shipments, search, anomaly, status, priority, severity, sortKey, sortDirection])

  useEffect(() => setPage(1), [search, anomaly, status, priority, severity, sortKey, sortDirection])

  const severityPercentiles = useMemo(() => buildSeverityPercentiles(shipments.filter(hasAnomaly)), [shipments])
  if (loading) return <Loading label="Loading shipments" />
  if (error) return <ErrorState message={error} />

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const visibleShipments = filteredShipments.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const rangeStart = filteredShipments.length ? (safePage - 1) * PAGE_SIZE + 1 : 0
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filteredShipments.length)
  const hasFilters = Boolean(search || anomaly !== 'all' || status !== 'all' || priority !== 'all' || severity !== 'all')

  function clearFilters() {
    setSearch('')
    setAnomaly('all')
    setStatus('all')
    setPriority('all')
    setSeverity('all')
  }

  function handleSort(nextKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(nextKey)
      setSortDirection(nextKey === 'shipment_id' ? 'asc' : 'desc')
    }
  }

  return (
    <section className="space-y-8">
      <header>
        <p className="eyebrow">Network activity</p>
        <h1 className="page-title">Shipments</h1>
        <p className="page-description">Monitor shipments, detected anomalies, recovery decisions and confidence.</p>
      </header>

      <article className="panel overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 p-5 pb-0 md:p-6 md:pb-0">
          <SectionHeader eyebrow="Investigation workspace" title={`${shipments.length} shipments`} detail="Affected shipments are prioritized by default; normal shipments remain accessible." />
        </div>
        <ShipmentFilters
          search={search}
          onSearchChange={setSearch}
          anomaly={anomaly}
          onAnomalyChange={setAnomaly}
          status={status}
          onStatusChange={setStatus}
          priority={priority}
          onPriorityChange={setPriority}
          severity={severity}
          onSeverityChange={setSeverity}
          anomalyOptions={options.anomalies}
          statusOptions={options.statuses}
          priorityOptions={options.priorities}
          onClear={clearFilters}
          hasFilters={hasFilters}
        />
        {visibleShipments.length ? (
          <ShipmentTable shipments={visibleShipments} severityPercentiles={severityPercentiles} sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
        ) : (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700">No shipments match your filters.</p>
            <button type="button" onClick={clearFilters} className="mt-3 text-sm font-semibold text-teal-700 hover:underline">Clear Filters</button>
          </div>
        )}
        <div className="px-5 py-3 text-xs text-slate-500 md:px-6">
          Showing {rangeStart}–{rangeEnd} of {filteredShipments.length} {hasFilters ? 'matching ' : ''}shipments
        </div>
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </article>
    </section>
  )
}
