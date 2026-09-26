import toast from "react-hot-toast";

const AxiosToastError = (error) => {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "An unexpected error occurred. Please try again.";
  toast.error(message);
};

export default AxiosToastError;
