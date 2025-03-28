import apiClient from './apiClient';
import { PhienDangNhap } from '../store/types';

const API_URL = '/api/PhienDangNhap';

const getAuthHeader = () => {
  const accessToken = localStorage.getItem('accessToken');
  return { Authorization: `Bearer ${accessToken}` };
};

// Tạo phiên đăng nhập
export const createPhienDangNhap = async (
  phienDangNhap: Omit<PhienDangNhap, 'id'>,
): Promise<PhienDangNhap> => {
  const response = await apiClient.post(`${API_URL}/create`, phienDangNhap, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// Kiểm tra phiên đăng nhập
export const checkPhienDangNhap = async (): Promise<{ valid: boolean }> => {
  const response = await apiClient.get(`${API_URL}/check`, { headers: getAuthHeader() });
  return response.data;
};

// Đăng xuất phiên đăng nhập
export const logoutPhienDangNhap = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/logout/${id}`, { headers: getAuthHeader() });
};

// Lấy danh sách phiên đăng nhập của người dùng
export const getCacPhienDangNhapByUser = async (taiKhoanID: string): Promise<PhienDangNhap[]> => {
  const response = await apiClient.get(`${API_URL}/user/${taiKhoanID}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// Đăng xuất tất cả phiên đăng nhập của người dùng
export const logoutAllPhienDangNhap = async (taiKhoanID: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/logoutAll/${taiKhoanID}`, { headers: getAuthHeader() });
};

// Thu hồi token
export const revokeToken = async (refreshToken: string): Promise<void> => {
  await apiClient.post(`${API_URL}/revoke-token`, { refreshToken }, { headers: getAuthHeader() });
  localStorage.removeItem('accessToken');
  document.cookie = 'refreshToken=; Max-Age=0';
};

// Lấy danh sách phiên đăng nhập đang hoạt động của người dùng
export const getActiveSessions = async (userId: string): Promise<PhienDangNhap[]> => {
  const response = await apiClient.get(`${API_URL}/active-sessions/${userId}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// Lấy phiên đăng nhập gần nhất của người dùng
export const getLatestSession = async (taiKhoanID: string): Promise<PhienDangNhap> => {
  const response = await apiClient.get(`${API_URL}/latest-session/${taiKhoanID}`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

// Helper function to get cookie by name
const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};
