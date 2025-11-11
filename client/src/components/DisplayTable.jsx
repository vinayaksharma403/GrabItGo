import React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender
} from '@tanstack/react-table'
import { FiEdit, FiTrash2 } from 'react-icons/fi'

const DisplayTable = ({ columns = [], data = [], onEdit, onDelete }) => {
  // ✅ Safe handling
  const safeColumns = Array.isArray(columns) ? columns : []
  const safeData = Array.isArray(data) ? data : []

  // ✅ Add Sr. No + Action columns dynamically
  const extendedColumns = [
    {
      header: 'Sr. No',
      cell: (info) => info.row.index + 1, // starts from 1
    },
    ...safeColumns,
    {
      header: 'Action',
      cell: ({ row }) => (
        <div className="flex gap-3">
          <button
            onClick={() => onEdit?.(row.original)}
            className=  "text-green-600 hover:text-green-800 transition cursor-pointer "
            title="Edit"
          >
            <FiEdit size={18} />
          </button>
          <button
            onClick={() => onDelete?.(row.original)}
            className="text-red-600 hover:text-red-800 transition cursor-pointer "
            title="Delete"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    columns: extendedColumns,
    data: safeData,
    getCoreRowModel: getCoreRowModel(),
  })

  if (!safeData.length) {
    return (
      <div className="text-center text-gray-500 py-4">
        No data available
      </div>
    )
  }

  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full border border-gray-300 bg-white rounded-lg shadow">
        <thead className="bg-amber-100">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="text-left py-2 px-3 border-b font-semibold">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="hover:bg-amber-50">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="py-2 px-3 border-b">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DisplayTable
