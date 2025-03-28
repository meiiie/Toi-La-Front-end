'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import NotificationModal from '../components/NotificationModal';
import type { CuocBauCu } from '../store/types';
import { TrangThaiBlockchain } from '../store/types';
import {
  Calendar,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Loader,
  Shield,
  Vote,
} from 'lucide-react';

interface ElectionCardProps {
  election: CuocBauCu;
}

const ElectionCard: React.FC<ElectionCardProps> = ({ election }) => {
  const [showFullDescription, setShowFullDescription] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  if (imageUrl === null) {
    setImageUrl('/tai_xuong.jpg');
  }

  const user = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);
  // Lấy ảnh từ Redux store
  const imagesMap = useSelector((state: RootState) => state.cuocBauCuImage.imagesMap);
  const navigate = useNavigate();

  // Cập nhật imageUrl khi imagesMap thay đổi
  useEffect(() => {
    const newImageUrl = imagesMap[election.id] || election.anhCuocBauCu || election.anh || null;
    setImageUrl(newImageUrl);
    setImageError(false); // Reset error state when we get a new URL
  }, [imagesMap, election]);

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const handleViewDetails = () => {
    if (!user) {
      setShowNotification(true);
    } else {
      // Thay đổi đường dẫn để điều hướng đến trang tham gia bầu cử
      navigate(`/app/user-elections/elections/${election.id}/participate`);
    }
  };

  const handleImageError = () => {
    console.log(`Image error for election ${election.id}`);
    setImageError(true);
  };

  // Xử lý mô tả - Giảm xuống 80 ký tự cho mobile để hiển thị tốt hơn
  const truncateLength = window.innerWidth < 640 ? 80 : 100;
  const truncatedDescription =
    election.moTa.length > truncateLength
      ? election.moTa.substring(0, truncateLength) + '...'
      : election.moTa;

  // Xác định trạng thái cuộc bầu cử
  const now = new Date();
  const startDate = new Date(election.ngayBatDau);
  const endDate = new Date(election.ngayKetThuc);

  let status = '';
  let statusColor = '';
  let statusIcon = null;

  if (now < startDate) {
    status = 'Sắp diễn ra';
    statusColor =
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30';
    statusIcon = <Clock size={14} className="mr-1" />;
  } else if (now > endDate) {
    status = 'Đã kết thúc';
    statusColor =
      'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700/50';
    statusIcon = <CheckCircle size={14} className="mr-1" />;
  } else {
    status = 'Đang diễn ra';
    statusColor =
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/30';
    statusIcon = <Vote size={14} className="mr-1" />;
  }

  // Xác định trạng thái blockchain của cuộc bầu cử
  const getBlockchainStatus = () => {
    const trangThai =
      election.trangThaiBlockchain !== undefined
        ? election.trangThaiBlockchain
        : TrangThaiBlockchain.ChuaTrienKhai;

    switch (trangThai) {
      case TrangThaiBlockchain.ChuaTrienKhai:
        return {
          text: 'Chưa triển khai',
          color:
            'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/30',
          icon: <Shield size={14} className="mr-1" />,
        };
      case TrangThaiBlockchain.DangTrienKhai:
        return {
          text: 'Đang triển khai',
          color:
            'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/30',
          icon: <Loader size={14} className="mr-1 animate-spin" />,
        };
      case TrangThaiBlockchain.DaTrienKhai:
        return {
          text: 'Đã triển khai',
          color:
            'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/30',
          icon: <CheckCircle size={14} className="mr-1" />,
        };
      case TrangThaiBlockchain.TrienKhaiThatBai:
        return {
          text: 'Triển khai thất bại',
          color:
            'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30',
          icon: <AlertTriangle size={14} className="mr-1" />,
        };
      default:
        return {
          text: 'Chưa triển khai',
          color:
            'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800/30',
          icon: <Shield size={14} className="mr-1" />,
        };
    }
  };

  const blockchainStatus = getBlockchainStatus();

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-3xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700 w-full">
      {/* Card Header - Image - Responsive height */}
      <div className="relative h-36 sm:h-48 overflow-hidden">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl || '/tai_xuong.jpg'}
            alt={`Ảnh của ${election.tenCuocBauCu}`}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <span className="text-gray-400 dark:text-gray-500 text-sm sm:text-base">
              Không có ảnh
            </span>
          </div>
        )}
        {/* Status badges - Stacked on mobile, side by side on larger screens */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col gap-1 sm:gap-2">
          <span
            className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${statusColor} border flex items-center text-xs sm:text-sm`}
          >
            {statusIcon} <span className="ml-1">{status}</span>
          </span>
          <span
            className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${blockchainStatus.color} border flex items-center text-xs sm:text-sm`}
          >
            {blockchainStatus.icon} <span className="ml-1">{blockchainStatus.text}</span>
          </span>
        </div>
      </div>

      {/* Card Content - Improved padding for mobile */}
      <div className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-800 dark:text-white line-clamp-2">
          {election.tenCuocBauCu}
        </h3>

        <p className="text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 text-xs sm:text-sm min-h-[2.5rem] sm:min-h-[3rem]">
          {showFullDescription ? election.moTa : truncatedDescription}
          {election.moTa.length > truncateLength && (
            <button
              onClick={toggleDescription}
              className="ml-1 text-blue-600 dark:text-blue-400 hover:underline focus:outline-none"
            >
              {showFullDescription ? 'Ẩn bớt' : 'Xem thêm'}
            </button>
          )}
        </p>

        {/* Election Details - Responsive spacing */}
        <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
          <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <Calendar
              size={14}
              className="mr-1.5 sm:mr-2 text-blue-500 dark:text-blue-400 flex-shrink-0"
            />
            <span>Bắt đầu: {formatDate(election.ngayBatDau)}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <Clock
              size={14}
              className="mr-1.5 sm:mr-2 text-blue-500 dark:text-blue-400 flex-shrink-0"
            />
            <span>Kết thúc: {formatDate(election.ngayKetThuc)}</span>
          </div>

          {/* Blockchain Address (if available) - Better text wrapping */}
          {election.blockchainAddress && (
            <div className="flex items-start text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2">
              <Shield
                size={14}
                className="mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0 text-blue-500 dark:text-blue-400"
              />
              <div className="overflow-hidden">
                <span>Blockchain: </span>
                <span className="font-mono text-xs break-all">
                  {election.blockchainAddress.substring(0, 6)}...
                  {election.blockchainAddress.substring(election.blockchainAddress.length - 4)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button - Better tap area for mobile */}
        <button
          onClick={handleViewDetails}
          className="w-full py-2.5 sm:py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg sm:rounded-xl flex items-center justify-center font-medium transition-all duration-300 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 text-sm sm:text-base"
        >
          <span>Tham gia bầu cử</span>
          <ArrowRight size={16} className="ml-2" />
        </button>
      </div>

      {/* Notification Modal */}
      {showNotification && (
        <NotificationModal
          title="Thông báo"
          message="Bạn cần đăng nhập để tham gia cuộc bầu cử"
          onClose={() => setShowNotification(false)}
        />
      )}
    </div>
  );
};

export default ElectionCard;
