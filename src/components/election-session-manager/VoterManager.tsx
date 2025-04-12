'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alter';
import { Button } from '../../components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { useToast } from '../../test/components/use-toast';
import {
  Users,
  Info,
  RefreshCw,
  Loader,
  AlertCircle,
  Key,
  CreditCard,
  Play,
  CheckCircle2,
  Server,
  Network,
  ExternalLink,
  Clock,
  Shield,
} from 'lucide-react';
import type { PhienBauCu } from '../../store/types';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import apiClient from '../../api/apiClient';
import { ethers } from 'ethers';

// Import các component chức năng
import BallotConfigTab from './BallotConfigTab';
import VoterList from '../capphieu/VoterList';
import SessionStartTab from './SessionStartTab';

// Cấu trúc metadata cho phiếu bầu
interface BallotMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
  external_url?: string;
  animation_url?: string;
  background_color?: string;
}

// Interface cho thông tin khóa phiên
interface SessionKeyInfo {
  sessionKey: string;
  expiresAt: number;
  scwAddress: string;
}

// Interface cho props component
interface VoterManagerProps {
  selectedSession: PhienBauCu | null;
  sessionStatus: {
    isActive: boolean;
    startTime: number;
    endTime: number;
  };
  electionStatus: {
    isOwner: boolean;
    isActive: boolean;
    hasBanToChucRole: boolean;
  };
  sessionKey: SessionKeyInfo | null;
  votersList: any[];
  isLoadingVoters: boolean;
  refreshData: () => void;
  getSessionKey: () => Promise<SessionKeyInfo | null>;
  scwAddress: string;
  quanLyCuocBauCuAddress?: string;
  setSessionKey: React.Dispatch<React.SetStateAction<SessionKeyInfo | null>>;
}

// Interface cho trạng thái phiên bầu cử trên blockchain
interface BlockchainSessionStatus {
  isActive: boolean;
  startTime: number;
  endTime: number;
  totalVoters: number;
  isLoading: boolean;
  error: string;
}

// Interface cho địa chỉ contract
interface ContractAddresses {
  entryPointAddress: string;
  factoryAddress: string;
  paymasterAddress: string;
  quanLyPhieuBauAddress: string;
  quanLyCuocBauCuAddress?: string;
  hluTokenAddress: string;
}

/**
 * Component quản lý phiếu bầu và tương tác với blockchain
 */
const VoterManager: React.FC<VoterManagerProps> = ({
  selectedSession,
  sessionStatus,
  electionStatus,
  sessionKey,
  votersList,
  isLoadingVoters,
  refreshData,
  getSessionKey,
  scwAddress,
  quanLyCuocBauCuAddress: propQuanLyCuocBauCuAddress,
  setSessionKey,
}) => {
  // Local state
  const [activeTab, setActiveTab] = useState<string>('voters');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ballotMetadata, setBallotMetadata] = useState<BallotMetadata | undefined>(undefined);
  const [isStartingSession, setIsStartingSession] = useState<boolean>(false);
  const [localQuanLyCuocBauCuAddress, setLocalQuanLyCuocBauCuAddress] = useState<
    string | undefined
  >(propQuanLyCuocBauCuAddress);
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState<boolean>(false);
  const [configValidationState, setConfigValidationState] = useState<{
    isValid: boolean;
    message?: string;
  }>({ isValid: false });

  // Blockchain state
  const [blockchainSessionId, setBlockchainSessionId] = useState<number | null>(null);
  const [blockchainSessionStatus, setBlockchainSessionStatus] = useState<BlockchainSessionStatus>({
    isActive: false,
    startTime: 0,
    endTime: 0,
    totalVoters: 0,
    isLoading: false,
    error: '',
  });
  const [txHash, setTxHash] = useState<string>('');

  const { toast } = useToast();

  // Lấy thông tin người dùng và ví từ Redux
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);

  // Debug log ban đầu
  useEffect(() => {
    console.log('[DEBUG] VoterManager - Initial render with props:', {
      selectedSession: selectedSession
        ? {
            id: selectedSession.id,
            tenPhienBauCu: selectedSession.tenPhienBauCu,
            blockchainAddress: selectedSession.blockchainAddress,
          }
        : null,
      propQuanLyCuocBauCuAddress,
      scwAddress,
      sessionKeyExists: sessionKey ? true : false,
    });
  }, [selectedSession, propQuanLyCuocBauCuAddress, scwAddress, sessionKey]);

  // Lấy địa chỉ các contract cần thiết
  useEffect(() => {
    const fetchContractAddresses = async () => {
      if (isLoadingAddresses) return;

      try {
        setIsLoadingAddresses(true);
        console.log('[DEBUG] Fetching contract addresses...');
        const response = await apiClient.get('/api/Blockchain/contract-addresses');

        console.log('[DEBUG] Contract addresses API response:', response.data);

        if (response.data && response.data.success) {
          setContractAddresses(response.data);

          // Chỉ cập nhật địa chỉ khi chưa có
          if (!localQuanLyCuocBauCuAddress) {
            // Ưu tiên địa chỉ từ selectedSession
            if (selectedSession?.blockchainAddress) {
              console.log(
                '[DEBUG] Using blockchainAddress from selectedSession:',
                selectedSession.blockchainAddress,
              );
              setLocalQuanLyCuocBauCuAddress(selectedSession.blockchainAddress);
            }
            // Sau đó mới dùng từ API
            else if (response.data.quanLyCuocBauCuAddress) {
              console.log(
                '[DEBUG] Setting quanLyCuocBauCuAddress from API:',
                response.data.quanLyCuocBauCuAddress,
              );
              setLocalQuanLyCuocBauCuAddress(response.data.quanLyCuocBauCuAddress);
            }
          }
        } else {
          console.error('[DEBUG] Failed to fetch contract addresses:', response.data);
        }
      } catch (error) {
        console.error('[DEBUG] Error when fetching contract addresses:', error);
      } finally {
        setIsLoadingAddresses(false);
      }
    };

    fetchContractAddresses();
  }, [selectedSession, localQuanLyCuocBauCuAddress]);

  // Cập nhật địa chỉ quanLyCuocBauCu khi prop thay đổi
  useEffect(() => {
    if (propQuanLyCuocBauCuAddress && propQuanLyCuocBauCuAddress !== localQuanLyCuocBauCuAddress) {
      console.log(
        '[DEBUG] Updating quanLyCuocBauCuAddress from props:',
        propQuanLyCuocBauCuAddress,
      );
      setLocalQuanLyCuocBauCuAddress(propQuanLyCuocBauCuAddress);
    }
  }, [propQuanLyCuocBauCuAddress, localQuanLyCuocBauCuAddress]);

  // Trong hàm component, trường hợp đặc biệt
  useEffect(() => {
    console.log('[DEBUG] VoterManager - Component mounted with addresses:', {
      selectedSessionId: selectedSession?.id,
      selectedSessionBlockchainAddress: selectedSession?.blockchainAddress,
      propQuanLyCuocBauCuAddress,
      localQuanLyCuocBauCuAddress,
    });

    // Ưu tiên địa chỉ từ selectedSession
    if (selectedSession?.blockchainAddress && !localQuanLyCuocBauCuAddress) {
      console.log(
        '[DEBUG] Using blockchainAddress from selectedSession:',
        selectedSession.blockchainAddress,
      );
      setLocalQuanLyCuocBauCuAddress(selectedSession.blockchainAddress);
    }
  }, [selectedSession, propQuanLyCuocBauCuAddress, localQuanLyCuocBauCuAddress]);

  // Kiểm tra trạng thái phiên bầu cử trên blockchain
  const checkBlockchainSessionStatus = useCallback(async (): Promise<void> => {
    console.log('[DEBUG] checkBlockchainSessionStatus - Input values:', {
      selectedSessionId: selectedSession?.id,
      selectedSessionBlockchainAddress: selectedSession?.blockchainAddress,
      propQuanLyCuocBauCuAddress,
      localQuanLyCuocBauCuAddress,
    });

    if (!selectedSession) {
      return;
    }

    // Xác định địa chỉ blockchain thực tế theo thứ tự ưu tiên
    let actualQuanLyCuocBauCuAddress =
      selectedSession.blockchainAddress ||
      localQuanLyCuocBauCuAddress ||
      propQuanLyCuocBauCuAddress ||
      contractAddresses?.quanLyCuocBauCuAddress;

    if (!actualQuanLyCuocBauCuAddress) {
      console.log('[DEBUG] No QuanLyCuocBauCu address available, cannot check blockchain status');
      setBlockchainSessionStatus((prev) => ({
        ...prev,
        error: 'Không có địa chỉ contract blockchain',
      }));
      return;
    }

    if (
      actualQuanLyCuocBauCuAddress &&
      actualQuanLyCuocBauCuAddress !== localQuanLyCuocBauCuAddress
    ) {
      console.log('[DEBUG] Updating localQuanLyCuocBauCuAddress to:', actualQuanLyCuocBauCuAddress);
      setLocalQuanLyCuocBauCuAddress(actualQuanLyCuocBauCuAddress);
    }

    try {
      console.log(
        '[DEBUG] Checking blockchain session status with address:',
        actualQuanLyCuocBauCuAddress,
      );
      const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');

      // Sửa ABI theo đúng contract
      const quanLyCuocBauCuAbi = [
        'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 chiSoBatDau, uint256 gioiHan) external view returns (uint256[] memory)',
        'function layThongTinPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) external view returns (bool, uint256, uint256, uint256, uint256, uint256, address[], bool, uint256, uint256)',
      ];

      const quanLyCuocBauCu = new ethers.Contract(
        actualQuanLyCuocBauCuAddress,
        quanLyCuocBauCuAbi,
        provider,
      );

      // Lấy ID phiên bầu cử mới nhất từ danh sách
      const idCuocBauCu = 1; // ID cuộc bầu cử luôn là 1 trong contract
      try {
        const phienBauCuList = await quanLyCuocBauCu.layDanhSachPhienBauCu(idCuocBauCu, 0, 10);
        console.log('[DEBUG] Retrieved election session list:', phienBauCuList);

        if (phienBauCuList && phienBauCuList.length > 0) {
          const phienBauCuId = phienBauCuList[phienBauCuList.length - 1];
          console.log('[DEBUG] Latest blockchain session ID:', Number(phienBauCuId));
          setBlockchainSessionId(Number(phienBauCuId));

          // Tiếp tục lấy thông tin chi tiết phiên bầu cử...
          const thongTinPhien = await quanLyCuocBauCu.layThongTinPhienBauCu(
            idCuocBauCu,
            phienBauCuId,
          );

          console.log('[DEBUG] Session info from blockchain:', thongTinPhien);

          if (thongTinPhien) {
            const now = Math.floor(Date.now() / 1000);
            const isActive = thongTinPhien[0]; // dangHoatDong
            const startTime = Number(thongTinPhien[1]); // thoiGianBatDau
            const endTime = Number(thongTinPhien[2]); // thoiGianKetThuc
            const totalVoters = Number(thongTinPhien[3]); // soCuTriToiDa

            setBlockchainSessionStatus({
              isActive,
              startTime,
              endTime,
              totalVoters,
              isLoading: false,
              error: '',
            });
          }
        } else {
          setBlockchainSessionStatus({
            isActive: false,
            startTime: 0,
            endTime: 0,
            totalVoters: 0,
            isLoading: false,
            error: 'Chưa có phiên bầu cử nào trên blockchain',
          });
        }
      } catch (error) {
        console.error('[DEBUG] Error fetching blockchain session data:', error);
        setBlockchainSessionStatus({
          isActive: false,
          startTime: 0,
          endTime: 0,
          totalVoters: 0,
          isLoading: false,
          error:
            'Lỗi khi lấy thông tin phiên bầu cử từ blockchain: ' +
            (error instanceof Error ? error.message : 'Lỗi không xác định'),
        });
      }
    } catch (error) {
      console.error('[DEBUG] Error in checkBlockchainSessionStatus:', error);
      setBlockchainSessionStatus({
        isActive: false,
        startTime: 0,
        endTime: 0,
        totalVoters: 0,
        isLoading: false,
        error:
          'Lỗi kết nối đến blockchain: ' +
          (error instanceof Error ? error.message : 'Lỗi không xác định'),
      });
    }
  }, [selectedSession, localQuanLyCuocBauCuAddress, propQuanLyCuocBauCuAddress, contractAddresses]);

  // Load thông tin phiên bầu cử từ blockchain khi component mount
  useEffect(() => {
    console.log('[DEBUG] Effect triggered - Check addresses:', {
      selectedSession: selectedSession
        ? {
            id: selectedSession.id,
            blockchainAddress: selectedSession.blockchainAddress,
          }
        : null,
      localQuanLyCuocBauCuAddress,
      contractAddresses: contractAddresses ? 'loaded' : 'not loaded',
    });

    // Kiểm tra trạng thái blockchain khi có đủ thông tin
    const hasRequiredInfo =
      selectedSession &&
      (selectedSession.blockchainAddress || selectedSession.id) &&
      (localQuanLyCuocBauCuAddress ||
        (contractAddresses && contractAddresses.quanLyCuocBauCuAddress));

    if (hasRequiredInfo) {
      console.log('[DEBUG] Has all required info, checking blockchain session status');
      checkBlockchainSessionStatus();
    } else {
      console.log('[DEBUG] Missing required info, cannot check blockchain session status');
    }
  }, [
    selectedSession,
    localQuanLyCuocBauCuAddress,
    contractAddresses,
    checkBlockchainSessionStatus,
  ]);

  // Load saved ballot metadata from local storage
  useEffect(() => {
    if (selectedSession?.id) {
      try {
        const savedConfig = localStorage.getItem(`ballot_config_${selectedSession.id}`);
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          setBallotMetadata(config);
        }
      } catch (error) {
        console.warn('[DEBUG] Error loading ballot config:', error);
      }
    }
  }, [selectedSession?.id]);

  // Hàm để chuyển đổi tab chủ động
  const switchToTab = useCallback((tabName: string) => {
    setActiveTab(tabName);
  }, []);

  // Kiểm tra tính hợp lệ của cấu hình phiếu
  const validateBallotConfig = useCallback((metadata?: BallotMetadata): boolean => {
    if (!metadata) {
      setConfigValidationState({
        isValid: false,
        message: 'Chưa có cấu hình phiếu bầu',
      });
      return false;
    }

    // Kiểm tra các trường bắt buộc
    if (!metadata.name || !metadata.image) {
      setConfigValidationState({
        isValid: false,
        message: !metadata.name ? 'Thiếu tên phiếu bầu' : 'Thiếu hình ảnh phiếu bầu',
      });
      return false;
    }

    // Cấu hình hợp lệ
    setConfigValidationState({
      isValid: true,
      message: 'Cấu hình phiếu bầu hợp lệ',
    });
    return true;
  }, []);

  // Cập nhật validation state khi ballotMetadata thay đổi
  useEffect(() => {
    validateBallotConfig(ballotMetadata);
  }, [ballotMetadata, validateBallotConfig]);

  // Mở rộng hàm handleMetadataChange
  const handleMetadataChange = useCallback(
    (metadata: BallotMetadata): void => {
      setBallotMetadata(metadata);

      // Lưu vào localStorage
      if (selectedSession?.id) {
        try {
          localStorage.setItem(`ballot_config_${selectedSession.id}`, JSON.stringify(metadata));

          // Validate cấu hình
          validateBallotConfig(metadata);

          // Hiển thị thông báo thành công bổ sung
          toast({
            title: 'Đã lưu cấu hình',
            description: 'Cấu hình phiếu bầu sẽ được áp dụng khi cấp phiếu',
            variant: 'default',
          });
        } catch (error) {
          console.warn('[DEBUG] Error saving ballot config:', error);
        }
      }
    },
    [selectedSession?.id, toast, validateBallotConfig],
  );

  // Refresh data from parent component
  const handleRefreshData = useCallback((): void => {
    if (refreshData) {
      refreshData();
    }

    // Kiểm tra lại trạng thái blockchain
    checkBlockchainSessionStatus();
  }, [refreshData, checkBlockchainSessionStatus]);

  // Handle session start
  const handleSessionStarted = useCallback((): void => {
    // Refresh data after session start
    handleRefreshData();

    // Show success message
    toast({
      title: 'Phiên bầu cử đã bắt đầu',
      description: 'Phiên bầu cử đã được bắt đầu thành công trên blockchain',
    });

    // Switch to voters tab
    setActiveTab('voters');
  }, [handleRefreshData, toast]);

  // Lấy khóa phiên
  const handleGetSessionKey = useCallback(async (): Promise<SessionKeyInfo | null> => {
    setIsLoading(true);
    try {
      if (!userInfo?.id || !walletInfo?.viId) {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Vui lòng đảm bảo đã đăng nhập và có thông tin tài khoản',
        });
        return null;
      }

      // Check if session key exists and is still valid
      if (sessionKey && sessionKey.expiresAt * 1000 > Date.now()) {
        toast({
          title: 'Đã có khóa phiên',
          description: `Khóa phiên còn hạn đến: ${new Date(sessionKey.expiresAt * 1000).toLocaleString()}`,
        });
        return sessionKey;
      }

      const response = await apiClient.post('/api/Blockchain/get-session-key', {
        TaiKhoanID: userInfo.id,
        ViID: walletInfo.viId,
      });

      if (response.data && response.data.success && response.data.sessionKey) {
        const keyInfo: SessionKeyInfo = {
          sessionKey: response.data.sessionKey,
          expiresAt: response.data.expiresAt,
          scwAddress: response.data.scwAddress || scwAddress,
        };

        setSessionKey(keyInfo);
        toast({
          title: 'Thành công',
          description: 'Đã lấy khóa phiên thành công',
        });

        return keyInfo;
      } else {
        throw new Error(response.data?.message || 'Không thể lấy khóa phiên');
      }
    } catch (error) {
      console.error('[DEBUG] Lỗi khi lấy khóa phiên:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Lỗi khi lấy khóa phiên: ' + (error as Error).message,
      });

      // Thử gọi getSessionKey từ prop
      if (getSessionKey) {
        try {
          const keyFromProps = await getSessionKey();
          if (keyFromProps) {
            return keyFromProps;
          }
        } catch (propsError) {
          console.error('[DEBUG] Lỗi khi lấy khóa phiên từ props:', propsError);
        }
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userInfo, walletInfo, scwAddress, sessionKey, toast, setSessionKey, getSessionKey]);

  // Xử lý transaction success
  const handleTransactionSuccess = useCallback(
    (hash: string): void => {
      setTxHash(hash);
      checkBlockchainSessionStatus();
    },
    [checkBlockchainSessionStatus],
  );

  // Render blockchain status component
  const renderBlockchainStatus = (): JSX.Element => {
    return (
      <Alert className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
        <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle>Trạng thái Blockchain</AlertTitle>
        <AlertDescription>
          {blockchainSessionStatus.isLoading ? (
            <div className="flex items-center">
              <Loader className="h-4 w-4 mr-2 animate-spin text-blue-600" />
              Đang kiểm tra trạng thái blockchain...
            </div>
          ) : blockchainSessionStatus.error ? (
            <div className="text-rose-600 dark:text-rose-400">
              Lỗi: {blockchainSessionStatus.error}
              <Button
                variant="outline"
                size="sm"
                className="ml-2 h-7"
                onClick={checkBlockchainSessionStatus}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Thử lại
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>ID phiên bầu cử trên blockchain:</span>
                <span className="font-medium">
                  {blockchainSessionId !== null ? blockchainSessionId : 'Chưa xác định'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Trạng thái:</span>
                <span
                  className={`font-medium ${blockchainSessionStatus.isActive ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}
                >
                  {blockchainSessionStatus.isActive ? 'Đang hoạt động' : 'Chưa bắt đầu'}
                </span>
              </div>
              {blockchainSessionStatus.isActive && (
                <>
                  <div className="flex justify-between">
                    <span>Thời gian bắt đầu:</span>
                    <span className="font-medium flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
                      {new Date(blockchainSessionStatus.startTime * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thời gian kết thúc:</span>
                    <span className="font-medium flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
                      {new Date(blockchainSessionStatus.endTime * 1000).toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span>Số cử tri tối đa:</span>
                <span className="font-medium">{blockchainSessionStatus.totalVoters}</span>
              </div>

              {selectedSession?.blockchainAddress && (
                <div className="flex items-center pt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Địa chỉ contract:
                  </span>
                  <span className="text-sm font-mono ml-2 text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                    {selectedSession.blockchainAddress}
                  </span>
                  <a
                    href={`https://explorer.holihu.online/address/${selectedSession.blockchainAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-600 dark:text-blue-400"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={checkBlockchainSessionStatus}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Làm mới trạng thái
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  // Transaction info display
  const renderTransactionInfo = (): JSX.Element | null => {
    if (!txHash) return null;

    return (
      <Alert className="mt-4 mb-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
        <Network className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <AlertTitle>Thông tin giao dịch gần nhất</AlertTitle>
        <AlertDescription>
          <div className="flex items-center mt-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-2" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Giao dịch đã được xác nhận
            </span>
          </div>
          <div className="flex items-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Hash:</span>
            <span className="text-sm font-mono ml-2 text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
              {txHash}
            </span>
            <a
              href={`https://explorer.holihu.online/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-600 dark:text-blue-400"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-emerald-500 dark:border-emerald-600 bg-gradient-to-br from-white to-emerald-50 dark:from-[#162A45]/90 dark:to-[#1A3529]/70">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-gray-800 dark:text-gray-100">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Quản Lý Phiếu Bầu
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {selectedSession
                  ? `Quản lý phiếu bầu của phiên bầu cử: ${selectedSession.tenPhienBauCu}`
                  : 'Vui lòng chọn phiên bầu cử trước'}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                disabled={isLoading || blockchainSessionStatus.isLoading}
                className="h-9"
              >
                {isLoading || blockchainSessionStatus.isLoading ? (
                  <Loader className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Làm mới
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Thông báo khi không có địa chỉ contract */}
          {!localQuanLyCuocBauCuAddress && selectedSession && (
            <Alert className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
              <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle>Chưa có địa chỉ blockchain</AlertTitle>
              <AlertDescription>
                Không tìm thấy địa chỉ contract blockchain. Vui lòng đảm bảo cuộc bầu cử đã được
                triển khai lên blockchain.
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 mt-2"
                  onClick={checkBlockchainSessionStatus}
                  disabled={blockchainSessionStatus.isLoading}
                >
                  {blockchainSessionStatus.isLoading ? (
                    <Loader className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  )}
                  Làm mới
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Tabs
            defaultValue={activeTab}
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-6 w-full grid grid-cols-3 gap-4">
              <TabsTrigger value="session-start" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                <span>Bắt Đầu Phiên</span>
              </TabsTrigger>
              <TabsTrigger value="ballot-config" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Cấu Hình Phiếu</span>
              </TabsTrigger>
              <TabsTrigger value="voters" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Cấp Phiếu Bầu</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Bắt Đầu Phiên */}
            <TabsContent value="session-start" className="space-y-4">
              {/* Hiển thị trạng thái blockchain */}
              {renderBlockchainStatus()}
              {txHash && renderTransactionInfo()}

              <SessionStartTab
                selectedSession={selectedSession}
                sessionStatus={
                  blockchainSessionStatus.isActive
                    ? {
                        isActive: blockchainSessionStatus.isActive,
                        startTime: blockchainSessionStatus.startTime,
                        endTime: blockchainSessionStatus.endTime,
                      }
                    : sessionStatus
                }
                electionStatus={electionStatus}
                sessionKey={sessionKey}
                scwAddress={scwAddress}
                quanLyCuocBauCuAddress={localQuanLyCuocBauCuAddress}
                onSessionStarted={handleSessionStarted}
                isStartingSession={isStartingSession}
                setIsStartingSession={setIsStartingSession}
                getSessionKey={handleGetSessionKey}
                blockchainSessionId={blockchainSessionId}
              />
            </TabsContent>

            {/* Tab Cấu Hình Phiếu Bầu */}
            <TabsContent value="ballot-config" className="space-y-4">
              <BallotConfigTab
                selectedSession={selectedSession}
                onMetadataChange={handleMetadataChange}
                initialMetadata={ballotMetadata}
              />
            </TabsContent>

            {/* Tab Danh Sách Cử Tri */}
            <TabsContent value="voters" className="space-y-4">
              {/* Hiển thị trạng thái blockchain */}
              {renderBlockchainStatus()}
              {txHash && renderTransactionInfo()}

              <VoterList
                selectedSession={selectedSession}
                sessionStatus={
                  blockchainSessionStatus.isActive
                    ? {
                        isActive: blockchainSessionStatus.isActive,
                        startTime: blockchainSessionStatus.startTime,
                        endTime: blockchainSessionStatus.endTime,
                      }
                    : sessionStatus
                }
                electionStatus={electionStatus}
                sessionKey={sessionKey}
                scwAddress={scwAddress}
                refreshData={handleRefreshData}
                ballotMetadata={ballotMetadata}
                quanLyCuocBauCuAddress={localQuanLyCuocBauCuAddress}
                blockchainSessionId={blockchainSessionId}
                onTransactionSuccess={handleTransactionSuccess}
                configState={configValidationState}
                onConfigureClick={() => switchToTab('ballot-config')}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Session status notifications */}
      {selectedSession && !blockchainSessionStatus.isActive && (
        <Alert className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Phiên bầu cử chưa bắt đầu</AlertTitle>
          <AlertDescription>
            Bạn cần bắt đầu phiên bầu cử trên blockchain trước khi có thể cấp phiếu bầu cho cử tri.
            {!sessionKey && ' Cần lấy khóa phiên trước khi bắt đầu phiên bầu cử.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Session key notice */}
      {!sessionKey && selectedSession && (
        <Card className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50">
          <CardContent className="p-6">
            <div className="flex items-start">
              <Key className="h-10 w-10 text-indigo-600 dark:text-indigo-400 mr-4 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-indigo-800 dark:text-indigo-300 mb-2">
                  Cần khóa phiên
                </h3>
                <p className="text-indigo-700 dark:text-indigo-400 mb-4">
                  Để bắt đầu phiên bầu cử và cấp phiếu bầu, bạn cần tạo khóa phiên để ký các giao
                  dịch trên blockchain.
                </p>
                <Button
                  variant="default"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleGetSessionKey}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="mr-2 h-4 w-4" />
                  )}
                  Lấy Khóa Phiên
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default React.memo(VoterManager);
