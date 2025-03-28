import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { subscribeEmail } from '../../api/nhanThongTinApi';
import { SubscribeData } from '../types';

interface SubscribeState {
  loading: boolean;
  success: boolean;
  message: string | null;
  error: string | null;
}

const initialState: SubscribeState = {
  loading: false,
  success: false,
  message: null,
  error: null,
};

export const subscribe = createAsyncThunk(
  'nhanThongTin/subscribe',
  async (subscribeData: SubscribeData, { rejectWithValue }) => {
    try {
      const response = await subscribeEmail(subscribeData);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response.message;
    } catch (error) {
      return rejectWithValue('An unexpected error occurred.');
    }
  },
);

const nhanThongTinSlice = createSlice({
  name: 'nhanThongTin',
  initialState,
  reducers: {
    resetState: (state) => {
      state.loading = false;
      state.success = false;
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(subscribe.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.message = null;
        state.error = null;
      })
      .addCase(subscribe.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload as string;
        state.error = null;
      })
      .addCase(subscribe.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.message = null;
        state.error = action.payload as string;
      });
  },
});

export const { resetState } = nhanThongTinSlice.actions;

export default nhanThongTinSlice.reducer;
