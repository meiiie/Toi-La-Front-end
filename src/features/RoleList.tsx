// src/components/RoleList.tsx
import React, { useState, useMemo } from 'react';
import { Role } from '../store/types';
import PaginationPhu from '../components/PaginationPhu'; // Ensure this path is correct

interface RoleListProps {
  roles: Role[];
  handleEditRole: (role: Role) => void;
  handleDeleteRole: (roleId: number) => void;
  itemsPerPage: number;
}

const RoleList: React.FC<RoleListProps> = ({
  roles,
  handleEditRole,
  handleDeleteRole,
  itemsPerPage,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = useMemo(
    () => Math.ceil(roles.length / itemsPerPage),
    [roles.length, itemsPerPage],
  );

  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return roles.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, roles, itemsPerPage]);

  return (
    <div>
      {roles.length > 0 ? (
        <>
          <ul>
            {paginatedRoles.map((role: Role) => (
              <li key={role.id} className="mb-2 p-2 border rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">{role.name}</h3>
                    <p>Permissions: {role.permissions.join(', ')}</p>
                  </div>
                  <div>
                    <button
                      onClick={() => handleEditRole(role)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <PaginationPhu
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <p className="text-center text-gray-500">Không có vai trò nào được tạo.</p>
      )}
    </div>
  );
};

export default RoleList;
