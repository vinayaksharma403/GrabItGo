import { createContext, useContext, useState } from 'react'

const GlobalContext = createContext()

export const useGlobalContext = () => {
  return useContext(GlobalContext)
}

const GlobalProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const value = {
    isLoading,
    setIsLoading,
    error,
    setError
  }

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  )
}

export default GlobalProvider
