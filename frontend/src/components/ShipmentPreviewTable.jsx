import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

function valueOrDash(value) {
  return value == null || value === '' ? '—' : value
}

function shipmentView(shipment) {
  return {
    currentHub: shipment.last_known_hub ?? shipment.current_hub ?? shipment.origin_hub,
    anomaly: shipment.deviation_type,
    severity: shipment.severity_score,
    status: shipment.status ?? shipment.current_status,
    confidence: shipment.confidence_percent_monte_carlo ?? shipment.confidence_percent,
  }
}

export default function ShipmentPreviewTable({ shipments = [] }) {
  if (!shipments.length) {
    return <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No affected shipments are available.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.1em] text-slate-400">
          <tr>
            <th className="px-3 py-3 font-medium">Shipment ID</th>
            <th className="px-3 py-3 font-medium">Current Hub</th>
            <th className="px-3 py-3 font-medium">Destination</th>
            <th className="px-3 py-3 font-medium">Anomaly</th>
            <th className="px-3 py-3 font-medium">Severity</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3 font-medium">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {shipments.map((shipment) => {
            const view = shipmentView(shipment)
            return (
              <tr key={shipment.shipment_id} className="transition hover:bg-slate-50">
                <td className="px-3 py-3 font-semibold text-teal-700">
                  <Link to={`/shipments/${encodeURIComponent(shipment.shipment_id)}`} className="hover:underline">
                    {shipment.shipment_id}
                  </Link>
                </td>
                <td className="px-3 py-3 text-slate-600">{valueOrDash(view.currentHub)}</td>
                <td className="px-3 py-3 text-slate-600">{valueOrDash(shipment.destination_hub)}</td>
                <td className="px-3 py-3 capitalize text-slate-600">{valueOrDash(view.anomaly?.replaceAll('_', ' '))}</td>
                <td className="px-3 py-3 tabular text-slate-600">{valueOrDash(view.severity)}</td>
                <td className="px-3 py-3"><StatusBadge value={view.status} /></td>
                <td className="px-3 py-3 tabular text-slate-600">{view.confidence == null ? '—' : `${Number(view.confidence).toFixed(1)}%`}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
