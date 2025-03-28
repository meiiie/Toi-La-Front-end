import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { loginSuccess } from './dangNhapTaiKhoanSlice';
import apiClient from '../../api/apiClient';
import { getLatestSession } from '../../api/phienDangNhapApi';

interface MetaMaskLoginPayload {
  diaChiVi: string;
  nonce: string;
  signature: string;
}

interface MetaMaskState {
  accessToken: string | null;
  user: any | null;
  phienDangNhap: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: MetaMaskState = {
  accessToken: null,
  user: null,
  phienDangNhap: null,
  loading: false,
  error: null,
};

export const loginWithMetaMask = createAsyncThunk(
  'metaMask/login',
  async ({ diaChiVi, nonce, signature }: MetaMaskLoginPayload, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/tai-khoan/login-metamask', {
        diaChiVi,
        nonce,
        signature,
      });

      const data = response.data;
      if (!data.success && data.message) {
        return rejectWithValue(data.message);
      }

      // Lấy phiên đăng nhập mới nhất
      const latestSession = await getLatestSession(data.user.id.toString());

      // Đồng bộ dữ liệu với dangNhapTaiKhoanSlice
      dispatch(
        loginSuccess({
          accessToken: data.accessToken,
          taiKhoan: data.user,
          phienDangNhap: latestSession,
        }),
      );

      localStorage.setItem('isLoggedOut', 'false');
      return { accessToken: data.accessToken, user: data.user, phienDangNhap: latestSession };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi gọi API đăng nhập MetaMask');
    }
  },
);

const metaMaskSlice = createSlice({
  name: 'metaMask',
  initialState,
  reducers: {
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.phienDangNhap = null;
      localStorage.removeItem('metamask_session');
    },
    setMetaMaskSession: (state, action: PayloadAction<any>) => {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.phienDangNhap = action.payload.phienDangNhap;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginWithMetaMask.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithMetaMask.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.phienDangNhap = action.payload.phienDangNhap;
        state.error = null;
      })
      .addCase(loginWithMetaMask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, setMetaMaskSession } = metaMaskSlice.actions;
export default metaMaskSlice.reducer;
