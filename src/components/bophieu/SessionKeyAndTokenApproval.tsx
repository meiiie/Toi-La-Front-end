import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useToast } from '../../test/components/use-toast';
import apiClient from '../../api/apiClient';
import { QUAN_LY_PHIEU_BAU_ADDRESS } from '../../utils/blockchain';
import ApproveHLU from '../../components/blockchain/ApproveHLU';
import type { RootState } from '../../store/store';

// Components
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alter';
import { Progress } from '../../components/ui/Progress';
import {
  Info,
  AlertCircle,
  Loader,
  Key,
  Shield,
  CheckCircle,
  Wallet,
  Database,
  Zap,
} from 'lucide-react';

interface SessionKeyInfo {
  sessionKey: string;
  expiresAt: number;
  scwAddress: string;
}

interface SessionKeyAndTokenApprovalProps {
  onSessionKeyGenerated?: (sessionKey: SessionKeyInfo) => void;
  onApprovalComplete?: () => void;
  contractAddress?: string; // Optional contract address for election-specific approval
  targetType?: string; // Thêm tham số mới
}

const SessionKeyAndTokenApproval: React.FC<SessionKeyAndTokenApprovalProps> = ({
  onSessionKeyGenerated,
  onApprovalComplete,
  contractAddress,
  targetType,
}) => {
  // Redux state
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);

  // State
  const [sessionKey, setSessionKey] = useState<SessionKeyInfo | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(false);
  const [isApprovingToken, setIsApprovingToken] = useState(false);
  const [approvalStep, setApprovalStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tokenApprovalStatus, setTokenApprovalStatus] = useState({
    hluBalance: '0',
    allowanceForFactory: '0',
    allowanceForPaymaster: '0',
    allowanceForQuanLyPhieu: '0',
    isApproved: false,
  });

  // Toast notification
  const { toast } = useToast();

  // Lấy địa chỉ contract quản lý phiếu bầu
  const quanLyPhieuBauAddress =
    contractAddress || QUAN_LY_PHIEU_BAU_ADDRESS || '0x9c244B5E1F168510B9b812573b1B667bd1E654c8';

  // Hiển thị thông báo
  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    console.log(msg);
  }, []);

  // Hiển thị lỗi
  const showError = useCallback(
    (msg: string) => {
      setError(msg);
      console.error(msg);

      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: msg,
      });
    },
    [toast],
  );

  // Lấy khóa phiên từ server
  const getSessionKey = useCallback(async () => {
    if (!userInfo?.id || !walletInfo?.viId) {
      showError('Vui lòng đảm bảo đã đăng nhập và có thông tin tài khoản');
      return null;
    }

    // Kiểm tra nếu đã có khóa phiên và còn hạn sử dụng
    if (sessionKey && sessionKey.expiresAt * 1000 > Date.now()) {
      showMessage('Đã có khóa phiên và còn hạn sử dụng');

      toast({
        title: 'Khóa phiên hiện tại',
        description: `Khóa phiên còn hạn đến: ${new Date(sessionKey.expiresAt * 1000).toLocaleString()}`,
      });

      if (onSessionKeyGenerated) {
        onSessionKeyGenerated(sessionKey);
      }

      return sessionKey;
    }

    try {
      setIsLoadingKey(true);
      setApprovalStep(1);

      // Gọi API để lấy session key
      const response = await apiClient.post('/api/Blockchain/get-session-key', {
        TaiKhoanID: Number.parseInt(userInfo.id.toString(), 10),
        ViID: Number.parseInt(walletInfo.viId.toString(), 10),
      });

      if (response.data && response.data.success && response.data.sessionKey) {
        // Lưu session key và thông tin liên quan
        const sessionKeyInfo = {
          sessionKey: response.data.sessionKey,
          expiresAt: response.data.expiresAt,
          scwAddress: response.data.scwAddress || walletInfo.diaChiVi,
        };

        setSessionKey(sessionKeyInfo);
        showMessage(
          `Đã lấy session key thành công, hết hạn: ${new Date(sessionKeyInfo.expiresAt * 1000).toLocaleString()}`,
        );

        // Gọi callback nếu có
        if (onSessionKeyGenerated) {
          onSessionKeyGenerated(sessionKeyInfo);
        }

        toast({
          title: 'Đã lấy khóa phiên',
          description: 'Khóa phiên đã được tạo thành công',
        });

        return sessionKeyInfo;
      } else {
        throw new Error(response.data?.message || 'Không thể lấy session key');
      }
    } catch (error) {
      showError('Lỗi khi lấy session key: ' + (error as Error).message);

      // Nếu không lấy được, thử tạo một khóa mới
      try {
        const createResponse = await apiClient.post('/api/Blockchain/create-session', {
          TaiKhoanID: Number.parseInt(userInfo.id.toString(), 10),
          ViID: Number.parseInt(walletInfo.viId.toString(), 10),
        });

        if (createResponse.data && createResponse.data.success) {
          showMessage('Đã tạo session key mới');

          toast({
            title: 'Đã tạo khóa phiên mới',
            description: 'Khóa phiên mới đã được tạo thành công',
          });

          // Gọi lại API get-session-key để lấy khóa mới
          return await getSessionKey();
        }
      } catch (createError) {
        showError('Không thể tạo session key mới: ' + (createError as Error).message);
      }

      return null;
    } finally {
      setIsLoadingKey(false);
    }
  }, [userInfo, walletInfo, sessionKey, showMessage, showError, toast, onSessionKeyGenerated]);

  // Xử lý khi có cập nhật balances từ ApproveHLU
  const handleBalancesUpdated = useCallback(
    (balances: any) => {
      console.log('SessionKeyAndTokenApproval received balances:', balances);

      // Extract allowances with proper fallbacks
      const paymasterAllowance = Number(balances.allowanceForPaymaster || '0');
      const quanLyPhieuAllowance = Number(balances.allowanceForQuanLyPhieu || '0');
      const hluBalance = Number(balances.hluBalance || '0');

      // Check requirements - matching modal verification logic
      const paymasterRequirementMet = paymasterAllowance >= 1; // Requires 1 HLU
      const quanLyPhieuRequirementMet = quanLyPhieuAllowance >= 3; // Requires 3 HLU
      const hasEnoughBalance = hluBalance >= 1;

      const isApproved = paymasterRequirementMet && quanLyPhieuRequirementMet && hasEnoughBalance;

      console.log(
        `SessionKey component - Approval Status: ` +
          `Balance: ${hluBalance}/1 HLU (${hasEnoughBalance ? 'met' : 'not met'}), ` +
          `Paymaster: ${paymasterAllowance}/1 HLU (${paymasterRequirementMet ? 'met' : 'not met'}), ` +
          `QuanLyPhieu: ${quanLyPhieuAllowance}/3 HLU (${quanLyPhieuRequirementMet ? 'met' : 'not met'}), ` +
          `Overall: ${isApproved ? 'APPROVED' : 'NOT APPROVED'}`,
      );

      setTokenApprovalStatus({
        hluBalance: balances.hluBalance || '0',
        allowanceForFactory: balances.allowanceForFactory || '0',
        allowanceForPaymaster: balances.allowanceForPaymaster || '0',
        allowanceForQuanLyPhieu:
          balances.allowanceForQuanLyPhieu || balances.allowanceForElection || '0',
        isApproved,
      });

      if (isApproved && onApprovalComplete) {
        console.log('Calling onApprovalComplete - all requirements met');
        onApprovalComplete();
      }
    },
    [onApprovalComplete],
  );

  // Xử lý khi approve thành công
  const handleApproveSuccess = useCallback(() => {
    toast({
      title: 'Phê duyệt thành công',
      description: 'Đã phê duyệt token HLU thành công',
    });

    if (onApprovalComplete) {
      onApprovalComplete(); // No parameter needed here
    }
  }, [toast, onApprovalComplete]);

  // Xử lý thiết lập trạng thái loading
  const handleSetIsLoading = useCallback((loading: boolean) => {
    setIsApprovingToken(loading);
  }, []);

  // Tính toán tiến trình tổng thể
  const calculateOverallProgress = useCallback(() => {
    if (!sessionKey) return 0;
    if (!tokenApprovalStatus.isApproved) return 50;
    return 100;
  }, [sessionKey, tokenApprovalStatus.isApproved]);

  // Tiện ích để format thời gian hết hạn
  const formatExpiryTime = useCallback((timestamp: number) => {
    const now = Date.now();
    const expiry = timestamp * 1000;

    if (expiry <= now) return 'Đã hết hạn';

    const diff = expiry - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours} giờ ${minutes} phút`;
  }, []);

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-blue-500 dark:border-blue-600 bg-gradient-to-br from-white to-blue-50 dark:from-[#162A45]/90 dark:to-[#1A2942]/70">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
              Chuẩn bị khóa phiên và phê duyệt token
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Thanh tiến trình tổng thể */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tiến trình
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {calculateOverallProgress()}%
              </span>
            </div>
            <Progress value={calculateOverallProgress()} className="h-2" />
          </div>

          {/* Hướng dẫn */}
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">Lưu ý</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              Để tham gia bỏ phiếu, bạn cần hoàn thành hai bước sau:
              <ol className="list-decimal ml-5 mt-2 space-y-1">
                <li>Lấy khóa phiên để xác thực giao dịch</li>
                <li>Phê duyệt token HLU để chi trả phí bỏ phiếu</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Bước 1: Lấy khóa phiên */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
              <Key className="h-5 w-5 mr-2 text-blue-500" />
              Bước 1: Lấy khóa phiên
            </h3>

            {!sessionKey ? (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Khóa phiên giúp bạn có thể ký các giao dịch trên blockchain mà không cần sử dụng
                  khóa chính của ví.
                </p>
                <Button
                  onClick={getSessionKey}
                  disabled={isLoadingKey}
                  className="w-full md:w-auto px-6 py-5 text-base font-medium bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 hover:shadow-lg text-white transition-all duration-300"
                >
                  {isLoadingKey ? (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="mr-2 h-4 w-4" />
                  )}
                  {isLoadingKey ? 'Đang tạo khóa phiên...' : 'Lấy khóa phiên'}
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#1A2942]/50 dark:to-[#1E1A29]/50 border border-blue-100 dark:border-[#2A3A5A]/70">
                <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-white flex items-center">
                  <Key className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Thông tin khóa phiên
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/70 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A]/50">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      Địa chỉ Ví Thông Minh (SCW)
                    </p>
                    <div className="flex items-center">
                      <p className="font-mono text-sm truncate text-gray-800 dark:text-gray-200">
                        {sessionKey.scwAddress}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#243656]"
                        onClick={() => {
                          navigator.clipboard.writeText(sessionKey.scwAddress);
                          toast({
                            title: 'Đã sao chép',
                            description: 'Địa chỉ ví đã được sao chép vào clipboard',
                          });
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
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white/70 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A]/50">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      Thời hạn sử dụng
                    </p>
                    <p className="text-gray-800 dark:text-gray-200 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                      <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                        (Còn {formatExpiryTime(sessionKey.expiresAt)})
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-2 rounded-lg bg-green-50/80 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                  <span className="text-green-700 dark:text-green-300 text-sm">
                    Khóa phiên đã sẵn sàng. Bạn có thể tiếp tục bước tiếp theo.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bước 2: Phê duyệt Token HLU */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 flex items-center">
              <Database className="h-5 w-5 mr-2 text-purple-500" />
              Bước 2: Phê duyệt Token HLU
            </h3>

            {sessionKey ? (
              <div>
                <Alert className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <AlertTitle className="text-yellow-800 dark:text-yellow-300">
                    Thông tin quan trọng
                  </AlertTitle>
                  <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                    Việc bỏ phiếu sẽ tiêu tốn một lượng nhỏ token HLU (khoảng 1 HLU) để chi trả phí
                    giao dịch. Bạn cần phê duyệt token trước khi có thể bỏ phiếu.
                  </AlertDescription>
                </Alert>

                <ApproveHLU
                  scwAddress={sessionKey.scwAddress}
                  sessionKey={sessionKey}
                  contractAddress={quanLyPhieuBauAddress}
                  targetType={targetType || 'quanlyphieubau'} // Truyền xuống ApproveHLU
                  onSuccess={handleApproveSuccess} // This function is called with no parameters
                  onBalancesUpdated={handleBalancesUpdated}
                  setIsLoading={handleSetIsLoading}
                  showMessage={showMessage}
                  showError={showError}
                />
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50">
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Lock className="h-4 w-4 mr-2" />
                  <p>Vui lòng hoàn thành bước 1 trước để tiếp tục</p>
                </div>
              </div>
            )}
          </div>

          {/* Tổng kết */}
          {sessionKey && tokenApprovalStatus.isApproved && (
            <Alert className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-300">Đã sẵn sàng!</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                Bạn đã hoàn thành tất cả các bước cần thiết và có thể tiếp tục bỏ phiếu.
              </AlertDescription>
            </Alert>
          )}

          {/* Nút tiếp tục */}
          {sessionKey && tokenApprovalStatus.isApproved && (
            <Button className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
              <Zap className="mr-2 h-5 w-5" />
              Tiếp tục bỏ phiếu
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionKeyAndTokenApproval;

// Component Lock bổ sung
const Lock: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);
