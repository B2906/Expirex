import { Outlet } from 'react-router-dom'
import Canvas3DBackground from './Canvas3DBackground'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <Canvas3DBackground active enableScrollMapping={false} />
      <Sidebar />
      <div className="relative z-10 min-w-0 flex-1">
        <Topbar />
        <main className="mx-auto max-w-[1440px] p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
