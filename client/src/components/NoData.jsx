import React from 'react'
import { LuInbox } from "react-icons/lu";
import { Link } from 'react-router-dom';

const NoData = ({
  title = "No Data Available",
  description = "There are no items to display at this moment.",
  icon: CustomIcon,
  actionText,
  actionHref,
  onAction,
}) => {
  const IconComponent = CustomIcon || LuInbox

  return (
    <div className='flex flex-col items-center justify-center py-12 px-4 text-center max-w-sm mx-auto animate-fadeIn' role="region" aria-label={title}>
      <div className='w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-subtle'>
        <IconComponent size={32} />
      </div>
      <h3 className='text-base font-semibold text-slate-800 mb-1.5'>{title}</h3>
      <p className='text-sm text-slate-500 mb-5 leading-relaxed'>{description}</p>

      {actionHref ? (
        <Link to={actionHref} className='btn-primary'>
          {actionText}
        </Link>
      ) : onAction ? (
        <button type="button" onClick={onAction} className='btn-primary'>
          {actionText}
        </button>
      ) : null}
    </div>
  )
}

export default NoData

