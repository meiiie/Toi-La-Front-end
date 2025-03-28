import apiClient from './apiClient';
import { SearchTaiKhoanResponse } from '../store/types';

export async function timTaiKhoan(input: string): Promise<SearchTaiKhoanResponse> {
  try {
    const response = await apiClient.get('/api/tai-khoan/search', {
      params: { tenDangNhap: input },
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tìm tài khoản:', error);
    return { data: [], pageIndex: 0, pageSize: 0, totalData: 0 };
  }
}
