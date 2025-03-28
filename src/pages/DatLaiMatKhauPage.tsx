import { useState, useEffect } from 'react';
import { useForm, FieldError } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Label } from '../components/ui/Label';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { FaExclamationCircle } from 'react-icons/fa';
import SEO from '../components/SEO';
import { RootState, AppDispatch } from '../store/store';
import { datLaiMatKhau, resetTrangThai } from '../store/slice/datLaiMatKhauSlice';
import { TaiKhoan } from '../store/types';
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

export default function DatLaiMatKhauPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const user =
    (location.state?.user as TaiKhoan) || JSON.parse(localStorage.getItem('user') || '{}');
  const { dangTai, thanhCong, loi } = useSelector((state: RootState) => state.datLaiMatKhau);

  useEffect(() => {
    if (!user || !user.id) {
      alert('Không tìm thấy thông tin người dùng. Vui lòng thử lại.');
      navigate('/tim-tai-khoan');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (thanhCong) {
      setDialogMessage('Đặt lại mật khẩu thành công');
      setIsSuccess(true);
      setDialogOpen(true);
      dispatch(resetTrangThai());
    } else if (loi) {
      setDialogMessage(loi);
      setIsSuccess(false);
      setDialogOpen(true);
    }
  }, [thanhCong, loi, dispatch]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ matKhau: string; xacNhanMatKhau: string }>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  const onSubmit = (data: { matKhau: string; xacNhanMatKhau: string }) => {
    if (user?.id) {
      dispatch(datLaiMatKhau({ id: user.id.toString(), newPassword: data.matKhau }));
    }
  };

  const labelStyle = 'mb-1 font-semibold text-gray-700 dark:text-gray-300 flex items-center';
  const inputStyle =
    'form-input w-full p-3 border rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-700 dark:text-gray-300';
  const errorStyle = 'text-red-500 text-xs mt-1 flex items-center';

  function getEditorStyle(fieldError: FieldError | (FieldError | undefined)[] | undefined) {
    if (Array.isArray(fieldError)) {
      return fieldError.some((error) => error) ? 'border-red-500' : '';
    }
    return fieldError ? 'border-red-500' : '';
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-700 to-purple-800 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <SEO
        title="Đặt lại mật khẩu | Nền Tảng Bầu Cử Blockchain"
        description="Trang đặt lại mật khẩu cho tài khoản của bạn trên hệ thống Bầu Cử Blockchain."
        keywords="đặt lại mật khẩu, bầu cử, blockchain, tài khoản"
        author="Nền Tảng Bầu Cử Blockchain"
        url={window.location.href}
        image={`${window.location.origin}/logo.png`}
      />
      <Card className="w-full max-w-md bg-white shadow-lg rounded-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-gray-800">Đặt lại mật khẩu</CardTitle>
          <CardDescription className="text-gray-600">
            Tạo mật khẩu mới cho tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className={labelStyle}>
                  Mật khẩu mới <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới"
                    {...register('matKhau', {
                      required: 'Bạn phải nhập mật khẩu',
                      pattern: {
                        value: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                        message:
                          'Mật khẩu phải có ít nhất 8 ký tự, bao gồm 1 ký tự viết hoa, 1 ký tự số và 1 ký tự đặc biệt',
                      },
                    })}
                    className={`${inputStyle} ${getEditorStyle(errors.matKhau)}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  {errors.matKhau && (
                    <div className={errorStyle}>
                      <FaExclamationCircle className="h-4 w-4 mr-1" />
                      <small>{errors.matKhau.message}</small>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className={labelStyle}>
                  Xác nhận mật khẩu mới <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Xác nhận mật khẩu mới"
                  {...register('xacNhanMatKhau', {
                    required: 'Bạn phải xác nhận mật khẩu',
                    validate: (value) =>
                      value === watch('matKhau') || 'Mật khẩu và xác nhận mật khẩu không khớp',
                  })}
                  className={`${inputStyle} ${getEditorStyle(errors.xacNhanMatKhau)}`}
                />
                {errors.xacNhanMatKhau && (
                  <div className={errorStyle}>
                    <FaExclamationCircle className="h-4 w-4 mr-1" />
                    <small>{errors.xacNhanMatKhau.message}</small>
                  </div>
                )}
              </div>
            </div>
            <Button
              type="submit"
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-300"
              disabled={dangTai}
            >
              Đặt lại mật khẩu
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center ">
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive ? 'text-sm text-blue-600 underline' : 'text-sm text-blue-600 hover:underline'
            }
          >
            Quay lại đăng nhập
          </NavLink>
        </CardFooter>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thông báo</AlertDialogTitle>
            <AlertDialogDescription>{dialogMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {isSuccess ? (
              <>
                <AlertDialogAction onClick={() => navigate('/login')}>Đăng nhập</AlertDialogAction>
                <AlertDialogCancel onClick={() => setDialogOpen(false)}>Đóng</AlertDialogCancel>
              </>
            ) : (
              <AlertDialogCancel onClick={() => setDialogOpen(false)}>Đóng</AlertDialogCancel>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
