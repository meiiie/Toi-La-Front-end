import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { CuocBauCu } from '../types';
import {
  getCacCuocBauCu,
  createCuocBauCu,
  updateCuocBauCu,
  deleteCuocBauCu,
  getCuocBauCuById,
  timCuocBauCuTheoTen,
  getCuocBauCuByTaiKhoanId, // Import the new API function
} from '../../api/cuocBauCuApi';

interface TrangThaiCuocBauCu {
  cacCuocBauCu: CuocBauCu[];
  cacCuocBauCuNguoiDung: CuocBauCu[];
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiCuocBauCu = {
  cacCuocBauCu: [],
  cacCuocBauCuNguoiDung: [],
  dangTai: false,
  loi: null,
};

export const fetchCacCuocBauCu = createAsyncThunk('cuocBauCu/fetchCacCuocBauCu', async () => {
  const response = await getCacCuocBauCu();
  return response;
});

export const addCuocBauCu = createAsyncThunk(
  'cuocBauCu/addCuocBauCu',
  async (cuocBauCu: CuocBauCu) => {
    const response = await createCuocBauCu(cuocBauCu);
    return response;
  },
);

export const editCuocBauCu = createAsyncThunk(
  'cuocBauCu/editCuocBauCu',
  async (cuocBauCu: CuocBauCu) => {
    const response = await updateCuocBauCu(cuocBauCu);
    return response;
  },
);

export const removeCuocBauCu = createAsyncThunk('cuocBauCu/removeCuocBauCu', async (id: number) => {
  await deleteCuocBauCu(id);
  return id;
});

export const validateElectionId = createAsyncThunk(
  'cuocBauCu/validateElectionId',
  async (id: number) => {
    await getCuocBauCuById(id);
    return id;
  },
);

export const searchCuocBauCuByName = createAsyncThunk(
  'cuocBauCu/searchCuocBauCuByName',
  async (tenCuocBauCu: string) => {
    const response = await timCuocBauCuTheoTen(tenCuocBauCu);
    return response;
  },
);

// New async thunk to fetch elections by user ID
export const fetchCuocBauCuByTaiKhoanId = createAsyncThunk(
  'cuocBauCu/fetchCuocBauCuByTaiKhoanId',
  async (taiKhoanId: number) => {
    const response = await getCuocBauCuByTaiKhoanId(taiKhoanId);
    return response;
  },
);

const cuocBauCuSlice = createSlice({
  name: 'cuocBauCu',
  initialState: trangThaiBanDau,
  reducers: {
    // Thêm reducer để reset state
    resetCuocBauCuState: (state) => {
      // Reset state về trạng thái ban đầu
      Object.assign(state, trangThaiBanDau);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacCuocBauCu.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchCacCuocBauCu.fulfilled, (state, action: PayloadAction<CuocBauCu[]>) => {
        state.cacCuocBauCu = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchCacCuocBauCu.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(addCuocBauCu.fulfilled, (state, action: PayloadAction<CuocBauCu>) => {
        state.cacCuocBauCu.push(action.payload);
        state.cacCuocBauCuNguoiDung.push(action.payload);
      })
      .addCase(editCuocBauCu.fulfilled, (state, action: PayloadAction<CuocBauCu>) => {
        const index = state.cacCuocBauCu.findIndex(
          (cuocBauCu) => cuocBauCu.id === action.payload.id,
        );
        if (index !== -1) {
          state.cacCuocBauCu[index] = action.payload;
        }
        const userIndex = state.cacCuocBauCuNguoiDung.findIndex(
          (cuocBauCu) => cuocBauCu.id === action.payload.id,
        );
        if (userIndex !== -1) {
          state.cacCuocBauCuNguoiDung[userIndex] = action.payload;
        }
      })
      .addCase(removeCuocBauCu.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacCuocBauCu = state.cacCuocBauCu.filter(
          (cuocBauCu) => cuocBauCu.id !== action.payload,
        );
        state.cacCuocBauCuNguoiDung = state.cacCuocBauCuNguoiDung.filter(
          (cuocBauCu) => cuocBauCu.id !== action.payload,
        );
      })
      .addCase(validateElectionId.fulfilled, (state, action: PayloadAction<number>) => {
        // No state update needed for validation
      })
      .addCase(searchCuocBauCuByName.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(searchCuocBauCuByName.fulfilled, (state, action: PayloadAction<CuocBauCu>) => {
        state.cacCuocBauCu = [action.payload];
        state.dangTai = false;
      })
      .addCase(searchCuocBauCuByName.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      // Add cases for the new async thunk
      .addCase(fetchCuocBauCuByTaiKhoanId.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(
        fetchCuocBauCuByTaiKhoanId.fulfilled,
        (state, action: PayloadAction<CuocBauCu[]>) => {
          state.cacCuocBauCuNguoiDung = action.payload;
          state.dangTai = false;
        },
      )
      .addCase(fetchCuocBauCuByTaiKhoanId.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      });
  },
});

// Export reset action
export const { resetCuocBauCuState } = cuocBauCuSlice.actions;
export default cuocBauCuSlice.reducer;
