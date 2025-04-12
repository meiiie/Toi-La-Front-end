// Tập hợp các component phụ trợ cho trang triển khai blockchain
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { Progress } from '../ui/Progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alter';

import {
  Wallet,
  Key,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Landmark,
  Shield,
  Calendar,
  Users,
  Info,
  Network,
  Link,
} from 'lucide-react';

// StatusCard: Hiển thị trạng thái triển khai hiện tại
export const StatusCard: React.FC<{
  status: string;
  progress: number;
  isLoading: boolean;
}> = ({ status, progress, isLoading }) => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Shield className="w-5 h-5 mr-2 text-primary" />
            Trạng Thái Triển Khai
          </CardTitle>
          <Badge
            variant={
              status === 'Triển khai thành công'
                ? 'default'
                : status === 'Triển khai thất bại'
                  ? 'destructive'
                  : 'secondary'
            }
          >
            {isLoading ? 'Đang xử lý...' : status}
          </Badge>
        </div>
        <CardDescription>Tiến độ triển khai hiện tại</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-2 flex justify-between items-center">
          <span className="text-sm font-medium">Tiến độ:</span>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardContent>
    </Card>
  );
};

// BlockchainAddressCard: Hiển thị địa chỉ blockchain
export const BlockchainAddressCard: React.FC<{
  address: string;
  label: string;
  onCopy: () => void;
}> = ({ address, label, onCopy }) => {
  return (
    <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-800/50 mb-4">
      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">{label}</h3>
      <div className="flex items-center">
        <code className="text-xs bg-white/70 dark:bg-gray-800/70 p-2 rounded font-mono flex-1 overflow-hidden text-ellipsis">
          {address}
        </code>
        <Button variant="ghost" size="sm" className="ml-2 h-8 w-8" onClick={onCopy}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-1 h-8 w-8 text-blue-600 dark:text-blue-400"
          asChild
        >
          <a
            href={`https://explorer.holihu.online/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
};

// SessionKeyInfoCard: Hiển thị thông tin khóa phiên
export const SessionKeyInfoCard: React.FC<{
  address: string;
  expiresAt: number;
  onGetSessionKey: () => void;
  isLoading: boolean;
}> = ({ address, expiresAt, onGetSessionKey, isLoading }) => {
  const isExpired = expiresAt * 1000 < Date.now();
  const hoursLeft = Math.floor((expiresAt * 1000 - Date.now()) / (1000 * 60 * 60));

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Key className="w-5 h-5 mr-2 text-primary" />
          Khóa Phiên Blockchain
        </CardTitle>
        <CardDescription>Khóa phiên dùng để ký giao dịch blockchain</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {address ? (
          <>
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Địa chỉ ví thông minh:
              </p>
              <div className="flex items-center">
                <code className="text-xs bg-white/70 dark:bg-gray-800/70 p-1 rounded font-mono text-gray-800 dark:text-gray-200 flex-1 truncate">
                  {address}
                </code>
                <Button variant="ghost" size="sm" className="h-6 w-6 ml-1 flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Thời hạn:</p>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                <span className="text-sm">{new Date(expiresAt * 1000).toLocaleString()}</span>
                <Badge
                  variant={isExpired ? 'destructive' : 'outline'}
                  className={`ml-2 ${
                    isExpired
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  }`}
                >
                  {isExpired ? 'Đã hết hạn' : `Còn ${hoursLeft} giờ`}
                </Badge>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400 mb-3">
              Bạn cần khóa phiên để triển khai lên blockchain
            </p>
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        <Button onClick={onGetSessionKey} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Đang tạo khóa phiên...
            </>
          ) : address && !isExpired ? (
            <>
              <Key className="mr-2 h-4 w-4" />
              Làm mới khóa phiên
            </>
          ) : (
            <>
              <Key className="mr-2 h-4 w-4" />
              Lấy khóa phiên
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

// ElectionInfoCard: Hiển thị thông tin cuộc bầu cử
export const ElectionInfoCard: React.FC<{
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  blockchainStatus: number;
  blockchainAddress?: string;
  onCopyAddress?: () => void;
}> = ({
  name,
  description,
  startDate,
  endDate,
  blockchainStatus,
  blockchainAddress,
  onCopyAddress,
}) => {
  const getStatusBadge = () => {
    switch (blockchainStatus) {
      case 0:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
          >
            Chưa triển khai
          </Badge>
        );
      case 1:
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
          >
            Đang triển khai
          </Badge>
        );
      case 2:
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
          >
            Đã triển khai
          </Badge>
        );
      case 3:
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
          >
            Triển khai thất bại
          </Badge>
        );
      default:
        return <Badge variant="outline">Không xác định</Badge>;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Landmark className="w-5 h-5 mr-2 text-primary" />
          Thông Tin Cuộc Bầu Cử
        </CardTitle>
        <CardDescription>Chi tiết về cuộc bầu cử cần triển khai</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Tên cuộc bầu cử
          </h3>
          <p className="text-lg font-semibold">{name}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Thời gian</h3>
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              {startDate} - {endDate}
            </span>
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Trạng thái blockchain
          </h3>
          {getStatusBadge()}
        </div>

        {blockchainAddress && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Địa chỉ blockchain
            </h3>
            <div className="flex items-center">
              <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded font-mono">
                {`${blockchainAddress.substring(0, 8)}...${blockchainAddress.substring(blockchainAddress.length - 6)}`}
              </code>
              {onCopyAddress && (
                <Button variant="ghost" size="sm" className="ml-1 h-6 w-6" onClick={onCopyAddress}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-6 w-6 text-blue-600 dark:text-blue-400"
                asChild
              >
                <a
                  href={`https://explorer.holihu.online/address/${blockchainAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mô tả</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {description || 'Không có mô tả'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// SessionInfoCard: Hiển thị thông tin phiên bầu cử
export const SessionInfoCard: React.FC<{
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  maxVoters: number;
  status?: string;
  electionName?: string;
}> = ({ name, description, startDate, endDate, maxVoters, status, electionName }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-primary" />
          Thông Tin Phiên Bầu Cử
        </CardTitle>
        <CardDescription>Chi tiết về phiên bầu cử cần triển khai</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Tên phiên bầu cử
          </h3>
          <p className="text-lg font-semibold">{name}</p>
        </div>

        {electionName && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Thuộc cuộc bầu cử
            </h3>
            <p className="text-sm font-medium">{electionName}</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Thời gian</h3>
          <p className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span>
              {startDate} - {endDate}
            </span>
          </p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Số cử tri tối đa
          </h3>
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>{maxVoters} cử tri</span>
          </p>
        </div>

        {status && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Trạng thái
            </h3>
            <Badge
              variant={status === 'Đã triển khai' ? 'default' : 'outline'}
              className={
                status === 'Đã triển khai'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
              }
            >
              {status}
            </Badge>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mô tả</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {description || 'Không có mô tả'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// BlockchainRequirements: Hiển thị các yêu cầu để triển khai
export const BlockchainRequirements: React.FC<{
  hasSessionKey: boolean;
  hasEnoughBalance: boolean;
  hasFactoryAllowance: boolean;
  hasPaymasterAllowance: boolean;
  hasElectionDeployed?: boolean;
}> = ({
  hasSessionKey,
  hasEnoughBalance,
  hasFactoryAllowance,
  hasPaymasterAllowance,
  hasElectionDeployed,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="font-medium mb-3 flex items-center">
        <Shield className="w-4 h-4 mr-2 text-primary" />
        Yêu Cầu Triển Khai
      </h3>
      <ul className="space-y-2.5">
        <li className="flex items-center">
          {hasSessionKey ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
          ) : (
            <Clock className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
          )}
          <span
            className={
              hasSessionKey
                ? 'text-gray-800 dark:text-gray-200'
                : 'text-gray-500 dark:text-gray-400'
            }
          >
            Khóa phiên hợp lệ
          </span>
        </li>
        <li className="flex items-center">
          {hasEnoughBalance ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
          ) : (
            <Clock className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
          )}
          <span
            className={
              hasEnoughBalance
                ? 'text-gray-800 dark:text-gray-200'
                : 'text-gray-500 dark:text-gray-400'
            }
          >
            Số dư HLU tối thiểu (5 HLU)
          </span>
        </li>
        <li className="flex items-center">
          {hasFactoryAllowance ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
          ) : (
            <Clock className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
          )}
          <span
            className={
              hasFactoryAllowance
                ? 'text-gray-800 dark:text-gray-200'
                : 'text-gray-500 dark:text-gray-400'
            }
          >
            Phê duyệt token cho Factory
          </span>
        </li>
        <li className="flex items-center">
          {hasPaymasterAllowance ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
          ) : (
            <Clock className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
          )}
          <span
            className={
              hasPaymasterAllowance
                ? 'text-gray-800 dark:text-gray-200'
                : 'text-gray-500 dark:text-gray-400'
            }
          >
            Phê duyệt token cho Paymaster
          </span>
        </li>
        {hasElectionDeployed !== undefined && (
          <li className="flex items-center">
            {hasElectionDeployed ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
            ) : (
              <Clock className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            )}
            <span
              className={
                hasElectionDeployed
                  ? 'text-gray-800 dark:text-gray-200'
                  : 'text-gray-500 dark:text-gray-400'
              }
            >
              Cuộc bầu cử đã được triển khai
            </span>
          </li>
        )}
      </ul>
    </div>
  );
};

// BlockchainInfoAlert: Hiển thị thông tin về blockchain
export const BlockchainInfoAlert: React.FC<{
  isElectionDeployment: boolean;
}> = ({ isElectionDeployment }) => {
  return (
    <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30">
      <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
      <AlertTitle className="text-blue-800 dark:text-blue-300">Thông tin về Blockchain</AlertTitle>
      <AlertDescription className="text-gray-700 dark:text-gray-300">
        {isElectionDeployment
          ? 'Việc triển khai cuộc bầu cử lên blockchain sẽ đảm bảo tính minh bạch và bất biến của dữ liệu. Các thông tin về cuộc bầu cử sẽ được ghi lại trên blockchain và không thể thay đổi.'
          : 'Phiên bầu cử chỉ có thể triển khai khi cuộc bầu cử đã được triển khai trước đó. Việc triển khai phiên bầu cử sẽ cho phép cử tri tham gia bỏ phiếu một cách an toàn và minh bạch.'}
      </AlertDescription>
    </Alert>
  );
};

// TransactionStatusCard: Hiển thị thông tin về giao dịch
export const TransactionStatusCard: React.FC<{
  txHash: string;
  status: string;
  frontendHash?: string;
  backendHash?: string;
  hashesLinked?: boolean;
  onGoToExplorer?: () => void;
}> = ({ txHash, status, frontendHash, backendHash, hashesLinked, onGoToExplorer }) => {
  return (
    <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30">
      <h3 className="text-lg font-medium mb-3 flex items-center text-blue-800 dark:text-blue-300">
        <Network className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400" />
        Thông Tin Giao Dịch
      </h3>

      <div className="p-3 rounded-lg bg-white/80 dark:bg-gray-800/40 border border-blue-100 dark:border-blue-900/30 mb-3">
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Mã Giao Dịch</p>
        <div className="flex items-center">
          <p className="font-mono text-sm truncate">{txHash}</p>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-8 w-8"
            onClick={() => {
              navigator.clipboard.writeText(txHash);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 h-8 w-8 text-blue-600 dark:text-blue-400"
            asChild
          >
            <a
              href={`https://explorer.holihu.online/transactions/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      {frontendHash && backendHash && frontendHash !== backendHash && (
        <div className="p-3 rounded-lg bg-white/80 dark:bg-gray-800/40 border border-blue-100 dark:border-blue-900/30 mb-3">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Liên Kết Hash</p>
          <div className="mb-2">
            <p className="text-sm flex items-center mb-1">
              <Link className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
              <span className="text-gray-700 dark:text-gray-300">Frontend Hash:</span>
            </p>
            <p className="font-mono text-xs truncate ml-6 bg-white/60 dark:bg-gray-800/60 p-1 rounded">
              {frontendHash}
            </p>
          </div>
          <div className="mb-2">
            <p className="text-sm flex items-center mb-1">
              <Link className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
              <span className="text-gray-700 dark:text-gray-300">Backend Hash:</span>
            </p>
            <p className="font-mono text-xs truncate ml-6 bg-white/60 dark:bg-gray-800/60 p-1 rounded">
              {backendHash}
            </p>
          </div>
          <div className="mt-2 text-xs flex items-center">
            {hashesLinked ? (
              <span className="flex items-center text-green-600 dark:text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" />
                Đã liên kết hash thành công
              </span>
            ) : (
              <span className="flex items-center text-yellow-600 dark:text-yellow-400">
                <Clock className="w-3 h-3 mr-1" />
                Đang chờ liên kết hash
              </span>
            )}
          </div>
        </div>
      )}

      <Alert
        variant={status === 'success' ? 'default' : status === 'failed' ? 'destructive' : 'default'}
      >
        {status === 'success' ? (
          <CheckCircle className="h-4 w-4" />
        ) : status === 'pending' ? (
          <Clock className="h-4 w-4" />
        ) : status === 'failed' ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Info className="h-4 w-4" />
        )}
        <AlertTitle>
          {status === 'success'
            ? 'Triển khai thành công'
            : status === 'pending'
              ? 'Đang chờ xác nhận'
              : status === 'failed'
                ? 'Triển khai thất bại'
                : 'Trạng thái không xác định'}
        </AlertTitle>
        <AlertDescription>
          {status === 'success'
            ? 'Đã triển khai thành công lên blockchain. Bạn có thể xem chi tiết trên trình khám phá blockchain.'
            : status === 'pending'
              ? 'Giao dịch đang chờ xác nhận từ mạng blockchain. Quá trình này có thể mất vài phút.'
              : status === 'failed'
                ? 'Có lỗi xảy ra trong quá trình triển khai. Vui lòng kiểm tra lại thông tin và thử lại.'
                : 'Không thể xác định trạng thái giao dịch. Vui lòng kiểm tra lại sau.'}
        </AlertDescription>
      </Alert>

      {status === 'success' && onGoToExplorer && (
        <Button
          variant="outline"
          className="w-full mt-3 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
          onClick={onGoToExplorer}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Xem trên blockchain explorer
        </Button>
      )}
    </div>
  );
};

// DeploymentSummary: Tổng hợp thông tin triển khai
export const DeploymentSummary: React.FC<{
  electionId?: number;
  electionName?: string;
  sessionId?: number;
  sessionName?: string;
  blockchainAddress?: string;
  serverId?: number;
  deploymentType: 'election' | 'session';
  status: string;
}> = ({
  electionId,
  electionName,
  sessionId,
  sessionName,
  blockchainAddress,
  serverId,
  deploymentType,
  status,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Shield className="w-5 h-5 mr-2 text-primary" />
          Tổng kết triển khai {deploymentType === 'election' ? 'cuộc bầu cử' : 'phiên bầu cử'}
        </CardTitle>
        <CardDescription>
          Thông tin sau khi triển khai{' '}
          {deploymentType === 'election' ? 'cuộc bầu cử' : 'phiên bầu cử'} lên blockchain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <table className="w-full">
          <tbody>
            {electionId && (
              <tr>
                <td className="py-2 pr-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  ID cuộc bầu cử:
                </td>
                <td className="py-2 text-sm">{electionId}</td>
              </tr>
            )}
            {electionName && (
              <tr>
                <td className="py-2 pr-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tên cuộc bầu cử:
                </td>
                <td className="py-2 text-sm">{electionName}</td>
              </tr>
            )}
            {sessionId && (
              <tr>
                <td className="py-2 pr-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  ID phiên bầu cử:
                </td>
                <td className="py-2 text-sm">{sessionId}</td>
              </tr>
            )}
            {sessionName && (
              <tr>
                <td className="py-2 pr-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tên phiên bầu cử:
                </td>
                <td className="py-2 text-sm">{sessionName}</td>
              </tr>
            )}
            {blockchainAddress && (
              <tr>
                <td className="py-2 pr-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Địa chỉ blockchain:
                </td>
                <td className="py-2 text-sm">
                  <div className="flex items-center">
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded font-mono">
                      {`${blockchainAddress.substring(0, 8)}...${blockchainAddress.substring(blockchainAddress.length - 6)}`}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(blockchainAddress);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            {serverId && (
              <tr>
                <td className="py-2 pr-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Server ID:
                </td>
                <td className="py-2 text-sm">{serverId}</td>
              </tr>
            )}
            <tr>
              <td className="py-2 pr-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                Trạng thái:
              </td>
              <td className="py-2 text-sm">
                <Badge
                  variant={
                    status === 'success'
                      ? 'default'
                      : status === 'failed'
                        ? 'destructive'
                        : 'outline'
                  }
                  className={
                    status === 'success'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      : status === 'failed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                  }
                >
                  {status === 'success'
                    ? 'Triển khai thành công'
                    : status === 'failed'
                      ? 'Triển khai thất bại'
                      : 'Đang triển khai'}
                </Badge>
              </td>
            </tr>
          </tbody>
        </table>

        {status === 'success' && (
          <Alert variant="default" className="mt-2">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Triển khai thành công</AlertTitle>
            <AlertDescription>
              {deploymentType === 'election'
                ? 'Cuộc bầu cử đã được triển khai thành công lên blockchain. Bạn có thể tiếp tục triển khai các phiên bầu cử.'
                : 'Phiên bầu cử đã được triển khai thành công lên blockchain. Bạn có thể tiếp tục quản lý cử tri và ứng viên cho phiên bầu cử này.'}
            </AlertDescription>
          </Alert>
        )}

        {status === 'failed' && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Triển khai thất bại</AlertTitle>
            <AlertDescription>
              Có lỗi xảy ra trong quá trình triển khai. Vui lòng kiểm tra lại thông tin và thử lại.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
