import React from 'react'
import { IoClose } from 'react-icons/io5'

const ViewImage = ({ url, close }) => {
  if (!url) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      {/* Close Button */}
      <button
        onClick={close}
        className="absolute top-5 right-5 text-white text-3xl hover:text-amber-400 transition cursor-pointer"
      >
        <IoClose />
      </button>

      {/* Image */}
      <div className="max-w-5xl max-h-[90vh]">
        <img
          src={url}
          alt="Full View"
          className="w-full h-full object-contain rounded-lg shadow-lg"
        />
      </div>
    </div>
  )
}

export default ViewImage
