import { useState, useCallback, useMemo } from 'react';
import Axios from '../utils/axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { useDispatch } from 'react-redux';
import { setAddressList } from '../store/addressSlice';
import { updateCart } from '../store/userSlice';
import { GlobalContext } from './GlobalContext';

const GlobalProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const fetchAddress = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return [];

      const response = await Axios({
        ...SummaryApi.getAddress,
      });
      const { data: responseData } = response;
      if (responseData.success) {
        const addressData = responseData.data || [];
        dispatch(setAddressList(addressData));
        return addressData;
      }
      return [];
    } catch (err) {
      if (err?.response?.status !== 401) {
        AxiosToastError(err);
      }
      return [];
    }
  }, [dispatch]);

  const fetchCart = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return [];

      const response = await Axios({
        ...SummaryApi.getCart,
      });
      const { data: responseData } = response;
      if (responseData.success) {
        const cartData = responseData.data || [];
        dispatch(updateCart(cartData));
        return cartData;
      }
      return [];
    } catch (err) {
      if (err?.response?.status !== 401) {
        AxiosToastError(err);
      }
      return [];
    }
  }, [dispatch]);

  const value = useMemo(
    () => ({
      isLoading,
      setIsLoading,
      error,
      setError,
      fetchAddress,
      fetchCart,
    }),
    [isLoading, error, fetchAddress, fetchCart]
  );

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;

