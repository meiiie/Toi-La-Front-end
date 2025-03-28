import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { resetPassword } from '../../api/datLaiMatKhauAPI';

interface DatLaiMatKhauState {
  dangTai: boolean;
  thanhCong: boolean;
  loi: string | null;
}

const trangThaiBanDau: DatLaiMatKhauState = {
  dangTai: false,
  thanhCong: false,
  loi: null,
};

export const datLaiMatKhau = createAsyncThunk(
  'datLaiMatKhau/datLaiMatKhau',
  async ({ id, newPassword }: { id: string; newPassword: string }) => {
    await resetPassword(id, newPassword);
  },
);

const datLaiMatKhauSlice = createSlice({
  name: 'datLaiMatKhau',
  initialState: trangThaiBanDau,
  reducers: {
    resetTrangThai: (state) => {
      state.dangTai = false;
      state.thanhCong = false;
      state.loi = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(datLaiMatKhau.pending, (state) => {
        state.dangTai = true;
        state.thanhCong = false;
        state.loi = null;
      })
      .addCase(datLaiMatKhau.fulfilled, (state) => {
        state.dangTai = false;
        state.thanhCong = true;
        state.loi = null;
      })
      .addCase(datLaiMatKhau.rejected, (state, action: PayloadAction<any>) => {
        state.dangTai = false;
        state.thanhCong = false;
        state.loi = action.payload?.message || 'Có lỗi xảy ra';
      });
  },
});

export const { resetTrangThai } = datLaiMatKhauSlice.actions;

export default datLaiMatKhauSlice.reducer;
