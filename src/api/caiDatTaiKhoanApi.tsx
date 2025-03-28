import apiClient from './apiClient';
import { DuLieuTaiKhoanMoi } from '../store/types';

const API_URL = '/api/tai-khoan';

export const getCaiDatTaiKhoan = async (id: number): Promise<DuLieuTaiKhoanMoi> => {
  const response = await apiClient.get(`${API_URL}/${id}`);
  return response.data;
};

export const updateCaiDatTaiKhoan = async (
  id: number,
  caiDat: Partial<DuLieuTaiKhoanMoi>,
): Promise<DuLieuTaiKhoanMoi> => {
  const response = await apiClient.put(`${API_URL}/${id}`, caiDat);
  return response.data;
};
