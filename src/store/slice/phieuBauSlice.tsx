import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PhieuBau } from '../types';
import {
  getCacPhieuBau,
  createPhieuBau,
  updatePhieuBau,
  deletePhieuBau,
} from '../../api/phieuBauApi';

interface TrangThaiPhieuBau {
  cacPhieuBau: PhieuBau[];
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiPhieuBau = {
  cacPhieuBau: [],
  dangTai: false,
  loi: null,
};

export const fetchCacPhieuBau = createAsyncThunk('phieuBau/fetchCacPhieuBau', async () => {
  const response = await getCacPhieuBau();
  return response;
});

export const addPhieuBau = createAsyncThunk(
  'phieuBau/addPhieuBau',
  async (phieuBau: Omit<PhieuBau, 'id'>) => {
    const response = await createPhieuBau(phieuBau);
    return response;
  },
);

export const editPhieuBau = createAsyncThunk(
  'phieuBau/editPhieuBau',
  async ({ id, phieuBau }: { id: number; phieuBau: Partial<PhieuBau> }) => {
    const response = await updatePhieuBau(id, phieuBau);
    return response;
  },
);

export const removePhieuBau = createAsyncThunk('phieuBau/removePhieuBau', async (id: number) => {
  await deletePhieuBau(id);
  return id;
});

const phieuBauSlice = createSlice({
  name: 'phieuBau',
  initialState: trangThaiBanDau,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacPhieuBau.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchCacPhieuBau.fulfilled, (state, action: PayloadAction<PhieuBau[]>) => {
        state.cacPhieuBau = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchCacPhieuBau.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(addPhieuBau.fulfilled, (state, action: PayloadAction<PhieuBau>) => {
        state.cacPhieuBau.push(action.payload);
      })
      .addCase(editPhieuBau.fulfilled, (state, action: PayloadAction<PhieuBau>) => {
        const index = state.cacPhieuBau.findIndex((phieuBau) => phieuBau.id === action.payload.id);
        if (index !== -1) {
          state.cacPhieuBau[index] = action.payload;
        }
      })
      .addCase(removePhieuBau.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacPhieuBau = state.cacPhieuBau.filter((phieuBau) => phieuBau.id !== action.payload);
      });
  },
});

export default phieuBauSlice.reducer;
