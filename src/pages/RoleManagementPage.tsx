'use client';

import { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Switch } from '../components/ui/Switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { toast } from '../components/ui/Use-toast';
import { Pencil, Trash2, Download, Search, Sun, Moon, Laptop } from 'lucide-react';
import Swal from 'sweetalert2';

type Permission = {
  id: string;
  name: string;
  description: string;
  category: string;
};

type Role = {
  id: number;
  name: string;
  color: string;
  permissions: string[];
  createdAt: Date;
};

const permissions: Permission[] = [
  {
    id: 'create_roles',
    name: 'Tạo vai trò',
    description: 'Cho phép tạo vai trò mới',
    category: 'Quản lý hệ thống',
  },
  {
    id: 'edit_roles',
    name: 'Chỉnh sửa vai trò',
    description: 'Cho phép chỉnh sửa vai trò hiện có',
    category: 'Quản lý hệ thống',
  },
  {
    id: 'delete_roles',
    name: 'Xóa vai trò',
    description: 'Cho phép xóa vai trò',
    category: 'Quản lý hệ thống',
  },
  {
    id: 'manage_posts',
    name: 'Quản lý bài đăng',
    description: 'Cho phép quản lý bài đăng',
    category: 'Quản lý nội dung',
  },
  {
    id: 'manage_comments',
    name: 'Quản lý bình luận',
    description: 'Cho phép quản lý bình luận',
    category: 'Quản lý nội dung',
  },
  {
    id: 'manage_voters',
    name: 'Quản lý cử tri',
    description: 'Cho phép quản lý cử tri',
    category: 'Quản lý cử tri',
  },
  {
    id: 'manage_elections',
    name: 'Quản lý bầu cử',
    description: 'Cho phép quản lý các phiên bầu cử',
    category: 'Quản lý bầu cử',
  },
];

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleName, setRoleName] = useState('');
  const [roleColor, setRoleColor] = useState('#2563EB');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState('Tất cả');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

  const itemsPerPage = 10;

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleAddRole = () => {
    if (roleName.trim() === '') {
      toast({
        title: 'Lỗi',
        description: 'Tên vai trò không được để trống',
        variant: 'destructive',
      });
      return;
    }
    if (roleName.length > 30) {
      toast({
        title: 'Lỗi',
        description: 'Tên vai trò không được vượt quá 30 ký tự',
        variant: 'destructive',
      });
      return;
    }
    const newRole: Role = {
      id: roles.length + 1,
      name: roleName,
      color: roleColor,
      permissions: selectedPermissions,
      createdAt: new Date(),
    };
    setRoles([...roles, newRole]);
    resetForm();
    toast({ title: 'Thành công', description: 'Đã tạo vai trò thành công!' });
  };

  const handleUpdateRole = () => {
    if (editingRole) {
      const updatedRoles = roles.map((role) =>
        role.id === editingRole.id
          ? { ...role, name: roleName, color: roleColor, permissions: selectedPermissions }
          : role,
      );
      setRoles(updatedRoles);
      resetForm();
      toast({ title: 'Thành công', description: 'Đã cập nhật vai trò thành công!' });
    }
  };

  const handleDeleteRole = (roleId: number) => {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: 'Bạn có muốn xóa vai trò này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Có, xóa nó!',
      cancelButtonText: 'Không, giữ lại',
    }).then((result: { isConfirmed: any }) => {
      if (result.isConfirmed) {
        setRoles(roles.filter((role) => role.id !== roleId));
        toast({ title: 'Thành công', description: 'Đã xóa vai trò thành công!' });
      }
    });
  };

  const resetForm = () => {
    setRoleName('');
    setRoleColor('#2563EB');
    setSelectedPermissions([]);
    setEditingRole(null);
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterCategory === 'Tất cả' ||
        role.permissions.some(
          (p) => permissions.find((perm) => perm.id === p)?.category === filterCategory,
        )),
  );

  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const exportRoles = () => {
    const csv = [
      ['ID', 'Tên', 'Màu sắc', 'Quyền hạn', 'Ngày tạo'],
      ...roles.map((role) => [
        role.id,
        role.name,
        role.color,
        role.permissions.join(', '),
        role.createdAt.toISOString(),
      ]),
    ]
      .map((e) => e.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'vai_tro.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-200">Quản lý vai trò</h1>
        <div className="flex space-x-2">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            className="bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-700 dark:text-white dark:hover:bg-blue-800"
            onClick={() => setTheme('light')}
          >
            <Sun className="h-4 w-4 mr-2" /> Sáng
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            className="bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-900 dark:text-white dark:hover:bg-blue-950"
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-4 w-4 mr-2" /> Tối
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            onClick={() => setTheme('system')}
          >
            <Laptop className="h-4 w-4 mr-2" /> Hệ thống
          </Button>
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700">
        <CardHeader className="bg-blue-50 dark:bg-blue-900">
          <CardTitle className="text-blue-800 dark:text-blue-200">
            {editingRole ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Label htmlFor="roleName">Tên vai trò</Label>
              <Input
                id="roleName"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                maxLength={30}
                placeholder="Nhập tên vai trò"
                className="dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Label htmlFor="roleColor">Màu vai trò</Label>
              <Input
                id="roleColor"
                type="color"
                value={roleColor}
                onChange={(e) => setRoleColor(e.target.value)}
                className="w-12 h-12"
              />
              <div className="flex space-x-2">
                {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6B7280'].map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: color }}
                    onClick={() => setRoleColor(color)}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Quyền hạn</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                {permissions.map((permission) => (
                  <TooltipProvider key={permission.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={permission.id}
                            checked={selectedPermissions.includes(permission.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPermissions([...selectedPermissions, permission.id]);
                              } else {
                                setSelectedPermissions(
                                  selectedPermissions.filter((id) => id !== permission.id),
                                );
                              }
                            }}
                          />
                          <Label htmlFor={permission.id}>{permission.name}</Label>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{permission.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setSelectedPermissions(permissions.map((p) => p.id))}>
                Bật tất cả quyền
              </Button>
              <Button variant="outline" onClick={() => setSelectedPermissions([])}>
                Tắt tất cả quyền
              </Button>
            </div>
            <Button
              onClick={editingRole ? handleUpdateRole : handleAddRole}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editingRole ? 'Cập nhật vai trò' : 'Tạo vai trò'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700">
        <CardHeader className="bg-blue-50 dark:bg-blue-900">
          <CardTitle className="text-blue-800 dark:text-blue-200">Quản lý vai trò</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Search className="text-gray-400" />
              <Input
                placeholder="Tìm kiếm vai trò..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dark:bg-gray-700 dark:text-white"
              />
            </div>
            <Button onClick={exportRoles} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="mr-2 h-4 w-4" /> Xuất vai trò
            </Button>
          </div>
          <Tabs value={filterCategory} onValueChange={setFilterCategory} className="mb-4">
            <TabsList className="bg-blue-100 dark:bg-blue-800">
              <TabsTrigger
                value="Tất cả"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                Tất cả
              </TabsTrigger>
              <TabsTrigger
                value="Quản lý hệ thống"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                Quản lý hệ thống
              </TabsTrigger>
              <TabsTrigger
                value="Quản lý nội dung"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                Quản lý nội dung
              </TabsTrigger>
              <TabsTrigger
                value="Quản lý cử tri"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                Quản lý cử tri
              </TabsTrigger>
              <TabsTrigger
                value="Quản lý bầu cử"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                Quản lý bầu cử
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên vai trò</TableHead>
                <TableHead>Quyền hạn</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <span style={{ color: role.color }}>{role.name}</span>
                  </TableCell>
                  <TableCell>{role.permissions.join(', ')}</TableCell>
                  <TableCell>{role.createdAt.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingRole(role);
                        setRoleName(role.name);
                        setRoleColor(role.color);
                        setSelectedPermissions(role.permissions);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => handleDeleteRole(role.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Trước
            </Button>
            <span>
              Trang {currentPage} / {Math.ceil(filteredRoles.length / itemsPerPage)}
            </span>
            <Button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, Math.ceil(filteredRoles.length / itemsPerPage)),
                )
              }
              disabled={currentPage === Math.ceil(filteredRoles.length / itemsPerPage)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Tiếp
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
