import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { authenticate } from '../api/authenticate';
import { authenticatedAction } from '../store/userSlice';
import LoginForm from '../features/LoginForm';
import { users } from '../data/constants';
import PasswordInput from '../components/PasswordInput';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoginFormOpen, setIsLoginFormOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const hieuUngClassThe =
    'p-4 bg-white border border-gray-300 rounded-lg shadow-lg transform transition duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 cursor-pointer flex flex-col items-center';

  const handleLogin = async () => {
    const user = await authenticate(username, password);
    if (user) {
      dispatch(authenticatedAction(user));
      navigate('/main');
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không chính xác');
    }
  };

  const handleOpenLoginForm = () => {
    setIsLoginFormOpen(true);
  };

  const handleCloseLoginForm = () => {
    setIsLoginFormOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-white p-4 md:p-0">
      <div className="md:w-1/2 flex flex-col justify-center items-baseline p-6 space-y-6 w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-blue-700 text-left w-full">
          Bầu Cử Blockchain
        </h1>
        <h3 className="text-xl md:text-2xl font-semibold text-gray-600 text-left w-full">
          Các tài khoản đã đăng nhập gần đây
        </h3>
        <p className="text-gray-600 text-left w-full">Nhấp vào ảnh của bạn hoặc thêm tài khoản.</p>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-4">
          {users.map((user) => (
            <div
              key={user.id}
              className={`${hieuUngClassThe} flex flex-col justify-between items-center`}
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full mb-2"
              />
              <h3 className="text-base md:text-lg font-semibold mb-2 text-gray-800 mt-auto text-center">
                {user.name}
              </h3>
            </div>
          ))}
          <div
            onClick={handleOpenLoginForm}
            className={`${hieuUngClassThe} flex flex-col justify-between items-center cursor-pointer`}
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-500 flex items-center justify-center mb-2">
              <span className="text-white text-4xl md:text-5xl">+</span>
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-2 text-gray-800 mt-auto text-center">
              Thêm tài khoản
            </h3>
          </div>
        </div>
      </div>
      <div className="md:w-1/2 w-full max-w-md p-6">
        <div className="p-6 md:p-8 bg-white border border-gray-200 rounded-lg shadow-md space-y-6">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Đăng nhập</h3>
          {error && <p className="text-red-500">{error}</p>}
          <input
            type="text"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 md:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
          <button
            onClick={handleLogin}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-600 transition-colors duration-300"
          >
            Đăng nhập
          </button>
          <div className="flex justify-between items-center">
            <Link to="/find-account" className="text-blue-500 hover:underline">
              Quên mật khẩu?
            </Link>
            <Link
              to="/register"
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-300"
            >
              Tạo tài khoản mới
            </Link>
          </div>
        </div>
      </div>
      {isLoginFormOpen && <LoginForm onClose={handleCloseLoginForm} />}
    </div>
  );
};

export default LoginPage;
