import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { CuocBauCu } from '../types';
import { getCuocBauCuById } from '../../api/cuocBauCuApi';

interface TrangThaiCuocBauCuById {
  cuocBauCu: CuocBauCu | null;
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiCuocBauCuById = {
  cuocBauCu: null,
  dangTai: false,
  loi: null,
};

export const fetchCuocBauCuById = createAsyncThunk(
  'cuocBauCuById/fetchCuocBauCuById',
  async (id: number) => {
    const response = await getCuocBauCuById(id);
    return response;
  },
);

const cuocBauCuByIdSlice = createSlice({
  name: 'cuocBauCuById',
  initialState: trangThaiBanDau,
  reducers: {
    // Thêm reducer để reset state
    resetCuocBauCuById: (state) => {
      // Reset state về trạng thái ban đầu
      Object.assign(state, trangThaiBanDau);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCuocBauCuById.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchCuocBauCuById.fulfilled, (state, action: PayloadAction<CuocBauCu>) => {
        state.cuocBauCu = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchCuocBauCuById.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      });
  },
});

// Export action reset
export const { resetCuocBauCuById } = cuocBauCuByIdSlice.actions;
export default cuocBauCuByIdSlice.reducer;
