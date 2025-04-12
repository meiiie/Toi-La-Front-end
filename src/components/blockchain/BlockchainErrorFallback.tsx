import React from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

interface BlockchainErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * A user-friendly fallback component displayed when blockchain operations fail
 */
const BlockchainErrorFallback: React.FC<BlockchainErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  // Format error message to be user friendly
  const formatErrorMessage = (error: Error): string => {
    const message = error.message.toLowerCase();

    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout')
    ) {
      return 'Không thể kết nối với blockchain. Vui lòng kiểm tra kết nối mạng của bạn.';
    }

    if (message.includes('user rejected') || message.includes('user denied')) {
      return 'Giao dịch đã bị hủy bỏ hoặc từ chối bởi người dùng.';
    }

    if (message.includes('insufficient funds') || message.includes('không đủ token')) {
      return 'Không đủ token để thực hiện giao dịch. Vui lòng kiểm tra số dư của bạn.';
    }

    // Generic message for unknown errors in production
    return process.env.NODE_ENV === 'development'
      ? `Lỗi: ${error.message}`
      : 'Đã xảy ra lỗi khi tương tác với blockchain. Vui lòng thử lại sau.';
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="max-w-md w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-red-100 dark:border-red-900/30">
        <CardHeader className="pb-3 border-b border-red-100 dark:border-red-900/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <CardTitle className="text-red-700 dark:text-red-300">Lỗi kết nối Blockchain</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">{formatErrorMessage(error)}</p>

          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium">Bạn có thể thử:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Kiểm tra kết nối mạng của bạn</li>
              <li>Làm mới trang và thử lại</li>
              <li>Kiểm tra số dư token trong ví của bạn</li>
              <li>Quay lại sau vài phút</li>
            </ul>

            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                <summary className="cursor-pointer font-mono text-xs">
                  Chi tiết lỗi (dev mode)
                </summary>
                <pre className="mt-2 p-2 bg-gray-200 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
                  {error.stack || error.message}
                </pre>
              </details>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 justify-between pt-2">
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/app/user-elections';
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay về trang chủ
          </Button>
          <Button onClick={resetErrorBoundary}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BlockchainErrorFallback;
