import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import {
  sendOtp,
  verifyOtp,
  sendVoterVerification,
  verifyVoterToken,
  resendVerification,
  checkVoterVerificationStatus,
  verifyMultipleVoters,
  checkDuplicateVoter,
} from '../../api/maOTPApi';
import {
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  VoterVerificationRequest,
  VoterVerificationResponse,
} from '../types';

/**
 * Các trạng thái khả dụng cho việc gửi OTP và xác thực
 */
export type ProcessState = 'idle' | 'loading' | 'success' | 'error';

interface TrangThaiMaOTP {
  // Trạng thái chung
  dangTai: boolean;
  loi: string | null;

  // Trạng thái chi tiết cho từng quá trình
  trangThaiGuiOtp: ProcessState;
  trangThaiXacThucOtp: ProcessState;
  trangThaiGuiXacThucCuTri: ProcessState;
  trangThaiXacThucToken: ProcessState;
  trangThaiGuiHangLoat: ProcessState;

  // Kết quả thành công
  guiOtpThanhCong: boolean;
  xacMinhOtpThanhCong: boolean;
  guiXacThucCuTriThanhCong: boolean;
  xacThucTokenThanhCong: boolean;

  // Thông tin bổ sung
  thongTinXacThuc: VoterVerificationResponse | null;

  // Theo dõi tiến trình gửi xác thực hàng loạt
  tienTrinhGuiHangLoat: {
    total: number;
    success: number;
    error: number;
    processing: boolean;
  };

  // Kết quả kiểm tra trùng lặp
  ketQuaKiemTraTrungLap: {
    trungLap: boolean;
    truong?: string;
    message?: string;
  } | null;
  dangKiemTraTrungLap: boolean;
}

/**
 * Trạng thái ban đầu của slice
 */
const trangThaiBanDau: TrangThaiMaOTP = {
  dangTai: false,
  loi: null,

  trangThaiGuiOtp: 'idle',
  trangThaiXacThucOtp: 'idle',
  trangThaiGuiXacThucCuTri: 'idle',
  trangThaiXacThucToken: 'idle',
  trangThaiGuiHangLoat: 'idle',

  guiOtpThanhCong: false,
  xacMinhOtpThanhCong: false,
  guiXacThucCuTriThanhCong: false,
  xacThucTokenThanhCong: false,

  thongTinXacThuc: null,

  tienTrinhGuiHangLoat: {
    total: 0,
    success: 0,
    error: 0,
    processing: false,
  },

  ketQuaKiemTraTrungLap: null,
  dangKiemTraTrungLap: false,
};

/**
 * Thunk để gửi mã OTP đến email
 */
export const guiOtp = createAsyncThunk(
  'maOTP/guiOtp',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await sendOtp(email);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Thunk để xác minh mã OTP đã nhập
 */
export const xacMinhOtp = createAsyncThunk(
  'maOTP/xacMinhOtp',
  async (data: VerifyOtpRequest, { rejectWithValue }) => {
    try {
      const response = await verifyOtp(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Thunk để gửi email xác thực đến cử tri
 */
export const guiXacThucCuTri = createAsyncThunk(
  'maOTP/guiXacThucCuTri',
  async (data: VoterVerificationRequest, { rejectWithValue }) => {
    try {
      const response = await sendVoterVerification(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Thunk để xác thực token từ email
 */
export const xacThucTokenCuTri = createAsyncThunk(
  'maOTP/xacThucTokenCuTri',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await verifyVoterToken(token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Thunk để gửi lại email xác thực
 */
export const guiLaiXacThucCuTri = createAsyncThunk(
  'maOTP/guiLaiXacThucCuTri',
  async (
    data: { email: string; phienBauCuId: number; cuocBauCuId: number },
    { rejectWithValue },
  ) => {
    try {
      const response = await resendVerification(data.email, data.phienBauCuId, data.cuocBauCuId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Thunk để kiểm tra trạng thái xác thực của cử tri
 */
export const kiemTraTrangThaiXacThuc = createAsyncThunk(
  'maOTP/kiemTraTrangThaiXacThuc',
  async (data: { email: string; phienBauCuId: number }, { rejectWithValue }) => {
    try {
      const response = await checkVoterVerificationStatus(data.email, data.phienBauCuId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Thunk để xác thực hàng loạt nhiều cử tri
 */
export const xacThucHangLoatCuTri = createAsyncThunk(
  'maOTP/xacThucHangLoatCuTri',
  async (voterIds: number[], { rejectWithValue, dispatch }) => {
    try {
      dispatch(setupXacThucHangLoat(voterIds.length));
      const response = await verifyMultipleVoters(voterIds);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Thunk để kiểm tra trùng lặp email/số điện thoại
 */
export const kiemTraTrungLap = createAsyncThunk(
  'maOTP/kiemTraTrungLap',
  async (data: { email?: string; sdt?: string; phienBauCuId?: number }, { rejectWithValue }) => {
    try {
      if (!data.phienBauCuId) {
        return rejectWithValue('Thiếu ID phiên bầu cử để kiểm tra trùng lặp');
      }

      const response = await checkDuplicateVoter(data.email, data.sdt, data.phienBauCuId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * Slice quản lý trạng thái OTP và xác thực
 */
const maOTPSlice = createSlice({
  name: 'maOTP',
  initialState: trangThaiBanDau,
  reducers: {
    /**
     * Reset trạng thái về ban đầu
     */
    resetTrangThai: (state) => {
      return trangThaiBanDau;
    },

    /**
     * Xóa thông báo lỗi
     */
    xoaThongBaoLoi: (state) => {
      state.loi = null;
    },

    /**
     * Cập nhật trạng thái gửi xác thực hàng loạt
     */
    setupXacThucHangLoat: (state, action: PayloadAction<number>) => {
      state.tienTrinhGuiHangLoat = {
        total: action.payload,
        success: 0,
        error: 0,
        processing: true,
      };
    },

    /**
     * Cập nhật tiến trình gửi xác thực hàng loạt
     */
    capNhatTienTrinhXacThucHangLoat: (
      state,
      action: PayloadAction<{ success: number; error: number }>,
    ) => {
      state.tienTrinhGuiHangLoat.success = action.payload.success;
      state.tienTrinhGuiHangLoat.error = action.payload.error;
    },

    /**
     * Hoàn thành gửi xác thực hàng loạt
     */
    hoanThanhXacThucHangLoat: (state) => {
      state.tienTrinhGuiHangLoat.processing = false;
    },

    /**
     * Reset trạng thái kiểm tra trùng lặp
     */
    resetTrungLap: (state) => {
      state.ketQuaKiemTraTrungLap = null;
      state.dangKiemTraTrungLap = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Xử lý gửi OTP
      .addCase(guiOtp.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
        state.guiOtpThanhCong = false;
        state.trangThaiGuiOtp = 'loading';
      })
      .addCase(guiOtp.fulfilled, (state, action: PayloadAction<SendOtpResponse>) => {
        state.dangTai = false;
        state.guiOtpThanhCong = action.payload.success;
        state.trangThaiGuiOtp = 'success';
      })
      .addCase(guiOtp.rejected, (state, action: PayloadAction<any>) => {
        state.dangTai = false;
        state.loi = action.payload;
        state.guiOtpThanhCong = false;
        state.trangThaiGuiOtp = 'error';
      })

      // Xử lý xác minh OTP
      .addCase(xacMinhOtp.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
        state.xacMinhOtpThanhCong = false;
        state.trangThaiXacThucOtp = 'loading';
      })
      .addCase(xacMinhOtp.fulfilled, (state, action: PayloadAction<VerifyOtpResponse>) => {
        state.dangTai = false;
        state.xacMinhOtpThanhCong = action.payload.success;
        state.trangThaiXacThucOtp = 'success';
      })
      .addCase(xacMinhOtp.rejected, (state, action: PayloadAction<any>) => {
        state.dangTai = false;
        state.loi = action.payload;
        state.xacMinhOtpThanhCong = false;
        state.trangThaiXacThucOtp = 'error';
      })

      // Xử lý gửi email xác thực cử tri
      .addCase(guiXacThucCuTri.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
        state.guiXacThucCuTriThanhCong = false;
        state.trangThaiGuiXacThucCuTri = 'loading';
      })
      .addCase(guiXacThucCuTri.fulfilled, (state, action: PayloadAction<any>) => {
        state.dangTai = false;
        state.guiXacThucCuTriThanhCong = action.payload.success;
        state.trangThaiGuiXacThucCuTri = 'success';
      })
      .addCase(guiXacThucCuTri.rejected, (state, action: PayloadAction<any>) => {
        state.dangTai = false;
        state.loi = action.payload;
        state.guiXacThucCuTriThanhCong = false;
        state.trangThaiGuiXacThucCuTri = 'error';
      })

      // Xử lý xác thực token
      .addCase(xacThucTokenCuTri.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
        state.xacThucTokenThanhCong = false;
        state.thongTinXacThuc = null;
        state.trangThaiXacThucToken = 'loading';
      })
      .addCase(
        xacThucTokenCuTri.fulfilled,
        (state, action: PayloadAction<VoterVerificationResponse>) => {
          state.dangTai = false;
          state.xacThucTokenThanhCong = action.payload.success;
          state.thongTinXacThuc = action.payload;
          state.trangThaiXacThucToken = 'success';
        },
      )
      .addCase(xacThucTokenCuTri.rejected, (state, action: PayloadAction<any>) => {
        state.dangTai = false;
        state.loi = action.payload;
        state.xacThucTokenThanhCong = false;
        state.thongTinXacThuc = null;
        state.trangThaiXacThucToken = 'error';
      })

      // Xử lý gửi lại email xác thực
      .addCase(guiLaiXacThucCuTri.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
        state.trangThaiGuiXacThucCuTri = 'loading';
      })
      .addCase(guiLaiXacThucCuTri.fulfilled, (state, action: PayloadAction<SendOtpResponse>) => {
        state.dangTai = false;
        state.guiXacThucCuTriThanhCong = action.payload.success;
        state.trangThaiGuiXacThucCuTri = 'success';
      })
      .addCase(guiLaiXacThucCuTri.rejected, (state, action: PayloadAction<any>) => {
        state.dangTai = false;
        state.loi = action.payload;
        state.trangThaiGuiXacThucCuTri = 'error';
      })

      // Xử lý kiểm tra trạng thái xác thực
      .addCase(kiemTraTrangThaiXacThuc.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
      })
      .addCase(kiemTraTrangThaiXacThuc.fulfilled, (state, action: PayloadAction<any>) => {
        state.dangTai = false;
        // Lưu trữ thông tin nếu có
        if (action.payload?.data) {
          state.thongTinXacThuc = {
            success: true,
            message: 'Tìm thấy thông tin cử tri',
            hasAccount: action.payload.data.taiKhoanId > 0,
            hasWallet: action.payload.data.hasBlockchainWallet || false,
            accountId:
              action.payload.data.taiKhoanId > 0 ? action.payload.data.taiKhoanId : undefined,
          };
        }
      })
      .addCase(kiemTraTrangThaiXacThuc.rejected, (state, action: PayloadAction<any>) => {
        state.dangTai = false;
        state.loi = action.payload;
      })

      // Xử lý xác thực hàng loạt
      .addCase(xacThucHangLoatCuTri.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
        state.trangThaiGuiHangLoat = 'loading';
      })
      .addCase(xacThucHangLoatCuTri.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.dangTai = false;
        state.trangThaiGuiHangLoat = 'success';

        // Đếm kết quả thành công và thất bại
        const results = action.payload;
        const successCount = results.filter((r) => r.thanhCong).length;
        const errorCount = results.length - successCount;

        state.tienTrinhGuiHangLoat.success = successCount;
        state.tienTrinhGuiHangLoat.error = errorCount;
        state.tienTrinhGuiHangLoat.processing = false;
      })
      .addCase(xacThucHangLoatCuTri.rejected, (state, action: PayloadAction<any>) => {
        state.dangTai = false;
        state.loi = action.payload;
        state.trangThaiGuiHangLoat = 'error';
        state.tienTrinhGuiHangLoat.processing = false;
      })

      // Xử lý kiểm tra trùng lặp
      .addCase(kiemTraTrungLap.pending, (state) => {
        state.dangKiemTraTrungLap = true;
        state.ketQuaKiemTraTrungLap = null;
      })
      .addCase(kiemTraTrungLap.fulfilled, (state, action: PayloadAction<any>) => {
        state.dangKiemTraTrungLap = false;
        state.ketQuaKiemTraTrungLap = {
          trungLap: action.payload.trungLap,
          truong: action.payload.truong,
          message: action.payload.message,
        };

        // Lưu thông tin chi tiết về trùng lặp vào thông báo lỗi nếu cần
        if (action.payload.trungLap) {
          state.loi =
            action.payload.message ||
            `Phát hiện trùng lặp ở trường ${action.payload.truong || 'không xác định'}`;
        }
      })
      .addCase(kiemTraTrungLap.rejected, (state, action: PayloadAction<any>) => {
        state.dangKiemTraTrungLap = false;
        // Nếu có lỗi, ưu tiên an toàn bằng cách coi như có trùng lặp
        state.ketQuaKiemTraTrungLap = {
          trungLap: true,
          message: action.payload || 'Đã xảy ra lỗi khi kiểm tra trùng lặp',
        };
        state.loi = action.payload || 'Đã xảy ra lỗi khi kiểm tra trùng lặp';
      });
  },
});

export const {
  resetTrangThai,
  xoaThongBaoLoi,
  setupXacThucHangLoat,
  capNhatTienTrinhXacThucHangLoat,
  hoanThanhXacThucHangLoat,
  resetTrungLap,
} = maOTPSlice.actions;

export default maOTPSlice.reducer;
