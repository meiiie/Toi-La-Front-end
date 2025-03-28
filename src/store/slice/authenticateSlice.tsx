import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { authenticate } from '../../api/authenticate';
import { TaiKhoan } from '../types';

interface TrangThaiXacThuc {
  taiKhoan: TaiKhoan | null;
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiXacThuc = {
  taiKhoan: null,
  dangTai: false,
  loi: null,
};

export const authenticateUser = createAsyncThunk(
  'authenticate/authenticateUser',
  async ({ tenDangNhap, matKhau }: { tenDangNhap: string; matKhau: string }) => {
    const response = await authenticate(tenDangNhap, matKhau);
    return response;
  },
);

const authenticateSlice = createSlice({
  name: 'authenticate',
  initialState: trangThaiBanDau,
  reducers: {
    logout: (state) => {
      state.taiKhoan = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(authenticateUser.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(authenticateUser.fulfilled, (state, action: PayloadAction<TaiKhoan | undefined>) => {
        state.taiKhoan = action.payload || null;
        state.dangTai = false;
      })
      .addCase(authenticateUser.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi xác thực';
        state.dangTai = false;
      });
  },
});

export const { logout } = authenticateSlice.actions;
export default authenticateSlice.reducer;
