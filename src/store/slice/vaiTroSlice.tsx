import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { VaiTro } from '../types';
import { getCacVaiTro, createVaiTro, updateVaiTro, deleteVaiTro } from '../../api/vaiTroApi';

interface TrangThaiVaiTro {
  cacVaiTro: VaiTro[];
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiVaiTro = {
  cacVaiTro: [],
  dangTai: false,
  loi: null,
};

export const fetchCacVaiTro = createAsyncThunk('vaiTro/fetchCacVaiTro', async () => {
  const response = await getCacVaiTro();
  return response;
});

export const addVaiTro = createAsyncThunk(
  'vaiTro/addVaiTro',
  async (vaiTro: Omit<VaiTro, 'id'>) => {
    const response = await createVaiTro(vaiTro);
    return response;
  },
);

export const editVaiTro = createAsyncThunk(
  'vaiTro/editVaiTro',
  async ({ id, vaiTro }: { id: number; vaiTro: Partial<VaiTro> }) => {
    const response = await updateVaiTro(id, { ...vaiTro, id } as VaiTro);
    return response;
  },
);

export const removeVaiTro = createAsyncThunk('vaiTro/removeVaiTro', async (id: number) => {
  await deleteVaiTro(id);
  return id;
});

const vaiTroSlice = createSlice({
  name: 'vaiTro',
  initialState: trangThaiBanDau,
  reducers: {
    clearVaiTroState: (state) => {
      state.cacVaiTro = [];
    },
    datCacVaiTro: (state, action: PayloadAction<VaiTro[]>) => {
      state.cacVaiTro = action.payload;
    },
    themVaiTro: (state, action: PayloadAction<VaiTro>) => {
      state.cacVaiTro.push(action.payload);
    },
    capNhatVaiTro: (state, action: PayloadAction<VaiTro>) => {
      const index = state.cacVaiTro.findIndex((vaiTro) => vaiTro.id === action.payload.id);
      if (index !== -1) {
        state.cacVaiTro[index] = action.payload;
      }
    },
    xoaVaiTro: (state, action: PayloadAction<number>) => {
      state.cacVaiTro = state.cacVaiTro.filter((vaiTro) => vaiTro.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacVaiTro.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchCacVaiTro.fulfilled, (state, action: PayloadAction<VaiTro[]>) => {
        state.cacVaiTro = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchCacVaiTro.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(addVaiTro.fulfilled, (state, action: PayloadAction<VaiTro>) => {
        state.cacVaiTro.push(action.payload);
      })
      .addCase(editVaiTro.fulfilled, (state, action: PayloadAction<VaiTro>) => {
        const index = state.cacVaiTro.findIndex((vaiTro) => vaiTro.id === action.payload.id);
        if (index !== -1) {
          state.cacVaiTro[index] = action.payload;
        }
      })
      .addCase(removeVaiTro.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacVaiTro = state.cacVaiTro.filter((vaiTro) => vaiTro.id !== action.payload);
      });
  },
});

export const { datCacVaiTro, themVaiTro, capNhatVaiTro, xoaVaiTro } = vaiTroSlice.actions;
export default vaiTroSlice.reducer;
export const { clearVaiTroState } = vaiTroSlice.actions;
