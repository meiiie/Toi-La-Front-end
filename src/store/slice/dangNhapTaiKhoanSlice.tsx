import { createSlice, type PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import type { TaiKhoan, PhienDangNhap } from '../types';
import { dangNhap, refreshToken } from '../../api/dangNhapTaiKhoanApi';
import { getLatestSession } from '../../api/phienDangNhapApi';
import apiClient from '../../api/apiClient';

interface LoginCredentials {
  tenDangNhap: string;
  matKhau: string;
  recaptchaToken?: string;
}

interface MetaMaskLoginPayload {
  diaChiVi: string;
  nonce: string;
  signature: string;
  recaptchaToken?: string;
}

interface TrangThaiDangNhap {
  taiKhoan: TaiKhoan | null;
  accessToken: string | null;
  phienDangNhap: PhienDangNhap | null;
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiDangNhap = {
  taiKhoan: null,
  accessToken: null,
  phienDangNhap: null,
  dangTai: false,
  loi: null,
};

export const login = createAsyncThunk(
  'dangNhap/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await dangNhap(
        credentials.tenDangNhap,
        credentials.matKhau,
        credentials.recaptchaToken,
      );
      const latestSession = await getLatestSession(response.user.id.toString());
      localStorage.setItem('isLoggedOut', 'false');
      return { ...response, phienDangNhap: latestSession };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi đăng nhập');
    }
  },
);

export const loginWithMetaMask = createAsyncThunk(
  'dangNhap/loginWithMetaMask',
  async (payload: MetaMaskLoginPayload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/tai-khoan/login-metamask', {
        diaChiVi: payload.diaChiVi,
        nonce: payload.nonce,
        signature: payload.signature,
        recaptchaToken: payload.recaptchaToken,
      });
      const data = response.data;

      // Lấy phiên đăng nhập mới nhất
      const latestSession = await getLatestSession(data.user.id.toString());
      localStorage.setItem('isLoggedOut', 'false');

      return { accessToken: data.accessToken, user: data.user, phienDangNhap: latestSession };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi đăng nhập với MetaMask');
    }
  },
);

export const refreshJwtToken = createAsyncThunk(
  'dangNhap/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await refreshToken();
      const latestSession = await getLatestSession(response.user.id.toString());
      localStorage.setItem('isLoggedOut', 'false');
      return { ...response, phienDangNhap: latestSession };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi khi làm mới token');
    }
  },
);

const dangNhapTaiKhoanSlice = createSlice({
  name: 'dangNhap',
  initialState: trangThaiBanDau,
  reducers: {
    logout: (state) => {
      state.taiKhoan = null;
      state.accessToken = null;
      state.phienDangNhap = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('metamask_session');
      document.cookie = 'refreshToken=; Max-Age=0';
    },
    loginSuccess: (
      state,
      action: PayloadAction<{
        accessToken: string;
        taiKhoan: TaiKhoan;
        phienDangNhap: PhienDangNhap;
      }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.taiKhoan = action.payload.taiKhoan;
      state.phienDangNhap = action.payload.phienDangNhap;
      localStorage.setItem('accessToken', action.payload.accessToken);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(
        login.fulfilled,
        (
          state,
          action: PayloadAction<{
            accessToken: string;
            user: TaiKhoan;
            phienDangNhap: PhienDangNhap;
          }>,
        ) => {
          state.accessToken = action.payload.accessToken;
          state.taiKhoan = action.payload.user;
          state.phienDangNhap = action.payload.phienDangNhap;
          state.dangTai = false;
          state.loi = null;
          localStorage.setItem('accessToken', action.payload.accessToken);
        },
      )
      .addCase(login.rejected, (state, action) => {
        state.loi = (action.payload as string) || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(loginWithMetaMask.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(
        loginWithMetaMask.fulfilled,
        (
          state,
          action: PayloadAction<{
            accessToken: string;
            user: TaiKhoan;
            phienDangNhap: PhienDangNhap;
          }>,
        ) => {
          state.accessToken = action.payload.accessToken;
          state.taiKhoan = action.payload.user;
          state.phienDangNhap = action.payload.phienDangNhap;
          state.dangTai = false;
          state.loi = null;
          localStorage.setItem('accessToken', action.payload.accessToken);
        },
      )
      .addCase(loginWithMetaMask.rejected, (state, action) => {
        state.loi = (action.payload as string) || 'Có lỗi xảy ra khi đăng nhập với MetaMask';
        state.dangTai = false;
      })
      .addCase(
        refreshJwtToken.fulfilled,
        (
          state,
          action: PayloadAction<{
            accessToken: string;
            user: TaiKhoan;
            phienDangNhap: PhienDangNhap;
          }>,
        ) => {
          state.accessToken = action.payload.accessToken;
          state.taiKhoan = action.payload.user;
          state.phienDangNhap = action.payload.phienDangNhap;
          state.loi = null;
          localStorage.setItem('accessToken', action.payload.accessToken);
        },
      )
      .addCase(refreshJwtToken.rejected, (state, action) => {
        state.loi = (action.payload as string) || 'Có lỗi xảy ra khi làm mới token';
      });
  },
});

export const { logout, loginSuccess } = dangNhapTaiKhoanSlice.actions;
export default dangNhapTaiKhoanSlice.reducer;
