import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { TaiKhoan } from '../store/types';

const TuyChonTaiKhoanPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, randomCode } = useParams<{ username: string; randomCode: string }>();
  const user = location.state?.user as TaiKhoan;
  const [selectedOption, setSelectedOption] = useState<string>('');

  if (!user) {
    navigate('/tim-tai-khoan');
    return null;
  }

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };

  const handleContinue = () => {
    if (selectedOption === 'login') {
      navigate('/login', { state: { user } });
    } else if (selectedOption === 'reset-password') {
      localStorage.setItem('user', JSON.stringify(user));
      navigate(`/tim-tai-khoan/${username}/${randomCode}/tuy-chon/gui-otp`, { state: { user } });
    }
  };

  const handleNotYou = () => {
    navigate('/tim-tai-khoan');
  };

  const maskPhoneNumber = (phone: string | undefined) => {
    if (!phone) return 'Số điện thoại không hợp lệ'; // Trả về thông báo lỗi nếu phone là undefined
    return phone.replace(/(\d{2})(\d+)(\d{3})/, '+$1*******$3');
  };

  const maskEmail = (email: string | undefined) => {
    if (!email || !email.includes('@')) return 'Email không hợp lệ';
    const [localPart, domain] = email.split('@');
    return `${localPart[0]}${localPart[1]}***@***${domain.slice(-1)}`;
  };

  return (
    <>
      <SEO
        title="Tùy chọn tài khoản | Nền Tảng Bầu Cử Blockchain"
        description="Trang tùy chọn tài khoản của bạn trên hệ thống Bầu Cử Blockchain."
        keywords="Bầu cử, Blockchain, Tùy chọn tài khoản, Đăng nhập, Đặt lại mật khẩu"
        author="Nền Tảng Bầu Cử Blockchain"
        url={window.location.href}
        image={`${window.location.origin}/logo.png`}
      />
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <div className="w-full max-w-md p-6 bg-white border border-gray-200 rounded-lg shadow-md space-y-6">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Tùy chọn tài khoản</h3>
          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg flex items-center space-x-4">
            <img src={user.avatar} alt={user.tenDangNhap} className="w-16 h-16 rounded-full" />
            <div>
              <h4 className="text-lg font-semibold">{user.tenDangNhap}</h4>
              <p className="text-gray-600">{maskEmail(user.email)}</p>
              <p className="text-gray-600">{maskPhoneNumber(user.sdt)}</p>
            </div>
          </div>
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="account-option"
                value="login"
                checked={selectedOption === 'login'}
                onChange={handleOptionChange}
                className="form-radio"
              />
              <span>Đăng nhập bằng mật khẩu</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="account-option"
                value="reset-password"
                checked={selectedOption === 'reset-password'}
                onChange={handleOptionChange}
                className="form-radio"
              />
              <span>Đặt lại mật khẩu của bạn</span>
            </label>
          </div>
          <button
            onClick={handleContinue}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-600 transition-colors duration-300"
            disabled={!selectedOption}
          >
            Tiếp tục
          </button>
          <button
            onClick={handleNotYou}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg w-full hover:bg-gray-600 transition-colors duration-300"
          >
            Đây không phải bạn?
          </button>
        </div>
      </div>
    </>
  );
};

export default TuyChonTaiKhoanPage;
