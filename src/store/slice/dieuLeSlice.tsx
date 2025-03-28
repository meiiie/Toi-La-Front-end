// dieuLeSlice.tsx
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { DieuLe } from '../types';
import {
  getDieuLeByCuocBauCuId,
  getDanhSachPhienBanDieuLe,
  getDieuLeById,
  capNhatDieuLeBauCu,
  xoaDieuLe,
  capNhatTrangThaiCongBo,
  uploadFileDieuLe,
  guiThongBaoDieuLe,
  xacNhanDaDocDieuLe,
  kiemTraXacNhanDieuLe,
} from '../../api/dieuLeApi';

interface TrangThaiDieuLe {
  dieuLeCuocBauCu: DieuLe | null;
  danhSachPhienBan: DieuLe[];
  dangTai: boolean;
  dangLuu: boolean;
  dangXoa: boolean;
  dangUpload: boolean;
  dangGuiThongBao: boolean;
  dangXacNhan: boolean;
  daXacNhan: boolean | null;
  thoiGianXacNhan: string | null;
  loi: string | null;
  thanhCong: string | null;
}

const trangThaiBanDau: TrangThaiDieuLe = {
  dieuLeCuocBauCu: null,
  danhSachPhienBan: [],
  dangTai: false,
  dangLuu: false,
  dangXoa: false,
  dangUpload: false,
  dangGuiThongBao: false,
  dangXacNhan: false,
  daXacNhan: null,
  thoiGianXacNhan: null,
  loi: null,
  thanhCong: null,
};

export const fetchDieuLeByCuocBauCuId = createAsyncThunk(
  'dieuLe/fetchDieuLeByCuocBauCuId',
  async (cuocBauCuId: number) => {
    const response = await getDieuLeByCuocBauCuId(cuocBauCuId);
    return response;
  },
);

export const fetchDanhSachPhienBan = createAsyncThunk(
  'dieuLe/fetchDanhSachPhienBan',
  async (cuocBauCuId: number) => {
    const response = await getDanhSachPhienBanDieuLe(cuocBauCuId);
    return response;
  },
);

export const fetchDieuLeById = createAsyncThunk('dieuLe/fetchDieuLeById', async (id: number) => {
  const response = await getDieuLeById(id);
  return response;
});

export const capNhatDieuLe = createAsyncThunk(
  'dieuLe/capNhatDieuLe',
  async (dieuLe: Partial<DieuLe>) => {
    const response = await capNhatDieuLeBauCu(dieuLe);
    return response;
  },
);

export const xoaDieuLeById = createAsyncThunk('dieuLe/xoaDieuLeById', async (id: number) => {
  await xoaDieuLe(id);
  return id;
});

export const updateTrangThaiCongBo = createAsyncThunk(
  'dieuLe/updateTrangThaiCongBo',
  async ({ id, daCongBo }: { id: number; daCongBo: boolean }) => {
    const response = await capNhatTrangThaiCongBo(id, daCongBo);
    return response;
  },
);

export const uploadFile = createAsyncThunk(
  'dieuLe/uploadFile',
  async ({ cuocBauCuId, file }: { cuocBauCuId: number; file: File }) => {
    const response = await uploadFileDieuLe(cuocBauCuId, file);
    return response;
  },
);

export const guiThongBao = createAsyncThunk(
  'dieuLe/guiThongBao',
  async ({ dieuLeId, cuocBauCuId }: { dieuLeId: number; cuocBauCuId: number }) => {
    const response = await guiThongBaoDieuLe(dieuLeId, cuocBauCuId);
    return response;
  },
);

export const xacNhanDaDoc = createAsyncThunk(
  'dieuLe/xacNhanDaDoc',
  async ({ dieuLeId, taiKhoanId }: { dieuLeId: number; taiKhoanId: number }) => {
    const response = await xacNhanDaDocDieuLe(dieuLeId, taiKhoanId);
    return response;
  },
);

export const kiemTraXacNhan = createAsyncThunk(
  'dieuLe/kiemTraXacNhan',
  async ({ dieuLeId, taiKhoanId }: { dieuLeId: number; taiKhoanId: number }) => {
    const response = await kiemTraXacNhanDieuLe(dieuLeId, taiKhoanId);
    return response;
  },
);

const dieuLeSlice = createSlice({
  name: 'dieuLe',
  initialState: trangThaiBanDau,
  reducers: {
    resetDieuLeState: (state) => {
      // Xóa toàn bộ state và trở về giá trị ban đầu
      Object.assign(state, trangThaiBanDau);
    },
    resetThongBao: (state) => {
      // Xóa thông báo thành công và lỗi
      state.loi = null;
      state.thanhCong = null;
    },
    setDieuLeCuocBauCu: (state, action: PayloadAction<DieuLe | null>) => {
      state.dieuLeCuocBauCu = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchDieuLeByCuocBauCuId
      .addCase(fetchDieuLeByCuocBauCuId.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(
        fetchDieuLeByCuocBauCuId.fulfilled,
        (state, action: PayloadAction<DieuLe | null>) => {
          state.dieuLeCuocBauCu = action.payload || null;
          state.dangTai = false;
        },
      )
      .addCase(fetchDieuLeByCuocBauCuId.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi tải điều lệ';
        state.dangTai = false;
      })

      // fetchDanhSachPhienBan
      .addCase(fetchDanhSachPhienBan.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(fetchDanhSachPhienBan.fulfilled, (state, action: PayloadAction<DieuLe[]>) => {
        state.danhSachPhienBan = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchDanhSachPhienBan.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi tải danh sách phiên bản';
        state.dangTai = false;
      })

      // fetchDieuLeById
      .addCase(fetchDieuLeById.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(fetchDieuLeById.fulfilled, (state, action: PayloadAction<DieuLe>) => {
        // Cập nhật dieuLeCuocBauCu hoặc cập nhật phiên bản trong danh sách
        state.dieuLeCuocBauCu = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchDieuLeById.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi tải điều lệ';
        state.dangTai = false;
      })

      // capNhatDieuLe
      .addCase(capNhatDieuLe.pending, (state) => {
        state.dangLuu = true;
        state.loi = null;
        state.thanhCong = null;
      })
      .addCase(capNhatDieuLe.fulfilled, (state, action: PayloadAction<DieuLe>) => {
        state.dieuLeCuocBauCu = action.payload;

        // Cập nhật trong danh sách phiên bản
        const index = state.danhSachPhienBan.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.danhSachPhienBan[index] = action.payload;
        } else {
          state.danhSachPhienBan.push(action.payload);
        }

        state.dangLuu = false;
        state.thanhCong = 'Lưu điều lệ thành công';
      })
      .addCase(capNhatDieuLe.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi cập nhật điều lệ';
        state.dangLuu = false;
      })

      // xoaDieuLeById
      .addCase(xoaDieuLeById.pending, (state) => {
        state.dangXoa = true;
        state.loi = null;
        state.thanhCong = null;
      })
      .addCase(xoaDieuLeById.fulfilled, (state, action: PayloadAction<number>) => {
        // Xóa khỏi danh sách phiên bản
        state.danhSachPhienBan = state.danhSachPhienBan.filter(
          (dieuLe) => dieuLe.id !== action.payload,
        );

        // Nếu điều lệ hiện tại bị xóa, đặt về null
        if (state.dieuLeCuocBauCu && state.dieuLeCuocBauCu.id === action.payload) {
          state.dieuLeCuocBauCu = null;
        }

        state.dangXoa = false;
        state.thanhCong = 'Xóa điều lệ thành công';
      })
      .addCase(xoaDieuLeById.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi xóa điều lệ';
        state.dangXoa = false;
      })

      // updateTrangThaiCongBo
      .addCase(updateTrangThaiCongBo.pending, (state) => {
        state.dangLuu = true;
        state.loi = null;
        state.thanhCong = null;
      })
      .addCase(updateTrangThaiCongBo.fulfilled, (state, action: PayloadAction<DieuLe>) => {
        state.dieuLeCuocBauCu = action.payload;

        // Cập nhật trong danh sách phiên bản
        const index = state.danhSachPhienBan.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.danhSachPhienBan[index] = action.payload;
        }

        state.dangLuu = false;
        state.thanhCong = action.payload.daCongBo
          ? 'Điều lệ đã được công bố thành công'
          : 'Điều lệ đã được chuyển về trạng thái bản nháp';
      })
      .addCase(updateTrangThaiCongBo.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi cập nhật trạng thái điều lệ';
        state.dangLuu = false;
      })

      // uploadFile
      .addCase(uploadFile.pending, (state) => {
        state.dangUpload = true;
        state.loi = null;
        state.thanhCong = null;
      })
      .addCase(uploadFile.fulfilled, (state, action: PayloadAction<any>) => {
        if (action.payload.success && action.payload.dieuLeId) {
          // Nếu upload và tạo điều lệ thành công, cập nhật state
          if (!state.dieuLeCuocBauCu || state.dieuLeCuocBauCu.id !== action.payload.dieuLeId) {
            // Lưu ý: Cần fetchDieuLeById để lấy thông tin đầy đủ
            // state.dieuLeCuocBauCu sẽ được cập nhật khi fetchDieuLeById thành công
          }
        }

        state.dangUpload = false;
        state.thanhCong = 'Tải lên file điều lệ thành công';
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi tải lên file';
        state.dangUpload = false;
      })

      // guiThongBao
      .addCase(guiThongBao.pending, (state) => {
        state.dangGuiThongBao = true;
        state.loi = null;
        state.thanhCong = null;
      })
      .addCase(guiThongBao.fulfilled, (state, action: PayloadAction<any>) => {
        state.dangGuiThongBao = false;
        if (action.payload.success) {
          state.thanhCong = action.payload.message || 'Đã gửi thông báo thành công';
        } else {
          state.loi = action.payload.message || 'Có lỗi xảy ra khi gửi thông báo';
        }
      })
      .addCase(guiThongBao.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi gửi thông báo';
        state.dangGuiThongBao = false;
      })

      // xacNhanDaDoc
      .addCase(xacNhanDaDoc.pending, (state) => {
        state.dangXacNhan = true;
        state.loi = null;
        state.thanhCong = null;
      })
      .addCase(xacNhanDaDoc.fulfilled, (state, action: PayloadAction<any>) => {
        state.dangXacNhan = false;
        if (action.payload.success) {
          state.daXacNhan = true;
          state.thoiGianXacNhan = new Date().toISOString();
          state.thanhCong = action.payload.message || 'Đã xác nhận đọc điều lệ thành công';
        } else {
          state.loi = action.payload.message || 'Có lỗi xảy ra khi xác nhận';
        }
      })
      .addCase(xacNhanDaDoc.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi xác nhận';
        state.dangXacNhan = false;
      })

      // kiemTraXacNhan
      .addCase(kiemTraXacNhan.pending, (state) => {
        state.dangXacNhan = true;
      })
      .addCase(kiemTraXacNhan.fulfilled, (state, action: PayloadAction<any>) => {
        state.dangXacNhan = false;
        state.daXacNhan = action.payload.daXacNhan;
        state.thoiGianXacNhan = action.payload.thoiGianXacNhan;
      })
      .addCase(kiemTraXacNhan.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi kiểm tra xác nhận';
        state.dangXacNhan = false;
        state.daXacNhan = false;
      });
  },
});

export const { resetDieuLeState, resetThongBao, setDieuLeCuocBauCu } = dieuLeSlice.actions;
export default dieuLeSlice.reducer;
