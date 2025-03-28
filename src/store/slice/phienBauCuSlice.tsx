import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PhienBauCu } from '../types';
import {
  getCacPhienBauCu,
  taoPhienBauCu,
  capNhatPhienBauCu,
  xoaPhienBauCu,
  getPhienBauCuByCuocBauCuId,
  timPhienBauCuByTen,
  getPhienBauCuById, // Import hàm mới
} from '../../api/phienBauCuApi';

interface TrangThaiPhienBauCu {
  cacPhienBauCu: PhienBauCu[];
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiPhienBauCu = {
  cacPhienBauCu: [],
  dangTai: false,
  loi: null,
};

export const fetchCacPhienBauCu = createAsyncThunk('phienBauCu/fetchCacPhienBauCu', async () => {
  const response = await getCacPhienBauCu();
  return response;
});

export const addPhienBauCu = createAsyncThunk(
  'phienBauCu/addPhienBauCu',
  async (phienBauCu: PhienBauCu) => {
    const response = await taoPhienBauCu(phienBauCu);
    return response;
  },
);

export const editPhienBauCu = createAsyncThunk(
  'phienBauCu/editPhienBauCu',
  async (phienBauCu: PhienBauCu) => {
    const response = await capNhatPhienBauCu(phienBauCu);
    return response;
  },
);

export const fetchCacPhienBauCuByCuocBauCuId = createAsyncThunk(
  'phienBauCu/fetchCacPhienBauCuByCuocBauCuId',
  async (cuocBauCuId: number) => {
    const response = await getPhienBauCuByCuocBauCuId(cuocBauCuId);
    return response;
  },
);

export const removePhienBauCu = createAsyncThunk(
  'phienBauCu/removePhienBauCu',
  async (id: number) => {
    await xoaPhienBauCu(id);
    return id;
  },
);

export const fetchPhienBauCuByTen = createAsyncThunk(
  'phienBauCu/fetchPhienBauCuByTen',
  async (tenPhienBauCu: string) => {
    const response = await timPhienBauCuByTen(tenPhienBauCu);
    return response;
  },
);

// Thêm hàm mới để tìm phiên bầu cử theo ID
export const fetchPhienBauCuById = createAsyncThunk(
  'phienBauCu/fetchPhienBauCuById',
  async (id: number) => {
    const response = await getPhienBauCuById(id);
    return response;
  },
);

const phienBauCuSlice = createSlice({
  name: 'phienBauCu',
  initialState: trangThaiBanDau,
  reducers: {
    // Thêm action reset state về giá trị ban đầu
    resetPhienBauCuState: (state) => {
      // Sử dụng Object.assign để reset toàn bộ state về giá trị ban đầu
      Object.assign(state, trangThaiBanDau);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacPhienBauCu.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchCacPhienBauCu.fulfilled, (state, action: PayloadAction<PhienBauCu[]>) => {
        state.cacPhienBauCu = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchCacPhienBauCu.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(fetchCacPhienBauCuByCuocBauCuId.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(
        fetchCacPhienBauCuByCuocBauCuId.fulfilled,
        (state, action: PayloadAction<PhienBauCu[]>) => {
          state.dangTai = false;
          state.cacPhienBauCu = action.payload;
        },
      )
      .addCase(fetchCacPhienBauCuByCuocBauCuId.rejected, (state, action) => {
        state.dangTai = false;
        state.loi = action.error.message + ' Khong co phien bau cu nao';
        console.log(action.error.message);
      })
      .addCase(addPhienBauCu.fulfilled, (state, action: PayloadAction<PhienBauCu>) => {
        state.cacPhienBauCu.push(action.payload);
      })
      .addCase(editPhienBauCu.fulfilled, (state, action: PayloadAction<PhienBauCu>) => {
        const index = state.cacPhienBauCu.findIndex(
          (phienBauCu) => phienBauCu.id === action.payload.id,
        );
        if (index !== -1) {
          state.cacPhienBauCu[index] = action.payload;
        }
      })
      .addCase(removePhienBauCu.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacPhienBauCu = state.cacPhienBauCu.filter(
          (phienBauCu) => phienBauCu.id !== action.payload,
        );
      })
      .addCase(fetchPhienBauCuByTen.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(fetchPhienBauCuByTen.fulfilled, (state, action: PayloadAction<PhienBauCu[]>) => {
        state.dangTai = false;
        state.cacPhienBauCu = action.payload;
      })
      .addCase(fetchPhienBauCuByTen.rejected, (state, action) => {
        state.dangTai = false;
        state.loi = action.error.message + ' Ten Phien Bau Cu Duoc Phep Dung';
        console.log(action.error.message);
      })
      // Thêm case cho fetchPhienBauCuById
      .addCase(fetchPhienBauCuById.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(fetchPhienBauCuById.fulfilled, (state, action: PayloadAction<PhienBauCu>) => {
        state.dangTai = false;
        state.cacPhienBauCu = [action.payload];
      })
      .addCase(fetchPhienBauCuById.rejected, (state, action) => {
        state.dangTai = false;
        state.loi = action.error.message || 'Có lỗi xảy ra';
      });
  },
});

// Export action reset
export const { resetPhienBauCuState } = phienBauCuSlice.actions;

export default phienBauCuSlice.reducer;
