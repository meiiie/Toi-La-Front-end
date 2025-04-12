'use client';

import { useState, useEffect } from 'react';
import type { CuTri, VaiTro } from '../store/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { Input } from './ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/Card';
import {
  Trash2,
  Search,
  Mail,
  Phone,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckSquare,
  Save,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/Dialog';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [voterToDelete, setVoterToDelete] = useState<number | null>(null);

  useEffect(() => {
    setUpdatedVoters(voters);
  }, [voters]);

  const itemsPerPage = 10;

  // Filter voters based on search term and selected role
  const filteredVoters = updatedVoters.filter((voter) => {
    const matchesSearch =
      (voter.email && voter.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (voter.sdt && voter.sdt.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRole === 'all' || voter.vaiTroId?.toString() === selectedRole;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredVoters.length / itemsPerPage);
  const currentVoters = filteredVoters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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

  const confirmDelete = (id: number) => {
    setVoterToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (voterToDelete !== null) {
      onRemoveVoter(voterToDelete);
      setIsDeleteDialogOpen(false);
      setVoterToDelete(null);
    }
  };

  return (
    <Card className="bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-[#2A3A5A] overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <Users className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
          Danh sách cử tri
        </CardTitle>
        <CardDescription>Quản lý danh sách cử tri và phân quyền</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {/* Search and filter */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Tìm kiếm cử tri..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
              size={18}
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-44 bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]">
                <Filter className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                <SelectValue placeholder="Lọc theo vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.tenVaiTro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk actions */}
        {isEditPage && selectedVoters.size > 0 && (
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 border-b border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center">
              <CheckSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-blue-800 dark:text-blue-300">
                Đã chọn {selectedVoters.size} cử tri
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                onClick={() => setSelectedVoters(new Set())}
              >
                Bỏ chọn
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBulkRemoveVoters}>
                <Trash2 className="h-4 w-4 mr-1" />
                Xóa đã chọn
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-[#1A2942]">
              <TableRow>
                {isEditPage && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                      className="border-gray-300 dark:border-gray-600"
                    />
                  </TableHead>
                )}
                <TableHead>Email</TableHead>
                <TableHead>Số điện thoại</TableHead>
                <TableHead className="hidden md:table-cell">Vai trò</TableHead>
                <TableHead className="hidden md:table-cell">Trạng thái</TableHead>
                <TableHead className="hidden md:table-cell">Bỏ phiếu</TableHead>
                {isEditPage && <TableHead className="text-right">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentVoters.map((voter) => (
                <TableRow key={voter.id} className="hover:bg-gray-50 dark:hover:bg-[#1A2942]/50">
                  {isEditPage && (
                    <TableCell>
                      <Checkbox
                        checked={selectedVoters.has(voter.id)}
                        onCheckedChange={() => handleCheckboxChange(voter.id)}
                        className="border-gray-300 dark:border-gray-600"
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                      <span className="truncate max-w-[120px] sm:max-w-none">
                        {voter.email || 'Chưa có email'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                      {voter.sdt || 'Chưa có SĐT'}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {isEditPage ? (
                      <Select
                        value={voter.vaiTroId?.toString() || ''}
                        onValueChange={(value) => handleRoleChange(voter.id, Number(value))}
                      >
                        <SelectTrigger className="w-[180px] bg-white dark:bg-[#162A45]/80 border-gray-200 dark:border-[#2A3A5A]">
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
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/30"
                      >
                        {roles.find((role) => role.id === voter.vaiTroId)?.tenVaiTro ||
                          'Chưa phân quyền'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant={voter.xacMinh ? 'default' : 'secondary'}
                      className={
                        voter.xacMinh
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }
                    >
                      {voter.xacMinh ? 'Đã xác minh' : 'Chưa xác minh'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      variant={voter.boPhieu ? 'default' : 'secondary'}
                      className={
                        voter.boPhieu
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }
                    >
                      {voter.boPhieu ? 'Đã bỏ phiếu' : 'Chưa bỏ phiếu'}
                    </Badge>
                  </TableCell>
                  {isEditPage && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => confirmDelete(voter.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1 sm:mr-0" />
                        <span className="hidden sm:inline">Xóa</span>
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-0">
            Hiển thị {currentVoters.length} trong số {filteredVoters.length} cử tri
          </div>
          <div className="flex justify-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Trước</span>
            </Button>
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              const pageNumber =
                currentPage > 2 && totalPages > 3
                  ? currentPage -
                    1 +
                    i +
                    (currentPage + 1 > totalPages ? totalPages - currentPage - 1 : 0)
                  : i + 1;

              if (pageNumber <= totalPages) {
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNumber)}
                    className={`hidden sm:inline-flex ${
                      currentPage === pageNumber
                        ? 'bg-blue-600 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white'
                        : 'bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]'
                    }`}
                  >
                    {pageNumber}
                  </Button>
                );
              }
              return null;
            })}
            <span className="flex items-center text-sm text-gray-500 dark:text-gray-400 mx-1 sm:mx-2">
              {currentPage}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A]"
            >
              <span className="hidden sm:inline mr-1">Tiếp</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>

      {isEditPage && (
        <CardFooter className="flex justify-end bg-gray-50 dark:bg-[#1A2942]/50 p-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleSaveChanges}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white"
          >
            <Save className="mr-2 h-4 w-4" />
            Lưu Thay Đổi
          </Button>
        </CardFooter>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-gradient-to-br dark:from-[#162A45] dark:to-[#1A2942]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa cử tri này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
