import apiClient from './apiClient';
import { UploadFileResponse } from '../store/types';

// Upload file lên Azure Blob Storage
export const uploadFile = async (
  file: File,
  taiKhoanUploadId: number,
  phienBauCuUploadId: number,
  cuocBauCuUploadId: number,
): Promise<UploadFileResponse[]> => {
  const formData = new FormData();
  formData.append('File', file);
  formData.append('TaiKhoanUploadId', taiKhoanUploadId.toString());
  formData.append('PhienBauCuUploadId', phienBauCuUploadId.toString());
  formData.append('CuocBauCuUploadId', cuocBauCuUploadId.toString());

  console.log('formData', formData);
  const response = await apiClient.post('/api/uploadfile/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Lấy tất cả các tệp trên Azure Blob Storage
export const getAllAzureFiles = async (): Promise<UploadFileResponse[]> => {
  const response = await apiClient.get('/api/uploadfile/all-azure-files');
  return response.data;
};

// Xóa file khỏi Azure Blob Storage
export const deleteFile = async (fileName: string): Promise<void> => {
  const response = await apiClient.delete('/api/uploadfile/delete', {
    params: { fileName },
  });

  if (response.status !== 200) {
    throw new Error('Failed to delete file');
  }
};

// Lấy các file và URL
export const getFiles = async (
  taiKhoanId: number,
  cuocBauCuId?: number,
  phienBauCuId?: number,
): Promise<UploadFileResponse[]> => {
  const params: any = { taiKhoanId };
  if (cuocBauCuId) params.cuocBauCuId = cuocBauCuId;
  if (phienBauCuId) params.phienBauCuId = phienBauCuId;
  const response = await apiClient.get('/api/UploadFile/files', { params });
  console.log(response.data);
  return response.data;
};
