'use client';

import React, { useState, useEffect, forwardRef } from 'react';
import {
  Edit,
  Trash2,
  Info,
  ImageIcon,
  Upload,
  Check,
  AlertTriangle,
  Wallet,
  Copy,
  ExternalLink,
} from 'lucide-react';
import type { UngCuVien } from '../store/types';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import {
  uploadImageUngCuVien,
  removeImageUngCuVien,
  fetchImageUngCuVien,
  fetchUngCuVienDetailById,
  fetchBlockchainAddress,
} from '../store/slice/ungCuVienSlice';

interface CardUngVienProps {
  candidate: UngCuVien;
  onEdit: (candidate: UngCuVien) => void;
  onDelete: (candidateId: number) => void;
  getPositionName?: (id?: number) => string;
  showBlockchainInfo?: boolean;
}

const CardUngVien = forwardRef<HTMLDivElement, CardUngVienProps>(
  ({ candidate, onEdit, onDelete, getPositionName, showBlockchainInfo = true }, ref) => {
    const dispatch = useDispatch<AppDispatch>();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageError, setImageError] = useState<boolean>(false);
    const [showBlockchainDetails, setShowBlockchainDetails] = useState(false);
    const [loadingBlockchain, setLoadingBlockchain] = useState(false);
    const [copied, setCopied] = useState(false);

    // Lấy thông tin ảnh từ Redux store
    const imagesMap = useSelector((state: RootState) => state.ungCuVien.imagesMap);
    const dangTaiAnh = useSelector((state: RootState) => state.ungCuVien.dangTaiAnh);
    const blockchainAddresses = useSelector(
      (state: RootState) => state.ungCuVien.blockchainAddresses,
    );
    const candidateDetail = useSelector((state: RootState) =>
      state.ungCuVien.ungCuVienChiTietDTO?.id === candidate.id
        ? state.ungCuVien.ungCuVienChiTietDTO
        : null,
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

    // Cập nhật trạng thái tải ảnh từ Redux
    useEffect(() => {
      setIsUploading(dangTaiAnh);
    }, [dangTaiAnh]);

    const toggleExpand = () => {
      setIsExpanded(!isExpanded);
    };

    const handleImageError = () => {
      console.error('Image load error for candidate ID:', candidate.id);
      setImageError(true);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file.type.startsWith('image/')) {
        setUploadError('Chỉ chấp nhận file ảnh');
        setTimeout(() => setUploadError(''), 3000);
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setUploadError('Kích thước file không được vượt quá 2MB');
        setTimeout(() => setUploadError(''), 3000);
        return;
      }

      setUploadError('');
      setUploadSuccess(false);

      try {
        const result = await dispatch(
          uploadImageUngCuVien({
            id: candidate.id,
            imageFile: file,
          }),
        ).unwrap();

        // Cập nhật URL ảnh sau khi upload thành công
        if (result.response && result.response.success) {
          setImageError(false); // Reset lỗi ảnh
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        } else {
          setUploadError(result.response?.message || 'Tải ảnh thất bại');
          setTimeout(() => setUploadError(''), 3000);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadError('Có lỗi xảy ra khi tải ảnh lên');
        setTimeout(() => setUploadError(''), 3000);
      }
    };

    const handleRemoveImage = async () => {
      if (!candidate.anh) return;

      try {
        await dispatch(
          removeImageUngCuVien({
            id: candidate.id,
            fileName: candidate.anh,
          }),
        ).unwrap();

        setImageUrl(null);
        setImageError(false);
      } catch (error) {
        console.error('Delete image error:', error);
      }
    };

    // Hàm để lấy thông tin blockchain
    const handleViewBlockchainInfo = async () => {
      if (blockchainAddresses[candidate.id] || (candidateDetail && candidateDetail.diaChiVi)) {
        // Nếu đã có thông tin blockchain, chỉ cần hiển thị
        setShowBlockchainDetails(true);
        return;
      }

      // Lấy chi tiết ứng viên nếu chưa có
      setLoadingBlockchain(true);
      try {
        // Đầu tiên thử lấy chi tiết ứng viên, có thể đã bao gồm địa chỉ ví
        await dispatch(fetchUngCuVienDetailById(candidate.id)).unwrap();

        // Nếu không có địa chỉ ví trong chi tiết, gọi API riêng
        if (!candidateDetail?.diaChiVi) {
          await dispatch(fetchBlockchainAddress(candidate.id)).unwrap();
        }

        setShowBlockchainDetails(true);
      } catch (error) {
        console.error('Error fetching blockchain info:', error);
      } finally {
        setLoadingBlockchain(false);
      }
    };

    // Hàm copy địa chỉ blockchain
    const copyBlockchainAddress = () => {
      const address = blockchainAddresses[candidate.id] || candidateDetail?.diaChiVi;
      if (address) {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    // Hàm tạo link Etherscan
    const getHoLiHuscanLink = () => {
      const address = blockchainAddresses[candidate.id] || candidateDetail?.diaChiVi;
      if (address && address.startsWith('0x')) {
        // Sử dụng Sepolia testnet
        return `https://explorer.holihu.online/address/${address}`;
      }
      return undefined;
    };

    // Tạo các button components để tránh lỗi ref
    const EditButton = React.forwardRef<
      HTMLButtonElement,
      React.ButtonHTMLAttributes<HTMLButtonElement>
    >((props, forwardedRef) => (
      <button
        {...props}
        ref={forwardedRef}
        className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-600/40 transition-colors"
        onClick={() => onEdit(candidate)}
      >
        <Edit size={16} />
      </button>
    ));
    EditButton.displayName = 'EditButton';

    const DeleteButton = React.forwardRef<
      HTMLButtonElement,
      React.ButtonHTMLAttributes<HTMLButtonElement>
    >((props, forwardedRef) => (
      <button
        {...props}
        ref={forwardedRef}
        className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-600/40 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    ));
    DeleteButton.displayName = 'DeleteButton';

    const UploadButton = React.forwardRef<
      HTMLLabelElement,
      React.LabelHTMLAttributes<HTMLLabelElement>
    >((props, forwardedRef) => (
      <label {...props} ref={forwardedRef} className="cursor-pointer">
        <div className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white hover:shadow-md dark:hover:shadow-blue-900/30 transition-all flex items-center">
          <Upload size={16} className="mr-2" />
          <span>{candidate.anh ? 'Tải lại ảnh' : 'Tải ảnh lên'}</span>
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          disabled={isUploading}
        />
      </label>
    ));
    UploadButton.displayName = 'UploadButton';

    const UploadIconButton = React.forwardRef<
      HTMLLabelElement,
      React.LabelHTMLAttributes<HTMLLabelElement>
    >((props, forwardedRef) => (
      <label {...props} ref={forwardedRef} className="cursor-pointer">
        <div className="p-2 rounded-full bg-blue-500/80 text-white hover:bg-blue-600 transition-colors">
          <Upload size={16} />
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          disabled={isUploading}
        />
      </label>
    ));
    UploadIconButton.displayName = 'UploadIconButton';

    const CopyButton = React.forwardRef<
      HTMLButtonElement,
      React.ButtonHTMLAttributes<HTMLButtonElement>
    >((props, forwardedRef) => (
      <button
        {...props}
        ref={forwardedRef}
        className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        onClick={copyBlockchainAddress}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    ));
    CopyButton.displayName = 'CopyButton';

    return (
      <div
        ref={ref}
        className="rounded-2xl overflow-hidden transition-all duration-300 transform hover:translate-y-[-5px] bg-white hover:shadow-lg dark:bg-gradient-to-br dark:from-[#162A45]/90 dark:to-[#1A2942]/95 backdrop-blur-sm border border-gray-200 dark:border-[#2A3A5A] shadow-md dark:shadow-lg dark:shadow-blue-900/10"
      >
        <div className="relative group">
          <div className="relative w-full h-56 overflow-hidden">
            {imageUrl && !imageError ? (
              <img
                src={imageUrl || '/placeholder.svg'}
                alt={`Hình ảnh của ${candidate.hoTen}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <div className="flex flex-col items-center justify-center">
                  <ImageIcon size={48} className="text-gray-400 dark:text-gray-500 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                    {candidate.anh ? 'Không thể tải ảnh' : 'Chưa có ảnh'}
                  </p>

                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <UploadButton />
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg shadow-lg text-xs max-w-xs z-50 border border-gray-200 dark:border-gray-700"
                          sideOffset={5}
                        >
                          Thêm ảnh đại diện cho ứng viên này. Kích thước tối đa 2MB.
                          <Tooltip.Arrow className="fill-white dark:fill-gray-800" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                </div>
              </div>
            )}

            {/* Hiển thị nút upload khi có ảnh và hover */}
            {imageUrl && !imageError && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="absolute bottom-2 right-2 flex space-x-2">
                  <Tooltip.Provider>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <UploadIconButton />
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1 rounded-lg shadow-lg text-xs border border-gray-200 dark:border-gray-700"
                          sideOffset={5}
                        >
                          Thay đổi ảnh
                          <Tooltip.Arrow className="fill-white dark:fill-gray-800" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>

                  <AlertDialog.Root>
                    <AlertDialog.Trigger asChild>
                      <button
                        className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                        title="Xóa ảnh"
                      >
                        <Trash2 size={16} />
                      </button>
                    </AlertDialog.Trigger>
                    <AlertDialog.Portal>
                      <AlertDialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50" />
                      <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gradient-to-br dark:from-[#162A45] dark:to-[#1A2942] p-6 rounded-xl border border-gray-200 dark:border-[#2A3A5A] shadow-xl max-w-md w-full z-50">
                        <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                          Xác nhận xóa ảnh
                        </AlertDialog.Title>
                        <AlertDialog.Description className="mt-2 text-gray-600 dark:text-gray-300">
                          Bạn có chắc chắn muốn xóa ảnh của ứng viên này không? Hành động này không
                          thể hoàn tác.
                        </AlertDialog.Description>
                        <div className="mt-4 flex justify-end space-x-2">
                          <AlertDialog.Cancel asChild>
                            <button className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                              Hủy
                            </button>
                          </AlertDialog.Cancel>
                          <AlertDialog.Action asChild>
                            <button
                              className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                              onClick={handleRemoveImage}
                            >
                              Xóa ảnh
                            </button>
                          </AlertDialog.Action>
                        </div>
                      </AlertDialog.Content>
                    </AlertDialog.Portal>
                  </AlertDialog.Root>
                </div>
              </div>
            )}

            {/* Upload status indicators */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}

            {uploadSuccess && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center">
                <Check size={16} className="mr-2" />
                <span>Tải ảnh thành công</span>
              </div>
            )}

            {uploadError && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center">
                <AlertTriangle size={16} className="mr-2" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-blue-400 dark:to-purple-600 dark:bg-clip-text">
              {candidate.hoTen}
            </h3>
            <div className="flex space-x-1">
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <EditButton />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1 rounded-lg shadow-lg text-xs border border-gray-200 dark:border-gray-700"
                      sideOffset={5}
                    >
                      Chỉnh sửa
                      <Tooltip.Arrow className="fill-white dark:fill-gray-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>

              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <AlertDialog.Root>
                      <AlertDialog.Trigger asChild>
                        <DeleteButton />
                      </AlertDialog.Trigger>
                      <AlertDialog.Portal>
                        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50" />
                        <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gradient-to-br dark:from-[#162A45] dark:to-[#1A2942] p-6 rounded-xl border border-gray-200 dark:border-[#2A3A5A] shadow-xl max-w-md w-full z-50">
                          <AlertDialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                            Xác nhận xóa
                          </AlertDialog.Title>
                          <AlertDialog.Description className="mt-2 text-gray-600 dark:text-gray-300">
                            Bạn có chắc chắn muốn xóa ứng viên {candidate.hoTen} không? Hành động
                            này không thể hoàn tác.
                          </AlertDialog.Description>
                          <div className="mt-4 flex justify-end space-x-2">
                            <AlertDialog.Cancel asChild>
                              <button className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                Hủy
                              </button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                              <button
                                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                                onClick={() => onDelete(candidate.id)}
                              >
                                Xóa
                              </button>
                            </AlertDialog.Action>
                          </div>
                        </AlertDialog.Content>
                      </AlertDialog.Portal>
                    </AlertDialog.Root>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1 rounded-lg shadow-lg text-xs border border-gray-200 dark:border-gray-700"
                      sideOffset={5}
                    >
                      Xóa
                      <Tooltip.Arrow className="fill-white dark:fill-gray-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
          </div>

          <div className="text-gray-600 dark:text-gray-300 text-sm mt-2 space-y-2">
            <p className={isExpanded ? '' : 'line-clamp-3'}>{candidate.moTa}</p>

            {isDescriptionLong && (
              <button
                onClick={toggleExpand}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm mt-1 focus:outline-none"
              >
                {isExpanded ? 'Ẩn bớt' : 'Xem thêm'}
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

                  {blockchainAddresses[candidate.id] || candidateDetail?.diaChiVi ? (
                    <div className="mt-1 flex flex-col">
                      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-2 text-xs break-all">
                        <span className="text-gray-700 dark:text-gray-300 mr-1 flex-grow">
                          {blockchainAddresses[candidate.id] || candidateDetail?.diaChiVi}
                        </span>
                        <Tooltip.Provider>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <CopyButton />
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1 rounded-lg shadow-lg text-xs border border-gray-200 dark:border-gray-700"
                                sideOffset={5}
                              >
                                {copied ? 'Đã sao chép!' : 'Sao chép địa chỉ'}
                                <Tooltip.Arrow className="fill-white dark:fill-gray-800" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </Tooltip.Provider>
                      </div>

                      {getHoLiHuscanLink() && (
                        <a
                          href={getHoLiHuscanLink()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <ExternalLink size={12} className="mr-1" />
                          Xem trên HoLiHu Explorer
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
                  disabled={loadingBlockchain}
                >
                  {loadingBlockchain ? (
                    <>
                      <div className="animate-spin h-3 w-3 border-t-2 border-blue-500 rounded-full mr-1"></div>
                      <span>Đang tải thông tin blockchain...</span>
                    </>
                  ) : (
                    <>
                      <Wallet size={14} className="mr-1" />
                      <span>Xem thông tin blockchain</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Info size={12} className="mr-1" />
              ID: {candidate.id}
            </span>

            {/* Display vị trí ứng cử if available */}
            {candidate.viTriUngCuId && (
              <span className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded-full">
                {getPositionNameSafe(candidate.viTriUngCuId)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

// Đặt displayName cho component
CardUngVien.displayName = 'CardUngVien';

export default CardUngVien;
