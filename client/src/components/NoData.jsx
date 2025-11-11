import React from 'react'
import NoDataImage from '../assets/Nothing here yet.png'

const NoData = () => {
  return (
    <div className='flex flex-col items-center justify-center p-4 gap-2'>
      <img
        src={NoDataImage}
        alt='No Data'
        className='w-36'
      />
      <p className='text-neutral-500'>No Data Available</p>
    </div>
  )
}

export default NoData
