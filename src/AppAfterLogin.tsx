'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { useSidebar } from './utils/useSidebar';
import { useSelector } from 'react-redux';
import type { RootState } from './store/store';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

const AppAfterLogin: React.FC = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const location = useLocation();

  const accessToken = useSelector((state: RootState) => state.dangNhapTaiKhoan.accessToken);

  // Kiểm tra kích thước màn hình
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Lưu đường dẫn trước khi F5
  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('lastPath', location.pathname);
    }
  }, [accessToken, location.pathname]);

  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <div className="flex min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] text-gray-900 dark:text-white transition-colors duration-300">
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <main
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isMobile ? 'mt-16 px-4 py-6' : isSidebarOpen ? 'ml-[280px] p-6' : 'ml-[80px] p-6'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </ThemeProvider>
  );
};

export default AppAfterLogin;
