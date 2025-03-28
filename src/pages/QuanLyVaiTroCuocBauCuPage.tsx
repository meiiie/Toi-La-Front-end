'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { VaiTro, Quyen } from '../store/types';
import { fetchCacVaiTro, addVaiTro, editVaiTro, removeVaiTro } from '../store/slice/vaiTroSlice';
import { RootState, AppDispatch } from '../store/store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import { Search, Download, Pencil, Trash2 } from 'lucide-react';
import { Switch } from '../components/ui/Switch';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../components/ui/Table';
import { toast } from '../components/ui/Use-toast';
import Swal from 'sweetalert2';
import PaginationPhu from '../components/PaginationPhu';
import { Helmet, HelmetProvider } from 'react-helmet-async';

export type Permission = 'view' | 'vote' | 'count' | 'manage' | 'admin';

const permissions: { id: Permission; name: string; description: string }[] = [
  { id: 'view', name: 'Xem', description: 'Có thể xem' },
  { id: 'vote', name: 'Bỏ phiếu', description: 'Có thể bỏ phiếu' },
  { id: 'count', name: 'Đếm phiếu', description: 'Có thể đếm phiếu' },
  { id: 'manage', name: 'Quản lý', description: 'Có thể quản lý phiên bầu cử này' },
  { id: 'admin', name: 'Quản trị', description: 'Có quyền hạn tối cao' },
];

interface ElectionRoleFormProps {
  phienBauCuId: string;
}

export default function QuanLyVaiTroPhienBauCuPage({ electionId }: ElectionRoleFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VaiTro>();
  const roles = useSelector((state: RootState) => state.vaiTro.cacVaiTro);
  const dispatch = useDispatch<AppDispatch>();
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleColor, setRoleColor] = useState<string | undefined>('#2563EB');
  const [editingRole, setEditingRole] = useState<VaiTro | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    dispatch(fetchCacVaiTro());
  }, [dispatch]);

  const handleCreateRole = async (data: VaiTro) => {
    try {
      if (data.tenVaiTro.trim() === '') {
        toast({
          title: 'Lỗi',
          description: 'Vai trò không thể để trống',
          variant: 'destructive',
        });
        return;
      }
      if (data.tenVaiTro.length > 30) {
        toast({
          title: 'Lỗi',
          description: 'Vai trò không thể dài quá 30 ký tự',
          variant: 'destructive',
        });
        return;
      }
      await dispatch(
        addVaiTro({
          ...data,
          quyen: selectedPermissions as Quyen[],
        }),
      ).unwrap();
      reset();
      setSelectedPermissions([]);
      setRoleColor('#2563EB');
      toast({
        title: 'Tạo Vai Trò',
        description: `Vai trò "${data.tenVaiTro}" đã được tạo thành công.`,
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Tạo vai trò thất bại, hãy thử lại.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async (data: VaiTro) => {
    try {
      if (editingRole) {
        await dispatch(
          editVaiTro({
            id: editingRole.id,
            vaiTro: {
              ...data,
              quyen: selectedPermissions as Quyen[],
            },
          }),
        ).unwrap();
        reset();
        setSelectedPermissions([]);
        setRoleColor('#2563EB');
        setEditingRole(undefined);
        toast({
          title: 'Cập Nhật Vai Trò',
          description: `Vai trò "${data.tenVaiTro}" đã được cập nhật thành công.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Cập nhật vai trò thất bại, hãy thử lại.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: 'Bạn muốn xóa vai trò này chứ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Vâng, xóa nó!',
      cancelButtonText: 'Không, giữ lại',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await dispatch(removeVaiTro(roleId)).unwrap();
          toast({ title: 'Thành Công', description: 'Xóa vai trò thành công!' });
        } catch (error) {
          toast({
            title: 'Lỗi',
            description: 'Xóa vai trò thất bại, hãy thử lại.',
            variant: 'destructive',
          });
        }
      }
    });
  };

  const handleEditRole = (role: VaiTro | undefined) => {
    setEditingRole(role);
    if (role) {
      reset({ tenVaiTro: role.tenVaiTro });
      setSelectedPermissions(role.quyen);
      //setRoleColor(role.color ?? '');
    }
  };

  const exportRoles = () => {
    const csv = [
      ['ID', 'Tên', 'Màu', 'Quyền', 'Ngày Tạo'],
      ...roles.map((role) => [
        role.id,
        role.tenVaiTro,
        // role.color,
        role.quyen.join(', '),
        new Date().toISOString(),
      ]),
    ]
      .map((e) => e.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'roles.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const filteredRoles = roles.filter((role) =>
    role.tenVaiTro.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <HelmetProvider>
      <Helmet>
        <title>Quản Lý Vai Trò | Nền Tảng Bầu Cử Blockchain</title>
        <meta name="description" content="Trang quản lý vai trò cho phiên bầu cử." />
        <meta name="keywords" content="quản lý, vai trò, bầu cử, admin" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <link rel="canonical" href="http://example.com/quan-ly-vai-tro" />
        <meta property="og:title" content="Quản Lý Vai Trò - Nền Tảng Bầu Cử Blockchain" />
        <meta property="og:description" content="Trang quản lý vai trò cho phiên bầu cử." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="http://example.com/quan-ly-vai-tro" />
        <meta property="og:image" content="http://example.com/logo.png" />
      </Helmet>
      <div className="container mx-auto p-4">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Quản Lý Vai Trò</h1>
        </header>

        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{editingRole ? 'Chỉnh Sửa Vai Trò' : 'Tạo Vai Trò Mới'}</CardTitle>
              <CardDescription>Thiết lập một vai trò mới và phân quyền</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit(editingRole ? handleUpdateRole : handleCreateRole)}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="roleName">Tên Vai Trò</Label>
                  <Input
                    id="roleName"
                    {...register('tenVaiTro', { required: 'Phải nhập tên vai trò' })}
                    className={errors.tenVaiTro ? 'border-red-500' : ''}
                  />
                  {errors.tenVaiTro && (
                    <p className="text-red-500 text-xs mt-1">{errors.tenVaiTro.message}</p>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <Label htmlFor="roleColor">Màu Tên Vai Trò</Label>
                  <Input
                    id="roleColor"
                    type="color"
                    value={roleColor}
                    onChange={(e) => setRoleColor(e.target.value)}
                  />
                  <div className="flex space-x-2">
                    {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6B7280'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: color }}
                        onClick={() => setRoleColor(color)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Các Quyền</Label>
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
                  <Button
                    type="button"
                    onClick={() => setSelectedPermissions(permissions.map((p) => p.id))}
                  >
                    Chọn Tất Cả
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedPermissions([])}
                  >
                    Hủy Chọn Tất Cả
                  </Button>
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingRole ? 'Cập Nhật Vai Trò' : 'Tạo Vai Trò'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Danh Sách Vai Trò</CardTitle>
              <CardDescription>Quản lý các vai trò đã tạo</CardDescription>
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
                      {/* <TableCell>
                        <span style={{ color: role.color }}>{role.tenVaiTro}</span>
                      </TableCell> */}
                      <TableCell>{role.quyen.join(', ')}</TableCell>
                      <TableCell>{new Date().toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" onClick={() => handleEditRole(role)}>
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
              <PaginationPhu
                currentPage={currentPage}
                totalPages={Math.ceil(filteredRoles.length / itemsPerPage)}
                onPageChange={handlePageChange}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </HelmetProvider>
  );
}
