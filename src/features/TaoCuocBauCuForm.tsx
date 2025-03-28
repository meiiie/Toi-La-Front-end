'use client';

import type React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, isBefore, addMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import type { DuLieuCuocBauCuMoi, CuocBauCu } from '../store/types';
import type { RootState, AppDispatch } from '../store/store';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from '../components/ui/AlterDialog';
import { searchCuocBauCuByName } from '../store/slice/cuocBauCuSlice';
import {
  Calendar,
  AlertCircle,
  Info,
  FileText,
  CalendarIcon,
  ClockIcon,
  HelpCircle,
  CheckCircle2,
  Shield,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  ExternalLink,
} from 'lucide-react';

// Thêm hook useDebounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface TaoCuocBauCuFormProps {
  onSave: (newElectionData: CuocBauCu) => Promise<CuocBauCu>;
  darkMode: boolean;
}

// Thay đổi trong component TaoCuocBauCuForm
const TaoCuocBauCuForm: React.FC<TaoCuocBauCuFormProps> = ({ onSave, darkMode }) => {
  const taiKhoanId = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan?.id);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<DuLieuCuocBauCuMoi>({
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const [ngayBatDau, setNgayBatDau] = useState<Date | null>(null);
  const [gioBatDau, setGioBatDau] = useState<Date | null>(null);
  const [ngayKetThuc, setNgayKetThuc] = useState<Date | null>(null);
  const [gioKetThuc, setGioKetThuc] = useState<Date | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showHelp, setShowHelp] = useState<string | null>(null);
  const [stepValidation, setStepValidation] = useState({
    step1: false,
    step2: false,
  });
  const formRef = useRef<HTMLFormElement>(null);
  const [createdElection, setCreatedElection] = useState<CuocBauCu | null>(null);

  const dispatch = useDispatch<AppDispatch>();

  const tenCuocBauCu = watch('tenCuocBauCu');
  const moTa = watch('moTa');

  // Thêm state cho việc kiểm tra tên trùng lặp
  const [isCheckingName, setIsCheckingName] = useState<boolean>(false);
  const [nameExists, setNameExists] = useState<boolean>(false);
  const [timeErrors, setTimeErrors] = useState<{
    ngayBatDau?: string;
    gioBatDau?: string;
    ngayKetThuc?: string;
    gioKetThuc?: string;
  }>({});

  // Sử dụng debounce cho tên cuộc bầu cử
  const debouncedTenCuocBauCu = useDebounce(tenCuocBauCu, 500);

  // Kiểm tra tên cuộc bầu cử trùng lặp
  useEffect(() => {
    const checkNameExists = async () => {
      if (debouncedTenCuocBauCu && debouncedTenCuocBauCu.trim() !== '') {
        setIsCheckingName(true);
        try {
          const duLieu = await dispatch(searchCuocBauCuByName(debouncedTenCuocBauCu));
          setNameExists(duLieu.payload != null);
        } catch (error) {
          console.error('Lỗi khi kiểm tra tên:', error);
        } finally {
          setIsCheckingName(false);
        }
      } else {
        setNameExists(false);
      }
    };

    checkNameExists();
  }, [debouncedTenCuocBauCu, dispatch]);

  // Kiểm tra thời gian hợp lệ
  const validateTime = useCallback(() => {
    const errors: {
      ngayBatDau?: string;
      gioBatDau?: string;
      ngayKetThuc?: string;
      gioKetThuc?: string;
    } = {};

    const now = new Date();

    if (ngayBatDau && gioBatDau) {
      const ngayBatDauFull = new Date(
        `${format(ngayBatDau, 'yyyy-MM-dd')}T${format(gioBatDau, 'HH:mm')}:00`,
      );

      if (isBefore(ngayBatDauFull, addMinutes(now, 5))) {
        errors.gioBatDau = 'Thời gian bắt đầu phải cách hiện tại ít nhất 5 phút';
      }

      if (ngayKetThuc && gioKetThuc) {
        const ngayKetThucFull = new Date(
          `${format(ngayKetThuc, 'yyyy-MM-dd')}T${format(gioKetThuc, 'HH:mm')}:00`,
        );

        if (isBefore(ngayKetThucFull, ngayBatDauFull)) {
          errors.gioKetThuc = 'Thời gian kết thúc phải sau thời gian bắt đầu';
        }
      }
    }

    setTimeErrors(errors);
    return Object.keys(errors).length === 0;
  }, [ngayBatDau, gioBatDau, ngayKetThuc, gioKetThuc]);

  // Kiểm tra thời gian khi các giá trị thay đổi
  useEffect(() => {
    if (ngayBatDau || gioBatDau || ngayKetThuc || gioKetThuc) {
      validateTime();
    }
  }, [ngayBatDau, gioBatDau, ngayKetThuc, gioKetThuc, validateTime]);

  // Kiểm tra tính hợp lệ của từng bước
  useEffect(() => {
    const validateStep1 = async () => {
      const result = await trigger(['tenCuocBauCu', 'moTa']);
      setStepValidation((prev) => ({ ...prev, step1: result }));
    };

    const validateStep2 = () => {
      const isValid =
        ngayBatDau !== null && gioBatDau !== null && ngayKetThuc !== null && gioKetThuc !== null;
      setStepValidation((prev) => ({ ...prev, step2: isValid }));
    };

    if (currentStep === 1) validateStep1();
    if (currentStep === 2) validateStep2();
  }, [currentStep, tenCuocBauCu, moTa, ngayBatDau, gioBatDau, ngayKetThuc, gioKetThuc, trigger]);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -100 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
  };

  const toggleHelp = (helpId: string) => {
    if (showHelp === helpId) {
      setShowHelp(null);
    } else {
      setShowHelp(helpId);
    }
  };

  // Cập nhật hàm nextStep - luôn cho phép chuyển bước để xem tổng quan
  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Cập nhật hàm handleSubmitForm để kiểm tra tất cả điều kiện khi submit
  const handleSubmitForm = async (data: DuLieuCuocBauCuMoi) => {
    if (!taiKhoanId) {
      setAlertMessage('Vui lòng đăng nhập để thực hiện thao tác này.');
      return;
    }

    // Kiểm tra tên cuộc bầu cử trùng lặp
    if (nameExists) {
      setAlertMessage('Tên cuộc bầu cử đã tồn tại. Vui lòng chọn tên khác.');
      setCurrentStep(1); // Quay lại bước 1 để sửa tên
      return;
    }

    // Kiểm tra các trường bắt buộc
    if (!data.tenCuocBauCu || !data.moTa) {
      setAlertMessage('Vui lòng nhập đầy đủ thông tin cơ bản.');
      setCurrentStep(1);
      return;
    }

    if (!ngayBatDau || !gioBatDau || !ngayKetThuc || !gioKetThuc) {
      setAlertMessage('Vui lòng nhập đầy đủ thông tin thời gian.');
      setCurrentStep(2);
      return;
    }

    // Kiểm tra thời gian hợp lệ
    if (!validateTime()) {
      setAlertMessage('Thông tin thời gian không hợp lệ. Vui lòng kiểm tra lại.');
      setCurrentStep(2);
      return;
    }

    const ngayBatDauFull = new Date(
      `${format(ngayBatDau, 'yyyy-MM-dd')}T${format(gioBatDau, 'HH:mm')}:00`,
    );
    const ngayKetThucFull = new Date(
      `${format(ngayKetThuc, 'yyyy-MM-dd')}T${format(gioKetThuc, 'HH:mm')}:00`,
    );

    if (isNaN(ngayBatDauFull.getTime()) || isNaN(ngayKetThucFull.getTime())) {
      setAlertMessage('Thông tin thời gian không hợp lệ.');
      setCurrentStep(2);
      return;
    }

    const dataWithTaiKhoanId = {
      ...data,
      ngayBatDau: format(ngayBatDauFull, 'dd/MM/yyyy HH:mm', { locale: vi }),
      ngayKetThuc: format(ngayKetThucFull, 'dd/MM/yyyy HH:mm', { locale: vi }),
      taiKhoanId,
    };

    try {
      const createdData = await onSave(dataWithTaiKhoanId);
      setCreatedElection(createdData);
      setAlertMessage('success'); // Sử dụng 'success' làm flag thông báo thành công
    } catch (error) {
      console.error('Lỗi khi tạo cuộc bầu cử:', error);
      setAlertMessage('Có lỗi xảy ra khi tạo cuộc bầu cử. Vui lòng thử lại sau.');
    }
  };

  // Get theme-specific colors
  const getColors = () => {
    return {
      bgPrimary: darkMode ? 'bg-[#162A45]/80' : 'bg-white',
      bgSecondary: darkMode ? 'bg-[#1A2942]/70' : 'bg-gray-50',
      bgTertiary: darkMode ? 'bg-[#1A2942]/50' : 'bg-blue-50',
      border: darkMode ? 'border-[#2A3A5A]' : 'border-gray-200',
      borderFocus: darkMode ? 'focus:border-[#4F8BFF]' : 'focus:border-[#0288D1]',
      text: darkMode ? 'text-gray-100' : 'text-gray-800',
      textSecondary: darkMode ? 'text-gray-300' : 'text-gray-600',
      accent: darkMode ? 'text-[#4F8BFF]' : 'text-[#0288D1]',
      accentBg: darkMode ? 'bg-[#4F8BFF]' : 'bg-[#0288D1]',
      shadow: darkMode ? 'shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'shadow-lg shadow-blue-100/20',
      helpBg: darkMode ? 'bg-[#1A2942]' : 'bg-blue-50',
      helpBorder: darkMode ? 'border-[#2A3A5A]' : 'border-blue-100',
      success: darkMode ? 'text-[#00C853]' : 'text-[#00C853]',
      successBg: darkMode ? 'bg-[#00C853]/10' : 'bg-[#00C853]/10',
      successBorder: darkMode ? 'border-[#00C853]/30' : 'border-[#00C853]/30',
    };
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`backdrop-blur-sm ${colors.bgPrimary} border ${colors.border} rounded-3xl p-6 md:p-8 ${colors.shadow}`}
    >
      {/* Form Header with Steps */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h2 className={`text-xl md:text-2xl font-semibold ${colors.text} mb-2 md:mb-0`}>
            Biểu mẫu tạo cuộc bầu cử
          </h2>
          <div className={`text-sm ${colors.textSecondary} flex items-center`}>
            <Shield size={16} className="mr-1" /> Được bảo mật bởi công nghệ blockchain
          </div>
        </div>

        {/* Step Indicator - Phong cách Azure */}
        <div className="relative mt-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2].map((step) => (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className="flex flex-col items-center relative group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    currentStep >= step ? colors.accentBg : 'bg-gray-200 dark:bg-gray-700'
                  } text-white mb-2`}
                >
                  {currentStep > step ? (
                    <Check size={24} />
                  ) : (
                    <span className="text-lg">{step}</span>
                  )}
                </div>
                <span
                  className={`text-sm md:text-base ${currentStep >= step ? colors.accent : colors.textSecondary}`}
                >
                  {step === 1 ? 'Thông tin cơ bản' : 'Thời gian'}
                </span>

                {/* Hiệu ứng tooltip khi hover */}
                <div
                  className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none z-10`}
                >
                  {step === 1 ? 'Nhập thông tin cơ bản' : 'Thiết lập thời gian'}
                </div>
              </button>
            ))}
          </div>

          {/* Thanh tiến trình */}
          <div className="relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              style={{ width: `${((currentStep - 1) / 1) * 100}%` }}
              className={`absolute top-0 left-0 h-full ${colors.accentBg} transition-all duration-500 ease-in-out`}
            ></div>
            <div
              style={{
                width: `${(1 / 1) * 100}%`,
                left: `${((currentStep - 1) / 1) * 100}%`,
                opacity: currentStep < 2 ? 1 : 0,
              }}
              className={`absolute top-0 h-full bg-gradient-to-r from-${colors.accentBg} to-transparent transition-all duration-500 ease-in-out`}
            ></div>
          </div>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit(handleSubmitForm)} className="space-y-8 w-full">
        <AnimatePresence mode="wait">
          {/* Step 1: Thông tin cơ bản */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <FileText className={`w-5 h-5 ${colors.accent}`} />
                <h3 className={`text-lg font-semibold ${colors.text}`}>Thông tin cơ bản</h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between w-full">
                    <Label htmlFor="tenCuocBauCu" className={`${colors.accent} flex items-center`}>
                      Tên Cuộc Bầu Cử <span className="text-[#F44336] ml-1">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => toggleHelp('tenCuocBauCu')}
                      className={`text-xs flex items-center ${colors.textSecondary} hover:${colors.accent} transition-colors`}
                    >
                      <HelpCircle size={14} className="mr-1" />
                      Hướng dẫn
                    </button>
                  </div>

                  {showHelp === 'tenCuocBauCu' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-2xl ${colors.helpBg} border ${colors.helpBorder} mb-2 w-full`}
                    >
                      <p className={`text-sm ${colors.textSecondary}`}>
                        Đặt tên ngắn gọn, dễ nhớ và mô tả chính xác mục đích của cuộc bầu cử. Ví dụ:
                        "Bầu cử Hội đồng Quản trị 2023" hoặc "Bầu chọn Dự án Cộng đồng".
                      </p>
                    </motion.div>
                  )}

                  <div className="relative w-full">
                    <Input
                      id="tenCuocBauCu"
                      {...register('tenCuocBauCu', { required: 'Bạn phải nhập tên cuộc bầu cử' })}
                      className={`w-full ${colors.bgSecondary} ${colors.border} ${colors.borderFocus} ${colors.text} placeholder-${colors.textSecondary}/50 transition-all duration-300 backdrop-blur-sm rounded-2xl ${nameExists ? 'border-[#F44336] focus:border-[#F44336]' : ''}`}
                      placeholder="Nhập tên cuộc bầu cử..."
                    />
                    {isCheckingName && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-3 top-1/3 transform -translate-y-1/2 text-gray-400"
                      >
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </motion.div>
                    )}
                    {tenCuocBauCu && !isCheckingName && !nameExists && !errors.tenCuocBauCu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-3 top-1/3 transform -translate-y-1/2 text-[#00C853]"
                      >
                        <CheckCircle2 size={16} />
                      </motion.div>
                    )}
                  </div>
                  {nameExists && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-[#F44336] text-sm mt-1 flex items-center"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" /> Tên cuộc bầu cử đã tồn tại. Vui lòng
                      chọn tên khác.
                    </motion.p>
                  )}
                  {errors.tenCuocBauCu && !nameExists && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-[#F44336] text-sm mt-1 flex items-center"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" /> {errors.tenCuocBauCu.message}
                    </motion.p>
                  )}
                </div>

                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between w-full">
                    <Label htmlFor="moTa" className={`${colors.accent} flex items-center`}>
                      Mô tả <span className="text-[#F44336] ml-1">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => toggleHelp('moTa')}
                      className={`text-xs flex items-center ${colors.textSecondary} hover:${colors.accent} transition-colors`}
                    >
                      <HelpCircle size={14} className="mr-1" />
                      Hướng dẫn
                    </button>
                  </div>

                  {showHelp === 'moTa' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-2xl ${colors.helpBg} border ${colors.helpBorder} mb-2 w-full`}
                    >
                      <p className={`text-sm ${colors.textSecondary}`}>
                        Mô tả chi tiết về mục đích, quy mô và ý nghĩa của cuộc bầu cử. Thông tin này
                        sẽ giúp cử tri hiểu rõ về cuộc bầu cử trước khi tham gia.
                      </p>
                    </motion.div>
                  )}

                  <div className="relative w-full">
                    <Textarea
                      id="moTa"
                      {...register('moTa', { required: 'Bạn phải nhập mô tả' })}
                      className={`w-full ${colors.bgSecondary} ${colors.border} ${colors.borderFocus} ${colors.text} placeholder-${colors.textSecondary}/50 transition-all duration-300 min-h-[120px] backdrop-blur-sm rounded-2xl`}
                      placeholder="Mô tả chi tiết về cuộc bầu cử..."
                      rows={4}
                    />
                    {moTa && moTa.length > 10 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-3 top-6 text-[#00C853]"
                      >
                        <CheckCircle2 size={16} />
                      </motion.div>
                    )}
                  </div>
                  {errors.moTa && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-[#F44336] text-sm mt-1 flex items-center"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" /> {errors.moTa.message}
                    </motion.p>
                  )}
                </div>

                <div
                  className={`p-3 rounded-2xl ${colors.bgTertiary} border ${colors.helpBorder} flex items-start w-full`}
                >
                  <Users size={18} className={`${colors.accent} mt-0.5 mr-2 flex-shrink-0`} />
                  <div>
                    <p className={`text-sm font-medium ${colors.text}`}>Lưu ý về quyền riêng tư</p>
                    <p className={`text-xs ${colors.textSecondary}`}>
                      Thông tin cơ bản về cuộc bầu cử sẽ được hiển thị công khai cho tất cả người
                      dùng. Tuy nhiên, chỉ những người được mời mới có thể tham gia bỏ phiếu.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="button"
                  onClick={nextStep}
                  className={`relative overflow-hidden ${colors.accentBg} hover:opacity-90 text-white font-medium py-2.5 px-6 rounded-full transition-all duration-300 flex items-center shadow-md hover:shadow-lg`}
                >
                  Tiếp theo <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Thời gian */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="space-y-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Calendar className={`w-5 h-5 ${colors.accent}`} />
                <h3 className={`text-lg font-semibold ${colors.text}`}>Thời gian</h3>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full">
                  <div className="space-y-2 w-full">
                    <Label htmlFor="ngayBatDau" className={`${colors.accent} flex items-center`}>
                      Ngày bắt đầu <span className="text-[#F44336] ml-1">*</span>
                    </Label>
                    <div className="relative group w-full">
                      <DatePicker
                        selected={ngayBatDau}
                        onChange={(date) => setNgayBatDau(date)}
                        dateFormat="dd/MM/yyyy"
                        locale={vi}
                        className={`w-full ${colors.border} rounded-2xl p-2 ${colors.text} ${colors.bgSecondary} ${colors.borderFocus} transition-all duration-300 backdrop-blur-sm ${timeErrors.ngayBatDau ? 'border-[#F44336] focus:border-[#F44336]' : ''}`}
                        placeholderText="dd/MM/yyyy"
                        required
                        popperProps={{
                          strategy: 'fixed',
                        }}
                        popperClassName="date-picker-popper"
                        popperPlacement="bottom-start"
                      />
                      <CalendarIcon
                        className={`absolute top-1/2 right-3 transform -translate-y-1/2 ${colors.accent} group-hover:opacity-80 transition-colors`}
                      />
                    </div>
                    {timeErrors.ngayBatDau && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-[#F44336] text-sm mt-1 flex items-center"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" /> {timeErrors.ngayBatDau}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2 w-full">
                    <Label htmlFor="gioBatDau" className={`${colors.accent} flex items-center`}>
                      Giờ bắt đầu <span className="text-[#F44336] ml-1">*</span>
                    </Label>
                    <div className="relative group w-full">
                      <DatePicker
                        selected={gioBatDau}
                        onChange={(date) => setGioBatDau(date)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="HH:mm"
                        locale={vi}
                        className={`w-full ${colors.border} rounded-2xl p-2 ${colors.text} ${colors.bgSecondary} ${colors.borderFocus} transition-all duration-300 backdrop-blur-sm ${timeErrors.gioBatDau ? 'border-[#F44336] focus:border-[#F44336]' : ''}`}
                        placeholderText="HH:mm"
                        required
                        popperProps={{
                          strategy: 'fixed',
                        }}
                        popperClassName="date-picker-popper"
                        popperPlacement="bottom-start"
                      />
                      <ClockIcon
                        className={`absolute top-1/2 right-3 transform -translate-y-1/2 ${colors.accent} group-hover:opacity-80 transition-colors`}
                      />
                    </div>
                    {timeErrors.gioBatDau && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-[#F44336] text-sm mt-1 flex items-center"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" /> {timeErrors.gioBatDau}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2 w-full">
                    <Label htmlFor="ngayKetThuc" className={`${colors.accent} flex items-center`}>
                      Ngày kết thúc <span className="text-[#F44336] ml-1">*</span>
                    </Label>
                    <div className="relative group w-full">
                      <DatePicker
                        selected={ngayKetThuc}
                        onChange={(date) => setNgayKetThuc(date)}
                        dateFormat="dd/MM/yyyy"
                        locale={vi}
                        className={`w-full ${colors.border} rounded-2xl p-2 ${colors.text} ${colors.bgSecondary} ${colors.borderFocus} transition-all duration-300 backdrop-blur-sm ${timeErrors.ngayKetThuc ? 'border-[#F44336] focus:border-[#F44336]' : ''}`}
                        placeholderText="dd/MM/yyyy"
                        required
                        popperProps={{
                          strategy: 'fixed',
                        }}
                        popperClassName="date-picker-popper"
                        popperPlacement="bottom-start"
                      />
                      <CalendarIcon
                        className={`absolute top-1/2 right-3 transform -translate-y-1/2 ${colors.accent} group-hover:opacity-80 transition-colors`}
                      />
                    </div>
                    {timeErrors.ngayKetThuc && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-[#F44336] text-sm mt-1 flex items-center"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" /> {timeErrors.ngayKetThuc}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-2 w-full">
                    <Label htmlFor="gioKetThuc" className={`${colors.accent} flex items-center`}>
                      Giờ kết thúc <span className="text-[#F44336] ml-1">*</span>
                    </Label>
                    <div className="relative group w-full">
                      <DatePicker
                        selected={gioKetThuc}
                        onChange={(date) => setGioKetThuc(date)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="HH:mm"
                        locale={vi}
                        className={`w-full ${colors.border} rounded-2xl p-2 ${colors.text} ${colors.bgSecondary} ${colors.borderFocus} transition-all duration-300 backdrop-blur-sm ${timeErrors.gioKetThuc ? 'border-[#F44336] focus:border-[#F44336]' : ''}`}
                        placeholderText="HH:mm"
                        required
                        popperProps={{
                          strategy: 'fixed',
                        }}
                        popperClassName="date-picker-popper"
                        popperPlacement="bottom-start"
                      />
                      <ClockIcon
                        className={`absolute top-1/2 right-3 transform -translate-y-1/2 ${colors.accent} group-hover:opacity-80 transition-colors`}
                      />
                    </div>
                    {timeErrors.gioKetThuc && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-[#F44336] text-sm mt-1 flex items-center"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" /> {timeErrors.gioKetThuc}
                      </motion.p>
                    )}
                  </div>
                </div>

                <div
                  className={`p-3 rounded-2xl ${colors.bgTertiary} border ${colors.helpBorder} w-full`}
                >
                  <div className="flex items-start">
                    <Info className={`w-5 h-5 ${colors.accent} mr-2 mt-0.5 flex-shrink-0`} />
                    <div>
                      <p className={`text-sm font-medium ${colors.text}`}>
                        Hướng dẫn thiết lập thời gian
                      </p>
                      <ul
                        className={`text-xs ${colors.textSecondary} list-disc pl-4 mt-1 space-y-1`}
                      >
                        <li>Thời gian bắt đầu phải cách thời điểm hiện tại ít nhất 5 phút</li>
                        <li>Thời gian kết thúc phải sau thời gian bắt đầu</li>
                        <li>Nên đặt thời gian bầu cử đủ dài để tất cả cử tri có thể tham gia</li>
                        <li>Sau khi thời gian kết thúc, kết quả sẽ được công bố tự động</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  onClick={prevStep}
                  className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-medium py-2.5 px-6 rounded-full transition-all duration-300 flex items-center shadow-md`}
                >
                  <ArrowLeft className="mr-2 w-4 h-4" /> Quay lại
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !stepValidation.step2 || Object.keys(timeErrors).length > 0 || isSubmitting
                  }
                  className={`relative overflow-hidden ${colors.accentBg} hover:opacity-90 text-white font-medium py-2.5 px-6 rounded-full transition-all duration-300 flex items-center shadow-md hover:shadow-lg ${
                    !stepValidation.step2 || Object.keys(timeErrors).length > 0 || isSubmitting
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    <span className="relative z-10">Tạo Cuộc Bầu Cử</span>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* AlertDialog thông báo thành công/lỗi */}
      {alertMessage && (
        <AlertDialog
          open={!!alertMessage}
          onOpenChange={() => (alertMessage === 'success' ? null : setAlertMessage(null))}
        >
          <AlertDialogContent
            className={`${darkMode ? 'bg-[#162A45] border' : 'bg-white border'} ${
              alertMessage === 'success'
                ? `${colors.successBorder} rounded-3xl backdrop-blur-md`
                : 'border-[#F44336] rounded-3xl backdrop-blur-md'
            }`}
          >
            <AlertDialogHeader>
              <AlertDialogTitle
                className={`text-xl font-bold ${
                  alertMessage === 'success' ? colors.success : 'text-[#F44336]'
                }`}
              >
                {alertMessage === 'success' ? (
                  <div className="flex items-center">
                    <CheckCircle2 className="w-6 h-6 mr-2" />
                    Tạo cuộc bầu cử thành công!
                  </div>
                ) : (
                  'Thông báo'
                )}
              </AlertDialogTitle>

              {alertMessage === 'success' && createdElection ? (
                <div className="space-y-4">
                  <AlertDialogDescription
                    className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} pb-2`}
                  >
                    Cuộc bầu cử đã được tạo thành công. Bạn có thể tiếp tục quản lý cuộc bầu cử hoặc
                    thêm ảnh và cấu hình thêm.
                  </AlertDialogDescription>

                  <div
                    className={`p-4 rounded-2xl ${colors.bgTertiary} border ${colors.helpBorder} w-full mb-2`}
                  >
                    <div className="flex flex-col space-y-2">
                      <div>
                        <span className={`text-sm font-medium ${colors.textSecondary}`}>
                          Tên cuộc bầu cử:
                        </span>
                        <p className={`text-base font-medium ${colors.text}`}>
                          {createdElection.tenCuocBauCu}
                        </p>
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${colors.textSecondary}`}>ID:</span>
                        <p className={`text-base font-medium ${colors.text}`}>
                          {createdElection.id}
                        </p>
                      </div>
                      <div>
                        <span className={`text-sm font-medium ${colors.textSecondary}`}>
                          Thời gian:
                        </span>
                        <p className={`text-base font-medium ${colors.text}`}>
                          {createdElection.ngayBatDau} - {createdElection.ngayKetThuc}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-2xl ${colors.bgTertiary} border ${colors.helpBorder} w-full`}
                  >
                    <div className="flex items-start">
                      <Info className={`w-5 h-5 ${colors.accent} mr-2 mt-0.5 flex-shrink-0`} />
                      <div>
                        <p className={`text-sm font-medium ${colors.text}`}>Các bước tiếp theo</p>
                        <ul
                          className={`text-xs ${colors.textSecondary} list-disc pl-4 mt-1 space-y-1.5`}
                        >
                          <li>Đi đến trang quản lý để thêm hình ảnh cho cuộc bầu cử</li>
                          <li>Triển khai blockchain và cấu hình thêm về cuộc bầu cử</li>
                          <li>Thêm ứng cử viên và thiết lập thông tin chi tiết</li>
                          <li>Mời cử tri tham gia bỏ phiếu qua email hoặc mã QR</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <AlertDialogDescription className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  {alertMessage}
                </AlertDialogDescription>
              )}
            </AlertDialogHeader>

            <AlertDialogFooter className="flex flex-col sm:flex-row gap-3">
              {alertMessage === 'success' && createdElection ? (
                <>
                  <AlertDialogAction
                    onClick={() => {
                      window.location.href = '/cuoc-bau-cu'; // Chuyển về trang danh sách cuộc bầu cử
                      setAlertMessage(null);
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white transition-all rounded-full"
                  >
                    Về trang chủ
                  </AlertDialogAction>
                  <AlertDialogAction
                    onClick={() => {
                      window.location.href = `/cuoc-bau-cu/${createdElection.id}`;
                      setAlertMessage(null);
                    }}
                    className="flex-1 bg-[#0288D1] hover:bg-[#0277BD] text-white transition-all rounded-full flex items-center justify-center"
                  >
                    <span>Đi đến trang quản lý</span>
                    <ExternalLink className="ml-2 w-4 h-4" />
                  </AlertDialogAction>
                </>
              ) : (
                <AlertDialogAction
                  onClick={() => setAlertMessage(null)}
                  className="bg-[#0288D1] hover:bg-[#0277BD] text-white transition-all rounded-full"
                >
                  Đã hiểu
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </motion.div>
  );
};

export default TaoCuocBauCuForm;
