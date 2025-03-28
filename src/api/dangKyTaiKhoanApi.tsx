import apiClient from './apiClient';
import type { TaoTaiKhoanTamThoi } from '../store/types';
import type { RegisterResponse } from '../store/types';

export async function kiemTraTenDangNhapTonTai(tenDangNhap: string): Promise<boolean> {
  const response = await apiClient.get(`/api/tai-khoan/search`, {
    params: { tenDangNhap },
  });
  return response.data.length > 0;
}

export async function dangKyTaiKhoan(
  taiKhoanMoi: TaoTaiKhoanTamThoi,
  recaptchaToken: string,
): Promise<RegisterResponse> {
  const tenDangNhapTonTai = await kiemTraTenDangNhapTonTai(taiKhoanMoi.tenDangNhap);

  if (tenDangNhapTonTai) {
    throw new Error('Tên đăng nhập đã tồn tại. Vui lòng chọn tên đăng nhập khác.');
  }

  // Chuẩn bị dữ liệu theo định dạng API yêu cầu
  const requestData = {
    TenDangNhap: taiKhoanMoi.tenDangNhap,
    MatKhau: taiKhoanMoi.matKhau,
    Email: taiKhoanMoi.email,
    Ho: taiKhoanMoi.ho,
    Ten: taiKhoanMoi.ten,
    Sdt: taiKhoanMoi.sdt,
    NgaySinh: taiKhoanMoi.ngaySinh,
    GioiTinh: taiKhoanMoi.gioiTinh,
    RecaptchaToken: recaptchaToken, // Gửi token trong body
  };

  try {
    // Gửi token trong cả headers và body để đảm bảo API server nhận được
    const response = await apiClient.post<RegisterResponse>(`/api/tai-khoan/dang-ky`, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Recaptcha-Token': recaptchaToken, // Thêm token vào header
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi đăng ký tài khoản:', error);

    // Xử lý phản hồi lỗi từ server
    if (error.response) {
      if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }

      // Kiểm tra lỗi reCAPTCHA
      if (error.response.status === 400 && error.response.data.errors?.RecaptchaToken) {
        throw new Error('Xác thực reCAPTCHA thất bại. Vui lòng thử lại.');
      }
    }

    throw new Error('Đã xảy ra lỗi trong quá trình đăng ký tài khoản. Vui lòng thử lại sau.');
  }
}
