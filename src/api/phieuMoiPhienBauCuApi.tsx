import apiClient from './apiClient';
import type { PhieuMoiPhienBauCu } from '../store/types';

const API_URL = '/api/PhieuMoiPhienBauCu';

// Lấy danh sách tất cả phiếu mời
export const getDanhSachPhieuMoi = async (): Promise<PhieuMoiPhienBauCu[]> => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

// Lấy chi tiết phiếu mời theo ID
export const getPhieuMoiById = async (id: number): Promise<PhieuMoiPhienBauCu> => {
  const response = await apiClient.get(`${API_URL}/${id}`);
  return response.data;
};

// Tạo phiếu mời mới
export const createPhieuMoi = async (data: {
  phienBauCuId: number;
  cuocBauCuId: number;
  nguoiTaoId: number;
}): Promise<PhieuMoiPhienBauCu> => {
  console.log('data', data);
  const response = await apiClient.post(`${API_URL}/create`, data);
  return response.data;
};

// Cập nhật phiếu mời
export const updatePhieuMoi = async (id: number, data: PhieuMoiPhienBauCu): Promise<void> => {
  await apiClient.put(`${API_URL}/${id}`, data);
};

// Xóa phiếu mời
export const deletePhieuMoi = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

// Kiểm tra tính hợp lệ của phiếu mời
export const validateInvite = async (token: string): Promise<PhieuMoiPhienBauCu> => {
  const response = await apiClient.post(`${API_URL}/validate`, { token });
  return response.data;
};

// Thu hồi phiếu mời
export const revokeInvite = async (token: string): Promise<void> => {
  await apiClient.post(`${API_URL}/revoke/${token}`);
};

// Người dùng tham gia phiên bầu cử bằng phiếu mời
export const joinPhienBauCu = async (data: {
  token: string;
  sdt: string;
}): Promise<PhieuMoiPhienBauCu> => {
  const response = await apiClient.post(`${API_URL}/join`, data);
  console.log('response', response);
  return response.data;
};
