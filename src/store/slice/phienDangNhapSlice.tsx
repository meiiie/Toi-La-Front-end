import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { PhienDangNhap } from '../types';
import {
  createPhienDangNhap,
  checkPhienDangNhap,
  logoutPhienDangNhap,
  getCacPhienDangNhapByUser,
  logoutAllPhienDangNhap,
  revokeToken,
  getActiveSessions,
  getLatestSession,
} from '../../api/phienDangNhapApi';

interface TrangThaiPhienDangNhap {
  cacPhienDangNhap: PhienDangNhap[];
  phienDangNhapChiTiet: PhienDangNhap | null;
  accessToken: string | null;
  refreshToken: string | null;
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiPhienDangNhap = {
  cacPhienDangNhap: [],
  phienDangNhapChiTiet: null,
  accessToken: null,
  refreshToken: null,
  dangTai: false,
  loi: null,
};

export const fetchCacPhienDangNhapByUser = createAsyncThunk(
  'phienDangNhap/fetchCacPhienDangNhapByUser',
  async (taiKhoanID: string) => {
    const response = await getCacPhienDangNhapByUser(taiKhoanID);
    return response;
  },
);

export const addPhienDangNhap = createAsyncThunk(
  'phienDangNhap/addPhienDangNhap',
  async (phienDangNhap: Omit<PhienDangNhap, 'id'>) => {
    const response = await createPhienDangNhap(phienDangNhap);
    return response;
  },
);

export const checkPhienDangNhapStatus = createAsyncThunk(
  'phienDangNhap/checkPhienDangNhapStatus',
  async () => {
    const response = await checkPhienDangNhap();
    return response;
  },
);

export const logoutTaiKhoan = createAsyncThunk(
  'phienDangNhap/logoutTaiKhoan',
  async (id: string) => {
    await logoutPhienDangNhap(id);
    return id;
  },
);

export const removeAllPhienDangNhap = createAsyncThunk(
  'phienDangNhap/removeAllPhienDangNhap',
  async (taiKhoanID: string) => {
    await logoutAllPhienDangNhap(taiKhoanID);
  },
);

export const revokeJwtToken = createAsyncThunk(
  'phienDangNhap/revokeToken',
  async (refreshToken: string) => {
    await revokeToken(refreshToken);
  },
);

export const fetchActiveSessions = createAsyncThunk(
  'phienDangNhap/fetchActiveSessions',
  async (userId: string) => {
    const response = await getActiveSessions(userId);
    return response;
  },
);

// Thêm createAsyncThunk mới để lấy phiên đăng nhập gần nhất
export const fetchLatestSession = createAsyncThunk(
  'phienDangNhap/fetchLatestSession',
  async (taiKhoanID: string) => {
    const response = await getLatestSession(taiKhoanID);
    return response;
  },
);

const phienDangNhapSlice = createSlice({
  name: 'phienDangNhap',
  initialState: trangThaiBanDau,
  reducers: {
    logoutPhien: (state) => {
      state.phienDangNhapChiTiet = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.cacPhienDangNhap = []; // Xóa tất cả các phiên đăng nhập
      localStorage.removeItem('accessToken');
      document.cookie = 'refreshToken=; Max-Age=0';
    },
    setPhienDangNhapChiTiet: (state, action: PayloadAction<PhienDangNhap>) => {
      state.phienDangNhapChiTiet = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCacPhienDangNhapByUser.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(
        fetchCacPhienDangNhapByUser.fulfilled,
        (state, action: PayloadAction<PhienDangNhap[]>) => {
          state.cacPhienDangNhap = action.payload;
          state.dangTai = false;
        },
      )
      .addCase(fetchCacPhienDangNhapByUser.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(addPhienDangNhap.fulfilled, (state, action: PayloadAction<PhienDangNhap>) => {
        state.cacPhienDangNhap.push(action.payload);
        state.phienDangNhapChiTiet = action.payload; // Cập nhật phienDangNhapChiTiet sau khi đăng nhập thành công
      })
      .addCase(
        checkPhienDangNhapStatus.fulfilled,
        (state, action: PayloadAction<{ valid: boolean }>) => {
          state.dangTai = false;
          if (!action.payload.valid) {
            state.phienDangNhapChiTiet = null;
            state.accessToken = null;
            state.refreshToken = null;
            localStorage.removeItem('accessToken');
            document.cookie = 'refreshToken=; Max-Age=0';
          }
        },
      )
      .addCase(checkPhienDangNhapStatus.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
        state.dangTai = false;
      })
      .addCase(logoutTaiKhoan.fulfilled, (state, action: PayloadAction<string>) => {
        state.cacPhienDangNhap = state.cacPhienDangNhap.filter(
          (phienDangNhap) => phienDangNhap.id !== action.payload,
        );
        // Nếu phiên đăng nhập hiện tại bị đăng xuất, cũng xóa phienDangNhapChiTiet
        if (state.phienDangNhapChiTiet && state.phienDangNhapChiTiet.id === action.payload) {
          state.phienDangNhapChiTiet = null;
        }
      })
      .addCase(removeAllPhienDangNhap.fulfilled, (state) => {
        state.cacPhienDangNhap = [];
        state.phienDangNhapChiTiet = null; // Xóa phiên đăng nhập chi tiết khi đăng xuất tất cả
      })
      .addCase(revokeJwtToken.fulfilled, (state) => {
        state.accessToken = null;
        state.refreshToken = null;
        state.phienDangNhapChiTiet = null; // Xóa phiên đăng nhập chi tiết khi thu hồi token
        localStorage.removeItem('accessToken');
        document.cookie = 'refreshToken=; Max-Age=0';
      })
      .addCase(revokeJwtToken.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi thu hồi token';
      })
      .addCase(fetchActiveSessions.fulfilled, (state, action: PayloadAction<PhienDangNhap[]>) => {
        state.cacPhienDangNhap = action.payload;
      })
      .addCase(fetchActiveSessions.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra';
      })
      .addCase(fetchLatestSession.fulfilled, (state, action: PayloadAction<PhienDangNhap>) => {
        state.phienDangNhapChiTiet = action.payload;
      })
      .addCase(fetchLatestSession.rejected, (state, action) => {
        state.loi = action.error.message || 'Có lỗi xảy ra khi lấy phiên đăng nhập gần nhất';
      });
  },
});

export const { logoutPhien, setPhienDangNhapChiTiet } = phienDangNhapSlice.actions;
export default phienDangNhapSlice.reducer;
