'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

// Redux
import type { RootState, AppDispatch } from '../../store/store';
import { getViByAddress } from '../../store/sliceBlockchain/viBlockchainSlice';

// API
import apiClient from '../../api/apiClient';

// Components
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alter';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { useToast } from '../../test/components/use-toast';

// Icons
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Loader,
  ArrowUpRight,
  RefreshCw,
  Database,
  Key,
  Info,
} from 'lucide-react';

// Blockchain components
import {
  BlockchainAddressCard,
  BlockchainRequirements,
  BlockchainInfoAlert,
} from './BlockchainDeploymentComponents';

interface BlockchainIntegrationPanelProps {
  cuocBauCuId: number;
  cuocBauCu: any;
  className?: string;
}

const BlockchainIntegrationPanel: React.FC<BlockchainIntegrationPanelProps> = ({
  cuocBauCuId,
  cuocBauCu,
  className,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  // Redux state
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);

  // State
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionKey, setSessionKey] = useState<any>(null);
  const [scwAddress, setScwAddress] = useState<string>('');
  const [balances, setBalances] = useState({
    hluBalance: '0',
    allowanceForFactory: '0',
    allowanceForPaymaster: '0',
  });
  const [syncStatus, setSyncStatus] = useState<{
    isRunning: boolean;
    progress: number;
    message: string;
  }>({
    isRunning: false,
    progress: 0,
    message: '',
  });

  // Get blockchain status
  const getBlockchainStatus = () => {
    if (!cuocBauCu || cuocBauCu.trangThaiBlockchain === undefined) {
      return { status: 'Chưa triển khai', color: 'yellow', icon: <Shield className="h-4 w-4" /> };
    }

    switch (cuocBauCu.trangThaiBlockchain) {
      case 0:
        return { status: 'Chưa triển khai', color: 'yellow', icon: <Shield className="h-4 w-4" /> };
      case 1:
        return {
          status: 'Đang triển khai',
          color: 'blue',
          icon: <Loader className="h-4 w-4 animate-spin" />,
        };
      case 2:
        return {
          status: 'Đã triển khai',
          color: 'green',
          icon: <CheckCircle className="h-4 w-4" />,
        };
      case 3:
        return {
          status: 'Triển khai thất bại',
          color: 'red',
          icon: <AlertTriangle className="h-4 w-4" />,
        };
      default:
        return { status: 'Chưa triển khai', color: 'yellow', icon: <Shield className="h-4 w-4" /> };
    }
  };

  // Update account from userInfo
  useEffect(() => {
    if (userInfo && userInfo.id) {
      if (userInfo.diaChiVi) {
        dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
      }
    }
  }, [userInfo, dispatch]);

  // Update wallet from walletInfo
  useEffect(() => {
    if (walletInfo) {
      setScwAddress(walletInfo.diaChiVi);
    }
  }, [walletInfo]);

  // Get session key
  const getSessionKey = useCallback(async () => {
    if (!userInfo || !userInfo.id || !walletInfo || !walletInfo.viId) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng đảm bảo đã đăng nhập và có thông tin tài khoản',
      });
      return null;
    }

    try {
      setIsLoading(true);

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
          scwAddress: response.data.scwAddress || scwAddress,
        };

        setSessionKey(sessionKeyInfo);
        setScwAddress(sessionKeyInfo.scwAddress);

        toast({
          title: 'Đã lấy khóa phiên',
          description: 'Khóa phiên đã được tạo thành công',
        });

        return sessionKeyInfo;
      } else {
        throw new Error(response.data?.message || 'Không thể lấy session key');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Lỗi khi lấy khóa phiên: ' + (error as Error).message,
      });

      // Nếu không lấy được, thử tạo mới
      try {
        const createResponse = await apiClient.post('/api/Blockchain/create-session', {
          TaiKhoanID: Number.parseInt(userInfo.id.toString(), 10),
          ViID: Number.parseInt(walletInfo.viId.toString(), 10),
        });

        if (createResponse.data && createResponse.data.success) {
          toast({
            title: 'Đã tạo khóa phiên mới',
            description: 'Khóa phiên mới đã được tạo thành công',
          });

          // Gọi lại API get-session-key để lấy key mới
          return await getSessionKey();
        }
      } catch (createError) {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể tạo khóa phiên mới: ' + (createError as Error).message,
        });
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userInfo, walletInfo, scwAddress, toast]);

  // Get token balances
  const getTokenBalances = useCallback(async () => {
    if (!scwAddress) return;

    try {
      // Lấy HLU balance
      const balanceResponse = await apiClient.get(
        `/api/Blockchain/token-balance?scwAddress=${scwAddress}`,
      );

      // Lấy Factory allowance
      const factoryAllowanceResponse = await apiClient.get(
        `/api/Blockchain/check-allowance?scwAddress=${scwAddress}&spenderType=factory`,
      );

      // Lấy Paymaster allowance
      const paymasterAllowanceResponse = await apiClient.get(
        `/api/Blockchain/check-allowance?scwAddress=${scwAddress}&spenderType=paymaster`,
      );

      setBalances({
        hluBalance: balanceResponse.data?.balance?.toString() || '0',
        allowanceForFactory: factoryAllowanceResponse.data?.allowance?.toString() || '0',
        allowanceForPaymaster: paymasterAllowanceResponse.data?.allowance?.toString() || '0',
      });
    } catch (error) {
      console.error('Lỗi khi lấy số dư và allowance:', error);
    }
  }, [scwAddress]);

  // Fetch balances when scwAddress changes
  useEffect(() => {
    if (scwAddress) {
      getTokenBalances();
    }
  }, [scwAddress, getTokenBalances]);

  // Navigate to blockchain deployment page
  const handleBlockchainDeployment = () => {
    navigate(`/app/user-elections/elections/${cuocBauCuId}/blockchain-deployment`);
  };

  // Sync data between SQL and blockchain
  const handleSyncData = async () => {
    if (!cuocBauCuId) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không tìm thấy ID cuộc bầu cử',
      });
      return;
    }

    try {
      setSyncStatus({
        isRunning: true,
        progress: 10,
        message: 'Đang bắt đầu đồng bộ dữ liệu...',
      });

      // Gọi API để đồng bộ
      const response = await apiClient.post(`/api/CuocBauCu/syncBlockchain/${cuocBauCuId}`, {
        forceCheck: true,
      });

      setSyncStatus({
        isRunning: true,
        progress: 50,
        message: 'Đang xử lý dữ liệu...',
      });

      // Giả lập thời gian xử lý
      setTimeout(() => {
        if (response.data && response.data.success) {
          setSyncStatus({
            isRunning: false,
            progress: 100,
            message: 'Đồng bộ dữ liệu thành công!',
          });

          toast({
            title: 'Thành công',
            description: 'Đã đồng bộ dữ liệu giữa SQL và blockchain thành công',
          });
        } else {
          setSyncStatus({
            isRunning: false,
            progress: 0,
            message: response.data?.message || 'Đồng bộ dữ liệu thất bại',
          });

          toast({
            variant: 'destructive',
            title: 'Lỗi',
            description: response.data?.message || 'Đồng bộ dữ liệu thất bại',
          });
        }
      }, 2000);
    } catch (error) {
      setSyncStatus({
        isRunning: false,
        progress: 0,
        message: 'Đồng bộ dữ liệu thất bại: ' + (error as Error).message,
      });

      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Đồng bộ dữ liệu thất bại: ' + (error as Error).message,
      });
    }
  };

  // Sync all missing server IDs
  const syncAllMissingServerIds = async () => {
    try {
      setSyncStatus({
        isRunning: true,
        progress: 10,
        message: 'Đang đồng bộ tất cả ServerId thiếu...',
      });

      // Gọi API để đồng bộ tất cả
      const response = await apiClient.post('/api/CuocBauCu/syncAllServerIds');

      setSyncStatus({
        isRunning: true,
        progress: 50,
        message: 'Đang xử lý dữ liệu...',
      });

      // Giả lập thời gian xử lý
      setTimeout(() => {
        if (response.data) {
          setSyncStatus({
            isRunning: false,
            progress: 100,
            message: `Đồng bộ hoàn tất: ${response.data.successCount}/${response.data.totalProcessed} thành công`,
          });

          toast({
            title: 'Thành công',
            description: `Đồng bộ hoàn tất: ${response.data.successCount}/${response.data.totalProcessed} thành công`,
          });
        } else {
          setSyncStatus({
            isRunning: false,
            progress: 0,
            message: 'Đồng bộ dữ liệu thất bại',
          });

          toast({
            variant: 'destructive',
            title: 'Lỗi',
            description: 'Đồng bộ dữ liệu thất bại',
          });
        }
      }, 2000);
    } catch (error) {
      setSyncStatus({
        isRunning: false,
        progress: 0,
        message: 'Đồng bộ dữ liệu thất bại: ' + (error as Error).message,
      });

      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Đồng bộ dữ liệu thất bại: ' + (error as Error).message,
      });
    }
  };

  const blockchainStatus = getBlockchainStatus();
  const hasSessionKey = sessionKey && sessionKey.expiresAt * 1000 > Date.now();
  const hasEnoughBalance = Number.parseFloat(balances.hluBalance) >= 5.0;
  const hasFactoryAllowance = Number.parseFloat(balances.allowanceForFactory) >= 4.0;
  const hasPaymasterAllowance = Number.parseFloat(balances.allowanceForPaymaster) >= 1.0;

  return (
    <Card className={`border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Shield className="w-5 h-5 mr-2 text-primary" />
              Blockchain Integration
            </CardTitle>
            <CardDescription>
              Triển khai và đồng bộ dữ liệu cuộc bầu cử với blockchain
            </CardDescription>
          </div>
          <Badge
            className={
              blockchainStatus.color === 'green'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30'
                : blockchainStatus.color === 'blue'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30'
                  : blockchainStatus.color === 'yellow'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/30'
            }
          >
            {blockchainStatus.icon}
            <span className="ml-1">{blockchainStatus.status}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="overview" className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Tổng Quan
            </TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center">
              <Database className="w-4 h-4 mr-2" />
              Đồng Bộ Dữ Liệu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Blockchain Info Alert */}
            <BlockchainInfoAlert isElectionDeployment={true} />

            {/* Blockchain Requirements */}
            <BlockchainRequirements
              hasSessionKey={hasSessionKey}
              hasEnoughBalance={hasEnoughBalance}
              hasFactoryAllowance={hasFactoryAllowance}
              hasPaymasterAllowance={hasPaymasterAllowance}
            />

            {/* Session Key Info */}
            {cuocBauCu?.blockchainAddress && (
              <BlockchainAddressCard
                address={cuocBauCu.blockchainAddress}
                label="Địa chỉ Blockchain"
                onCopy={() => {
                  navigator.clipboard.writeText(cuocBauCu.blockchainAddress);
                  toast({
                    title: 'Đã sao chép',
                    description: 'Địa chỉ đã được sao chép vào clipboard',
                  });
                }}
              />
            )}

            {/* Session Key Button */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={getSessionKey}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Key className="mr-2 h-4 w-4" />
                )}
                {hasSessionKey ? 'Làm Mới Khóa Phiên' : 'Lấy Khóa Phiên'}
              </Button>

              <Button
                onClick={handleBlockchainDeployment}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Shield className="mr-2 h-4 w-4" />
                Triển Khai Blockchain
              </Button>
            </div>

            {/* Session Key Info */}
            {sessionKey && (
              <div className="mt-2 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                  <Key className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                  Thông Tin Khóa Phiên
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 w-24">Địa chỉ SCW:</span>
                    <code className="text-xs bg-white/70 dark:bg-gray-800/70 p-1 rounded font-mono flex-1 overflow-hidden text-ellipsis">
                      {scwAddress}
                    </code>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 w-24">Thời hạn:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {sessionKey.expiresAt
                        ? new Date(sessionKey.expiresAt * 1000).toLocaleString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sync" className="space-y-4">
            <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/30">
              <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <AlertTitle className="text-blue-800 dark:text-blue-300">
                Đồng Bộ Dữ Liệu Blockchain
              </AlertTitle>
              <AlertDescription className="text-gray-700 dark:text-gray-300">
                Công cụ này giúp đồng bộ dữ liệu giữa cơ sở dữ liệu SQL và blockchain, đảm bảo tính
                nhất quán của dữ liệu.
              </AlertDescription>
            </Alert>

            {/* Sync Progress */}
            {syncStatus.isRunning && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{syncStatus.message}</span>
                  <span className="text-gray-600 dark:text-gray-400">{syncStatus.progress}%</span>
                </div>
                <Progress value={syncStatus.progress} className="h-2" />
              </div>
            )}

            {/* Sync Status Message */}
            {!syncStatus.isRunning && syncStatus.message && (
              <Alert
                variant={syncStatus.progress === 100 ? 'default' : 'destructive'}
                className="mt-2"
              >
                {syncStatus.progress === 100 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertDescription>{syncStatus.message}</AlertDescription>
              </Alert>
            )}

            {/* Sync Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleSyncData}
                disabled={syncStatus.isRunning}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {syncStatus.isRunning ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Đồng Bộ Cuộc Bầu Cử Này
              </Button>

              <Button
                onClick={syncAllMissingServerIds}
                disabled={syncStatus.isRunning}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {syncStatus.isRunning ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Database className="mr-2 h-4 w-4" />
                )}
                Đồng Bộ Tất Cả ServerId
              </Button>
            </div>

            {/* Blockchain Address */}
            {cuocBauCu?.blockchainAddress && (
              <div className="p-3 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                  Thông Tin Blockchain
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 w-24">Địa chỉ:</span>
                    <code className="text-xs bg-white/70 dark:bg-gray-800/70 p-1 rounded font-mono flex-1 overflow-hidden text-ellipsis">
                      {cuocBauCu.blockchainAddress}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-1 h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(cuocBauCu.blockchainAddress);
                        toast({
                          title: 'Đã sao chép',
                          description: 'Địa chỉ đã được sao chép vào clipboard',
                        });
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
                  {cuocBauCu.blockchainServerId && (
                    <div className="flex items-center">
                      <span className="text-gray-500 dark:text-gray-400 w-24">Server ID:</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {cuocBauCu.blockchainServerId}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 w-24">Explorer:</span>
                    <a
                      href={`https://explorer.holihu.online/address/${cuocBauCu.blockchainAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 flex items-center hover:underline"
                    >
                      Xem trên blockchain
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <Button
          variant="outline"
          onClick={() => getTokenBalances()}
          className="text-gray-600 dark:text-gray-300"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
        <Button
          onClick={handleBlockchainDeployment}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <ArrowUpRight className="mr-2 h-4 w-4" />
          Đến trang triển khai
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BlockchainIntegrationPanel;
