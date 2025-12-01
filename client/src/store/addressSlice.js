import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  addressList: [],
};

const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {
    setAddressList: (state, action) => {
      state.addressList = action.payload;
    },
    addAddress: (state, action) => {
      state.addressList.push(action.payload);
    },
    updateAddress: (state, action) => {
      const index = state.addressList.findIndex(addr => addr._id === action.payload._id);
      if (index !== -1) {
        state.addressList[index] = action.payload;
      }
    },
    removeAddress: (state, action) => {
      state.addressList = state.addressList.filter(addr => addr._id !== action.payload);
    },
  },
});

export const { setAddressList, addAddress, updateAddress, removeAddress } = addressSlice.actions;
export default addressSlice.reducer;
