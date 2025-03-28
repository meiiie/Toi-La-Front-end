'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store/store';
import { searchTaiKhoans } from '../store/slice/nguoiDungSlice';
import type { TaoTaiKhoanTamThoi } from '../store/types';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import {
  User,
  Mail,
  Lock,
  Calendar,
  Phone,
  AlertCircle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Shield,
  Loader2,
  Server,
  Database,
} from 'lucide-react';

type Props = {
  onSave: (newAccount: TaoTaiKhoanTamThoi, recaptchaToken: string) => void;
};

export function NewAccountForm({ onSave }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<TaoTaiKhoanTamThoi>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  // Connect to Redux store to get registration state
  const dispatch = useDispatch<AppDispatch>();
  const { dangTai, loi } = useSelector((state: RootState) => state.dangKyTaiKhoan);

  // Local state
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [phone, setPhone] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Registration progress state
  const [registrationStage, setRegistrationStage] = useState<string | null>(null);
  const [registrationProgress, setRegistrationProgress] = useState(0);

  // Combined isSubmitting state (either form is submitting or API is processing)
  const isSubmitting = formSubmitting || dangTai;

  // Verify reCAPTCHA token on component mount for initialization
  useEffect(() => {
    const handleInitialRecaptcha = async () => {
      if (executeRecaptcha) {
        try {
          // Đợi một chút để đảm bảo DOM đã được render hoàn toàn
          setTimeout(async () => {
            try {
              // Tạo token reCAPTCHA khi component được tải
              console.log('reCAPTCHA initialized successfully');
            } catch (error) {
              console.error('reCAPTCHA initialization error:', error);
            }
          }, 1000);
        } catch (error) {
          console.error('reCAPTCHA initialization error:', error);
        }
      }
    };

    handleInitialRecaptcha();
  }, [executeRecaptcha]);

  // Hiệu ứng tiến trình đăng ký
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isSubmitting && (registrationStage || dangTai)) {
      // Bắt đầu từ 0% và tăng dần đến 95% trong khoảng 15 giây
      setRegistrationProgress(0);
      interval = setInterval(() => {
        setRegistrationProgress((prev) => {
          // Tăng nhanh đến 30%, sau đó chậm dần
          if (prev < 30) return prev + 1;
          if (prev < 60) return prev + 0.5;
          if (prev < 85) return prev + 0.2;
          if (prev < 95) return prev + 0.1;
          return prev;
        });
      }, 150); // Slower progress to account for 15s blockchain operations
    } else if (!isSubmitting) {
      setRegistrationProgress(0);
      setRegistrationStage(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSubmitting, registrationStage, dangTai]);

  // Handle errors from Redux store
  useEffect(() => {
    if (loi) {
      setError('apiError', {
        type: 'manual',
        message: loi,
      });
    } else {
      clearErrors('apiError');
    }
  }, [loi, setError, clearErrors]);

  const handleUsernameBlur = async (event: React.FocusEvent<HTMLInputElement>) => {
    const username = event.target.value;
    if (username) {
      setUsernameChecking(true);
      setUsernameAvailable(false);
      try {
        const exists = await dispatch(searchTaiKhoans({ tenDangNhap: username })).unwrap();
        if (exists.data.length > 0) {
          setError('tenDangNhap', {
            type: 'manual',
            message: 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên đăng nhập khác.',
          });
          setUsernameError('Tên đăng nhập đã tồn tại. Vui lòng chọn tên đăng nhập khác.');
        } else {
          clearErrors('tenDangNhap');
          setUsernameError(null);
          setUsernameAvailable(true);
        }
      } catch (error) {
        setError('tenDangNhap', {
          type: 'manual',
          message: 'Không thể kiểm tra tên đăng nhập. Vui lòng thử lại.',
        });
        setUsernameError('Không thể kiểm tra tên đăng nhập. Vui lòng thử lại.');
      } finally {
        setUsernameChecking(false);
      }
    }
  };

  const onSubmit = async (data: TaoTaiKhoanTamThoi) => {
    if (!agreeTerms) {
      setError('agreeTerms', {
        type: 'manual',
        message: 'Bạn phải đồng ý với Điều khoản sử dụng và Chính sách bảo mật.',
      });
      return;
    }

    // Chuyển đổi giới tính từ chuỗi sang số/boolean nếu cần
    if (data.gioiTinh) {
      // Đảm bảo gioiTinh được gửi đúng định dạng
      const gioiTinhValue = data.gioiTinh;
      if (gioiTinhValue === '0') {
        data.gioiTinh = false; // Nữ
      } else if (gioiTinhValue === '1') {
        data.gioiTinh = true; // Nam
      }
      // Giữ nguyên giá trị '2' cho "Khác" nếu cần
    }

    // Kiểm tra username một lần nữa trước khi submit
    const username = data.tenDangNhap;
    if (username) {
      setUsernameChecking(true);
      try {
        const exists = await dispatch(searchTaiKhoans({ tenDangNhap: username })).unwrap();
        if (exists.data.length > 0) {
          setError('tenDangNhap', {
            type: 'manual',
            message: 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên đăng nhập khác.',
          });
          setUsernameError('Tên đăng nhập đã tồn tại. Vui lòng chọn tên đăng nhập khác.');
          setUsernameChecking(false);
          return;
        } else {
          clearErrors('tenDangNhap');
          setUsernameError(null);
          setUsernameAvailable(true);
        }
      } catch (error) {
        setError('tenDangNhap', {
          type: 'manual',
          message: 'Không thể kiểm tra tên đăng nhập. Vui lòng thử lại.',
        });
        setUsernameError('Không thể kiểm tra tên đăng nhập. Vui lòng thử lại.');
        setUsernameChecking(false);
        return;
      }
      setUsernameChecking(false);
    }

    // Thực hiện reCAPTCHA
    if (!executeRecaptcha) {
      setError('recaptcha', {
        type: 'manual',
        message: 'Không thể thực hiện xác thực reCAPTCHA. Vui lòng thử lại sau.',
      });
      return;
    }

    try {
      // Hiển thị thông báo đang xác thực
      console.log('Đang thực hiện xác thực reCAPTCHA...');
      setRegistrationStage('recaptcha');

      // Thêm timeout để đảm bảo reCAPTCHA có đủ thời gian để khởi tạo
      setTimeout(async () => {
        try {
          // Sử dụng action 'register' để giúp phân biệt loại xác thực và tạo token mới
          const recaptchaToken = await executeRecaptcha('register');

          if (!recaptchaToken) {
            setError('recaptcha', {
              type: 'manual',
              message: 'Không thể xác minh reCAPTCHA, vui lòng thử lại',
            });
            setRegistrationStage(null);
            return;
          }

          console.log('reCAPTCHA token được tạo thành công');

          // Cập nhật trạng thái đăng ký
          setRegistrationStage('blockchain');

          // Gọi hàm đăng ký
          onSave(data, recaptchaToken);
        } catch (error) {
          console.error('reCAPTCHA error:', error);
          setError('recaptcha', {
            type: 'manual',
            message: 'Không thể thực hiện xác thực reCAPTCHA. Vui lòng thử lại sau.',
          });
          setRegistrationStage(null);
        }
      }, 500);
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      setError('recaptcha', {
        type: 'manual',
        message: 'Không thể thực hiện xác thực reCAPTCHA. Vui lòng thử lại sau.',
      });
      setRegistrationStage(null);
    }
  };

  // Hiển thị thông báo tiến trình đăng ký
  const renderRegistrationProgress = () => {
    if (!isSubmitting) return null;

    const stages = [
      {
        id: 'recaptcha',
        title: 'Xác thực bảo mật',
        description: 'Đang xác thực danh tính của bạn...',
        icon: <Shield className="h-5 w-5 text-blue-400" />,
      },
      {
        id: 'blockchain',
        title: 'Khởi tạo ví blockchain',
        description: 'Đang tạo ví blockchain và kết nối với mạng lưới...',
        icon: <Database className="h-5 w-5 text-blue-400" />,
      },
      {
        id: 'server',
        title: 'Xử lý dữ liệu',
        description: 'Đang lưu thông tin tài khoản và cấu hình ví...',
        icon: <Server className="h-5 w-5 text-blue-400" />,
      },
    ];

    // Determine current stage
    let currentStage = stages.find((stage) => stage.id === registrationStage);

    // If dangTai is true but no specific stage is set, default to blockchain
    if (dangTai && !currentStage) {
      currentStage = stages.find((stage) => stage.id === 'blockchain');
    }

    // If no stage is determined, use a default
    if (!currentStage) {
      currentStage = {
        id: 'processing',
        title: 'Đang xử lý',
        description: 'Vui lòng đợi trong giây lát...',
        icon: <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />,
      };
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 p-5 bg-[#0D1321]/80 backdrop-blur-md border border-[#334155]/70 rounded-lg"
      >
        <div className="flex items-center mb-3">
          <div className="relative h-10 w-10 mr-3 flex-shrink-0">
            <div className="absolute inset-0 rounded-full border-2 border-blue-400/30"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              {currentStage.icon || <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />}
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium">{currentStage.title}</h4>
            <p className="text-sm text-blue-200/70">{currentStage.description}</p>
          </div>
        </div>

        <div className="w-full h-2 bg-[#1E293B]/70 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            style={{ width: `${registrationProgress}%` }}
            initial={{ width: '0%' }}
            animate={{ width: `${registrationProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="mt-3 text-xs text-blue-200/70 flex items-start">
          <Info className="h-3 w-3 text-blue-400 mr-1 mt-0.5 flex-shrink-0" />
          <span>
            Quá trình đăng ký có thể mất từ 15-30 giây do cần tương tác với blockchain. Vui lòng
            không đóng trang này.
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="col-span-1 h-1.5 bg-[#1E293B]/70 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-400/50"
              animate={{
                width: ['0%', '100%', '0%'],
                x: [0, 0, '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
              }}
            />
          </div>
          <div className="col-span-2 h-1.5 bg-[#1E293B]/70 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-400/50"
              animate={{
                width: ['0%', '100%', '0%'],
                x: [0, 0, '100%'],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'linear',
                delay: 0.5,
              }}
            />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* Hiển thị tiến trình đăng ký */}
        <AnimatePresence>{renderRegistrationProgress()}</AnimatePresence>

        {/* API Error message */}
        {errors.apiError && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-800/30 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mr-3" />
            <p className="text-sm text-red-300">{errors.apiError.message}</p>
          </div>
        )}

        {/* Form content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Họ */}
          <div className="space-y-2">
            <label htmlFor="ho" className="text-sm font-medium text-blue-100 flex items-center">
              <User className="h-4 w-4 mr-2 text-blue-400" /> Họ
            </label>
            <div className="relative">
              <input
                type="text"
                id="ho"
                {...register('ho', { required: 'Bạn phải nhập họ' })}
                className="w-full bg-[#162A45]/50 border border-[#2A3A5A] focus:border-[#0288D1] rounded-lg py-2 px-3 text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-[#0288D1]/30 transition-colors duration-200"
                placeholder="Nhập họ của bạn"
                disabled={isSubmitting}
              />
            </div>
            {errors.ho && (
              <div className="flex items-start text-red-400 text-xs mt-1">
                <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                <span>{errors.ho.message}</span>
              </div>
            )}
          </div>

          {/* Tên */}
          <div className="space-y-2">
            <label htmlFor="ten" className="text-sm font-medium text-blue-100 flex items-center">
              <User className="h-4 w-4 mr-2 text-blue-400" /> Tên
            </label>
            <div className="relative">
              <input
                type="text"
                id="ten"
                {...register('ten', { required: 'Bạn phải nhập tên' })}
                className="w-full bg-[#162A45]/50 border border-[#2A3A5A] focus:border-[#0288D1] rounded-lg py-2 px-3 text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-[#0288D1]/30 transition-colors duration-200"
                placeholder="Nhập tên của bạn"
                disabled={isSubmitting}
              />
            </div>
            {errors.ten && (
              <div className="flex items-start text-red-400 text-xs mt-1">
                <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                <span>{errors.ten.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="mt-6 space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-blue-100 flex items-center">
            <Mail className="h-4 w-4 mr-2 text-blue-400" /> Email
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              {...register('email', {
                required: 'Bạn phải nhập email',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                  message: 'Định dạng email không hợp lệ',
                },
              })}
              className="w-full bg-[#162A45]/50 border border-[#2A3A5A] focus:border-[#0288D1] rounded-lg py-2 px-3 text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-[#0288D1]/30 transition-colors duration-200"
              placeholder="example@domain.com"
              disabled={isSubmitting}
            />
          </div>
          {errors.email && (
            <div className="flex items-start text-red-400 text-xs mt-1">
              <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
              <span>{errors.email.message}</span>
            </div>
          )}
        </div>

        {/* Số điện thoại */}
        <div className="mt-6 space-y-2">
          <label htmlFor="sdt" className="text-sm font-medium text-blue-100 flex items-center">
            <Phone className="h-4 w-4 mr-2 text-blue-400" /> Số điện thoại
          </label>
          <div className="relative">
            <PhoneInput
              defaultCountry="vn"
              value={phone}
              onChange={(phone) => {
                setPhone(phone);
                setValue('sdt', phone);
              }}
              inputStyle={{
                width: '100%',
                height: '40px',
                fontSize: '16px',
                backgroundColor: 'rgba(22, 42, 69, 0.5)',
                color: 'white',
                border: '1px solid #2A3A5A',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.75rem',
              }}
              className="phone-input-container"
              disabled={isSubmitting}
            />
          </div>
          {errors.sdt && (
            <div className="flex items-start text-red-400 text-xs mt-1">
              <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
              <span>{errors.sdt.message}</span>
            </div>
          )}
        </div>

        {/* Ngày sinh */}
        <div className="mt-6 space-y-2">
          <label htmlFor="ngaySinh" className="text-sm font-medium text-blue-100 flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-blue-400" /> Ngày sinh
          </label>
          <div className="relative">
            <input
              type="date"
              id="ngaySinh"
              {...register('ngaySinh', { required: 'Bạn phải nhập ngày sinh' })}
              className="w-full bg-[#162A45]/50 border border-[#2A3A5A] focus:border-[#0288D1] rounded-lg py-2 px-3 text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-[#0288D1]/30 transition-colors duration-200"
              disabled={isSubmitting}
            />
          </div>
          {errors.ngaySinh && (
            <div className="flex items-start text-red-400 text-xs mt-1">
              <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
              <span>{errors.ngaySinh.message}</span>
            </div>
          )}
        </div>

        {/* Tên đăng nhập */}
        <div className="mt-6 space-y-2">
          <label
            htmlFor="tenDangNhap"
            className="text-sm font-medium text-blue-100 flex items-center"
          >
            <User className="h-4 w-4 mr-2 text-blue-400" /> Tên đăng nhập
          </label>
          <div className="relative">
            <input
              type="text"
              id="tenDangNhap"
              {...register('tenDangNhap', {
                required: 'Bạn phải nhập tên đăng nhập',
                minLength: {
                  value: 4,
                  message: 'Tên đăng nhập phải có ít nhất 4 ký tự',
                },
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới',
                },
              })}
              className="w-full bg-[#162A45]/50 border border-[#2A3A5A] focus:border-[#0288D1] rounded-lg py-2 px-3 text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-[#0288D1]/30 transition-colors duration-200"
              placeholder="Nhập tên đăng nhập"
              onBlur={handleUsernameBlur}
              disabled={isSubmitting}
            />
          </div>
          {usernameChecking && (
            <div className="flex items-center text-blue-400 text-xs mt-1">
              <div className="animate-spin h-3 w-3 mr-1 border-2 border-blue-400 border-t-transparent rounded-full"></div>
              <span>Đang kiểm tra...</span>
            </div>
          )}
          {usernameError ? (
            <div className="flex items-start text-red-400 text-xs mt-1">
              <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
              <span>{usernameError}</span>
            </div>
          ) : (
            errors.tenDangNhap && (
              <div className="flex items-start text-red-400 text-xs mt-1">
                <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                <span>{errors.tenDangNhap.message}</span>
              </div>
            )
          )}
          {!usernameError && !usernameChecking && usernameAvailable && (
            <div className="flex items-center text-green-400 text-xs mt-1">
              <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>Tên đăng nhập khả dụng</span>
            </div>
          )}
        </div>

        {/* Mật khẩu */}
        <div className="mt-6 space-y-2">
          <label htmlFor="matKhau" className="text-sm font-medium text-blue-100 flex items-center">
            <Lock className="h-4 w-4 mr-2 text-blue-400" /> Mật khẩu
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="matKhau"
              {...register('matKhau', {
                required: 'Bạn phải nhập mật khẩu',
                pattern: {
                  value: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message:
                    'Mật khẩu phải có ít nhất 8 ký tự, bao gồm 1 ký tự viết hoa, 1 ký tự số và 1 ký tự đặc biệt',
                },
              })}
              className="w-full bg-[#162A45]/50 border border-[#2A3A5A] focus:border-[#0288D1] rounded-lg py-2 px-3 text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-[#0288D1]/30 transition-colors duration-200 pr-10"
              placeholder="Nhập mật khẩu"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-blue-100 transition-colors duration-200"
              disabled={isSubmitting}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.matKhau && (
            <div className="flex items-start text-red-400 text-xs mt-1">
              <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
              <span>{errors.matKhau.message}</span>
            </div>
          )}
          <div className="flex items-start text-blue-300 text-xs mt-1">
            <Info className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
            <span>
              Mật khẩu phải có ít nhất 8 ký tự, bao gồm 1 ký tự viết hoa, 1 ký tự số và 1 ký tự đặc
              biệt
            </span>
          </div>
        </div>

        {/* Xác nhận mật khẩu */}
        <div className="mt-6 space-y-2">
          <label
            htmlFor="xacNhanMatKhau"
            className="text-sm font-medium text-blue-100 flex items-center"
          >
            <Lock className="h-4 w-4 mr-2 text-blue-400" /> Xác nhận mật khẩu
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="xacNhanMatKhau"
              {...register('xacNhanMatKhau', {
                required: 'Bạn phải xác nhận mật khẩu',
                validate: (value) =>
                  value === watch('matKhau') || 'Mật khẩu và xác nhận mật khẩu không khớp',
              })}
              className="w-full bg-[#162A45]/50 border border-[#2A3A5A] focus:border-[#0288D1] rounded-lg py-2 px-3 text-white placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-[#0288D1]/30 transition-colors duration-200 pr-10"
              placeholder="Xác nhận mật khẩu"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-blue-100 transition-colors duration-200"
              disabled={isSubmitting}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.xacNhanMatKhau && (
            <div className="flex items-start text-red-400 text-xs mt-1">
              <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
              <span>{errors.xacNhanMatKhau.message}</span>
            </div>
          )}
        </div>

        {/* reCAPTCHA notice */}
        <div className="mt-6 p-3 bg-[#162A45]/70 border border-[#2A3A5A] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-200">Xác thực bảo mật</span>
            </div>
          </div>
          <div className="border-t border-[#2A3A5A] pt-2 mt-2">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 mt-0.5">
                <Info className="h-3 w-3 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-blue-200/70">
                  Trang này được bảo vệ bởi reCAPTCHA và tuân theo
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 mx-1"
                  >
                    Chính sách Bảo mật
                  </a>
                  và
                  <a
                    href="https://policies.google.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 ml-1"
                  >
                    Điều khoản Dịch vụ
                  </a>
                  của Google.
                </p>
              </div>
            </div>
          </div>
          {errors.recaptcha && (
            <div className="flex items-start text-red-400 text-xs mt-2">
              <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
              <span>{errors.recaptcha.message}</span>
            </div>
          )}
        </div>

        {/* Điều khoản */}
        <div className="mt-6">
          <label className="flex items-start space-x-2 text-blue-100">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (e.target.checked) {
                  clearErrors('agreeTerms');
                }
              }}
              className="h-4 w-4 mt-0.5 text-[#0288D1] focus:ring-[#0288D1]/30 border-[#2A3A5A] bg-[#162A45]/50 rounded"
              disabled={isSubmitting}
            />
            <span className="text-sm">
              Tôi đồng ý với{' '}
              <a
                href="/dieu-khoan-su-dung"
                className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                target="_blank"
                rel="noreferrer"
              >
                Điều khoản sử dụng
              </a>{' '}
              và{' '}
              <a
                href="/chinh-sach-bao-mat"
                className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                target="_blank"
                rel="noreferrer"
              >
                Chính sách bảo mật
              </a>
            </span>
          </label>
          {errors.agreeTerms && (
            <div className="flex items-start text-red-400 text-xs mt-1">
              <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
              <span>{errors.agreeTerms.message}</span>
            </div>
          )}
        </div>

        {/* Container rõ ràng cho reCAPTCHA */}
        <div id="recaptcha-container" className="mt-4 h-[60px] relative z-50"></div>

        {/* Submit button */}
        <motion.button
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className={`w-full mt-8 ${
            isSubmitting
              ? 'bg-gradient-to-r from-[#0288D1]/70 to-[#6A1B9A]/70'
              : 'bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] hover:shadow-[0_0_15px_rgba(2,136,209,0.5)]'
          } text-white font-medium py-3 px-4 rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
              Đang đăng ký...
            </>
          ) : (
            'Đăng ký tài khoản'
          )}
        </motion.button>
      </motion.form>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Custom styles for the phone input */
        .phone-input-container {
          width: 100%;
        }

        .phone-input-container :global(.react-international-phone-input-container) {
          border: none;
        }

        .phone-input-container :global(.react-international-phone-country-selector-button) {
          background-color: rgba(22, 42, 69, 0.8);
          border: 1px solid #2a3a5a;
          border-right: none;
          border-top-left-radius: 0.5rem;
          border-bottom-left-radius: 0.5rem;
        }

        .phone-input-container :global(.react-international-phone-country-selector-dropdown) {
          background-color: #1e293b;
          color: white;
          border: 1px solid #2a3a5a;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .phone-input-container :global(.react-international-phone-country-selector-dropdown-item) {
          color: white;
        }

        .phone-input-container
          :global(.react-international-phone-country-selector-dropdown-item:hover) {
          background-color: rgba(2, 136, 209, 0.2);
        }
      `,
        }}
      />
    </>
  );
}
