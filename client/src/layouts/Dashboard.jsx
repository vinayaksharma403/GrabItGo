import React from 'react'
import UserMenu from '../components/UserMenu'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Dashboard = () => {
  const user = useSelector(state => state.user)
  console.log("user dashboard",user)
  return (
    <section className="bg-white min-h-screen w-full flex">

      {/* Sidebar */}
      <aside className="w-[250px] bg-gray-100 border-r border-gray-300 p-4 fixed left-0 top-[80px] bottom-[60px] overflow-y-auto">
        {/* top-[80px] ensures it sits just below your header (which is 80px tall) */}
        <UserMenu />
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-6 min-h-screen ml-[250px] pt-[60px] ">
        {/* pt-[90px] gives breathing space so heading never hides behind header */}
        <Outlet />
      </main>

    </section>
  )
}

export default Dashboard
