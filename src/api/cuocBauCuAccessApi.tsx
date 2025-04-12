import apiClient from './apiClient';

const API_URL = '/api/CuocBauCu/access';

/**
 * Kiểm tra quyền truy cập vào cuộc bầu cử
 * @param electionId ID của cuộc bầu cử
 * @returns Thông tin về quyền truy cập
 */
export const checkElectionAccess = async (electionId: number): Promise<{ hasAccess: boolean }> => {
  try {
    const response = await apiClient.get(`${API_URL}/election/${electionId}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi kiểm tra quyền truy cập cuộc bầu cử:', error);
    return { hasAccess: false };
  }
};

/**
 * Kiểm tra quyền truy cập vào phiên bầu cử
 * @param electionId ID của cuộc bầu cử
 * @param sessionId ID của phiên bầu cử
 * @returns Thông tin về quyền truy cập
 */
export const checkSessionAccess = async (
  electionId: number,
  sessionId: number,
): Promise<{ hasAccess: boolean }> => {
  try {
    const response = await apiClient.get(`${API_URL}/session/${electionId}/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi kiểm tra quyền truy cập phiên bầu cử:', error);
    return { hasAccess: false };
  }
};
