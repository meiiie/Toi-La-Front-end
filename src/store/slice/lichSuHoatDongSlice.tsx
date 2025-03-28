import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { LichSuHoatDong } from '../types';
import {
  getCacLichSuHoatDong,
  createLichSuHoatDong,
  updateLichSuHoatDong,
  deleteLichSuHoatDong,
} from '../../api/lichSuHoatDongApi';

interface TrangThaiLichSuHoatDong {
  cacLichSuHoatDong: LichSuHoatDong[];
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiLichSuHoatDong = {
  cacLichSuHoatDong: [],
  dangTai: false,
  loi: null,
};

export const fetchCacLichSuHoatDong = createAsyncThunk(
  'lichSuHoatDong/fetchCacLichSuHoatDong',
  async () => {
    const response = await getCacLichSuHoatDong();
    return response;
  },
);

export const addLichSuHoatDong = createAsyncThunk(
  'lichSuHoatDong/addLichSuHoatDong',
  async (lichSuHoatDong: Omit<LichSuHoatDong, 'id'>) => {
    const response = await createLichSuHoatDong(lichSuHoatDong);
    return response;
  },
);

export const editLichSuHoatDong = createAsyncThunk(
  'lichSuHoatDong/editLichSuHoatDong',
  async ({ id, lichSuHoatDong }: { id: number; lichSuHoatDong: LichSuHoatDong }) => {
    const response = await updateLichSuHoatDong(id, lichSuHoatDong);
    return response;
  },
);

export const removeLichSuHoatDong = createAsyncThunk(
  'lichSuHoatDong/removeLichSuHoatDong',
  async (id: number) => {
    await deleteLichSuHoatDong(id);
    return id;
  },
);

const lichSuHoatDongSlice = createSlice({
  name: 'lichSuHoatDong',
  initialState: trangThaiBanDau,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacLichSuHoatDong.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(
        fetchCacLichSuHoatDong.fulfilled,
        (state, action: PayloadAction<LichSuHoatDong[]>) => {
          state.cacLichSuHoatDong = action.payload;
          state.dangTai = false;
        },
      )
      .addCase(fetchCacLichSuHoatDong.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(addLichSuHoatDong.fulfilled, (state, action: PayloadAction<LichSuHoatDong>) => {
        state.cacLichSuHoatDong.push(action.payload);
      })
      .addCase(editLichSuHoatDong.fulfilled, (state, action: PayloadAction<LichSuHoatDong>) => {
        const index = state.cacLichSuHoatDong.findIndex(
          (lichSuHoatDong) => lichSuHoatDong.id === action.payload.id,
        );
        if (index !== -1) {
          state.cacLichSuHoatDong[index] = action.payload;
        }
      })
      .addCase(removeLichSuHoatDong.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacLichSuHoatDong = state.cacLichSuHoatDong.filter(
          (lichSuHoatDong) => lichSuHoatDong.id !== action.payload,
        );
      });
  },
});

export default lichSuHoatDongSlice.reducer;
