'use client';

import type React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alter';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../test/components/use-toast';
import {
  Play,
  AlertCircle,
  Loader,
  CheckCircle2,
  Clock,
  Calendar,
  Info,
  Key,
  Database,
  RefreshCw,
  Shield,
  ExternalLink,
} from 'lucide-react';
import type { PhienBauCu } from '../../store/types';
import apiClient from '../../api/apiClient';

interface SessionStartTabProps {
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
  sessionKey: any;
  scwAddress: string;
  quanLyCuocBauCuAddress?: string;
  onSessionStarted: () => void;
  isStartingSession: boolean;
  setIsStartingSession: (value: boolean) => void;
  getSessionKey: () => Promise<any>;
  blockchainSessionId?: number | null;
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

const SessionStartTab: React.FC<SessionStartTabProps> = ({
  selectedSession,
  sessionStatus,
  electionStatus,
  sessionKey,
  scwAddress,
  quanLyCuocBauCuAddress: propQuanLyCuocBauCuAddress,
  onSessionStarted,
  isStartingSession,
  setIsStartingSession,
  getSessionKey,
  blockchainSessionId,
}) => {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses | null>(null);
  const [localQuanLyCuocBauCuAddress, setLocalQuanLyCuocBauCuAddress] = useState<
    string | undefined
  >(propQuanLyCuocBauCuAddress);
  const [isLoadingContractAddresses, setIsLoadingContractAddresses] = useState<boolean>(false);

  // Debug log component initialization and session status
  useEffect(() => {
    console.log('[DEBUG] SessionStartTab - Component initialized with:', {
      selectedSession: selectedSession
        ? {
            id: selectedSession.id,
            blockchainAddress: selectedSession.blockchainAddress,
          }
        : null,
      propQuanLyCuocBauCuAddress,
      blockchainSessionId,
      sessionKey: sessionKey ? 'present' : 'null',
      sessionStatus: {
        isActive: (sessionStatus.isActive = false),
        startTime: sessionStatus.startTime,
        endTime: sessionStatus.endTime,
      },
    });
  }, []);

  // Lấy địa chỉ contract nếu chưa có
  useEffect(() => {
    const fetchContractAddresses = async () => {
      if (propQuanLyCuocBauCuAddress) {
        console.log('[DEBUG] Using quanLyCuocBauCuAddress from props:', propQuanLyCuocBauCuAddress);
        setLocalQuanLyCuocBauCuAddress(propQuanLyCuocBauCuAddress);
        return;
      }

      // Nếu đã có địa chỉ từ phiên bầu cử
      if (selectedSession?.blockchainAddress && !localQuanLyCuocBauCuAddress) {
        console.log(
          '[DEBUG] Using blockchainAddress from selectedSession:',
          selectedSession.blockchainAddress,
        );
        setLocalQuanLyCuocBauCuAddress(selectedSession.blockchainAddress);
        return;
      }

      if (isLoadingContractAddresses) return;

      try {
        setIsLoadingContractAddresses(true);
        console.log('[DEBUG] Fetching contract addresses...');
        const response = await apiClient.get('/api/Blockchain/contract-addresses');

        console.log('[DEBUG] Contract addresses API response:', response.data);

        if (response.data && response.data.success) {
          setContractAddresses(response.data);

          // Cập nhật địa chỉ quanLyCuocBauCu nếu có
          if (response.data.quanLyCuocBauCuAddress && !localQuanLyCuocBauCuAddress) {
            console.log(
              '[DEBUG] Setting quanLyCuocBauCuAddress from API:',
              response.data.quanLyCuocBauCuAddress,
            );
            setLocalQuanLyCuocBauCuAddress(response.data.quanLyCuocBauCuAddress);
          }
        } else {
          console.error('[DEBUG] Failed to fetch contract addresses:', response.data);
        }
      } catch (error) {
        console.error('[DEBUG] Error when fetching contract addresses:', error);
      } finally {
        setIsLoadingContractAddresses(false);
      }
    };

    fetchContractAddresses();
  }, [propQuanLyCuocBauCuAddress, selectedSession, localQuanLyCuocBauCuAddress]);

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

  // Tính thời gian kéo dài của phiên bầu cử
  const calculateSessionDuration = useCallback(() => {
    if (!selectedSession || !selectedSession.ngayBatDau || !selectedSession.ngayKetThuc) {
      return 3 * 24 * 60 * 60; // Mặc định 3 ngày
    }

    try {
      const startDate = new Date(selectedSession.ngayBatDau);
      const endDate = new Date(selectedSession.ngayKetThuc);

      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const durationInSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
        // Đảm bảo thời gian tối thiểu là 1 giờ
        return Math.max(durationInSeconds, 3600);
      }
    } catch (error) {
      console.warn('[DEBUG] Lỗi khi tính thời gian kéo dài:', error);
    }

    return 3 * 24 * 60 * 60; // Mặc định 3 ngày nếu có lỗi
  }, [selectedSession]);

  // Bắt đầu phiên bầu cử
  const startElectionSession = useCallback(async () => {
    // Debug kiểm tra các giá trị đầu vào
    console.log('[DEBUG] startElectionSession - Input values:', {
      hasSelectedSession: !!selectedSession,
      sessionId: selectedSession?.id,
      hasBlockchainAddress: !!selectedSession?.blockchainAddress,
      blockchainAddress: selectedSession?.blockchainAddress,
      localQuanLyCuocBauCuAddress,
      hasSessionKey: !!sessionKey,
      blockchainSessionId,
    });

    // Kiểm tra các điều kiện cần thiết trước khi bắt đầu
    if (!selectedSession || !sessionKey) {
      const missingInfo = [];
      if (!selectedSession) missingInfo.push('selectedSession');
      if (!sessionKey) missingInfo.push('sessionKey');

      const errorMsg = `Thiếu thông tin cần thiết để bắt đầu phiên bầu cử: ${missingInfo.join(', ')}`;
      console.error('[DEBUG] Missing required info:', errorMsg);

      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: errorMsg,
      });
      return;
    }

    // Xác định địa chỉ blockchain theo thứ tự ưu tiên
    let actualQuanLyCuocBauCuAddress =
      selectedSession.blockchainAddress ||
      localQuanLyCuocBauCuAddress ||
      propQuanLyCuocBauCuAddress;

    // Xử lý khi không có quanLyCuocBauCuAddress
    if (!actualQuanLyCuocBauCuAddress) {
      try {
        console.log('[DEBUG] No quanLyCuocBauCuAddress provided, trying to fetch from API...');
        const addressesResponse = await apiClient.get('/api/Blockchain/contract-addresses');
        console.log('[DEBUG] Contract addresses API response:', addressesResponse.data);

        if (
          addressesResponse.data &&
          addressesResponse.data.success &&
          addressesResponse.data.quanLyCuocBauCuAddress
        ) {
          actualQuanLyCuocBauCuAddress = addressesResponse.data.quanLyCuocBauCuAddress;
          setLocalQuanLyCuocBauCuAddress(actualQuanLyCuocBauCuAddress);
          console.log(
            '[DEBUG] Successfully fetched quanLyCuocBauCuAddress:',
            actualQuanLyCuocBauCuAddress,
          );
        } else {
          throw new Error('Không thể lấy địa chỉ quanLyCuocBauCu từ API');
        }
      } catch (error) {
        const errorMsg =
          'Không thể lấy địa chỉ contract: ' +
          (error instanceof Error ? error.message : 'Lỗi không xác định');
        setErrorMessage(errorMsg);
        console.error('[DEBUG]', errorMsg);
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: errorMsg,
        });
        return;
      }
    }

    try {
      setIsStartingSession(true);
      setProgress(10);
      setErrorMessage('');

      // Provider để tương tác với blockchain
      console.log('[DEBUG] Connecting to blockchain provider...');
      let provider;
      try {
        provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
        const network = await provider.getNetwork();
        console.log('[DEBUG] Connected to network:', network);
      } catch (providerError) {
        throw new Error(
          'Không thể kết nối đến blockchain: ' +
            (providerError instanceof Error ? providerError.message : 'Lỗi không xác định'),
        );
      }

      // Lấy thông tin contract addresses nếu chưa có
      let entryPointAddress, paymasterAddress;

      if (contractAddresses) {
        entryPointAddress = contractAddresses.entryPointAddress;
        paymasterAddress = contractAddresses.paymasterAddress;
      } else {
        console.log('[DEBUG] No contract addresses, fetching from API...');
        const addressesResponse = await apiClient.get('/api/Blockchain/contract-addresses');
        console.log('[DEBUG] Contract addresses API response:', addressesResponse.data);

        if (!addressesResponse.data || !addressesResponse.data.success) {
          throw new Error('Không thể lấy địa chỉ contract');
        }

        setContractAddresses(addressesResponse.data);
        entryPointAddress = addressesResponse.data.entryPointAddress;
        paymasterAddress = addressesResponse.data.paymasterAddress;
      }

      console.log('[DEBUG] Contract addresses:', {
        entryPointAddress,
        paymasterAddress,
        quanLyCuocBauCuAddress: actualQuanLyCuocBauCuAddress,
      });

      // Kiểm tra tính hợp lệ của địa chỉ blockchain
      if (!actualQuanLyCuocBauCuAddress || !ethers.isAddress(actualQuanLyCuocBauCuAddress)) {
        throw new Error(`Địa chỉ QuanLyCuocBauCu không hợp lệ: ${actualQuanLyCuocBauCuAddress}`);
      }

      // Kết nối đến các contract
      const quanLyCuocBauCuAbi = [
        'function batDauPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu, uint256 thoiGianKeoDai) external',
        'function layPhienBauCuMoiNhat(uint256 idCuocBauCu) external view returns (uint256)',
      ];

      const simpleAccountAbi = [
        'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
      ];

      const entryPointAbi = [
        'function getNonce(address sender) external view returns (uint256)',
        'function nonceNguoiGui(address) view returns (uint256)',
        'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
      ];

      console.log('[DEBUG] Creating contract instances...');

      const quanLyCuocBauCu = new ethers.Contract(
        actualQuanLyCuocBauCuAddress,
        quanLyCuocBauCuAbi,
        provider,
      );
      const simpleAccount = new ethers.Contract(sessionKey.scwAddress, simpleAccountAbi, provider);
      const entryPoint = new ethers.Contract(entryPointAddress, entryPointAbi, provider);

      // Lấy nonce hiện tại
      setProgress(20);
      let currentNonce;
      try {
        console.log('[DEBUG] Getting nonce using getNonce...');
        currentNonce = await entryPoint.getNonce(sessionKey.scwAddress);
      } catch (nonceError) {
        console.warn('[DEBUG] getNonce failed, trying nonceNguoiGui...', nonceError);
        try {
          currentNonce = await entryPoint.nonceNguoiGui(sessionKey.scwAddress);
        } catch (nonceError2) {
          const errorMsg =
            'Không thể lấy nonce: ' +
            (nonceError2 instanceof Error ? nonceError2.message : 'Lỗi không xác định');
          console.error('[DEBUG]', errorMsg);
          throw new Error(errorMsg);
        }
      }
      console.log('[DEBUG] Current nonce:', currentNonce.toString());

      // Tính thời gian kéo dài của phiên bầu cử
      const thoiGianKeoDai = calculateSessionDuration();
      console.log('[DEBUG] Session duration:', thoiGianKeoDai, 'seconds');

      // Lấy ID phiên bầu cử
      // Ưu tiên sử dụng blockchainSessionId từ props nếu có
      let sessionIdToUse =
        blockchainSessionId !== null && blockchainSessionId !== undefined
          ? blockchainSessionId
          : selectedSession.id;

      // Nếu không có blockchainSessionId từ props, thử lấy từ blockchain
      if (sessionIdToUse === selectedSession.id) {
        try {
          console.log('[DEBUG] Fetching latest session ID from blockchain...');
          const blockchainSessionIdResponse = await quanLyCuocBauCu.layPhienBauCuMoiNhat(1);
          if (blockchainSessionIdResponse && Number(blockchainSessionIdResponse) > 0) {
            sessionIdToUse = Number(blockchainSessionIdResponse);
            console.log(`[DEBUG] Latest blockchain session ID: ${sessionIdToUse}`);
          }
        } catch (error) {
          console.warn('[DEBUG] Cannot get latest session ID from blockchain:', error);
        }
      }

      // Chuẩn bị callData để gọi hàm batDauPhienBauCu
      setProgress(30);
      console.log('[DEBUG] Preparing callData with session ID:', sessionIdToUse);
      const batDauPhienBauCuCallData = quanLyCuocBauCu.interface.encodeFunctionData(
        'batDauPhienBauCu',
        [
          1, // ID cuộc bầu cử luôn là 1 trong contract
          sessionIdToUse, // Sử dụng ID từ blockchain hoặc từ props
          thoiGianKeoDai,
        ],
      );

      const executeCallData = simpleAccount.interface.encodeFunctionData('execute', [
        actualQuanLyCuocBauCuAddress,
        0,
        batDauPhienBauCuCallData,
      ]);

      // Chuẩn bị paymasterAndData
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const deadlineTime = currentTimestamp + 3600; // 1 giờ sau
      const validationTime = currentTimestamp;

      const paymasterAndData = ethers.concat([
        paymasterAddress,
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
      ]);

      // Chuẩn bị UserOperation
      setProgress(50);
      const userOp = {
        sender: sessionKey.scwAddress,
        nonce: currentNonce.toString(),
        initCode: '0x',
        callData: executeCallData,
        callGasLimit: '2000000',
        verificationGasLimit: '2000000',
        preVerificationGas: '500000',
        maxFeePerGas: ethers.parseUnits('10', 'gwei').toString(),
        maxPriorityFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
        paymasterAndData: paymasterAndData,
        signature: '0x',
      };

      // Lấy hash và ký userOp
      console.log('[DEBUG] Getting userOp hash...');
      const userOpHash = await entryPoint.layHashThaoTac(userOp);

      console.log('[DEBUG] Signing userOp hash...');
      const signingKey = new ethers.SigningKey(sessionKey.sessionKey);
      const signatureObj = signingKey.sign(ethers.getBytes(userOpHash));

      const signature = ethers.Signature.from({
        r: signatureObj.r,
        s: signatureObj.s,
        v: signatureObj.v,
      }).serialized;

      userOp.signature = signature;

      // Gửi UserOperation
      setProgress(70);
      console.log('[DEBUG] Submitting userOp to bundler...');
      const response = await apiClient.post('/api/bundler/submit', {
        ...userOp,
        userOpHash: userOpHash,
      });

      if (!response.data) {
        throw new Error('Không nhận được phản hồi từ bundler');
      }

      const txHash = response.data.txHash || response.data.userOpHash;
      setTxHash(txHash);
      console.log('[DEBUG] Transaction submitted successfully, hash:', txHash);

      // Kiểm tra trạng thái giao dịch
      setProgress(80);
      let checkCount = 0;
      const maxChecks = 30;
      const checkInterval = setInterval(async () => {
        try {
          checkCount++;
          console.log(`[DEBUG] Checking transaction status (${checkCount}/${maxChecks})...`);

          const statusResponse = await apiClient.get(
            `/api/bundler/check-status?userOpHash=${response.data.userOpHash}`,
          );

          console.log('[DEBUG] Status response:', statusResponse.data);

          if (statusResponse.data && statusResponse.data.status === 'success') {
            clearInterval(checkInterval);
            setProgress(100);

            // Cập nhật trạng thái phiên bầu cử
            console.log('[DEBUG] Transaction confirmed, calling onSessionStarted...');
            onSessionStarted();

            toast({
              title: 'Thành công',
              description: 'Phiên bầu cử đã được bắt đầu thành công',
            });
          } else if (statusResponse.data && statusResponse.data.status === 'failed') {
            clearInterval(checkInterval);
            const errorMsg =
              'Giao dịch thất bại: ' + (statusResponse.data.message || 'Lỗi không xác định');
            console.error('[DEBUG]', errorMsg);
            throw new Error(errorMsg);
          }

          if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            setProgress(90);
            console.log('[DEBUG] Max checks reached, transaction still pending');
            toast({
              title: 'Đang xử lý',
              description: 'Giao dịch đã được gửi và đang được xử lý. Vui lòng kiểm tra lại sau.',
            });
          }
        } catch (error) {
          console.error('[DEBUG] Error checking transaction status:', error);
        }
      }, 5000); // Kiểm tra mỗi 5 giây
    } catch (error) {
      console.error('[DEBUG] startElectionSession error:', error);
      setErrorMessage((error as Error).message);
      setProgress(0);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể bắt đầu phiên bầu cử: ' + (error as Error).message,
      });
    } finally {
      if (progress < 80) {
        setIsStartingSession(false);
      }
    }
  }, [
    selectedSession,
    localQuanLyCuocBauCuAddress,
    contractAddresses,
    sessionKey,
    toast,
    setIsStartingSession,
    calculateSessionDuration,
    onSessionStarted,
    blockchainSessionId,
    propQuanLyCuocBauCuAddress,
  ]);

  // Thử lấy địa chỉ contract nếu chưa có
  const tryFetchContractAddresses = async () => {
    try {
      setIsLoadingContractAddresses(true);
      const response = await apiClient.get('/api/Blockchain/contract-addresses');

      console.log('[DEBUG] Contract addresses API response:', response.data);

      if (response.data && response.data.success) {
        setContractAddresses(response.data);

        // Cập nhật địa chỉ quanLyCuocBauCu nếu có
        if (response.data.quanLyCuocBauCuAddress && !localQuanLyCuocBauCuAddress) {
          console.log(
            '[DEBUG] Setting quanLyCuocBauCuAddress from API:',
            response.data.quanLyCuocBauCuAddress,
          );
          setLocalQuanLyCuocBauCuAddress(response.data.quanLyCuocBauCuAddress);

          toast({
            title: 'Đã cập nhật địa chỉ contract',
            description: 'Đã lấy thành công địa chỉ QuanLyCuocBauCu từ API',
          });

          return true;
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể lấy thông tin địa chỉ contract',
        });
      }

      return false;
    } catch (error) {
      console.error('[DEBUG] Error fetching contract addresses:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description:
          'Lỗi khi lấy địa chỉ contract: ' +
          (error instanceof Error ? error.message : 'Lỗi không xác định'),
      });
      return false;
    } finally {
      setIsLoadingContractAddresses(false);
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  // Kiểm tra các điều kiện để hiển thị nút bắt đầu phiên
  const canStartSession =
    !isStartingSession &&
    !sessionStatus.isActive &&
    !!sessionKey &&
    !!localQuanLyCuocBauCuAddress &&
    electionStatus.hasBanToChucRole;

  // Debug log whenever canStartSession changes
  useEffect(() => {
    console.log('[DEBUG] canStartSession changed:', {
      canStartSession,
      isStartingSession,
      sessionStatusIsActive: sessionStatus.isActive,
      hasSessionKey: !!sessionKey,
      hasQuanLyCuocBauCuAddress: !!localQuanLyCuocBauCuAddress,
      hasBanToChucRole: electionStatus.hasBanToChucRole,
    });
  }, [
    canStartSession,
    isStartingSession,
    sessionStatus.isActive,
    sessionKey,
    localQuanLyCuocBauCuAddress,
    electionStatus.hasBanToChucRole,
  ]);

  // Kiểm tra và render component
  if (!selectedSession) {
    return (
      <Alert className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle>Chưa chọn phiên bầu cử</AlertTitle>
        <AlertDescription>Vui lòng chọn một phiên bầu cử để bắt đầu.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-t-4 border-blue-500 dark:border-blue-600 bg-gradient-to-br from-white to-blue-50 dark:from-[#162A45]/90 dark:to-[#1A3545]/70">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50">
            <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
            Bắt Đầu Phiên Bầu Cử
          </CardTitle>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Bắt đầu phiên bầu cử trên blockchain để cử tri có thể tham gia bỏ phiếu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Thông tin phiên bầu cử */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Tên phiên bầu cử
            </h3>
            <p className="text-base font-medium text-gray-900 dark:text-white break-words">
              {selectedSession.tenPhienBauCu}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Thời gian</h3>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-gray-900 dark:text-white break-words">
                  {formatDate(selectedSession.ngayBatDau)} -{' '}
                  {formatDate(selectedSession.ngayKetThuc)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trạng thái phiên bầu cử */}
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-medium mb-3 flex items-center text-gray-800 dark:text-white">
            <Info className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            Trạng thái phiên bầu cử
          </h3>

          <div className="space-y-4">
            {console.log(
              '[DEBUG] Rendering session status with isActive =',
              sessionStatus.isActive,
            )}
            {sessionStatus.isActive ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 sm:mt-0" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">
                    Phiên bầu cử đã bắt đầu
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    Phiên bầu cử đang diễn ra trên blockchain. Bạn có thể cấp phiếu bầu cho cử tri.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/50">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5 sm:mt-0" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    Phiên bầu cử chưa bắt đầu
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Bạn cần bắt đầu phiên bầu cử trên blockchain trước khi có thể cấp phiếu bầu cho
                    cử tri.
                  </p>
                </div>
              </div>
            )}

            {/* Thông tin địa chỉ blockchain */}
            {localQuanLyCuocBauCuAddress ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3 mt-0.5 sm:mt-0" />
                <div className="w-full overflow-hidden">
                  <p className="font-medium text-indigo-800 dark:text-indigo-300">
                    Thông tin blockchain
                  </p>
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">
                    Địa chỉ contract:
                    <span className="ml-1 font-mono text-xs break-all">
                      {localQuanLyCuocBauCuAddress}
                    </span>
                  </p>
                  <div className="mt-1">
                    <a
                      href={`https://explorer.holihu.online/address/${localQuanLyCuocBauCuAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex items-center text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Xem trên blockchain explorer
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800/50">
                <Database className="h-5 w-5 text-rose-600 dark:text-rose-400 mr-3 mt-0.5 sm:mt-0" />
                <div>
                  <p className="font-medium text-rose-800 dark:text-rose-300">
                    Thiếu thông tin địa chỉ blockchain
                  </p>
                  <p className="text-sm text-rose-700 dark:text-rose-400">
                    Phiên bầu cử chưa được triển khai lên blockchain hoặc chưa liên kết với
                    contract.
                  </p>
                </div>
              </div>
            )}

            {/* Thông tin khóa phiên */}
            {!sessionKey && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                <Key className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-3 mt-0.5 sm:mt-0" />
                <div>
                  <p className="font-medium text-indigo-800 dark:text-indigo-300">
                    Cần khóa phiên để bắt đầu
                  </p>
                  <p className="text-sm text-indigo-700 dark:text-indigo-400">
                    Bạn cần lấy khóa phiên trước khi có thể bắt đầu phiên bầu cử trên blockchain.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={getSessionKey}
                    className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700"
                  >
                    <Key className="mr-1 h-3 w-3" />
                    Lấy khóa phiên
                  </Button>
                </div>
              </div>
            )}

            {/* Thông báo lỗi */}
            {errorMessage && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800/50">
                <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 mr-3 mt-0.5 sm:mt-0" />
                <div>
                  <p className="font-medium text-rose-800 dark:text-rose-300">Lỗi</p>
                  <p className="text-sm text-rose-700 dark:text-rose-400">{errorMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tiến trình bắt đầu phiên */}
        {isStartingSession && progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Đang bắt đầu phiên bầu cử...
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {progress}%
              </span>
            </div>
            <div className="relative h-2 bg-gray-200 dark:bg-gray-800/70 rounded-full overflow-hidden">
              <div
                className="absolute h-full rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-indigo-600"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {progress < 30
                ? 'Đang chuẩn bị dữ liệu...'
                : progress < 70
                  ? 'Đang tạo và ký giao dịch...'
                  : progress < 90
                    ? 'Đang gửi giao dịch và chờ xác nhận...'
                    : 'Giao dịch đã được gửi, đang chờ xác nhận cuối cùng...'}
            </p>
          </div>
        )}

        {/* Nút bắt đầu phiên */}
        <div className="flex justify-center mt-4">
          <Button
            onClick={startElectionSession}
            disabled={!canStartSession}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-5 text-sm sm:text-base font-medium ${
              canStartSession
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 hover:shadow-lg'
                : 'bg-gray-400 dark:bg-gray-700'
            } text-white transition-all duration-300`}
          >
            {isStartingSession ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : sessionStatus.isActive ? (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isStartingSession
              ? 'Đang bắt đầu phiên...'
              : sessionStatus.isActive
                ? 'Phiên đã bắt đầu'
                : 'Bắt Đầu Phiên Bầu Cử'}
          </Button>
        </div>

        {/* Hiển thị lý do tại sao không thể bắt đầu phiên */}
        {!canStartSession && !sessionStatus.isActive && !isStartingSession && (
          <div className="text-center text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border border-amber-200 dark:border-amber-800/30">
            {!sessionKey
              ? 'Bạn cần lấy khóa phiên trước khi bắt đầu phiên bầu cử.'
              : !localQuanLyCuocBauCuAddress
                ? 'Không tìm thấy địa chỉ contract blockchain.'
                : !electionStatus.hasBanToChucRole
                  ? 'Bạn không có quyền bắt đầu phiên bầu cử.'
                  : 'Không thể bắt đầu phiên bầu cử. Vui lòng kiểm tra các thông tin cần thiết.'}
          </div>
        )}

        {/* Hướng dẫn */}
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle>Hướng dẫn</AlertTitle>
          <AlertDescription className="text-sm">
            <p>
              Bắt đầu phiên bầu cử sẽ kích hoạt phiên bầu cử trên blockchain, cho phép cử tri tham
              gia bỏ phiếu. Sau khi bắt đầu phiên bầu cử, bạn có thể cấp phiếu bầu cho cử tri trong
              tab "Cấp Phiếu Bầu".
            </p>
            <p className="mt-2">
              <strong>Lưu ý:</strong> Đảm bảo bạn đã cấu hình phiếu bầu trong tab "Cấu Hình Phiếu"
              trước khi cấp phiếu cho cử tri.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default SessionStartTab;
