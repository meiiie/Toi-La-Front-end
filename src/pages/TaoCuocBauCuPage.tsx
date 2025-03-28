'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppDispatch } from '../store/store';
import { addCuocBauCu } from '../store/slice/cuocBauCuSlice';
import type { CuocBauCu, DuLieuCuocBauCuMoi } from '../store/types';
import TaoCuocBauCuForm from '../features/TaoCuocBauCuForm';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../components/ui/AlterDialog';
import { Spinner } from '../components/ui/Spinner';
import SEO from '../components/SEO';
import ParticleBackground from '../components/backgrounds/particle-backround';

const TaoCuocBauCuPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [savedElectionId, setSavedElectionId] = useState<number | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState<boolean>(false);

  // Thay đổi phần useEffect để lắng nghe sự thay đổi của localStorage
  useEffect(() => {
    // Hàm kiểm tra darkMode
    const checkDarkMode = () => {
      const savedDarkMode = localStorage.getItem('darkMode');
      setDarkMode(savedDarkMode === 'true');
    };

    // Kiểm tra ban đầu
    checkDarkMode();

    // Tạo một interval để kiểm tra thay đổi của localStorage
    const intervalId = setInterval(checkDarkMode, 100);

    // Lắng nghe sự kiện storage change (khi localStorage thay đổi từ tab khác)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'darkMode') {
        setDarkMode(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Tạo một MutationObserver để theo dõi thay đổi của class 'dark' trên body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const body = document.body;
          const isDark = body.classList.contains('dark');
          if (isDark !== darkMode) {
            setDarkMode(isDark);
          }
        }
      });
    });

    observer.observe(document.body, { attributes: true });

    // Tạo một custom event để lắng nghe sự kiện từ các component khác
    const handleDarkModeChange = () => {
      checkDarkMode();
    };

    window.addEventListener('darkModeChange', handleDarkModeChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('darkModeChange', handleDarkModeChange);
      observer.disconnect();
    };
  }, [darkMode]);

  const handleSave = async (newElectionData: DuLieuCuocBauCuMoi): Promise<CuocBauCu> => {
    try {
      setIsLoading(true);
      const createdElection = await dispatch(addCuocBauCu(newElectionData)).unwrap();
      setSavedElectionId(createdElection.id);
      setShowSuccessAnimation(true);

      // Show success animation for 2 seconds before showing the alert
      setTimeout(() => {
        setShowSuccessAnimation(false);
        setShowAlert(true);
      }, 2000);

      return createdElection;
    } catch (error) {
      setShowError('Đã xảy ra lỗi khi tạo phiên bầu cử. Vui lòng thử lại.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (savedElectionId) {
      navigate(`/app/user-elections/elections/${savedElectionId}/election-management`);
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* Minimalist Background with Particles */}
      <div className={`absolute inset-0 z-0 ${darkMode ? 'bg-[#0A0F18]' : 'bg-[#FAFBFF]'}`}>
        <ParticleBackground isDarkMode={darkMode} />
      </div>

      <SEO
        title="Tạo Cuộc Bầu Cử Mới | Nền Tảng Bầu Cử Blockchain"
        description="Trang tạo cuộc bầu cử mới cho hệ thống bầu cử trực tuyến trên blockchain."
        keywords="bầu cử, blockchain, tạo cuộc bầu cử, hệ thống bầu cử trực tuyến"
        author="Holihu"
        image="./tai_xuong.jpg"
        url="https://example.com/tao-cuoc-bau-cu"
      />

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-5xl mx-auto"
        >
          <div className="p-1">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-center mb-8 md:mb-12"
            >
              <h1
                className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r ${
                  darkMode
                    ? 'from-[#0288D1] to-[#4F8BFF] text-transparent'
                    : 'from-[#0288D1] to-[#4F8BFF] text-transparent'
                } bg-clip-text`}
              >
                Tạo Cuộc Bầu Cử Mới
              </h1>

              <p
                className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto text-sm md:text-base`}
              >
                Khởi tạo một cuộc bầu cử mới trên nền tảng blockchain, nơi mỗi lá phiếu đều được bảo
                mật và minh bạch tuyệt đối.
              </p>
            </motion.div>

            {/* Blockchain Info Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className={`mb-8 p-4 rounded-lg ${
                darkMode
                  ? 'bg-[#162A45]/80 border border-[#2A3A5A]'
                  : 'bg-blue-50 border border-blue-100'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className={`p-3 rounded-full ${darkMode ? 'bg-[#1A2942]' : 'bg-blue-100'}`}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke={darkMode ? '#4F8BFF' : '#0288D1'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 16V12"
                      stroke={darkMode ? '#4F8BFF' : '#0288D1'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 8H12.01"
                      stroke={darkMode ? '#4F8BFF' : '#0288D1'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    className={`font-medium text-base md:text-lg ${darkMode ? 'text-[#E1F5FE]' : 'text-gray-800'}`}
                  >
                    Về Hệ Thống Bầu Cử Blockchain
                  </h3>
                  <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Hệ thống này sử dụng công nghệ blockchain để đảm bảo tính minh bạch, bảo mật và
                    không thể thay đổi của kết quả bầu cử. Mỗi phiếu bầu được mã hóa và lưu trữ an
                    toàn trên chuỗi khối.
                  </p>
                </div>
              </div>
            </motion.div>

            {showAlert && (
              <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
                <AlertDialogContent
                  className={`${
                    darkMode
                      ? 'bg-[#162A45] border border-[#4F8BFF]'
                      : 'bg-white border border-[#0288D1]'
                  } rounded-xl backdrop-blur-md`}
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle
                      className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-[#4F8BFF]' : 'text-[#0288D1]'}`}
                    >
                      Tạo phiên bầu cử thành công
                    </AlertDialogTitle>
                    <AlertDialogDescription
                      className={darkMode ? 'text-gray-300' : 'text-gray-600'}
                    >
                      Bạn đã tạo thành công cuộc bầu cử mới. Bạn có muốn chuyển đến trang quản lý
                      cuộc bầu cử này không?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      className={`${
                        darkMode
                          ? 'bg-transparent border border-[#4F8BFF] text-[#4F8BFF] hover:bg-[#1A2942]'
                          : 'bg-transparent border border-[#0288D1] text-[#0288D1] hover:bg-gray-100'
                      } transition-all`}
                    >
                      Ở lại trang này
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirm}
                      className={`${
                        darkMode
                          ? 'bg-[#0288D1] hover:bg-[#0277BD]'
                          : 'bg-[#0288D1] hover:bg-[#0277BD]'
                      } text-white transition-all`}
                    >
                      Đến trang quản lý
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {showError && (
              <AlertDialog open={!!showError} onOpenChange={() => setShowError(null)}>
                <AlertDialogContent
                  className={`${
                    darkMode
                      ? 'bg-[#162A45] border border-[#F44336]'
                      : 'bg-white border border-[#F44336]'
                  } rounded-xl backdrop-blur-md`}
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl md:text-2xl font-bold text-[#F44336]">
                      Lỗi
                    </AlertDialogTitle>
                    <AlertDialogDescription
                      className={darkMode ? 'text-gray-300' : 'text-gray-600'}
                    >
                      {showError}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => setShowError(null)}
                      className={`${
                        darkMode
                          ? 'bg-transparent border border-[#F44336] text-[#F44336] hover:bg-[#1A2942]'
                          : 'bg-transparent border border-[#F44336] text-[#F44336] hover:bg-gray-100'
                      } transition-all`}
                    >
                      Đóng
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <AnimatePresence>
              {showSuccessAnimation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm"
                  style={{ left: '0', width: '100%' }}
                >
                  <div className="relative">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.6, times: [0, 0.6, 1] }}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#0288D1] flex items-center justify-center"
                    >
                      <motion.svg
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        width="50"
                        height="50"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </motion.svg>
                    </motion.div>

                    {/* Stardust particles */}
                    {Array.from({ length: 12 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{
                          x: 0,
                          y: 0,
                          opacity: 1,
                          scale: Math.random() * 0.5 + 0.5,
                        }}
                        animate={{
                          x: (Math.random() - 0.5) * 200,
                          y: (Math.random() - 0.5) * 200,
                          opacity: 0,
                          scale: 0,
                        }}
                        transition={{
                          duration: Math.random() * 1 + 1,
                          delay: 0.4,
                        }}
                        className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-white"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="relative">
                  <Spinner
                    size="large"
                    className={darkMode ? 'text-[#4F8BFF]' : 'text-[#0288D1]'}
                  />
                  <div
                    className={`absolute inset-0 animate-ping opacity-30 rounded-full ${
                      darkMode ? 'bg-[#4F8BFF]' : 'bg-[#0288D1]'
                    } blur-sm`}
                  ></div>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <TaoCuocBauCuForm onSave={handleSave} darkMode={darkMode} />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TaoCuocBauCuPage;
