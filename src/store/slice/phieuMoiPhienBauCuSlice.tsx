import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PhieuMoiPhienBauCu } from '../types';
import {
  getDanhSachPhieuMoi,
  getPhieuMoiById,
  createPhieuMoi,
  updatePhieuMoi,
  deletePhieuMoi,
  validateInvite,
  revokeInvite,
  joinPhienBauCu,
} from '../../api/phieuMoiPhienBauCuApi';

interface PhieuMoiPhienBauCuState {
  danhSachPhieuMoi: PhieuMoiPhienBauCu[];
  phieuMoi: PhieuMoiPhienBauCu | null;
  dangTai: boolean;
  loi: string | null;
}

const initialState: PhieuMoiPhienBauCuState = {
  danhSachPhieuMoi: [],
  phieuMoi: null,
  dangTai: false,
  loi: null,
};

export const fetchDanhSachPhieuMoi = createAsyncThunk(
  'phieuMoiPhienBauCu/fetchDanhSachPhieuMoi',
  async () => {
    const response = await getDanhSachPhieuMoi();
    return response;
  },
);

export const fetchPhieuMoiById = createAsyncThunk(
  'phieuMoiPhienBauCu/fetchPhieuMoiById',
  async (id: number) => {
    const response = await getPhieuMoiById(id);
    return response;
  },
);

export const taoPhieuMoi = createAsyncThunk(
  'phieuMoiPhienBauCu/taoPhieuMoi',
  async (data: { phienBauCuId: number; cuocBauCuId: number; nguoiTaoId: number }) => {
    const response = await createPhieuMoi(data);
    return response;
  },
);

export const capNhatPhieuMoi = createAsyncThunk(
  'phieuMoiPhienBauCu/capNhatPhieuMoi',
  async ({ id, data }: { id: number; data: PhieuMoiPhienBauCu }) => {
    await updatePhieuMoi(id, data);
    return { id, data };
  },
);

export const xoaPhieuMoi = createAsyncThunk(
  'phieuMoiPhienBauCu/xoaPhieuMoi',
  async (id: number) => {
    await deletePhieuMoi(id);
    return id;
  },
);

export const xacThucPhieuMoi = createAsyncThunk(
  'phieuMoiPhienBauCu/xacThucPhieuMoi',
  async (token: string) => {
    const response = await validateInvite(token);
    return response;
  },
);

export const thuHoiPhieuMoi = createAsyncThunk(
  'phieuMoiPhienBauCu/thuHoiPhieuMoi',
  async (token: string) => {
    await revokeInvite(token);
    return token;
  },
);

export const thamGiaPhienBauCu = createAsyncThunk(
  'phieuMoiPhienBauCu/thamGiaPhienBauCu',
  async (data: { token: string; sdt: string }) => {
    const response = await joinPhienBauCu(data);
    return response;
  },
);

const phieuMoiPhienBauCuSlice = createSlice({
  name: 'phieuMoiPhienBauCu',
  initialState,
  reducers: {
    clearState: (state) => {
      state.danhSachPhieuMoi = [];
      state.phieuMoi = null;
      state.dangTai = false;
      state.loi = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDanhSachPhieuMoi.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchDanhSachPhieuMoi.fulfilled, (state, action) => {
        state.danhSachPhieuMoi = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchDanhSachPhieuMoi.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi lấy danh sách phiếu mời';
        state.dangTai = false;
      })
      .addCase(fetchPhieuMoiById.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(fetchPhieuMoiById.fulfilled, (state, action) => {
        state.phieuMoi = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchPhieuMoiById.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi lấy chi tiết phiếu mời';
        state.dangTai = false;
      })
      .addCase(taoPhieuMoi.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(taoPhieuMoi.fulfilled, (state, action) => {
        state.phieuMoi = action.payload;
        state.dangTai = false;
      })
      .addCase(taoPhieuMoi.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi tạo phiếu mời';
        state.dangTai = false;
      })
      .addCase(capNhatPhieuMoi.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(capNhatPhieuMoi.fulfilled, (state, action) => {
        const index = state.danhSachPhieuMoi.findIndex((phieu) => phieu.id === action.payload.id);
        if (index !== -1) {
          state.danhSachPhieuMoi[index] = action.payload.data;
        }
        state.dangTai = false;
      })
      .addCase(capNhatPhieuMoi.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi cập nhật phiếu mời';
        state.dangTai = false;
      })
      .addCase(xoaPhieuMoi.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(xoaPhieuMoi.fulfilled, (state, action) => {
        state.danhSachPhieuMoi = state.danhSachPhieuMoi.filter(
          (phieu) => phieu.id !== action.payload,
        );
        state.dangTai = false;
      })
      .addCase(xoaPhieuMoi.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi xóa phiếu mời';
        state.dangTai = false;
      })
      .addCase(xacThucPhieuMoi.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(xacThucPhieuMoi.fulfilled, (state, action) => {
        state.phieuMoi = action.payload;
        state.dangTai = false;
      })
      .addCase(xacThucPhieuMoi.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi xác thực phiếu mời';
        state.dangTai = false;
      })
      .addCase(thuHoiPhieuMoi.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(thuHoiPhieuMoi.fulfilled, (state, action) => {
        state.danhSachPhieuMoi = state.danhSachPhieuMoi.filter(
          (phieu) => phieu.token !== action.payload,
        );
        state.dangTai = false;
      })
      .addCase(thuHoiPhieuMoi.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi thu hồi phiếu mời';
        state.dangTai = false;
      })
      .addCase(thamGiaPhienBauCu.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(thamGiaPhienBauCu.fulfilled, (state, action) => {
        state.phieuMoi = action.payload;
        state.dangTai = false;
      })
      .addCase(thamGiaPhienBauCu.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi tham gia phiên bầu cử';
        state.dangTai = false;
      });
  },
});

export const { clearState } = phieuMoiPhienBauCuSlice.actions;

export default phieuMoiPhienBauCuSlice.reducer;
