import { Home, HelpCircle, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

const VoterSidebar = () => {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 p-4 shadow-md flex flex-col">
      <div className="flex flex-col items-center mb-8">
        <img
          src="/voter-avatar.png"
          alt="Voter Avatar"
          className="w-20 h-20 object-cover rounded-full mb-4"
        />
        <h2 className="text-xl font-bold text-blue-700 dark:text-blue-300">Nguyễn Văn Cử Tri</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">ID: VT12345</p>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          <SidebarItem icon={Home} label="Trang Chủ" isActive />
          <SidebarItem icon={HelpCircle} label="Hướng Dẫn" />
          <SidebarItem icon={LogOut} label="Đăng Xuất" />
        </ul>
      </nav>
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © 2025 Hệ Thống Bầu Cử Trực Tuyến
        </p>
      </div>
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
}

const SidebarItem = ({ icon: Icon, label, isActive = false }: SidebarItemProps) => {
  return (
    <li>
      <button
        className={cn(
          'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors w-full text-left',
          isActive
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </button>
    </li>
  );
};

export default VoterSidebar;
