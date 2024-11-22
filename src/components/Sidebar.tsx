import React from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import {
  FaHome,
  FaPlus,
  FaBell,
  FaUserShield,
  FaUserTag,
  FaSearch,
  FaBars,
  FaPoll,
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import logo from '../logo.svg';
import SidebarItem from './SidebarItem';
import UserMenu from './UserMenu';
import { RootState } from '../store/store';

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useSelector((state: RootState) => state.users.user);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const search = event.target.value;
    if (search) {
      setSearchParams({ search });
    } else {
      setSearchParams({});
    }
  };

  const isAdmin = currentUser?.roles.some((role: { permissions: string | string[] }) =>
    currentUser.name.includes('Bob'),
  );

  return (
    <nav
      className={`text-white h-full fixed top-0 left-0 ${
        isSidebarOpen ? 'bg-gradient-to-b from-gray-900 to-gray-700 w-64' : 'w-16 bg-sky-950'
      } shadow-2xl transition-width duration-300 ease-in-out z-40`}
      aria-label="Sidebar"
      role="navigation"
    >
      <div className="flex items-center justify-between p-4">
        {isSidebarOpen && (
          <NavLink to="/" aria-label="Trang chủ">
            <img src={logo} alt="Logo" className="h-12 w-25" />
          </NavLink>
        )}
        <button
          onClick={toggleSidebar}
          className="text-white bg-gray-800 p-2 rounded-full transition-transform duration-200 ease-in-out hover:bg-gray-700"
          aria-label="Mở/Đóng thanh bên"
        >
          <FaBars size={23} />
        </button>
      </div>
      <div
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 -translate-x-full'
        }`}
      >
        <div className="p-4 relative">
          <div className="relative">
            <input
              type="search"
              name="search"
              placeholder="Tìm kiếm"
              defaultValue={searchParams.get('search') ?? ''}
              onChange={handleSearch}
              className="w-full p-2 rounded text-gray-700 pl-10"
              tabIndex={0}
              aria-label="Tìm kiếm"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
        </div>
        <ul className="flex flex-col p-4 space-y-4">
          <SidebarItem to="/app" icon={<FaHome />} label="Trang chủ" />
          <SidebarItem to="/app/create-election" icon={<FaPlus />} label="Tạo cuộc bầu cử" />
          <SidebarItem to="/app/upcoming-elections" icon={<FaBell />} label="Thông báo" />
          <SidebarItem to="/app/user-elections" icon={<FaPoll />} label="Quản lý cuộc bầu cử" />
          {isAdmin && (
            <>
              <SidebarItem
                to="/app/role-management"
                icon={<FaUserShield />}
                label="Quản lý vai trò"
              />
              <SidebarItem to="/app/role-assignment" icon={<FaUserTag />} label="Phân quyền" />
            </>
          )}
          <li className="mb-4 shadow-lg rounded-lg z-50">
            <UserMenu />
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
