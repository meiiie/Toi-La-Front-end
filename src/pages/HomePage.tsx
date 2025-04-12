'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchCacCuocBauCu } from '../store/slice/cuocBauCuSlice';
import { fetchMultipleImages } from '../store/slice/cuocBauCuImageSlice';
import PaginationPhu from '../components/PaginationPhu';
import type { RootState, AppDispatch } from '../store/store';
import type { CuocBauCu } from '../store/types';
import SEO from '../components/SEO';
import ThongBaoKhongCoCuocBauCu from '../components/ThongBaoKhongCoCuocBauCu';
import ElectionCard from '../features/CardCuocBauCu';
import ParticleBackground from '../components/backgrounds/particle-backround';

const HomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const elections = useSelector((state: RootState) => state.cuocBauCu.cacCuocBauCu);
  const imagesMap = useSelector((state: RootState) => state.cuocBauCuImage.imagesMap);
  const [searchParams] = useSearchParams();
  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(localStorage.getItem('theme') === 'dark');

  // Thêm state để theo dõi kích thước màn hình
  const [isMobileView, setIsMobileView] = useState<boolean>(window.innerWidth < 640);

  // Theo dõi thay đổi theme từ localStorage
  useEffect(() => {
    const checkTheme = () => {
      const theme = localStorage.getItem('theme');
      setIsDarkMode(theme === 'dark');
    };

    // Kiểm tra ban đầu
    checkTheme();

    // Thiết lập event listener để theo dõi thay đổi localStorage
    const handleStorageChange = () => {
      checkTheme();
    };

    window.addEventListener('storage', handleStorageChange);

    // Custom event để bắt thay đổi theme từ các component khác
    const handleThemeChange = () => {
      checkTheme();
    };

    window.addEventListener('themeChange', handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  // Thêm effect để theo dõi kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 640);
    };

    // Kiểm tra ban đầu
    handleResize();

    // Thiết lập event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Tải danh sách cuộc bầu cử
    dispatch(fetchCacCuocBauCu());
  }, [dispatch]);

  useEffect(() => {
    // Khi có danh sách cuộc bầu cử, tải tất cả ảnh cùng lúc
    if (elections && elections.length > 0) {
      const electionIds = elections.map((election) => election.id);
      dispatch(fetchMultipleImages(electionIds))
        .then((result) => {})
        .catch((error) => {});
    }
  }, [elections, dispatch]);

  // Log imagesMap để debug
  useEffect(() => {}, [imagesMap]);

  // Lọc cuộc bầu cử theo tìm kiếm từ sidebar (nếu có)
  const filteredElections = elections.filter((election: CuocBauCu) => {
    const search = searchParams.get('search');
    if (!search) return true;
    return election.tenCuocBauCu.toLowerCase().includes(search.toLowerCase());
  });

  // Sắp xếp cuộc bầu cử mới nhất lên đầu
  const sortedElections = [...filteredElections].sort((a, b) => {
    const dateA = new Date(a.ngayBatDau);
    const dateB = new Date(b.ngayBatDau);
    return dateB.getTime() - dateA.getTime(); // Sắp xếp giảm dần theo ngày bắt đầu
  });

  const totalPages = Math.ceil(sortedElections.length / itemsPerPage);
  const currentElections = sortedElections.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Đã loại bỏ auto-scroll
  };

  return (
    <>
      <SEO
        title="Trang Chủ | Nền Tảng Bầu Cử Blockchain"
        description="Trang chủ của nền tảng bầu cử blockchain. Khám phá các cuộc bầu cử và tham gia vào quá trình bầu cử an toàn và minh bạch."
        keywords="bầu cử, blockchain, trang chủ, an toàn, minh bạch"
        author="Nền Tảng Bầu Cử Blockchain"
        url={window.location.href}
        image={`${window.location.origin}/logo.png`}
      />

      <div className={`relative min-h-screen ${isDarkMode ? 'dark' : ''}`}>
        {/* Particle Background */}
        <div className={`absolute inset-0 z-0 ${isDarkMode ? 'bg-[#0A0F18]' : 'bg-[#FAFBFF]'}`}>
          <ParticleBackground isDarkMode={isDarkMode} />
        </div>

        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">
          {/* Header Section - Tối ưu cho mobile */}
          <div className="mb-6 sm:mb-10">
            <div
              className={`rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl overflow-hidden ${
                isDarkMode
                  ? 'bg-gradient-to-r from-[#162A45] to-[#1A365D] border border-[#2A3A5A]'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              }`}
            >
              <div className="px-5 sm:px-8 py-6 sm:py-10 text-white">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                  Chào Mừng Tới Bầu Cử Blockchain!
                </h1>
                <p className="text-base sm:text-lg opacity-90">
                  Khám phá các cuộc bầu cử đang diễn ra và tham gia vào quá trình bầu cử an toàn,
                  minh bạch trên nền tảng blockchain.
                </p>
              </div>
            </div>
          </div>

          {/* Elections Grid - Cải thiện grid cho mobile */}
          {sortedElections.length === 0 ? (
            <ThongBaoKhongCoCuocBauCu />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {currentElections.map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-8 sm:mt-12 flex justify-center">
                <PaginationPhu
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}

          {/* Footer - Hiển thị trên mobile */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800/30 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} HoLiHu Blockchain</p>
            <p className="mt-1">Nền tảng bầu cử phi tập trung, bảo mật và minh bạch</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
