import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTimTaiKhoan } from '../store/slice/timTaiKhoanSlice';
import { RootState, AppDispatch } from '../store/store';
import SEO from '../components/SEO';
import PaginationPhu from '../components/PaginationPhu';

const TimTaiKhoanPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [usersPerPage] = useState<number>(3);
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const { foundUsers, status, error } = useSelector((state: RootState) => state.timTaiKhoan);

  const handleFindAccount = async () => {
    setCurrentPage(1);
    dispatch(fetchTimTaiKhoan(input));
  };

  const handleSelectAccount = (user: any) => {
    const randomCode = Math.random().toString(36).substring(2, 15);
    navigate(`/tim-tai-khoan/${user.tenDangNhap}/${randomCode}/tuy-chon`, {
      state: { user },
    });
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

  // Tính toán các tài khoản hiển thị trên trang hiện tại
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = foundUsers.data.slice(indexOfFirstUser, indexOfLastUser);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <SEO
        title="Tìm Tài Khoản | Nền Tảng Bầu Cử Blockchain"
        description="Tìm tài khoản của bạn bằng cách nhập tên hoặc email."
        keywords="tìm tài khoản, bầu cử, nền tảng bầu cử, blockchain"
        author="Nền Tảng Bầu Cử Blockchain"
        url={window.location.href}
        image={`${window.location.origin}/logo.png`}
      />
      <div className="w-full max-w-md p-6 bg-white border border-gray-200 rounded-lg shadow-md space-y-6">
        <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Tìm tài khoản của bạn</h3>
        <p className="text-gray-600">Vui lòng nhập tên hoặc email để tìm kiếm tài khoản của bạn.</p>
        {status === 'failed' && <p className="text-red-500">{error}</p>}
        <input
          type="text"
          placeholder="Tên hoặc email"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/login')}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-300"
          >
            Hủy
          </button>
          <button
            onClick={handleFindAccount}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
          >
            Tìm kiếm
          </button>
        </div>
        {status === 'loading' && <p className="text-blue-500">Đang tìm kiếm...</p>}
        {status === 'succeeded' && currentUsers.length === 0 && (
          <p className="text-red-600">Không tìm thấy tài khoản.</p>
        )}
        {currentUsers.length > 0 && (
          <div className="mt-6 space-y-4">
            {currentUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 bg-gray-100 border border-gray-300 rounded-lg flex items-center space-x-4 cursor-pointer"
                onClick={() => handleSelectAccount(user)}
              >
                <img src={user.avatar} alt={user.tenDangNhap} className="w-16 h-16 rounded-full" />
                <div>
                  <h4 className="text-lg font-semibold">{user.tenDangNhap}</h4>
                  <p className="text-gray-600">{maskEmail(user.email)}</p>
                  <p className="text-gray-600">{maskPhoneNumber(user.sdt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {foundUsers.data.length > usersPerPage && (
          <PaginationPhu
            currentPage={currentPage}
            totalPages={Math.ceil(foundUsers.data.length / usersPerPage)}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default TimTaiKhoanPage;
