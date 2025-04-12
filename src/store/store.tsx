// Cập nhật store.tsx để thêm cuocBauCuAccessReducer
import { configureStore } from '@reduxjs/toolkit';
import cuocBauCuReducer from './slice/cuocBauCuSlice';
import nguoiDungReducer from './slice/nguoiDungSlice';
import vaiTroReducer from './slice/vaiTroSlice';
import cuTriReducer from './slice/cuTriSlice';
import phienBauCuReducer from './slice/phienBauCuSlice';
import viTriUngCuReducer from './slice/viTriUngCuSlice';
import ungCuVienReducer from './slice/ungCuVienSlice';
import phieuBauReducer from './slice/phieuBauSlice';
import chucNangReducer from './slice/chucNangSlice';
import vaiTroChucNangReducer from './slice/vaiTroChucNangSlice';
import taiKhoanVaiTroReducer from './slice/taiKhoanVaiTroSlice';
import lichSuHoatDongReducer from './slice/lichSuHoatDongSlice';
import phienDangNhapReducer from './slice/phienDangNhapSlice';
import thongBaoReducer from './slice/thongBaoSlice';
import cauHinhHeThongReducer from './slice/cauHinhHeThongSlice';
import caiDatTaiKhoanReducer from './slice/caiDatTaiKhoanSlice';
import dangKyTaiKhoanReducer from './slice/dangKyTaiKhoanSlice';
import cuocBauCuByIdReducer from './slice/cuocBauCuByIdSlice';
import dangNhapTaiKhoanReducer from './slice/dangNhapTaiKhoanSlice';
import authenticateReducer from './slice/authenticateSlice';
import authorizeReducer from './slice/authorizeSlice';
import timTaiKhoanReducer from './slice/timTaiKhoanSlice';
import maOTPReducer from './slice/maOTPSlice';
import datLaiMatKhauReducer from './slice/datLaiMatKhauSlice';
import taiKhoanVaiTroAdminReducer from './slice/taiKhoanVaiTroAdminSlice';
import phieuMoiPhienBauCuReducer from './slice/phieuMoiPhienBauCuSlice';
import uploadFileReducer from './slice/uploadFileSlice';
import dangXuatTaiKhoanReducer from './slice/dangXuatTaiKhoanSlice';
import lienHeReducer from './slice/lienHeSlice';
import nhanThongTinReducer from './slice/nhanThongTinSlice';
import blockchainReducer from './sliceBlockchain/blockchainSlice';
import cuocBauCuImageReducer from './slice/cuocBauCuImageSlice';
import dieuLeReducer from './slice/dieuLeSlice';
import viBlockchainReducer from './sliceBlockchain/viBlockchainSlice';
import cuocBauCuAccessReducer from './slice/cuocBauCuAccessSlice'; // Thêm import này
import uploadFileBallotReducer from './slice/uploadFileBallotSlice'; // Thêm import này
import { uploadFile } from '../api/uploadFileApi';

export const store = configureStore({
  reducer: {
    cuTri: cuTriReducer,
    cuocBauCu: cuocBauCuReducer,
    nguoiDung: nguoiDungReducer,
    vaiTro: vaiTroReducer,
    phienBauCu: phienBauCuReducer,
    viTriUngCu: viTriUngCuReducer,
    ungCuVien: ungCuVienReducer,
    phieuBau: phieuBauReducer,
    chucNang: chucNangReducer,
    vaiTroChucNang: vaiTroChucNangReducer,
    taiKhoanVaiTro: taiKhoanVaiTroReducer,
    lichSuHoatDong: lichSuHoatDongReducer,
    phienDangNhap: phienDangNhapReducer,
    thongBao: thongBaoReducer,
    cauHinhHeThong: cauHinhHeThongReducer,
    caiDatTaiKhoan: caiDatTaiKhoanReducer,
    dangKyTaiKhoan: dangKyTaiKhoanReducer,
    cuocBauCuById: cuocBauCuByIdReducer,
    dangNhapTaiKhoan: dangNhapTaiKhoanReducer,
    authenticate: authenticateReducer,
    authorize: authorizeReducer,
    timTaiKhoan: timTaiKhoanReducer,
    maOTP: maOTPReducer,
    datLaiMatKhau: datLaiMatKhauReducer,
    taiKhoanVaiTroAdmin: taiKhoanVaiTroAdminReducer,
    phieuMoiPhienBauCu: phieuMoiPhienBauCuReducer,
    uploadFile: uploadFileReducer,
    dangXuatTaiKhoan: dangXuatTaiKhoanReducer,
    lienHe: lienHeReducer,
    nhanThongTin: nhanThongTinReducer,
    blockchain: blockchainReducer,
    cuocBauCuImage: cuocBauCuImageReducer,
    dieuLe: dieuLeReducer,
    viBlockchain: viBlockchainReducer,
    cuocBauCuAccess: cuocBauCuAccessReducer, // Thêm reducer mới này
    uploadFileBallot: uploadFileBallotReducer, // Thêm reducer mới này
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
