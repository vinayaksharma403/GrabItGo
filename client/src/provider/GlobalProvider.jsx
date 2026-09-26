import { useState, useCallback, useMemo } from 'react';
import Axios from '../utils/axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { useDispatch } from 'react-redux';
import { setAddressList } from '../store/addressSlice';
import { GlobalContext } from './GlobalContext';

const GlobalProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const fetchAddress = useCallback(async () => {
    try {
      const response = await Axios({
        ...SummaryApi.getAddress,
      });
      const { data: responseData } = response;
      if (responseData.success) {
        dispatch(setAddressList(responseData.data));
      }
    } catch (err) {
      AxiosToastError(err);
    }
  }, [dispatch]);

  const value = useMemo(
    () => ({
      isLoading,
      setIsLoading,
      error,
      setError,
      fetchAddress,
    }),
    [isLoading, error, fetchAddress]
  );

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
