import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice.js"; 
import productReducer from './productSlice.js'

const store = configureStore({
  reducer: {
    user: userReducer,
    product : productReducer
  },
});

export { store }; 
