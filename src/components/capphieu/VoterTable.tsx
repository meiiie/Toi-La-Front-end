import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import { Checkbox } from '../../components/ui/Checkbox';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Mail,
  Phone,
  User,
  Users,
  Filter,
  Ticket,
  Copy,
  ExternalLink,
  BadgeCheck,
  AlertCircle,
  Loader,
  XCircle,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/Tooltip';
import { useToast } from '../../test/components/use-toast';
import { CuTri } from './VoterContext';

interface VoterTableProps {
  voters: CuTri[];
  totalVoters: number;
  selectedVoters: number[];
  isLoadingVoters: boolean;
  isInitialLoading: boolean;
  areAllVotersSelectedOnPage: boolean;
  onToggleVoter: (voterId: number) => void;
  onToggleAll: () => void;
  onSendBallot: (voterId: number) => void;
  sessionActive: boolean;
  sessionKeyAvailable: boolean;
  isSendingBulkTickets: boolean;
}

const VoterTable: React.FC<VoterTableProps> = ({
  voters,
  totalVoters,
  selectedVoters,
  isLoadingVoters,
  isInitialLoading,
  areAllVotersSelectedOnPage,
  onToggleVoter,
  onToggleAll,
  onSendBallot,
  sessionActive,
  sessionKeyAvailable,
  isSendingBulkTickets,
}) => {
  const { toast } = useToast();

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: 'Đã sao chép địa chỉ ví',
    });
  };

  if (isInitialLoading) {
    return (
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[56px]">
                <Checkbox checked={false} disabled aria-label="Chọn tất cả" />
              </TableHead>
              <TableHead className="w-[56px]">#</TableHead>
              <TableHead className="w-[180px]">Thông tin liên hệ</TableHead>
              <TableHead className="w-[140px]">Địa chỉ ví</TableHead>
              <TableHead className="w-[120px] text-center">Phiếu bầu</TableHead>
              <TableHead className="w-[120px] text-center">Trạng thái</TableHead>
              <TableHead className="w-[120px]">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="h-60 text-center">
                <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <Loader className="h-12 w-12 mb-4 opacity-40 animate-spin text-emerald-500 dark:text-emerald-400" />
                  <p className="text-base">
                    Đang tải danh sách cử tri và kiểm tra trạng thái blockchain...
                  </p>
                  <p className="text-sm mt-2">Quá trình này có thể mất vài giây</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[56px]">
              <Checkbox
                checked={areAllVotersSelectedOnPage}
                onCheckedChange={onToggleAll}
                aria-label="Chọn tất cả"
              />
            </TableHead>
            <TableHead className="w-[56px]">#</TableHead>
            <TableHead className="w-[180px]">Thông tin liên hệ</TableHead>
            <TableHead className="w-[140px]">Địa chỉ ví</TableHead>
            <TableHead className="w-[120px] text-center">Phiếu bầu</TableHead>
            <TableHead className="w-[120px] text-center">Trạng thái</TableHead>
            <TableHead className="w-[120px]">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoadingVoters ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <Loader className="h-8 w-8 mb-2 opacity-40 animate-spin text-emerald-500 dark:text-emerald-400" />
                  <p>Đang tải danh sách cử tri...</p>
                </div>
              </TableCell>
            </TableRow>
          ) : voters.length > 0 ? (
            voters.map((voter) => (
              <TableRow key={voter.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedVoters.includes(voter.id)}
                    onCheckedChange={() => onToggleVoter(voter.id)}
                    aria-label={`Chọn cử tri ${voter.id}`}
                    disabled={voter.hasBlockchainWallet}
                  />
                </TableCell>
                <TableCell className="font-medium">{voter.id}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {voter.email && (
                      <div
                        className="font-medium truncate max-w-[180px] flex items-center"
                        title={voter.email}
                      >
                        <Mail className="h-3.5 w-3.5 mr-1 text-gray-400" />
                        {voter.email}
                      </div>
                    )}
                    {voter.sdt && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <Phone className="h-3.5 w-3.5 mr-1 inline-block" />
                        {voter.sdt}
                      </div>
                    )}
                    {voter.voterName && (
                      <div className="text-sm font-medium">
                        <User className="h-3.5 w-3.5 mr-1 inline-block text-gray-400" />
                        {voter.voterName}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {voter.blockchainAddress ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="inline-flex">
                          <span className="font-mono text-xs truncate max-w-[140px]">
                            {voter.blockchainAddress.substring(0, 6)}...
                            {voter.blockchainAddress.substring(voter.blockchainAddress.length - 4)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs">
                            <p className="font-mono text-xs break-all">{voter.blockchainAddress}</p>
                            <div className="flex mt-1 gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(voter.blockchainAddress || '');
                                }}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                <span>Sao chép</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(
                                    `https://explorer.holihu.online/address/${voter.blockchainAddress}`,
                                    '_blank',
                                  );
                                }}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                <span>Xem</span>
                              </Button>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">Chưa có</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {voter.hasBlockchainWallet ? (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      <Ticket className="h-3.5 w-3.5 mr-1" />
                      Đã cấp
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-gray-200 dark:border-gray-700">
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Chưa cấp
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {voter.xacMinh ? (
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                      Đã xác minh
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-200 dark:border-amber-800/50">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      Chưa xác minh
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    {voter.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`mailto:${voter.email}`, '_blank');
                        }}
                        title="Gửi email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                    {!voter.hasBlockchainWallet && voter.blockchainAddress && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onSendBallot(voter.id)}
                        disabled={isSendingBulkTickets || !sessionActive || !sessionKeyAvailable}
                        title="Cấp phiếu"
                      >
                        <Ticket className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                {totalVoters === 0 ? (
                  <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <Users className="h-10 w-10 mb-2 opacity-40" />
                    <p>Không có cử tri nào trong phiên bầu cử này</p>
                    <p className="text-sm">Vui lòng thêm cử tri trước khi tiến hành bầu cử</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <Filter className="h-10 w-10 mb-2 opacity-40" />
                    <p>Không có cử tri nào phù hợp với bộ lọc</p>
                    <p className="text-sm">Vui lòng thử các bộ lọc khác</p>
                  </div>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default VoterTable;
