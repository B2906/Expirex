import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AnomalyChart from '../components/AnomalyChart'
import ConfidenceCard from '../components/ConfidenceCard'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import PipelineFlow from '../components/PipelineFlow'
import SectionHeader from '../components/SectionHeader'
import ShipmentPreviewTable from '../components/ShipmentPreviewTable'
import StatCard from '../components/StatCard'
import { getDashboard, getHealth, getShipments } from '../services/api'

function affectedShipments(shipments) {
  return shipments
    .filter((shipment) => shipment.deviation_type || shipment.status || shipment.confidence_percent != null)
    .slice(0, 8)
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [shipments, setShipments] = useState([])
  const [online, setOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([getHealth(), getDashboard(), getShipments()])
      .then(([health, dashboard, shipmentRecords]) => {
        if (!active) return
        setOnline(health?.status === 'ok')
        setData(dashboard)
        setShipments(shipmentRecords)
      })
      .catch(() => {
        if (!active) return
        setOnline(false)
        setError('Unable to connect to the ExpireX backend.')
      })
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [])

  const preview = useMemo(() => affectedShipments(shipments), [shipments])

  if (loading) return <Loading label="Loading logistics overview" />
  if (error) return <ErrorState message={error} />
  if (!data) return <ErrorState message="Dashboard data is not available." />

  const decided = Number(data.allocated_shipments || 0) + Number(data.rejected_shipments || 0)
  const allocationRate = decided ? `${((Number(data.allocated_shipments || 0) / decided) * 100).toFixed(1)}%` : null

  return (
    <section className="space-y-8">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="eyebrow">ExpireX</p>
          <h1 className="page-title">Logistics Recovery Intelligence</h1>
          <p className="page-description">Monitor shipment anomalies, recovery decisions, route capacity and recovery confidence.</p>
        </div>
        <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium ${online ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
          <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500'}`} />
          {online ? 'System Online' : 'System Offline'}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total Shipments" value={data.total_shipments} detail="All persisted shipment records" />
        <StatCard label="Detected Anomalies" value={data.shipments_with_anomalies} detail="Shipments with anomaly records" tone="amber" />
        <StatCard label="Recovery Paths" value={data.total_recovery_paths} detail="Persisted candidate paths" tone="blue" />
        <StatCard label="Allocated" value={data.allocated_shipments} detail="Recovery decisions allocated" tone="teal" />
        <StatCard label="Rejected" value={data.rejected_shipments} detail="Recovery decisions rejected" tone="red" />
        <StatCard label="Allocation Rate" value={allocationRate ?? 'Not available'} detail={decided ? `${decided} decided shipments` : 'No allocation decisions'} tone="teal" />
      </div>

      <PipelineFlow />

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="panel p-5 md:p-6">
          <SectionHeader eyebrow="Anomaly distribution" title="What has gone wrong?" detail="Persisted anomaly records grouped by type." />
          <AnomalyChart counts={data.anomaly_counts} />
        </article>
        <article className="panel p-5 md:p-6">
          <SectionHeader eyebrow="Recovery confidence" title="How confident are the decisions?" detail="Monte Carlo confidence statistics from the persisted pipeline." />
          <ConfidenceCard confidence={data.recovery_confidence} />
        </article>
      </div>

      <article className="panel p-5 md:p-6">
        <SectionHeader
          eyebrow="Affected shipments"
          title="Recent recovery activity"
          detail="Shipments with persisted anomalies, decisions, or confidence results."
          action={<Link to="/shipments" className="text-sm font-semibold text-teal-700 hover:text-teal-800">View all shipments →</Link>}
        />
        <ShipmentPreviewTable shipments={preview} />
      </article>

      <nav aria-label="Quick actions" className="flex flex-wrap gap-3">
        <Link to="/shipments" className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">View All Shipments</Link>
        <Link to="/digital-twin" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700">Open Digital Twin</Link>
        <Link to="/analytics" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700">View Analytics</Link>
      </nav>
    </section>
  )
}
