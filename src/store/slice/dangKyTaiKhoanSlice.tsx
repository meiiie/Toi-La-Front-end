import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dangKyTaiKhoan } from '../../api/dangKyTaiKhoanApi';
import type { RegisterResponse } from '../types';

import { TrangThaiDangKyTaiKhoan, RegisterPayload } from '../types';

const trangThaiBanDau: TrangThaiDangKyTaiKhoan = {
  dangTai: false,
  loi: null,
  thanhCong: false,
  user: null,
  wallets: null,
  accessToken: null,
};

export const registerAccount = createAsyncThunk(
  'dangKyTaiKhoan/registerAccount',
  async ({ account, recaptchaToken }: RegisterPayload, { rejectWithValue }) => {
    try {
      const response = await dangKyTaiKhoan(account, recaptchaToken);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const dangKyTaiKhoanSlice = createSlice({
  name: 'dangKyTaiKhoan',
  initialState: trangThaiBanDau,
  reducers: {
    resetTrangThai: (state) => {
      state.dangTai = false;
      state.loi = null;
      state.thanhCong = false;
      state.user = null;
      state.wallets = null;
      state.accessToken = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerAccount.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
        state.thanhCong = false;
      })
      .addCase(registerAccount.fulfilled, (state, action) => {
        const response = action.payload as RegisterResponse;
        state.dangTai = false;
        state.thanhCong = true;
        state.accessToken = response.accessToken;
        state.user = {
          id: response.user.Id,
          tenDangNhap: response.user.TenDangNhap,
          email: response.user.Email,
          tenHienThi: response.user.TenHienThi,
          ngayThamGia: response.user.NgayThamGia,
          vaiTro: response.user.VaiTro,
        };
        state.wallets = response.wallets;
      })
      .addCase(registerAccount.rejected, (state, action) => {
        state.dangTai = false;
        state.loi = action.payload as string;
        state.thanhCong = false;
      });
  },
});

export const { resetTrangThai } = dangKyTaiKhoanSlice.actions;
export default dangKyTaiKhoanSlice.reducer;
