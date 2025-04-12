'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Network,
  Calendar,
  Clock,
  Zap,
  CheckCircle,
  CheckCircle2,
  PlayCircle,
  Loader,
  Key,
  Copy,
  ExternalLink,
  Users,
  BadgeCheck,
  AlertCircle,
  InfoIcon,
  Link,
  XCircle,
  Ticket,
  Shield,
} from 'lucide-react';
import type { CuocBauCu, PhienBauCu } from '../../store/types';
import { ethers } from 'ethers';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alter';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/Tooltip';
import { useToast } from '../../test/components/use-toast';
import apiClient from '../../api/apiClient';

interface SessionDetailProps {
  selectedSession: PhienBauCu;
  selectedElection: CuocBauCu | null;
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
  getSessionKey: () => Promise<any>;
  isStartingSession: boolean;
  votersList: any[];
  scwAddress: string;
  showError: (msg: string) => void;
  showMessage: (msg: string) => void;
  setIsStartingSession: (isStarting: boolean) => void;
  selectedSessionId: number;
  isLoading: boolean;
  checkSessionStatusOnBlockchain?: (electionAddress: string, sessionId: number) => Promise<any>;
}

const SessionDetail: React.FC<SessionDetailProps> = ({
  selectedSession,
  selectedElection,
  sessionStatus,
  electionStatus,
  sessionKey,
  getSessionKey,
  isStartingSession,
  votersList,
  scwAddress,
  showError,
  showMessage,
  setIsStartingSession,
  selectedSessionId,
  isLoading,
  checkSessionStatusOnBlockchain,
}) => {
  const [sessionStartTxHash, setSessionStartTxHash] = useState<string>('');
  const [hashesLinked, setHashesLinked] = useState(false);
  const [frontendHash, setFrontendHash] = useState('');
  const [backendHash, setBackendHash] = useState('');
  const { toast } = useToast();

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

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!selectedSession) return null;

    const now = new Date();
    const endDate = new Date(selectedSession.ngayKetThuc);

    if (isNaN(endDate.getTime())) return null;

    if (now > endDate) return { ended: true };

    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, ended: false };
  };

  // Get time info text
  const getTimeInfoText = () => {
    const timeRemaining = getTimeRemaining();
    if (!timeRemaining) return '-';

    if (timeRemaining.ended) {
      return 'Đã kết thúc';
    }

    return `${timeRemaining.days} ngày, ${timeRemaining.hours} giờ, ${timeRemaining.minutes} phút`;
  };

  // Calculate verification rate
  const calculateVerificationRate = () => {
    if (!votersList.length) return 0;
    const verifiedCount = votersList.filter((voter) => voter.xacMinh).length;
    return Math.round((verifiedCount / votersList.length) * 100);
  };

  // Get block explorer URL
  const getBlockExplorerUrl = (hash: string) => {
    return `https://explorer.holihu.online/transactions/${hash}`;
  };

  // Liên kết frontend hash và backend hash
  const linkHashes = async (frontendHash: string, backendHash: string, sender: string) => {
    if (!frontendHash || !backendHash) {
      showError('Cần có cả frontend hash và backend hash để liên kết');
      return false;
    }

    try {
      showMessage(`Đang liên kết hash: Frontend ${frontendHash}, Backend ${backendHash}`);

      const response = await apiClient.post('/api/bundler/link-hashes', {
        frontendHash,
        backendHash,
        sender,
      });

      if (response.data && response.data.success) {
        showMessage('Đã liên kết hash thành công');
        setHashesLinked(true);

        toast({
          title: 'Liên kết hash thành công',
          description: 'Đã liên kết frontend hash và backend hash',
        });

        return true;
      } else {
        throw new Error(response.data?.message || 'Không thể liên kết hash');
      }
    } catch (error) {
      showError(
        'Lỗi khi liên kết hash: ' + (error instanceof Error ? error.message : 'Không xác định'),
      );
      return false;
    }
  };

  // Calculate session duration
  const calculateSessionDuration = () => {
    if (!selectedSession || !selectedSession.ngayBatDau || !selectedSession.ngayKetThuc) {
      return 3 * 24 * 60 * 60; // Default: 3 days
    }

    try {
      const startDate = new Date(selectedSession.ngayBatDau);
      const endDate = new Date(selectedSession.ngayKetThuc);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 3 * 24 * 60 * 60; // Default: 3 days
      }

      const durationSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
      return Math.max(durationSeconds, 3600); // Ensure minimum duration of 1 hour
    } catch (error) {
      console.warn('Error calculating session duration:', error);
      return 3 * 24 * 60 * 60; // Default: 3 days
    }
  };

  // Start election session (Improved version)
  const startElectionSession = async () => {
    if (!selectedElection?.blockchainAddress || !selectedSessionId || !sessionKey) {
      showError(
        'Thiếu thông tin cần thiết. Vui lòng chọn cuộc bầu cử, phiên bầu cử và tạo khóa phiên.',
      );
      return;
    }

    try {
      setIsStartingSession(true);
      showMessage('Đang chuẩn bị giao dịch bắt đầu phiên bầu cử...');

      // Get contract addresses
      const addressesResponse = await apiClient.get('/api/Blockchain/contract-addresses');
      if (!addressesResponse.data || !addressesResponse.data.success) {
        throw new Error('Không thể lấy địa chỉ contract');
      }

      const contractAddresses = addressesResponse.data;
      const paymasterAddress = contractAddresses.paymasterAddress;
      const entryPointAddress = contractAddresses.entryPointAddress;

      // Prepare blockchain transaction
      const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');

      // Connect to contracts
      const quanLyCuocBauCuAbi = [
        'function batDauPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu, uint256 thoiGianKeoDai) external',
        'function layThongTinPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (bool, uint256, uint256, uint256, uint256, uint256, address[], bool, uint256, uint256)',
      ];

      const simpleAccountAbi = [
        'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
      ];

      const entryPointAbi = [
        'function getNonce(address sender) external view returns (uint256)',
        'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
        'function nonceNguoiGui(address) view returns (uint256)',
      ];

      const quanLyCuocBauCu = new ethers.Contract(
        selectedElection.blockchainAddress,
        quanLyCuocBauCuAbi,
        provider,
      );
      const simpleAccount = new ethers.Contract(sessionKey.scwAddress, simpleAccountAbi, provider);
      const entryPoint = new ethers.Contract(entryPointAddress, entryPointAbi, provider);

      // Calculate session duration
      const thoiGianKeoDai = calculateSessionDuration();
      showMessage(`Thời gian phiên được thiết lập: ${Math.round(thoiGianKeoDai / 3600)} giờ`);

      // Get current nonce - try both methods
      let currentNonce;
      try {
        currentNonce = await entryPoint.getNonce(sessionKey.scwAddress);
      } catch (nonceError) {
        try {
          currentNonce = await entryPoint.nonceNguoiGui(sessionKey.scwAddress);
        } catch (nonceError2) {
          throw new Error(
            'Không thể lấy nonce: ' +
              (nonceError2 instanceof Error ? nonceError2.message : 'Lỗi không xác định'),
          );
        }
      }

      showMessage(`Nonce hiện tại: ${currentNonce.toString()}`);

      // Prepare calldata to start session
      const batDauPhienCallData = quanLyCuocBauCu.interface.encodeFunctionData('batDauPhienBauCu', [
        1, // Election ID is always 1 in contract
        selectedSessionId,
        thoiGianKeoDai,
      ]);

      const executeCallData = simpleAccount.interface.encodeFunctionData('execute', [
        selectedElection.blockchainAddress,
        0,
        batDauPhienCallData,
      ]);

      // Prepare paymasterAndData
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const deadlineTime = currentTimestamp + 3600; // 1 hour later
      const validationTime = currentTimestamp;

      const paymasterAndData = ethers.concat([
        paymasterAddress,
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
      ]);

      // Prepare UserOperation với gas limit cao hơn
      const userOp = {
        sender: sessionKey.scwAddress,
        nonce: currentNonce.toString(),
        initCode: '0x',
        callData: executeCallData,
        callGasLimit: '1000000', // Tăng gas limit
        verificationGasLimit: '1000000', // Tăng verification gas limit
        preVerificationGas: '300000', // Tăng pre-verification gas
        maxFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei').toString(),
        paymasterAndData: paymasterAndData,
        signature: '0x',
      };

      // Lấy hash của userOp
      const userOpHash = await entryPoint.layHashThaoTac(userOp);
      showMessage('Đang ký giao dịch với khóa phiên...');

      try {
        // Ký userOp bằng sessionKey
        const signingKey = new ethers.SigningKey(sessionKey.sessionKey);
        const signatureObj = signingKey.sign(ethers.getBytes(userOpHash));

        const signature = ethers.Signature.from({
          r: signatureObj.r,
          s: signatureObj.s,
          v: signatureObj.v,
        }).serialized;

        userOp.signature = signature;

        // Xác minh chữ ký
        const recoveredAddress = ethers.recoverAddress(ethers.getBytes(userOpHash), signature);
        const sessionKeyAddress = ethers.computeAddress(signingKey.publicKey);

        if (recoveredAddress.toLowerCase() !== sessionKeyAddress.toLowerCase()) {
          throw new Error('Xác minh chữ ký thất bại!');
        }

        showMessage('Chữ ký hợp lệ, tiếp tục gửi giao dịch...');
      } catch (error) {
        console.error('Error signing transaction:', error);
        throw new Error(
          'Lỗi khi ký giao dịch: ' + (error instanceof Error ? error.message : 'Không xác định'),
        );
      }

      // Send UserOperation
      showMessage('Đang gửi giao dịch bắt đầu phiên bầu cử...');

      // Ghi log userOp để debug nếu cần
      console.log('UserOperation:', {
        ...userOp,
        userOpHash: userOpHash,
      });

      const response = await apiClient.post('/api/bundler/submit', {
        ...userOp,
        userOpHash: userOpHash,
      });

      if (!response.data) {
        throw new Error('Không nhận được phản hồi từ bundler');
      }

      // Ghi nhận cả frontend hash và backend hash nếu có
      const frontendUserOpHash = response.data.userOpHash || userOpHash;
      const backendUserOpHash = response.data.backendHash || frontendUserOpHash;
      const txHash = response.data.txHash || frontendUserOpHash;

      // Lưu hash để hiển thị và sử dụng sau này
      setSessionStartTxHash(txHash);
      setFrontendHash(frontendUserOpHash);
      setBackendHash(backendUserOpHash);

      // Nếu có cả hai hash và chúng khác nhau, thử liên kết chúng
      if (frontendUserOpHash && backendUserOpHash && frontendUserOpHash !== backendUserOpHash) {
        try {
          await linkHashes(frontendUserOpHash, backendUserOpHash, sessionKey.scwAddress);
        } catch (linkError) {
          console.warn('Lỗi khi liên kết hash:', linkError);
        }
      }

      toast({
        title: 'Đã gửi giao dịch',
        description:
          'Giao dịch bắt đầu phiên bầu cử đã được gửi thành công. Vui lòng đợi xác nhận.',
      });

      // Thiết lập hàm kiểm tra trạng thái định kỳ
      const checkStatusInterval = setInterval(async () => {
        try {
          const statusResponse = await apiClient.get(
            `/api/bundler/check-status?userOpHash=${frontendUserOpHash}`,
          );

          if (statusResponse.data && statusResponse.data.status === 'success') {
            clearInterval(checkStatusInterval);
            showMessage('Phiên bầu cử đã được bắt đầu thành công!');

            // Làm mới thông tin phiên bầu cử
            if (checkSessionStatusOnBlockchain && selectedElection?.blockchainAddress) {
              await checkSessionStatusOnBlockchain(
                selectedElection.blockchainAddress,
                selectedSessionId,
              );
            }

            toast({
              title: 'Thành công',
              description: 'Phiên bầu cử đã được bắt đầu thành công',
              variant: 'success',
            });
          } else if (statusResponse.data && statusResponse.data.status === 'failed') {
            clearInterval(checkStatusInterval);
            showError(
              'Giao dịch thất bại: ' + (statusResponse.data.message || 'Lỗi không xác định'),
            );
          }
        } catch (error) {
          console.warn('Lỗi khi kiểm tra trạng thái:', error);
        }
      }, 5000); // Kiểm tra mỗi 5 giây

      // Tự động dừng kiểm tra sau 2 phút nếu không có kết quả
      setTimeout(() => {
        clearInterval(checkStatusInterval);
      }, 120000);

      return txHash;
    } catch (error) {
      showError(
        'Lỗi khi bắt đầu phiên bầu cử: ' +
          (error instanceof Error ? error.message : 'Không xác định'),
      );
    } finally {
      setIsStartingSession(false);
    }
  };

  return (
    <Card className="border-t-4 border-violet-500 dark:border-violet-600 bg-gradient-to-br from-white to-violet-50 dark:from-[#162A45]/90 dark:to-[#1A193A]/70">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg text-gray-800 dark:text-gray-100">
              <Network className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              Quản Lý Phiên Bầu Cử{' '}
              {sessionStatus.isActive && (
                <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <Zap className="h-3 w-3 mr-1" />
                  Đang hoạt động
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Bắt đầu phiên bầu cử trên blockchain
            </CardDescription>
          </div>

          {sessionStatus.isActive && (
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/30 dark:bg-emerald-900/20 dark:text-emerald-400"
                      onClick={(e) => {
                        // Redirect to voter management
                        document
                          .querySelector('[value="voters"]')
                          ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                      }}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Quản lý cử tri
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Chuyển đến quản lý cử tri để cấp phiếu bầu</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Tên phiên bầu cử
              </h3>
              <p className="text-base font-medium text-gray-900 dark:text-white break-words">
                {selectedSession.tenPhienBauCu}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mô tả</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                {selectedSession.moTa || 'Chưa có mô tả'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Thời gian</h3>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(selectedSession.ngayBatDau)} -{' '}
                    {formatDate(selectedSession.ngayKetThuc)}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-1.5 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white">
                    Thời gian còn lại: {getTimeInfoText()}
                  </span>
                </div>
              </div>
            </div>

            {/* Blockchain contract info */}
            <div className="rounded-lg p-4 bg-violet-50/70 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30">
              <h3 className="text-sm font-medium text-violet-800 dark:text-violet-300 flex items-center mb-2">
                <InfoIcon className="h-4 w-4 mr-1.5" />
                Thông tin Blockchain
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="text-violet-700 dark:text-violet-400 mr-2 min-w-24">
                    Địa chỉ hợp đồng:
                  </span>
                  <span className="font-mono text-xs text-violet-900 dark:text-violet-300 truncate">
                    {selectedElection?.blockchainAddress ? (
                      <>
                        {selectedElection.blockchainAddress.substring(0, 8)}...
                        {selectedElection.blockchainAddress.substring(
                          selectedElection.blockchainAddress.length - 6,
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-1 text-violet-600 hover:text-violet-800"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedElection.blockchainAddress || '');
                            toast({
                              description: 'Địa chỉ đã được sao chép',
                            });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <a
                          href={`https://explorer.holihu.online/address/${selectedElection.blockchainAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-5 w-5 text-violet-600 hover:text-violet-800"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </>
                    ) : (
                      'Chưa có'
                    )}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-violet-700 dark:text-violet-400 mr-2 min-w-24">
                    Thời gian phiên:
                  </span>
                  <span className="text-violet-900 dark:text-violet-300">
                    {Math.round(calculateSessionDuration() / 3600)} giờ
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-violet-700 dark:text-violet-400 mr-2 min-w-24">
                    ID phiên:
                  </span>
                  <span className="text-violet-900 dark:text-violet-300">{selectedSessionId}</span>
                </div>
              </div>
              {sessionStartTxHash && (
                <div className="mt-3 pt-3 border-t border-violet-200 dark:border-violet-800/30">
                  <div className="flex items-center">
                    <span className="text-violet-700 dark:text-violet-400 mr-2">Giao dịch:</span>
                    <a
                      href={getBlockExplorerUrl(sessionStartTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 font-mono text-xs"
                    >
                      {sessionStartTxHash.substring(0, 8)}...
                      {sessionStartTxHash.substring(sessionStartTxHash.length - 8)}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </div>
              )}

              {/* Hash Linking Information */}
              {frontendHash && backendHash && frontendHash !== backendHash && (
                <div className="mt-3 pt-3 border-t border-violet-200 dark:border-violet-800/30">
                  <div className="text-sm text-violet-700 dark:text-violet-400 mb-1">
                    Liên kết Hash:
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="text-violet-700 dark:text-violet-400 mr-1">Frontend:</span>
                    <span className="font-mono text-violet-900 dark:text-violet-300">
                      {frontendHash.substring(0, 6)}...
                      {frontendHash.substring(frontendHash.length - 4)}
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <span className="text-violet-700 dark:text-violet-400 mr-1">Backend:</span>
                    <span className="font-mono text-violet-900 dark:text-violet-300">
                      {backendHash.substring(0, 6)}...
                      {backendHash.substring(backendHash.length - 4)}
                    </span>
                  </div>
                  <div className="text-xs mt-1">
                    {hashesLinked ? (
                      <span className="text-green-600 dark:text-green-400 flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Đã liên kết hash thành công
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 h-6 text-xs text-violet-600 hover:text-violet-800"
                        onClick={() => linkHashes(frontendHash, backendHash, sessionKey.scwAddress)}
                      >
                        <Link className="h-3 w-3 mr-1" />
                        Liên kết hash
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Trạng thái phiên
              </h3>
              <div className="flex items-center mt-1">
                <Badge
                  className={
                    selectedSession.trangThai === 'Đang diễn ra'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : selectedSession.trangThai === 'Sắp diễn ra'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }
                >
                  {selectedSession.trangThai === 'Đang diễn ra' && (
                    <Zap className="h-3.5 w-3.5 mr-1" />
                  )}
                  {selectedSession.trangThai === 'Sắp diễn ra' && (
                    <Clock className="h-3.5 w-3.5 mr-1" />
                  )}
                  {selectedSession.trangThai === 'Đã kết thúc' && (
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  )}
                  {selectedSession.trangThai}
                </Badge>

                {sessionStatus.isActive ? (
                  <Badge className="ml-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Đã bắt đầu (Blockchain)
                  </Badge>
                ) : (
                  <Badge className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    <AlertCircle className="h-3.5 w-3.5 mr-1" />
                    Chưa bắt đầu (Blockchain)
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Thống kê cử tri
              </h3>
              <div className="flex flex-wrap items-center mt-1 gap-2">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  <Users className="h-3.5 w-3.5 mr-1" />
                  {votersList.length} cử tri
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <BadgeCheck className="h-3.5 w-3.5 mr-1" />
                  {calculateVerificationRate()}% đã xác minh
                </Badge>
                {sessionStatus.isActive && (
                  <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400">
                    <Ticket className="h-3.5 w-3.5 mr-1" />
                    {votersList.filter((v) => v.hasBlockchainWallet).length} phiếu đã cấp
                  </Badge>
                )}
              </div>
            </div>

            {/* Permissions Status */}
            <div className="rounded-lg p-4 bg-blue-50/70 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center mb-2">
                <Shield className="h-4 w-4 mr-1.5" />
                Quyền của bạn
              </h3>
              <div className="flex flex-wrap gap-2">
                {electionStatus.isOwner ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Chủ sở hữu
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Không phải chủ sở hữu
                  </Badge>
                )}

                {electionStatus.hasBanToChucRole ? (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Ban Tổ Chức
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Không có quyền Ban Tổ Chức
                  </Badge>
                )}
              </div>
              {!electionStatus.hasBanToChucRole && !electionStatus.isOwner && (
                <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  Bạn cần có quyền Ban Tổ Chức hoặc là chủ sở hữu để quản lý phiên bầu cử này.
                </p>
              )}
            </div>

            {/* Session control section */}
            <div className="rounded-lg p-4 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 border border-violet-100 dark:border-violet-800/30">
              <h3 className="text-sm font-medium text-violet-800 dark:text-violet-300 mb-3">
                Điều khiển phiên
              </h3>

              {sessionStatus.isActive ? (
                // Already started
                <div className="space-y-3">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mr-2" />
                    <div>
                      <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                        Phiên đã bắt đầu
                      </p>
                      <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80">
                        Phiên bầu cử đang hoạt động trên blockchain
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      // Chuyển sang tab quản lý cử tri
                      document
                        .querySelector('[value="voters"]')
                        ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Quản lý cử tri và cấp phiếu bầu
                  </Button>
                </div>
              ) : (
                // Not started yet
                <div className="space-y-3">
                  <Button
                    className="w-full py-6 text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                    disabled={
                      isStartingSession ||
                      sessionStatus.isActive ||
                      !electionStatus.hasBanToChucRole ||
                      !sessionKey
                    }
                    onClick={startElectionSession}
                  >
                    {isStartingSession ? (
                      <Loader className="mr-2 h-5 w-5 animate-spin" />
                    ) : sessionStatus.isActive ? (
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                    ) : (
                      <PlayCircle className="mr-2 h-5 w-5" />
                    )}
                    {isStartingSession
                      ? 'Đang bắt đầu phiên...'
                      : sessionStatus.isActive
                        ? 'Phiên đã bắt đầu'
                        : 'Bắt Đầu Phiên Bầu Cử'}
                  </Button>

                  {!sessionKey && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={getSessionKey}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="mr-2 h-4 w-4" />
                      )}
                      Lấy Khóa Phiên
                    </Button>
                  )}

                  {!electionStatus.hasBanToChucRole && !electionStatus.isOwner && (
                    <Alert className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertTitle>Thiếu quyền Ban Tổ Chức</AlertTitle>
                      <AlertDescription>
                        Bạn cần có quyền Ban Tổ Chức hoặc là chủ sở hữu để bắt đầu phiên bầu cử.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionDetail;
