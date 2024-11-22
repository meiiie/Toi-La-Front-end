// src/components/UserTable.tsx
import React, { useState, useMemo } from 'react';
import { User, Role } from '../store/types';
import UserActions from './UserActions';
import PaginationPhu from '../components/PaginationPhu'; // Ensure this path is correct

interface UserTableProps {
  users: User[];
  roles: Role[];
  handleRoleChange: (userId: number, roleId: number) => void;
  handleDeleteUser: (userId: number) => void;
  handleRestrictUser: (userId: number) => void;
  handleBanUser: (userId: number) => void;
  itemsPerPage: number;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  roles,
  handleRoleChange,
  handleDeleteUser,
  handleRestrictUser,
  handleBanUser,
  itemsPerPage,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = useMemo(
    () => Math.ceil(users.length / itemsPerPage),
    [users.length, itemsPerPage],
  );

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return users.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, users, itemsPerPage]);

  return (
    <div className="overflow-x-auto">
      {users.length > 0 ? (
        <>
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-3 px-4 border-b text-left">Tên</th>
                <th className="py-3 px-4 border-b text-left">Email</th>
                <th className="py-3 px-4 border-b text-left">Vai trò</th>
                <th className="py-3 px-4 border-b text-left">Quyền hạn</th>
                <th className="py-3 px-4 border-b text-left">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user: User) => (
                <tr key={user.id} className="hover:bg-gray-100 transition-colors duration-200">
                  <td className="py-3 px-4 border-b">{user.name}</td>
                  <td className="py-3 px-4 border-b">{user.account.email}</td>
                  <td className="py-3 px-4 border-b">
                    {user.roles.map((role) => role.name).join(', ')}
                  </td>
                  <td className="py-3 px-4 border-b">
                    {user.roles.flatMap((role) => role.permissions).join(', ')}
                  </td>
                  <td className="py-3 px-4 border-b">
                    <UserActions
                      userId={user.id}
                      roles={roles}
                      currentRoleId={user.roles[0]?.id || 0}
                      handleRoleChange={handleRoleChange}
                      handleDeleteUser={handleDeleteUser}
                      handleRestrictUser={handleRestrictUser}
                      handleBanUser={handleBanUser}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationPhu
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <p className="text-center text-gray-500">Không có người dùng nào được phân quyền.</p>
      )}
    </div>
  );
};

export default UserTable;
