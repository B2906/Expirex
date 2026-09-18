import { Link } from 'react-router-dom'

const pipelineStages = [
  'Detection results',
  'Recovery paths',
  'Auction / allocation',
  'Monte Carlo confidence',
  'Explainability',
]

const applicationSurfaces = [
  { label: 'Dashboard', to: '/', description: 'Control view' },
  { label: 'Shipments', to: '/shipments', description: 'Investigate records' },
  { label: 'Digital Twin', to: '/digital-twin', description: 'Map the network' },
  { label: 'Analytics', to: '/analytics', description: 'Review outcomes' },
]

export default function PipelineFlow() {
  return (
    <article className="panel overflow-hidden p-5 md:p-6">
      <div className="mb-5">
        <p className="eyebrow">Pipeline architecture</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">From detection to operational intelligence</h2>
        <p className="mt-1 text-sm text-slate-500">Persisted recovery decisions flow through the API into each ExpireX investigation surface.</p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[760px] items-center gap-2">
          {pipelineStages.map((stage, index) => (
            <div key={stage} className="flex items-center gap-2">
              <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-center text-xs font-semibold text-teal-800 shadow-sm">
                {stage}
              </div>
              {index < pipelineStages.length - 1 && <span aria-hidden="true" className="text-lg text-slate-300">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="my-4 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">FastAPI</span>
        <span className="text-lg text-slate-300">↓</span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">React</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <nav aria-label="ExpireX application surfaces" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {applicationSurfaces.map((surface) => (
          <Link
            key={surface.label}
            to={surface.to}
            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-teal-300 hover:bg-teal-50/60"
          >
            <span className="block text-sm font-semibold text-slate-900">{surface.label}</span>
            <span className="mt-1 block text-xs text-slate-500">{surface.description}</span>
          </Link>
        ))}
      </nav>
    </article>
  )
}
