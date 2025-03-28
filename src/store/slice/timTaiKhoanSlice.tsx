import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { timTaiKhoan } from '../../api/timTaiKhoanApi';
import { SearchTaiKhoanResponse } from '../types';

interface TimTaiKhoanState {
  foundUsers: SearchTaiKhoanResponse;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TimTaiKhoanState = {
  foundUsers: { data: [], pageIndex: 0, pageSize: 0, totalData: 0 },
  status: 'idle',
  error: null,
};

export const fetchTimTaiKhoan = createAsyncThunk<SearchTaiKhoanResponse, string>(
  'timTaiKhoan/fetchTimTaiKhoan',
  async (input: string) => {
    const response: SearchTaiKhoanResponse = await timTaiKhoan(input);
    return response;
  },
);

const timTaiKhoanSlice = createSlice({
  name: 'timTaiKhoan',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimTaiKhoan.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTimTaiKhoan.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.foundUsers = action.payload;
      })
      .addCase(fetchTimTaiKhoan.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Something went wrong';
      });
  },
});

export default timTaiKhoanSlice.reducer;
