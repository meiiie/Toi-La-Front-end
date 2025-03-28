import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import SEO from '../components/SEO';
import { TaiKhoan } from '../store/types';
import ModalOTP from '../components/ModalOTP';
import { guiOtp, xacMinhOtp, resetTrangThai } from '../store/slice/maOTPSlice';
import { RootState, AppDispatch } from '../store/store';

const GuiOTPPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, randomCode } = useParams<{ username: string; randomCode: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const user = location.state?.user as TaiKhoan;
  const [selectedOption, setSelectedOption] = useState<string>('email');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const { dangTai, loi, xacMinhOtpThanhCong } = useSelector((state: RootState) => state.maOTP);

  useEffect(() => {
    if (xacMinhOtpThanhCong) {
      navigate(`/tim-tai-khoan/${username}/${randomCode}/tuy-chon/gui-otp/dat-lai-mat-khau`);
    }
  }, [xacMinhOtpThanhCong, navigate, username, randomCode]);

  useEffect(() => {
    return () => {
      dispatch(resetTrangThai());
    };
  }, [dispatch]);

  if (!user) {
    navigate('/tim-tai-khoan');
    return null;
  }

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };

  const handleContinue = () => {
    dispatch(guiOtp(user.email ?? ''));
    setIsModalOpen(true);
  };

  const handleVerifyOtp = (otp: string) => {
    dispatch(xacMinhOtp({ otp, email: user.email ?? '' }));
  };

  const handleResendOtp = () => {
    dispatch(guiOtp(user.email ?? ''));
  };

  const handleTryAnotherMethod = () => {
    dispatch(resetTrangThai());
    navigate(`/tim-tai-khoan/${username}/${randomCode}/tuy-chon`, { state: { user } });
  };

  const maskPhoneNumber = (phone: string | undefined) => {
    if (!phone) return 'Số điện thoại không hợp lệ';
    return phone.replace(/(\d{2})(\d+)(\d{3})/, '+$1*******$3');
  };

  const maskEmail = (email: string | undefined) => {
    if (!email || !email.includes('@')) return 'Email không hợp lệ';
    const [localPart, domain] = email.split('@');
    return `${localPart[0]}${localPart[1]}***@***${domain.slice(-1)}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <SEO
        title="Gửi OTP | Nền Tảng Bầu Cử Blockchain"
        description="Trang gửi OTP cho tài khoản của bạn trên hệ thống Bầu Cử Blockchain."
        keywords="đặt lại mật khẩu, bầu cử, blockchain, tài khoản"
        author="Nền Tảng Bầu Cử Blockchain"
        url={window.location.href}
        image={`${window.location.origin}/logo.png`}
      />
      <div className="w-full max-w-md p-6 bg-white border border-gray-200 rounded-lg shadow-md space-y-6">
        <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
          Đặt lại mật khẩu của bạn
        </h3>
        <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg flex items-center space-x-4">
          <img src={user.avatar} alt={user.tenDangNhap} className="w-16 h-16 rounded-full" />
          <div>
            <h4 className="text-lg font-semibold">{user.tenDangNhap}</h4>
            <p className="text-gray-600">{maskEmail(user.email ?? '')}</p>
          </div>
        </div>
        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="reset-option"
              value="sms"
              checked={selectedOption === 'sms'}
              onChange={handleOptionChange}
              className="form-radio"
            />
            <span>Gửi SMS đến {maskPhoneNumber(user.sdt ?? '')}</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="reset-option"
              value="email"
              checked={selectedOption === 'email'}
              onChange={handleOptionChange}
              className="form-radio"
            />
            <span>Gửi email đến {maskEmail(user.email ?? '')}</span>
          </label>
        </div>
        <button
          onClick={handleContinue}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-600 transition-colors duration-300"
          disabled={!selectedOption || dangTai}
        >
          Tiếp tục
        </button>
        <button
          onClick={handleTryAnotherMethod}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg w-full hover:bg-gray-600 transition-colors duration-300"
        >
          Thử Cách Khác
        </button>
        {loi && <p className="text-red-500">{loi}</p>}
      </div>

      <ModalOTP
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          dispatch(resetTrangThai());
        }}
        onVerify={handleVerifyOtp}
        email={user.email ?? ''}
        onResend={handleResendOtp}
        error={loi}
      />
    </div>
  );
};

export default GuiOTPPage;
