import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ViTriUngCu } from '../types';
import {
  getCacViTriUngCu,
  createViTriUngCu,
  updateViTriUngCu,
  deleteViTriUngCu,
} from '../../api/viTriUngCuApi';

interface TrangThaiViTriUngCu {
  cacViTriUngCu: ViTriUngCu[];
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiViTriUngCu = {
  cacViTriUngCu: [],
  dangTai: false,
  loi: null,
};

export const fetchCacViTriUngCu = createAsyncThunk('viTriUngCu/fetchCacViTriUngCu', async () => {
  const response = await getCacViTriUngCu();
  return response;
});

export const addViTriUngCu = createAsyncThunk(
  'viTriUngCu/addViTriUngCu',
  async (viTriUngCu: Omit<ViTriUngCu, 'id'>) => {
    const response = await createViTriUngCu(viTriUngCu);
    return response;
  },
);

export const editViTriUngCu = createAsyncThunk(
  'viTriUngCu/editViTriUngCu',
  async ({ id, viTriUngCu }: { id: number; viTriUngCu: Partial<ViTriUngCu> }) => {
    const response = await updateViTriUngCu(id, viTriUngCu);
    return response;
  },
);

export const removeViTriUngCu = createAsyncThunk(
  'viTriUngCu/removeViTriUngCu',
  async (id: number) => {
    await deleteViTriUngCu(id);
    return id;
  },
);

const viTriUngCuSlice = createSlice({
  name: 'cacViTriUngCu',
  initialState: trangThaiBanDau,
  reducers: {
    datCacViTriUngCu: (state, action: PayloadAction<ViTriUngCu[]>) => {
      state.cacViTriUngCu = action.payload;
    },
    themViTriUngCu: (state, action: PayloadAction<ViTriUngCu>) => {
      state.cacViTriUngCu.push(action.payload);
    },
    capNhatViTriUngCu: (state, action: PayloadAction<ViTriUngCu>) => {
      const index = state.cacViTriUngCu.findIndex(
        (viTriUngCu) => viTriUngCu.id === action.payload.id,
      );
      if (index !== -1) {
        state.cacViTriUngCu[index] = action.payload;
      }
    },
    xoaViTriUngCu: (state, action: PayloadAction<number>) => {
      state.cacViTriUngCu = state.cacViTriUngCu.filter(
        (viTriUngCu) => viTriUngCu.id !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacViTriUngCu.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchCacViTriUngCu.fulfilled, (state, action: PayloadAction<ViTriUngCu[]>) => {
        state.cacViTriUngCu = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchCacViTriUngCu.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(addViTriUngCu.fulfilled, (state, action: PayloadAction<ViTriUngCu>) => {
        state.cacViTriUngCu.push(action.payload);
      })
      .addCase(editViTriUngCu.fulfilled, (state, action: PayloadAction<ViTriUngCu>) => {
        const index = state.cacViTriUngCu.findIndex(
          (viTriUngCu) => viTriUngCu.id === action.payload.id,
        );
        if (index !== -1) {
          state.cacViTriUngCu[index] = action.payload;
        }
      })
      .addCase(removeViTriUngCu.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacViTriUngCu = state.cacViTriUngCu.filter(
          (viTriUngCu) => viTriUngCu.id !== action.payload,
        );
      });
  },
});

export const { datCacViTriUngCu, themViTriUngCu, capNhatViTriUngCu, xoaViTriUngCu } =
  viTriUngCuSlice.actions;
export default viTriUngCuSlice.reducer;
