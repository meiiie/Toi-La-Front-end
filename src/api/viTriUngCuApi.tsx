import apiClient from './apiClient';
import { ViTriUngCu, UngCuVien } from '../store/types';

// Định nghĩa các interface response phù hợp với backend
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface ViTriUngCuStatistic {
  id: number;
  tenViTriUngCu: string;
  soPhieuToiDa: number;
  moTa: string | null;
  soUngCuVien: number;
  tyLePercentage: number;
  trangThai: string;
}

interface ViTriUngCuStatisticsResponse {
  success: boolean;
  statistics: ViTriUngCuStatistic[];
  summary?: {
    totalPositions: number;
    totalMaxVotes: number;
    totalCandidates: number;
    overallPercentage: number;
  };
}

interface DetailedStatsResponse {
  success: boolean;
  statistics: Array<{
    id: number;
    tenViTriUngCu: string;
    soPhieuToiDa: number;
    moTa: string | null;
    soUngCuVien: number;
    tyLePercentage: number;
    trangThai: string;
  }>;
  summary: {
    totalPositions: number;
    totalMaxVotes: number;
    totalCandidates: number;
    overallPercentage: number;
  };
}

interface FullInfoResponse {
  success: boolean;
  data: Array<{
    viTri: ViTriUngCu;
    ungViens: UngCuVien[];
    soUngVien: number;
  }>;
}

const API_URL = '/api/ViTriUngCu';

// === CRUD CƠ BẢN ===

// Lấy tất cả vị trí ứng cử
export const getCacViTriUngCu = async (): Promise<ViTriUngCu[]> => {
  try {
    const response = await apiClient.get(API_URL);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi lấy danh sách vị trí ứng cử:', error);
    throw error.response?.data?.message || 'Không thể lấy danh sách vị trí ứng cử';
  }
};

// Lấy vị trí ứng cử theo ID
export const getViTriUngCuById = async (id: number): Promise<ViTriUngCu> => {
  try {
    const response = await apiClient.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Lỗi khi lấy vị trí ứng cử ID=${id}:`, error);
    throw error.response?.data?.message || `Không thể lấy vị trí ứng cử ID=${id}`;
  }
};

// Lấy vị trí ứng cử theo phiên bầu cử
export const getViTriUngCuByPhienBauCuId = async (phienBauCuId: number): Promise<ViTriUngCu[]> => {
  try {
    const response = await apiClient.get(`${API_URL}/phienbaucu/${phienBauCuId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Lỗi khi lấy vị trí ứng cử theo phiên bầu cử ID=${phienBauCuId}:`, error);
    throw (
      error.response?.data?.message || `Không thể lấy vị trí ứng cử theo phiên ID=${phienBauCuId}`
    );
  }
};

// Lấy vị trí ứng cử theo cuộc bầu cử
export const getViTriUngCuByCuocBauCuId = async (cuocBauCuId: number): Promise<ViTriUngCu[]> => {
  try {
    const response = await apiClient.get(`${API_URL}/cuocbaucu/${cuocBauCuId}`);
    return response.data;
  } catch (error: any) {
    console.error(`Lỗi khi lấy vị trí ứng cử theo cuộc bầu cử ID=${cuocBauCuId}:`, error);
    throw (
      error.response?.data?.message || `Không thể lấy vị trí ứng cử theo cuộc ID=${cuocBauCuId}`
    );
  }
};

// Thêm vị trí ứng cử
export const createViTriUngCu = async (viTriUngCu: Omit<ViTriUngCu, 'id'>): Promise<ViTriUngCu> => {
  try {
    const response = await apiClient.post(API_URL, viTriUngCu);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi thêm vị trí ứng cử:', error);
    throw error.response?.data?.message || 'Không thể thêm vị trí ứng cử';
  }
};

// Thêm nhiều vị trí ứng cử
export const createBulkViTriUngCu = async (
  viTriUngCus: Omit<ViTriUngCu, 'id'>[],
): Promise<ViTriUngCu[]> => {
  try {
    const response = await apiClient.post(`${API_URL}/bulk`, viTriUngCus);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi thêm nhiều vị trí ứng cử:', error);
    throw error.response?.data?.message || 'Không thể thêm nhiều vị trí ứng cử';
  }
};

// Cập nhật vị trí ứng cử
export const updateViTriUngCu = async (
  id: number,
  viTriUngCu: Partial<ViTriUngCu>,
): Promise<ViTriUngCu> => {
  try {
    const response = await apiClient.put(`${API_URL}/${id}`, viTriUngCu);
    return response.data.data;
  } catch (error: any) {
    console.error(`Lỗi khi cập nhật vị trí ứng cử ID=${id}:`, error);
    throw error.response?.data?.message || `Không thể cập nhật vị trí ứng cử ID=${id}`;
  }
};

// Cập nhật nhiều vị trí ứng cử
export const updateBulkViTriUngCu = async (viTriUngCus: ViTriUngCu[]): Promise<ViTriUngCu[]> => {
  try {
    const response = await apiClient.put(`${API_URL}/bulk`, viTriUngCus);
    return viTriUngCus; // Backend chỉ trả về success message, không có dữ liệu
  } catch (error: any) {
    console.error('Lỗi khi cập nhật nhiều vị trí ứng cử:', error);
    throw error.response?.data?.message || 'Không thể cập nhật nhiều vị trí ứng cử';
  }
};

// Xóa vị trí ứng cử
export const deleteViTriUngCu = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`${API_URL}/${id}`);
  } catch (error: any) {
    console.error(`Lỗi khi xóa vị trí ứng cử ID=${id}:`, error);
    throw error.response?.data?.message || `Không thể xóa vị trí ứng cử ID=${id}`;
  }
};

// Xóa vị trí ứng cử theo phiên bầu cử
export const deleteViTriUngCuByPhienBauCuId = async (phienBauCuId: number): Promise<void> => {
  try {
    await apiClient.delete(`${API_URL}/phienbaucu/${phienBauCuId}`);
  } catch (error: any) {
    console.error(`Lỗi khi xóa vị trí ứng cử theo phiên bầu cử ID=${phienBauCuId}:`, error);
    throw (
      error.response?.data?.message || `Không thể xóa vị trí ứng cử theo phiên ID=${phienBauCuId}`
    );
  }
};

// Xóa vị trí ứng cử theo cuộc bầu cử
export const deleteViTriUngCuByCuocBauCuId = async (cuocBauCuId: number): Promise<void> => {
  try {
    await apiClient.delete(`${API_URL}/cuocbaucu/${cuocBauCuId}`);
  } catch (error: any) {
    console.error(`Lỗi khi xóa vị trí ứng cử theo cuộc bầu cử ID=${cuocBauCuId}:`, error);
    throw (
      error.response?.data?.message || `Không thể xóa vị trí ứng cử theo cuộc ID=${cuocBauCuId}`
    );
  }
};

// Xóa nhiều vị trí ứng cử
export const deleteMultipleViTriUngCu = async (ids: number[]): Promise<void> => {
  try {
    await apiClient.delete(`${API_URL}/multiple`, { data: ids });
  } catch (error: any) {
    console.error('Lỗi khi xóa nhiều vị trí ứng cử:', error);
    throw error.response?.data?.message || 'Không thể xóa nhiều vị trí ứng cử';
  }
};

// === API MỞ RỘNG ===

// Lấy danh sách ứng cử viên theo vị trí ứng cử
export const getUngCuViensByViTriUngCuId = async (
  id: number,
): Promise<{ success: boolean; candidates: UngCuVien[] }> => {
  try {
    const response = await apiClient.get(`${API_URL}/${id}/ungcuviens`);
    return response.data;
  } catch (error: any) {
    console.error(`Lỗi khi lấy danh sách ứng cử viên theo vị trí ID=${id}:`, error);
    throw (
      error.response?.data?.message || `Không thể lấy danh sách ứng cử viên theo vị trí ID=${id}`
    );
  }
};

// Đếm số lượng ứng cử viên theo vị trí ứng cử
export const getUngCuVienCountByViTriUngCuId = async (
  id: number,
): Promise<{ success: boolean; count: number }> => {
  try {
    const response = await apiClient.get(`${API_URL}/${id}/count`);
    return response.data;
  } catch (error: any) {
    console.error(`Lỗi khi đếm số lượng ứng cử viên theo vị trí ID=${id}:`, error);
    throw (
      error.response?.data?.message || `Không thể đếm số lượng ứng cử viên theo vị trí ID=${id}`
    );
  }
};

// Thống kê số lượng ứng cử viên theo từng vị trí ứng cử của phiên bầu cử
export const getViTriUngCuStatisticsByPhienBauCuId = async (
  phienBauCuId: number,
): Promise<ViTriUngCuStatisticsResponse> => {
  try {
    const response = await apiClient.get(`${API_URL}/phienbaucu/${phienBauCuId}/statistics`);
    return response.data;
  } catch (error: any) {
    console.error(`Lỗi khi lấy thống kê theo phiên bầu cử ID=${phienBauCuId}:`, error);
    throw error.response?.data?.message || `Không thể lấy thống kê theo phiên ID=${phienBauCuId}`;
  }
};

// Thống kê số lượng ứng cử viên theo từng vị trí ứng cử của cuộc bầu cử
export const getViTriUngCuStatisticsByCuocBauCuId = async (
  cuocBauCuId: number,
): Promise<ViTriUngCuStatisticsResponse> => {
  try {
    const response = await apiClient.get(`${API_URL}/cuocbaucu/${cuocBauCuId}/statistics`);
    return response.data;
  } catch (error: any) {
    console.error(`Lỗi khi lấy thống kê theo cuộc bầu cử ID=${cuocBauCuId}:`, error);
    throw error.response?.data?.message || `Không thể lấy thống kê theo cuộc ID=${cuocBauCuId}`;
  }
};

// === API MỚI ===

// Kiểm tra trùng lặp tên vị trí
export const checkDuplicateName = async (
  name: string,
  phienBauCuId: number,
  excludeId?: number,
): Promise<{ success: boolean; isDuplicate: boolean }> => {
  try {
    const params: any = { name, phienBauCuId };
    if (excludeId !== undefined) {
      params.excludeId = excludeId;
    }

    const response = await apiClient.get(`${API_URL}/check-duplicate`, { params });
    return response.data;
  } catch (error: any) {
    console.error('Lỗi khi kiểm tra trùng lặp tên vị trí:', error);
    throw error.response?.data?.message || 'Không thể kiểm tra trùng lặp tên vị trí';
  }
};

// Lấy thông tin đầy đủ về vị trí và ứng viên
export const getFullInfoByPhienBauCuId = async (
  phienBauCuId: number,
): Promise<FullInfoResponse> => {
  try {
    const response = await apiClient.get(`${API_URL}/phienbaucu/${phienBauCuId}/full-info`);
    return response.data;
  } catch (error: any) {
    console.error(`Lỗi khi lấy thông tin đầy đủ theo phiên bầu cử ID=${phienBauCuId}:`, error);
    throw (
      error.response?.data?.message ||
      `Không thể lấy thông tin đầy đủ theo phiên ID=${phienBauCuId}`
    );
  }
};

// Lấy thống kê chi tiết
export const getDetailedStatsByPhienBauCuId = async (
  phienBauCuId: number,
): Promise<DetailedStatsResponse> => {
  try {
    const response = await apiClient.get(`${API_URL}/phienbaucu/${phienBauCuId}/detailed-stats`);
    return response.data;
  } catch (error: any) {
    console.error(`Lỗi khi lấy thống kê chi tiết theo phiên bầu cử ID=${phienBauCuId}:`, error);
    throw (
      error.response?.data?.message ||
      `Không thể lấy thống kê chi tiết theo phiên ID=${phienBauCuId}`
    );
  }
};
