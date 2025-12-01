import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice.js";
import productReducer from './productSlice.js'
import addressReducer from './addressSlice.js'

const store = configureStore({
  reducer: {
    user: userReducer,
    product : productReducer,
    addresses: addressReducer
  },
});

export { store };
