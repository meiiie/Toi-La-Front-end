'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Home,
  RefreshCw,
  Hexagon,
  Database,
  Shield,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';
import ParticleBackground from './backgrounds/ParticleBackground';

const ThongBaoKhongCoCuocBauCu: React.FC = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Kiểm tra dark mode
  useEffect(() => {
    const isDark =
      localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
  }, []);

  // Xử lý khi người dùng nhấn nút làm mới
  const handleRefresh = () => {
    setIsLoading(true);
    // Giả lập tải lại dữ liệu
    setTimeout(() => {
      setIsLoading(false);
      // Có thể thêm logic tải lại dữ liệu thực tế ở đây
    }, 1500);
  };

  // Xử lý khi người dùng nhấn nút về trang chủ
  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Particle Background */}
      <ParticleBackground isDarkMode={isDarkMode} />

      <div className="w-full max-w-2xl z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>

            <CardHeader className="text-center pb-0">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
                <Database className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                Không Có Cuộc Bầu Cử
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                Hiện tại không có cuộc bầu cử nào được tìm thấy trên hệ thống blockchain
              </p>
            </CardHeader>

            <CardContent className="text-center p-6">
              <div className="bg-gray-50/70 dark:bg-gray-900/50 rounded-lg p-6 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex flex-col items-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                    <Hexagon className="w-10 h-10 text-blue-500 mb-2" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Blockchain</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Công nghệ bảo mật</p>
                  </div>

                  <div className="flex flex-col items-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                    <Shield className="w-10 h-10 text-purple-500 mb-2" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Minh bạch</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dữ liệu công khai</p>
                  </div>

                  <div className="flex flex-col items-center p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
                    <Zap className="w-10 h-10 text-indigo-500 mb-2" />
                    <h3 className="font-medium text-gray-900 dark:text-white">Hiệu quả</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bầu cử nhanh chóng</p>
                  </div>
                </div>

                <div className="text-left">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center mb-2">
                    <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
                    Có thể xảy ra vì một trong các lý do sau:
                  </h3>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1 ml-6">
                    <li>Chưa có cuộc bầu cử nào được tạo trên hệ thống</li>
                    <li>Cuộc bầu cử đã bị xóa hoặc hết hạn</li>
                    <li>Bạn không có quyền truy cập vào cuộc bầu cử hiện tại</li>
                    <li>Có lỗi kết nối đến máy chủ blockchain</li>
                  </ul>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row justify-center gap-3 p-6 pt-0">
              <Button
                variant="outline"
                className="w-full sm:w-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                onClick={handleGoHome}
              >
                <Home className="mr-2 h-4 w-4" />
                Về trang chủ
              </Button>

              <Button
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Đang làm mới...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Làm mới dữ liệu
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
              onClick={() => navigate('/app/user-elections')}
            >
              Xem tất cả cuộc bầu cử
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ThongBaoKhongCoCuocBauCu;
