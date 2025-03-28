import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { sendOtp, verifyOtp } from '../../api/maOTPApi';
import { SendOtpResponse, VerifyOtpRequest, VerifyOtpResponse } from '../types';

interface TrangThaiMaOTP {
  dangTai: boolean;
  loi: string | null;
  guiOtpThanhCong: boolean;
  xacMinhOtpThanhCong: boolean;
}

const trangThaiBanDau: TrangThaiMaOTP = {
  dangTai: false,
  loi: null,
  guiOtpThanhCong: false,
  xacMinhOtpThanhCong: false,
};

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

const maOTPSlice = createSlice({
  name: 'maOTP',
  initialState: trangThaiBanDau,
  reducers: {
    resetTrangThai: (state) => {
      state.dangTai = false;
      state.loi = null;
      state.guiOtpThanhCong = false;
      state.xacMinhOtpThanhCong = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(guiOtp.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
        state.guiOtpThanhCong = false;
      })
      .addCase(guiOtp.fulfilled, (state, action: PayloadAction<SendOtpResponse>) => {
        state.dangTai = false;
        state.guiOtpThanhCong = action.payload.success;
      })
      .addCase(guiOtp.rejected, (state, action: PayloadAction<any>) => {
        state.dangTai = false;
        state.loi = action.payload;
        state.guiOtpThanhCong = false;
      })
      .addCase(xacMinhOtp.pending, (state) => {
        state.dangTai = true;
        state.loi = null;
        state.xacMinhOtpThanhCong = false;
      })
      .addCase(xacMinhOtp.fulfilled, (state, action: PayloadAction<VerifyOtpResponse>) => {
        state.dangTai = false;
        state.xacMinhOtpThanhCong = action.payload.success;
      })
      .addCase(xacMinhOtp.rejected, (state, action: PayloadAction<any>) => {
        state.dangTai = false;
        state.loi = action.payload;
        state.xacMinhOtpThanhCong = false;
      });
  },
});

export const { resetTrangThai } = maOTPSlice.actions;
export default maOTPSlice.reducer;
