// src/components/UserActions.tsx
import React from 'react';
import { Role } from '../store/types';

interface UserActionsProps {
  userId: number;
  roles: Role[];
  currentRoleId: number;
  handleRoleChange: (userId: number, roleId: number) => void;
  handleDeleteUser: (userId: number) => void;
  handleRestrictUser: (userId: number) => void;
  handleBanUser: (userId: number) => void;
}

const UserActions: React.FC<UserActionsProps> = ({
  userId,
  roles,
  currentRoleId,
  handleRoleChange,
  handleDeleteUser,
  handleRestrictUser,
  handleBanUser,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <select
        value={currentRoleId || ''}
        onChange={(e) => handleRoleChange(userId, Number(e.target.value))}
        className="p-2 border rounded"
      >
        <option value="">Chọn vai trò</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
      <button
        onClick={() => handleDeleteUser(userId)}
        className="bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition-colors duration-300"
      >
        Xóa
      </button>
      <button
        onClick={() => handleRestrictUser(userId)}
        className="bg-yellow-500 text-white px-2 py-1 rounded-lg hover:bg-yellow-600 transition-colors duration-300"
      >
        Hạn chế
      </button>
      <button
        onClick={() => handleBanUser(userId)}
        className="bg-gray-500 text-white px-2 py-1 rounded-lg hover:bg-gray-600 transition-colors duration-300"
      >
        Cấm
      </button>
    </div>
  );
};

export default UserActions;
