// src/AppAfterLogin.tsx
import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import { useSidebar } from './utils/useSidebar';

const AppAfterLogin: React.FC = () => {
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const user = useSelector((state: RootState) => state.users.user);

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex">
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`p-4 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-10'} w-full`}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default AppAfterLogin;
