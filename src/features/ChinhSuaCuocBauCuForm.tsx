import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, isBefore, isAfter } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';
import {
  Calendar,
  AlertCircle,
  Clock,
  ChevronLeft,
  Save,
  Loader,
  CheckCircle2,
  Info,
  Lock,
  HelpCircle,
} from 'lucide-react';
import apiClient from '../api/apiClient';
import type { CuocBauCu, CuocBauCuDTO } from '../store/types';

// Custom hook for debounce
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

interface ChinhSuaCuocBauCuFormProps {
  cuocBauCu: CuocBauCu;
  isEditable: boolean;
  isSubmitting: boolean;
  onSubmit: (data: CuocBauCuDTO) => void;
}

const ChinhSuaCuocBauCuForm: React.FC<ChinhSuaCuocBauCuFormProps> = ({
  cuocBauCu,
  isEditable,
  isSubmitting,
  onSubmit,
}) => {
  const [nameError, setNameError] = useState<string | null>(null);
  const [dateErrors, setDateErrors] = useState<{
    ngayBatDau?: string;
    ngayKetThuc?: string;
  }>({});
  const [showHelper, setShowHelper] = useState<{
    tenCuocBauCu?: boolean;
    moTa?: boolean;
    ngayBatDau?: boolean;
  }>({});

  // Form states
  const [ngayBatDau, setNgayBatDau] = useState<Date | null>(null);
  const [gioBatDau, setGioBatDau] = useState<Date | null>(null);
  const [ngayKetThuc, setNgayKetThuc] = useState<Date | null>(null);
  const [gioKetThuc, setGioKetThuc] = useState<Date | null>(null);

  // Setup form with default values
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CuocBauCuDTO>({
    defaultValues: {
      id: cuocBauCu?.id,
      tenCuocBauCu: cuocBauCu?.tenCuocBauCu || '',
      moTa: cuocBauCu?.moTa || '',
      ngayBatDau: cuocBauCu?.ngayBatDau || '',
      ngayKetThuc: cuocBauCu?.ngayKetThuc || '',
      taiKhoanId: cuocBauCu?.taiKhoanId,
    },
  });

  // Load and parse date time from cuocBauCu data
  useEffect(() => {
    if (cuocBauCu) {
      // Set form values
      setValue('id', cuocBauCu.id);
      setValue('tenCuocBauCu', cuocBauCu.tenCuocBauCu);
      setValue('moTa', cuocBauCu.moTa);
      setValue('ngayBatDau', cuocBauCu.ngayBatDau);
      setValue('ngayKetThuc', cuocBauCu.ngayKetThuc);
      setValue('taiKhoanId', cuocBauCu.taiKhoanId);

      // Parse dates for date pickers (format: dd/MM/yyyy HH:mm)
      try {
        const parseBatDau = cuocBauCu.ngayBatDau.split(' ');
        const parseKetThuc = cuocBauCu.ngayKetThuc.split(' ');

        if (parseBatDau.length === 2) {
          const [dayBD, monthBD, yearBD] = parseBatDau[0].split('/').map(Number);
          const [hourBD, minuteBD] = parseBatDau[1].split(':').map(Number);

          const bdDate = new Date(yearBD, monthBD - 1, dayBD);
          const bdTime = new Date();
          bdTime.setHours(hourBD, minuteBD);

          setNgayBatDau(bdDate);
          setGioBatDau(bdTime);
        }

        if (parseKetThuc.length === 2) {
          const [dayKT, monthKT, yearKT] = parseKetThuc[0].split('/').map(Number);
          const [hourKT, minuteKT] = parseKetThuc[1].split(':').map(Number);

          const ktDate = new Date(yearKT, monthKT - 1, dayKT);
          const ktTime = new Date();
          ktTime.setHours(hourKT, minuteKT);

          setNgayKetThuc(ktDate);
          setGioKetThuc(ktTime);
        }
      } catch (error) {
        console.error('Error parsing dates:', error);
      }
    }
  }, [cuocBauCu, setValue]);

  // Check for name duplicates with debounce
  const tenCuocBauCu = watch('tenCuocBauCu');
  const originalName = cuocBauCu?.tenCuocBauCu;

  // Debounce the name input to avoid excessive API calls
  const debouncedName = useDebounce(tenCuocBauCu, 500);

  // Only check for name duplicates if name is changed
  useEffect(() => {
    const checkNameDuplicate = async () => {
      // Skip check if name hasn't changed
      if (debouncedName === originalName || !debouncedName) {
        setNameError(null);
        return;
      }

      try {
        const response = await apiClient.get(`/api/CuocBauCu/tim/${debouncedName}`);
        // If we find a record and it's not the current one, it's a duplicate
        if (response.data && response.data.id !== cuocBauCu?.id) {
          setNameError('Tên cuộc bầu cử đã tồn tại');
        } else {
          setNameError(null);
        }
      } catch (error: any) {
        // 404 means no duplicate found, which is good
        if (error.response?.status === 404) {
          setNameError(null);
        }
      }
    };

    // Only check if name is valid and changed
    if (debouncedName && debouncedName !== originalName) {
      checkNameDuplicate();
    } else {
      setNameError(null);
    }
  }, [debouncedName, originalName, cuocBauCu?.id]);

  // Validate dates
  useEffect(() => {
    const validateDates = () => {
      if (ngayBatDau && gioBatDau && ngayKetThuc && gioKetThuc) {
        const errors: {
          ngayBatDau?: string;
          ngayKetThuc?: string;
        } = {};

        // Create full date objects
        const batDauFull = new Date(ngayBatDau);
        batDauFull.setHours(gioBatDau.getHours(), gioBatDau.getMinutes());

        const ketThucFull = new Date(ngayKetThuc);
        ketThucFull.setHours(gioKetThuc.getHours(), gioKetThuc.getMinutes());

        // Check if start date is today or in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (batDauFull < today) {
          errors.ngayBatDau = 'Ngày bắt đầu phải từ hôm nay trở đi';
        }

        // Check if end date is after start date
        if (ketThucFull <= batDauFull) {
          errors.ngayKetThuc = 'Ngày kết thúc phải sau ngày bắt đầu';
        }

        setDateErrors(errors);
        return errors;
      }
      return {};
    };

    validateDates();
  }, [ngayBatDau, gioBatDau, ngayKetThuc, gioKetThuc]);

  // Toggle help text
  const toggleHelper = (field: 'tenCuocBauCu' | 'moTa' | 'ngayBatDau') => {
    setShowHelper((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Handle form submission
  const handleFormSubmit = (data: CuocBauCuDTO) => {
    // Skip submission if not editable
    if (!isEditable) return;

    // Check for validation errors
    if (nameError) {
      return;
    }

    if (Object.keys(dateErrors).length > 0) {
      return;
    }

    // Format dates for submission (dd/MM/yyyy HH:mm)
    if (ngayBatDau && gioBatDau && ngayKetThuc && gioKetThuc) {
      const formatDateWithTime = (date: Date, time: Date) => {
        const formattedDate = format(date, 'dd/MM/yyyy', { locale: vi });
        const formattedTime = format(time, 'HH:mm');
        return `${formattedDate} ${formattedTime}`;
      };

      const formattedBatDau = formatDateWithTime(ngayBatDau, gioBatDau);
      const formattedKetThuc = formatDateWithTime(ngayKetThuc, gioKetThuc);

      // Cập nhật data với định dạng API yêu cầu
      const updatedData: CuocBauCuDTO = {
        id: data.id,
        tenCuocBauCu: data.tenCuocBauCu,
        moTa: data.moTa,
        ngayBatDau: formattedBatDau,
        ngayKetThuc: formattedKetThuc,
        taiKhoanId: data.taiKhoanId,
        anhCuocBauCu: cuocBauCu?.anhCuocBauCu,
        blockchainServerId: cuocBauCu?.blockchainServerId,
        blockchainAddress: cuocBauCu?.blockchainAddress,
      };

      // Submit the form
      onSubmit(updatedData);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl">
        {/* Background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 z-0"></div>

        <div className="bg-white/90 dark:bg-gray-900/40 backdrop-blur-md border border-gray-200/70 dark:border-gray-700/50 p-6 md:p-8 rounded-2xl shadow-xl relative z-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 pb-4 border-b border-gray-200 dark:border-gray-700/50 flex items-center">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              Thông tin cuộc bầu cử
            </span>
            {!isEditable && (
              <div className="ml-3 flex items-center text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-900/30 px-2 py-0.5 rounded-full text-xs font-normal">
                <Lock className="h-3 w-3 mr-1" />
                Chỉ xem
              </div>
            )}
          </h2>

          <div className="space-y-6">
            {/* Tên cuộc bầu cử */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label
                  htmlFor="tenCuocBauCu"
                  className="text-blue-600 dark:text-blue-400 flex items-center"
                >
                  Tên cuộc bầu cử <span className="text-red-500 ml-1">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => toggleHelper('tenCuocBauCu')}
                  className="text-xs flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <HelpCircle size={14} className="mr-1" />
                  Hướng dẫn
                </button>
              </div>

              {showHelper.tenCuocBauCu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 mb-2"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Đặt tên ngắn gọn, dễ nhớ và mô tả chính xác mục đích của cuộc bầu cử. Tên không
                    được trùng với các cuộc bầu cử khác.
                  </p>
                </motion.div>
              )}

              <div className="relative">
                <Input
                  id="tenCuocBauCu"
                  {...register('tenCuocBauCu', { required: 'Tên cuộc bầu cử không được để trống' })}
                  className={`w-full bg-white dark:bg-gray-800/60 border ${nameError ? 'border-red-300 dark:border-red-500/50' : 'border-gray-300 dark:border-gray-700/50'} text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm rounded-xl ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                  placeholder="Nhập tên cuộc bầu cử..."
                  disabled={!isEditable}
                />

                {isEditable && tenCuocBauCu && !nameError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 dark:text-green-400"
                  >
                    <CheckCircle2 size={16} />
                  </motion.div>
                )}
              </div>

              {nameError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-red-500 mt-1 flex items-center"
                >
                  <AlertCircle className="w-4 h-4 mr-1" /> {nameError}
                </motion.p>
              )}

              {errors.tenCuocBauCu && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-red-500 mt-1 flex items-center"
                >
                  <AlertCircle className="w-4 h-4 mr-1" /> {errors.tenCuocBauCu.message}
                </motion.p>
              )}
            </div>

            {/* Mô tả */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label
                  htmlFor="moTa"
                  className="text-blue-600 dark:text-blue-400 flex items-center"
                >
                  Mô tả <span className="text-red-500 ml-1">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => toggleHelper('moTa')}
                  className="text-xs flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <HelpCircle size={14} className="mr-1" />
                  Hướng dẫn
                </button>
              </div>

              {showHelper.moTa && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 mb-2"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mô tả chi tiết về mục đích, quy mô và ý nghĩa của cuộc bầu cử. Thông tin này sẽ
                    giúp người dùng hiểu rõ về cuộc bầu cử của bạn.
                  </p>
                </motion.div>
              )}

              <Textarea
                id="moTa"
                {...register('moTa', { required: 'Mô tả không được để trống' })}
                className={`w-full min-h-[120px] bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 transition-all duration-300 backdrop-blur-sm rounded-xl resize-y ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                placeholder="Mô tả chi tiết về cuộc bầu cử..."
                disabled={!isEditable}
              />

              {errors.moTa && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-red-500 mt-1 flex items-center"
                >
                  <AlertCircle className="w-4 h-4 mr-1" /> {errors.moTa.message}
                </motion.p>
              )}
            </div>

            {/* Thời gian */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-blue-600 dark:text-blue-400 flex items-center">
                  Thời gian <span className="text-red-500 ml-1">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => toggleHelper('ngayBatDau')}
                  className="text-xs flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <HelpCircle size={14} className="mr-1" />
                  Hướng dẫn
                </button>
              </div>

              {showHelper.ngayBatDau && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 mb-2"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Ngày bắt đầu phải từ hôm nay trở đi. Ngày kết thúc phải sau ngày bắt đầu. Chọn
                    thời gian đủ dài để mọi người có thể tham gia.
                  </p>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ngayBatDau" className="text-gray-700 dark:text-gray-300">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <DatePicker
                        selected={ngayBatDau}
                        onChange={(date) => setNgayBatDau(date)}
                        dateFormat="dd/MM/yyyy"
                        locale={vi}
                        className={`w-full p-2 rounded-xl bg-white dark:bg-gray-800/60 border ${dateErrors.ngayBatDau ? 'border-red-300 dark:border-red-500/50' : 'border-gray-300 dark:border-gray-700/50'} text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 transition-all backdrop-blur-sm ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholderText="Chọn ngày"
                        disabled={!isEditable}
                        showYearDropdown
                        dropdownMode="select"
                      />
                      <Calendar
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 dark:text-blue-400"
                        size={16}
                      />
                    </div>
                    <div className="relative">
                      <DatePicker
                        selected={gioBatDau}
                        onChange={(time) => setGioBatDau(time)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeFormat="HH:mm"
                        dateFormat="HH:mm"
                        className={`w-full p-2 rounded-xl bg-white dark:bg-gray-800/60 border ${dateErrors.ngayBatDau ? 'border-red-300 dark:border-red-500/50' : 'border-gray-300 dark:border-gray-700/50'} text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 transition-all backdrop-blur-sm ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholderText="Chọn giờ"
                        disabled={!isEditable}
                      />
                      <Clock
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 dark:text-blue-400"
                        size={16}
                      />
                    </div>
                  </div>
                  {dateErrors.ngayBatDau && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm text-red-500 mt-1 flex items-center"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" /> {dateErrors.ngayBatDau}
                    </motion.p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ngayKetThuc" className="text-gray-700 dark:text-gray-300">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <DatePicker
                        selected={ngayKetThuc}
                        onChange={(date) => setNgayKetThuc(date)}
                        dateFormat="dd/MM/yyyy"
                        locale={vi}
                        className={`w-full p-2 rounded-xl bg-white dark:bg-gray-800/60 border ${dateErrors.ngayKetThuc ? 'border-red-300 dark:border-red-500/50' : 'border-gray-300 dark:border-gray-700/50'} text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 transition-all backdrop-blur-sm ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholderText="Chọn ngày"
                        disabled={!isEditable}
                        showYearDropdown
                        dropdownMode="select"
                      />
                      <Calendar
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 dark:text-purple-400"
                        size={16}
                      />
                    </div>
                    <div className="relative">
                      <DatePicker
                        selected={gioKetThuc}
                        onChange={(time) => setGioKetThuc(time)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeFormat="HH:mm"
                        dateFormat="HH:mm"
                        className={`w-full p-2 rounded-xl bg-white dark:bg-gray-800/60 border ${dateErrors.ngayKetThuc ? 'border-red-300 dark:border-red-500/50' : 'border-gray-300 dark:border-gray-700/50'} text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 transition-all backdrop-blur-sm ${!isEditable ? 'opacity-70 cursor-not-allowed' : ''}`}
                        placeholderText="Chọn giờ"
                        disabled={!isEditable}
                      />
                      <Clock
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 dark:text-purple-400"
                        size={16}
                      />
                    </div>
                  </div>
                  {dateErrors.ngayKetThuc && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm text-red-500 mt-1 flex items-center"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" /> {dateErrors.ngayKetThuc}
                    </motion.p>
                  )}
                </div>
              </div>
            </div>

            {/* Blockchain info */}
            {cuocBauCu?.trangThaiBlockchain !== undefined && cuocBauCu?.trangThaiBlockchain > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                <div className="flex items-start">
                  <div className="mr-4 mt-1">
                    <div
                      className={`
                      p-2 rounded-full 
                      ${
                        cuocBauCu.trangThaiBlockchain === 1
                          ? 'bg-blue-100/70 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : cuocBauCu.trangThaiBlockchain === 2
                            ? 'bg-green-100/70 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-red-100/70 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }
                    `}
                    >
                      {cuocBauCu.trangThaiBlockchain === 1 ? (
                        <Loader className="h-5 w-5 animate-spin" />
                      ) : cuocBauCu.trangThaiBlockchain === 2 ? (
                        <Lock className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-medium mb-1">
                      {cuocBauCu.trangThaiBlockchain === 1
                        ? 'Đang triển khai lên blockchain'
                        : cuocBauCu.trangThaiBlockchain === 2
                          ? 'Đã triển khai lên blockchain'
                          : 'Triển khai thất bại'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {cuocBauCu.trangThaiBlockchain === 1
                        ? 'Cuộc bầu cử đang được triển khai lên blockchain. Vui lòng đợi quá trình này hoàn tất.'
                        : cuocBauCu.trangThaiBlockchain === 2
                          ? 'Cuộc bầu cử đã được triển khai lên blockchain. Dữ liệu đã được bảo vệ và không thể chỉnh sửa.'
                          : 'Có lỗi xảy ra khi triển khai lên blockchain. Vui lòng liên hệ quản trị viên.'}
                    </p>
                    {cuocBauCu.blockchainAddress && (
                      <div className="mt-2 flex items-center">
                        <span className="text-gray-500 mr-2 text-xs">Địa chỉ:</span>
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-blue-600 dark:text-blue-300 text-xs font-mono">
                          {cuocBauCu.blockchainAddress}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Form actions */}
            <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700/50 mt-6">
              <Button
                type="button"
                onClick={() => window.history.back()}
                disabled={isSubmitting}
                className="bg-white hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-700/80 border border-gray-300 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 transition-all duration-300 hover:scale-105 rounded-xl"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Hủy
              </Button>

              {isEditable ? (
                <Button
                  type="submit"
                  disabled={isSubmitting || !!nameError || Object.keys(dateErrors).length > 0}
                  className={`
                    relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 
                    hover:from-blue-500 hover:to-purple-500 text-white shadow-lg 
                    hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 rounded-xl
                    ${isSubmitting || !!nameError || Object.keys(dateErrors).length > 0 ? 'opacity-70 cursor-not-allowed' : ''}
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu thay đổi
                    </>
                  )}

                  {/* Background animation on hover */}
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 1, repeat: Infinity, repeatType: 'loop' }}
                  />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => window.history.back()}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700/80 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 rounded-xl"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default ChinhSuaCuocBauCuForm;
