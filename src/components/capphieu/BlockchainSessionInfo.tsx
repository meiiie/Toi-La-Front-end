import React from 'react';
import { Button } from '../../components/ui/Button';
import { Database, Loader, RefreshCw } from 'lucide-react';
import type { PhienBauCu } from '../../store/types';

interface BlockchainSessionInfoProps {
  selectedSession: PhienBauCu | null;
  blockchainSessionId: number | null;
  isCheckingBlockchain: boolean;
  onRefresh: () => void;
}

const BlockchainSessionInfo: React.FC<BlockchainSessionInfoProps> = ({
  selectedSession,
  blockchainSessionId,
  isCheckingBlockchain,
  onRefresh,
}) => {
  if (!selectedSession || (!isCheckingBlockchain && blockchainSessionId === null)) {
    return null;
  }

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg">
      <div className="flex items-start">
        <Database className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800 dark:text-blue-300">
            Thông tin phiên bầu cử blockchain
          </h3>

          {isCheckingBlockchain ? (
            <div className="flex items-center mt-1">
              <Loader className="h-4 w-4 mr-2 animate-spin text-blue-500" />
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Đang kiểm tra thông tin phiên từ blockchain...
              </p>
            </div>
          ) : (
            <div className="mt-1">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Phiên bầu cử ID SQL: <span className="font-medium">{selectedSession.id}</span> | ID
                Blockchain: <span className="font-medium">{blockchainSessionId}</span>
              </p>
              <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={onRefresh}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Kiểm tra lại từ blockchain
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockchainSessionInfo;
