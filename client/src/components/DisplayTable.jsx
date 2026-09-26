import React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender
} from '@tanstack/react-table'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'

const DisplayTable = ({ columns = [], data = [], onEdit, onDelete }) => {
  const safeColumns = Array.isArray(columns) ? columns : []
  const safeData = Array.isArray(data) ? data : []

  // Add Sr. No + Action columns dynamically
  const extendedColumns = [
    {
      header: 'Sr.',
      cell: (info) => (
        <span className='text-xs font-semibold text-slate-400'>
          {info.row.index + 1}
        </span>
      )
    },
    ...safeColumns,
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className='flex items-center gap-1.5'>
          <button
            type='button'
            onClick={() => onEdit?.(row.original)}
            className='p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer'
            title='Edit'
            aria-label='Edit item'
          >
            <FiEdit2 size={15} />
          </button>
          <button
            type='button'
            onClick={() => onDelete?.(row.original)}
            className='p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer'
            title='Delete'
            aria-label='Delete item'
          >
            <FiTrash2 size={15} />
          </button>
        </div>
      )
    }
  ]

  const table = useReactTable({
    columns: extendedColumns,
    data: safeData,
    getCoreRowModel: getCoreRowModel()
  })

  if (!safeData.length) {
    return (
      <div className='text-center text-slate-500 py-8 bg-white rounded-2xl border border-slate-200/80 p-6'>
        <p className='text-sm'>No records available</p>
      </div>
    )
  }

  return (
    <div className='overflow-x-auto bg-white rounded-2xl border border-slate-200/80 shadow-card'>
      <table className='min-w-full divide-y divide-slate-100 text-left'>
        <thead className='bg-slate-50/80'>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className='py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600'
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className='divide-y divide-slate-100 text-xs sm:text-sm text-slate-700'>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className='hover:bg-slate-50/70 transition-colors'>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className='py-3 px-4 align-middle'>
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
