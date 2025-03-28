import React, { useEffect, useState } from 'react';
import { ChucNang, VaiTroChucNang } from '../store/types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Switch } from '../components/ui/Switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from '../components/ui/AlterDialog';

interface RoleFormProps {
  roleName: string;
  setRoleName: (name: string) => void;
  roleColor: string;
  setRoleColor: (color: string) => void;
  permissions: ChucNang[];
  setPermissions: (permissions: ChucNang[] | ((prevPermissions: ChucNang[]) => ChucNang[])) => void;
  chucNangs: ChucNang[];
  editingRole: VaiTroChucNang | null;
  handleAddRole: () => void;
  handleUpdateRole: () => void;
}

const VaiTroForm: React.FC<RoleFormProps> = ({
  roleName,
  setRoleName,
  roleColor,
  setRoleColor,
  permissions,
  setPermissions,
  chucNangs,
  editingRole,
  handleAddRole,
  handleUpdateRole,
}) => {
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    if (editingRole) {
      setRoleName(editingRole.tenVaiTro || '');
      setPermissions(editingRole.chucNangs || []);
    }
  }, [editingRole, setRoleName, setPermissions]);

  const handlePermissionChange = (permission: ChucNang) => {
    setPermissions((prevPermissions: ChucNang[]) => {
      return prevPermissions.some((perm) => perm.id === permission.id)
        ? prevPermissions.filter((perm) => perm.id !== permission.id)
        : [...prevPermissions, permission];
    });
  };

  const handleAddRoleWithValidation = () => {
    if (roleName.trim() === '') {
      setAlertMessage('Tên vai trò không được để trống');
      setShowAlert(true);
      return;
    }
    if (permissions.length === 0) {
      setAlertMessage('Vai trò phải có ít nhất một chức năng');
      setShowAlert(true);
      return;
    }
    handleAddRole();
  };

  const handleUpdateRoleWithValidation = () => {
    if (roleName.trim() === '') {
      setAlertMessage('Tên vai trò không được để trống');
      setShowAlert(true);
      return;
    }
    if (permissions.length === 0) {
      setAlertMessage('Vai trò phải có ít nhất một chức năng');
      setShowAlert(true);
      return;
    }
    handleUpdateRole();
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center space-x-4">
        <Label htmlFor="roleName">Tên vai trò</Label>
        <Input
          id="roleName"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          maxLength={30}
          placeholder="Nhập tên vai trò"
          className="dark:bg-gray-700 dark:text-white"
          required
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
        <Label>Chức năng</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {chucNangs.map((permission) => (
            <TooltipProvider key={permission.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={permission.id.toString()}
                      checked={permissions.some((perm) => perm.id === permission.id)}
                      onCheckedChange={(checked) => handlePermissionChange(permission)}
                    />
                    <Label htmlFor={permission.id.toString()}>{permission.tenChucNang}</Label>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{permission.tenChucNang}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
      <div className="flex space-x-2">
        <Button onClick={() => setPermissions(chucNangs)}>Bật tất cả quyền</Button>
        <Button variant="outline" onClick={() => setPermissions([])}>
          Tắt tất cả quyền
        </Button>
      </div>
      <Button
        onClick={editingRole ? handleUpdateRoleWithValidation : handleAddRoleWithValidation}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {editingRole ? 'Cập nhật vai trò' : 'Tạo vai trò'}
      </Button>

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cảnh báo</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowAlert(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VaiTroForm;
