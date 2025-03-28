import type React from 'react';
import type { VaiTro } from '../store/types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface RoleManagementProps {
  roles: VaiTro[];
}

export const RoleManagement: React.FC<RoleManagementProps> = ({ roles }) => {
  const uniqueRoles = Array.from(new Set(roles.map((role) => role.tenVaiTro)));

  return (
    <Card className="bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700">
      <CardHeader className="bg-blue-50 dark:bg-blue-900 mb-2">
        <CardTitle className="text-blue-800 dark:text-blue-200">Quản lý Vai trò</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {uniqueRoles.map((roleId) => (
            <Badge
              key={roleId}
              variant="secondary"
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              {roleId}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
