'use client';

import type React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  BarChart,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Shield,
  Loader,
} from 'lucide-react';
import type { CuocBauCu } from '../store/types';
import { TrangThaiBlockchain } from '../store/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';

interface ElectionCardProps {
  election: CuocBauCu;
  onDelete: () => void;
  theme?: 'light' | 'dark';
}

const CardQuanLyCuocBauCu: React.FC<ElectionCardProps> = ({
  election,
  onDelete,
  theme = 'dark',
}) => {
  const navigate = useNavigate();

  // Parse Vietnamese date format (dd/mm/yyyy hh:mm)
  const parseVietnameseDate = (dateStr: string) => {
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute] = timePart.split(':');
    return new Date(+year, +month - 1, +day, +hour, +minute);
  };

  // Xác định trạng thái cuộc bầu cử
  const getElectionStatus = () => {
    const now = new Date();
    const startDate = parseVietnameseDate(election.ngayBatDau);
    const endDate = parseVietnameseDate(election.ngayKetThuc);

    if (now < startDate) {
      return {
        status: 'Sắp diễn ra',
        color: 'blue',
        icon: <Clock className="h-4 w-4" />,
      };
    }
    if (now > endDate) {
      return {
        status: 'Đã kết thúc',
        color: 'gray',
        icon: <AlertTriangle className="h-4 w-4" />,
      };
    }
    return {
      status: 'Đang diễn ra',
      color: 'green',
      icon: <CheckCircle className="h-4 w-4" />,
    };
  };

  // Xác định trạng thái blockchain của cuộc bầu cử
  const getBlockchainStatus = () => {
    const trangThai =
      election.trangThaiBlockchain !== undefined
        ? election.trangThaiBlockchain
        : TrangThaiBlockchain.ChuaTrienKhai;

    switch (trangThai) {
      case TrangThaiBlockchain.ChuaTrienKhai:
        return {
          text: 'Chưa triển khai',
          color:
            theme === 'dark'
              ? 'bg-yellow-900/30 text-yellow-200 border-yellow-800/30'
              : 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Shield size={14} className="mr-1" />,
        };
      case TrangThaiBlockchain.DangTrienKhai:
        return {
          text: 'Đang triển khai',
          color:
            theme === 'dark'
              ? 'bg-indigo-900/30 text-indigo-200 border-indigo-800/30'
              : 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: <Loader size={14} className="mr-1 animate-spin" />,
        };
      case TrangThaiBlockchain.DaTrienKhai:
        return {
          text: 'Đã triển khai',
          color:
            theme === 'dark'
              ? 'bg-emerald-900/30 text-emerald-200 border-emerald-800/30'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <CheckCircle size={14} className="mr-1" />,
        };
      case TrangThaiBlockchain.TrienKhaiThatBai:
        return {
          text: 'Triển khai thất bại',
          color:
            theme === 'dark'
              ? 'bg-red-900/30 text-red-200 border-red-800/30'
              : 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertTriangle size={14} className="mr-1" />,
        };
      default:
        return {
          text: 'Chưa triển khai',
          color:
            theme === 'dark'
              ? 'bg-yellow-900/30 text-yellow-200 border-yellow-800/30'
              : 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Shield size={14} className="mr-1" />,
        };
    }
  };

  const { status, color, icon } = getElectionStatus();
  const blockchainStatus = getBlockchainStatus();

  // Rút gọn địa chỉ blockchain
  const formatBlockchainAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
  };

  const handleManageClick = () => {
    navigate(`/app/user-elections/elections/${election.id}/election-management`);
  };

  return (
    <Card
      className={`h-full overflow-hidden ${theme === 'dark' ? 'bg-[#162A45] border-[#2A3A5A]' : 'bg-white border-gray-200'} rounded-xl shadow-sm hover:shadow-md transition-all duration-300`}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className={`text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            {election.tenCuocBauCu}
          </CardTitle>
          <div className="flex flex-col gap-2">
            <Badge
              className={`
                ${
                  color === 'blue'
                    ? theme === 'dark'
                      ? 'bg-blue-900/30 text-blue-400'
                      : 'bg-blue-100 text-blue-800'
                    : color === 'green'
                      ? theme === 'dark'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-green-100 text-green-800'
                      : theme === 'dark'
                        ? 'bg-gray-800 text-gray-400'
                        : 'bg-gray-100 text-gray-800'
                }
              `}
            >
              <span className="flex items-center gap-1">
                {icon}
                {status}
              </span>
            </Badge>
            <Badge className={`flex items-center ${blockchainStatus.color} border`}>
              {blockchainStatus.icon}
              {blockchainStatus.text}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className={`space-y-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="text-sm">
              {election.ngayBatDau} - {election.ngayKetThuc}
            </span>
          </div>

          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{election.soLuongUngVien || 0} ứng viên</span>
          </div>

          <div className="flex items-center">
            <BarChart className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{election.tongSoPhieuBau || 0} phiếu bầu</span>
          </div>

          {/* Blockchain Address (if available) */}
          {election.blockchainAddress && (
            <div className="flex items-start">
              <Shield className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-sm">Blockchain: </span>
                <span className="font-mono text-xs break-all">
                  {formatBlockchainAddress(election.blockchainAddress)}
                </span>
              </div>
            </div>
          )}

          {election.moTa && (
            <p
              className={`text-sm mt-4 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
            >
              {election.moTa}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between pt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={handleManageClick}
                className={`${theme === 'dark' ? 'bg-[#1A2942] border-[#2A3A5A] text-white hover:bg-[#243656]' : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'} rounded-xl`}
              >
                Quản lý
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Quản lý cuộc bầu cử</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="destructive" onClick={onDelete} className="rounded-xl">
                <Trash2 className="h-4 w-4 mr-1" />
                Xóa
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Xóa cuộc bầu cử</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

export default CardQuanLyCuocBauCu;
