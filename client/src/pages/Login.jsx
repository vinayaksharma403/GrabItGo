import React, { useState } from 'react'
import { FaRegEyeSlash } from "react-icons/fa6";
import { FaRegEye } from "react-icons/fa";
import toast from 'react-hot-toast';

import Axios from '../utils/axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useNavigate } from 'react-router-dom';
import fetchUserDetails from '../utils/fetchUserDetails';
import { useDispatch } from 'react-redux';
import { setUserDetails } from '../store/userSlice';



const Login = () => {
  const [data, setData] = useState({
    
    email: "",
    password: "",
    
  })

  const [showPassword, setShowPassword] = useState(false)
  
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleChange = (e) => {
    const { name, value } = e.target

    setData((prev) => {
      return {
        ...prev,
        [name]: value
      }

    })
  }

  const validValue = Object.values(data).every(el => el)

  const handleSubmit = async (e) => {
    e.preventDefault()

    

    try {
      const response = await Axios({
        ...SummaryApi.login,
        data: data
      })

      if (response.data.error) {
        toast.error(response.data.message)
      }

      if (response.data.success) {
        toast.success(response.data.message)
        localStorage.removeItem('accesstoken');

        localStorage.setItem('accessToken',response.data.data.accessToken)
        localStorage.setItem('refreshToken',response.data.data.refreshToken)

        const userDetails = await fetchUserDetails()
        dispatch(setUserDetails(userDetails.data))

        setData({
          
          email: "",
          password: "",
          
        })
        navigate("/")
      }

    } catch (error) {
      AxiosToastError(error)
    }




  }
  return (
    <section className=' w-full container mx-auto px-2'>
      <div className='bg-white my-4 w-full max-w-lg mx-auto rounded p-7'>
        

        <form className='grid gap-4 py-4' onSubmit={handleSubmit}>
          

          <div className='grid gap-1'>
            <label htmlFor="email">Email : </label>
            <input
              type="email"
              id='email'

              className='bg-blue-50 p-2 border rounded outline-none focus:border-amber-600'
              name='email'
              value={data.email}
              onChange={handleChange}
              placeholder='Enter your email'
            />
          </div>

          <div className='grid gap-1'>
            <label htmlFor="password">Password : </label>
            <div className='bg-blue-50 p-2 border rounded flex items-center focus-within:border-amber-600'>
              <input
                type={showPassword ? "text" : "password"}
                id='password'

                className='w-full outline-none'
                name='password'
                value={data.password}
                onChange={handleChange}
                placeholder='Enter your password'


              />

              <div onClick={() => setShowPassword(prev => !prev)} className='cursor-pointer'>
                {
                  showPassword ? (
                    <FaRegEye />
                  ) : (
                    <FaRegEyeSlash />

                  )
                }

              </div>
            </div>
            <Link to={"/forgot-password"} className='block ml-auto hover:text-amber-500'>Forgot password ?</Link>
          </div>

          

          <button disabled={!validValue} className={`${validValue ? "bg-green-800 hover:bg-green-700" : " bg-gray-500"} text-white py-2 rounded font-semibold my-3 tracking-wide`}>Login</button>
        </form>

        <p>
          Don't have account ? <Link to={"/register"}
            className='font-semibold text-green-800 hover:text-green-700'>Register</Link>
        </p>
      </div>

    </section>
  )
}

export default Login

