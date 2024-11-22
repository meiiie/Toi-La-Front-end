// src/components/LoginForm.tsx

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { authenticate } from '../api/authenticate';
import { authenticatedAction } from '../store/userSlice';

const LoginForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const user = await authenticate(username, password);
    console.log(user);
    if (user) {
      dispatch(authenticatedAction(user));
      onClose();
      navigate('/main');
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không chính xác');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg w-96 relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>
          &times;
        </button>
        <h2 className="text-2xl mb-4">Đăng nhập</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          type="text"
          placeholder="Tên đăng nhập"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Đăng nhập
        </button>
        <div className="flex justify-between items-center mt-4">
          <a href="#" className="text-blue-500 hover:underline">
            Quên mật khẩu?
          </a>
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors duration-300">
            Tạo tài khoản mới
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
