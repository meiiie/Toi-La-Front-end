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

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Header Section */}
          <div className="mb-10">
            <div
              className={`rounded-3xl shadow-xl overflow-hidden ${
                isDarkMode
                  ? 'bg-gradient-to-r from-[#162A45] to-[#1A365D] border border-[#2A3A5A]'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              }`}
            >
              <div className="px-8 py-10 text-white">
                <h1 className="text-4xl font-bold mb-4">Chào Mừng Tới Bầu Cử Blockchain!</h1>
                <p className="text-lg opacity-90 mb-6">
                  Khám phá các cuộc bầu cử đang diễn ra và tham gia vào quá trình bầu cử an toàn,
                  minh bạch trên nền tảng blockchain.
                </p>
              </div>
            </div>
          </div>

          {/* Elections Grid */}
          {sortedElections.length === 0 ? (
            <ThongBaoKhongCoCuocBauCu />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {currentElections.map((election) => (
                  <ElectionCard key={election.id} election={election} />
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-12 flex justify-center">
                <PaginationPhu
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default HomePage;
