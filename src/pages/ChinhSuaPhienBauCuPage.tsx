'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPhienBauCuById } from '../store/slice/phienBauCuSlice';
import { fetchCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice';
import ChinhSuaPhienBauCuForm from '../features/ChinhSuaPhienBauCuForm';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/Alter';
import { Button } from '../components/ui/Button';
import {
  ChevronLeft,
  AlertCircle,
  Shield,
  ChevronRight,
  Loader,
  Lock,
  FileEdit,
  Info,
  ExternalLink,
  Calendar,
  CheckCircle,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useToast } from '../test/components/use-toast';
import apiClient from '../api/apiClient';
import type { RootState, AppDispatch } from '../store/store';
import type { CreateUpdatePhienBauCuDTO } from '../store/types';

interface ChinhSuaPhienBauCuPageProps {
  phienBauCuId: string;
}

const ChinhSuaPhienBauCuPage: React.FC<ChinhSuaPhienBauCuPageProps> = ({
  phienBauCuId: propPhienBauCuId,
}) => {
  const { idPhien = propPhienBauCuId } = useParams<{ idPhien: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  // Redux store
  const phienBauCu = useSelector((state: RootState) =>
    state.phienBauCu.cacPhienBauCu.find((p) => p.id === Number(idPhien)),
  );
  const { cuocBauCu } = useSelector((state: RootState) => state.cuocBauCuById);
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);
  const dangTai = useSelector((state: RootState) => state.phienBauCu.dangTai);

  // States
  const [isEditable, setIsEditable] = useState<boolean>(true);
  const [blockchainMessage, setBlockchainMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // Fetch phien bau cu data on mount
  useEffect(() => {
    if (idPhien) {
      dispatch(fetchPhienBauCuById(Number(idPhien)));
    }
  }, [dispatch, idPhien]);

  // Fetch cuoc bau cu data when phien bau cu is loaded
  useEffect(() => {
    if (phienBauCu && phienBauCu.cuocBauCuId) {
      dispatch(fetchCuocBauCuById(phienBauCu.cuocBauCuId));
    }
  }, [dispatch, phienBauCu]);

  // Check if session is editable based on parent election's blockchain status
  useEffect(() => {
    if (cuocBauCu) {
      // Chỉ kiểm tra trạng thái blockchain của cuộc bầu cử
      if (cuocBauCu.trangThaiBlockchain === 1 || cuocBauCu.trangThaiBlockchain === 2) {
        setIsEditable(false);
        setBlockchainMessage(
          cuocBauCu.trangThaiBlockchain === 1
            ? 'Cuộc bầu cử đang được triển khai lên blockchain và không thể chỉnh sửa.'
            : 'Cuộc bầu cử đã được triển khai lên blockchain và không thể chỉnh sửa.',
        );
      } else {
        setIsEditable(true);
        setBlockchainMessage(null);
      }
    }
  }, [cuocBauCu]);

  // Navigate back to QuanLyPhienBauCuPage
  const handleGoBack = useCallback(() => {
    if (cuocBauCu && idPhien) {
      navigate(
        `/app/user-elections/elections/${cuocBauCu.id}/election-management/${idPhien}/phien-bau-cu`,
      );
    } else {
      navigate(-1);
    }
  }, [cuocBauCu, idPhien, navigate]);

  // Handle form submit
  const handleFormSubmit = async (data: CreateUpdatePhienBauCuDTO) => {
    if (!isEditable) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Kiểm tra trạng thái blockchain của cuộc bầu cử trước khi gửi
      if (cuocBauCu?.trangThaiBlockchain === 1 || cuocBauCu?.trangThaiBlockchain === 2) {
        throw new Error(
          'Cuộc bầu cử đã hoặc đang được triển khai, không thể cập nhật phiên bầu cử.',
        );
      }

      // Cập nhật các trường bắt buộc theo định dạng API
      const updateData: CreateUpdatePhienBauCuDTO = {
        id: data.id,
        tenPhienBauCu: data.tenPhienBauCu,
        cuocBauCuId: data.cuocBauCuId,
        moTa: data.moTa,
        ngayBatDau: data.ngayBatDau,
        ngayKetThuc: data.ngayKetThuc,
      };

      // Gọi API cập nhật phiên bầu cử với PUT method
      const response = await apiClient.put('/api/PhienBauCu', updateData);

      // Đặt isSubmitting về false trước khi hiển thị thông báo thành công
      setIsSubmitting(false);

      // Cập nhật dữ liệu Redux
      await dispatch(fetchPhienBauCuById(Number(idPhien)));

      // Hiển thị toast thông báo
      toast({
        title: 'Cập nhật thành công',
        description: 'Thông tin phiên bầu cử đã được cập nhật.',
        variant: 'default',
      });

      // Hiển thị modal thành công
      setShowSuccessModal(true);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        'Có lỗi xảy ra khi cập nhật phiên bầu cử.';
      setErrorMessage(errorMsg);
      setIsSubmitting(false);

      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: errorMsg,
      });
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Get blockchain status badge details
  const getBlockchainStatus = () => {
    if (!phienBauCu || phienBauCu.trangThaiBlockchain === undefined) {
      return {
        text: 'Chưa triển khai',
        color:
          'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800/20',
        icon: <Shield className="h-4 w-4 mr-1.5" />,
      };
    }

    switch (phienBauCu.trangThaiBlockchain) {
      case 0:
        return {
          text: 'Chưa triển khai',
          color:
            'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800/20',
          icon: <Shield className="h-4 w-4 mr-1.5" />,
        };
      case 1:
        return {
          text: 'Đang triển khai',
          color:
            'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-300 dark:border-blue-800/20',
          icon: <Loader className="h-4 w-4 mr-1.5 animate-spin" />,
        };
      case 2:
        return {
          text: 'Đã triển khai',
          color:
            'bg-green-100 text-green-900 dark:bg-green-900/20 dark:text-green-300 border border-green-300 dark:border-green-800/20',
          icon: <Lock className="h-4 w-4 mr-1.5" />,
        };
      case 3:
        return {
          text: 'Triển khai thất bại',
          color:
            'bg-red-100 text-red-900 dark:bg-red-900/20 dark:text-red-300 border border-red-300 dark:border-red-800/20',
          icon: <AlertCircle className="h-4 w-4 mr-1.5" />,
        };
      default:
        return {
          text: 'Chưa triển khai',
          color:
            'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800/20',
          icon: <Shield className="h-4 w-4 mr-1.5" />,
        };
    }
  };

  // Loading state
  if (dangTai) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="relative w-16 h-16 mb-6">
          <motion.div
            className="absolute inset-0 rounded-full border-t-2 border-b-2 border-blue-600 dark:border-blue-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-r-2 border-l-2 border-purple-600 dark:border-purple-500"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <motion.p
          className="text-gray-800 dark:text-gray-400 text-lg font-medium"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Đang tải thông tin phiên bầu cử...
        </motion.p>
      </div>
    );
  }

  // Not found state
  if (!phienBauCu && !dangTai) {
    return (
      <div className="container mx-auto p-4">
        <Alert
          variant="destructive"
          className="bg-red-50 dark:bg-red-800/40 border-2 border-red-300 dark:border-red-600/50 backdrop-blur-sm"
        >
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
          <AlertTitle className="text-red-800 dark:text-red-200 font-medium">Lỗi</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">
            Không tìm thấy thông tin phiên bầu cử. Vui lòng kiểm tra lại.
          </AlertDescription>
        </Alert>
        <Button
          onClick={handleGoBack}
          className="mt-4 bg-white dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-600/60 border border-gray-300 dark:border-gray-600/50 backdrop-blur-sm transition-all text-gray-800 dark:text-gray-200 font-medium"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>
    );
  }

  const blockchainStatus = getBlockchainStatus();

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-5xl">
      {/* Back button - New addition for mobile-friendly navigation */}
      <div className="mb-4 sm:hidden">
        <Button
          onClick={handleGoBack}
          className="w-full bg-white dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/60 border border-gray-300 dark:border-gray-600/50 text-gray-800 dark:text-gray-200 font-medium"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại phiên bầu cử
        </Button>
      </div>

      {/* Header with glassmorphism effect and gradient */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeInUp}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 dark:from-blue-500/15 dark:to-purple-600/15 z-0"></div>
        <div className="bg-white dark:bg-gray-900/40 backdrop-blur-lg border border-gray-200 dark:border-gray-700/50 rounded-2xl p-4 md:p-6 shadow-lg relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="hidden sm:flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-0"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Quay lại
                </Button>
                <span className="hidden sm:inline mx-2">|</span>
                <span>Trang chủ</span>
                <ChevronRight className="h-3 w-3" />
                <span>Cuộc Bầu Cử</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-gray-800 dark:text-gray-300 font-medium truncate max-w-[150px] md:max-w-none">
                  {cuocBauCu?.tenCuocBauCu}
                </span>
                <ChevronRight className="h-3 w-3" />
                <span>Phiên bầu cử</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-gray-800 dark:text-gray-300 font-medium truncate max-w-[150px] md:max-w-none">
                  {phienBauCu?.tenPhienBauCu}
                </span>
                <ChevronRight className="h-3 w-3" />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text font-medium">
                  Chỉnh sửa
                </span>
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Chỉnh sửa phiên bầu cử
                </h1>
                <span
                  className={`text-xs py-1 px-2.5 rounded-full ${blockchainStatus.color} font-medium flex items-center`}
                >
                  {blockchainStatus.icon}
                  {blockchainStatus.text}
                </span>
              </div>
            </div>
          </div>

          {/* Session meta information */}
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-800 dark:text-gray-300">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400" />
              <span className="mr-1 text-gray-700 dark:text-gray-400 font-medium">Từ:</span>
              {formatDate(phienBauCu?.ngayBatDau)}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1.5 text-purple-600 dark:text-purple-400" />
              <span className="mr-1 text-gray-700 dark:text-gray-400 font-medium">Đến:</span>
              {formatDate(phienBauCu?.ngayKetThuc)}
            </div>

            {phienBauCu?.blockchainAddress && (
              <div className="flex items-center mt-2 md:mt-0">
                <ExternalLink className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400" />
                <span className="mr-1 text-gray-700 dark:text-gray-400 font-medium">Địa chỉ:</span>
                <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800/80 px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-300 truncate max-w-[150px] md:max-w-none">
                  {phienBauCu.blockchainAddress.substring(0, 6)}...
                  {phienBauCu.blockchainAddress.substring(phienBauCu.blockchainAddress.length - 4)}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Blockchain warning message with animation */}
      <AnimatePresence>
        {!isEditable && blockchainMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Alert
              variant="default"
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-500/30 backdrop-blur-sm"
            >
              <div className="flex items-start">
                <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <AlertTitle className="text-amber-800 dark:text-amber-300 font-semibold mb-1">
                    Không thể chỉnh sửa
                  </AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-100/90">
                    {blockchainMessage}
                    <p className="mt-2 text-sm">
                      Để đảm bảo tính toàn vẹn và minh bạch của dữ liệu, thông tin phiên bầu cử
                      không thể thay đổi sau khi đã triển khai lên blockchain.
                    </p>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Alert
              variant="destructive"
              className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-500/30 backdrop-blur-sm"
            >
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-300" />
              <AlertTitle className="text-red-800 dark:text-red-200 font-medium">Lỗi</AlertTitle>
              <AlertDescription className="text-red-700 dark:text-red-300">
                {errorMessage}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit form with glassmorphism effect */}
      {phienBauCu && (
        <motion.div initial="initial" animate="animate" variants={fadeInUp}>
          <ChinhSuaPhienBauCuForm
            phienBauCu={phienBauCu}
            isEditable={isEditable}
            isSubmitting={isSubmitting}
            onSubmit={handleFormSubmit}
          />
        </motion.div>
      )}

      {/* Helper section for non-editable election */}
      <AnimatePresence>
        {!isEditable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.5 } }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 z-0"></div>
              <div className="bg-white dark:bg-gray-800/40 backdrop-blur-md border-2 border-gray-300 dark:border-gray-700/50 rounded-xl p-5 shadow-md relative z-10">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                      Bạn cần thay đổi thông tin?
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      Nếu bạn cần thay đổi thông tin, bạn có thể:
                    </p>
                    <ul className="list-disc pl-5 mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li>Tạo một phiên bầu cử mới với thông tin đã cập nhật</li>
                      <li>Thêm ghi chú vào phần mô tả của phiên bầu cử</li>
                      <li>Liên hệ với quản trị viên nếu cần hỗ trợ thêm</li>
                    </ul>

                    <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-700/50 flex flex-wrap gap-3">
                      <Button
                        onClick={handleGoBack}
                        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quay lại
                      </Button>

                      <Button
                        onClick={() =>
                          navigate(
                            `/app/user-elections/elections/${cuocBauCu?.id}/election-management`,
                          )
                        }
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 font-medium"
                      >
                        <FileEdit className="mr-2 h-4 w-4" />
                        Tạo phiên bầu cử mới
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500 mr-2" />
                  Cập nhật thành công
                </h3>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl p-4 mb-4">
                <p className="text-green-900 dark:text-green-300 text-sm">
                  Thông tin phiên bầu cử{' '}
                  <span className="font-semibold">{phienBauCu?.tenPhienBauCu}</span> đã được cập
                  nhật thành công.
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                <div className="flex flex-wrap gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleGoBack}
                    className="border-gray-300 dark:border-gray-600"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại phiên bầu cử
                  </Button>

                  <Button
                    onClick={() => setShowSuccessModal(false)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Tiếp tục chỉnh sửa
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {isSubmitting && !showSuccessModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/50 p-3">
                  <Loader className="h-6 w-6 text-blue-700 dark:text-blue-400 animate-spin" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-center text-gray-900 dark:text-white">
                Đang cập nhật phiên bầu cử
              </h3>
              <p className="mt-2 text-center text-gray-700 dark:text-gray-300">
                Vui lòng đợi trong khi chúng tôi cập nhật thông tin phiên bầu cử của bạn...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChinhSuaPhienBauCuPage;
