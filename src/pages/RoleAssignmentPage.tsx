// src/pages/RoleAssignmentPage.tsx
import React, { useState, useEffect } from 'react';
import { User, Role } from '../store/types';
import { getUsers, updateUser, searchUsers, deleteUser } from '../api/userApi';
import { getRoles } from '../api/roleApi';
import UserSearch from '../features/UserSearch';
import UserTable from '../features/UserTable';

const RoleAssignmentPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [foundUsers, setFoundUsers] = useState<User[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    const roles = await getRoles();
    setRoles(roles);
  };

  const fetchUsers = async () => {
    const users = await getUsers();
    setUsers(users);
  };

  const handleSearch = async () => {
    try {
      const users = await searchUsers({ name: searchInput });
      if (users.length > 0) {
        setFoundUsers(users);
        setMessage('');
      } else {
        setFoundUsers([]);
        setMessage('Không tìm thấy tài khoản. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error finding account:', error);
      setMessage('Đã xảy ra lỗi khi tìm kiếm tài khoản.');
    }
  };

  const handleRoleChange = async (userId: number, roleId: number) => {
    const user = foundUsers.find((user) => user.id === userId);
    if (user) {
      const updatedUser = { ...user, roles: [roles.find((role) => role.id === roleId)!] };
      await updateUser(userId, updatedUser);
      handleSearch();
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId: number) => {
    await deleteUser(userId);
    fetchUsers();
  };

  const handleRestrictUser = async (userId: number) => {
    // Logic to restrict user
    console.log(`Restrict user with ID: ${userId}`);
  };

  const handleBanUser = async (userId: number) => {
    // Logic to ban user
    console.log(`Ban user with ID: ${userId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Phân quyền người dùng</h1>
      <UserSearch
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        handleSearch={handleSearch}
        message={message}
      />
      <ul className="space-y-4 mb-8">
        {foundUsers.map((user) => (
          <li key={user.id} className="p-4 bg-gray-100 rounded shadow">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <p>Vai trò hiện tại: {user.roles.map((role) => role.name).join(', ')}</p>
              </div>
              <div>
                <select
                  value={user.roles[0]?.id || ''}
                  onChange={(e) => handleRoleChange(user.id, Number(e.target.value))}
                  className="p-2 border rounded"
                >
                  <option value="">Chọn vai trò</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <h2 className="text-2xl font-bold mb-4 text-center">
        Danh sách người dùng đã được phân quyền
      </h2>
      <UserTable
        users={users}
        roles={roles}
        handleRoleChange={handleRoleChange}
        handleDeleteUser={handleDeleteUser}
        handleRestrictUser={handleRestrictUser}
        handleBanUser={handleBanUser}
        itemsPerPage={10} // Số lượng người dùng mỗi trang
      />
    </div>
  );
};

export default RoleAssignmentPage;
