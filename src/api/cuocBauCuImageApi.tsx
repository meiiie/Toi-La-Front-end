import apiClient from './apiClient';
import { UploadImageResponse, MultipleImagesResponse } from '../store/types';

const API_URL = '/api/CuocBauCu';

/**
 * Tải ảnh lên cho cuộc bầu cử
 * @param id ID của cuộc bầu cử
 * @param imageFile File ảnh cần tải lên
 * @returns Thông tin response sau khi tải ảnh
 */
export const uploadImageCuocBauCu = async (
  id: number,
  imageFile: File,
): Promise<UploadImageResponse> => {
  // Tạo FormData để gửi file
  const formData = new FormData();
  formData.append('imageFile', imageFile);

  // Gọi API với Content-Type là multipart/form-data
  const response = await apiClient.post<UploadImageResponse>(
    `${API_URL}/uploadImage/${id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
};

/**
 * Lấy URL ảnh hiện tại của cuộc bầu cử sử dụng API mới
 * @param id ID của cuộc bầu cử
 * @returns Thông tin ảnh của cuộc bầu cử (nếu có)
 */
export const getImageUrlCuocBauCu = async (id: number): Promise<UploadImageResponse | null> => {
  try {
    const response = await apiClient.get<UploadImageResponse>(`${API_URL}/getImage/${id}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy ảnh cuộc bầu cử:', error);
    return null;
  }
};

/**
 * Lấy URLs ảnh của nhiều cuộc bầu cử
 * @param ids Mảng các ID cuộc bầu cử
 * @returns Danh sách ảnh của các cuộc bầu cử
 */
export const getMultipleImagesUrlCuocBauCu = async (
  ids: number[],
): Promise<MultipleImagesResponse | null> => {
  try {
    const queryParams = ids.map((id) => `ids=${id}`).join('&');
    const response = await apiClient.get<MultipleImagesResponse>(
      `${API_URL}/getImages?${queryParams}`,
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách ảnh cuộc bầu cử:', error);
    return null;
  }
};

/**
 * Xóa ảnh của cuộc bầu cử
 * @param id ID của cuộc bầu cử
 * @param fileName Tên file ảnh cần xóa
 * @returns Thông tin response sau khi xóa ảnh
 */
export const deleteImageCuocBauCu = async (
  id: number,
  fileName: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await apiClient.delete(`${API_URL}/deleteImage/${id}`, {
      params: { fileName },
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi xóa ảnh cuộc bầu cử:', error);
    return { success: false, message: 'Lỗi khi xóa ảnh' };
  }
};

/**
 * Phương thức tương thích ngược để lấy URL ảnh từ API details
 * (Giữ lại để tương thích với code cũ)
 * @param id ID của cuộc bầu cử
 * @returns URL ảnh của cuộc bầu cử (nếu có)
 */
export const getLegacyImageUrlCuocBauCu = async (id: number): Promise<string | null> => {
  try {
    const response = await apiClient.get(`${API_URL}/details/${id}`);
    return response.data.anhCuocBauCu || null;
  } catch (error) {
    console.error('Lỗi khi lấy ảnh cuộc bầu cử (legacy):', error);
    return null;
  }
};
