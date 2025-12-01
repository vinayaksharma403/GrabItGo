import { createContext, useContext, useState } from 'react'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import { useDispatch } from 'react-redux'
import { setAddressList } from '../store/addressSlice'

const GlobalContext = createContext()

export const useGlobalContext = () => {
  return useContext(GlobalContext)
}

const GlobalProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const dispatch = useDispatch()

  const fetchAddress = async () => {
    try {
      const response = await Axios({
        ...SummaryApi.getAddress
      })
      const { data: responseData } = response
      if (responseData.success) {
        dispatch(setAddressList(responseData.data))
      }
    } catch (error) {
      AxiosToastError(error)
    }
  }

  const value = {
    isLoading,
    setIsLoading,
    error,
    setError,
    fetchAddress
  }

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  )
}

export default GlobalProvider
