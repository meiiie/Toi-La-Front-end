import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { findAccount } from '../api/findAccount';
import { User } from '../store/types';

const FindAccountPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [foundUsers, setFoundUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  const handleFindAccount = async () => {
    const users = await findAccount(input);

    if (users.length > 0) {
      setFoundUsers(users);
      setMessage('Tài khoản đã được tìm thấy. Vui lòng kiểm tra email hoặc số di động của bạn.');
    } else {
      setFoundUsers([]);
      setMessage('Không tìm thấy tài khoản. Vui lòng thử lại.');
    }
  };

  const handleSelectAccount = (user: User) => {
    navigate('/account-options', { state: { user } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md p-6 bg-white border border-gray-200 rounded-lg shadow-md space-y-6">
        <h3 className="text-xl md:text-2xl font-semibold text-gray-800">Tìm tài khoản của bạn</h3>
        <p className="text-gray-600">
          Vui lòng nhập email hoặc số di động để tìm kiếm tài khoản của bạn.
        </p>
        {message && <p className="text-red-500">{message}</p>}
        <input
          type="text"
          placeholder="Email hoặc số di động"
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
        {foundUsers.length > 0 && (
          <div className="mt-6 space-y-4">
            {foundUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 bg-gray-100 border border-gray-300 rounded-lg flex items-center space-x-4 cursor-pointer"
                onClick={() => handleSelectAccount(user)}
              >
                <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full" />
                <div>
                  <h4 className="text-lg font-semibold">{user.name}</h4>
                  <p className="text-gray-600">{user.account.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindAccountPage;
