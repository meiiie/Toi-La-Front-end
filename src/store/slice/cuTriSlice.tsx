import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { CuTri } from '../types';
import {
  getCacCuTri,
  getCuTriById,
  getCuTriByPhienBauCuId,
  getCuTriByCuocBauCuId,
  createCuTri,
  createBulkCuTri,
  updateCuTri,
  updateBulkCuTri,
  deleteCuTri,
  deleteCuTriByPhienBauCuId,
  deleteCuTriByCuocBauCuId,
  deleteMultipleCuTri,
} from '../../api/cuTriApi';

interface TrangThaiCuTri {
  cacCuTri: CuTri[];
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiCuTri = {
  cacCuTri: [],
  dangTai: false,
  loi: null,
};

export const fetchCacCuTri = createAsyncThunk('cacCuTri/fetchCacCuTri', async () => {
  const response = await getCacCuTri();
  return response;
});

export const fetchCuTriById = createAsyncThunk('cacCuTri/fetchCuTriById', async (id: number) => {
  const response = await getCuTriById(id);
  return response;
});

export const fetchCuTriByPhienBauCuId = createAsyncThunk(
  'cacCuTri/fetchCuTriByPhienBauCuId',
  async (phienBauCuId: number) => {
    const response = await getCuTriByPhienBauCuId(phienBauCuId);
    return response;
  },
);

export const fetchCuTriByCuocBauCuId = createAsyncThunk(
  'cacCuTri/fetchCuTriByCuocBauCuId',
  async (cuocBauCuId: number) => {
    const response = await getCuTriByCuocBauCuId(cuocBauCuId);
    return response;
  },
);

export const addCuTri = createAsyncThunk('cacCuTri/addCuTri', async (cuTri: CuTri) => {
  const response = await createCuTri(cuTri);
  return response;
});

export const addBulkCuTri = createAsyncThunk(
  'cacCuTri/addBulkCuTri',
  async (cuTris: Omit<CuTri, 'id'>[]) => {
    const response = await createBulkCuTri(cuTris);
    return response;
  },
);

export const editCuTri = createAsyncThunk(
  'cacCuTri/editCuTri',
  async ({ id, cuTri }: { id: number; cuTri: CuTri }) => {
    const response = await updateCuTri(id, cuTri);
    return response;
  },
);

export const editBulkCuTri = createAsyncThunk('cacCuTri/editBulkCuTri', async (cuTris: CuTri[]) => {
  const response = await updateBulkCuTri(cuTris);
  return response;
});

export const removeCuTri = createAsyncThunk('cacCuTri/removeCuTri', async (id: number) => {
  await deleteCuTri(id);
  return id;
});

export const removeCuTriByPhienBauCuId = createAsyncThunk(
  'cacCuTri/removeCuTriByPhienBauCuId',
  async (phienBauCuId: number) => {
    await deleteCuTriByPhienBauCuId(phienBauCuId);
    return phienBauCuId;
  },
);

export const removeCuTriByCuocBauCuId = createAsyncThunk(
  'cacCuTri/removeCuTriByCuocBauCuId',
  async (cuocBauCuId: number) => {
    await deleteCuTriByCuocBauCuId(cuocBauCuId);
    return cuocBauCuId;
  },
);

export const removeMultipleCuTri = createAsyncThunk(
  'cacCuTri/removeMultipleCuTri',
  async (ids: number[]) => {
    await deleteMultipleCuTri(ids);
    return ids;
  },
);

const cuTriSlice = createSlice({
  name: 'cacCuTri',
  initialState: trangThaiBanDau,
  reducers: {
    clearCuTriState: (state) => {
      state.cacCuTri = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacCuTri.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchCacCuTri.fulfilled, (state, action: PayloadAction<CuTri[]>) => {
        state.cacCuTri = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchCacCuTri.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(fetchCuTriById.fulfilled, (state, action: PayloadAction<CuTri>) => {
        const index = state.cacCuTri.findIndex((cuTri) => cuTri.id === action.payload.id);
        if (index !== -1) {
          state.cacCuTri[index] = action.payload;
        } else {
          state.cacCuTri.push(action.payload);
        }
      })
      .addCase(fetchCuTriByPhienBauCuId.fulfilled, (state, action: PayloadAction<CuTri[]>) => {
        state.cacCuTri = action.payload;
      })
      .addCase(fetchCuTriByCuocBauCuId.fulfilled, (state, action: PayloadAction<CuTri[]>) => {
        state.cacCuTri = action.payload;
      })
      .addCase(addCuTri.fulfilled, (state, action: PayloadAction<CuTri>) => {
        state.cacCuTri.push(action.payload);
      })
      .addCase(addBulkCuTri.fulfilled, (state, action: PayloadAction<CuTri[]>) => {
        state.cacCuTri = state.cacCuTri.concat(action.payload);
      })
      .addCase(editCuTri.fulfilled, (state, action: PayloadAction<CuTri>) => {
        const index = state.cacCuTri.findIndex((cuTri) => cuTri.id === action.payload.id);
        if (index !== -1) {
          state.cacCuTri[index] = action.payload;
        }
      })
      .addCase(editBulkCuTri.fulfilled, (state, action: PayloadAction<CuTri[]>) => {
        action.payload.forEach((updatedCuTri) => {
          const index = state.cacCuTri.findIndex((cuTri) => cuTri.id === updatedCuTri.id);
          if (index !== -1) {
            state.cacCuTri[index] = updatedCuTri;
          }
        });
      })
      .addCase(removeCuTri.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacCuTri = state.cacCuTri.filter((cuTri) => cuTri.id !== action.payload);
      })
      .addCase(removeCuTriByPhienBauCuId.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacCuTri = state.cacCuTri.filter((cuTri) => cuTri.phienBauCuId !== action.payload);
      })
      .addCase(removeCuTriByCuocBauCuId.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacCuTri = state.cacCuTri.filter((cuTri) => cuTri.cuocBauCuId !== action.payload);
      })
      .addCase(removeMultipleCuTri.fulfilled, (state, action: PayloadAction<number[]>) => {
        state.cacCuTri = state.cacCuTri.filter((cuTri) => !action.payload.includes(cuTri.id));
      });
  },
});

export default cuTriSlice.reducer;
export const { clearCuTriState } = cuTriSlice.actions;
