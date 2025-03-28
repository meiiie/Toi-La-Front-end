import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { VaiTroChucNang } from '../types';
import {
  getCacVaiTroChucNang,
  getCacVaiTroChucNangId,
  createVaiTroChucNang,
  updateVaiTroChucNang,
  deleteVaiTroChucNang,
} from '../../api/vaiTroChucNangApi';

interface TrangThaiVaiTroChucNang {
  cacVaiTroChucNang: VaiTroChucNang[];
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiVaiTroChucNang = {
  cacVaiTroChucNang: [],
  dangTai: false,
  loi: null,
};

export const fetchCacVaiTroChucNang = createAsyncThunk(
  'vaiTroChucNang/fetchCacVaiTroChucNang',
  async () => {
    const response = await getCacVaiTroChucNang();
    return response;
  },
);

export const fetchCacVaiTroChucNangId = createAsyncThunk(
  'vaiTroChucNang/fetchCacVaiTroChucNangId',
  async (id: number) => {
    const response = await getCacVaiTroChucNangId(id);
    return response;
  },
);

export const addVaiTroChucNang = createAsyncThunk(
  'vaiTroChucNang/addVaiTroChucNang',
  async (vaiTroChucNang: Omit<VaiTroChucNang, 'id'>) => {
    const response = await createVaiTroChucNang(vaiTroChucNang);
    return response;
  },
);

export const editVaiTroChucNang = createAsyncThunk(
  'vaiTroChucNang/editVaiTroChucNang',
  async (vaiTroChucNang: VaiTroChucNang) => {
    const response = await updateVaiTroChucNang(vaiTroChucNang);
    return response;
  },
);

export const removeVaiTroChucNang = createAsyncThunk(
  'vaiTroChucNang/removeVaiTroChucNang',
  async (id: number) => {
    await deleteVaiTroChucNang(id);
    return id;
  },
);

const vaiTroChucNangSlice = createSlice({
  name: 'vaiTroChucNang',
  initialState: trangThaiBanDau,
  reducers: {
    datCacVaiTroChucNang: (state, action: PayloadAction<VaiTroChucNang[]>) => {
      state.cacVaiTroChucNang = action.payload;
    },
    themVaiTroChucNang: (state, action: PayloadAction<VaiTroChucNang>) => {
      state.cacVaiTroChucNang.push(action.payload);
    },
    capNhatVaiTroChucNang: (state, action: PayloadAction<VaiTroChucNang>) => {
      const index = state.cacVaiTroChucNang.findIndex(
        (vaiTroChucNang) => vaiTroChucNang.id === action.payload.id,
      );
      if (index !== -1) {
        state.cacVaiTroChucNang[index] = action.payload;
      }
    },
    xoaVaiTroChucNang: (state, action: PayloadAction<number>) => {
      state.cacVaiTroChucNang = state.cacVaiTroChucNang.filter(
        (vaiTroChucNang) => vaiTroChucNang.id !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacVaiTroChucNang.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(
        fetchCacVaiTroChucNang.fulfilled,
        (state, action: PayloadAction<VaiTroChucNang[]>) => {
          state.cacVaiTroChucNang = action.payload;
          state.dangTai = false;
        },
      )
      .addCase(fetchCacVaiTroChucNang.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(
        fetchCacVaiTroChucNangId.fulfilled,
        (state, action: PayloadAction<VaiTroChucNang>) => {
          const index = state.cacVaiTroChucNang.findIndex(
            (vaiTroChucNang) => vaiTroChucNang.id === action.payload.id,
          );
          if (index !== -1) {
            state.cacVaiTroChucNang[index] = action.payload;
          } else {
            state.cacVaiTroChucNang.push(action.payload);
          }
        },
      )
      .addCase(addVaiTroChucNang.fulfilled, (state, action: PayloadAction<VaiTroChucNang>) => {
        state.cacVaiTroChucNang.push(action.payload);
      })
      .addCase(editVaiTroChucNang.fulfilled, (state, action: PayloadAction<VaiTroChucNang>) => {
        const index = state.cacVaiTroChucNang.findIndex(
          (vaiTroChucNang) => vaiTroChucNang.id === action.payload.id,
        );
        if (index !== -1) {
          state.cacVaiTroChucNang[index] = action.payload;
        }
      })
      .addCase(removeVaiTroChucNang.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacVaiTroChucNang = state.cacVaiTroChucNang.filter(
          (vaiTroChucNang) => vaiTroChucNang.id !== action.payload,
        );
      });
  },
});

export const {
  datCacVaiTroChucNang,
  themVaiTroChucNang,
  capNhatVaiTroChucNang,
  xoaVaiTroChucNang,
} = vaiTroChucNangSlice.actions;
export default vaiTroChucNangSlice.reducer;
