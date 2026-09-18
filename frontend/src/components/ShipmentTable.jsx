import { Link, useNavigate } from 'react-router-dom'
import AnomalyBadge from './AnomalyBadge'
import ConfidenceIndicator from './ConfidenceIndicator'
import StatusBadge from './StatusBadge'

function currentHub(shipment) {
  return shipment.last_known_hub ?? shipment.current_hub ?? '—'
}

function severityValue(shipment) {
  return shipment.severity_score == null || Number.isNaN(Number(shipment.severity_score))
    ? null
    : Number(shipment.severity_score)
}

export default function ShipmentTable({ shipments, sortKey, sortDirection, onSort }) {
  const navigate = useNavigate()

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-[0.1em] text-slate-400">
          <tr>
            <SortableHeader label="Shipment ID" sortKey="shipment_id" activeKey={sortKey} direction={sortDirection} onSort={onSort} />
            <th className="px-3 py-3 font-medium">Original Hub</th>
            <th className="px-3 py-3 font-medium">Current Hub</th>
            <th className="px-3 py-3 font-medium">Destination</th>
            <SortableHeader label="Priority" sortKey="priority" activeKey={sortKey} direction={sortDirection} onSort={onSort} />
            <th className="px-3 py-3 font-medium">Anomaly</th>
            <SortableHeader label="Severity" sortKey="severity" activeKey={sortKey} direction={sortDirection} onSort={onSort} />
            <th className="px-3 py-3 font-medium">Status</th>
            <SortableHeader label="Confidence" sortKey="confidence" activeKey={sortKey} direction={sortDirection} onSort={onSort} />
            <th className="px-3 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {shipments.map((shipment) => {
            const confidence = shipment.confidence_percent_monte_carlo ?? shipment.confidence_percent
            const status = shipment.status ?? shipment.current_status
            const severity = severityValue(shipment)
            return (
              <tr
                key={shipment.shipment_id}
                className="group cursor-pointer transition hover:bg-teal-50/30"
                onClick={() => navigate(`/shipments/${encodeURIComponent(shipment.shipment_id)}`)}
              >
                <td className="px-3 py-3.5 font-semibold text-teal-700">
                  <Link className="hover:underline" to={`/shipments/${encodeURIComponent(shipment.shipment_id)}`}>
                    {shipment.shipment_id}
                  </Link>
                </td>
                <td className="px-3 py-3.5 text-slate-600">{shipment.origin_hub || '—'}</td>
                <td className="px-3 py-3.5 text-slate-600">{currentHub(shipment)}</td>
                <td className="px-3 py-3.5 text-slate-600">{shipment.destination_hub || '—'}</td>
                <td className="px-3 py-3.5 tabular text-slate-600">{shipment.priority ?? '—'}</td>
                <td className="px-3 py-3.5"><AnomalyBadge value={shipment.deviation_type} /></td>
                <td className="px-3 py-3.5 tabular text-slate-600">{severity == null ? '—' : severity}</td>
                <td className="px-3 py-3.5"><StatusBadge value={status} /></td>
                <td className="px-3 py-3.5"><ConfidenceIndicator value={confidence} /></td>
                <td className="px-3 py-3.5 text-right">
                  <Link className="whitespace-nowrap text-sm font-semibold text-teal-700 opacity-80 transition group-hover:opacity-100 hover:underline" to={`/shipments/${encodeURIComponent(shipment.shipment_id)}`}>
                    View Details →
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SortableHeader({ label, sortKey, activeKey, direction, onSort }) {
  const active = activeKey === sortKey
  return (
    <th className="px-3 py-3 font-medium">
      <button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 hover:text-slate-700">
        {label}
        <span className="text-[10px]">{active ? (direction === 'asc' ? '↑' : '↓') : '↕'}</span>
      </button>
    </th>
  )
}
