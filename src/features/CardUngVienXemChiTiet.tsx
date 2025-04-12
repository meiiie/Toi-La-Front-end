'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Info,
  ImageIcon,
  Eye,
  Vote,
  Copy,
  ExternalLink,
  Wallet,
  BadgeCheck,
  LucideIcon,
  Award,
  Medal,
  Target,
} from 'lucide-react';
import type { UngCuVien } from '../store/types';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { fetchImageUngCuVien, fetchBlockchainAddress } from '../store/slice/ungCuVienSlice';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';

interface CardUngVienXemChiTietProps {
  candidate: UngCuVien;
  getPositionName?: (id?: number) => string;
  showBlockchainInfo?: boolean;
  onVote?: () => void;
  isActiveElection?: boolean;
}

const CardUngVienXemChiTiet: React.FC<CardUngVienXemChiTietProps> = ({
  candidate,
  getPositionName,
  showBlockchainInfo = true,
  onVote,
  isActiveElection = false,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);
  const [showBlockchainDetails, setShowBlockchainDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Lấy thông tin ảnh từ Redux store
  const imagesMap = useSelector((state: RootState) => state.ungCuVien.imagesMap);
  const blockchainAddresses = useSelector(
    (state: RootState) => state.ungCuVien.blockchainAddresses,
  );

  const isDescriptionLong = candidate.moTa?.length > 100;

  // Nếu không có hàm getPositionName, sử dụng một hàm mặc định đơn giản
  const getPositionNameSafe =
    getPositionName || ((id?: number) => (id ? `Vị trí ${id}` : 'Chưa phân loại'));

  // Thiết lập URL ảnh khi component mount hoặc khi candidate/imagesMap thay đổi
  useEffect(() => {
    // Đặt lại trạng thái ảnh khi candidate thay đổi
    setImageError(false);

    // Kiểm tra xem có URL ảnh trong imagesMap hay không
    if (imagesMap[candidate.id]) {
      setImageUrl(imagesMap[candidate.id]);
    } else if (candidate.anh) {
      // Nếu có ảnh nhưng chưa có trong imagesMap, gọi API để lấy
      dispatch(fetchImageUngCuVien(candidate.id));
    } else {
      setImageUrl(null);
    }
  }, [candidate, imagesMap, dispatch]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleImageError = () => {
    console.error('Image load error for candidate ID:', candidate.id);
    setImageError(true);
  };

  // Hàm để lấy thông tin blockchain
  const handleViewBlockchainInfo = async () => {
    if (blockchainAddresses[candidate.id]) {
      // Nếu đã có thông tin blockchain, chỉ cần hiển thị
      setShowBlockchainDetails(true);
      return;
    }

    try {
      await dispatch(fetchBlockchainAddress(candidate.id)).unwrap();
      setShowBlockchainDetails(true);
    } catch (error) {
      console.error('Error fetching blockchain info:', error);
    }
  };

  // Hàm copy địa chỉ blockchain
  const copyBlockchainAddress = () => {
    const address = blockchainAddresses[candidate.id];
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Hàm tạo link Etherscan
  const getBlockchainExplorerLink = () => {
    const address = blockchainAddresses[candidate.id];
    if (address && address.startsWith('0x')) {
      return `https://explorer.holihu.online/address/${address}`;
    }
    return undefined;
  };

  // Update the way we get position name to be more robust
  const getPositionDisplayName = () => {
    // First try using the directly attached viTriUngCu object
    if (candidate.viTriUngCu && candidate.viTriUngCu.tenViTriUngCu) {
      return candidate.viTriUngCu.tenViTriUngCu;
    }

    // If that's not available, use the getPositionName function provided as prop
    if (getPositionName && candidate.viTriUngCuId) {
      return getPositionName(candidate.viTriUngCuId);
    }

    // Finally, fall back to a default
    return 'Chưa phân loại';
  };

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300 transform hover:translate-y-[-5px] bg-white hover:shadow-lg dark:bg-gradient-to-br dark:from-[#162A45]/90 dark:to-[#1A2942]/95 backdrop-blur-sm border border-gray-200 dark:border-[#2A3A5A] shadow-md dark:shadow-lg dark:shadow-blue-900/10">
      <div className="relative group">
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={`Hình ảnh của ${candidate.hoTen}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <div className="flex flex-col items-center justify-center">
                <ImageIcon size={48} className="text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {candidate.anh ? 'Không thể tải ảnh' : 'Chưa có ảnh'}
                </p>
              </div>
            </div>
          )}

          {isActiveElection && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-500/80 text-white border-0">
                <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                Đang bầu cử
              </Badge>
            </div>
          )}

          {/* Enhanced position display */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className="bg-purple-600/90 text-white border-0 backdrop-blur-sm hover:bg-purple-700 transition-colors"
              >
                <Award className="mr-1 h-3.5 w-3.5" />
                {getPositionDisplayName()}
              </Badge>

              {candidate.soPhieu !== undefined && (
                <Badge className="bg-amber-500/90 text-white border-0 backdrop-blur-sm">
                  <Medal className="mr-1 h-3.5 w-3.5" />
                  {candidate.soPhieu} phiếu
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-blue-400 dark:to-purple-600 dark:bg-clip-text">
              {candidate.hoTen}
            </h3>

            {/* Position info with more details */}
            <div className="flex flex-wrap gap-2 mt-1.5">
              <Badge
                variant="outline"
                className="bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/30 flex items-center"
              >
                <Target className="h-3 w-3 mr-1" />
                {getPositionDisplayName()}
              </Badge>

              {candidate.viTriUngCu?.soPhieuToiDa && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/30"
                >
                  Tối đa {candidate.viTriUngCu.soPhieuToiDa} phiếu
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="text-gray-600 dark:text-gray-300 text-sm mt-2 space-y-2">
          <p className={isExpanded ? '' : 'line-clamp-3'}>
            {candidate.moTa || 'Không có thông tin mô tả'}
          </p>

          {isDescriptionLong && (
            <button
              onClick={toggleExpand}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm mt-1 focus:outline-none"
            >
              {isExpanded ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </div>

        {/* Blockchain section */}
        {showBlockchainInfo && (
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            {showBlockchainDetails ? (
              <div className="mt-2">
                <div className="flex items-center mb-1">
                  <Wallet size={16} className="text-blue-500 dark:text-blue-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Địa chỉ ví blockchain:
                  </span>
                </div>

                {blockchainAddresses[candidate.id] ? (
                  <div className="mt-1 flex flex-col">
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-xs break-all">
                      <span className="text-gray-700 dark:text-gray-300 mr-1 flex-grow">
                        {blockchainAddresses[candidate.id]}
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              onClick={copyBlockchainAddress}
                            >
                              {copied ? <BadgeCheck size={14} /> : <Copy size={14} />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {copied ? 'Đã sao chép!' : 'Sao chép địa chỉ'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {getBlockchainExplorerLink() && (
                      <a
                        href={getBlockchainExplorerLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <ExternalLink size={12} className="mr-1" />
                        Xem trên Blockchain Explorer
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Không tìm thấy địa chỉ ví blockchain cho ứng viên này.
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleViewBlockchainInfo}
                className="mt-2 text-xs flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Wallet size={14} className="mr-1" />
                <span>Xem thông tin blockchain</span>
              </button>
            )}
          </div>
        )}

        {/* Vote button for active elections */}
        {isActiveElection && onVote && (
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onVote}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Vote className="mr-2 h-4 w-4" />
              Bỏ phiếu cho ứng viên này
            </Button>
          </div>
        )}

        <div className="mt-3 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            <Info size={12} className="mr-1" />
            ID: {candidate.id}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CardUngVienXemChiTiet;
