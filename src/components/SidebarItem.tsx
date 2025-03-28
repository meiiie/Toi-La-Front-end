'use client';

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  isCollapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  to,
  icon,
  label,
  onClick,
  isCollapsed = false,
}) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <li className="relative group">
      <NavLink
        to={to}
        className={({ isActive }) => `
          relative flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} 
          py-2 px-3 rounded-lg transition-all duration-200
          ${isActive ? 'text-white' : 'text-blue-200/70 hover:text-blue-100'}
        `}
        onClick={onClick}
      >
        {({ isActive }) => (
          <>
            <div
              className={`
              flex items-center justify-center 
              aspect-square
              ${isCollapsed ? 'w-12 h-12' : 'w-10 h-10 mr-3'} 
              rounded-xl transition-all duration-200
              ${
                isActive
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                  : 'bg-[#1E293B] text-blue-400 hover:bg-[#2A3A5A] hover:text-blue-300'
              }
            `}
            >
              {React.cloneElement(icon as React.ReactElement, {
                className: 'h-5 w-5',
              })}
            </div>

            {!isCollapsed && <span className="text-sm font-medium">{label}</span>}

            {isActive && !isCollapsed && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute right-2 w-1.5 h-1.5 rounded-full bg-blue-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </>
        )}
      </NavLink>
    </li>
  );
};

export default React.memo(SidebarItem);
