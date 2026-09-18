export default function Loading({ label = 'Loading' }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
      <span>{label}...</span>
    </div>
  )
}
