import type React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaExclamationCircle, FaCalendarAlt, FaClock, FaUpload } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion } from 'framer-motion';
import type { CuocBauCu, DuLieuCuocBauCuMoi } from '../store/types';
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
import type { RootState } from '../store/store';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';

interface CuocBauCuFormProps {
  initialData?: CuocBauCu | null;
  onSave: (data: DuLieuCuocBauCuMoi) => Promise<CuocBauCu>;
}

const CuocBauCuForm: React.FC<CuocBauCuFormProps> = ({ initialData, onSave }) => {
  const navigate = useNavigate();
  const taiKhoanId = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan?.id);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DuLieuCuocBauCuMoi>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  const [imageUrl, setImageUrl] = useState<string>(initialData?.anh || '');
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [savedElectionId, setSavedElectionId] = useState<number | null>(null);
  const [ngayBatDau, setNgayBatDau] = useState<Date | null>(
    initialData ? new Date(initialData.ngayBatDau) : null,
  );
  const [gioBatDau, setGioBatDau] = useState<Date | null>(
    initialData ? new Date(initialData.ngayBatDau) : null,
  );
  const [ngayKetThuc, setNgayKetThuc] = useState<Date | null>(
    initialData ? new Date(initialData.ngayKetThuc) : null,
  );
  const [gioKetThuc, setGioKetThuc] = useState<Date | null>(
    initialData ? new Date(initialData.ngayKetThuc) : null,
  );

  console.log('initialData', initialData);

  useEffect(() => {
    if (initialData != null) {
      setValue('id', initialData.id);
      setValue('tenCuocBauCu', initialData.tenCuocBauCu);
      setValue('moTa', initialData.moTa);
      setValue(
        'ngayBatDau',
        format(new Date(Date.parse(initialData.ngayBatDau)), 'dd/MM/yyyy', { locale: vi }),
      );
      setValue('gioBatDau', format(new Date(initialData.ngayBatDau), 'HH:mm', { locale: vi }));
      setValue(
        'ngayKetThuc',
        format(new Date(Date.parse(initialData.ngayKetThuc)), 'dd/MM/yyyy', { locale: vi }),
      );
      setValue('gioKetThuc', format(new Date(initialData.ngayKetThuc), 'HH:mm', { locale: vi }));
      setValue('anh', initialData.anh || '');
    } else {
      setValue('id', 0);
    }
  }, [initialData, setValue]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
        setValue('anh', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitForm = async (data: DuLieuCuocBauCuMoi) => {
    if (!taiKhoanId) {
      alert('Vui lòng đăng nhập để thực hiện thao tác này.');
      return;
    }

    if (!data.ngayBatDau || !data.gioBatDau || !data.ngayKetThuc || !data.gioKetThuc) {
      alert('Vui lòng nhập đầy đủ thông tin thời gian.');
      return;
    }

    const ngayBatDauFull = new Date(
      `${data.ngayBatDau.split('/').reverse().join('-')}T${data.gioBatDau}:00`,
    );
    const ngayKetThucFull = new Date(
      `${data.ngayKetThuc.split('/').reverse().join('-')}T${data.gioKetThuc}:00`,
    );

    if (isNaN(ngayBatDauFull.getTime()) || isNaN(ngayKetThucFull.getTime())) {
      alert('Thông tin thời gian không hợp lệ.');
      return;
    }

    const dataWithTaiKhoanId = {
      ...data,
      ngayBatDau: format(ngayBatDauFull, 'dd/MM/yyyy HH:mm', { locale: vi }),
      ngayKetThuc: format(ngayKetThucFull, 'dd/MM/yyyy HH:mm', { locale: vi }),
      taiKhoanId,
    };

    try {
      const savedElection = await onSave(dataWithTaiKhoanId);
      if (savedElection?.id) {
        setSavedElectionId(savedElection.id);
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Lỗi khi lưu cuộc bầu cử:', error);
      alert('Đã xảy ra lỗi khi lưu dữ liệu. Vui lòng thử lại.');
    }
  };

  const handleConfirm = () => {
    if (savedElectionId) {
      navigate(`/app/user-elections/elections/${savedElectionId}/election-management`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl p-8 shadow-lg"
    >
      {showAlert && (
        <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
          <AlertDialogContent className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {initialData ? 'Cập nhật phiên bầu cử thành công' : 'Tạo phiên bầu cử thành công'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                Bạn đã được chuyển sang trang quản lý phiên bầu cử này.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors">
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirm}
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              >
                Xác Nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-8">
        <h2 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-8 text-center">
          {initialData ? 'Cập Nhật Phiên Bầu Cử' : 'Tạo Phiên Bầu Cử Mới'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="space-y-6">
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-300 mb-4">
              Thông tin chung
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tenCuocBauCu" className="text-blue-700 dark:text-blue-400 text-lg">
                  Tên Phiên Bầu Cử <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tenCuocBauCu"
                  {...register('tenCuocBauCu', { required: 'Bạn phải nhập tên phiên bầu cử' })}
                  className="mt-1 w-full bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                />
                {errors.tenCuocBauCu && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-red-500 text-sm mt-1 flex items-center"
                  >
                    <FaExclamationCircle className="mr-1" /> {errors.tenCuocBauCu.message}
                  </motion.p>
                )}
              </div>
              <div>
                <Label htmlFor="moTa" className="text-blue-700 dark:text-blue-400 text-lg">
                  Mô tả <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="moTa"
                  {...register('moTa', { required: 'Bạn phải nhập mô tả' })}
                  className="mt-1 w-full bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                  rows={4}
                />
                {errors.moTa && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-red-500 text-sm mt-1 flex items-center"
                  >
                    <FaExclamationCircle className="mr-1" /> {errors.moTa.message}
                  </motion.p>
                )}
              </div>
            </div>
          </section>
          <section className="space-y-6">
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-300 mb-4">
              Thời gian
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="ngayBatDau"
                  className="text-blue-700 dark:text-blue-400 text-lg mb-2 block"
                >
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DatePicker
                    selected={ngayBatDau}
                    onChange={(date) => setNgayBatDau(date)}
                    dateFormat="dd/MM/yyyy"
                    locale={vi}
                    className="w-full border-2 border-blue-200 dark:border-blue-700 rounded-lg p-2 text-black dark:text-white bg-white dark:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                    placeholderText="dd/MM/yyyy"
                    required
                  />
                  <FaCalendarAlt className="absolute top-1/2 right-3 transform -translate-y-1/2 text-blue-500 dark:text-blue-400" />
                </div>
                {errors.ngayBatDau && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-red-500 text-sm mt-1 flex items-center"
                  >
                    <FaExclamationCircle className="mr-1" /> {errors.ngayBatDau.message}
                  </motion.p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="gioBatDau"
                  className="text-blue-700 dark:text-blue-400 text-lg mb-2 block"
                >
                  Giờ bắt đầu <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DatePicker
                    selected={gioBatDau}
                    onChange={(date) => setGioBatDau(date)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="HH:mm"
                    locale={vi}
                    className="w-full border-2 border-blue-200 dark:border-blue-700 rounded-lg p-2 text-black dark:text-white bg-white dark:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                    placeholderText="HH:mm"
                    required
                  />
                  <FaClock className="absolute top-1/2 right-3 transform -translate-y-1/2 text-blue-500 dark:text-blue-400" />
                </div>
                {errors.gioBatDau && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-red-500 text-sm mt-1 flex items-center"
                  >
                    <FaExclamationCircle className="mr-1" /> {errors.gioBatDau.message}
                  </motion.p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="ngayKetThuc"
                  className="text-blue-700 dark:text-blue-400 text-lg mb-2 block"
                >
                  Ngày kết thúc <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DatePicker
                    selected={ngayKetThuc}
                    onChange={(date) => setNgayKetThuc(date)}
                    dateFormat="dd/MM/yyyy"
                    locale={vi}
                    className="w-full border-2 border-blue-200 dark:border-blue-700 rounded-lg p-2 text-black dark:text-white bg-white dark:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                    placeholderText="dd/MM/yyyy"
                    required
                  />
                  <FaCalendarAlt className="absolute top-1/2 right-3 transform -translate-y-1/2 text-blue-500 dark:text-blue-400" />
                </div>
                {errors.ngayKetThuc && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-red-500 text-sm mt-1 flex items-center"
                  >
                    <FaExclamationCircle className="mr-1" /> {errors.ngayKetThuc.message}
                  </motion.p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="gioKetThuc"
                  className="text-blue-700 dark:text-blue-400 text-lg mb-2 block"
                >
                  Giờ kết thúc <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <DatePicker
                    selected={gioKetThuc}
                    onChange={(date) => setGioKetThuc(date)}
                    showTimeSelect
                    showTimeSelectOnly
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="HH:mm"
                    locale={vi}
                    className="w-full border-2 border-blue-200 dark:border-blue-700 rounded-lg p-2 text-black dark:text-white bg-white dark:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
                    placeholderText="HH:mm"
                    required
                  />
                  <FaClock className="absolute top-1/2 right-3 transform -translate-y-1/2 text-blue-500 dark:text-blue-400" />
                </div>
                {errors.gioKetThuc && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-red-500 text-sm mt-1 flex items-center"
                  >
                    <FaExclamationCircle className="mr-1" /> {errors.gioKetThuc.message}
                  </motion.p>
                )}
              </div>
            </div>
          </section>
        </div>
        <section className="space-y-4">
          <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-300 mb-4">Hình ảnh</h3>
          <div className="flex items-center space-x-4">
            <Input
              type="text"
              id="anh"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-grow bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300"
              placeholder="URL hình ảnh"
            />
            <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center">
              <FaUpload className="mr-2" />
              Tải lên
              <Input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
          {imageUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-4 border-2 border-blue-200 dark:border-blue-700 rounded-lg overflow-hidden"
            >
              <img
                src={imageUrl || '/placeholder.svg'}
                alt="Election"
                className="w-full h-auto object-cover"
              />
            </motion.div>
          )}
        </section>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          {isSubmitting ? 'Đang xử lý...' : initialData ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </form>
    </motion.div>
  );
};

export default CuocBauCuForm;
