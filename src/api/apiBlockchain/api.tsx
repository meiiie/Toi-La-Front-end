// src/services/api.js
import axios from 'axios';

//const API_BASE_URL = 'https://backendholihu.azure-api.net/';
const API_BASE_URL =
  'https://webapplication320250413010854-cydgdecvava8ghe2.southeastasia-01.azurewebsites.net/';
// Cấu hình interceptor để thêm token vào headers
const authApi = axios.create({
  baseURL: API_BASE_URL,
});

authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const electionApi = {
  // Lấy chi tiết cuộc bầu cử
  getElectionDetails: (id: string) => authApi.get(`/cuoc-bau-cu/details/${id}`),

  // Triển khai blockchain
  deployBlockchain: (id: string, scwAddress: string) =>
    authApi.post(`/cuoc-bau-cu/deployBlockchain/${id}`, { SCWAddress: scwAddress }),

  // Kiểm tra trạng thái blockchain
  checkBlockchainStatus: (id: string) => authApi.get(`/cuoc-bau-cu/blockchain/${id}`),

  // Đồng bộ blockchain
  syncBlockchain: (id: string) => authApi.post(`/cuoc-bau-cu/syncBlockchain/${id}`),
};

export const blockchainApi = {
  // Tạo session key
  createSessionKey: (taiKhoanId: string, viId: string) =>
    authApi.post('/blockchain/create-session', {
      TaiKhoanID: taiKhoanId,
      ViID: viId,
    }),

  // Lấy session key hợp lệ
  getSessionKey: (taiKhoanId: string, viId: string) =>
    authApi.post('/blockchain/get-session-key', {
      TaiKhoanID: taiKhoanId,
      ViID: viId,
    }),
};
