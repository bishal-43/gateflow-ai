import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ToastContainer } from '@/components/ui/Toast'
import { MockBanner } from '@/components/ui/MockBanner'

export function DashboardLayout({ children, title, subtitle }) {
  return (
    <div className="flex h-screen flex-col bg-gray-950">
      <MockBanner />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: hidden on mobile, shown on md+ */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden w-full md:w-auto">
          <TopBar title={title} subtitle={subtitle} />
          <main 
            className="flex-1 overflow-y-auto p-4 sm:p-6 dark:bg-gray-950" 
            id="main-content"
          >
            {children}
          </main>
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}
