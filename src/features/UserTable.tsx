import type React from 'react';
import { useState } from 'react';
import type { TaiKhoanVaiTroAdmin, VaiTro } from '../store/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import PaginationPhu from '../components/PaginationPhu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/AlterDialog';

interface UserTableProps {
  users: TaiKhoanVaiTroAdmin[];
  roles: VaiTro[];
  handleRoleChange: (userId: number, roleId: number) => void;
  handleDeleteUser: (userId: number) => void;
  handleRestrictUser: (userId: number) => void;
  handleBanUser: (userId: number) => void;
  itemsPerPage: number;
  filteredUsers: TaiKhoanVaiTroAdmin[];
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  roles,
  handleRoleChange,
  handleDeleteUser,
  handleRestrictUser,
  handleBanUser,
  itemsPerPage,
  filteredUsers,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Danh sách Người dùng
        </h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] text-gray-800 dark:text-gray-200">
                  Tên đăng nhập
                </TableHead>
                <TableHead className="text-gray-800 dark:text-gray-200">Email</TableHead>
                <TableHead className="text-gray-800 dark:text-gray-200">Vai trò</TableHead>
                <TableHead className="text-right text-gray-800 dark:text-gray-200">
                  Hành động
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.map((user) => {
                const userRole =
                  roles.find((role) => role.id === user.vaiTroId)?.tenVaiTro || 'Vô Năng';
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-gray-800 dark:text-gray-200">
                      {user.tenDangNhap}
                    </TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-200">{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.vaiTroId ? user.vaiTroId.toString() : ''}
                        onValueChange={(value) => handleRoleChange(user.id, Number.parseInt(value))}
                      >
                        <SelectTrigger className="w-[180px] dark:bg-gray-700 dark:text-white">
                          <SelectValue placeholder={userRole} />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:text-white">
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              {role.tenVaiTro}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              Xóa
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="dark:bg-gray-800 dark:text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Bạn có chắc chắn muốn xóa người dùng này?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Hành động này không thể hoàn tác. Người dùng này sẽ bị xóa vĩnh viễn
                                khỏi hệ thống.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="dark:bg-gray-700 dark:text-white">
                                Hủy
                              </AlertDialogCancel>
                              <AlertDialogAction
                                className="dark:bg-red-700 dark:text-white"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Xác nhận
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button
                          variant="outline"
                          size="sm"
                          className="dark:border-gray-700 dark:text-gray-200"
                          onClick={() => handleRestrictUser(user.id)}
                        >
                          Hạn chế
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="dark:bg-gray-700 dark:text-gray-200"
                          onClick={() => handleBanUser(user.id)}
                        >
                          Cấm
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Hiển thị {startIndex + 1} đến {Math.min(startIndex + itemsPerPage, filteredUsers.length)}{' '}
          trong số {filteredUsers.length} người dùng
        </p>
        <PaginationPhu
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
