import apiClient from './apiClient';
import {
  UngCuVien,
  UngCuVienDetailDTO,
  UploadImageResponse,
  MultipleImagesResponse,
  UngVienRegistrationDTO,
  CheckCandidateResponse,
  BlockchainAddressResponse,
} from '../store/types';

const API_URL = '/api/UngCuVien';

// ============== API HIỆN CÓ ==============

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

// Lấy chi tiết ứng cử viên theo ID (API mới chi tiết hơn)
export const getUngCuVienDetailById = async (id: number): Promise<UngCuVienDetailDTO> => {
  const response = await apiClient.get(`${API_URL}/detail/${id}`);
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

// Lấy ứng cử viên theo ID vị trí ứng cử
export const getUngCuVienByViTriUngCuId = async (viTriUngCuId: number): Promise<UngCuVien[]> => {
  const response = await apiClient.get(`${API_URL}/vitriungcu/${viTriUngCuId}`);
  return response.data;
};

// ============== API MỚI ==============

// API mới: Lấy ứng cử viên theo CuTriId
export const getUngCuVienByCuTriId = async (cuTriId: number): Promise<UngCuVien | null> => {
  try {
    const response = await apiClient.get(`${API_URL}/cutri/${cuTriId}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy ứng cử viên theo cử tri ID:', error);
    return null;
  }
};

// API mới: Kiểm tra cử tri đã đăng ký làm ứng viên chưa
export const checkIsCandidate = async (cuTriId: number): Promise<CheckCandidateResponse> => {
  const response = await apiClient.get(`${API_URL}/check-candidate/${cuTriId}`);
  return response.data;
};

// API mới: Kiểm tra tài khoản đã đăng ký làm ứng viên trong phiên bầu cử chưa
export const checkAccountIsCandidate = async (
  taiKhoanId: number,
  phienBauCuId: number,
): Promise<CheckCandidateResponse> => {
  const response = await apiClient.get(
    `${API_URL}/check-account-candidate/${taiKhoanId}/${phienBauCuId}`,
  );
  return response.data;
};

// API mới: Lấy địa chỉ ví blockchain của ứng viên
export const getBlockchainAddress = async (id: number): Promise<BlockchainAddressResponse> => {
  try {
    const response = await apiClient.get(`${API_URL}/blockchain-address/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy địa chỉ blockchain của ứng viên:', error);
    return { success: false, message: 'Lỗi khi lấy địa chỉ blockchain' };
  }
};

// API mới: Đăng ký ứng viên từ tài khoản
export const registerFromAccount = async (ungCuVienDTO: UngCuVien): Promise<UngCuVien> => {
  const response = await apiClient.post(`${API_URL}/register-from-account`, ungCuVienDTO);
  return response.data;
};

// API mới: Đăng ký ứng viên và tự động tạo cử tri nếu chưa có
export const registerWithVoter = async (
  registrationDTO: UngVienRegistrationDTO,
): Promise<UngCuVien> => {
  const response = await apiClient.post(`${API_URL}/register-with-voter`, registrationDTO);
  return response.data;
};

// ============== API CÓ SẴN ==============

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

// ============== API CHO UPLOAD ẢNH ==============

// Upload ảnh cho ứng cử viên
export const uploadImageForUngCuVien = async (
  id: number,
  imageFile: File,
): Promise<UploadImageResponse> => {
  try {
    console.log('Uploading image for ung vien ID:', id);
    console.log('Image file name:', imageFile.name);
    console.log('Image file size:', imageFile.size, 'bytes');
    console.log('Image file type:', imageFile.type);

    // Tạo FormData để gửi file
    const formData = new FormData();
    formData.append('imageFile', imageFile);

    // Gọi API với Content-Type là multipart/form-data
    const response = await apiClient.post(`${API_URL}/uploadImage/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading image for ung vien:', error);
    throw error;
  }
};

// Lấy ảnh của ứng cử viên
export const getImageForUngCuVien = async (id: number): Promise<UploadImageResponse | null> => {
  try {
    const response = await apiClient.get<UploadImageResponse>(`${API_URL}/getImage/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy ảnh ứng cử viên:', error);
    return null;
  }
};

// Xóa ảnh của ứng cử viên
export const deleteImageForUngCuVien = async (
  id: number,
  fileName: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete(`${API_URL}/deleteImage/${id}`, {
      params: { fileName },
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa ảnh ứng cử viên:', error);
    return { success: false, message: 'Lỗi khi xóa ảnh' };
  }
};

// Lấy nhiều ảnh của ứng cử viên
export const getImagesForUngCuVien = async (
  ids: number[],
): Promise<MultipleImagesResponse | null> => {
  try {
    const queryParams = ids.map((id) => `ids=${id}`).join('&');
    const response = await apiClient.get<MultipleImagesResponse>(
      `${API_URL}/getImages?${queryParams}`,
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách ảnh ứng cử viên:', error);
    return null;
  }
};

// Lấy danh sách ứng cử viên có ảnh theo ID phiên bầu cử
export const getUngCuVienWithImagesByPhienBauCuId = async (
  phienBauCuId: number,
): Promise<{ success: boolean; candidates: UngCuVien[] }> => {
  try {
    const response = await apiClient.get(`${API_URL}/withImages/phienbaucu/${phienBauCuId}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách ứng cử viên có ảnh theo phiên bầu cử:', error);
    return { success: false, candidates: [] };
  }
};

// Lấy danh sách ứng cử viên có ảnh theo ID cuộc bầu cử
export const getUngCuVienWithImagesByCuocBauCuId = async (
  cuocBauCuId: number,
): Promise<{ success: boolean; candidates: UngCuVien[] }> => {
  try {
    const response = await apiClient.get(`${API_URL}/withImages/cuocbaucu/${cuocBauCuId}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách ứng cử viên có ảnh theo cuộc bầu cử:', error);
    return { success: false, candidates: [] };
  }
};
