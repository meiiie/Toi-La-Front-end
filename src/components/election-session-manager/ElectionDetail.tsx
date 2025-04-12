'use client';

import type React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Shield,
  Calendar,
  Zap,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Loader,
  AlertCircle,
} from 'lucide-react';
import type { CuocBauCu } from '../../store/types';
import { useToast } from '../../test/components/use-toast';

interface ElectionDetailProps {
  selectedElection: CuocBauCu;
  electionStatus: {
    isOwner: boolean;
    isActive: boolean;
    hasBanToChucRole: boolean;
  };
  checkElectionPermissions: () => void;
  isCheckingPermission: boolean;
}

const ElectionDetail: React.FC<ElectionDetailProps> = ({
  selectedElection,
  electionStatus,
  checkElectionPermissions,
  isCheckingPermission,
}) => {
  const { toast } = useToast();

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

  return (
    <Card className="border-t-4 border-cyan-500 dark:border-cyan-600 bg-gradient-to-br from-white to-cyan-50 dark:from-[#162A45]/90 dark:to-[#1A2942]/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-gray-800 dark:text-gray-100">
          <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          Chi Tiết Cuộc Bầu Cử Đã Chọn
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Thông tin chi tiết về cuộc bầu cử {selectedElection.tenCuocBauCu}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Tên cuộc bầu cử
              </h3>
              <p className="text-base font-medium text-gray-900 dark:text-white break-words">
                {selectedElection.tenCuocBauCu}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mô tả</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                {selectedElection.moTa || 'Chưa có mô tả'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Thời gian</h3>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(selectedElection.ngayBatDau)} -{' '}
                    {formatDate(selectedElection.ngayKetThuc)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Địa chỉ blockchain
              </h3>
              <div className="flex items-center mt-1">
                <p className="text-sm font-mono text-gray-900 dark:text-white truncate">
                  {selectedElection.blockchainAddress}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 ml-1"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedElection.blockchainAddress || '');
                    toast({
                      title: 'Đã sao chép',
                      description: 'Địa chỉ blockchain đã được sao chép vào clipboard',
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {selectedElection.blockchainAddress && (
                  <a
                    href={`https://explorer.holihu.online/address/${selectedElection.blockchainAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 flex items-center justify-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Trạng thái cuộc bầu cử
              </h3>
              <div className="flex items-center mt-1">
                <Badge
                  className={
                    selectedElection.trangThai === 'Đang diễn ra'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : selectedElection.trangThai === 'Sắp diễn ra'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }
                >
                  {selectedElection.trangThai === 'Đang diễn ra' && (
                    <Zap className="h-3.5 w-3.5 mr-1" />
                  )}
                  {selectedElection.trangThai === 'Sắp diễn ra' && (
                    <Clock className="h-3.5 w-3.5 mr-1" />
                  )}
                  {selectedElection.trangThai === 'Đã kết thúc' && (
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  )}
                  {selectedElection.trangThai}
                </Badge>

                {electionStatus.isActive ? (
                  <Badge className="ml-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Đã bắt đầu (Blockchain)
                  </Badge>
                ) : (
                  <Badge className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    Chưa bắt đầu (Blockchain)
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Quyền của bạn
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {electionStatus.isOwner ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Chủ sở hữu
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Không phải chủ sở hữu
                  </Badge>
                )}

                {electionStatus.hasBanToChucRole ? (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Có quyền Ban Tổ Chức
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Không có quyền Ban Tổ Chức
                  </Badge>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={checkElectionPermissions}
                  disabled={isCheckingPermission || !selectedElection.blockchainAddress}
                >
                  {isCheckingPermission ? (
                    <Loader className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  )}
                  Kiểm tra quyền
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElectionDetail;
