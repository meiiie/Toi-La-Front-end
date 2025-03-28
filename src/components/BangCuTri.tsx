'use client';

import React, { useState, useEffect } from 'react';
import { CuTri, VaiTro } from '../store/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import PaginationPhu from './PaginationPhu';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { Label } from './ui/Label';
import { Trash2 } from 'lucide-react';

interface VoterTableProps {
  voters: CuTri[];
  roles: VaiTro[];
  onAssignRole: (voter: CuTri, roleId: number) => void;
  onSaveChanges: (updatedVoters: CuTri[]) => void;
  onRemoveVoter: (id: number) => void;
  isEditPage: boolean;
}

export default function VoterTable({
  voters,
  roles,
  onAssignRole,
  onSaveChanges,
  onRemoveVoter,
  isEditPage,
}: VoterTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVoters, setSelectedVoters] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [updatedVoters, setUpdatedVoters] = useState<CuTri[]>([]);

  useEffect(() => {
    setUpdatedVoters(voters);
  }, [voters]);

  const itemsPerPage = 5;

  const indexOfLastVoter = currentPage * itemsPerPage;
  const indexOfFirstVoter = indexOfLastVoter - itemsPerPage;
  const currentVoters = updatedVoters.slice(indexOfFirstVoter, indexOfLastVoter);

  const totalPages = Math.ceil(updatedVoters.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleSelectAll = () => {
    const newSelectedVoters = new Set<number>();
    if (!selectAll) {
      currentVoters.forEach((voter) => newSelectedVoters.add(voter.id));
    }
    setSelectAll(!selectAll);
    setSelectedVoters(newSelectedVoters);
  };

  const handleCheckboxChange = (id: number) => {
    const newSelectedVoters = new Set(selectedVoters);
    if (newSelectedVoters.has(id)) {
      newSelectedVoters.delete(id);
    } else {
      newSelectedVoters.add(id);
    }
    setSelectedVoters(newSelectedVoters);
  };

  const handleBulkRemoveVoters = () => {
    const idsToRemove = Array.from(selectedVoters);
    idsToRemove.forEach((id) => onRemoveVoter(id));
    const newVoterList = updatedVoters.filter((voter) => !selectedVoters.has(voter.id));
    setUpdatedVoters(newVoterList);
    setSelectedVoters(new Set());
    setSelectAll(false);
  };

  const handleRoleChange = (voterId: number, roleId: number) => {
    const newVoterList = updatedVoters.map((voter) =>
      voter.id === voterId ? { ...voter, vaiTroId: roleId } : voter,
    );
    setUpdatedVoters(newVoterList);
    onAssignRole(newVoterList.find((voter) => voter.id === voterId)!, roleId);
  };

  const handleSaveChanges = () => {
    onSaveChanges(updatedVoters);
  };

  return (
    <div className="space-y-4 dark:bg-gray-800 dark:text-white rounded-lg p-4">
      <div className="flex items-center mb-4">
        {isEditPage && (
          <>
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              className="border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 ml-4"
            />
            <Label className="ml-2 text-gray-700 dark:text-gray-300">Chọn tất cả</Label>
            <Button
              onClick={handleBulkRemoveVoters}
              className="ml-auto bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa Hàng Loạt
            </Button>
          </>
        )}
      </div>
      <Table className="w-full rounded-lg">
        <TableHeader>
          <TableRow>
            {isEditPage && <TableHead>Chọn</TableHead>}
            <TableHead>Họ Tên</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Số điện thoại</TableHead>
            <TableHead>Vai Trò</TableHead>
            <TableHead>Trạng Thái</TableHead>
            {isEditPage && <TableHead>Hành Động</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentVoters.map((voter) => (
            <TableRow key={voter.id}>
              {isEditPage && (
                <TableCell>
                  <Checkbox
                    checked={selectedVoters.has(voter.id)}
                    onCheckedChange={() => handleCheckboxChange(voter.id)}
                    className="border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </TableCell>
              )}
              <TableCell>{voter.id}</TableCell>
              <TableCell>{voter.email}</TableCell>
              <TableCell>{voter.sdt}</TableCell>
              <TableCell>
                {roles.find((role) => role.id === voter.id)?.tenVaiTro || 'Chưa phân quyền'}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={voter.xacMinh ? 'default' : 'destructive'}>
                  {voter.xacMinh ? 'Hoạt động' : 'Đã bị hạn chế'}
                </Badge>
              </TableCell>
              {isEditPage && (
                <TableCell className="flex space-x-2">
                  <Select
                    onValueChange={(value) => handleRoleChange(voter.id, Number(value))}
                    defaultValue={voter.id?.toString()}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.tenVaiTro}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div
                    onClick={() => onRemoveVoter(voter.id)}
                    className="bg-red-500 hover:bg-red-600 text-white p-1 cursor-pointer rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {isEditPage && (
        <div className="flex justify-end mt-4">
          <Button onClick={handleSaveChanges} className="bg-blue-600 hover:bg-blue-700 text-white">
            Lưu Thay Đổi
          </Button>
        </div>
      )}

      <PaginationPhu
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
