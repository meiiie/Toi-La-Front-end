import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dangXuat } from '../../api/dangXuatTaiKhoanApi';
import { logout as logoutDangNhap } from './dangNhapTaiKhoanSlice';
import { logoutPhien } from './phienDangNhapSlice';
import { logout as logoutMetaMask } from './metaMaskSlice';
import { toast } from 'react-hot-toast';
import { clearAllAccessCache } from '../../utils/authUtils';

// Import tất cả các action reset từ các slice khác nhau
import { resetAccessState } from '../slice/cuocBauCuAccessSlice';
import { resetCuocBauCuById } from '../slice/cuocBauCuByIdSlice';
import { resetCuocBauCuImageState } from '../slice/cuocBauCuImageSlice';
import { resetCuocBauCuState } from '../slice/cuocBauCuSlice';

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
    console.log('Bắt đầu quá trình đăng xuất');
    const response = await dangXuat();

    // Reset tất cả cache quyền truy cập trước tiên
    clearAllAccessCache();

    // Reset tất cả các state liên quan đến quyền
    dispatch(resetAccessState());
    dispatch(resetCuocBauCuById());
    dispatch(resetCuocBauCuImageState());
    dispatch(resetCuocBauCuState());

    // Xóa các dữ liệu trong localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('metamask_account');
    localStorage.removeItem('metamask_session');
    localStorage.removeItem('user');
    localStorage.removeItem('current_user_id'); // Xóa userId hiện tại

    // Các key khác có thể liên quan đến quyền
    const keysToRemove = [
      'user_data',
      'cuocBauCuAccessState',
      'lastAccessCheck',
      'accessResults',
      'accessCache',
    ];

    keysToRemove.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });

    // Đặt cờ đã đăng xuất
    localStorage.setItem('isLoggedOut', 'true');

    // Dispatch các hành động logout cho các slice liên quan
    console.log('Xóa trạng thái đăng nhập');
    dispatch(logoutDangNhap());
    console.log('Xóa trạng thái phiên');
    dispatch(logoutPhien());
    console.log('Xóa trạng thái MetaMask');
    dispatch(logoutMetaMask());

    // Xóa sessionStorage
    sessionStorage.clear();

    toast.success('Đã đăng xuất thành công!');
    return response.message;
  } catch (error: any) {
    // Vẫn thực hiện các bước xóa dữ liệu ngay cả khi API lỗi
    clearAllAccessCache();
    dispatch(resetAccessState());
    dispatch(resetCuocBauCuById());
    dispatch(resetCuocBauCuImageState());
    dispatch(resetCuocBauCuState());

    localStorage.removeItem('accessToken');
    localStorage.removeItem('metamask_account');
    localStorage.removeItem('metamask_session');
    localStorage.removeItem('user');
    localStorage.removeItem('current_user_id');
    localStorage.setItem('isLoggedOut', 'true');

    sessionStorage.clear();

    // Vẫn dispatch các hành động logout
    dispatch(logoutDangNhap());
    dispatch(logoutPhien());
    dispatch(logoutMetaMask());

    toast.error('Lỗi khi đăng xuất: ' + (error.message || 'Đã xảy ra lỗi'));
    throw error;
  }
});

const dangXuatTaiKhoanSlice = createSlice({
  name: 'dangXuat',
  initialState: trangThaiBanDau,
  reducers: {
    // Thêm action reset state của slice này
    resetDangXuatState: (state) => {
      return trangThaiBanDau;
    },
  },
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

export const { resetDangXuatState } = dangXuatTaiKhoanSlice.actions;
export default dangXuatTaiKhoanSlice.reducer;
