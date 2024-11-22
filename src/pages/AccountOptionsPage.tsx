import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User } from '../store/types';

const AccountOptionsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user as User;
  const [selectedOption, setSelectedOption] = useState<string>('');

  if (!user) {
    navigate('/find-account');
    return null;
  }

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };

  const handleContinue = () => {
    if (selectedOption === 'login') {
      navigate('/login', { state: { user } });
    } else if (selectedOption === 'reset-password') {
      navigate('/reset-password', { state: { user } });
    }
  };

  const handleNotYou = () => {
    navigate('/find-account');
  };

  const maskPhoneNumber = (phone: string | undefined) => {
    if (!phone) return 'Số điện thoại không hợp lệ'; // Trả về thông báo lỗi nếu phone là undefined
    return phone.replace(/(\d{2})(\d+)(\d{3})/, '+$1*******$3');
  };

  const maskEmail = (email: string | undefined) => {
    if (!email) return 'Email không hợp lệ'; // Trả về thông báo lỗi nếu email là undefined
    const [localPart, domain] = email.split('@');
    return `${localPart[0]}***@***${domain.slice(-1)}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md p-6 bg-white border border-gray-200 rounded-lg shadow-md space-y-6">
        <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Tùy chọn tài khoản</h3>
        <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg flex items-center space-x-4">
          <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full" />
          <div>
            <h4 className="text-lg font-semibold">{user.name}</h4>
            <p className="text-gray-600">{maskEmail(user.account.email)}</p>
            <p className="text-gray-600">{maskPhoneNumber(user.account.phone)}</p>
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
  );
};

export default AccountOptionsPage;
