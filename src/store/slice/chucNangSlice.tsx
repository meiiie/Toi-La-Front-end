import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ChucNang } from '../types';
import {
  getCacChucNang,
  createChucNang,
  updateChucNang,
  deleteChucNang,
} from '../../api/chucNangApi';

interface TrangThaiChucNang {
  cacChucNang: ChucNang[];
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiChucNang = {
  cacChucNang: [],
  dangTai: false,
  loi: null,
};

export const fetchCacChucNang = createAsyncThunk('chucNang/fetchCacChucNang', async () => {
  const response = await getCacChucNang();
  return response;
});

export const addChucNang = createAsyncThunk(
  'chucNang/addChucNang',
  async (chucNang: Omit<ChucNang, 'id'>) => {
    const response = await createChucNang(chucNang);
    return response;
  },
);

export const editChucNang = createAsyncThunk(
  'chucNang/editChucNang',
  async ({ id, chucNang }: { id: number; chucNang: ChucNang }) => {
    const response = await updateChucNang(id, chucNang);
    return response;
  },
);

export const removeChucNang = createAsyncThunk('chucNang/removeChucNang', async (id: number) => {
  await deleteChucNang(id);
  return id;
});

const chucNangSlice = createSlice({
  name: 'chucNang',
  initialState: trangThaiBanDau,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacChucNang.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchCacChucNang.fulfilled, (state, action: PayloadAction<ChucNang[]>) => {
        state.cacChucNang = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchCacChucNang.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(addChucNang.fulfilled, (state, action: PayloadAction<ChucNang>) => {
        state.cacChucNang.push(action.payload);
      })
      .addCase(editChucNang.fulfilled, (state, action: PayloadAction<ChucNang>) => {
        const index = state.cacChucNang.findIndex((chucNang) => chucNang.id === action.payload.id);
        if (index !== -1) {
          state.cacChucNang[index] = action.payload;
        }
      })
      .addCase(removeChucNang.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacChucNang = state.cacChucNang.filter((chucNang) => chucNang.id !== action.payload);
      });
  },
});

export default chucNangSlice.reducer;
