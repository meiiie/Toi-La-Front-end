import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { DuLieuTaiKhoanMoi } from '../types';
import { getCaiDatTaiKhoan, updateCaiDatTaiKhoan } from '../../api/caiDatTaiKhoanApi';

interface TrangThaiCaiDatTaiKhoan {
  caiDat: DuLieuTaiKhoanMoi | null;
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiCaiDatTaiKhoan = {
  caiDat: null,
  dangTai: false,
  loi: null,
};

export const fetchCaiDatTaiKhoan = createAsyncThunk(
  'caiDatTaiKhoan/fetchCaiDatTaiKhoan',
  async (id: number) => {
    const response = await getCaiDatTaiKhoan(id);
    return response;
  },
);

export const updateCaiDat = createAsyncThunk(
  'caiDatTaiKhoan/updateCaiDat',
  async ({ id, caiDat }: { id: number; caiDat: Partial<DuLieuTaiKhoanMoi> }) => {
    const response = await updateCaiDatTaiKhoan(id, caiDat);
    return response;
  },
);

const caiDatTaiKhoanSlice = createSlice({
  name: 'caiDatTaiKhoan',
  initialState: trangThaiBanDau,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCaiDatTaiKhoan.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchCaiDatTaiKhoan.fulfilled, (state, action: PayloadAction<DuLieuTaiKhoanMoi>) => {
        state.caiDat = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchCaiDatTaiKhoan.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(updateCaiDat.fulfilled, (state, action: PayloadAction<DuLieuTaiKhoanMoi>) => {
        state.caiDat = action.payload;
      });
  },
});

export default caiDatTaiKhoanSlice.reducer;
