import { createSlice, PayloadAction, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { ViTriUngCu, UngCuVien } from '../types';
import {
  getCacViTriUngCu,
  getViTriUngCuById,
  getViTriUngCuByPhienBauCuId,
  getViTriUngCuByCuocBauCuId,
  createViTriUngCu,
  createBulkViTriUngCu,
  updateViTriUngCu,
  updateBulkViTriUngCu,
  deleteViTriUngCu,
  deleteViTriUngCuByPhienBauCuId,
  deleteViTriUngCuByCuocBauCuId,
  deleteMultipleViTriUngCu,
  getUngCuViensByViTriUngCuId,
  getUngCuVienCountByViTriUngCuId,
  getViTriUngCuStatisticsByPhienBauCuId,
  getViTriUngCuStatisticsByCuocBauCuId,
  checkDuplicateName,
  getFullInfoByPhienBauCuId,
  getDetailedStatsByPhienBauCuId,
} from '../../api/viTriUngCuApi';
import { RootState } from '../store';

// Định nghĩa interfaces cho dữ liệu
interface DetailedStatsItem {
  id: number;
  tenViTriUngCu: string;
  soPhieuToiDa: number;
  moTa?: string | null;
  soUngCuVien: number;
  tyLePercentage: number;
  trangThai: string;
}

interface StatsSummary {
  totalPositions: number;
  totalMaxVotes: number;
  totalCandidates: number;
  overallPercentage: number;
}

interface DetailedStatsResponse {
  success: boolean;
  statistics: DetailedStatsItem[];
  summary: StatsSummary;
}

interface FullInfoItem {
  viTri: ViTriUngCu;
  ungViens: UngCuVien[];
  soUngVien: number;
}

interface FullInfoResponse {
  success: boolean;
  data: FullInfoItem[];
}

interface ViTriUngCuStatistic {
  id: number;
  tenViTriUngCu: string;
  soPhieuToiDa: number;
  moTa: string | null;
  soUngCuVien: number;
  tyLePercentage: number;
  trangThai: string;
}

interface FilterState {
  searchTerm: string;
  sortBy: string;
}

interface TrangThaiViTriUngCu {
  cacViTriUngCu: ViTriUngCu[];
  viTriUngCuChiTiet: ViTriUngCu | null;
  ungCuViensTheoViTri: UngCuVien[];
  thongKeCacViTri: ViTriUngCuStatistic[];
  thongKeChiTiet: DetailedStatsResponse | null;
  thongTinDayDu: FullInfoResponse | null;
  dangTai: boolean;
  dangTaiThongKe: boolean;
  dangTaiUngVien: boolean;
  dangTaiKiemTraTrung: boolean;
  dangTaiThongTinDayDu: boolean;
  dangTaiThongKeChiTiet: boolean;
  loi: string | null;
  loiThongKe: string | null;
  loiUngVien: string | null;
  loiKiemTraTrung: string | null;
  loiThongTinDayDu: string | null;
  loiThongKeChiTiet: string | null;
  ketQuaKiemTraTrung: { isDuplicate: boolean } | null;
  filter: FilterState;
}

const trangThaiBanDau: TrangThaiViTriUngCu = {
  cacViTriUngCu: [],
  viTriUngCuChiTiet: null,
  ungCuViensTheoViTri: [],
  thongKeCacViTri: [],
  thongKeChiTiet: null,
  thongTinDayDu: null,
  dangTai: false,
  dangTaiThongKe: false,
  dangTaiUngVien: false,
  dangTaiKiemTraTrung: false,
  dangTaiThongTinDayDu: false,
  dangTaiThongKeChiTiet: false,
  loi: null,
  loiThongKe: null,
  loiUngVien: null,
  loiKiemTraTrung: null,
  loiThongTinDayDu: null,
  loiThongKeChiTiet: null,
  ketQuaKiemTraTrung: null,
  filter: {
    searchTerm: '',
    sortBy: 'name-asc',
  },
};

// ===== Các thunk cơ bản =====
export const fetchCacViTriUngCu = createAsyncThunk(
  'viTriUngCu/fetchCacViTriUngCu',
  async (_, { rejectWithValue }) => {
    try {
      return await getCacViTriUngCu();
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể lấy danh sách vị trí ứng cử',
      );
    }
  },
);

export const fetchViTriUngCuById = createAsyncThunk(
  'viTriUngCu/fetchViTriUngCuById',
  async (id: number, { rejectWithValue }) => {
    try {
      return await getViTriUngCuById(id);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || `Không thể lấy vị trí ứng cử ID=${id}`,
      );
    }
  },
);

export const fetchViTriUngCuByPhienBauCuId = createAsyncThunk(
  'viTriUngCu/fetchViTriUngCuByPhienBauCuId',
  async (phienBauCuId: number, { rejectWithValue }) => {
    try {
      return await getViTriUngCuByPhienBauCuId(phienBauCuId);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          `Không thể lấy vị trí ứng cử theo phiên ID=${phienBauCuId}`,
      );
    }
  },
);

export const fetchViTriUngCuByCuocBauCuId = createAsyncThunk(
  'viTriUngCu/fetchViTriUngCuByCuocBauCuId',
  async (cuocBauCuId: number, { rejectWithValue }) => {
    try {
      return await getViTriUngCuByCuocBauCuId(cuocBauCuId);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || `Không thể lấy vị trí ứng cử theo cuộc ID=${cuocBauCuId}`,
      );
    }
  },
);

export const addViTriUngCu = createAsyncThunk(
  'viTriUngCu/addViTriUngCu',
  async (viTriUngCu: Omit<ViTriUngCu, 'id'>, { rejectWithValue }) => {
    try {
      return await createViTriUngCu(viTriUngCu);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể thêm vị trí ứng cử');
    }
  },
);

export const addBulkViTriUngCu = createAsyncThunk(
  'viTriUngCu/addBulkViTriUngCu',
  async (viTriUngCus: Omit<ViTriUngCu, 'id'>[], { rejectWithValue }) => {
    try {
      return await createBulkViTriUngCu(viTriUngCus);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể thêm nhiều vị trí ứng cử');
    }
  },
);

export const editViTriUngCu = createAsyncThunk(
  'viTriUngCu/editViTriUngCu',
  async (
    { id, viTriUngCu }: { id: number; viTriUngCu: Partial<ViTriUngCu> },
    { rejectWithValue },
  ) => {
    try {
      return await updateViTriUngCu(id, viTriUngCu);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || `Không thể cập nhật vị trí ứng cử ID=${id}`,
      );
    }
  },
);

export const editBulkViTriUngCu = createAsyncThunk(
  'viTriUngCu/editBulkViTriUngCu',
  async (viTriUngCus: ViTriUngCu[], { rejectWithValue }) => {
    try {
      return await updateBulkViTriUngCu(viTriUngCus);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Không thể cập nhật nhiều vị trí ứng cử',
      );
    }
  },
);

export const removeViTriUngCu = createAsyncThunk(
  'viTriUngCu/removeViTriUngCu',
  async (id: number, { rejectWithValue }) => {
    try {
      await deleteViTriUngCu(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || `Không thể xóa vị trí ứng cử ID=${id}`,
      );
    }
  },
);

export const removeViTriUngCuByPhienBauCuId = createAsyncThunk(
  'viTriUngCu/removeViTriUngCuByPhienBauCuId',
  async (phienBauCuId: number, { rejectWithValue }) => {
    try {
      await deleteViTriUngCuByPhienBauCuId(phienBauCuId);
      return phienBauCuId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          `Không thể xóa vị trí ứng cử theo phiên ID=${phienBauCuId}`,
      );
    }
  },
);

export const removeViTriUngCuByCuocBauCuId = createAsyncThunk(
  'viTriUngCu/removeViTriUngCuByCuocBauCuId',
  async (cuocBauCuId: number, { rejectWithValue }) => {
    try {
      await deleteViTriUngCuByCuocBauCuId(cuocBauCuId);
      return cuocBauCuId;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || `Không thể xóa vị trí ứng cử theo cuộc ID=${cuocBauCuId}`,
      );
    }
  },
);

export const removeMultipleViTriUngCu = createAsyncThunk(
  'viTriUngCu/removeMultipleViTriUngCu',
  async (ids: number[], { rejectWithValue }) => {
    try {
      await deleteMultipleViTriUngCu(ids);
      return ids;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể xóa nhiều vị trí ứng cử');
    }
  },
);

// ===== Các thunk mở rộng =====
export const fetchUngCuViensByViTriUngCuId = createAsyncThunk(
  'viTriUngCu/fetchUngCuViensByViTriUngCuId',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await getUngCuViensByViTriUngCuId(id);
      if (!response.success) {
        return rejectWithValue('Không thể lấy danh sách ứng cử viên');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || `Không thể lấy danh sách ứng cử viên theo vị trí ID=${id}`,
      );
    }
  },
);

export const fetchUngCuVienCountByViTriUngCuId = createAsyncThunk(
  'viTriUngCu/fetchUngCuVienCountByViTriUngCuId',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await getUngCuVienCountByViTriUngCuId(id);
      if (!response.success) {
        return rejectWithValue('Không thể đếm số lượng ứng cử viên');
      }
      return { id, count: response.count };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || `Không thể đếm số lượng ứng cử viên theo vị trí ID=${id}`,
      );
    }
  },
);

export const fetchViTriUngCuStatisticsByPhienBauCuId = createAsyncThunk(
  'viTriUngCu/fetchViTriUngCuStatisticsByPhienBauCuId',
  async (phienBauCuId: number, { rejectWithValue }) => {
    try {
      const response = await getViTriUngCuStatisticsByPhienBauCuId(phienBauCuId);
      if (!response.success) {
        return rejectWithValue('Không thể lấy thống kê');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || `Không thể lấy thống kê theo phiên ID=${phienBauCuId}`,
      );
    }
  },
);

export const fetchViTriUngCuStatisticsByCuocBauCuId = createAsyncThunk(
  'viTriUngCu/fetchViTriUngCuStatisticsByCuocBauCuId',
  async (cuocBauCuId: number, { rejectWithValue }) => {
    try {
      const response = await getViTriUngCuStatisticsByCuocBauCuId(cuocBauCuId);
      if (!response.success) {
        return rejectWithValue('Không thể lấy thống kê');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || `Không thể lấy thống kê theo cuộc ID=${cuocBauCuId}`,
      );
    }
  },
);

// ===== Thêm thunks mới =====
export const kiemTraTrungTenViTri = createAsyncThunk(
  'viTriUngCu/kiemTraTrungTenViTri',
  async (
    { name, phienBauCuId, excludeId }: { name: string; phienBauCuId: number; excludeId?: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await checkDuplicateName(name, phienBauCuId, excludeId);
      if (!response.success) {
        return rejectWithValue('Không thể kiểm tra trùng lặp tên');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể kiểm tra trùng lặp tên');
    }
  },
);

export const fetchThongTinDayDuByPhienBauCuId = createAsyncThunk(
  'viTriUngCu/fetchThongTinDayDuByPhienBauCuId',
  async (phienBauCuId: number, { rejectWithValue }) => {
    try {
      const response = await getFullInfoByPhienBauCuId(phienBauCuId);
      if (!response.success) {
        return rejectWithValue('Không thể lấy thông tin đầy đủ');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          `Không thể lấy thông tin đầy đủ theo phiên ID=${phienBauCuId}`,
      );
    }
  },
);

export const fetchThongKeChiTietByPhienBauCuId = createAsyncThunk(
  'viTriUngCu/fetchThongKeChiTietByPhienBauCuId',
  async (phienBauCuId: number, { rejectWithValue }) => {
    try {
      const response = await getDetailedStatsByPhienBauCuId(phienBauCuId);
      if (!response.success) {
        return rejectWithValue('Không thể lấy thống kê chi tiết');
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          `Không thể lấy thống kê chi tiết theo phiên ID=${phienBauCuId}`,
      );
    }
  },
);

const viTriUngCuSlice = createSlice({
  name: 'viTriUngCu',
  initialState: trangThaiBanDau,
  reducers: {
    datCacViTriUngCu: (state, action: PayloadAction<ViTriUngCu[]>) => {
      state.cacViTriUngCu = action.payload;
    },
    themViTriUngCu: (state, action: PayloadAction<ViTriUngCu>) => {
      state.cacViTriUngCu.push(action.payload);
    },
    capNhatViTriUngCu: (state, action: PayloadAction<ViTriUngCu>) => {
      const index = state.cacViTriUngCu.findIndex(
        (viTriUngCu) => viTriUngCu.id === action.payload.id,
      );
      if (index !== -1) {
        state.cacViTriUngCu[index] = action.payload;
      }
    },
    xoaViTriUngCu: (state, action: PayloadAction<number>) => {
      state.cacViTriUngCu = state.cacViTriUngCu.filter(
        (viTriUngCu) => viTriUngCu.id !== action.payload,
      );
    },
    // Reducers quản lý filter
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.filter.searchTerm = action.payload;
    },
    setSortBy: (state, action: PayloadAction<string>) => {
      state.filter.sortBy = action.payload;
    },
    resetFilters: (state) => {
      state.filter.searchTerm = '';
      state.filter.sortBy = 'name-asc';
    },
    // Xóa thông báo lỗi
    clearErrors: (state) => {
      state.loi = null;
      state.loiThongKe = null;
      state.loiUngVien = null;
      state.loiKiemTraTrung = null;
      state.loiThongTinDayDu = null;
      state.loiThongKeChiTiet = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ===== Reducers cho các thunk cơ bản =====
      .addCase(fetchCacViTriUngCu.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(fetchCacViTriUngCu.fulfilled, (state, action: PayloadAction<ViTriUngCu[]>) => {
        state.cacViTriUngCu = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchCacViTriUngCu.rejected, (state, action) => {
        state.loi = (action.payload as string) || 'Có lỗi xảy ra khi lấy danh sách vị trí ứng cử';
        state.dangTai = false;
      })

      .addCase(fetchViTriUngCuById.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(fetchViTriUngCuById.fulfilled, (state, action: PayloadAction<ViTriUngCu>) => {
        state.viTriUngCuChiTiet = action.payload;
        state.dangTai = false;
      })
      .addCase(fetchViTriUngCuById.rejected, (state, action) => {
        state.loi = (action.payload as string) || 'Có lỗi xảy ra khi lấy chi tiết vị trí ứng cử';
        state.dangTai = false;
      })

      .addCase(fetchViTriUngCuByPhienBauCuId.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(
        fetchViTriUngCuByPhienBauCuId.fulfilled,
        (state, action: PayloadAction<ViTriUngCu[]>) => {
          state.cacViTriUngCu = action.payload;
          state.dangTai = false;
        },
      )
      .addCase(fetchViTriUngCuByPhienBauCuId.rejected, (state, action) => {
        state.loi =
          (action.payload as string) || 'Có lỗi xảy ra khi lấy vị trí ứng cử theo phiên bầu cử';
        state.dangTai = false;
      })

      .addCase(fetchViTriUngCuByCuocBauCuId.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(
        fetchViTriUngCuByCuocBauCuId.fulfilled,
        (state, action: PayloadAction<ViTriUngCu[]>) => {
          state.cacViTriUngCu = action.payload;
          state.dangTai = false;
        },
      )
      .addCase(fetchViTriUngCuByCuocBauCuId.rejected, (state, action) => {
        state.loi =
          (action.payload as string) || 'Có lỗi xảy ra khi lấy vị trí ứng cử theo cuộc bầu cử';
        state.dangTai = false;
      })

      .addCase(addViTriUngCu.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(addViTriUngCu.fulfilled, (state, action: PayloadAction<ViTriUngCu>) => {
        state.cacViTriUngCu.push(action.payload);
        state.dangTai = false;
      })
      .addCase(addViTriUngCu.rejected, (state, action) => {
        state.loi = (action.payload as string) || 'Có lỗi xảy ra khi thêm vị trí ứng cử';
        state.dangTai = false;
      })

      .addCase(addBulkViTriUngCu.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(addBulkViTriUngCu.fulfilled, (state, action: PayloadAction<ViTriUngCu[]>) => {
        state.cacViTriUngCu = state.cacViTriUngCu.concat(action.payload);
        state.dangTai = false;
      })
      .addCase(addBulkViTriUngCu.rejected, (state, action) => {
        state.loi = (action.payload as string) || 'Có lỗi xảy ra khi thêm nhiều vị trí ứng cử';
        state.dangTai = false;
      })

      .addCase(editViTriUngCu.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(editViTriUngCu.fulfilled, (state, action: PayloadAction<ViTriUngCu>) => {
        const index = state.cacViTriUngCu.findIndex(
          (viTriUngCu) => viTriUngCu.id === action.payload.id,
        );
        if (index !== -1) {
          state.cacViTriUngCu[index] = action.payload;
        }
        state.dangTai = false;
      })
      .addCase(editViTriUngCu.rejected, (state, action) => {
        state.loi = (action.payload as string) || 'Có lỗi xảy ra khi cập nhật vị trí ứng cử';
        state.dangTai = false;
      })

      .addCase(editBulkViTriUngCu.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(editBulkViTriUngCu.fulfilled, (state, action: PayloadAction<ViTriUngCu[]>) => {
        action.payload.forEach((updatedViTriUngCu) => {
          const index = state.cacViTriUngCu.findIndex(
            (viTriUngCu) => viTriUngCu.id === updatedViTriUngCu.id,
          );
          if (index !== -1) {
            state.cacViTriUngCu[index] = updatedViTriUngCu;
          }
        });
        state.dangTai = false;
      })
      .addCase(editBulkViTriUngCu.rejected, (state, action) => {
        state.loi = (action.payload as string) || 'Có lỗi xảy ra khi cập nhật nhiều vị trí ứng cử';
        state.dangTai = false;
      })

      .addCase(removeViTriUngCu.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(removeViTriUngCu.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacViTriUngCu = state.cacViTriUngCu.filter(
          (viTriUngCu) => viTriUngCu.id !== action.payload,
        );
        state.dangTai = false;
      })
      .addCase(removeViTriUngCu.rejected, (state, action) => {
        state.loi = (action.payload as string) || 'Có lỗi xảy ra khi xóa vị trí ứng cử';
        state.dangTai = false;
      })

      .addCase(removeViTriUngCuByPhienBauCuId.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(removeViTriUngCuByPhienBauCuId.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacViTriUngCu = state.cacViTriUngCu.filter(
          (viTriUngCu) => viTriUngCu.phienBauCuId !== action.payload,
        );
        state.dangTai = false;
      })
      .addCase(removeViTriUngCuByPhienBauCuId.rejected, (state, action) => {
        state.loi =
          (action.payload as string) || 'Có lỗi xảy ra khi xóa vị trí ứng cử theo phiên bầu cử';
        state.dangTai = false;
      })

      .addCase(removeViTriUngCuByCuocBauCuId.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(removeViTriUngCuByCuocBauCuId.fulfilled, (state, action: PayloadAction<number>) => {
        state.cacViTriUngCu = state.cacViTriUngCu.filter(
          (viTriUngCu) => viTriUngCu.cuocBauCuId !== action.payload,
        );
        state.dangTai = false;
      })
      .addCase(removeViTriUngCuByCuocBauCuId.rejected, (state, action) => {
        state.loi =
          (action.payload as string) || 'Có lỗi xảy ra khi xóa vị trí ứng cử theo cuộc bầu cử';
        state.dangTai = false;
      })

      .addCase(removeMultipleViTriUngCu.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(removeMultipleViTriUngCu.fulfilled, (state, action: PayloadAction<number[]>) => {
        state.cacViTriUngCu = state.cacViTriUngCu.filter(
          (viTriUngCu) => !action.payload.includes(viTriUngCu.id),
        );
        state.dangTai = false;
      })
      .addCase(removeMultipleViTriUngCu.rejected, (state, action) => {
        state.loi = (action.payload as string) || 'Có lỗi xảy ra khi xóa nhiều vị trí ứng cử';
        state.dangTai = false;
      })

      // ===== Reducers cho các thunk mở rộng =====
      .addCase(fetchUngCuViensByViTriUngCuId.pending, (state) => {
        state.dangTaiUngVien = true;
        state.loiUngVien = null;
      })
      .addCase(fetchUngCuViensByViTriUngCuId.fulfilled, (state, action) => {
        if (action.payload.success && action.payload.candidates) {
          state.ungCuViensTheoViTri = action.payload.candidates;
        } else {
          state.ungCuViensTheoViTri = [];
        }
        state.dangTaiUngVien = false;
      })
      .addCase(fetchUngCuViensByViTriUngCuId.rejected, (state, action) => {
        state.dangTaiUngVien = false;
        state.loiUngVien = (action.payload as string) || 'Lỗi khi lấy danh sách ứng viên';
      })

      .addCase(fetchViTriUngCuStatisticsByPhienBauCuId.pending, (state) => {
        state.dangTaiThongKe = true;
        state.loiThongKe = null;
      })
      .addCase(fetchViTriUngCuStatisticsByPhienBauCuId.fulfilled, (state, action) => {
        if (action.payload.success && action.payload.statistics) {
          state.thongKeCacViTri = action.payload.statistics;
        } else {
          state.thongKeCacViTri = [];
        }
        state.dangTaiThongKe = false;
      })
      .addCase(fetchViTriUngCuStatisticsByPhienBauCuId.rejected, (state, action) => {
        state.dangTaiThongKe = false;
        state.loiThongKe = (action.payload as string) || 'Lỗi khi lấy thống kê';
      })

      .addCase(fetchViTriUngCuStatisticsByCuocBauCuId.pending, (state) => {
        state.dangTaiThongKe = true;
        state.loiThongKe = null;
      })
      .addCase(fetchViTriUngCuStatisticsByCuocBauCuId.fulfilled, (state, action) => {
        if (action.payload.success && action.payload.statistics) {
          state.thongKeCacViTri = action.payload.statistics;
        } else {
          state.thongKeCacViTri = [];
        }
        state.dangTaiThongKe = false;
      })
      .addCase(fetchViTriUngCuStatisticsByCuocBauCuId.rejected, (state, action) => {
        state.dangTaiThongKe = false;
        state.loiThongKe = (action.payload as string) || 'Lỗi khi lấy thống kê';
      })

      // ===== Reducers cho các thunk mới =====
      .addCase(kiemTraTrungTenViTri.pending, (state) => {
        state.dangTaiKiemTraTrung = true;
        state.loiKiemTraTrung = null;
        state.ketQuaKiemTraTrung = null;
      })
      .addCase(kiemTraTrungTenViTri.fulfilled, (state, action) => {
        state.dangTaiKiemTraTrung = false;
        state.ketQuaKiemTraTrung = {
          isDuplicate: action.payload.isDuplicate,
        };
      })
      .addCase(kiemTraTrungTenViTri.rejected, (state, action) => {
        state.dangTaiKiemTraTrung = false;
        state.loiKiemTraTrung = (action.payload as string) || 'Lỗi khi kiểm tra trùng tên';
      })

      .addCase(fetchThongTinDayDuByPhienBauCuId.pending, (state) => {
        state.dangTaiThongTinDayDu = true;
        state.loiThongTinDayDu = null;
      })
      .addCase(fetchThongTinDayDuByPhienBauCuId.fulfilled, (state, action) => {
        state.thongTinDayDu = action.payload;
        state.dangTaiThongTinDayDu = false;
      })
      .addCase(fetchThongTinDayDuByPhienBauCuId.rejected, (state, action) => {
        state.dangTaiThongTinDayDu = false;
        state.loiThongTinDayDu = (action.payload as string) || 'Lỗi khi lấy thông tin đầy đủ';
      })

      .addCase(fetchThongKeChiTietByPhienBauCuId.pending, (state) => {
        state.dangTaiThongKeChiTiet = true;
        state.loiThongKeChiTiet = null;
      })
      .addCase(fetchThongKeChiTietByPhienBauCuId.fulfilled, (state, action) => {
        state.thongKeChiTiet = action.payload;
        state.dangTaiThongKeChiTiet = false;
      })
      .addCase(fetchThongKeChiTietByPhienBauCuId.rejected, (state, action) => {
        state.dangTaiThongKeChiTiet = false;
        state.loiThongKeChiTiet = (action.payload as string) || 'Lỗi khi lấy thống kê chi tiết';
      });
  },
});

export const {
  datCacViTriUngCu,
  themViTriUngCu,
  capNhatViTriUngCu,
  xoaViTriUngCu,
  setSearchTerm,
  setSortBy,
  resetFilters,
  clearErrors,
} = viTriUngCuSlice.actions;

// Selectors
export const selectFilteredPositions = createSelector(
  [
    (state: RootState) => state.viTriUngCu.cacViTriUngCu,
    (state: RootState) => state.viTriUngCu.filter.searchTerm,
    (state: RootState) => state.viTriUngCu.filter.sortBy,
  ],
  (positions, searchTerm, sortBy) => {
    let result = [...positions];

    // Apply search filter
    if (searchTerm) {
      result = result.filter((position) =>
        position.tenViTriUngCu.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'name-asc':
        result.sort((a, b) => a.tenViTriUngCu.localeCompare(b.tenViTriUngCu));
        break;
      case 'name-desc':
        result.sort((a, b) => b.tenViTriUngCu.localeCompare(a.tenViTriUngCu));
        break;
      case 'votes-asc':
        result.sort((a, b) => a.soPhieuToiDa - b.soPhieuToiDa);
        break;
      case 'votes-desc':
        result.sort((a, b) => b.soPhieuToiDa - a.soPhieuToiDa);
        break;
    }

    return result;
  },
);

export const selectPositionStats = createSelector(
  [(state: RootState) => state.viTriUngCu.thongKeCacViTri],
  (positionStats): StatsSummary => {
    if (!positionStats || positionStats.length === 0)
      return {
        totalPositions: 0,
        totalCandidates: 0,
        totalMaxVotes: 0,
        overallPercentage: 0,
      };

    const totalPositions = positionStats.length;
    const totalCandidates = positionStats.reduce((sum, item) => sum + (item.soUngCuVien || 0), 0);
    const totalMaxVotes = positionStats.reduce((sum, item) => sum + item.soPhieuToiDa, 0);
    const overallPercentage =
      totalMaxVotes > 0 ? Math.round((totalCandidates / totalMaxVotes) * 100) : 0;

    return {
      totalPositions,
      totalCandidates,
      totalMaxVotes,
      overallPercentage,
    };
  },
);

export default viTriUngCuSlice.reducer;
