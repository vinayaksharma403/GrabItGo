import React, { useState } from 'react'
import { FaCircleUser } from 'react-icons/fa6'
import { useDispatch, useSelector } from 'react-redux'
import Axios from '../utils/axios'
import SummaryApi from '../common/SummaryApi'
// import { set } from 'mongoose'
import AxiosToastError from '../utils/AxiosToastError'
import { updateAvatar } from '../store/userSlice'
import { IoClose } from "react-icons/io5";


const UserProfileAvatarEdit = ({close}) => {
    const user = useSelector(state => state.user)
    const dispatch = useDispatch()
    const [loading, setLoading] = useState(false)
    const handleSubmit = (e) => {
        e.preventDefault()
    }

    const handleUploadAvatarImage = async (e) => {
        const file = e.target.files[0]

        if (!file) {
            return
        }

        const formData = new FormData()
        formData.append('avatar', file)


        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.uploadAvatar,
                data: formData



            })
            const { data: responseData } = response
            dispatch(updateAvatar(responseData.data.avatar))

        } catch (error) {
            AxiosToastError(error)
        } finally {

            setLoading(false)
        }


    }
    return (
        <section className='fixed top-0 bottom-0 left-0 right-0 inset-0 bg-neutral-900/60 p-4 flex items-center justify-center'>

            <div className='bg-white max-w-sm w-full rounded p-4 flex flex-col items-center justify-center'>
                <button onClick={close} className='text-neutral-700 w-fit block ml-auto cursor-pointer'>
                    <IoClose size={20} />
                </button>
                <div className='w-20 h-20 flex items-center justify-center rounded-full overflow-hidden drop-shadow-sm'>
                    {
                        user.avatar ? (
                            <img
                                alt={user.name}
                                src={user.avatar}
                                className='w-full h-full'
                            />
                        ) : (

                            <FaCircleUser size={65} />
                        )
                    }
                </div>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="uploadProfile">
                        <div className='border-amber-300 hover:bg-amber-500 px-4 py-1 rounded text-sm my-3 cursor-pointer'>{loading ? "loading..." : "upload"}</div>
                        <input onChange={handleUploadAvatarImage} type="file" id='uploadProfile' className='hidden' />
                    </label>
                </form>


            </div>

        </section>
    )
}

export default UserProfileAvatarEdit
