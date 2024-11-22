// src/components/SidebarItem.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, onClick }) => {
  return (
    <li className="mb-4 shadow-lg rounded-lg">
      <NavLink
        to={to}
        className={({ isActive }) =>
          isActive
            ? 'flex items-center py-2 px-4 rounded bg-blue-600 text-white transition duration-300 ease-in-out'
            : 'flex items-center py-2 px-4 rounded hover:bg-gray-700 hover:text-blue-500 transition duration-300 ease-in-out'
        }
        tabIndex={0}
        onClick={onClick}
      >
        {icon}
        <span className="ml-2">{label}</span>
      </NavLink>
    </li>
  );
};

export default SidebarItem;
