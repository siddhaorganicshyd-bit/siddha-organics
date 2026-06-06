import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/layout/AdminSidebar.jsx'
import AdminTopBar from '../components/layout/AdminTopBar.jsx'

/**
 * Protected admin layout with sidebar and top bar.
 */
export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-col flex-1">
        <AdminTopBar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
