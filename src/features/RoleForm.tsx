import React from 'react';
import { Permission, Role } from '../store/types';

interface RoleFormProps {
  roleName: string;
  setRoleName: (name: string) => void;
  permissions: Permission[];
  setPermissions: (
    permissions: Permission[] | ((prevPermissions: Permission[]) => Permission[]),
  ) => void;
  editingRole: Role | null;
  handleAddRole: () => void;
  handleUpdateRole: () => void;
}

const RoleForm: React.FC<RoleFormProps> = ({
  roleName,
  setRoleName,
  permissions,
  setPermissions,
  editingRole,
  handleAddRole,
  handleUpdateRole,
}) => {
  const permissionsList: Permission[] = ['view', 'vote', 'count', 'manage', 'admin'];

  const handlePermissionChange = (permission: Permission) => {
    setPermissions((prevPermissions: Permission[]) => {
      return prevPermissions.includes(permission)
        ? prevPermissions.filter((perm: Permission) => perm !== permission)
        : [...prevPermissions, permission];
    });
  };

  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Role Name"
        value={roleName}
        onChange={(e) => setRoleName(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <div className="mb-2">
        <label className="block mb-1">Permissions:</label>
        {permissionsList.map((permission) => (
          <label key={permission} className="block">
            <input
              type="checkbox"
              checked={permissions.includes(permission)}
              onChange={() => handlePermissionChange(permission)}
              className="mr-2"
            />
            {permission.charAt(0).toUpperCase() + permission.slice(1)}
          </label>
        ))}
      </div>
      {editingRole ? (
        <button onClick={handleUpdateRole} className="bg-blue-500 text-white px-4 py-2 rounded">
          Update Role
        </button>
      ) : (
        <button onClick={handleAddRole} className="bg-blue-500 text-white px-4 py-2 rounded">
          Add Role
        </button>
      )}
    </div>
  );
};

export default RoleForm;
