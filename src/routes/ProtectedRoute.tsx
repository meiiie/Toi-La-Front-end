import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { RootState } from '../store/store';
import { Navigate, useNavigate } from 'react-router-dom';
import { TaiKhoan } from '../store/types';
import { refreshJwtToken } from '../store/slice/dangNhapTaiKhoanSlice';
import { fetchLatestSession } from '../store/slice/phienDangNhapSlice';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredPermissions: string[];
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermissions }) => {
  const dispatch: AppDispatch = useDispatch();
  const accessToken = useSelector((state: RootState) => state.dangNhapTaiKhoan.accessToken);
  const navigate = useNavigate();

  const user = useSelector(
    (state: RootState) => state.dangNhapTaiKhoan.taiKhoan,
  ) as TaiKhoan | null;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logout = localStorage.getItem('isLoggedOut');

    if (logout === 'true') {
      console.log('hehe');
      navigate('/thank-you');
    }
    const autoLogin = async () => {
      if (!accessToken) {
        // 🔥 Chỉ auto login nếu chưa logout
        try {
          const result = await dispatch(refreshJwtToken());

          if (refreshJwtToken.fulfilled.match(result)) {
            const { accessToken, user } = result.payload;
            if (accessToken) {
              await dispatch(fetchLatestSession(user.id.toString()));
            }
          }
        } catch (err) {
          console.error('Auto login failed:', err);
        }
      }
      setLoading(false);
    };

    autoLogin();
  }, [dispatch, accessToken]);

  // 🔹 Giao diện loading đẹp hơn
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-gray-100">
        <div className="flex flex-col items-center animate-fade-in">
          <img src="/logo_truong.png" alt="Logo" className="w-32 h-32 mb-4 drop-shadow-md" />

          {/* 🔹 Chữ "Bầu Cử Holihu" */}
          <h1 className="text-2xl font-bold text-gray-800 tracking-wide">Bầu Cử Holihu</h1>

          {/* 🔹 Tagline chuyên nghiệp */}
          <p className="text-gray-600 text-sm italic mt-2">
            Đảm bảo bầu cử an toàn, minh bạch & đáng tin cậy.
          </p>

          {/* 🔹 Hiệu ứng loading (3 chấm nhấp nháy) */}
          <div className="flex space-x-2 mt-4">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-300"></div>
          </div>
        </div>
      </div>
    );

  if (!accessToken || !user) {
    return <Navigate to="/Login" />;
  }

  const hasPermission = user.vaiTro
    ? requiredPermissions.includes(user?.vaiTro?.tenVaiTro.toString())
    : false;

  return hasPermission ? <>{children}</> : <Navigate to="/chua-xac-thuc" />;
};

export default ProtectedRoute;
