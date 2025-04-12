import axios from 'axios';
import { store } from '../store/store';
import { refreshJwtToken, logout } from '../store/slice/dangNhapTaiKhoanSlice';

const apiClient = axios.create({
  //baseURL: 'https://localhost:7250',
  baseURL:
    'https://webapplication320250413021023-cpbxh5g5ajdvbyd2.canadacentral-01.azurewebsites.net/',
  withCredentials: true, // QUAN TRỌNG: Giúp trình duyệt gửi cookie khi request
  headers: {
    'Content-Type': 'application/json',
    Accept: '*/*', // Thêm header Accept
  },
});

// Tự động gắn Access Token vào mọi request
apiClient.interceptors.request.use(
  (config) => {
    const token = store.getState().dangNhapTaiKhoan.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---- QUAN TRỌNG: Ngăn chặn làm mới token trùng lặp ----
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// ---- Xử lý tự động làm mới token ----
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!store.getState().dangNhapTaiKhoan.accessToken) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      // Đánh dấu request đã thử làm mới
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          await store.dispatch(refreshJwtToken());
          const newToken = store.getState().dangNhapTaiKhoan.accessToken;
          isRefreshing = false;

          if (newToken) {
            onTokenRefreshed(newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          }
        } catch {
          isRefreshing = false;
        }
      } else {
        localStorage.removeItem('accessToken');
        store.getState().dangNhapTaiKhoan.accessToken = '';
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }
    }
    if (!store.getState().dangNhapTaiKhoan.accessToken) {
      store.dispatch(logout());
      return Promise.reject(error);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
