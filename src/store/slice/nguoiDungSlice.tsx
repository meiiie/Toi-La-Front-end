import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { TaoTaiKhoanTamThoi, VaiTro, SearchTaiKhoanResponse } from '../types';
import {
  getCacTaiKhoan,
  createTaiKhoan,
  updateTaiKhoan,
  deleteTaiKhoan,
} from '../../api/nguoiDungApi';
import apiClient from '../../api/apiClient';

interface TrangThaiNguoiDung {
  nguoiDungHienTai: TaoTaiKhoanTamThoi[];
  nguoiDung: TaoTaiKhoanTamThoi | null;
  quyen: string[] | undefined;
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiNguoiDung = {
  nguoiDung: null,
  quyen: undefined,
  dangTai: false,
  nguoiDungHienTai: [],
  loi: null,
};

export const fetchCacTaiKhoan = createAsyncThunk('cacNguoiDung/fetchCacTaiKhoan', async () => {
  const response = await getCacTaiKhoan();
  return response;
});

export const addTaiKhoan = createAsyncThunk(
  'cacNguoiDung/addTaiKhoan',
  async (taiKhoan: Omit<TaoTaiKhoanTamThoi, 'id'>) => {
    const response = await createTaiKhoan(taiKhoan);
    return response;
  },
);

export const editTaiKhoan = createAsyncThunk(
  'cacNguoiDung/editTaiKhoan',
  async ({ id, taiKhoan }: { id: number; taiKhoan: Partial<TaoTaiKhoanTamThoi> }) => {
    const response = await updateTaiKhoan(id, taiKhoan);
    return response;
  },
);

export const removeTaiKhoan = createAsyncThunk(
  'cacNguoiDung/removeTaiKhoan',
  async (id: number) => {
    await deleteTaiKhoan(id);
    return id;
  },
);

export const searchTaiKhoans = createAsyncThunk(
  'cacNguoiDung/searchCacTaiKhoan',
  async (params: { tenDangNhap?: string; email?: string }) => {
    const response = await apiClient.get<SearchTaiKhoanResponse>('/api/tai-khoan/search', {
      params,
    });
    return response.data;
  },
);

const nguoiDungSlice = createSlice({
  name: 'cacNguoiDung',
  initialState: trangThaiBanDau,
  reducers: {
    datNguoiDung: (state, action: PayloadAction<TaoTaiKhoanTamThoi>) => {
      state.nguoiDung = action.payload ?? null;
    },
    capNhatCaiDatNguoiDung: (
      state,
      action: PayloadAction<{
        tenDangNhap: string;
        email?: string;
        sdt?: string;
      }>,
    ) => {
      if (state.nguoiDung) {
        state.nguoiDung.tenDangNhap = action.payload.tenDangNhap;
        state.nguoiDung.email = action.payload.email ?? state.nguoiDung.email;
        state.nguoiDung.sdt = action.payload.sdt ?? state.nguoiDung.sdt;
      }
    },
    hanhDongXacThuc: (state) => {
      state.dangTai = true;
    },
    hanhDongDaXacThuc: (state, action: PayloadAction<TaoTaiKhoanTamThoi | undefined>) => {
      state.nguoiDung = action.payload ?? null;
      state.quyen = Array.isArray(action.payload?.vaiTro)
        ? action.payload?.vaiTro.map((vaiTro: VaiTro) => vaiTro.tenVaiTro)
        : [];
      state.dangTai = false;
    },
    hanhDongCapQuyen: (state) => {
      state.dangTai = true;
    },
    hanhDongDaCapQuyen: (state, action: PayloadAction<string[]>) => {
      state.quyen = action.payload;
      state.dangTai = false;
    },
    hanhDongDangXuat: (state) => {
      state.nguoiDung = null;
      state.quyen = undefined;
      state.dangTai = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacTaiKhoan.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchCacTaiKhoan.fulfilled, (state, action: PayloadAction<TaoTaiKhoanTamThoi[]>) => {
        state.nguoiDungHienTai = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchCacTaiKhoan.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(addTaiKhoan.fulfilled, (state, action: PayloadAction<TaoTaiKhoanTamThoi>) => {
        state.nguoiDungHienTai.push(action.payload);
      })
      .addCase(editTaiKhoan.fulfilled, (state, action: PayloadAction<TaoTaiKhoanTamThoi>) => {
        const index = state.nguoiDungHienTai.findIndex(
          (taiKhoan: TaoTaiKhoanTamThoi) => taiKhoan.id === action.payload.id,
        );
        if (index !== -1) {
          state.nguoiDungHienTai[index] = action.payload;
        }
      })
      .addCase(removeTaiKhoan.fulfilled, (state, action: PayloadAction<number>) => {
        state.nguoiDungHienTai = state.nguoiDungHienTai.filter(
          (taiKhoan: TaoTaiKhoanTamThoi) => taiKhoan.id !== action.payload.toString(),
        );
      })
      .addCase(
        searchTaiKhoans.fulfilled,
        (state, action: PayloadAction<SearchTaiKhoanResponse>) => {
          state.nguoiDungHienTai = action.payload.data;
        },
      );
  },
});

export const {
  datNguoiDung,
  capNhatCaiDatNguoiDung,
  hanhDongXacThuc,
  hanhDongDaXacThuc,
  hanhDongCapQuyen,
  hanhDongDaCapQuyen,
  hanhDongDangXuat,
} = nguoiDungSlice.actions;

export default nguoiDungSlice.reducer;
