import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { TaiKhoanVaiTroAdmin } from '../types';
import {
  fetchTaiKhoanVaiTroAdmin,
  fetchTaiKhoanVaiTroAdminById,
  updateTaiKhoanVaiTroAdminById,
  createTaiKhoanVaiTroAdmin,
  deleteTaiKhoanVaiTroAdminById,
  searchTaiKhoanVaiTroAdmin,
} from '../../api/taiKhoanVaiTroAdminApi';

interface TrangThaiTaiKhoanVaiTroAdmin {
  taiKhoanVaiTroAdmins: TaiKhoanVaiTroAdmin[];
  taiKhoanVaiTroAdmin: TaiKhoanVaiTroAdmin | null;
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiTaiKhoanVaiTroAdmin = {
  taiKhoanVaiTroAdmins: [],
  taiKhoanVaiTroAdmin: null,
  dangTai: false,
  loi: null,
};

export const fetchAllTaiKhoanVaiTroAdmins = createAsyncThunk(
  'taiKhoanVaiTroAdmin/fetchAll',
  async () => {
    const response = await fetchTaiKhoanVaiTroAdmin();
    return response;
  },
);

export const fetchTaiKhoanVaiTroAdminByIdThunk = createAsyncThunk(
  'taiKhoanVaiTroAdmin/fetchById',
  async (id: number) => {
    const response = await fetchTaiKhoanVaiTroAdminById(id);
    return response;
  },
);

export const addTaiKhoanVaiTroAdmin = createAsyncThunk(
  'taiKhoanVaiTroAdmin/add',
  async (taiKhoanVaiTroAdmin: Omit<TaiKhoanVaiTroAdmin, 'id'>) => {
    const response = await createTaiKhoanVaiTroAdmin(taiKhoanVaiTroAdmin as TaiKhoanVaiTroAdmin);
    return response;
  },
);

export const editTaiKhoanVaiTroAdmin = createAsyncThunk(
  'taiKhoanVaiTroAdmin/edit',
  async ({
    id,
    taiKhoanVaiTroAdmin,
  }: {
    id: number;
    taiKhoanVaiTroAdmin: Partial<TaiKhoanVaiTroAdmin>;
  }) => {
    const response = await updateTaiKhoanVaiTroAdminById(id, {
      ...taiKhoanVaiTroAdmin,
      id,
    } as TaiKhoanVaiTroAdmin);
    return response;
  },
);

export const removeTaiKhoanVaiTroAdmin = createAsyncThunk(
  'taiKhoanVaiTroAdmin/remove',
  async (id: number) => {
    await deleteTaiKhoanVaiTroAdminById(id);
    return id;
  },
);

export const searchTaiKhoanVaiTroAdminThunk = createAsyncThunk(
  'taiKhoanVaiTroAdmin/search',
  async (params: { tenVaiTro?: string; tenDangNhap?: string; email?: string }) => {
    const response = await searchTaiKhoanVaiTroAdmin(params);
    return response;
  },
);

const taiKhoanVaiTroAdminSlice = createSlice({
  name: 'taiKhoanVaiTroAdmin',
  initialState: trangThaiBanDau,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTaiKhoanVaiTroAdmins.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(
        fetchAllTaiKhoanVaiTroAdmins.fulfilled,
        (state, action: PayloadAction<TaiKhoanVaiTroAdmin[]>) => {
          state.taiKhoanVaiTroAdmins = action.payload;
          state.dangTai = false;
        },
      )
      .addCase(fetchAllTaiKhoanVaiTroAdmins.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(
        fetchTaiKhoanVaiTroAdminByIdThunk.fulfilled,
        (state, action: PayloadAction<TaiKhoanVaiTroAdmin>) => {
          state.taiKhoanVaiTroAdmin = action.payload;
        },
      )
      .addCase(
        addTaiKhoanVaiTroAdmin.fulfilled,
        (state, action: PayloadAction<TaiKhoanVaiTroAdmin>) => {
          state.taiKhoanVaiTroAdmins.push(action.payload);
        },
      )
      .addCase(
        editTaiKhoanVaiTroAdmin.fulfilled,
        (state, action: PayloadAction<TaiKhoanVaiTroAdmin>) => {
          const index = state.taiKhoanVaiTroAdmins.findIndex(
            (taiKhoanVaiTroAdmin: TaiKhoanVaiTroAdmin) =>
              taiKhoanVaiTroAdmin.id === action.payload.id,
          );
          if (index !== -1) {
            state.taiKhoanVaiTroAdmins[index] = action.payload;
          }
        },
      )
      .addCase(removeTaiKhoanVaiTroAdmin.fulfilled, (state, action: PayloadAction<number>) => {
        state.taiKhoanVaiTroAdmins = state.taiKhoanVaiTroAdmins.filter(
          (taiKhoanVaiTroAdmin: TaiKhoanVaiTroAdmin) => taiKhoanVaiTroAdmin.id !== action.payload,
        );
      })
      .addCase(
        searchTaiKhoanVaiTroAdminThunk.fulfilled,
        (state, action: PayloadAction<TaiKhoanVaiTroAdmin[]>) => {
          state.taiKhoanVaiTroAdmins = action.payload;
        },
      );
  },
});

export default taiKhoanVaiTroAdminSlice.reducer;
