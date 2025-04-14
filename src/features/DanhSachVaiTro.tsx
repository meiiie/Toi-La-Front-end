import React, { useState, useMemo, useCallback } from 'react';
import { VaiTroChucNang } from '../store/types';
import PaginationPhu from '../components/PaginationPhu';
import { Button } from '../components/ui/Button';
import { Pencil, Trash2, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../components/ui/Tooltip';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/Dialog';
import { Card } from '../components/ui/Card';

interface RoleListProps {
  roles: VaiTroChucNang[];
  handleEditRole: (role: VaiTroChucNang | null) => void;
  handleDeleteRole: (roleId: number) => void;
  itemsPerPage: number;
  roleColor: string;
  editingRoleId: number | null;
  setEditingRoleId: (id: number | null) => void;
}

const DanhSachVaiTro: React.FC<RoleListProps> = ({
  roles,
  handleEditRole,
  handleDeleteRole,
  itemsPerPage,
  roleColor,
  editingRoleId,
  setEditingRoleId,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = useMemo(
    () => Math.ceil(roles.length / itemsPerPage),
    [roles.length, itemsPerPage],
  );

  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return roles.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, roles, itemsPerPage]);

  const getRoleFunctions = useCallback(
    (roleId: number) => {
      const role = roles.find((rf) => rf.id === roleId);
      if (!role || !role.chucNangs || role.chucNangs.length === 0) {
        return 'Vô năng';
      }
      const functionNames = role.chucNangs.map((cn) => cn.tenChucNang);
      return functionNames.length > 3
        ? functionNames.slice(0, 3).join(', ') + '...'
        : functionNames.join(', ');
    },
    [roles],
  );

  const getFullRoleFunctions = useCallback(
    (roleId: number) => {
      const role = roles.find((rf) => rf.id === roleId);
      if (!role || !role.chucNangs || role.chucNangs.length === 0) {
        return 'Vô năng';
      }
      return role.chucNangs.map((cn) => cn.tenChucNang).join(', ');
    },
    [roles],
  );

  const handlePencilClick = (role: VaiTroChucNang) => {
    if (editingRoleId === role.id) {
      setEditingRoleId(null);
      handleEditRole(null);
    } else {
      setEditingRoleId(role.id);
      handleEditRole(role);
    }
  };

  const toggleRoleDetails = (roleId: number) => {
    setSelectedRole(selectedRole === roleId ? null : roleId);
  };

  return (
    <TooltipProvider>
      <div>
        {roles.length > 0 ? (
          <>
            {/* Mobile view - Card-based layout */}
            <div className="md:hidden space-y-4">
              {paginatedRoles.map((role: VaiTroChucNang) => (
                <Card key={role.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium" style={{ color: roleColor }}>
                      {role.tenVaiTro}
                    </span>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePencilClick(role)}
                        className={`p-1 h-8 w-8 ${editingRoleId === role.id ? 'bg-yellow-400' : ''}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-1 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRoleDetails(role.id)}
                        className="p-1 h-8 w-8"
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${selectedRole === role.id ? 'transform rotate-90' : ''}`}
                        />
                      </Button>
                    </div>
                  </div>

                  {selectedRole === role.id && (
                    <div className="mt-3 border-t pt-3 space-y-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Chức năng:</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <span className="text-sm cursor-pointer text-blue-600">
                              {getRoleFunctions(role.id)}
                            </span>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Chức năng của {role.tenVaiTro}</DialogTitle>
                              <DialogDescription className="mt-2">
                                {getFullRoleFunctions(role.id)}
                              </DialogDescription>
                            </DialogHeader>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Ngày tạo:</span>
                        <span className="text-sm">{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Desktop view - Table layout */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 tracking-wider">
                      Tên vai trò
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 tracking-wider">
                      Chức năng
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                  {paginatedRoles.map((role: VaiTroChucNang) => (
                    <tr key={role.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium" style={{ color: roleColor }}>
                          {role.tenVaiTro}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm cursor-pointer">
                              {getRoleFunctions(role.id)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{getFullRoleFunctions(role.id)}</TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm">{new Date().toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          onClick={() => handlePencilClick(role)}
                          className={`${editingRoleId === role.id ? 'bg-yellow-400' : ''}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={() => handleDeleteRole(role.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationPhu
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <p className="text-center text-gray-500">Không có vai trò nào được tạo.</p>
        )}
      </div>
    </TooltipProvider>
  );
};

export default React.memo(DanhSachVaiTro);
