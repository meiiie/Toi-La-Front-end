import React from 'react';
import { Button } from '../ui/Button';
import {
  AlertCircle,
  CheckCircle,
  Key,
  Loader,
  RefreshCw,
  Shield,
  XCircle,
  Zap,
} from 'lucide-react';

// Component to display blockchain status
const BlockchainStatusDisplay: React.FC<{
  scwAddress: string;
  electionStatus: {
    owner: string;
    isOwner: boolean;
    isActive: boolean;
    hasBanToChucRole: boolean;
  };
  isCheckingPermission: boolean;
  onCheckPermission: () => void;
  grantBanToChucRole: () => Promise<boolean>;
  startElection?: () => Promise<boolean>;
  isLoading: boolean;
}> = ({
  scwAddress,
  electionStatus,
  isCheckingPermission,
  onCheckPermission,
  grantBanToChucRole,
  startElection,
  isLoading,
}) => {
  const renderPermissionStatus = () => {
    if (isCheckingPermission) {
      return (
        <div className="flex items-center">
          <Loader className="h-4 w-4 animate-spin mr-2 text-blue-500" />
          <span className="text-blue-600">Đang kiểm tra quyền...</span>
        </div>
      );
    }

    if (electionStatus.hasBanToChucRole) {
      return (
        <div className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          <span className="text-green-600">Có</span>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
        <span className="text-amber-600">Không</span>
      </div>
    );
  };

  const renderActiveStatus = () => {
    if (isCheckingPermission) {
      return (
        <div className="flex items-center">
          <Loader className="h-4 w-4 animate-spin mr-2 text-blue-500" />
          <span className="text-blue-600">Đang kiểm tra...</span>
        </div>
      );
    }

    if (electionStatus.isActive) {
      return (
        <div className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          <span className="text-green-600">Đã bắt đầu</span>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <XCircle className="h-4 w-4 mr-2 text-amber-500" />
        <span className="text-amber-600">Chưa bắt đầu</span>
      </div>
    );
  };

  return (
    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 mb-4">
      <h3 className="text-lg font-medium mb-4 text-blue-800 dark:text-blue-300 flex items-center">
        <Shield className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
        Trạng thái blockchain
      </h3>

      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="text-gray-700 dark:text-gray-300 mb-1 md:mb-0">
            <span className="font-medium">Địa chỉ ví thông minh:</span>{' '}
            <span className="font-mono text-sm">{`${scwAddress.substring(0, 10)}...${scwAddress.substring(scwAddress.length - 6)}`}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCheckPermission}
            disabled={isCheckingPermission}
            className="mt-1 md:mt-0"
          >
            {isCheckingPermission ? (
              <Loader className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3 w-3" />
            )}
            Kiểm tra lại
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 border-t border-blue-200 dark:border-blue-800/30 pt-3">
          <div className="font-medium text-gray-700 dark:text-gray-300 min-w-[180px]">
            Có quyền BANTOCHUC:
          </div>
          <div className="flex-1">{renderPermissionStatus()}</div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 border-t border-blue-200 dark:border-blue-800/30 pt-3">
          <div className="font-medium text-gray-700 dark:text-gray-300 min-w-[180px]">
            Cuộc bầu cử đã bắt đầu:
          </div>
          <div className="flex-1">{renderActiveStatus()}</div>
        </div>

        {!isCheckingPermission && !electionStatus.hasBanToChucRole && (
          <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-800/30">
            <Button
              onClick={grantBanToChucRole}
              disabled={isLoading || isCheckingPermission}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Key className="mr-2 h-4 w-4" />
              )}
              Cấp Quyền BANTOCHUC
            </Button>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              SCW của bạn cần có quyền BANTOCHUC để tạo phiên bầu cử.
            </p>
          </div>
        )}

        {!isCheckingPermission &&
          electionStatus.hasBanToChucRole &&
          !electionStatus.isActive &&
          startElection && (
            <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-800/30">
              <Button
                onClick={startElection}
                disabled={isLoading || isCheckingPermission}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                Bắt Đầu Cuộc Bầu Cử
              </Button>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Bắt đầu cuộc bầu cử để có thể tạo phiên bầu cử.
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default BlockchainStatusDisplay;
