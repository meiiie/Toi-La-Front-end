// src/components/UserMenu.tsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { logoutAction } from '../store/userSlice';
import NotificationModal from './NotificationModal';

const UserMenu: React.FC = () => {
  const user = useSelector((state: RootState) => state.users.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  const toggleAccountMenu = () => {
    setIsAccountMenuOpen(!isAccountMenuOpen);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
    dispatch(logoutAction());
    navigate('/thank-you');
  };

  return (
    <div className="relative">
      <button
        onClick={toggleAccountMenu}
        className="flex items-center text-lg font-semibold p-2 transition-colors duration-300 hover:text-yellow-400"
      >
        <FaUserCircle className="mr-2" />
        {user ? `${user.name} - ${user.roles.map((role) => role.name).join(', ')}` : 'Tài khoản'}
      </button>
      {isAccountMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white text-gray-700 rounded shadow-lg z-50">
          <NavLink
            to="/app/account-info"
            className="block px-4 py-2 hover:bg-gray-200"
            onClick={toggleAccountMenu}
          >
            <FaUserCircle className="mr-2" /> Thông tin tài khoản
          </NavLink>
          <NavLink
            to="/app/settings"
            className="block px-4 py-2 hover:bg-gray-200"
            onClick={toggleAccountMenu}
          >
            <FaCog className="mr-2" /> Cài đặt
          </NavLink>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 hover:bg-gray-200"
          >
            <FaSignOutAlt className="mr-2" /> Đăng xuất
          </button>
        </div>
      )}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <NotificationModal
            title="Xác nhận đăng xuất"
            message="Bạn có muốn đăng xuất, bạn sợ à?"
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
            confirmLabel="Đăng xuất"
          />
        </div>
      )}
    </div>
  );
};

export default UserMenu;
