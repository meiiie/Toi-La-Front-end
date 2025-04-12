'use client';

import type React from 'react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Alert, AlertDescription } from '../ui/Alter';
import { useToast } from '../../test/components/use-toast';
import { Database, Loader, CheckCircle, AlertTriangle } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface BlockchainSyncButtonProps {
  cuocBauCuId?: number;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onSyncComplete?: () => void;
}

const BlockchainSyncButton: React.FC<BlockchainSyncButtonProps> = ({
  cuocBauCuId,
  variant = 'default',
  size = 'default',
  className = '',
  onSyncComplete,
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSync = async () => {
    if (!cuocBauCuId) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không tìm thấy ID cuộc bầu cử',
      });
      return;
    }

    try {
      setIsLoading(true);
      setShowProgress(true);
      setSyncResult(null);
      setProgress(10);

      // Gọi API để đồng bộ
      const response = await apiClient.post(`/api/CuocBauCu/syncBlockchain/${cuocBauCuId}`, {
        forceCheck: true,
      });

      setProgress(50);

      // Giả lập thời gian xử lý
      setTimeout(() => {
        setProgress(100);

        if (response.data && response.data.success) {
          setSyncResult({
            success: true,
            message: 'Đồng bộ dữ liệu thành công!',
          });

          toast({
            title: 'Thành công',
            description: 'Đã đồng bộ dữ liệu giữa SQL và blockchain thành công',
          });

          if (onSyncComplete) {
            onSyncComplete();
          }
        } else {
          setSyncResult({
            success: false,
            message: response.data?.message || 'Đồng bộ dữ liệu thất bại',
          });

          toast({
            variant: 'destructive',
            title: 'Lỗi',
            description: response.data?.message || 'Đồng bộ dữ liệu thất bại',
          });
        }

        setIsLoading(false);

        // Hide progress after 3 seconds
        setTimeout(() => {
          setShowProgress(false);
        }, 3000);
      }, 2000);
    } catch (error) {
      setProgress(100);
      setSyncResult({
        success: false,
        message: 'Đồng bộ dữ liệu thất bại: ' + (error as Error).message,
      });

      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Đồng bộ dữ liệu thất bại: ' + (error as Error).message,
      });

      setIsLoading(false);

      // Hide progress after 3 seconds
      setTimeout(() => {
        setShowProgress(false);
      }, 3000);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant={variant}
        size={size}
        onClick={handleSync}
        disabled={isLoading}
        className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 ${className}`}
      >
        {isLoading ? (
          <Loader className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Database className="mr-2 h-4 w-4" />
        )}
        Đồng Bộ Blockchain
      </Button>

      {showProgress && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1" />
          {syncResult && (
            <Alert
              variant={syncResult.success ? 'success' : 'destructive'}
              className="py-2 text-xs"
            >
              {syncResult.success ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              <AlertDescription className="text-xs">{syncResult.message}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

export default BlockchainSyncButton;
