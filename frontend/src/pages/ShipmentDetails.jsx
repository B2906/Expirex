import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AnomalyBadge from '../components/AnomalyBadge'
import ConfidenceIndicator from '../components/ConfidenceIndicator'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import SectionHeader from '../components/SectionHeader'
import StatusBadge, { DecisionAssessmentBadge } from '../components/StatusBadge'
import { getExplanation, getMisplaced, getRecoveryForShipment, getShipment } from '../services/api'
import { buildSeverityPercentiles, rawSeverityLabel, severityPercentileLabel } from '../utils/severity'
import { assessRecoveryDecision, PROTOTYPE_CONFIDENCE_THRESHOLD } from '../utils/confidence'

function display(value) {
  if (value == null || value === '') return '—'
  if (typeof value === 'object') return Array.isArray(value) ? value.join(', ') : '—'
  return String(value)
}

function numberDisplay(value, digits = 2) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toFixed(digits)
}

function dateDisplay(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? display(value) : date.toLocaleString()
}

function simulationDisplay(value) {
  if (value == null || value === '') return '—'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString() : display(value)
}

function routeIds(path) {
  if (Array.isArray(path)) return path.map((item) => typeof item === 'object' ? item.route_id : item).filter(Boolean)
  if (typeof path !== 'string') return []
  return [...path.matchAll(/route_id['"]?\s*:\s*['"]([^'"]+)/g)].map((match) => match[1])
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-700">{value}</dd>
    </div>
  )
}

export default function ShipmentDetails() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [recovery, setRecovery] = useState(null)
  const [explanation, setExplanation] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([getShipment(id), getRecoveryForShipment(id), getExplanation(id), getMisplaced()])
      .then(([shipment, recoveryResult, explanationResult, anomalyRecords]) => {
        if (!active) return
        setData(shipment)
        setRecovery(recoveryResult)
        setExplanation(explanationResult)
        setAnomalies(Array.isArray(anomalyRecords) ? anomalyRecords : [])
      })
      .catch((requestError) => {
        if (!active) return
        if (requestError?.response?.status === 404) {
          setNotFound(true)
        } else {
          setError('Unable to load shipment details from the ExpireX backend.')
        }
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id])

  const detail = useMemo(() => {
    const shipment = data?.shipment ?? {}
    const anomaly = data?.anomalies?.[0] ?? {}
    const assignment = data?.assignments?.[0] ?? recovery?.assignments?.[0] ?? {}
    const monteCarlo = data?.monte_carlo?.[0] ?? {}
    const paths = data?.recovery_paths ?? recovery?.paths ?? []
    return { shipment, anomaly, assignment, monteCarlo, paths }
  }, [data, recovery])

  if (loading) return <Loading label="Loading shipment details" />
  if (notFound) {
    return (
      <section className="panel p-6 md:p-8">
        <p className="eyebrow">Shipment record</p>
        <h1 className="page-title">Shipment Not Found</h1>
        <p className="page-description">This shipment does not exist in the ExpireX dataset.</p>
        <Link to="/shipments" className="mt-6 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
          Back to Shipments
        </Link>
      </section>
    )
  }
  if (error) return <ErrorState message={error} />

  const { shipment, anomaly, assignment, monteCarlo, paths } = detail
  const currentHub = anomaly.last_known_hub ?? shipment.current_hub
  const recoveryRoute = explanation?.recovery_route ?? assignment.selected_path
  const routePath = routeIds(recoveryRoute)
  const allocationStatus = assignment.status ?? 'UNRESOLVED'
  const hasMonteCarlo = Object.keys(monteCarlo).length > 0
  const severityPercentile = buildSeverityPercentiles(anomalies).get(id)
  const decision = assessRecoveryDecision(allocationStatus, monteCarlo.confidence_percent)

  return (
    <section className="space-y-8">
      <header>
        <Link to="/shipments" className="text-sm font-semibold text-teal-700 hover:underline">← Back to shipments</Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Shipment record</p>
            <h1 className="page-title">{display(shipment.shipment_id || id)}</h1>
            <p className="page-description">Persisted anomaly, recovery allocation and confidence details.</p>
          </div>
          <div className="flex items-center gap-2">
            <AnomalyBadge value={anomaly.deviation_type} />
            <StatusBadge value={allocationStatus} />
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Current hub" value={display(currentHub)} />
        <Metric label="Destination" value={display(shipment.destination_hub)} />
        <Metric label="Path score" value={numberDisplay(explanation?.path_score ?? assignment.path_score, 3)} />
        <Metric label="Recovery confidence" value={<ConfidenceIndicator value={explanation?.monte_carlo_confidence ?? monteCarlo.confidence_percent} />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="panel p-5 md:p-6">
          <SectionHeader eyebrow="Shipment profile" title="Movement context" detail="Original and current locations are kept separate for anomaly investigation." />
          <dl className="grid gap-5 sm:grid-cols-2">
            <Detail label="Shipment ID" value={display(shipment.shipment_id)} />
            <Detail label="Original hub" value={display(shipment.origin_hub)} />
            <Detail label="Current hub" value={display(currentHub)} />
            <Detail label="Destination" value={display(shipment.destination_hub)} />
            <Detail label="Weight" value={shipment.weight_kg == null ? '—' : `${numberDisplay(shipment.weight_kg, 1)} kg`} />
            <Detail label="Priority" value={display(shipment.priority)} />
            <Detail label="Ship time" value={dateDisplay(shipment.ship_time)} />
            <Detail label="Deadline" value={dateDisplay(shipment.deadline)} />
          </dl>
        </article>

        <article className="panel p-5 md:p-6">
          <SectionHeader eyebrow="Detection" title="Anomaly assessment" />
          <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            <Detail label="Anomaly" value={<AnomalyBadge value={anomaly.deviation_type} />} />
            <Detail label="Relative Severity Percentile" value={severityPercentileLabel(severityPercentile)} />
            <p className="text-xs text-slate-500 sm:col-span-2">Relative urgency among detected anomalies</p>
            <Detail label="Raw Severity Score" value={rawSeverityLabel(anomaly.severity_score)} />
            <Detail label="Time lost" value={display(explanation?.time_lost)} />
            <Detail label="Shipment status" value={<StatusBadge value={shipment.current_status} />} />
          </dl>
        </article>
      </div>

      <article className="panel overflow-hidden">
        <div className="p-5 md:p-6">
          <SectionHeader eyebrow="Recovery decision" title="Selected recovery route" detail="The selected allocation is shown alongside persisted candidate paths." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Route IDs" value={routePath.length ? routePath.join(' → ') : '—'} />
            <Metric label="Hops" value={display(assignment.num_hops)} />
            <Metric label="Cost" value={assignment.total_cost == null ? '—' : `$${numberDisplay(assignment.total_cost)}`} />
            <Metric label="Auction bid" value={assignment.bid == null ? '—' : `$${numberDisplay(assignment.bid)}`} />
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.1em] text-slate-400">
                <tr>
                  <th className="px-3 py-3 font-medium">Candidate route</th>
                  <th className="px-3 py-3 font-medium">Hops</th>
                  <th className="px-3 py-3 font-medium">Cost</th>
                  <th className="px-3 py-3 font-medium">Path score</th>
                  <th className="px-3 py-3 font-medium">Deadline margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paths.length ? paths.map((path, index) => (
                  <tr key={`${path.shipment_id}-${index}`}>
                    <td className="px-3 py-3 font-medium text-slate-700">{routeIds(path.path).join(' → ') || '—'}</td>
                    <td className="px-3 py-3 text-slate-600">{display(path.num_hops)}</td>
                    <td className="px-3 py-3 text-slate-600">{path.total_cost == null ? '—' : `$${numberDisplay(path.total_cost)}`}</td>
                    <td className="px-3 py-3 text-slate-600">{numberDisplay(path.path_score, 3)}</td>
                    <td className="px-3 py-3 text-slate-600">{path.deadline_margin_hours == null ? '—' : `${numberDisplay(path.deadline_margin_hours, 2)} h`}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="px-3 py-6 text-center text-sm text-slate-500">No persisted recovery paths available.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </article>

      <div className="grid gap-6 xl:grid-cols-2">
        <article className="panel p-5 md:p-6">
          <SectionHeader eyebrow="Monte Carlo" title="Recovery confidence" />
          <dl className="grid gap-5 sm:grid-cols-2">
            <Detail label="Confidence" value={hasMonteCarlo ? <ConfidenceIndicator value={monteCarlo.confidence_percent} /> : 'CONFIDENCE UNAVAILABLE'} />
            <Detail label="Simulations" value={simulationDisplay(monteCarlo.simulations)} />
            <Detail label="Successful" value={simulationDisplay(monteCarlo.successful)} />
            <Detail label="Failed" value={simulationDisplay(monteCarlo.failed)} />
            <Detail label="Average arrival" value={hasMonteCarlo ? dateDisplay(monteCarlo.average_arrival) : 'Not available'} />
            <Detail label="Latest successful arrival" value={hasMonteCarlo ? dateDisplay(monteCarlo.latest_successful_arrival) : 'Not available'} />
          </dl>
          {!hasMonteCarlo && <p className="mt-5 text-xs leading-5 text-slate-500">No persisted Monte Carlo result is available for this shipment.</p>}
        </article>
        <article className="panel p-5 md:p-6">
          <SectionHeader eyebrow="Recovery decision" title="Decision Assessment" detail="Prototype policy only; persisted allocation status is unchanged." />
          <dl className="grid gap-5 sm:grid-cols-2">
            <Detail label="Allocation Status" value={<StatusBadge value={allocationStatus} />} />
            <Detail label="Monte Carlo Confidence" value={hasMonteCarlo ? <ConfidenceIndicator value={monteCarlo.confidence_percent} /> : 'CONFIDENCE UNAVAILABLE'} />
            <Detail label="Decision Assessment" value={<DecisionAssessmentBadge value={decision.decisionAssessment} />} />
            <Detail label="Simulations" value={simulationDisplay(monteCarlo.simulations)} />
            <Detail label="Successful" value={simulationDisplay(monteCarlo.successful)} />
            <Detail label="Failed" value={simulationDisplay(monteCarlo.failed)} />
          </dl>
          <p className="mt-5 text-xs leading-5 text-slate-500">Prototype Decision Policy: automatic recommendation requires confidence ≥ {PROTOTYPE_CONFIDENCE_THRESHOLD}%. Confidence is the observed proportion of successful persisted simulations, not a probability-of-delivery guarantee.</p>
          {!hasMonteCarlo && <p className="mt-2 text-xs leading-5 text-slate-500">No persisted Monte Carlo result is available for this shipment.</p>}
        </article>
        <article className="panel p-5 md:p-6">
          <SectionHeader eyebrow="Explainability" title="Why this route was selected" />
          <p className="text-sm leading-7 text-slate-600">{explanation?.reason || 'No persisted explanation is available for this shipment.'}</p>
          {anomaly.deviation_type && <p className="mt-4 text-sm leading-6 text-slate-600">Anomaly type: <span className="font-semibold">{anomaly.deviation_type}</span>.</p>}
          {assignment.status && <p className="mt-2 text-sm leading-6 text-slate-600">Recovery path was allocated by the persisted allocation stage.</p>}
          {decision.decisionAssessment === 'REVIEW REQUIRED' && <p className="mt-4 text-sm leading-6 text-amber-700">Recovery path was allocated by the persisted allocation stage, but its Monte Carlo confidence is below the prototype automatic-recommendation threshold, so human review is recommended.</p>}
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <Detail label="Anomaly type" value={display(anomaly.deviation_type)} />
            <Detail label="Allocation status" value={<StatusBadge value={allocationStatus} />} />
            <Detail label="Fallback used" value={assignment.fallback_used == null ? '—' : assignment.fallback_used ? 'Yes' : 'No'} />
          </dl>
        </article>
      </div>
    </section>
  )
}

function Metric({ label, value }) {
  return (
    <div className="panel p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <div className="mt-2 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  )
}
