import { BarChart, FileText, Calendar, Edit, Home, ChevronLeft, Sun, Moon } from 'lucide-react';
import { cn } from '../lib/utils';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Switch } from '../components/ui/Switch';

interface SidebarPhienBauProps {
  electionName: string;
  isExpanded: boolean;
  toggleSidebar: () => void;
}

const SidebarPhienBau: React.FC<SidebarPhienBauProps> = ({
  electionName,
  isExpanded,
  toggleSidebar,
}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 transform ${isExpanded ? 'translate-x-0' : '-translate-x-full'} w-64 bg-gray-900 text-white flex flex-col transition-transform duration-300`}
    >
      <div className="flex-shrink-0 relative">
        <img src="/tai_xuong.jpg" alt="Election Banner" className="w-full h-40 object-cover" />
        <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-5 p-3 hover:bg-opacity-20">
          <h2 className="text-lg font-semibold truncate text-center" style={{ marginLeft: '-55%' }}>
            {electionName}
          </h2>
          <button
            onClick={toggleSidebar}
            className="absolute right-2 bottom-2 p-1 hover:bg-gray-700 rounded-full transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          <SidebarItem
            icon={BarChart}
            label="Tổng Quan"
            to="/app/overview"
            isExpanded={isExpanded}
          />
          <SidebarItem
            icon={FileText}
            label="Chỉnh Sửa Thể Lệ"
            to="/app/edit-rules"
            isExpanded={isExpanded}
          />
          <SidebarItem
            icon={Calendar}
            label="Chỉnh sửa lịch trình"
            to="/app/edit-schedule"
            isExpanded={isExpanded}
          />
          <SidebarItem
            icon={Edit}
            label="Chỉnh sửa cuộc bầu cử"
            to="/app/edit-election"
            isExpanded={isExpanded}
          />
        </ul>
      </nav>
      <div className="mt-auto border-t border-gray-700 p-4">
        <NavLink
          to="/app"
          className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
        >
          <Home className="h-5 w-5" />
          <span className={`${isExpanded ? 'block' : 'hidden'}`}>Trang chủ</span>
        </NavLink>
        <div className="flex items-center justify-between mt-4">
          <Switch
            checked={isDarkMode}
            onCheckedChange={toggleDarkMode}
            sunIcon={<Sun className="text-yellow-500" />}
            moonIcon={<Moon className="text-gray-300" />}
          />
        </div>
      </div>
    </div>
  );
};

interface SidebarItemProps {
  icon: LucideIcon;
  label: string;
  to: string;
  isExpanded: boolean;
}

const SidebarItem = ({ icon: Icon, label, to, isExpanded }: SidebarItemProps) => {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            'flex items-center space-x-3 px-3 py-2 rounded-md transition-colors w-full text-left',
            isActive
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white',
          )
        }
      >
        <Icon className="h-5 w-5" />
        <span className={`${isExpanded ? 'block' : 'hidden'}`}>{label}</span>
      </NavLink>
    </li>
  );
};

export default SidebarPhienBau;
