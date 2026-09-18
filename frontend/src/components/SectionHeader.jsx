export default function SectionHeader({ eyebrow, title, detail, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
        {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
      </div>
      {action}
    </div>
  )
}
