import { Link, NavLink } from 'react-router-dom'

const links = [
  { label: 'Dashboard', to: '/', icon: '▦' },
  { label: 'Shipments', to: '/shipments', icon: '▤' },
  { label: 'Digital Twin', to: '/digital-twin', icon: '⌖' },
  { label: 'Analytics', to: '/analytics', icon: '◒' },
]

export default function Sidebar() {
  return (
    <aside className="relative z-20 flex w-full flex-col border-b border-slate-200 bg-slate-950 text-slate-300 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:border-slate-800">
      <Link to="/" className="flex items-center gap-3 px-6 py-5" aria-label="ExpireX dashboard">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500 font-bold text-slate-950">X</div>
        <div>
          <p className="font-semibold tracking-tight text-white">ExpireX</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Operations</p>
        </div>
      </Link>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:py-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex min-w-fit items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive ? 'bg-teal-500/15 font-medium text-teal-300' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
              }`
            }
          >
            <span className="w-5 text-center text-base">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
