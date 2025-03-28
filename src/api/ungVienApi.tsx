import apiClient from './apiClient';
import { UngCuVien } from '../store/types';

const API_URL = '/api/UngCuVien';

// Lấy tất cả ứng cử viên
export const getCacUngCuVien = async (): Promise<UngCuVien[]> => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

// Lấy ứng cử viên theo ID
export const getUngCuVienById = async (id: number): Promise<UngCuVien> => {
  const response = await apiClient.get(`${API_URL}/${id}`);
  return response.data;
};

// Lấy ứng cử viên theo ID phiên bầu cử
export const getUngCuVienByPhienBauCuId = async (phienBauCuId: number): Promise<UngCuVien[]> => {
  const response = await apiClient.get(`${API_URL}/phienbaucu/${phienBauCuId}`);
  return response.data;
};

// Lấy ứng cử viên theo ID cuộc bầu cử
export const getUngCuVienByCuocBauCuId = async (cuocBauCuId: number): Promise<UngCuVien[]> => {
  const response = await apiClient.get(`${API_URL}/cuocbaucu/${cuocBauCuId}`);
  return response.data;
};

// Lấy ứng cử viên theo tên phiên bầu cử
export const getUngCuVienByTenPhienBauCu = async (tenPhienBauCu: string): Promise<UngCuVien[]> => {
  const response = await apiClient.get(`${API_URL}/tenphienbaucu/${tenPhienBauCu}`);
  return response.data;
};

// Lấy ứng cử viên theo tên cuộc bầu cử
export const getUngCuVienByTenCuocBauCu = async (tenCuocBauCu: string): Promise<UngCuVien[]> => {
  const response = await apiClient.get(`${API_URL}/tencuocbaucu/${tenCuocBauCu}`);
  return response.data;
};

// Thêm ứng cử viên
export const createUngCuVien = async (ungCuVien: UngCuVien): Promise<UngCuVien> => {
  const response = await apiClient.post(API_URL, ungCuVien);
  return response.data;
};

// Thêm hàng loạt ứng cử viên
export const createBulkUngCuVien = async (
  ungCuViens: Omit<UngCuVien, 'id'>[],
): Promise<UngCuVien[]> => {
  const response = await apiClient.post(`${API_URL}/bulk`, ungCuViens);
  return response.data;
};

// Cập nhật ứng cử viên
export const updateUngCuVien = async (id: number, ungCuVien: UngCuVien): Promise<UngCuVien> => {
  const response = await apiClient.put(`${API_URL}/${id}`, ungCuVien);
  return response.data;
};

// Cập nhật hàng loạt ứng cử viên
export const updateBulkUngCuVien = async (ungCuViens: UngCuVien[]): Promise<UngCuVien[]> => {
  const response = await apiClient.put(`${API_URL}/bulk`, ungCuViens);
  return response.data;
};

// Xóa ứng cử viên theo ID
export const deleteUngCuVien = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

// Xóa tất cả ứng cử viên theo ID phiên bầu cử
export const deleteUngCuVienByPhienBauCuId = async (phienBauCuId: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/phienbaucu/${phienBauCuId}`);
};

// Xóa tất cả ứng cử viên theo ID cuộc bầu cử
export const deleteUngCuVienByCuocBauCuId = async (cuocBauCuId: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/cuocbaucu/${cuocBauCuId}`);
};

// Xóa ứng cử viên theo nhiều ID
export const deleteMultipleUngCuVien = async (ids: number[]): Promise<void> => {
  await apiClient.delete(`${API_URL}/multiple`, { data: ids });
};
