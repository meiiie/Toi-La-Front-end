import React, { useState, useEffect, useCallback } from 'react';
import { Award, AlertTriangle, Info, Loader } from 'lucide-react';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';

interface ViTriUngCuFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any | null;
  phienBauCuId: string;
  cuocBauCuId?: string;
  isSubmitting?: boolean;
  checkDuplicateName?: (name: string, excludeId?: number) => Promise<boolean>;
  isMobile?: boolean;
}

const ViTriUngCuForm: React.FC<ViTriUngCuFormProps> = ({
  onSave,
  onCancel,
  initialData,
  phienBauCuId,
  cuocBauCuId,
  isSubmitting = false,
  checkDuplicateName,
  isMobile = false,
}) => {
  const [formData, setFormData] = useState({
    tenViTriUngCu: initialData?.tenViTriUngCu || '',
    soPhieuToiDa: initialData?.soPhieuToiDa || 1,
    moTa: initialData?.moTa || '',
    phienBauCuId: initialData?.phienBauCuId || parseInt(phienBauCuId),
    cuocBauCuId: initialData?.cuocBauCuId || (cuocBauCuId ? parseInt(cuocBauCuId) : 1),
    id: initialData?.id || 0,
  });

  // Form validation
  const [errors, setErrors] = useState({
    tenViTriUngCu: '',
    soPhieuToiDa: '',
    moTa: '',
  });

  // Checking name duplicate status
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // Form validation status
  const [isFormValid, setIsFormValid] = useState(true);

  // Overall form error
  const [formError, setFormError] = useState<string | null>(null);

  // Get cuocBauCuId from URL if not provided
  const extractCuocBauCuIdFromUrl = useCallback((): string | undefined => {
    const path = window.location.pathname;
    const matches = path.match(/\/elections\/(\d+)/);
    return matches ? matches[1] : undefined;
  }, []);

  // Updated cuocBauCuId if needed
  useEffect(() => {
    if (!initialData?.cuocBauCuId) {
      const effectiveCuocBauCuId = cuocBauCuId || extractCuocBauCuIdFromUrl() || '1';

      setFormData((prev) => ({
        ...prev,
        cuocBauCuId: parseInt(effectiveCuocBauCuId),
      }));
    }
  }, [cuocBauCuId, initialData, extractCuocBauCuIdFromUrl]);

  // Validate name on blur
  const handleNameBlur = useCallback(async () => {
    if (!formData.tenViTriUngCu.trim()) {
      setErrors((prev) => ({
        ...prev,
        tenViTriUngCu: 'Vui lòng nhập tên vị trí ứng cử',
      }));
      return;
    }

    if (checkDuplicateName) {
      setIsCheckingDuplicate(true);
      try {
        const isDuplicate = await checkDuplicateName(
          formData.tenViTriUngCu.trim(),
          initialData?.id,
        );

        if (isDuplicate) {
          setErrors((prev) => ({
            ...prev,
            tenViTriUngCu: 'Tên vị trí này đã tồn tại trong phiên bầu cử. Vui lòng chọn tên khác',
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            tenViTriUngCu: '',
          }));
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra trùng tên:', error);
        setFormError('Không thể kiểm tra trùng tên. Vui lòng thử lại sau.');
      } finally {
        setIsCheckingDuplicate(false);
      }
    }
  }, [formData.tenViTriUngCu, checkDuplicateName, initialData?.id]);

  // Handle form input changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      const fieldName = name as keyof typeof errors;

      let fieldValue = value;
      if (name === 'soPhieuToiDa') {
        fieldValue = Math.max(1, parseInt(value) || 1).toString();
      }

      setFormData((prev) => ({
        ...prev,
        [name]: name === 'soPhieuToiDa' ? parseInt(fieldValue) : fieldValue,
      }));

      // Clear error when typing
      if (errors[fieldName]) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: '',
        }));
      }

      // Clear form error
      if (formError) {
        setFormError(null);
      }
    },
    [errors, formError],
  );

  // Validate form before submission
  const validateForm = useCallback(async (): Promise<boolean> => {
    const newErrors = {
      tenViTriUngCu: '',
      soPhieuToiDa: '',
      moTa: '',
    };

    let isValid = true;

    if (!formData.tenViTriUngCu.trim()) {
      newErrors.tenViTriUngCu = 'Vui lòng nhập tên vị trí ứng cử';
      isValid = false;
    } else if (checkDuplicateName) {
      // Check duplicate name using API
      setIsCheckingDuplicate(true);
      try {
        const isDuplicate = await checkDuplicateName(
          formData.tenViTriUngCu.trim(),
          initialData?.id,
        );

        if (isDuplicate) {
          newErrors.tenViTriUngCu =
            'Tên vị trí này đã tồn tại trong phiên bầu cử. Vui lòng chọn tên khác';
          isValid = false;
        }
      } catch (error) {
        console.error('Lỗi khi kiểm tra trùng tên:', error);
        setFormError('Không thể kiểm tra trùng tên. Vui lòng thử lại sau.');
        isValid = false;
      } finally {
        setIsCheckingDuplicate(false);
      }
    }

    if (!formData.soPhieuToiDa || formData.soPhieuToiDa < 1) {
      newErrors.soPhieuToiDa = 'Số phiếu tối đa phải lớn hơn 0';
      isValid = false;
    }

    setErrors(newErrors);
    setIsFormValid(isValid);
    return isValid;
  }, [formData, checkDuplicateName, initialData?.id]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateForm())) {
      return;
    }

    // Ensure phienBauCuId and cuocBauCuId are numbers
    const formDataWithIds = {
      ...formData,
      phienBauCuId: parseInt(phienBauCuId),
      cuocBauCuId:
        formData.cuocBauCuId ||
        (cuocBauCuId ? parseInt(cuocBauCuId) : parseInt(extractCuocBauCuIdFromUrl() || '1')),
    };

    // Pass the validated data to parent component
    onSave(formDataWithIds);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-${isMobile ? '4' : '6'}`}>
      <div className="space-y-4">
        {/* Form icon */}
        {!isMobile && (
          <div className="flex items-center justify-center mb-2">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <Award className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        )}

        {/* Form general error */}
        {formError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        {/* Form fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="tenViTriUngCu"
              className="text-gray-700 dark:text-gray-300 flex items-center"
            >
              Tên vị trí ứng cử <span className="text-red-500 ml-1">*</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={14} className="ml-1.5 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      Tên của vị trí mà ứng viên có thể ứng cử, ví dụ: Chủ tịch, Phó chủ tịch, Ủy
                      viên, v.v.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>

            <div className="relative">
              <Input
                id="tenViTriUngCu"
                name="tenViTriUngCu"
                value={formData.tenViTriUngCu}
                onChange={handleChange}
                onBlur={handleNameBlur}
                placeholder="Nhập tên vị trí ứng cử"
                className={`${errors.tenViTriUngCu ? 'border-red-500 focus:ring-red-500' : ''} ${isMobile ? 'h-10 text-base' : ''}`}
                disabled={isSubmitting || isCheckingDuplicate}
              />
              {isCheckingDuplicate && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader size={16} className="animate-spin text-amber-500" />
                </div>
              )}
            </div>

            {errors.tenViTriUngCu && (
              <div className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-start">
                <AlertTriangle size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                {errors.tenViTriUngCu}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="soPhieuToiDa"
              className="text-gray-700 dark:text-gray-300 flex items-center"
            >
              Số phiếu tối đa <span className="text-red-500 ml-1">*</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={14} className="ml-1.5 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      Số ứng viên tối đa có thể được bầu cho vị trí này trong phiên bầu cử.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>

            <Input
              type="number"
              id="soPhieuToiDa"
              name="soPhieuToiDa"
              value={formData.soPhieuToiDa}
              onChange={handleChange}
              min={1}
              placeholder="Nhập số phiếu tối đa"
              className={`${errors.soPhieuToiDa ? 'border-red-500 focus:ring-red-500' : ''} ${isMobile ? 'h-10 text-base' : ''}`}
              disabled={isSubmitting}
            />

            {errors.soPhieuToiDa && (
              <div className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-start">
                <AlertTriangle size={14} className="mr-1 mt-0.5 flex-shrink-0" />
                {errors.soPhieuToiDa}
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-start">
              <Info size={12} className="mr-1 mt-0.5 flex-shrink-0" />
              Số phiếu tối đa là số lượng ứng viên tối đa có thể được bầu cho vị trí này.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="moTa" className="text-gray-700 dark:text-gray-300 flex items-center">
              Mô tả
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={14} className="ml-1.5 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      Mô tả chi tiết về vị trí và trách nhiệm liên quan (tùy chọn).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>

            <Textarea
              id="moTa"
              name="moTa"
              value={formData.moTa}
              onChange={handleChange}
              placeholder="Nhập mô tả cho vị trí này"
              rows={isMobile ? 2 : 3}
              disabled={isSubmitting}
              className={isMobile ? 'text-base' : ''}
            />
          </div>
        </div>

        {/* Hidden fields */}
        <input type="hidden" name="phienBauCuId" value={formData.phienBauCuId} />
        <input type="hidden" name="cuocBauCuId" value={formData.cuocBauCuId} />
        {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}
      </div>

      {/* Form actions */}
      <div
        className={`flex ${isMobile ? 'flex-col-reverse space-y-reverse space-y-2' : 'justify-end space-x-3'} pt-3 border-t border-gray-200 dark:border-gray-700`}
      >
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting || isCheckingDuplicate}
          className={`${isMobile ? 'w-full' : ''} bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]`}
        >
          Hủy
        </Button>

        <Button
          type="submit"
          disabled={isSubmitting || isCheckingDuplicate || !isFormValid}
          className={`${isMobile ? 'w-full' : ''} bg-amber-600 hover:bg-amber-700 dark:bg-gradient-to-r dark:from-amber-600 dark:to-orange-600 text-white`}
        >
          {isSubmitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : isCheckingDuplicate ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Đang kiểm tra...
            </>
          ) : initialData?.id ? (
            'Cập nhật'
          ) : (
            'Thêm mới'
          )}
        </Button>
      </div>
    </form>
  );
};

export default ViTriUngCuForm;
