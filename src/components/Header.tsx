import { NavLink, Link, useSearchParams, useLocation } from 'react-router-dom';
import { FaSignInAlt, FaList, FaHome, FaSearch } from 'react-icons/fa';
import logo from '../logo.svg';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import UserMenu from './UserMenu';

export default function Header() {
  const [, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const user = useSelector((state: RootState) => state.users.user);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    setSearchParams({ search: value });
  };

  return (
    <header className="bg-gradient-to-r from-blue-900 via-purple-900 to-black text-white shadow-lg">
      <div className="container mx-auto flex items-center justify-between h-20 p-4">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Logo" className="h-16" />
            <h1 className="text-2xl ml-4 font-bold">Ứng Dụng Bầu Cử</h1>
          </Link>
        </div>
        <nav className="flex space-x-6">
          <NavLink
            to={user ? '/app' : '/'}
            className={({ isActive }) =>
              `flex items-center text-lg font-semibold p-2 transition-colors duration-300 ${
                isActive ? 'text-yellow-400' : 'text-white hover:text-yellow-400'
              }`
            }
          >
            <FaHome className="mr-2" />
            {user ? 'Trang Chủ Bầu Cử' : 'Trang Chủ'}
          </NavLink>
          {!user ? (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `flex items-center text-lg font-semibold p-2 transition-colors duration-300 ${
                  isActive ? 'text-yellow-400' : 'text-white hover:text-yellow-400'
                }`
              }
            >
              <FaSignInAlt className="mr-2" />
              Đăng Nhập
            </NavLink>
          ) : (
            <UserMenu />
          )}
          <NavLink
            to="/elections"
            className={({ isActive }) =>
              `flex items-center text-lg font-semibold p-2 transition-colors duration-300 ${
                isActive ? 'text-yellow-400' : 'text-white hover:text-yellow-400'
              }`
            }
          >
            <FaList className="mr-2" />
            Xem Các Cuộc Bầu Cử
          </NavLink>
        </nav>
        {location.pathname === '/elections' && (
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm cuộc bầu cử"
              value={searchTerm}
              onChange={handleSearchChange}
              className="p-2 rounded text-gray-700 pl-10"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
        )}
      </div>
    </header>
  );
}
