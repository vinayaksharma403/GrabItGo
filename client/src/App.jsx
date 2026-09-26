import { Outlet } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Loading from './components/Loading';
import { Toaster } from 'react-hot-toast';
import { useEffect, useCallback, Suspense } from 'react';
import fetchUserDetails from './utils/fetchUserDetails';
import { setUserDetails } from './store/userSlice';
import { setAllCategory, setAllSubCategory, setLoadingCategory } from './store/productSlice';
import { useDispatch } from 'react-redux';
import Axios from './utils/axios';
import SummaryApi from './common/SummaryApi';

function App() {
  const dispatch = useDispatch();

  const fetchUser = useCallback(async () => {
    try {
      const userData = await fetchUserDetails();

      if (userData?.data) {
        dispatch(setUserDetails(userData.data));
      }
    } catch (error) {
      console.error("fetchUser error:", error?.message || error);
    }
  }, [dispatch]);

  const fetchCategory = useCallback(async () => {
    try {
      dispatch(setLoadingCategory(true));

      const response = await Axios({
        ...SummaryApi.getCategory,
      });
      const { data: responseData } = response;

      if (responseData.success) {
        dispatch(setAllCategory(responseData.data));
      }
    } catch (error) {
      console.error("fetchCategory error:", error?.message || error);
    } finally {
      dispatch(setLoadingCategory(false));
    }
  }, [dispatch]);

  const fetchSubCategory = useCallback(async () => {
    try {
      const response = await Axios({
        ...SummaryApi.getSubCategory,
      });
      const { data: responseData } = response;

      if (responseData.success) {
        dispatch(setAllSubCategory(responseData.data));
      }
    } catch (error) {
      console.error("fetchSubCategory error:", error?.message || error);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchUser();
    fetchCategory();
    fetchSubCategory();
  }, [fetchUser, fetchCategory, fetchSubCategory]);

  return (
    <>
      <Header />
      <main className='min-h-[78vh]'>
        <Suspense fallback={<Loading message="Loading page..." />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            fontSize: '0.875rem',
            fontWeight: '500',
            borderRadius: '0.75rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#059669',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </>
  );
}

export default App;
