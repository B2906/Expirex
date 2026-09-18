import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AnomalyChart from '../components/AnomalyChart'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import SectionHeader from '../components/SectionHeader'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { getDashboard, getHealth, getMonteCarlo, getRecovery, getRoutes, getShipments } from '../services/api'

function number(value, digits = 0) {
  return value == null || Number.isNaN(Number(value)) ? '—' : Number(value).toFixed(digits)
}

function numeric(value) {
  return value == null || Number.isNaN(Number(value)) ? null : Number(value)
}

function routeIds(value) {
  if (Array.isArray(value)) return value.map((item) => typeof item === 'object' ? item.route_id : item).filter(Boolean)
  if (typeof value !== 'string') return []
  return [...value.matchAll(/route_id['"]?\s*:\s*['"]([^'"]+)/g)].map((match) => match[1])
}

function ProgressList({ entries, empty = 'No records are available.' }) {
  if (!entries.length) return <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">{empty}</p>
  const maximum = Math.max(...entries.map(([, value]) => Number(value) || 0), 1)
  return (
    <div className="space-y-4">
      {entries.map(([label, value]) => (
        <div key={label}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium capitalize text-slate-700">{String(label).replaceAll('_', ' ')}</span>
            <span className="tabular text-slate-500">{value}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-teal-600 transition-all" style={{ width: `${(Number(value) / maximum) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyChart({ message }) {
  return <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">{message}</p>
}

function Insight({ children }) {
  return <div className="rounded-lg border border-teal-100 bg-teal-50/60 p-4 text-sm leading-6 text-slate-700">{children}</div>
}

export default function Analytics() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [shipments, setShipments] = useState([])
  const [recovery, setRecovery] = useState([])
  const [monteCarlo, setMonteCarlo] = useState([])
  const [routes, setRoutes] = useState([])
  const [online, setOnline] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([
      getHealth().then(() => true).catch(() => false),
      getDashboard(),
      getShipments(),
      getRecovery(),
      getMonteCarlo(),
      getRoutes(),
    ])
      .then(([health, dashboardData, shipmentData, recoveryData, confidenceData, routeData]) => {
        if (!active) return
        setOnline(health)
        setDashboard(dashboardData || {})
        setShipments(Array.isArray(shipmentData) ? shipmentData : [])
        setRecovery(Array.isArray(recoveryData) ? recoveryData : [])
        setMonteCarlo(Array.isArray(confidenceData) ? confidenceData : [])
        setRoutes(Array.isArray(routeData) ? routeData : [])
      })
      .catch(() => active && setError('Unable to load analytics data.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const anomalyCounts = dashboard?.anomaly_counts || {}
  const confidenceValues = monteCarlo.map((record) => numeric(record.confidence_percent)).filter((value) => value != null)
  const affectedShipments = useMemo(
    () => shipments
      .filter((shipment) => shipment.deviation_type)
      .sort((left, right) => (numeric(right.severity_score) ?? -Infinity) - (numeric(left.severity_score) ?? -Infinity)),
    [shipments],
  )
  const priorityCounts = useMemo(() => countBy(shipments, (shipment) => shipment.priority), [shipments])
  const severityValues = affectedShipments.map((shipment) => numeric(shipment.severity_score)).filter((value) => value != null)
  const routeUsage = useMemo(() => {
    const counts = new Map()
    recovery.forEach((path) => routeIds(path.path).forEach((routeId) => counts.set(routeId, (counts.get(routeId) || 0) + 1)))
    return [...counts.entries()].sort(([, left], [, right]) => right - left)
  }, [recovery])
  const hopCounts = useMemo(() => countBy(recovery, (path) => path.num_hops), [recovery])
  const confidenceBuckets = [
    ['90–100%', confidenceValues.filter((value) => value >= 90 && value <= 100).length],
    ['80–89%', confidenceValues.filter((value) => value >= 80 && value < 90).length],
    ['70–79%', confidenceValues.filter((value) => value >= 70 && value < 80).length],
    ['Below 70%', confidenceValues.filter((value) => value < 70).length],
  ].filter(([, value]) => value > 0)
  const allocationCounts = [
    ['Allocated', dashboard?.allocated_shipments ?? 0],
    ['Rejected', dashboard?.rejected_shipments ?? 0],
  ]
  const unresolved = Math.max(0, (dashboard?.total_recovery_paths ?? 0) - (dashboard?.allocated_shipments ?? 0) - (dashboard?.rejected_shipments ?? 0))
  if (dashboard?.total_recovery_paths != null) allocationCounts.push(['Other / unresolved', unresolved])

  if (loading) return <Loading label="Loading analytics" />
  if (error) return <ErrorState message={error} />

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Performance intelligence</p>
          <h1 className="page-title">Analytics</h1>
          <p className="page-description">Analyze shipment anomalies, recovery decisions, route utilization and recovery confidence.</p>
        </div>
        <div className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${online ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
          {online ? 'Backend available' : 'Backend unavailable'}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total shipments" value={number(dashboard.total_shipments)} />
        <StatCard label="Detected anomalies" value={number(dashboard.shipments_with_anomalies)} tone="amber" />
        <StatCard label="Recovery paths" value={number(dashboard.total_recovery_paths)} tone="blue" />
        <StatCard label="Allocated" value={number(dashboard.allocated_shipments)} tone="teal" />
        <StatCard label="Rejected" value={number(dashboard.rejected_shipments)} tone="red" />
        <StatCard label="Avg. confidence" value={dashboard.recovery_confidence?.average_percent == null ? '—' : `${number(dashboard.recovery_confidence.average_percent, 1)}%`} tone="teal" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="panel p-5 md:p-6">
          <SectionHeader eyebrow="Anomaly analytics" title="Detected anomaly distribution" detail="Counts are sourced from the dashboard aggregate." />
          <AnomalyChart counts={anomalyCounts} />
        </article>
        <article className="panel p-5 md:p-6">
          <SectionHeader eyebrow="Recovery analytics" title="Allocation breakdown" detail="Persisted recovery path and allocation results." />
          <ProgressList entries={allocationCounts} empty="No allocation data is available." />
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <article className="panel p-5 md:p-6">
          <SectionHeader eyebrow="Confidence" title="Monte Carlo bands" detail={`${confidenceValues.length} shipments with confidence data.`} />
          {confidenceValues.length ? <ProgressList entries={confidenceBuckets} /> : <EmptyChart message="No Monte Carlo confidence records are available." />}
          {dashboard.recovery_confidence && <p className="mt-5 text-sm text-slate-500">Range: {number(dashboard.recovery_confidence.minimum_percent, 1)}%–{number(dashboard.recovery_confidence.maximum_percent, 1)}%</p>}
        </article>
        <article className="panel p-5 md:p-6">
          <SectionHeader eyebrow="Priorities" title="Shipment priority mix" />
          <ProgressList entries={priorityCounts} empty="No shipment priority data is available." />
        </article>
        <article className="panel p-5 md:p-6">
          <SectionHeader eyebrow="Recovery paths" title="Hop count distribution" />
          <ProgressList entries={hopCounts} empty="No recovery path data is available." />
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="panel p-5 md:p-6">
          <SectionHeader eyebrow="Severity" title="Observed severity range" detail="Numeric values are shown because the persisted data does not define official severity bands." />
          {severityValues.length ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Summary label="Records" value={severityValues.length} />
              <Summary label="Minimum" value={number(Math.min(...severityValues), 3)} />
              <Summary label="Maximum" value={number(Math.max(...severityValues), 3)} />
            </div>
          ) : <EmptyChart message="No numeric severity records are available." />}
        </article>
        <article className="panel p-5 md:p-6">
          <SectionHeader eyebrow="Route activity" title="Recovery route usage" detail={`${routes.length} total persisted routes; usage is derived from recovery path route IDs.`} />
          <ProgressList entries={routeUsage.slice(0, 8)} empty="No route usage can be derived from recovery paths." />
        </article>
      </div>

      <article className="panel p-5 md:p-6">
        <SectionHeader eyebrow="Affected shipments" title="Highest observed severity" detail="Rows are sorted by persisted numeric severity, with missing values last." />
        {affectedShipments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.1em] text-slate-400">
                <tr><th className="px-3 py-3 font-medium">Shipment ID</th><th className="px-3 py-3 font-medium">Anomaly</th><th className="px-3 py-3 font-medium">Severity</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Confidence</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {affectedShipments.slice(0, 10).map((shipment) => (
                  <tr key={shipment.shipment_id} onClick={() => navigate(`/shipments/${encodeURIComponent(shipment.shipment_id)}`)} className="cursor-pointer transition hover:bg-teal-50/30">
                    <td className="px-3 py-3 font-semibold text-teal-700">{shipment.shipment_id}</td>
                    <td className="px-3 py-3 capitalize text-slate-600">{shipment.deviation_type.replaceAll('_', ' ')}</td>
                    <td className="px-3 py-3 tabular text-slate-600">{shipment.severity_score ?? '—'}</td>
                    <td className="px-3 py-3"><StatusBadge value={shipment.status ?? shipment.current_status} /></td>
                    <td className="px-3 py-3 tabular text-slate-600">{shipment.confidence_percent_monte_carlo == null && shipment.confidence_percent == null ? '—' : `${number(shipment.confidence_percent_monte_carlo ?? shipment.confidence_percent, 1)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyChart message="No affected shipments are available." />}
      </article>

      <article className="panel p-5 md:p-6">
        <SectionHeader eyebrow="Operational insights" title="Data-derived observations" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.shipments_with_anomalies != null && <Insight>{dashboard.shipments_with_anomalies} shipments have detected anomalies.</Insight>}
          {dashboard.allocated_shipments != null && <Insight>{dashboard.allocated_shipments} shipments have persisted recovery allocations.</Insight>}
          {dashboard.recovery_confidence?.average_percent != null && <Insight>Average Monte Carlo recovery confidence is {number(dashboard.recovery_confidence.average_percent, 1)}%.</Insight>}
          {Object.entries(anomalyCounts).sort(([, left], [, right]) => right - left)[0] && (
            <Insight>
              {Object.entries(anomalyCounts).sort(([, left], [, right]) => right - left)[0][0].replaceAll('_', ' ')} accounts for {number((Object.entries(anomalyCounts).sort(([, left], [, right]) => right - left)[0][1] / Object.values(anomalyCounts).reduce((sum, value) => sum + Number(value), 0)) * 100)}% of detected anomalies.
            </Insight>
          )}
        </div>
      </article>

      <div className="flex justify-end">
        <Link to="/digital-twin" className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700">Open Digital Twin →</Link>
      </div>
    </section>
  )
}

function countBy(records, getKey) {
  const counts = new Map()
  records.forEach((record) => {
    const key = getKey(record)
    if (key != null && key !== '') counts.set(String(key), (counts.get(String(key)) || 0) + 1)
  })
  return [...counts.entries()].sort(([left], [right]) => {
    const leftNumber = numeric(left)
    const rightNumber = numeric(right)
    return leftNumber != null && rightNumber != null ? leftNumber - rightNumber : left.localeCompare(right)
  })
}

function Summary({ label, value }) {
  return <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.1em] text-slate-400">{label}</p><p className="mt-2 text-xl font-semibold text-slate-900">{value}</p></div>
}
