export default function ShipmentFilters({
  search,
  onSearchChange,
  anomaly,
  onAnomalyChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  severity,
  onSeverityChange,
  anomalyOptions,
  statusOptions,
  priorityOptions,
  onClear,
  hasFilters,
}) {
  return (
    <div className="space-y-4 border-b border-slate-200 p-5 md:p-6">
      <label className="block">
        <span className="sr-only">Search shipments</span>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by shipment ID, hub, or destination..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
        />
      </label>
      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect label="Anomaly" value={anomaly} onChange={onAnomalyChange} options={anomalyOptions} />
        <FilterSelect label="Status" value={status} onChange={onStatusChange} options={statusOptions} />
        <FilterSelect label="Priority" value={priority} onChange={onPriorityChange} options={priorityOptions} />
        <FilterSelect
          label="Severity"
          value={severity}
          onChange={onSeverityChange}
          options={[
            { value: 'all', label: 'All severity' },
            { value: 'available', label: 'Severity available' },
            { value: 'unavailable', label: 'No severity' },
          ]}
        />
        {hasFilters && (
          <button type="button" onClick={onClear} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50">
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="flex min-w-[145px] flex-1 flex-col gap-1.5 sm:flex-none">
      <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm capitalize text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  )
}
