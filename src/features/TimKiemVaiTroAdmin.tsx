'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Search, X, Tag, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/Popover';
import { fetchCacVaiTro } from '../store/slice/vaiTroSlice';
import type { AppDispatch, RootState } from '../store/store';

interface EnhancedUserSearchProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  handleSearch: () => void;
  message: string;
  searchType: string;
  setSearchType: (value: string) => void;
  setFilteredUsers: (users: any[]) => void;
}

export const EnhancedUserSearch: React.FC<EnhancedUserSearchProps> = ({
  searchInput,
  setSearchInput,
  handleSearch,
  message,
  searchType,
  setSearchType,
  setFilteredUsers,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const roles = useSelector((state: RootState) => state.vaiTro.cacVaiTro);
  const users = useSelector((state: RootState) => state.taiKhoanVaiTroAdmin.taiKhoanVaiTroAdmins);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');

  useEffect(() => {
    dispatch(fetchCacVaiTro());
  }, [dispatch]);

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const clearTags = () => {
    setTags([]);
  };

  const filterUsersByTags = (usersToFilter: any[]) => {
    if (tags.length === 0) {
      return usersToFilter;
    } else {
      return usersToFilter.filter((user) =>
        tags.some((tag) => user.tenVaiTro && user.tenVaiTro.includes(tag)),
      );
    }
  };

  const handleSearchClick = () => {
    let filteredUsers = users;

    if (searchInput) {
      if (searchType === 'tenDangNhap') {
        filteredUsers = filteredUsers.filter((user) =>
          user.tenDangNhap.toLowerCase().includes(searchInput.toLowerCase()),
        );
      } else if (searchType === 'email') {
        filteredUsers = filteredUsers.filter((user) =>
          user.email.toLowerCase().includes(searchInput.toLowerCase()),
        );
      }
    }

    filteredUsers = filterUsersByTags(filteredUsers);
    setFilteredUsers(filteredUsers);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        Tìm kiếm Người dùng
      </h2>
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
        <Select value={searchType} onValueChange={setSearchType}>
          <SelectTrigger className="w-full md:w-[180px] dark:bg-gray-700 dark:text-white">
            <SelectValue placeholder="Loại tìm kiếm" />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800 dark:text-white">
            <SelectItem value="tenDangNhap">Tên đăng nhập</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder={`Tìm kiếm theo ${searchType === 'tenDangNhap' ? 'tên đăng nhập' : 'email'}`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-10 dark:bg-gray-700 dark:text-white"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
        </div>
        <Button
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
          onClick={handleSearchClick}
        >
          Tìm kiếm
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          >
            {tag}
            <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
          </Badge>
        ))}
      </div>
      <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
        <Input
          type="text"
          placeholder="Thêm hashtag"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              addTag(newTag);
            }
          }}
          className="w-full md:w-auto dark:bg-gray-700 dark:text-white"
        />
        <Button
          variant="outline"
          className="w-full md:w-auto dark:border-gray-700 dark:text-gray-200"
          onClick={() => addTag(newTag)}
        >
          <Tag className="mr-2 h-4 w-4" />
          Thêm
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full md:w-auto dark:border-gray-700 dark:text-gray-200"
            >
              <Filter className="mr-2 h-4 w-4" />
              Hashtag có sẵn
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 dark:bg-gray-800 dark:text-white">
            <div className="grid gap-2">
              {roles.map((role) => (
                <Button
                  key={role.id}
                  variant="ghost"
                  className="justify-start dark:text-gray-200"
                  onClick={() => addTag(role.tenVaiTro)}
                >
                  {role.tenVaiTro}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          className="w-full md:w-auto dark:border-gray-700 dark:text-gray-200"
          onClick={clearTags}
        >
          Xóa tất cả hashtag
        </Button>
      </div>
      {message && (
        <p className="mt-4 text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900 p-2 rounded">
          {message}
        </p>
      )}
    </div>
  );
};
