import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchViTriUngCuByPhienBauCuId } from '../store/slice/viTriUngCuSlice';
import { UngCuVien } from '../store/types';
import { Info, Loader, AlertTriangle } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';

interface CandidateFormProps {
  onSave: (data: UngCuVien) => void;
  onCancel: () => void;
  initialData?: UngCuVien | null;
  phienBauCuId?: string;
  cuocBauCuId?: string;
}

// Giá trị mặc định cho cuocBauCuId - cần điều chỉnh theo ứng dụng của bạn
const DEFAULT_CUOC_BAU_CU_ID = 37; // Thay đổi thành ID cuộc bầu cử mặc định của bạn

const OptimizedCandidateForm: React.FC<CandidateFormProps> = ({
  onSave,
  onCancel,
  initialData,
  phienBauCuId,
  cuocBauCuId,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  // Lấy thông tin phiên bầu cử từ Redux store
  const phienBauCu = useSelector((state: RootState) =>
    phienBauCuId
      ? state.phienBauCu.cacPhienBauCu.find((p) => p.id === parseInt(phienBauCuId))
      : null,
  );

  // Xác định cuocBauCuId từ nhiều nguồn
  const determineCuocBauCuId = (): number | undefined => {
    // Ưu tiên 1: Sử dụng từ initialData nếu có
    if (initialData?.cuocBauCuId) {
      return initialData.cuocBauCuId;
    }

    // Ưu tiên 2: Sử dụng từ prop cuocBauCuId
    if (cuocBauCuId) {
      return parseInt(cuocBauCuId);
    }

    // Ưu tiên 3: Lấy từ phiên bầu cử trong Redux store
    if (phienBauCu?.cuocBauCuId) {
      return phienBauCu.cuocBauCuId;
    }

    // Mặc định trả về DEFAULT_CUOC_BAU_CU_ID
    return DEFAULT_CUOC_BAU_CU_ID;
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<UngCuVien>({
    defaultValues: {
      id: initialData?.id || 0,
      hoTen: initialData?.hoTen || '',
      moTa: initialData?.moTa || '',
      viTriUngCuId: initialData?.viTriUngCuId || undefined,
      anh: initialData?.anh || '',
      cuocBauCuId: determineCuocBauCuId(),
      phienBauCuId:
        initialData?.phienBauCuId || (phienBauCuId ? parseInt(phienBauCuId) : undefined),
    },
  });

  // Get position list from Redux
  const viTriList = useSelector((state: RootState) => state.viTriUngCu.cacViTriUngCu);
  const loadingPositions = useSelector((state: RootState) => state.viTriUngCu.dangTai);

  // Fetch position data when component mounts
  useEffect(() => {
    if (phienBauCuId) {
      dispatch(fetchViTriUngCuByPhienBauCuId(parseInt(phienBauCuId)));
    }
  }, [dispatch, phienBauCuId]);

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        id: initialData.id,
        hoTen: initialData.hoTen || '',
        moTa: initialData.moTa || '',
        viTriUngCuId: initialData.viTriUngCuId,
        anh: initialData.anh || '',
        cuocBauCuId: initialData.cuocBauCuId || determineCuocBauCuId(),
        phienBauCuId:
          initialData.phienBauCuId || (phienBauCuId ? parseInt(phienBauCuId) : undefined),
      });
    }
  }, [initialData, reset, phienBauCuId]);

  // Handle form submission
  const onSubmit = async (data: UngCuVien) => {
    try {
      // Ensure necessary IDs are set
      if (!data.cuocBauCuId) {
        data.cuocBauCuId = determineCuocBauCuId();
      }

      if (phienBauCuId && !data.phienBauCuId) {
        data.phienBauCuId = parseInt(phienBauCuId);
      }

      // Convert string IDs to numbers
      if (data.viTriUngCuId) data.viTriUngCuId = Number(data.viTriUngCuId);
      if (data.phienBauCuId) data.phienBauCuId = Number(data.phienBauCuId);
      if (data.cuocBauCuId) data.cuocBauCuId = Number(data.cuocBauCuId);

      // Call the save function
      await onSave(data);
    } catch (error) {
      console.error('Lỗi khi lưu ứng viên:', error);
      throw error;
    }
  };

  // Filter positions list for the current phien bau cu
  const filteredPositions = viTriList?.filter((pos) => {
    if (!phienBauCuId) return true;
    return pos.phienBauCuId === parseInt(phienBauCuId);
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hoTen" className="text-gray-700 dark:text-gray-300">
            Họ và tên <span className="text-red-500">*</span>
          </Label>
          <Input
            id="hoTen"
            placeholder="Nhập họ tên ứng viên"
            className={errors.hoTen ? 'border-red-500 focus:ring-red-500' : ''}
            {...register('hoTen', {
              required: 'Vui lòng nhập họ tên ứng viên',
              minLength: { value: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
            })}
          />
          {errors.hoTen && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.hoTen.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="viTriUngCuId"
            className="flex items-center text-gray-700 dark:text-gray-300"
          >
            Vị trí ứng cử <span className="text-red-500">*</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={14} className="ml-1 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Vị trí mà ứng viên tham gia ứng cử</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>

          {loadingPositions ? (
            <div className="flex items-center space-x-2 p-2 border border-gray-300 dark:border-[#2A3A5A] rounded-lg bg-gray-50 dark:bg-[#1A2942]/50">
              <Loader size={16} className="animate-spin text-blue-500 dark:text-blue-400" />
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Đang tải danh sách vị trí...
              </span>
            </div>
          ) : (
            <Select
              onValueChange={(value) => setValue('viTriUngCuId', parseInt(value))}
              defaultValue={initialData?.viTriUngCuId?.toString()}
            >
              <SelectTrigger
                className={errors.viTriUngCuId ? 'border-red-500 focus:ring-red-500' : ''}
              >
                <SelectValue placeholder="-- Chọn vị trí ứng cử --" />
              </SelectTrigger>
              <SelectContent>
                {filteredPositions && filteredPositions.length > 0 ? (
                  filteredPositions.map((position) => (
                    <SelectItem key={position.id} value={position.id.toString()}>
                      {position.tenViTriUngCu}
                    </SelectItem>
                  ))
                ) : (
                  <div className="py-2 px-2 text-sm text-gray-500 dark:text-gray-400">
                    Không có vị trí ứng cử
                  </div>
                )}
              </SelectContent>
            </Select>
          )}

          {errors.viTriUngCuId && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.viTriUngCuId.message}</p>
          )}

          {(!filteredPositions || filteredPositions.length === 0) && !loadingPositions && (
            <Alert
              variant="default"
              className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50"
            >
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-400">
                Chưa có vị trí
              </AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                Chưa có vị trí ứng cử nào. Vui lòng tạo vị trí trước ở tab "Vị trí ứng cử".
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="moTa" className="text-gray-700 dark:text-gray-300">
            Mô tả <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="moTa"
            placeholder="Nhập thông tin giới thiệu về ứng viên"
            rows={4}
            className={errors.moTa ? 'border-red-500 focus:ring-red-500' : ''}
            {...register('moTa', {
              required: 'Vui lòng nhập mô tả ứng viên',
              minLength: { value: 10, message: 'Mô tả phải có ít nhất 10 ký tự' },
            })}
          />
          {errors.moTa && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.moTa.message}</p>
          )}
        </div>

        {/* Hidden fields */}
        <input type="hidden" {...register('cuocBauCuId')} />
        <input type="hidden" {...register('phienBauCuId')} />
        <input type="hidden" {...register('id')} />
        <input type="hidden" {...register('anh')} />
      </div>

      {/* Form actions */}
      <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || loadingPositions}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white"
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : initialData ? (
            'Cập nhật'
          ) : (
            'Lưu ứng viên'
          )}
        </Button>
      </div>
    </form>
  );
};

export default OptimizedCandidateForm;
