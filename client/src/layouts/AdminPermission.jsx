import React from 'react'
import { useSelector } from 'react-redux'
import isAdmin from '../utils/isAdmin'
import { ShieldAlert } from 'lucide-react'

const AdminPermission = ({ children }) => {
  const user = useSelector((state) => state.user)

  if (!isAdmin(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="bg-red-100 text-red-600 p-4 rounded-full mb-3">
          <ShieldAlert size={36} />
        </div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Access Denied
        </h2>
        <p className="text-sm text-gray-500 max-w-sm">
          You don’t have permission to view this page. Please contact your administrator if you believe this is a mistake.
        </p>
      </div>
    )
  }

  return <>{children}</>
}

export default AdminPermission
