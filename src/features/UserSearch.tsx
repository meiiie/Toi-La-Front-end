// src/components/UserSearch.tsx
import React from 'react';

interface UserSearchProps {
  searchInput: string;
  setSearchInput: (input: string) => void;
  handleSearch: () => void;
  message: string;
}

const UserSearch: React.FC<UserSearchProps> = ({
  searchInput,
  setSearchInput,
  handleSearch,
  message,
}) => {
  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="Nhập email hoặc số điện thoại"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="w-full p-3 border rounded mb-4"
      />
      <button
        onClick={handleSearch}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300"
      >
        Tìm kiếm
      </button>
      {message && <p className="text-red-500 mt-4 text-center">{message}</p>}
    </div>
  );
};

export default UserSearch;
