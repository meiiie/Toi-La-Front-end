import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { CuocBauCu, CuocBauCuDTO } from '../types';
import { getCuocBauCuById } from '../../api/cuocBauCuApi';
import apiClient from '../../api/apiClient';

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

// Thêm action để cập nhật cuộc bầu cử
export const updateCuocBauCu = createAsyncThunk(
  'cuocBauCuById/update',
  async (cuocBauCuData: CuocBauCuDTO, { rejectWithValue }) => {
    try {
      // Kiểm tra định dạng ngày (dd/MM/yyyy HH:mm)
      const ngayBatDauRegex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
      const ngayKetThucRegex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;

      if (
        !ngayBatDauRegex.test(cuocBauCuData.ngayBatDau) ||
        !ngayKetThucRegex.test(cuocBauCuData.ngayKetThuc)
      ) {
        return rejectWithValue('Định dạng ngày không hợp lệ. Yêu cầu định dạng dd/MM/yyyy HH:mm');
      }

      const response = await apiClient.put('/api/CuocBauCu/update', cuocBauCuData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật');
    }
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
      })
      // Thêm xử lý case cho updateCuocBauCu
      .addCase(updateCuocBauCu.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(updateCuocBauCu.fulfilled, (state, action) => {
        state.dangTai = false;
        // Không cần cập nhật state.cuocBauCu vì sau đó sẽ gọi fetchCuocBauCuById
      })
      .addCase(updateCuocBauCu.rejected, (state, action) => {
        state.dangTai = false;
        state.loi = (action.payload as string) || 'Có lỗi xảy ra khi cập nhật cuộc bầu cử';
      });
  },
});

// Export action reset
export const { resetCuocBauCuById } = cuocBauCuByIdSlice.actions;
export default cuocBauCuByIdSlice.reducer;
