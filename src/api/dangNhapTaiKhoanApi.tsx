import apiClient from './apiClient';
import type { TaiKhoan, PhienDangNhap } from '../store/types';
const API_URL = '/api/tai-khoan';

export const dangNhap = async (
  tenDangNhap: string,
  matKhau: string,
  recaptchaToken?: string,
): Promise<{ accessToken: string; user: TaiKhoan; phienDangNhap: PhienDangNhap }> => {
  const response = await apiClient.post(`${API_URL}/login`, {
    tenDangNhap,
    matKhau,
    recaptchaToken,
  });
  console.log('dangNhap response:', response.data);
  return response.data;
};

export const refreshToken = async (): Promise<{ accessToken: string; user: TaiKhoan }> => {
  try {
    const response = await apiClient.post(`${API_URL}/refresh-token`);
    return response.data;
  } catch {
    localStorage.removeItem('accessToken');
    return new Promise<{ accessToken: string; user: TaiKhoan }>((resolve) => {
      setTimeout(() => {
        resolve({ accessToken: '', user: {} as TaiKhoan });
      }, 5000);
    });
  }
};
