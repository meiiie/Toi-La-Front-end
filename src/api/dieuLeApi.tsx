// dieuLeApi.ts
import axios from 'axios';
import { DieuLe } from '../store/types';
import apiClient from './apiClient';

/**
 * Lấy điều lệ mới nhất của cuộc bầu cử
 */
export const getDieuLeByCuocBauCuId = async (cuocBauCuId: number): Promise<DieuLe | null> => {
  try {
    const response = await apiClient.get(`/api/DieuLe/cuocbaucu/${cuocBauCuId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Lấy danh sách phiên bản điều lệ của cuộc bầu cử
 */
export const getDanhSachPhienBanDieuLe = async (cuocBauCuId: number): Promise<DieuLe[]> => {
  try {
    const response = await apiClient.get(`/api/DieuLe/cuocbaucu/${cuocBauCuId}/phienban`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

/**
 * Lấy chi tiết một phiên bản điều lệ theo ID
 */
export const getDieuLeById = async (id: number): Promise<DieuLe> => {
  const response = await apiClient.get(`/api/DieuLe/${id}`);
  return response.data;
};

/**
 * Tạo mới hoặc cập nhật điều lệ
 */
export const capNhatDieuLeBauCu = async (dieuLe: Partial<DieuLe>): Promise<DieuLe> => {
  // Nếu có id, thực hiện cập nhật
  if (dieuLe.id) {
    const response = await apiClient.put(`/api/DieuLe/${dieuLe.id}`, dieuLe);
    return response.data;
  }
  // Nếu không có id, tạo mới
  else {
    const response = await apiClient.post(`/api/DieuLe`, dieuLe);
    return response.data;
  }
};

/**
 * Cập nhật trạng thái công bố của điều lệ
 */
export const capNhatTrangThaiCongBo = async (id: number, daCongBo: boolean): Promise<DieuLe> => {
  const response = await apiClient.patch(`/api/DieuLe/${id}/congbo`, { daCongBo });
  return response.data;
};

/**
 * Xóa điều lệ
 */
export const xoaDieuLe = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/DieuLe/${id}`);
};

/**
 * Upload file điều lệ
 */
export const uploadFileDieuLe = async (cuocBauCuId: number, file: File): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post(`/api/DieuLe/uploadFile/${cuocBauCuId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Gửi thông báo về điều lệ mới cho người tham gia
 */
export const guiThongBaoDieuLe = async (
  dieuLeId: number,
  cuocBauCuId: number,
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/api/DieuLe/${dieuLeId}/thongbao`, { cuocBauCuId });
  return response.data;
};

/**
 * Đánh dấu người dùng đã đọc/xác nhận điều lệ
 */
export const xacNhanDaDocDieuLe = async (
  dieuLeId: number,
  taiKhoanId: number,
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/api/DieuLe/${dieuLeId}/xacnhan`, { taiKhoanId });
  return response.data;
};

/**
 * Kiểm tra xem người dùng đã xác nhận điều lệ chưa
 */
export const kiemTraXacNhanDieuLe = async (
  dieuLeId: number,
  taiKhoanId: number,
): Promise<{ daXacNhan: boolean; thoiGianXacNhan?: string }> => {
  const response = await apiClient.get(`/api/DieuLe/${dieuLeId}/xacnhan/${taiKhoanId}`);
  return response.data;
};
