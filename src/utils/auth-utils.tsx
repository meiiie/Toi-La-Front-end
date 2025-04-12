/**
 * Tiện ích xác thực và quản lý phiên đăng nhập
 */

// Kiểm tra xem người dùng đã đăng nhập chưa (từ bất kỳ nguồn nào)
export const isAuthenticated = (): boolean => {
  // Kiểm tra JWT token
  const accessToken = localStorage.getItem('accessToken');

  // Kiểm tra phiên MetaMask
  const metamaskSession = localStorage.getItem('metamask_session');

  return !!accessToken || !!metamaskSession;
};

// Lấy thông tin người dùng từ phiên đăng nhập
export const getUserFromSession = (): any | null => {
  // Thử lấy từ phiên JWT
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    try {
      // Giải mã JWT để lấy thông tin người dùng (nếu cần)
      // Hoặc lấy từ localStorage nếu đã lưu
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng từ JWT:', error);
    }
  }

  // Thử lấy từ phiên MetaMask
  const metamaskSessionStr = localStorage.getItem('metamask_session');
  if (metamaskSessionStr) {
    try {
      const session = JSON.parse(metamaskSessionStr);
      if (session && session.user) {
        return session.user;
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng từ phiên MetaMask:', error);
    }
  }

  return null;
};

// Đăng xuất khỏi tất cả các phiên
export const logoutFromAllSessions = (): void => {
  // Xóa JWT token
  localStorage.removeItem('accessToken');
  document.cookie = 'refreshToken=0; Max-Age=0';

  // Xóa phiên MetaMask
  localStorage.removeItem('metamask_account');
  localStorage.removeItem('metamask_session');

  // Xóa các dữ liệu khác nếu cần
  localStorage.removeItem('user');
};
