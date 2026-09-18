import { useEffect, useState } from 'react'
import { getHealth } from '../services/api'

export default function Topbar() {
  const [online, setOnline] = useState(false)

  useEffect(() => {
    let active = true
    getHealth().then(() => active && setOnline(true)).catch(() => active && setOnline(false))
    return () => {
      active = false
    }
  }, [])

  return (
    <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-5 py-4 md:px-8">
      <div>
        <p className="text-sm font-semibold text-slate-900">ExpireX</p>
        <p className="text-xs text-slate-500">Logistics Recovery Intelligence</p>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-400'}`} />
        {online ? 'System Online' : 'System Offline'}
      </div>
    </header>
  )
}
