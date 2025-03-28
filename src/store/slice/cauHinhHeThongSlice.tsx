import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { CauHinhHeThong } from '../types';
import {
  getCacCauHinhHeThong,
  createCauHinhHeThong,
  updateCauHinhHeThong,
  deleteCauHinhHeThong,
} from '../../api/cauHinhHeThongApi';

interface TrangThaiCauHinhHeThong {
  cacCauHinhHeThong: CauHinhHeThong[];
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiCauHinhHeThong = {
  cacCauHinhHeThong: [],
  dangTai: false,
  loi: null,
};

export const fetchCacCauHinhHeThong = createAsyncThunk(
  'cauHinhHeThong/fetchCacCauHinhHeThong',
  async () => {
    const response = await getCacCauHinhHeThong();
    return response;
  },
);

export const addCauHinhHeThong = createAsyncThunk(
  'cauHinhHeThong/addCauHinhHeThong',
  async (cauHinhHeThong: Omit<CauHinhHeThong, 'id'>) => {
    const response = await createCauHinhHeThong(cauHinhHeThong);
    return response;
  },
);

export const editCauHinhHeThong = createAsyncThunk(
  'cauHinhHeThong/editCauHinhHeThong',
  async ({ id, cauHinhHeThong }: { id: number; cauHinhHeThong: CauHinhHeThong }) => {
    const response = await updateCauHinhHeThong(id, cauHinhHeThong);
    return response;
  },
);

export const removeCauHinhHeThong = createAsyncThunk(
  'cauHinhHeThong/removeCauHinhHeThong',
  async (id: number) => {
    await deleteCauHinhHeThong(id);
    return id;
  },
);

const cauHinhHeThongSlice = createSlice({
  name: 'cauHinhHeThong',
  initialState: trangThaiBanDau,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacCauHinhHeThong.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(
        fetchCacCauHinhHeThong.fulfilled,
        (state, action: PayloadAction<CauHinhHeThong[]>) => {
          state.cacCauHinhHeThong = action.payload;
          state.dangTai = false;
        },
      )
      .addCase(fetchCacCauHinhHeThong.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(addCauHinhHeThong.fulfilled, (state, action: PayloadAction<CauHinhHeThong>) => {
        state.cacCauHinhHeThong.push(action.payload);
      })
      .addCase(editCauHinhHeThong.fulfilled, (state, action: PayloadAction<CauHinhHeThong>) => {
        const index = state.cacCauHinhHeThong.findIndex(
          (cauHinhHeThong) => cauHinhHeThong.id === action.payload.id,
        );
        if (index !== -1) {
          state.cacCauHinhHeThong[index] = action.payload;
        }
      })
      .addCase(removeCauHinhHeThong.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacCauHinhHeThong = state.cacCauHinhHeThong.filter(
          (cauHinhHeThong) => cauHinhHeThong.id !== action.payload,
        );
      });
  },
});

export default cauHinhHeThongSlice.reducer;
