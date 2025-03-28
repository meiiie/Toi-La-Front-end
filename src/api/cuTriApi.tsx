import apiClient from './apiClient';
import { CuTri } from '../store/types';

const API_URL = '/api/CuTri';

// Lấy tất cả cử tri
export const getCacCuTri = async (): Promise<CuTri[]> => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

// Lấy cử tri theo ID
export const getCuTriById = async (id: number): Promise<CuTri> => {
  const response = await apiClient.get(`${API_URL}/${id}`);
  return response.data;
};

// Lấy cử tri theo ID phiên bầu cử
export const getCuTriByPhienBauCuId = async (phienBauCuId: number): Promise<CuTri[]> => {
  const response = await apiClient.get(`${API_URL}/phienbaucu/${phienBauCuId}`);
  return response.data;
};

// Lấy cử tri theo ID cuộc bầu cử
export const getCuTriByCuocBauCuId = async (cuocBauCuId: number): Promise<CuTri[]> => {
  const response = await apiClient.get(`${API_URL}/cuocbaucu/${cuocBauCuId}`);
  return response.data;
};

// Lấy cử tri theo tên phiên bầu cử
export const getCuTriByTenPhienBauCu = async (tenPhienBauCu: string): Promise<CuTri[]> => {
  const response = await apiClient.get(`${API_URL}/tenphienbaucu/${tenPhienBauCu}`);
  return response.data;
};

// Lấy cử tri theo tên cuộc bầu cử
export const getCuTriByTenCuocBauCu = async (tenCuocBauCu: string): Promise<CuTri[]> => {
  const response = await apiClient.get(`${API_URL}/tencuocbaucu/${tenCuocBauCu}`);
  return response.data;
};

// Lấy cử tri theo email
export const getCuTriByEmail = async (email: string): Promise<CuTri[]> => {
  const response = await apiClient.get(`${API_URL}/email/${email}`);
  return response.data;
};

// Thêm cử tri
export const createCuTri = async (cuTri: CuTri): Promise<CuTri> => {
  const response = await apiClient.post(API_URL, cuTri);
  return response.data;
};

// Thêm hàng loạt cử tri
export const createBulkCuTri = async (cuTris: Omit<CuTri, 'id'>[]): Promise<CuTri[]> => {
  const response = await apiClient.post(`${API_URL}/bulk`, cuTris);
  return response.data;
};

// Cập nhật cử tri
export const updateCuTri = async (id: number, cuTri: CuTri): Promise<CuTri> => {
  const response = await apiClient.put(`${API_URL}/${id}`, cuTri);
  return response.data;
};

// Cập nhật hàng loạt cử tri
export const updateBulkCuTri = async (cuTris: CuTri[]): Promise<CuTri[]> => {
  const response = await apiClient.put(`${API_URL}/bulk`, cuTris);
  return response.data;
};

// Xóa cử tri theo ID
export const deleteCuTri = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

// Xóa tất cả cử tri theo ID phiên bầu cử
export const deleteCuTriByPhienBauCuId = async (phienBauCuId: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/phienbaucu/${phienBauCuId}`);
};

// Xóa tất cả cử tri theo ID cuộc bầu cử
export const deleteCuTriByCuocBauCuId = async (cuocBauCuId: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/cuocbaucu/${cuocBauCuId}`);
};

// Xóa cử tri theo nhiều ID
export const deleteMultipleCuTri = async (ids: number[]): Promise<void> => {
  await apiClient.delete(`${API_URL}/multiple`, { data: ids });
};
