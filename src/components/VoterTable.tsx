'use client';

import React, { useState } from 'react';
import { Voter, Role } from '../store/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../components/ui/Pagination';

interface VoterTableProps {
  voters: Voter[];
  roles: Role[];
  onAssignRole: (voter: Voter, roleId: number) => void;
  onEditRole?: (role: Role | undefined) => void;
  onDeleteRole?: (roleId: number) => void;
  isEditPage: boolean; // New prop
}

export default function VoterTable({
  voters,
  roles,
  onAssignRole,
  onEditRole,
  onDeleteRole,
  isEditPage,
}: VoterTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const indexOfLastVoter = currentPage * itemsPerPage;
  const indexOfFirstVoter = indexOfLastVoter - itemsPerPage;
  const currentVoters = voters?.slice(indexOfFirstVoter, indexOfLastVoter);

  let totalPages = Math.ceil(voters?.length / itemsPerPage);
  if (!totalPages) {
    totalPages = 0;
  }
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="space-y-4 dark:bg-gray-800 dark:text-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Họ Tên</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Số điện thoại</TableHead>
            <TableHead>Vai Trò</TableHead>
            <TableHead>Trạng Thái</TableHead>
            {isEditPage && <TableHead>Hành Động</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentVoters?.map((voter) => (
            <TableRow key={voter.id}>
              <TableCell>{voter.name}</TableCell>
              <TableCell>{voter.email}</TableCell>
              <TableCell>{voter.phone}</TableCell>
              <TableCell>
                {roles.find((role) => role.id === voter.roleId)?.name || 'Chưa phân quyền'}
              </TableCell>
              <TableCell>
                <Badge variant={voter.isRestricted ? 'destructive' : 'default'}>
                  {voter.isRestricted ? 'Đã bị hạn chế' : 'Hoạt động'}
                </Badge>
              </TableCell>
              {isEditPage && (
                <TableCell>
                  <Select
                    onValueChange={(value) => onAssignRole(voter, Number(value))}
                    defaultValue={voter.roleId?.toString()}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            {currentPage > 1 ? (
              <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
            ) : (
              <PaginationItem>
                <span className="opacity-50 cursor-not-allowed">Trước</span>
              </PaginationItem>
            )}
          </PaginationItem>
          {[...Array(totalPages)].map((_, index) => (
            <PaginationItem key={index}>
              <PaginationLink
                onClick={() => handlePageChange(index + 1)}
                isActive={currentPage === index + 1}
              >
                {index + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            {currentPage < totalPages ? (
              <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
            ) : (
              <PaginationItem>
                <span className="opacity-50 cursor-not-allowed">Sau</span>
              </PaginationItem>
            )}
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
