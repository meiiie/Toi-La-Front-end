import type React from 'react';
import type { TaiKhoanVaiTroAdmin } from '../store/types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Users, UserCheck, UserX } from 'lucide-react';

interface UserStatsProps {
  users: TaiKhoanVaiTroAdmin[];
}

export const UserStats: React.FC<UserStatsProps> = ({ users }) => {
  const totalUsers = users.length;
  const activeUsers = users.filter((user) => user.rangThai === true).length;
  const inactiveUsers = totalUsers - activeUsers;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        Thống kê Người dùng
      </h2>
      <div className="space-y-4">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Tổng số người dùng
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{totalUsers}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Đang hoạt động
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{activeUsers}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Không hoạt động
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {inactiveUsers}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
