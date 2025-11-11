import React from 'react'
import { IoClose } from 'react-icons/io5'

const ConfirmBox = ({ cancel, confirm, close }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-2 mb-3">
          <h1 className="text-lg font-semibold text-gray-800">Permanent Delete</h1>
          <button
            onClick={close}
            className="text-gray-500 hover:text-red-500 transition cursor-pointer"
          >
            <IoClose size={25} />
          </button>
        </div>

        {/* Body */}
        <p className="text-gray-600 mb-6">
          Are you sure you want to permanently delete this item? This action cannot be undone.
        </p>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={cancel}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmBox
