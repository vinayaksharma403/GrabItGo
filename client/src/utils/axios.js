import axios from "axios";
import { baseURL } from "../common/SummaryApi";

const Axios = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

Axios.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

Axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const newTokenResponse = await axios.post(
            `${baseURL}/api/user/refresh-token`,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          );

          const newAccessToken = newTokenResponse.data.data.accessToken;
          localStorage.setItem("accessToken", newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return Axios(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed", refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default Axios;
