// authUtils.ts - Các hàm tiện ích cho xác thực và phân quyền

/**
 * Prefix cho các key lưu trong sessionStorage liên quan đến quyền truy cập
 */
export const ACCESS_CACHE_PREFIX = 'auth_access_';

/**
 * Xóa tất cả cache liên quan đến quyền truy cập
 */
export const clearAllAccessCache = (): void => {
  try {
    // Lặp qua tất cả key trong sessionStorage và localStorage
    // SessionStorage
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith(ACCESS_CACHE_PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });

    // Xóa bất kỳ key nào trong localStorage có thể liên quan đến quyền
    const keysToRemove = [
      'cuocBauCuAccessState',
      'lastAccessCheck',
      'accessResults',
      'accessCache',
      'permissions',
    ];

    keysToRemove.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });

    // Cũng cần phải xóa bất kỳ key nào bắt đầu bằng "access_" hoặc "cuocBauCu_" trong localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('access_') || key.startsWith('cuocBauCu_')) {
        localStorage.removeItem(key);
      }
    });

    console.log('[Auth] Đã xóa tất cả cache quyền truy cập');
  } catch (error) {
    console.error('Lỗi khi xóa cache quyền truy cập:', error);
  }
};

/**
 * Lưu ID người dùng hiện tại vào localStorage
 */
export const saveCurrentUserId = (userId: number | string): void => {
  try {
    localStorage.setItem('current_user_id', userId.toString());
  } catch (error) {
    console.error('Lỗi khi lưu ID người dùng hiện tại:', error);
  }
};

/**
 * Lấy ID người dùng hiện tại từ localStorage
 */
export const getCurrentUserId = (): string | null => {
  try {
    return localStorage.getItem('current_user_id');
  } catch (error) {
    console.error('Lỗi khi lấy ID người dùng hiện tại:', error);
    return null;
  }
};

/**
 * So sánh ID người dùng hiện tại với ID đã lưu
 * Trả về true nếu khác nhau (đã chuyển người dùng), false nếu giống nhau
 */
export const hasUserChanged = (currentUserId: number | string): boolean => {
  const savedUserId = getCurrentUserId();
  return savedUserId !== currentUserId.toString();
};

/**
 * Reset trạng thái bảo mật khi đăng nhập người dùng mới
 */
export const resetSecurityState = (userId: number | string): void => {
  // 1. Xóa tất cả cache quyền truy cập
  clearAllAccessCache();

  // 2. Lưu ID người dùng mới
  saveCurrentUserId(userId);

  // 3. Xóa cờ đăng xuất
  localStorage.removeItem('isLoggedOut');

  console.log(`[Auth] Đã reset trạng thái bảo mật cho người dùng mới: ${userId}`);
};
