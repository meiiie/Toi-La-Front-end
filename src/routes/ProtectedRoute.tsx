import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { TaiKhoan } from '../store/types';
import { refreshJwtToken } from '../store/slice/dangNhapTaiKhoanSlice';
import { fetchLatestSession } from '../store/slice/phienDangNhapSlice';
import {
  checkElectionAccessThunk,
  checkSessionAccessThunk,
} from '../store/slice/cuocBauCuAccessSlice';
import {
  clearAllAccessCache,
  resetSecurityState,
  hasUserChanged,
  getCurrentUserId,
} from '../utils/authUtils';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredPermissions: string[];
  requiresElectionAccess?: boolean;
};

// Tạo cache key prefix cho localStorage
const ROUTE_ACCESS_PREFIX = 'route_access_';

/**
 * Lưu kết quả kiểm tra quyền vào sessionStorage
 */
const cacheAccessResult = (path: string, userId: number | string, hasAccess: boolean): void => {
  try {
    const key = `${ROUTE_ACCESS_PREFIX}${userId}_${path}`;
    const value = JSON.stringify({
      hasAccess,
      timestamp: Date.now(),
    });
    sessionStorage.setItem(key, value);
  } catch (error) {
    console.error('Lỗi khi lưu kết quả kiểm tra quyền:', error);
  }
};

/**
 * Lấy kết quả kiểm tra quyền từ sessionStorage
 */
const getCachedAccessResult = (path: string, userId: number | string): boolean | null => {
  try {
    const key = `${ROUTE_ACCESS_PREFIX}${userId}_${path}`;
    const value = sessionStorage.getItem(key);

    if (!value) return null;

    const data = JSON.parse(value);
    // Cache 5 phút
    if (Date.now() - data.timestamp > 5 * 60 * 1000) {
      sessionStorage.removeItem(key);
      return null;
    }

    return data.hasAccess;
  } catch (error) {
    console.error('Lỗi khi lấy kết quả kiểm tra quyền:', error);
    return null;
  }
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions,
  requiresElectionAccess = false,
}) => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy các tham số từ URL
  const params = useParams();
  const electionId = params.id ? parseInt(params.id) : undefined;
  const sessionId = params.idPhien || params.sessionId;
  const sessionIdNum = sessionId ? parseInt(sessionId) : undefined;

  // Sử dụng useRef để tracking các thao tác
  const accessCheckRequestedRef = useRef(false);
  const redirectingRef = useRef(false);
  const userChangedCheckedRef = useRef(false);

  // Selectors từ Redux store
  const accessToken = useSelector((state: RootState) => state.dangNhapTaiKhoan.accessToken);
  const user = useSelector(
    (state: RootState) => state.dangNhapTaiKhoan.taiKhoan,
  ) as TaiKhoan | null;
  const isAdmin = user?.vaiTro?.tenVaiTro === 'Quan Tri Vien';

  // State cho loading và kiểm tra quyền
  const [loading, setLoading] = useState(true);
  const [accessResult, setAccessResult] = useState<boolean | null>(null);

  // Tạo key duy nhất cho route hiện tại
  const routeKey = location.pathname;

  // Kiểm tra đăng xuất
  useEffect(() => {
    const isLoggedOut = localStorage.getItem('isLoggedOut') === 'true';
    if (isLoggedOut && !redirectingRef.current) {
      redirectingRef.current = true;
      navigate('/thank-you');
    }
  }, [navigate]);

  // Kiểm tra auth và refresh token nếu cần
  useEffect(() => {
    // Nếu đang chuyển hướng thì không cần làm gì
    if (redirectingRef.current) return;

    const autoLogin = async () => {
      // Nếu chưa có token, thử refresh
      if (!accessToken) {
        try {
          const result = await dispatch(refreshJwtToken());
          if (!refreshJwtToken.fulfilled.match(result)) {
            redirectingRef.current = true;
            navigate('/login');
            return;
          }
        } catch (err) {
          console.error('Auto login failed:', err);
          redirectingRef.current = true;
          navigate('/login');
          return;
        }
      }
      setLoading(false);
    };

    autoLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần khi mount

  // Kiểm tra xem người dùng đã thay đổi chưa (sau khi đăng xuất và đăng nhập lại)
  useEffect(() => {
    // Nếu đang loading, đang chuyển hướng hoặc đã kiểm tra rồi thì bỏ qua
    if (loading || redirectingRef.current || userChangedCheckedRef.current || !user) return;

    // Đánh dấu đã kiểm tra để tránh chạy lại
    userChangedCheckedRef.current = true;

    // Kiểm tra người dùng đã thay đổi chưa
    if (hasUserChanged(user.id)) {
      console.log(
        `[Auth] Người dùng đã thay đổi. ID hiện tại: ${user.id}, ID đã lưu: ${getCurrentUserId()}`,
      );

      // Reset cache và security state
      clearAllAccessCache();
      resetSecurityState(user.id);

      // Reset trạng thái kiểm tra quyền
      accessCheckRequestedRef.current = false;
      setAccessResult(null);
    }
  }, [loading, user]);

  // Kiểm tra quyền truy cập
  useEffect(() => {
    // Bỏ qua nếu đang loading, đang chuyển hướng, hoặc đã kiểm tra quyền
    if (
      loading ||
      redirectingRef.current ||
      accessCheckRequestedRef.current ||
      accessResult !== null
    )
      return;

    // Nếu không cần kiểm tra quyền hoặc là admin, mặc định có quyền
    if (!requiresElectionAccess || isAdmin || !electionId || !user) {
      setAccessResult(true);
      return;
    }

    // Đánh dấu đã bắt đầu kiểm tra quyền để tránh chạy lại
    accessCheckRequestedRef.current = true;

    const checkAccess = async () => {
      try {
        // Kiểm tra cache trước
        const cachedResult = getCachedAccessResult(routeKey, user.id);

        if (cachedResult !== null) {
          console.log(`[Cache] Sử dụng kết quả cache cho ${routeKey}: ${cachedResult}`);
          setAccessResult(cachedResult);
          return;
        }

        // Không có cache, gọi API
        console.log(`[API] Kiểm tra quyền truy cập cho ${routeKey}`);

        let result;
        if (sessionIdNum) {
          // Kiểm tra quyền truy cập phiên bầu cử
          result = await dispatch(
            checkSessionAccessThunk({
              electionId,
              sessionId: sessionIdNum,
            }),
          );

          if (checkSessionAccessThunk.fulfilled.match(result)) {
            const hasAccess = result.payload.hasAccess;
            setAccessResult(hasAccess);

            // Lưu vào cache
            cacheAccessResult(routeKey, user.id, hasAccess);

            console.log(
              `[Access] ${hasAccess ? 'Có' : 'Không có'} quyền truy cập: ${location.pathname}`,
            );
          } else {
            setAccessResult(false);
          }
        } else {
          // Kiểm tra quyền truy cập cuộc bầu cử
          result = await dispatch(checkElectionAccessThunk(electionId));

          if (checkElectionAccessThunk.fulfilled.match(result)) {
            const hasAccess = result.payload.hasAccess;
            setAccessResult(hasAccess);

            // Lưu vào cache
            cacheAccessResult(routeKey, user.id, hasAccess);

            console.log(
              `[Access] ${hasAccess ? 'Có' : 'Không có'} quyền truy cập: ${location.pathname}`,
            );
          } else {
            setAccessResult(false);
          }
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra quyền truy cập:', error);
        setAccessResult(false);
      }
    };

    checkAccess();
  }, [
    dispatch,
    electionId,
    sessionIdNum,
    isAdmin,
    user,
    loading,
    requiresElectionAccess,
    accessResult,
    routeKey,
    location.pathname,
  ]);

  // Xử lý kết quả kiểm tra quyền và chuyển hướng nếu cần
  useEffect(() => {
    // Bỏ qua nếu đang loading, đang chuyển hướng hoặc chưa có kết quả
    if (loading || redirectingRef.current || accessResult === null) return;

    // Kiểm tra vai trò
    const hasPermission = user?.vaiTro
      ? requiredPermissions.includes(user.vaiTro.tenVaiTro)
      : false;

    // Nếu không có quyền vai trò hoặc không có quyền truy cập
    if (!hasPermission || !accessResult) {
      console.log(
        `[Redirect] Không có quyền truy cập ${location.pathname}, chuyển hướng đến trang không có quyền`,
      );
      redirectingRef.current = true;
      navigate('/chua-xac-thuc');
    }
  }, [accessResult, loading, user, requiredPermissions, navigate, location.pathname]);

  // Hiển thị loading
  if (loading || accessResult === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-gray-100">
        <div className="flex flex-col items-center animate-fade-in">
          <img src="/logo_truong.png" alt="Logo" className="w-32 h-32 mb-4 drop-shadow-md" />
          <h1 className="text-2xl font-bold text-gray-800 tracking-wide">Bầu Cử Holihu</h1>
          <p className="text-gray-600 text-sm italic mt-2">
            Đảm bảo bầu cử an toàn, minh bạch & đáng tin cậy.
          </p>
          <div className="flex space-x-2 mt-4">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-300"></div>
          </div>
        </div>
      </div>
    );
  }

  // Kiểm tra đăng nhập
  if (!accessToken || !user) {
    return <Navigate to="/login" />;
  }

  // Kiểm tra vai trò
  const hasPermission = user.vaiTro ? requiredPermissions.includes(user.vaiTro.tenVaiTro) : false;

  // Nếu không có quyền vai trò hoặc không có quyền truy cập
  if (!hasPermission || !accessResult) {
    return <Navigate to="/chua-xac-thuc" />;
  }

  // Nếu có đủ quyền, render children
  return <>{children}</>;
};

export default ProtectedRoute;
