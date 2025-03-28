import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { TaiKhoanVaiTro } from '../types';
import {
  getCacTaiKhoanVaiTro,
  createTaiKhoanVaiTro,
  updateTaiKhoanVaiTro,
  deleteTaiKhoanVaiTro,
} from '../../api/taiKhoanVaiTroApi';

interface TrangThaiTaiKhoanVaiTro {
  cacTaiKhoanVaiTro: TaiKhoanVaiTro[];
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiTaiKhoanVaiTro = {
  cacTaiKhoanVaiTro: [],
  dangTai: false,
  loi: null,
};

export const fetchCacTaiKhoanVaiTro = createAsyncThunk(
  'taiKhoanVaiTro/fetchCacTaiKhoanVaiTro',
  async () => {
    const response = await getCacTaiKhoanVaiTro();
    return response;
  },
);

export const addTaiKhoanVaiTro = createAsyncThunk(
  'taiKhoanVaiTro/addTaiKhoanVaiTro',
  async (taiKhoanVaiTro: Omit<TaiKhoanVaiTro, 'id'>) => {
    const response = await createTaiKhoanVaiTro(taiKhoanVaiTro);
    return response;
  },
);

export const editTaiKhoanVaiTro = createAsyncThunk(
  'taiKhoanVaiTro/editTaiKhoanVaiTro',
  async ({ id, taiKhoanVaiTro }: { id: number; taiKhoanVaiTro: Partial<TaiKhoanVaiTro> }) => {
    const response = await updateTaiKhoanVaiTro(id, taiKhoanVaiTro);
    return response;
  },
);

export const removeTaiKhoanVaiTro = createAsyncThunk(
  'taiKhoanVaiTro/removeTaiKhoanVaiTro',
  async (id: number) => {
    await deleteTaiKhoanVaiTro(id);
    return id;
  },
);

const taiKhoanVaiTroSlice = createSlice({
  name: 'taiKhoanVaiTro',
  initialState: trangThaiBanDau,
  reducers: {
    datCacTaiKhoanVaiTro: (state, action: PayloadAction<TaiKhoanVaiTro[]>) => {
      state.cacTaiKhoanVaiTro = action.payload;
    },
    themTaiKhoanVaiTro: (state, action: PayloadAction<TaiKhoanVaiTro>) => {
      state.cacTaiKhoanVaiTro.push(action.payload);
    },
    capNhatTaiKhoanVaiTro: (state, action: PayloadAction<TaiKhoanVaiTro>) => {
      const index = state.cacTaiKhoanVaiTro.findIndex(
        (taiKhoanVaiTro) => taiKhoanVaiTro.id === action.payload.id,
      );
      if (index !== -1) {
        state.cacTaiKhoanVaiTro[index] = action.payload;
      }
    },
    xoaTaiKhoanVaiTro: (state, action: PayloadAction<number>) => {
      state.cacTaiKhoanVaiTro = state.cacTaiKhoanVaiTro.filter(
        (taiKhoanVaiTro) => taiKhoanVaiTro.id !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacTaiKhoanVaiTro.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(
        fetchCacTaiKhoanVaiTro.fulfilled,
        (state, action: PayloadAction<TaiKhoanVaiTro[]>) => {
          state.cacTaiKhoanVaiTro = action.payload;
          state.dangTai = false;
        },
      )
      .addCase(fetchCacTaiKhoanVaiTro.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(addTaiKhoanVaiTro.fulfilled, (state, action: PayloadAction<TaiKhoanVaiTro>) => {
        state.cacTaiKhoanVaiTro.push(action.payload);
      })
      .addCase(editTaiKhoanVaiTro.fulfilled, (state, action: PayloadAction<TaiKhoanVaiTro>) => {
        const index = state.cacTaiKhoanVaiTro.findIndex(
          (taiKhoanVaiTro) => taiKhoanVaiTro.id === action.payload.id,
        );
        if (index !== -1) {
          state.cacTaiKhoanVaiTro[index] = action.payload;
        }
      })
      .addCase(removeTaiKhoanVaiTro.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacTaiKhoanVaiTro = state.cacTaiKhoanVaiTro.filter(
          (taiKhoanVaiTro) => taiKhoanVaiTro.id !== action.payload,
        );
      });
  },
});

export const {
  datCacTaiKhoanVaiTro,
  themTaiKhoanVaiTro,
  capNhatTaiKhoanVaiTro,
  xoaTaiKhoanVaiTro,
} = taiKhoanVaiTroSlice.actions;
export default taiKhoanVaiTroSlice.reducer;
