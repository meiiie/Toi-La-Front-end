'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { format, isBefore, addMinutes, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store/store';
import type { PayloadAction } from '@reduxjs/toolkit';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/Dialog';
import { Alert, AlertDescription } from '../components/ui/Alter';
import { Separator } from '../components/ui/Separator';

// Icons
import {
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Info,
  PlusCircle,
  Hexagon,
} from 'lucide-react';

// Types and Redux
import type { PhienBauCu } from '../store/types';
import {
  fetchPhienBauCuByTen,
  fetchCacPhienBauCuByCuocBauCuId,
} from '../store/slice/phienBauCuSlice';

interface TaoPhienBauFormProps {
  onCreateSession: (session: PhienBauCu) => void;
  cuocBauCuId: number;
  isOpen: boolean;
  onClose: () => void;
}

const TaoPhienBauForm: React.FC<TaoPhienBauFormProps> = ({
  onCreateSession,
  cuocBauCuId,
  isOpen,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<PhienBauCu>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  const dispatch: AppDispatch = useDispatch();
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isNameValid, setIsNameValid] = useState<boolean | null>(null);
  const [ngayBatDau, setNgayBatDau] = useState<Date | null>(new Date());
  const [gioBatDau, setGioBatDau] = useState<Date | null>(new Date());
  const [ngayKetThuc, setNgayKetThuc] = useState<Date | null>(new Date());
  const [gioKetThuc, setGioKetThuc] = useState<Date | null>(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [timeErrors, setTimeErrors] = useState<{
    startTime?: string;
    endTime?: string;
  }>({});

  // Watch form values
  const tenPhienBauCu = watch('tenPhienBauCu');
  const moTa = watch('moTa');

  // Check dark mode
  useEffect(() => {
    const isDark =
      localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
  }, []);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      reset();
      setAlertMessage(null);
      setIsNameValid(null);
      setTimeErrors({});

      // Set default times
      const now = new Date();
      const defaultStart = new Date(now.getTime() + 30 * 60000); // 30 minutes from now
      const defaultEnd = new Date(now.getTime() + 120 * 60000); // 2 hours from now

      setNgayBatDau(defaultStart);
      setGioBatDau(defaultStart);
      setNgayKetThuc(defaultEnd);
      setGioKetThuc(defaultEnd);

      // Validate times immediately
      validateTimes(defaultStart, defaultStart, defaultEnd, defaultEnd);
    }
  }, [isOpen, reset]);

  // Validate times whenever they change
  const validateTimes = useCallback(
    (
      startDate: Date | null,
      startTime: Date | null,
      endDate: Date | null,
      endTime: Date | null,
    ) => {
      const newErrors: { startTime?: string; endTime?: string } = {};

      if (startDate && startTime && endDate && endTime) {
        const now = new Date();

        // Create full datetime objects
        const startDateTime = new Date(
          `${format(startDate, 'yyyy-MM-dd')}T${format(startTime, 'HH:mm')}:00`,
        );

        const endDateTime = new Date(
          `${format(endDate, 'yyyy-MM-dd')}T${format(endTime, 'HH:mm')}:00`,
        );

        // Validate start time is at least 5 minutes in the future
        if (isBefore(startDateTime, addMinutes(now, 5))) {
          newErrors.startTime = 'Thời gian bắt đầu phải ít nhất sau thời điểm hiện tại 5 phút';
        }

        // Validate end time is after start time
        if (
          isValid(startDateTime) &&
          isValid(endDateTime) &&
          isBefore(endDateTime, startDateTime)
        ) {
          newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu';
        }
      }

      setTimeErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [],
  );

  // Update validation when dates/times change
  useEffect(() => {
    validateTimes(ngayBatDau, gioBatDau, ngayKetThuc, gioKetThuc);
  }, [ngayBatDau, gioBatDau, ngayKetThuc, gioKetThuc, validateTimes]);

  const handleCreateSession = async (data: PhienBauCu) => {
    if (!ngayBatDau || !gioBatDau || !ngayKetThuc || !gioKetThuc) {
      setAlertMessage('Vui lòng nhập đầy đủ thông tin thời gian.');
      return;
    }

    // Validate times one more time before submission
    const isTimeValid = validateTimes(ngayBatDau, gioBatDau, ngayKetThuc, gioKetThuc);
    if (!isTimeValid) {
      // Use the first error as the alert message
      setAlertMessage(
        timeErrors.startTime || timeErrors.endTime || 'Thông tin thời gian không hợp lệ.',
      );
      return;
    }

    // Check if name exists one more time before submitting
    if (isNameValid === false) {
      setAlertMessage('Tên phiên bầu cử đã tồn tại.');
      return;
    }

    const ngayBatDauFull = new Date(
      `${format(ngayBatDau, 'yyyy-MM-dd')}T${format(gioBatDau, 'HH:mm')}:00`,
    );
    const ngayKetThucFull = new Date(
      `${format(ngayKetThuc, 'yyyy-MM-dd')}T${format(gioKetThuc, 'HH:mm')}:00`,
    );

    const sessionData = {
      ...data,
      cuocBauCuId,
      ngayBatDau: format(ngayBatDauFull, 'dd/MM/yyyy HH:mm', { locale: vi }),
      ngayKetThuc: format(ngayKetThucFull, 'dd/MM/yyyy HH:mm', { locale: vi }),
      trangThai: 'Sắp diễn ra',
    };

    onCreateSession(sessionData);
    reset();
    onClose();
  };

  const checkSessionName = async (name: string) => {
    if (!name || name.trim() === '') return;

    setIsChecking(true);
    setIsNameValid(null);

    try {
      const duLieu = await dispatch(fetchPhienBauCuByTen(name));

      if ((duLieu as PayloadAction<any>).payload != null) {
        setAlertMessage('Tên phiên bầu cử đã tồn tại.');
        setIsNameValid(false);
      } else {
        setAlertMessage(null);
        setIsNameValid(true);
      }

      await dispatch(fetchCacPhienBauCuByCuocBauCuId(cuocBauCuId));
    } catch (error) {
      console.error('Error checking session name:', error);
      setAlertMessage('Có lỗi xảy ra khi kiểm tra tên phiên bầu cử.');
      setIsNameValid(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Handle date/time changes with validation
  const handleStartDateChange = (date: Date | null) => {
    setNgayBatDau(date);
    validateTimes(date, gioBatDau, ngayKetThuc, gioKetThuc);
  };

  const handleStartTimeChange = (time: Date | null) => {
    setGioBatDau(time);
    validateTimes(ngayBatDau, time, ngayKetThuc, gioKetThuc);
  };

  const handleEndDateChange = (date: Date | null) => {
    setNgayKetThuc(date);
    validateTimes(ngayBatDau, gioBatDau, date, gioKetThuc);
  };

  const handleEndTimeChange = (time: Date | null) => {
    setGioKetThuc(time);
    validateTimes(ngayBatDau, gioBatDau, ngayKetThuc, time);
  };

  // Custom DatePicker styles
  const datePickerClassName = `w-full p-2 rounded-lg border text-sm ${
    isDarkMode
      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-xl max-w-md md:max-w-lg w-[calc(100%-2rem)] mx-auto p-4 sm:p-6">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-600/5 z-[-1]"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/70 to-purple-600/70 rounded-t-2xl"></div>

        <DialogHeader className="space-y-1 sm:space-y-2">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1.5 sm:p-2 rounded-full shadow-md">
              <PlusCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
              Tạo Phiên Bầu Cử Mới
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-300 text-sm pl-7 sm:pl-10">
            Vui lòng điền đầy đủ thông tin để tạo phiên bầu cử mới.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2 bg-gradient-to-r from-gray-200/50 via-gray-300/50 to-gray-200/50 dark:from-gray-700/50 dark:via-gray-600/50 dark:to-gray-700/50 h-px" />

        <form
          onSubmit={handleSubmit(handleCreateSession)}
          className="space-y-4 py-1 sm:py-2 overflow-y-auto max-h-[calc(80vh-80px)]"
        >
          <div className="space-y-1.5">
            <Label
              htmlFor="tenPhienBauCu"
              className="text-gray-700 dark:text-gray-300 flex items-center text-sm font-medium"
            >
              <Hexagon className="h-4 w-4 text-blue-500 mr-1.5" />
              Tên phiên bầu cử <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id="tenPhienBauCu"
                className={`pr-10 transition-all duration-200 ${
                  isNameValid === false
                    ? 'border-red-500 focus:ring-red-500'
                    : isNameValid === true
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                }`}
                {...register('tenPhienBauCu', {
                  required: 'Tên phiên bầu cử là bắt buộc',
                  onBlur: (e) => checkSessionName(e.target.value),
                })}
                placeholder="Nhập tên phiên bầu cử"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isChecking ? (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                ) : isNameValid === true ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : isNameValid === false ? (
                  <X className="h-5 w-5 text-red-500" />
                ) : null}
              </div>
            </div>
            <AnimatePresence>
              {(errors.tenPhienBauCu || (isNameValid === false && alertMessage)) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start mt-1.5 pl-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-500 text-xs ml-1.5">
                      {errors.tenPhienBauCu?.message || alertMessage}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="moTa"
              className="text-gray-700 dark:text-gray-300 flex items-center text-sm font-medium"
            >
              <Info className="h-4 w-4 text-blue-500 mr-1.5" />
              Mô tả <span className="text-red-500 ml-1">*</span>
            </Label>
            <Textarea
              id="moTa"
              className={`transition-all duration-200 ${
                errors.moTa
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
              }`}
              {...register('moTa', { required: 'Mô tả là bắt buộc' })}
              placeholder="Nhập mô tả cho phiên bầu cử"
            />
            <AnimatePresence>
              {errors.moTa && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-start mt-1.5 pl-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-500 text-xs ml-1.5">{errors.moTa.message}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="ngayBatDau"
                className="text-gray-700 dark:text-gray-300 flex items-center text-sm font-medium"
              >
                <Calendar className="h-4 w-4 text-blue-500 mr-1.5" />
                Ngày bắt đầu <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <DatePicker
                  selected={ngayBatDau}
                  onChange={handleStartDateChange}
                  dateFormat="dd/MM/yyyy"
                  locale={vi}
                  className={`${datePickerClassName} ${
                    timeErrors.startTime ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholderText="dd/MM/yyyy"
                  required
                />
                <Calendar className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="gioBatDau"
                className="text-gray-700 dark:text-gray-300 flex items-center text-sm font-medium"
              >
                <Clock className="h-4 w-4 text-blue-500 mr-1.5" />
                Giờ bắt đầu <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <DatePicker
                  selected={gioBatDau}
                  onChange={handleStartTimeChange}
                  showTimeSelect
                  showTimeSelectOnly
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="HH:mm"
                  locale={vi}
                  className={`${datePickerClassName} ${
                    timeErrors.startTime ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholderText="HH:mm"
                  required
                />
                <Clock className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              </div>
            </div>

            <AnimatePresence>
              {timeErrors.startTime && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="sm:col-span-2 -mt-1 mb-1"
                >
                  <div className="flex items-start pl-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-500 text-xs ml-1.5">{timeErrors.startTime}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <Label
                htmlFor="ngayKetThuc"
                className="text-gray-700 dark:text-gray-300 flex items-center text-sm font-medium"
              >
                <Calendar className="h-4 w-4 text-blue-500 mr-1.5" />
                Ngày kết thúc <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <DatePicker
                  selected={ngayKetThuc}
                  onChange={handleEndDateChange}
                  dateFormat="dd/MM/yyyy"
                  locale={vi}
                  className={`${datePickerClassName} ${timeErrors.endTime ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholderText="dd/MM/yyyy"
                  required
                />
                <Calendar className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="gioKetThuc"
                className="text-gray-700 dark:text-gray-300 flex items-center text-sm font-medium"
              >
                <Clock className="h-4 w-4 text-blue-500 mr-1.5" />
                Giờ kết thúc <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <DatePicker
                  selected={gioKetThuc}
                  onChange={handleEndTimeChange}
                  showTimeSelect
                  showTimeSelectOnly
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  dateFormat="HH:mm"
                  locale={vi}
                  className={`${datePickerClassName} ${timeErrors.endTime ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholderText="HH:mm"
                  required
                />
                <Clock className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              </div>
            </div>

            <AnimatePresence>
              {timeErrors.endTime && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="sm:col-span-2 -mt-1 mb-1"
                >
                  <div className="flex items-start pl-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-red-500 text-xs ml-1.5">{timeErrors.endTime}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {alertMessage &&
              !errors.tenPhienBauCu &&
              isNameValid !== false &&
              !timeErrors.startTime &&
              !timeErrors.endTime && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>{alertMessage}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
          </AnimatePresence>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2 mt-4 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isChecking ||
                isNameValid === false ||
                !!timeErrors.startTime ||
                !!timeErrors.endTime
              }
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Tạo phiên bầu cử
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaoPhienBauForm;
