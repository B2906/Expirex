export default function StatCard({ label, value, detail, tone = 'default' }) {
  const tones = {
    default: 'text-slate-950',
    teal: 'text-teal-700',
    amber: 'text-amber-700',
    blue: 'text-blue-700',
    red: 'text-red-700',
  }

  return (
    <article className="panel p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-4 text-3xl font-semibold tracking-tight ${tones[tone] || tones.default}`}>{value}</p>
      {detail && <p className="mt-2 text-xs text-slate-500">{detail}</p>}
    </article>
  )
}
