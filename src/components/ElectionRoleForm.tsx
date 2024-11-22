'use client';

import React, { useState, useEffect, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector, useDispatch } from 'react-redux';
import { Role, Voter } from '../store/types';
import { getRoles, createRole, assignRoleToVoter } from '../api/roleApi';
import VoterTable from './VoterTable';
import { RootState } from '../store/store';
import { setVoters } from '../store/votersSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import { Switch } from '../components/ui/Switch';
import { AlertCircle, Search, Sun, Moon, Download } from 'lucide-react';
import { toast } from '../components/ui/Use-toast';
import Swal from 'sweetalert2';

export type Permission = 'view' | 'vote' | 'count' | 'manage' | 'admin';

const permissions: { id: Permission; name: string; description: string }[] = [
  { id: 'view', name: 'View', description: 'Có thể xem' },
  { id: 'vote', name: 'Vote', description: 'Có thể vote' },
  { id: 'count', name: 'Count', description: 'Cỏ thể đếm vote' },
  { id: 'manage', name: 'Manage', description: 'Có thể quản lý phiên bầu cử này' },
  { id: 'admin', name: 'Admin', description: 'Có quyền hạn tối cao' },
];

interface ElectionRoleFormProps {
  electionId: string;
}

export default function ElectionRoleForm({ electionId }: ElectionRoleFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Role>();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const voters = useSelector((state: RootState) => state.voters.voters);
  const dispatch = useDispatch();
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleColor, setRoleColor] = useState<string | undefined>('#2563EB');

  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const fetchedRoles = await getRoles();
    setRoles(fetchedRoles);
  };

  const handleCreateRole = async (data: Role) => {
    try {
      if (data.name.trim() === '') {
        toast({
          title: 'Error',
          description: 'Vai trò không thể để trống',
          variant: 'destructive',
        });
        return;
      }
      if (data.name.length > 30) {
        toast({
          title: 'Error',
          description: 'Vai trò không thể dài quá 30 ký tự',
          variant: 'destructive',
        });
        return;
      }
      const newRole = await createRole({
        ...data,
        permissions: selectedPermissions as Permission[],
        color: roleColor,
      });
      setRoles([...roles, newRole]);
      reset();
      setSelectedPermissions([]);
      setRoleColor('#2563EB');
      toast({
        title: 'Role Created',
        description: `Role "${data.name}" Tạo thành công.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Tạo vai trò thất bại, hãy thử lại,',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateRole = async (data: Role) => {
    try {
      if (editingRole) {
        const updatedRole = await createRole({
          ...data,
          permissions: selectedPermissions as Permission[],
          color: roleColor,
        });
        const updatedRoles = roles.map((role) => (role.id === editingRole.id ? updatedRole : role));
        setRoles(updatedRoles);
        reset();
        setSelectedPermissions([]);
        setRoleColor('#2563EB');
        setEditingRole(undefined);
        toast({
          title: 'Role Updated',
          description: `Vai trò "${data.name}" đã được cập nhật thành công`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Vai trò cập nhật thất bại, hãy thử lại',
        variant: 'destructive',
      });
    }
  };

  const handleAssignRole = async (voter: Voter, roleId: number) => {
    try {
      await assignRoleToVoter(electionId, voter.phone, roleId);
      const updatedVoters = voters.map((v) => (v.id === voter.id ? { ...v, roleId } : v));
      dispatch(setVoters(updatedVoters));
      toast({
        title: 'Gán Vai Trò',
        description: `Vai trò đã được gán cho cử tri: ${voter.phone}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Thất Bại khi gán vai trò, thử lại.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteRole = (roleId: number) => {
    Swal.fire({
      title: 'Bạn Chắc Chưa ?',
      text: 'Bạn muốn xóa vai trò này chứ ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Vâng xóa nó!',
      cancelButtonText: 'Không, giữ nó',
    }).then((result) => {
      if (result.isConfirmed) {
        setRoles(roles.filter((role) => role.id !== roleId));
        toast({ title: 'Success', description: 'Xóa vai trò thành công!' });
      }
    });
  };

  const handleEditRole = (role: Role | undefined) => {
    setEditingRole(role); // Đảm bảo gọi `setEditingRole` đúng kiểu
    if (role) {
      reset({ name: role.name });
      setSelectedPermissions(role.permissions);
      setRoleColor(role.color ?? '');
    }
  };
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const filteredVoters = voters?.filter((voter) => {
    const name = String(voter.name || ''); // Chuyển name thành chuỗi, nếu undefined thì dùng ''
    const email = String(voter.email || ''); // Chuyển email thành chuỗi, nếu undefined thì dùng ''
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const exportRoles = () => {
    const csv = [
      ['ID', 'Name', 'Color', 'Permissions', 'Created At'],
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
      link.setAttribute('download', 'roles.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`container mx-auto p-4 ${darkMode ? 'dark' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gán Và Tạo Vai Trò Cho Cử Tri</h1>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} className="ml-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle {darkMode ? 'Light' : 'Dark'} Mode</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingRole ? 'Edit Role' : 'Cho phép tạo vai trò mới'}</CardTitle>
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
                {...register('name', { required: 'Phải nhập tên vai trò' })}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
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
              <Button type="button" variant="outline" onClick={() => setSelectedPermissions([])}>
                Hủy Chọn Tất Cả
              </Button>
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {editingRole ? 'Update Role' : 'Cập nhật vai trò'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gán Vai Trò Cho Cử Tri</CardTitle>
          <CardDescription>Quản lý vai trò của các cử tri đã đăng ký</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Search className="text-gray-400" />
              <Input
                placeholder="Tìm cử tri..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Button onClick={exportRoles} className="bg-blue-600 hover:bg-blue-700">
              <Download className="mr-2 h-4 w-4" /> Xuất Vai Trò
            </Button>
          </div>
          <VoterTable
            voters={filteredVoters}
            roles={roles}
            onAssignRole={handleAssignRole}
            onEditRole={handleEditRole} // Truyền một hàm xử lý phù hợp
            onDeleteRole={handleDeleteRole}
            isEditPage={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
