import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchViTriUngCuByPhienBauCuId } from '../store/slice/viTriUngCuSlice';
import {
  checkAccountIsCandidateStatus,
  registerCandidateFromAccount,
  registerCandidateWithVoter,
} from '../store/slice/ungCuVienSlice';
import { UngCuVien, UngVienRegistrationDTO } from '../store/types';
import {
  Info,
  Loader,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  User,
  Mail,
  Phone,
} from 'lucide-react';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';

interface IntegratedCandidateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: UngCuVien | null;
  phienBauCuId: string;
  cuocBauCuId?: string;
  taiKhoanId?: number;
}

const IntegratedCandidateForm: React.FC<IntegratedCandidateFormProps> = ({
  onSuccess,
  onCancel,
  initialData,
  phienBauCuId,
  cuocBauCuId,
  taiKhoanId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<'basic' | 'voter'>('basic');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isCandidate, setIsCandidate] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Lấy thông tin về vị trí ứng cử từ Redux store
  const viTriList = useSelector((state: RootState) => state.viTriUngCu.cacViTriUngCu);
  const loadingPositions = useSelector((state: RootState) => state.viTriUngCu.dangTai);

  // Lấy thông tin về người dùng hiện tại từ Redux store
  const currentUser = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);
  const accountId = taiKhoanId || currentUser?.id;

  // Form cho thông tin cơ bản của ứng viên
  const {
    register: registerBasic,
    handleSubmit: handleSubmitBasic,
    formState: { errors: errorsBasic },
    setValue: setValueBasic,
    watch: watchBasic,
    reset: resetBasic,
  } = useForm<UngCuVien>({
    defaultValues: {
      id: initialData?.id || 0,
      hoTen: initialData?.hoTen || currentUser?.tenHienThi || '',
      moTa: initialData?.moTa || '',
      viTriUngCuId: initialData?.viTriUngCuId || undefined,
      anh: initialData?.anh || '',
      cuocBauCuId: initialData?.cuocBauCuId || (cuocBauCuId ? parseInt(cuocBauCuId) : undefined),
      phienBauCuId:
        initialData?.phienBauCuId || (phienBauCuId ? parseInt(phienBauCuId) : undefined),
      taiKhoanId: initialData?.taiKhoanId || accountId,
    },
  });

  // Form cho thông tin cử tri
  const {
    register: registerVoter,
    handleSubmit: handleSubmitVoter,
    formState: { errors: errorsVoter },
    reset: resetVoter,
  } = useForm<{ email: string; sdt: string }>({
    defaultValues: {
      email: '',
      sdt: '',
    },
  });

  // Fetch danh sách vị trí ứng cử khi component mount
  useEffect(() => {
    if (phienBauCuId) {
      dispatch(fetchViTriUngCuByPhienBauCuId(parseInt(phienBauCuId)));
    }
  }, [dispatch, phienBauCuId]);

  // Kiểm tra xem tài khoản đã đăng ký làm ứng viên chưa
  useEffect(() => {
    const checkCandidateStatus = async () => {
      if (accountId && phienBauCuId) {
        setIsChecking(true);
        try {
          const resultAction = await dispatch(
            checkAccountIsCandidateStatus({
              taiKhoanId: accountId,
              phienBauCuId: parseInt(phienBauCuId),
            }),
          );
          if (checkAccountIsCandidateStatus.fulfilled.match(resultAction)) {
            setIsCandidate(resultAction.payload.isCandidate);
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra trạng thái ứng viên:', error);
          setFormError('Không thể kiểm tra trạng thái ứng viên. Vui lòng thử lại sau.');
        } finally {
          setIsChecking(false);
        }
      }
    };

    checkCandidateStatus();
  }, [dispatch, accountId, phienBauCuId]);

  // Reset form khi initialData thay đổi
  useEffect(() => {
    if (initialData) {
      resetBasic({
        id: initialData.id,
        hoTen: initialData.hoTen || '',
        moTa: initialData.moTa || '',
        viTriUngCuId: initialData.viTriUngCuId,
        anh: initialData.anh || '',
        cuocBauCuId: initialData.cuocBauCuId || (cuocBauCuId ? parseInt(cuocBauCuId) : undefined),
        phienBauCuId:
          initialData.phienBauCuId || (phienBauCuId ? parseInt(phienBauCuId) : undefined),
        taiKhoanId: initialData.taiKhoanId || accountId,
      });
    }
  }, [initialData, resetBasic, cuocBauCuId, phienBauCuId, accountId]);

  // Xử lý khi submit form thông tin cơ bản
  const onSubmitBasic = (data: UngCuVien) => {
    // Nếu đã là ứng viên, không cần thông tin cử tri
    if (isCandidate) {
      handleSaveCandidate(data);
    } else {
      // Chuyển sang tab thông tin cử tri
      setActiveTab('voter');
    }
  };

  // Xử lý khi submit form thông tin cử tri
  const onSubmitVoter = async (voterData: { email: string; sdt: string }) => {
    const basicData = watchBasic();

    // Tạo dữ liệu đăng ký ứng viên kèm cử tri
    if (!basicData.cuocBauCuId && !cuocBauCuId) {
      throw new Error('Cuộc bầu cử ID is required');
    }

    const registrationData: UngVienRegistrationDTO = {
      hoTen: basicData.hoTen,
      moTa: basicData.moTa,
      viTriUngCuId: Number(basicData.viTriUngCuId),
      cuocBauCuId: basicData.cuocBauCuId || parseInt(cuocBauCuId!),
      phienBauCuId: basicData.phienBauCuId || (phienBauCuId ? parseInt(phienBauCuId) : undefined),
      taiKhoanId: basicData.taiKhoanId || accountId,
      email: voterData.email,
      sdt: voterData.sdt,
    };

    // Nếu có ảnh, thêm vào dữ liệu
    if (basicData.anh) {
      registrationData.anh = basicData.anh;
    }

    handleRegisterWithVoter(registrationData);
  };

  // Đăng ký ứng viên kèm thông tin cử tri
  const handleRegisterWithVoter = async (data: UngVienRegistrationDTO) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      await dispatch(registerCandidateWithVoter(data)).unwrap();
      setSuccessMessage(
        'Đăng ký ứng viên thành công! Bạn đã được đăng ký làm ứng viên cùng với thông tin cử tri.',
      );

      // Thông báo thành công và đợi 2 giây trước khi đóng form
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Lỗi khi đăng ký ứng viên:', error);
      setFormError('Không thể đăng ký ứng viên. Vui lòng kiểm tra lại thông tin và thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lưu thông tin ứng viên (khi đã là cử tri)
  const handleSaveCandidate = async (data: UngCuVien) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      // Đảm bảo các ID là số
      if (data.viTriUngCuId) data.viTriUngCuId = Number(data.viTriUngCuId);
      if (data.phienBauCuId) data.phienBauCuId = Number(data.phienBauCuId);
      if (data.cuocBauCuId) data.cuocBauCuId = Number(data.cuocBauCuId);

      // Cần đảm bảo có phienBauCuId và cuocBauCuId
      if (!data.phienBauCuId && phienBauCuId) {
        data.phienBauCuId = parseInt(phienBauCuId);
      }

      if (!data.cuocBauCuId && cuocBauCuId) {
        data.cuocBauCuId = parseInt(cuocBauCuId);
      }

      // Sử dụng API registerCandidateFromAccount vì đã là cử tri
      await dispatch(registerCandidateFromAccount(data)).unwrap();
      setSuccessMessage('Đăng ký ứng viên thành công!');

      // Thông báo thành công và đợi 2 giây trước khi đóng form
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Lỗi khi lưu ứng viên:', error);
      setFormError('Không thể lưu thông tin ứng viên. Vui lòng kiểm tra lại dữ liệu và thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hiển thị loading khi đang kiểm tra trạng thái ứng viên
  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader size={40} className="animate-spin text-blue-500 dark:text-blue-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-300">Đang kiểm tra trạng thái ứng viên...</p>
      </div>
    );
  }

  // Hiển thị thông báo nếu đã là ứng viên
  if (isCandidate) {
    return (
      <div className="p-6">
        <Alert
          variant="default"
          className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30"
        >
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <AlertTitle>Bạn đã đăng ký làm ứng viên</AlertTitle>
          <AlertDescription>
            Bạn đã đăng ký làm ứng viên trong phiên bầu cử này. Bạn có thể cập nhật thông tin của
            mình.
          </AlertDescription>
        </Alert>

        {/* Form cập nhật thông tin ứng viên */}
        <form onSubmit={handleSubmitBasic(onSubmitBasic)} className="space-y-6">
          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Thành công</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hoTen" className="text-gray-700 dark:text-gray-300">
                Họ và tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="hoTen"
                placeholder="Nhập họ tên ứng viên"
                className={errorsBasic.hoTen ? 'border-red-500 focus:ring-red-500' : ''}
                {...registerBasic('hoTen', {
                  required: 'Vui lòng nhập họ tên ứng viên',
                  minLength: { value: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
                })}
              />
              {errorsBasic.hoTen && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errorsBasic.hoTen.message}
                </p>
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
                  onValueChange={(value) => setValueBasic('viTriUngCuId', parseInt(value))}
                  defaultValue={initialData?.viTriUngCuId?.toString()}
                >
                  <SelectTrigger
                    className={errorsBasic.viTriUngCuId ? 'border-red-500 focus:ring-red-500' : ''}
                  >
                    <SelectValue placeholder="-- Chọn vị trí ứng cử --" />
                  </SelectTrigger>
                  <SelectContent>
                    {viTriList && viTriList.length > 0 ? (
                      viTriList.map((position) => (
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

              {errorsBasic.viTriUngCuId && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errorsBasic.viTriUngCuId.message}
                </p>
              )}

              {(!viTriList || viTriList.length === 0) && !loadingPositions && (
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
                className={errorsBasic.moTa ? 'border-red-500 focus:ring-red-500' : ''}
                {...registerBasic('moTa', {
                  required: 'Vui lòng nhập mô tả ứng viên',
                  minLength: { value: 10, message: 'Mô tả phải có ít nhất 10 ký tự' },
                })}
              />
              {errorsBasic.moTa && (
                <p className="text-sm text-red-600 dark:text-red-400">{errorsBasic.moTa.message}</p>
              )}
            </div>

            {/* Hidden fields */}
            <input type="hidden" {...registerBasic('cuocBauCuId')} />
            <input type="hidden" {...registerBasic('phienBauCuId')} />
            <input type="hidden" {...registerBasic('id')} />
            <input type="hidden" {...registerBasic('anh')} />
            <input type="hidden" {...registerBasic('taiKhoanId')} />
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
      </div>
    );
  }

  // Hiển thị tabs cho người dùng chưa đăng ký làm ứng viên
  return (
    <div className="p-6">
      <Alert
        variant="default"
        className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30"
      >
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <AlertTitle>Đăng ký ứng viên</AlertTitle>
        <AlertDescription>
          Để đăng ký làm ứng viên, bạn cần cung cấp thông tin cử tri. Vui lòng điền đầy đủ các
          trường thông tin bên dưới.
        </AlertDescription>
      </Alert>

      {formError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Thành công</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'basic' | 'voter')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Thông tin ứng viên</span>
          </TabsTrigger>
          <TabsTrigger value="voter" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Thông tin cử tri</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <form onSubmit={handleSubmitBasic(onSubmitBasic)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hoTen" className="text-gray-700 dark:text-gray-300">
                  Họ và tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="hoTen"
                  placeholder="Nhập họ tên ứng viên"
                  className={errorsBasic.hoTen ? 'border-red-500 focus:ring-red-500' : ''}
                  {...registerBasic('hoTen', {
                    required: 'Vui lòng nhập họ tên ứng viên',
                    minLength: { value: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
                  })}
                />
                {errorsBasic.hoTen && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errorsBasic.hoTen.message}
                  </p>
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
                    onValueChange={(value) => setValueBasic('viTriUngCuId', parseInt(value))}
                    defaultValue={initialData?.viTriUngCuId?.toString()}
                  >
                    <SelectTrigger
                      className={
                        errorsBasic.viTriUngCuId ? 'border-red-500 focus:ring-red-500' : ''
                      }
                    >
                      <SelectValue placeholder="-- Chọn vị trí ứng cử --" />
                    </SelectTrigger>
                    <SelectContent>
                      {viTriList && viTriList.length > 0 ? (
                        viTriList.map((position) => (
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

                {errorsBasic.viTriUngCuId && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errorsBasic.viTriUngCuId.message}
                  </p>
                )}

                {(!viTriList || viTriList.length === 0) && !loadingPositions && (
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
                  className={errorsBasic.moTa ? 'border-red-500 focus:ring-red-500' : ''}
                  {...registerBasic('moTa', {
                    required: 'Vui lòng nhập mô tả ứng viên',
                    minLength: { value: 10, message: 'Mô tả phải có ít nhất 10 ký tự' },
                  })}
                />
                {errorsBasic.moTa && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errorsBasic.moTa.message}
                  </p>
                )}
              </div>

              {/* Hidden fields */}
              <input type="hidden" {...registerBasic('cuocBauCuId')} />
              <input type="hidden" {...registerBasic('phienBauCuId')} />
              <input type="hidden" {...registerBasic('id')} />
              <input type="hidden" {...registerBasic('anh')} />
              <input type="hidden" {...registerBasic('taiKhoanId')} />
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
                Tiếp tục
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="voter">
          <form onSubmit={handleSubmitVoter(onSubmitVoter)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-gray-700 dark:text-gray-300 flex items-center"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Nhập địa chỉ email"
                  className={errorsVoter.email ? 'border-red-500 focus:ring-red-500' : ''}
                  {...registerVoter('email', {
                    required: 'Vui lòng nhập địa chỉ email',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Địa chỉ email không hợp lệ',
                    },
                  })}
                />
                {errorsVoter.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errorsVoter.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sdt" className="text-gray-700 dark:text-gray-300 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Số điện thoại <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sdt"
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  className={errorsVoter.sdt ? 'border-red-500 focus:ring-red-500' : ''}
                  {...registerVoter('sdt', {
                    required: 'Vui lòng nhập số điện thoại',
                    pattern: {
                      value: /^[0-9]{10,11}$/,
                      message: 'Số điện thoại không hợp lệ',
                    },
                  })}
                />
                {errorsVoter.sdt && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errorsVoter.sdt.message}
                  </p>
                )}
              </div>
            </div>

            <Alert className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50">
              <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-400">Lưu ý</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                Thông tin cử tri này sẽ được sử dụng để đăng ký bạn làm cử tri trong phiên bầu cử.
                Vui lòng kiểm tra kỹ thông tin trước khi gửi.
              </AlertDescription>
            </Alert>

            {/* Form actions */}
            <div className="flex justify-between gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('basic')}
                className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]"
              >
                Quay lại
              </Button>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="mr-2 bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Đang đăng ký...
                    </>
                  ) : (
                    'Đăng ký ứng viên'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegratedCandidateForm;
