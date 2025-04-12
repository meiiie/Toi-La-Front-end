'use client';

import type React from 'react';
import { useState } from 'react';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/Tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';
import {
  Database,
  Info,
  Calendar,
  Zap,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import type { CuocBauCu } from '../../store/types';
import { testDirectElectionList } from '../../utils/blockchainTestUtils'; // Kiểm tra đường dẫn đúng

interface ElectionListProps {
  electionsList: CuocBauCu[];
  selectedElectionId: number | null;
  handleElectionSelect: (id: string) => void;
  scwAddress?: string;
  refreshData?: () => void; // Thêm refresh function
}

const ElectionList: React.FC<ElectionListProps> = ({
  electionsList,
  selectedElectionId,
  handleElectionSelect,
  scwAddress = '',
  refreshData,
}) => {
  // Local state
  const [isDebugVisible, setIsDebugVisible] = useState<boolean>(false);
  const [isTestingServers, setIsTestingServers] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Format date
  const formatDate = (dateString: string): string => {
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
  };

  // Debug function
  const handleDebugServerList = async () => {
    if (!scwAddress) {
      console.warn('SCW Address is empty, cannot test');
      return;
    }

    setIsTestingServers(true);
    try {
      const result = await testDirectElectionList(scwAddress);
      console.log('Server test result:', result);
      setTestResult(result);
      setIsDebugVisible(true);
    } catch (err) {
      console.error('Error testing servers:', err);
    } finally {
      setIsTestingServers(false);
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Đang diễn ra':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Sắp diễn ra':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Filter blockchain elections
  const blockchainElections = electionsList.filter(
    (election) => election.blockchainAddress && election.blockchainAddress !== '',
  );

  return (
    <Card className="border-t-4 border-purple-500 dark:border-purple-600 bg-gradient-to-br from-white to-purple-50 dark:from-[#162A45]/90 dark:to-[#1E1A29]/70">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-gray-800 dark:text-gray-100">
              <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Danh Sách Cuộc Bầu Cử Đã Triển Khai
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Chọn một cuộc bầu cử đã triển khai blockchain để quản lý
            </CardDescription>
          </div>

          <div className="flex gap-2">
            {refreshData && (
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Làm mới
              </Button>
            )}

            <Button
              onClick={handleDebugServerList}
              variant="outline"
              size="sm"
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              disabled={isTestingServers || !scwAddress}
            >
              {isTestingServers ? (
                <span className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Đang kiểm tra...
                </span>
              ) : (
                <span className="flex items-center">
                  <Terminal className="h-4 w-4 mr-2" />
                  Kiểm tra Server
                </span>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Hiển thị debug info nếu có kết quả test */}
        {isDebugVisible && testResult && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Thông tin debug:</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDebugVisible(false)}
                className="h-6 text-xs"
              >
                Đóng
              </Button>
            </div>
            <div className="text-xs font-mono space-y-1">
              <p>SCW Address: {scwAddress || 'N/A'}</p>
              <p>Test success: {testResult.success ? 'Thành công' : 'Thất bại'}</p>
              {testResult.success ? (
                <>
                  <p>Server count from blockchain: {testResult.count}</p>
                  <p>
                    Server IDs:{' '}
                    {testResult.servers?.map((s: any) => s.toString()).join(', ') || 'N/A'}
                  </p>
                </>
              ) : (
                <p className="text-red-500">Error: {testResult.error}</p>
              )}
              <div className="mt-2">
                <p>Frontend data:</p>
                <p>Total elections: {electionsList.length}</p>
                <p>Blockchain elections: {blockchainElections.length}</p>
              </div>
            </div>
          </div>
        )}

        {electionsList.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Tên Cuộc Bầu Cử</TableHead>
                    <TableHead className="w-[200px]">Thời Gian</TableHead>
                    <TableHead className="w-[160px] text-center">Trạng Thái</TableHead>
                    <TableHead className="w-[140px] text-center">Blockchain</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockchainElections.length > 0 ? (
                    blockchainElections.map((election) => (
                      <TableRow
                        key={election.id}
                        className={`cursor-pointer transition-colors ${
                          selectedElectionId === election.id
                            ? 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                        onClick={() => handleElectionSelect(election.id.toString())}
                      >
                        <TableCell className="font-medium">{election.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{election.tenCuocBauCu}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {election.moTa}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span className="whitespace-nowrap">
                              <Calendar className="inline-block h-3.5 w-3.5 mr-1 text-gray-500 dark:text-gray-400" />
                              {formatDate(election.ngayBatDau)}
                            </span>
                            <span className="whitespace-nowrap">
                              <Calendar className="inline-block h-3.5 w-3.5 mr-1 text-gray-500 dark:text-gray-400" />
                              {formatDate(election.ngayKetThuc)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={getStatusBadgeClass(election.trangThai || 'Chưa xác định')}
                          >
                            {election.trangThai === 'Đang diễn ra' && (
                              <Zap className="h-3.5 w-3.5 mr-1" />
                            )}
                            {election.trangThai === 'Sắp diễn ra' && (
                              <Clock className="h-3.5 w-3.5 mr-1" />
                            )}
                            {election.trangThai === 'Đã kết thúc' && (
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            )}
                            {election.trangThai}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {election.blockchainAddress ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    Đã triển khai
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="max-w-xs">
                                    <p className="font-mono text-xs break-all">
                                      {election.blockchainAddress}
                                    </p>
                                    <p className="text-xs mt-1">
                                      Trạng thái Blockchain: {election.trangThaiBlockchain}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Badge variant="outline">
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Chưa triển khai
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <Database className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-2" />
                          <p className="text-gray-500 dark:text-gray-400">
                            Không có cuộc bầu cử nào được tìm thấy
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {blockchainElections.length === 0 && (
              <Alert className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle>Không có cuộc bầu cử</AlertTitle>
                <AlertDescription>
                  Không tìm thấy cuộc bầu cử nào đã được triển khai lên blockchain. Vui lòng triển
                  khai cuộc bầu cử trước khi tiếp tục.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-8">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-4 w-48 mt-4" />
              <Skeleton className="h-3 w-32 mt-2" />
              <Skeleton className="h-3 w-64 mt-4" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ElectionList;
