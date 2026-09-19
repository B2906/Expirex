import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import SectionHeader from '../components/SectionHeader'
import StatusBadge from '../components/StatusBadge'
import { getHubs, getMisplaced, getRecovery, getRecoveryForShipment, getRoutes, getShipments } from '../services/api'
import { buildSeverityPercentiles, rawSeverityLabel, severityPercentileLabel } from '../utils/severity'
import { assessShipment } from '../utils/confidence'
import { DecisionAssessmentBadge } from '../components/StatusBadge'

function routeIds(value) {
  if (Array.isArray(value)) return value.map((item) => typeof item === 'object' ? item.route_id : item).filter(Boolean)
  if (typeof value !== 'string') return []
  return [...value.matchAll(/route_id['"]?\s*:\s*['"]([^'"]+)/g)].map((match) => match[1])
}

function routeCoordinates(route, hubsById) {
  const origin = hubsById.get(route.origin_hub)
  const destination = hubsById.get(route.destination_hub)
  return origin && destination ? [[origin.lat, origin.lon], [destination.lat, destination.lon]] : null
}

function MapViewport({ mapRef, focusedHubs }) {
  const map = useMap()

  useEffect(() => {
    mapRef.current = map
  }, [map, mapRef])

  useEffect(() => {
    if (focusedHubs.length > 1) {
      map.fitBounds(focusedHubs.map((hub) => [hub.lat, hub.lon]), { padding: [48, 48], maxZoom: 8 })
    } else if (focusedHubs.length === 1) {
      map.setView([focusedHubs[0].lat, focusedHubs[0].lon], 8)
    }
  }, [focusedHubs, map])

  return null
}

function MarkerColor({ hubId, selected }) {
  if (selected.destination === hubId) return '#dc2626'
  if (selected.current === hubId) return '#f59e0b'
  if (selected.origin === hubId) return '#0d9488'
  return '#334155'
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium capitalize text-slate-700">{value}</dd>
    </div>
  )
}

function Legend({ color, label, line = false }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={line ? `h-0.5 w-4 ${color}` : `h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  )
}

export default function DigitalTwin() {
  const navigate = useNavigate()
  const mapRef = useRef(null)
  const [hubs, setHubs] = useState([])
  const [routes, setRoutes] = useState([])
  const [shipments, setShipments] = useState([])
  const [misplaced, setMisplaced] = useState([])
  const [recoveryRecords, setRecoveryRecords] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [search, setSearch] = useState('')
  const [mapFilter, setMapFilter] = useState('all')
  const [showNormalRoutes, setShowNormalRoutes] = useState(true)
  const [showRecoveryPaths, setShowRecoveryPaths] = useState(true)
  const [recovery, setRecovery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    Promise.all([getHubs(), getRoutes(), getShipments(), getMisplaced(), getRecovery()])
      .then(([hubData, routeData, shipmentData, misplacedData, recoveryData]) => {
        if (!active) return
        const records = Array.isArray(shipmentData) ? shipmentData : []
        setHubs(Array.isArray(hubData) ? hubData : [])
        setRoutes(Array.isArray(routeData) ? routeData : [])
        setShipments(records)
        setMisplaced(Array.isArray(misplacedData) ? misplacedData : [])
        setRecoveryRecords(Array.isArray(recoveryData) ? recoveryData : [])
        const firstAffected = records.find((shipment) => shipment.deviation_type || shipment.status === 'ALLOCATED')
        setSelectedId(firstAffected?.shipment_id ?? records[0]?.shipment_id ?? '')
      })
      .catch(() => active && setError('Unable to load the logistics network from the ExpireX backend.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedId) return undefined
    let active = true
    setRecoveryLoading(true)
    getRecoveryForShipment(selectedId)
      .then((data) => active && setRecovery(data))
      .catch(() => active && setRecovery(null))
      .finally(() => active && setRecoveryLoading(false))
    return () => { active = false }
  }, [selectedId])

  const hubsById = useMemo(() => new Map(hubs.map((hub) => [hub.hub_id, hub])), [hubs])
  const misplacedByShipment = useMemo(
    () => new Map(misplaced.map((event) => [event.shipment_id, event])),
    [misplaced],
  )
  const selectedShipment = shipments.find((shipment) => shipment.shipment_id === selectedId)
  const selected = useMemo(() => {
    const anomaly = selectedShipment && (selectedShipment.last_known_hub
      ? selectedShipment
      : misplacedByShipment.get(selectedShipment.shipment_id))
    const assignment = recovery?.assignments?.[0]
    return {
      origin: selectedShipment?.origin_hub,
      current: anomaly?.last_known_hub ?? selectedShipment?.current_hub,
      destination: selectedShipment?.destination_hub,
      routeIds: routeIds(assignment?.selected_path),
      assignment,
    }
  }, [misplacedByShipment, recovery, selectedShipment])

  const selectedRouteSet = useMemo(() => new Set(selected.routeIds), [selected.routeIds])
  const recoveryShipmentIds = useMemo(
    () => new Set(recoveryRecords.map((record) => record.shipment_id).filter(Boolean)),
    [recoveryRecords],
  )
  const selectedRoutes = useMemo(
    () => routes.filter((route) => selectedRouteSet.has(route.route_id)),
    [routes, selectedRouteSet],
  )
  const selectedHubs = useMemo(
    () => [selected.origin, selected.current, selected.destination]
      .map((id) => hubsById.get(id))
      .filter(Boolean),
    [hubsById, selected.current, selected.destination, selected.origin],
  )
  const filteredShipments = useMemo(() => {
    const query = search.trim().toLowerCase()
    return shipments.filter((shipment) => {
      const affected = Boolean(shipment.deviation_type || misplacedByShipment.has(shipment.shipment_id))
      const hasRecovery = recoveryShipmentIds.has(shipment.shipment_id)
      return (!query || String(shipment.shipment_id).toLowerCase().includes(query)) &&
          (mapFilter === 'all' ||
            (mapFilter === 'affected' && affected) ||
            (mapFilter === 'recovery' && hasRecovery) ||
            mapFilter === 'hubs' ||
            mapFilter === 'routes')
    })
  }, [mapFilter, misplacedByShipment, recoveryShipmentIds, search, shipments])

  const visibleRoutes = useMemo(
    () => {
      if (mapFilter === 'hubs') return []
      return routes.filter((route) => {
        if (mapFilter === 'recovery' && !selectedRouteSet.has(route.route_id)) return false
        return showNormalRoutes || selectedRouteSet.has(route.route_id)
      })
    },
    [mapFilter, routes, selectedRouteSet, showNormalRoutes],
  )

  function fitNetwork() {
    if (hubs.length > 1) {
      mapRef.current?.fitBounds(hubs.map((hub) => [hub.lat, hub.lon]), { padding: [48, 48] })
    }
  }

  function focusSelected() {
    if (selectedHubs.length > 0) {
      mapRef.current?.fitBounds(selectedHubs.map((hub) => [hub.lat, hub.lon]), { padding: [72, 72], maxZoom: 9 })
    }
  }

  if (loading) return <Loading label="Loading logistics network" />
  if (error) return <ErrorState message={error} />

  const selectedConfidence = selectedShipment?.confidence_percent_monte_carlo ?? selectedShipment?.confidence_percent
  const selectedAllocationStatus = selectedShipment?.status ?? 'UNRESOLVED'
  const selectedAnomaly = selectedShipment?.deviation_type
  const severityPercentile = buildSeverityPercentiles(shipments.filter((shipment) => shipment.deviation_type)).get(selectedId)
  const selectedPath = selected.assignment
  const decision = assessShipment(selectedShipment || {})

  return (
    <section className="space-y-8">
      <header>
        <p className="eyebrow">Network activity</p>
        <h1 className="page-title">Logistics Digital Twin</h1>
        <p className="page-description">Investigate hubs, movement routes, misplaced shipments, and persisted recovery decisions.</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <article className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5 md:p-6">
            <SectionHeader
              eyebrow="Live network view"
              title={`${hubs.length} hubs · ${routes.length} routes`}
              detail="Select a shipment to highlight its actual recovery route."
            />
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <label>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Search shipment</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by shipment ID..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Shipment focus</span>
                <select
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                >
                  {filteredShipments.map((shipment) => (
                    <option key={shipment.shipment_id} value={shipment.shipment_id}>{shipment.shipment_id} · {shipment.origin_hub} → {shipment.destination_hub}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <label className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Filter</span>
                <select value={mapFilter} onChange={(event) => setMapFilter(event.target.value)} className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm">
                  <option value="all">All hubs & routes</option>
                  <option value="hubs">All hubs</option>
                  <option value="routes">All routes</option>
                  <option value="affected">Affected shipments</option>
                  <option value="recovery">Recovery paths</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={showNormalRoutes} onChange={(event) => setShowNormalRoutes(event.target.checked)} className="accent-teal-600" />
                Show normal routes
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={showRecoveryPaths} onChange={(event) => setShowRecoveryPaths(event.target.checked)} className="accent-teal-600" />
                Show recovery paths
              </label>
              <button type="button" onClick={fitNetwork} className="font-semibold text-teal-700 hover:underline">Fit network</button>
              <button type="button" onClick={focusSelected} className="font-semibold text-teal-700 hover:underline">Focus shipment</button>
            </div>
          </div>
          <div className="relative h-[560px]">
            <MapContainer center={[17.1, 77.4]} zoom={6} scrollWheelZoom className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapViewport mapRef={mapRef} focusedHubs={selectedHubs} />
              {visibleRoutes.map((route) => {
                const positions = routeCoordinates(route, hubsById)
                if (!positions) return null
                const highlighted = showRecoveryPaths && selectedRouteSet.has(route.route_id)
                return (
                  <Polyline
                    key={route.route_id}
                    positions={positions}
                    pathOptions={{
                      color: highlighted ? '#0d9488' : '#94a3b8',
                      weight: highlighted ? 6 : 1.5,
                      opacity: highlighted ? 0.95 : 0.32,
                      dashArray: highlighted ? '8 6' : undefined,
                    }}
                  >
                    <Tooltip sticky>{route.route_id} · {route.origin_hub} → {route.destination_hub}</Tooltip>
                    <Popup>
                      <strong>{route.route_id}</strong>
                      <br />{route.origin_hub} → {route.destination_hub}
                      <br />Capacity: {route.total_capacity_kg ?? '—'} kg
                      <br />Spare: {route.spare_capacity_kg ?? '—'} kg
                      <br />Cost: {route.cost_per_kg == null ? '—' : `$${route.cost_per_kg}/kg`}
                    </Popup>
                  </Polyline>
                )
              })}
              {mapFilter !== 'routes' && hubs.map((hub) => {
                const color = MarkerColor({ hubId: hub.hub_id, selected })
                const isSelected = selectedHubs.some((selectedHub) => selectedHub.hub_id === hub.hub_id)
                return (
                  <CircleMarker
                    key={hub.hub_id}
                    center={[hub.lat, hub.lon]}
                    radius={isSelected ? 10 : 6}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: 2 }}
                  >
                    <Tooltip direction="top">{hub.hub_id} · {hub.name}</Tooltip>
                    <Popup>
                      <strong>{hub.hub_id} · {hub.name}</strong>
                      <br />Location: {hub.lat}, {hub.lon}
                      <br />Capacity: {hub.capacity_per_hour ?? '—'} kg/h
                      <br />Processing delay: {hub.avg_processing_delay_min ?? '—'} min
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
            <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] flex max-w-[calc(100%-2rem)] flex-wrap gap-2 rounded-lg border border-slate-200 bg-white/90 p-2 text-xs shadow-sm backdrop-blur">
              <Legend color="bg-teal-600" label="Original hub" />
              <Legend color="bg-amber-500" label="Current / misplaced" />
              <Legend color="bg-red-600" label="Destination" />
              <Legend color="bg-slate-500" label="Hub" />
              <Legend color="bg-slate-400" label="Normal route" line />
              <Legend color="bg-teal-600" label="Selected recovery" line />
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <article className="panel p-5 md:p-6">
            <SectionHeader eyebrow="Selected shipment" title={selectedId || 'No shipment selected'} />
            {selectedShipment ? (
              <>
                <dl className="space-y-4">
                  <Info label="Original hub" value={selected.origin ?? '—'} />
                  <Info label="Current hub" value={selected.current ?? '—'} />
                  <Info label="Destination" value={selected.destination ?? '—'} />
                  <Info label="Anomaly" value={selectedAnomaly ? selectedAnomaly.replaceAll('_', ' ') : 'No anomaly'} />
                  <Info label="Relative Severity Percentile" value={severityPercentileLabel(severityPercentile)} />
                  <Info label="Raw Severity Score" value={rawSeverityLabel(selectedShipment.severity_score)} />
                  <Info label="Allocation Status" value={<StatusBadge value={selectedAllocationStatus} />} />
                  <Info label="Monte Carlo Confidence" value={selectedConfidence == null ? 'CONFIDENCE UNAVAILABLE' : `${selectedConfidence}%`} />
                  <Info label="Assessment" value={<DecisionAssessmentBadge value={decision.decisionAssessment} />} />
                </dl>
                <Link to={`/shipments/${encodeURIComponent(selectedId)}`} className="mt-6 block text-sm font-semibold text-teal-700 hover:underline">
                  View Full Details →
                </Link>
              </>
            ) : <p className="text-sm text-slate-500">No shipment records are available.</p>}
          </article>
          <article className="panel p-5 md:p-6">
            <SectionHeader eyebrow="Recovery path" title={recoveryLoading ? 'Loading recovery…' : 'Selected allocation'} />
            {selectedPath ? (
              <dl className="space-y-4">
                <Info label="Route IDs" value={selected.routeIds.length ? selected.routeIds.join(' → ') : '—'} />
                <Info label="Number of hops" value={selectedPath.num_hops ?? '—'} />
                <Info label="Path score" value={selectedPath.path_score ?? '—'} />
                <Info label="Recovery cost" value={selectedPath.total_cost == null ? '—' : `$${selectedPath.total_cost}`} />
                <Info label="Allocation status" value={<StatusBadge value={selectedPath.status} />} />
                <Info label="Fallback used" value={selectedPath.fallback_used == null ? '—' : selectedPath.fallback_used ? 'Yes' : 'No'} />
              </dl>
            ) : <p className="text-sm text-slate-500">No recovery path available for this shipment.</p>}
          </article>
        </aside>
      </div>
    </section>
  )
}
