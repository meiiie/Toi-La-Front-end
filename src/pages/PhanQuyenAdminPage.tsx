'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import {
  fetchAllTaiKhoanVaiTroAdmins,
  editTaiKhoanVaiTroAdmin,
  removeTaiKhoanVaiTroAdmin,
  searchTaiKhoanVaiTroAdminThunk,
} from '../store/slice/taiKhoanVaiTroAdminSlice';
import { fetchCacVaiTro } from '../store/slice/vaiTroSlice';
import { EnhancedUserSearch } from '../features/TimKiemVaiTroAdmin';
import { UserTable } from '../features/UserTable';
import { UserStats } from '../features/UserStats';
import { RoleManagement } from '../features/RoleManagement';
import SEO from '../components/SEO';

export default function UserRoleManagementPage() {
  const dispatch = useDispatch<AppDispatch>();
  const users = useSelector((state: RootState) => state.taiKhoanVaiTroAdmin.taiKhoanVaiTroAdmins);
  const roles = useSelector((state: RootState) => state.vaiTro.cacVaiTro);
  const [searchInput, setSearchInput] = useState('');
  const [searchType, setSearchType] = useState('tenDangNhap');
  const [message, setMessage] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);

  useEffect(() => {
    dispatch(fetchAllTaiKhoanVaiTroAdmins());
    dispatch(fetchCacVaiTro());
  }, [dispatch]);

  useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  const handleSearch = async () => {
    try {
      const searchParams: { tenDangNhap?: string; email?: string } = {};
      if (searchType === 'tenDangNhap') {
        searchParams.tenDangNhap = searchInput;
      } else if (searchType === 'email') {
        searchParams.email = searchInput;
      }

      const users = await dispatch(searchTaiKhoanVaiTroAdminThunk(searchParams)).unwrap();
      if (Array.isArray(users) && users.length > 0) {
        setMessage('');
      } else {
        setMessage('Không tìm thấy tài khoản. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error finding account:', error);
      setMessage('Đã xảy ra lỗi khi tìm kiếm tài khoản.');
    }
  };

  const handleRoleChange = async (userId: number, roleId: number) => {
    const user = users.find((user) => Number(user.id) === userId);
    if (user) {
      const updatedUser = { ...user, vaiTroId: roleId };
      await dispatch(
        editTaiKhoanVaiTroAdmin({ id: userId, taiKhoanVaiTroAdmin: updatedUser }),
      ).unwrap();
      handleSearch();
      dispatch(fetchAllTaiKhoanVaiTroAdmins());
    }
  };

  const handleDeleteUser = async (userId: number) => {
    await dispatch(removeTaiKhoanVaiTroAdmin(userId)).unwrap();
    dispatch(fetchAllTaiKhoanVaiTroAdmins());
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <SEO
        title="Quản lý Phân quyền Người dùng | Nền Tảng Bầu Cử Blockchain"
        description="Trang quản lý phân quyền người dùng trong hệ thống."
        keywords="quản lý, phân quyền, người dùng, hệ thống"
        author="Holihu"
        image="https://example.com/image.jpg"
        url="https://example.com/phan-quyen-admin"
      />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-200">
          Quản lý Phân quyền Người dùng
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <EnhancedUserSearch
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                handleSearch={handleSearch}
                message={message}
                searchType={searchType}
                setSearchType={setSearchType}
                setFilteredUsers={setFilteredUsers}
              />
            </div>
            <UserTable
              users={users}
              roles={roles}
              handleRoleChange={handleRoleChange}
              handleDeleteUser={handleDeleteUser}
              handleRestrictUser={handleRestrictUser}
              handleBanUser={handleBanUser}
              itemsPerPage={10}
              filteredUsers={filteredUsers}
            />
          </div>
          <div className="space-y-8">
            <RoleManagement roles={roles} />
            <UserStats users={users} />
          </div>
        </div>
      </div>
    </div>
  );
}
