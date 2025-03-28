import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { authorize } from '../../api/authorize';

interface TrangThaiPhanQuyen {
  vaiTro: string[];
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiPhanQuyen = {
  vaiTro: [],
  dangTai: false,
  loi: null,
};

export const authorizeUser = createAsyncThunk('authorize/authorizeUser', async (id: number) => {
  const response = await authorize(id);
  return response;
});

const authorizeSlice = createSlice({
  name: 'authorize',
  initialState: trangThaiBanDau,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(authorizeUser.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(authorizeUser.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.vaiTro = action.payload;
        state.dangTai = false;
      })
      .addCase(authorizeUser.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi phân quyền';
        state.dangTai = false;
      });
  },
});

export default authorizeSlice.reducer;
