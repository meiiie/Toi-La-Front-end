import type React from 'react';
import { BarChart, FileText, Calendar, Edit } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface BottomBarProps {
  electionName: string;
  cuocBauCuId: number;
}

const BottomBar: React.FC<BottomBarProps> = ({ cuocBauCuId, electionName }) => {
  return (
    <div className="relative bottom-0 left-0 right-0 bg-gray-900 text-white h-16 sm:h-20">
      <div className="relative h-full flex items-center">
        <div className="absolute left-0 top-0 bottom-0 w-64 sm:w-72 overflow-hidden">
          <img src="/tai_xuong.jpg" alt="Election Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black bg-opacity-5 hover:bg-opacity-30 transition-opacity duration-300">
            <h2 className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-[105%] text-sm sm:text-base font-semibold truncate text-white">
              {electionName}
            </h2>
          </div>
        </div>
        <nav className="flex-1 ml-64 sm:ml-72">
          <ul className="flex justify-around h-full">
            <BottomBarItem
              icon={BarChart}
              label="Tổng Quan"
              to={`/app/user-elections/elections/${cuocBauCuId}/election-management`}
            />
            <BottomBarItem icon={FileText} label="Thể Lệ" to="/app/edit-rules" />
            <BottomBarItem icon={Calendar} label="Lịch trình" to="/app/edit-schedule" />
            <BottomBarItem icon={Edit} label="Chỉnh sửa" to="/app/edit-election" />
          </ul>
        </nav>
      </div>
    </div>
  );
};

interface BottomBarItemProps {
  icon: LucideIcon;
  label: string;
  to: string;
}

const BottomBarItem = ({ icon: Icon, label, to }: BottomBarItemProps) => {
  return (
    <li className="flex-1">
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center h-full p-1 transition-colors',
            isActive ? 'text-blue-500' : 'text-gray-300 hover:text-white',
          )
        }
      >
        <Icon className="h-5 w-5 sm:h-5 sm:w-5" />
        <span className="text-xs sm:text-sm mt-1">{label}</span>
      </NavLink>
    </li>
  );
};

export default BottomBar;
