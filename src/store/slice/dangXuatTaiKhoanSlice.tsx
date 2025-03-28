import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dangXuat } from '../../api/dangXuatTaiKhoanApi';
import { logout as logoutDangNhap } from './dangNhapTaiKhoanSlice';
import { logoutPhien } from './phienDangNhapSlice';
import { logout as logoutMetaMask } from './metaMaskSlice';
import { toast } from 'react-hot-toast';

interface TrangThaiDangXuat {
  dangTai: boolean;
  loi: string | null;
}

const trangThaiBanDau: TrangThaiDangXuat = {
  dangTai: false,
  loi: null,
};

export const logoutThat = createAsyncThunk('dangXuat/logout', async (_, { dispatch, getState }) => {
  try {
    console.log('heheTroi oi');
    const response = await dangXuat();

    // Xóa các dữ liệu trong localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('metamask_account');
    localStorage.removeItem('metamask_session');
    localStorage.removeItem('user');
    localStorage.setItem('isLoggedOut', 'true');

    // Dispatch các hành động logout cho các slice liên quan
    console.log('gia nhu');
    dispatch(logoutDangNhap());
    console.log('hehe3');

    dispatch(logoutPhien());
    console.log('hehe12');

    dispatch(logoutMetaMask());
    console.log('hehe1');

    toast.success('Đã đăng xuất thành công!');
    return response.message;
  } catch (error: any) {
    toast.error('Lỗi khi đăng xuất: ' + (error.message || 'Đã xảy ra lỗi'));
    throw error;
  }
});

const dangXuatTaiKhoanSlice = createSlice({
  name: 'dangXuat',
  initialState: trangThaiBanDau,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(logoutThat.pending, (state) => {
        state.dangTai = true;
      })
      .addCase(logoutThat.fulfilled, (state) => {
        state.dangTai = false;
        state.loi = null;
      })
      .addCase(logoutThat.rejected, (state, action) => {
        state.dangTai = false;
        state.loi = action.error.message || 'Có lỗi xảy ra khi đăng xuất';
      });
  },
});

export default dangXuatTaiKhoanSlice.reducer;
