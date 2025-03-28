import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';
import { ViBlockchain } from '../types';

// Định nghĩa kiểu dữ liệu state
interface ViBlockchainState {
  data: ViBlockchain | null;
  viList: ViBlockchain[];
  primaryWallet: ViBlockchain | null;
  loading: boolean;
  error: string | null;
}

// Trạng thái ban đầu
const initialState: ViBlockchainState = {
  data: null,
  viList: [],
  primaryWallet: null,
  loading: false,
  error: null,
};

// Thunk để lấy thông tin ví theo địa chỉ
export const getViByAddress = createAsyncThunk(
  'viBlockchain/getViByAddress',
  async (
    { taiKhoanId, diaChiVi }: { taiKhoanId: number; diaChiVi: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiClient.get(
        `api/ViBlockchain/get-vi-by-address?taiKhoanId=${taiKhoanId}&diaChiVi=${diaChiVi}`,
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ message: error.message });
    }
  },
);

// Thunk để lấy danh sách ví của một tài khoản
export const getViList = createAsyncThunk(
  'viBlockchain/getViList',
  async (taiKhoanId: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`api/ViBlockchain/get-vi-list?taiKhoanId=${taiKhoanId}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ message: error.message });
    }
  },
);

// Thunk để lấy ví chính của một tài khoản
export const getPrimaryWallet = createAsyncThunk(
  'viBlockchain/getPrimaryWallet',
  async (taiKhoanId: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(
        `api/ViBlockchain/get-primary-wallet?taiKhoanId=${taiKhoanId}`,
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ message: error.message });
    }
  },
);

// Tạo slice
const viBlockchainSlice = createSlice({
  name: 'viBlockchain',
  initialState,
  reducers: {
    // Action reset trạng thái
    resetViBlockchainState: (state) => {
      return initialState;
    },
    // Action reset lỗi
    resetViBlockchainError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Xử lý getViByAddress
    builder.addCase(getViByAddress.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getViByAddress.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.success) {
        state.data = action.payload.data;
      } else {
        state.error = action.payload.message || 'Có lỗi xảy ra';
      }
    });
    builder.addCase(getViByAddress.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload
        ? typeof action.payload === 'string'
          ? action.payload
          : (action.payload as any).message || (action.payload as any).Error || 'Có lỗi xảy ra'
        : 'Có lỗi xảy ra khi kết nối đến server';
    });

    // Xử lý getViList
    builder.addCase(getViList.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getViList.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.success) {
        state.viList = action.payload.data;
      } else {
        state.error = action.payload.message || 'Có lỗi xảy ra';
      }
    });
    builder.addCase(getViList.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload
        ? typeof action.payload === 'string'
          ? action.payload
          : (action.payload as any).message || (action.payload as any).Error || 'Có lỗi xảy ra'
        : 'Có lỗi xảy ra khi kết nối đến server';
    });

    // Xử lý getPrimaryWallet
    builder.addCase(getPrimaryWallet.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getPrimaryWallet.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload.success) {
        state.primaryWallet = action.payload.Data;
      } else {
        state.error = action.payload.message || 'Có lỗi xảy ra';
      }
    });
    builder.addCase(getPrimaryWallet.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload
        ? typeof action.payload === 'string'
          ? action.payload
          : (action.payload as any).message || (action.payload as any).error || 'Có lỗi xảy ra'
        : 'Có lỗi xảy ra khi kết nối đến server';
    });
  },
});

// Export actions
export const { resetViBlockchainState, resetViBlockchainError } = viBlockchainSlice.actions;

// Export reducer
export default viBlockchainSlice.reducer;
