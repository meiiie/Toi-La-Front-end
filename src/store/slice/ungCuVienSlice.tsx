import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { UngCuVien } from '../types';
import {
  getCacUngCuVien,
  createUngCuVien,
  getUngCuVienById,
  updateUngCuVien,
  deleteUngCuVien,
  getUngCuVienByPhienBauCuId,
  getUngCuVienByCuocBauCuId,
  createBulkUngCuVien,
  updateBulkUngCuVien,
  deleteUngCuVienByPhienBauCuId,
  deleteUngCuVienByCuocBauCuId,
  deleteMultipleUngCuVien,
} from '../../api/ungVienApi';

interface TrangThaiUngCuVien {
  cacUngCuVien: UngCuVien[];
  ungCuVienChiTiet: UngCuVien | null;
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiUngCuVien = {
  cacUngCuVien: [],
  ungCuVienChiTiet: null,
  dangTai: false,
  loi: null,
};

export const fetchCacUngCuVien = createAsyncThunk('ungCuVien/fetchCacUngCuVien', async () => {
  const response = await getCacUngCuVien();
  return response;
});

export const fetchUngCuVienById = createAsyncThunk(
  'ungCuVien/fetchUngCuVienById',
  async (id: number) => {
    const response = await getUngCuVienById(id);
    return response;
  },
);

export const fetchUngCuVienByPhienBauCuId = createAsyncThunk(
  'ungCuVien/fetchUngCuVienByPhienBauCuId',
  async (phienBauCuId: number) => {
    const response = await getUngCuVienByPhienBauCuId(phienBauCuId);
    return response;
  },
);

export const fetchUngCuVienByCuocBauCuId = createAsyncThunk(
  'ungCuVien/fetchUngCuVienByCuocBauCuId',
  async (cuocBauCuId: number) => {
    const response = await getUngCuVienByCuocBauCuId(cuocBauCuId);
    return response;
  },
);

export const addUngCuVien = createAsyncThunk(
  'ungCuVien/addUngCuVien',
  async (ungCuVien: UngCuVien) => {
    const response = await createUngCuVien(ungCuVien);
    return response;
  },
);

export const addBulkUngCuVien = createAsyncThunk(
  'ungCuVien/addBulkUngCuVien',
  async (ungCuViens: Omit<UngCuVien, 'id'>[]) => {
    const response = await createBulkUngCuVien(ungCuViens);
    return response;
  },
);

export const editUngCuVien = createAsyncThunk(
  'ungCuVien/editUngCuVien',
  async ({ id, ungCuVien }: { id: number; ungCuVien: UngCuVien }) => {
    const response = await updateUngCuVien(id, ungCuVien);
    return response;
  },
);

export const editBulkUngCuVien = createAsyncThunk(
  'ungCuVien/editBulkUngCuVien',
  async (ungCuViens: UngCuVien[]) => {
    const response = await updateBulkUngCuVien(ungCuViens);
    return response;
  },
);

export const removeUngCuVien = createAsyncThunk('ungCuVien/removeUngCuVien', async (id: number) => {
  await deleteUngCuVien(id);
  return id;
});

export const removeUngCuVienByPhienBauCuId = createAsyncThunk(
  'ungCuVien/removeUngCuVienByPhienBauCuId',
  async (phienBauCuId: number) => {
    await deleteUngCuVienByPhienBauCuId(phienBauCuId);
    return phienBauCuId;
  },
);

export const removeUngCuVienByCuocBauCuId = createAsyncThunk(
  'ungCuVien/removeUngCuVienByCuocBauCuId',
  async (cuocBauCuId: number) => {
    await deleteUngCuVienByCuocBauCuId(cuocBauCuId);
    return cuocBauCuId;
  },
);

export const removeMultipleUngCuVien = createAsyncThunk(
  'ungCuVien/removeMultipleUngCuVien',
  async (ids: number[]) => {
    await deleteMultipleUngCuVien(ids);
    return ids;
  },
);

const ungCuVienSlice = createSlice({
  name: 'ungCuVien',
  initialState: trangThaiBanDau,
  reducers: {
    datCacUngCuVien: (state, action: PayloadAction<UngCuVien[]>) => {
      state.cacUngCuVien = action.payload;
    },
    themUngCuVien: (state, action: PayloadAction<UngCuVien>) => {
      state.cacUngCuVien.push(action.payload);
    },
    capNhatUngCuVien: (state, action: PayloadAction<UngCuVien>) => {
      const index = state.cacUngCuVien.findIndex((ungCuVien) => ungCuVien.id === action.payload.id);
      if (index !== -1) {
        state.cacUngCuVien[index] = action.payload;
      }
    },
    xoaUngCuVien: (state, action: PayloadAction<number>) => {
      state.cacUngCuVien = state.cacUngCuVien.filter(
        (ungCuVien) => ungCuVien.id !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacUngCuVien.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchCacUngCuVien.fulfilled, (state, action: PayloadAction<UngCuVien[]>) => {
        state.cacUngCuVien = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchCacUngCuVien.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(fetchUngCuVienById.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchUngCuVienById.fulfilled, (state, action: PayloadAction<UngCuVien>) => {
        state.ungCuVienChiTiet = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchUngCuVienById.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(
        fetchUngCuVienByPhienBauCuId.fulfilled,
        (state, action: PayloadAction<UngCuVien[]>) => {
          state.cacUngCuVien = action.payload;
        },
      )
      .addCase(
        fetchUngCuVienByCuocBauCuId.fulfilled,
        (state, action: PayloadAction<UngCuVien[]>) => {
          state.cacUngCuVien = action.payload;
        },
      )
      .addCase(addUngCuVien.fulfilled, (state, action: PayloadAction<UngCuVien>) => {
        state.cacUngCuVien.push(action.payload);
      })
      .addCase(addBulkUngCuVien.fulfilled, (state, action: PayloadAction<UngCuVien[]>) => {
        state.cacUngCuVien = state.cacUngCuVien.concat(action.payload);
      })
      .addCase(editUngCuVien.fulfilled, (state, action: PayloadAction<UngCuVien>) => {
        const index = state.cacUngCuVien.findIndex(
          (ungCuVien) => ungCuVien.id === action.payload.id,
        );
        if (index !== -1) {
          state.cacUngCuVien[index] = action.payload;
        }
      })
      .addCase(editBulkUngCuVien.fulfilled, (state, action: PayloadAction<UngCuVien[]>) => {
        action.payload.forEach((updatedUngCuVien) => {
          const index = state.cacUngCuVien.findIndex(
            (ungCuVien) => ungCuVien.id === updatedUngCuVien.id,
          );
          if (index !== -1) {
            state.cacUngCuVien[index] = updatedUngCuVien;
          }
        });
      })
      .addCase(removeUngCuVien.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacUngCuVien = state.cacUngCuVien.filter(
          (ungCuVien) => ungCuVien.id !== action.payload,
        );
      })
      .addCase(removeUngCuVienByPhienBauCuId.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacUngCuVien = state.cacUngCuVien.filter(
          (ungCuVien) => ungCuVien.phienBauCuId !== action.payload,
        );
      })
      .addCase(removeUngCuVienByCuocBauCuId.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacUngCuVien = state.cacUngCuVien.filter(
          (ungCuVien) => ungCuVien.cuocBauCuId !== action.payload,
        );
      })
      .addCase(removeMultipleUngCuVien.fulfilled, (state, action: PayloadAction<number[]>) => {
        state.cacUngCuVien = state.cacUngCuVien.filter(
          (ungCuVien) => !action.payload.includes(ungCuVien.id),
        );
      });
  },
});

export const { datCacUngCuVien, themUngCuVien, capNhatUngCuVien, xoaUngCuVien } =
  ungCuVienSlice.actions;
export default ungCuVienSlice.reducer;
