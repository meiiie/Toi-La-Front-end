'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  fetchCacVaiTroChucNang,
  addVaiTroChucNang,
  editVaiTroChucNang,
  removeVaiTroChucNang,
} from '../store/slice/vaiTroChucNangSlice';
import { fetchCacChucNang } from '../store/slice/chucNangSlice';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { toast } from '../test/components/use-toast';
import { Download, Search, Filter } from 'lucide-react';
import Swal from 'sweetalert2';
import { VaiTroChucNang, ChucNang } from '../store/types';
import VaiTroForm from '../features/VaiTroForm';
import DanhSachVaiTro from '../features/DanhSachVaiTro';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import SEO from '../components/SEO';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../components/ui/Dropdown-Menu';

export default function RoleManagementPage() {
  const dispatch = useDispatch<AppDispatch>();
  const roleFunctions = useSelector((state: RootState) => state.vaiTroChucNang.cacVaiTroChucNang);
  const chucNangs = useSelector((state: RootState) => state.chucNang.cacChucNang);
  const [roleName, setRoleName] = useState('');
  const [roleColor, setRoleColor] = useState('#2563EB');
  const [selectedPermissions, setSelectedPermissions] = useState<ChucNang[]>([]);
  const [editingRole, setEditingRole] = useState<VaiTroChucNang | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tất cả');
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  const itemsPerPage = isMobile ? 5 : 10; // Show fewer items per page on mobile

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    dispatch(fetchCacVaiTroChucNang());
    dispatch(fetchCacChucNang());
  }, [dispatch]);

  useEffect(() => {
    if (editingRole) {
      setRoleName(editingRole.tenVaiTro || '');
      setRoleColor(roleColor);
      const functionNames = editingRole.chucNangs?.map((cn) => cn.tenChucNang) || [];
      const selectedPermissions = chucNangs.filter((cn) => functionNames.includes(cn.tenChucNang));
      setSelectedPermissions(selectedPermissions);
    } else {
      resetForm();
    }
  }, [editingRole, chucNangs, roleColor]);

  const handleAddRole = async () => {
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
    const newRoleFunction: Omit<VaiTroChucNang, 'id'> = {
      vaiTroId: 0,
      tenVaiTro: roleName,
      chucNangs: selectedPermissions,
    };
    await dispatch(addVaiTroChucNang(newRoleFunction)).unwrap();
    dispatch(fetchCacVaiTroChucNang());
    resetForm();
    toast({ title: 'Thành công', description: 'Đã tạo vai trò thành công!' });
  };

  const handleUpdateRole = async () => {
    if (editingRole) {
      const updatedRoleFunction: VaiTroChucNang = {
        id: editingRole.id,
        vaiTroId: editingRole.vaiTroId,
        tenVaiTro: roleName,
        chucNangs: selectedPermissions,
      };
      await dispatch(editVaiTroChucNang(updatedRoleFunction)).unwrap();
      dispatch(fetchCacVaiTroChucNang());
      resetForm();
      toast({ title: 'Thành công', description: 'Đã cập nhật vai trò thành công!' });
    }
  };

  const handleEditRole = (role: VaiTroChucNang | null) => {
    if (role && editingRoleId === role.id) {
      resetForm();
      return;
    }
    setEditingRole(role);
    setEditingRoleId(role ? role.id : null);

    // On mobile, scroll to form when editing
    if (isMobile && role) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: 'Bạn có muốn xóa vai trò này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Có, xóa nó!',
      cancelButtonText: 'Không, giữ lại',
    }).then(async (result: { isConfirmed: any }) => {
      if (result.isConfirmed) {
        await dispatch(removeVaiTroChucNang(roleId)).unwrap();
        dispatch(fetchCacVaiTroChucNang());
        toast({ title: 'Thành công', description: 'Đã xóa vai trò thành công!' });
      }
    });
  };

  const resetForm = () => {
    setRoleName('');
    setRoleColor('#2563EB');
    setSelectedPermissions([]);
    setEditingRole(null);
    setEditingRoleId(null);
  };

  const filteredRoles = roleFunctions.filter(
    (role) =>
      (role.tenVaiTro?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) &&
      (filterCategory === 'Tất cả' ||
        role.chucNangs?.some(
          (p) => chucNangs.find((perm) => perm.id === p.id)?.tenChucNang === filterCategory,
        )),
  );

  const exportRoles = () => {
    const csv = [
      ['ID', 'Tên', 'Quyền hạn'],
      ...roleFunctions.map((role) => [
        role.id,
        role.tenVaiTro,
        role.chucNangs?.map((cn) => cn.tenChucNang).join(', '),
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
    <div className="container mx-auto px-4 py-6 space-y-6 md:space-y-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <SEO
        title="Quản lý Vai trò Admin | Nền Tảng Bầu Cử Blockchain"
        description="Trang quản lý vai trò trong hệ thống quản lý."
        keywords="quản lý vai trò, hệ thống quản lý, vai trò, chức năng"
        author="Admin"
        url="https://example.com/quan-ly-vai-tro"
        image="./tai_xuong.jpg"
      />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-200">
          Quản lý vai trò
        </h1>
      </div>

      <Card className="bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700">
        <CardHeader className="bg-blue-50 dark:bg-blue-900 p-4 md:p-6">
          <CardTitle className="text-blue-800 dark:text-blue-200 text-lg md:text-xl">
            {editingRole ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <VaiTroForm
            roleName={roleName}
            setRoleName={setRoleName}
            roleColor={roleColor}
            setRoleColor={setRoleColor}
            permissions={selectedPermissions}
            setPermissions={setSelectedPermissions}
            chucNangs={chucNangs}
            editingRole={editingRole}
            handleAddRole={handleAddRole}
            handleUpdateRole={handleUpdateRole}
          />
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-700">
        <CardHeader className="bg-blue-50 dark:bg-blue-900 p-4 md:p-6">
          <CardTitle className="text-blue-800 dark:text-blue-200 text-lg md:text-xl">
            Quản lý vai trò
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col space-y-4 mb-4">
            {/* Search */}
            <div className="w-full">
              <div className="flex items-center border rounded-md px-3 py-1 bg-white dark:bg-gray-700">
                <Search className="text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm vai trò..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 focus:ring-0 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Filter and Export */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
              <div className="block w-full md:max-w-xs">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full md:w-auto flex items-center justify-between"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      <span>{filterCategory}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem onClick={() => setFilterCategory('Tất cả')}>
                      Tất cả
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterCategory('Quản lý hệ thống')}>
                      Quản lý hệ thống
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterCategory('Quản lý nội dung')}>
                      Quản lý nội dung
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterCategory('Quản lý cử tri')}>
                      Quản lý cử tri
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterCategory('Quản lý bầu cử')}>
                      Quản lý bầu cử
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button
                onClick={exportRoles}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto"
              >
                <Download className="mr-2 h-4 w-4" /> Xuất vai trò
              </Button>
            </div>
          </div>

          <div className="hidden md:block">
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
          </div>
          <DanhSachVaiTro
            roles={filteredRoles}
            handleEditRole={handleEditRole}
            handleDeleteRole={handleDeleteRole}
            itemsPerPage={itemsPerPage}
            roleColor={roleColor}
            editingRoleId={editingRoleId}
            setEditingRoleId={setEditingRoleId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
