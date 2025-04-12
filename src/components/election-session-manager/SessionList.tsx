'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alter';
import { Badge } from '../../components/ui/Badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  ClipboardList,
  Info,
  Calendar,
  Zap,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { CuocBauCu, PhienBauCu } from '../../store/types';

interface SessionListProps {
  sessionsList: PhienBauCu[];
  selectedElection: CuocBauCu | null;
  selectedSessionId: number | null;
  handleSessionSelect: (id: string) => void;
}

const SessionList: React.FC<SessionListProps> = ({
  sessionsList,
  selectedElection,
  selectedSessionId,
  handleSessionSelect,
}) => {
  // Format date - Wrapped in useMemo
  const formatDate = useMemo(
    () =>
      (dateString: string): string => {
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch (error) {
          return dateString;
        }
      },
    [],
  );

  // Generate table rows with useMemo to prevent unnecessary re-renders
  const tableRows = useMemo(() => {
    if (sessionsList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <ClipboardList className="h-10 w-10 mb-2 opacity-40" />
              <p>Không có phiên bầu cử nào trong cuộc bầu cử này</p>
              <p className="text-sm">Vui lòng tạo phiên bầu cử mới hoặc chọn cuộc bầu cử khác</p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return sessionsList.map((session) => (
      <TableRow
        key={session.id}
        className={`cursor-pointer transition-colors ${
          selectedSessionId === session.id
            ? 'bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
        onClick={() => handleSessionSelect(session.id.toString())}
      >
        <TableCell className="font-medium">{session.id}</TableCell>
        <TableCell>
          <div className="font-medium">{session.tenPhienBauCu}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
            {session.moTa || 'Không có mô tả'}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col text-sm">
            <span className="whitespace-nowrap">
              <Calendar className="inline-block h-3.5 w-3.5 mr-1 text-gray-500 dark:text-gray-400" />
              {formatDate(session.ngayBatDau)}
            </span>
            <span className="whitespace-nowrap">
              <Calendar className="inline-block h-3.5 w-3.5 mr-1 text-gray-500 dark:text-gray-400" />
              {formatDate(session.ngayKetThuc)}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-center">
          <Badge
            className={
              session.trangThai === 'Đang diễn ra'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : session.trangThai === 'Sắp diễn ra'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
            }
          >
            {session.trangThai === 'Đang diễn ra' && <Zap className="h-3.5 w-3.5 mr-1" />}
            {session.trangThai === 'Sắp diễn ra' && <Clock className="h-3.5 w-3.5 mr-1" />}
            {session.trangThai === 'Đã kết thúc' && <CheckCircle className="h-3.5 w-3.5 mr-1" />}
            {session.trangThai}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          {session.trangThai ? (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Đã bắt đầu
            </Badge>
          ) : (
            <Badge variant="outline">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Chưa bắt đầu
            </Badge>
          )}
        </TableCell>
      </TableRow>
    ));
  }, [sessionsList, selectedSessionId, handleSessionSelect, formatDate]);

  // Memoized table content
  const tableContent = useMemo(() => {
    if (!selectedElection) {
      return (
        <Alert className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Chưa chọn cuộc bầu cử</AlertTitle>
          <AlertDescription>
            Vui lòng chọn một cuộc bầu cử từ tab "Cuộc Bầu Cử" để xem danh sách phiên bầu cử.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Tên Phiên Bầu Cử</TableHead>
                <TableHead className="w-[200px]">Thời Gian</TableHead>
                <TableHead className="w-[160px] text-center">Trạng Thái</TableHead>
                <TableHead className="w-[140px] text-center">Blockchain</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{tableRows}</TableBody>
          </Table>
        </div>

        {sessionsList.length === 0 && selectedElection && (
          <Alert className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle>Không có phiên bầu cử</AlertTitle>
            <AlertDescription>
              Cuộc bầu cử này chưa có phiên bầu cử nào. Vui lòng tạo phiên bầu cử mới.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }, [selectedElection, sessionsList, tableRows]);

  // Define skeleton for loading state
  const loadingSkeleton = useMemo(
    () => (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center p-8">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-48 mt-4" />
          <Skeleton className="h-3 w-32 mt-2" />
          <Skeleton className="h-3 w-64 mt-4" />
        </div>
      </div>
    ),
    [],
  );

  return (
    <Card className="border-t-4 border-indigo-500 dark:border-indigo-600 bg-gradient-to-br from-white to-indigo-50 dark:from-[#162A45]/90 dark:to-[#1A1B48]/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-800 dark:text-gray-100">
          <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          Danh Sách Phiên Bầu Cử
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {selectedElection
            ? `Phiên bầu cử của cuộc bầu cử: ${selectedElection.tenCuocBauCu}`
            : 'Vui lòng chọn cuộc bầu cử trước'}
        </CardDescription>
      </CardHeader>
      <CardContent>{tableContent}</CardContent>
    </Card>
  );
};

// Wrap component with React.memo to prevent unnecessary re-renders
export default React.memo(SessionList);
