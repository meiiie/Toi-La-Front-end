'use client';

import type React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Contract, JsonRpcProvider, SigningKey, Signature, AbiCoder, ethers } from 'ethers';
import { useToast } from '../../test/components/use-toast';
import {
  Loader,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Info,
  RefreshCw,
  Zap,
  Clock,
  Database,
} from 'lucide-react';

// Components
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';

// API
import apiClient from '../../api/apiClient';

// Types
import type { RootState } from '../../store/store';
import type { CuTri } from '../../store/types';

// Enum for deployment status
enum DeploymentStatus {
  NOT_STARTED = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Interface for the component props
interface VoterDeploymentProps {
  phienBauCuId: number;
  cuocBauCuId: number;
  sessionKey: {
    sessionKey: string;
    expiresAt: number;
    scwAddress: string;
  } | null;
  cuTris: CuTri[];
  quanLyCuocBauCuAddress?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: DeploymentStatus) => void;
  onProgressChange?: (progress: number) => void;
}

const VoterDeployment: React.FC<VoterDeploymentProps> = ({
  phienBauCuId,
  cuocBauCuId,
  sessionKey,
  cuTris,
  quanLyCuocBauCuAddress,
  onSuccess,
  onError,
  onStatusChange,
  onProgressChange,
}) => {
  // State
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>(
    DeploymentStatus.NOT_STARTED,
  );
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>('');
  const [deployedVotersCount, setDeployedVotersCount] = useState<number>(0);
  const [contractAddresses, setContractAddresses] = useState<any>(null);
  const [entryPointContract, setEntryPointContract] = useState<Contract | null>(null);
  const [quanLyCuocBauCuContract, setQuanLyCuocBauCuContract] = useState<Contract | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<{
    total: number;
    verified: number;
    withAccount: number;
    withWalletFlag: number;
    withAddress: number;
  } | null>(null);

  // Thêm state để lưu ID phiên bầu cử từ blockchain
  const [blockchainPhienBauCuId, setBlockchainPhienBauCuId] = useState<bigint | null>(null);

  // Thêm state để lưu thông tin debug quá trình lấy địa chỉ
  const [addressDebugInfo, setAddressDebugInfo] = useState<{
    verifiedVoters: number;
    addressFound: number;
    addressChecked: number;
    addressesLog: Array<{ email: string; address: string | null; status: string }>;
  }>({
    verifiedVoters: 0,
    addressFound: 0,
    addressChecked: 0,
    addressesLog: [],
  });

  // Selectors
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);

  // Toast
  const { toast } = useToast();

  // Refs
  const isMounted = useRef(true);
  const deploymentInProgress = useRef(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Debug helper: Log cuTris details when it changes
  useEffect(() => {
    if (cuTris.length > 0) {
      console.log('=== DEBUG CỬ TRI DATA ===');
      console.log('Tổng số cử tri:', cuTris.length);
      console.log('Đã xác thực:', cuTris.filter((ct) => ct.xacMinh).length);
      console.log('Có taiKhoanId:', cuTris.filter((ct) => ct.taiKhoanId).length);
      console.log(
        'Có hasBlockchainWallet=true:',
        cuTris.filter((ct) => ct.hasBlockchainWallet === true).length,
      );
      console.log('Có blockchainAddress:', cuTris.filter((ct) => !!ct.blockchainAddress).length);

      // Lưu thông tin debug để hiển thị
      setDebugInfo({
        total: cuTris.length,
        verified: cuTris.filter((ct) => ct.xacMinh).length,
        withAccount: cuTris.filter((ct) => ct.taiKhoanId).length,
        withWalletFlag: cuTris.filter((ct) => ct.hasBlockchainWallet === true).length,
        withAddress: cuTris.filter((ct) => !!ct.blockchainAddress).length,
      });

      // Log một mẫu cử tri
      if (cuTris.length > 0) {
        console.log('Mẫu cử tri:', cuTris[0]);
      }
    }
  }, [cuTris]);

  // Helper functions
  const updateStatus = useCallback(
    (status: DeploymentStatus) => {
      if (isMounted.current) {
        setDeploymentStatus(status);
        if (onStatusChange) {
          onStatusChange(status);
        }
      }
    },
    [onStatusChange],
  );

  const updateProgress = useCallback(
    (newProgress: number) => {
      if (isMounted.current) {
        setProgress(newProgress);
        if (onProgressChange) {
          onProgressChange(newProgress);
        }
      }
    },
    [onProgressChange],
  );

  const showMessage = useCallback((msg: string) => {
    if (isMounted.current) {
      setMessage(msg);
      console.log(msg);
    }
  }, []);

  const showError = useCallback(
    (msg: string) => {
      if (isMounted.current) {
        setErrorMessage(msg);
        console.error(msg);
        if (onError) {
          onError(msg);
        }

        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: msg,
        });
      }
    },
    [onError, toast],
  );

  // Fetch contract addresses
  const fetchContractAddresses = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/Blockchain/contract-addresses');
      if (response.data && response.data.success) {
        if (!isMounted.current) return null;
        setContractAddresses(response.data);
        return response.data;
      } else {
        throw new Error('Không thể lấy địa chỉ contract');
      }
    } catch (error) {
      showError('Lỗi khi lấy địa chỉ contract: ' + (error as Error).message);
      return null;
    }
  }, [showError]);

  // Initialize contracts
  const initializeContracts = useCallback(async () => {
    try {
      if (!contractAddresses || !quanLyCuocBauCuAddress) {
        const addresses = await fetchContractAddresses();
        if (!addresses) {
          throw new Error('Không thể lấy địa chỉ contract');
        }
      }

      if (!quanLyCuocBauCuAddress) {
        throw new Error('Không có địa chỉ quản lý cuộc bầu cử');
      }

      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // Initialize EntryPoint contract
      const entryPointAbi = [
        'function getNonce(address sender) external view returns (uint256)',
        'function nonceNguoiGui(address) view returns (uint256)',
        'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
        'function xuLyCacThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[] operations, address payable beneficiary) external',
      ];

      const quanLyCuocBauCuAbi = [
        'function themNhieuCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu, address[] danhSachCuTri) external',
        'function laCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu, address cuTri) view returns (bool)',
        'function layDanhSachCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (address[])',
        'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 chiSoBatDau, uint256 gioiHan) view returns (uint256[])',
        'function laPhienHoatDong(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (bool)',
      ];

      const simpleAccountAbi = [
        'function execute(address dest, uint256 value, bytes calldata func) external',
      ];

      const entryPointContract = new Contract(
        contractAddresses?.entryPointAddress,
        entryPointAbi,
        provider,
      );
      setEntryPointContract(entryPointContract);

      const quanLyCuocBauCuContract = new Contract(
        quanLyCuocBauCuAddress,
        quanLyCuocBauCuAbi,
        provider,
      );
      setQuanLyCuocBauCuContract(quanLyCuocBauCuContract);

      return {
        entryPointContract,
        quanLyCuocBauCuContract,
        simpleAccountAbi,
        provider,
      };
    } catch (error) {
      showError('Lỗi khi khởi tạo contracts: ' + (error as Error).message);
      return null;
    }
  }, [contractAddresses, quanLyCuocBauCuAddress, fetchContractAddresses, showError]);

  // Lấy thông tin phiên bầu cử từ blockchain
  const fetchBlockchainPhienBauCuId = useCallback(async () => {
    if (!quanLyCuocBauCuContract) {
      showError('Chưa khởi tạo kết nối đến contract');
      return null;
    }

    try {
      showMessage('Đang lấy thông tin phiên bầu cử từ blockchain...');

      // Lấy danh sách phiên bầu cử từ blockchain
      // Lưu ý: Sử dụng BigInt vì các giá trị uint256 trên blockchain lớn
      const phienBauCuList = await quanLyCuocBauCuContract.layDanhSachPhienBauCu(1, 0, 10);

      if (!phienBauCuList || phienBauCuList.length === 0) {
        showError('Không tìm thấy phiên bầu cử trên blockchain');
        return null;
      }

      // Lấy phiên bầu cử mới nhất
      const latestPhienBauCuId = phienBauCuList[phienBauCuList.length - 1];

      console.log('=== DEBUG PHIÊN BẦU CỬ BLOCKCHAIN ===');
      console.log(
        'Danh sách phiên bầu cử trên blockchain:',
        phienBauCuList.map((id: bigint): string => id.toString()),
      );
      console.log('Phiên bầu cử mới nhất:', latestPhienBauCuId.toString());
      console.log('Phiên bầu cử SQL ID:', phienBauCuId);

      // Kiểm tra trạng thái phiên bầu cử
      const isActive = await quanLyCuocBauCuContract.laPhienHoatDong(1, latestPhienBauCuId);
      console.log('Trạng thái phiên bầu cử:', isActive ? 'Đang hoạt động' : 'Chưa bắt đầu');

      showMessage(`Phiên bầu cử SQL ID: ${phienBauCuId}, Blockchain ID: ${latestPhienBauCuId}`);

      return latestPhienBauCuId;
    } catch (error) {
      showError('Lỗi khi lấy thông tin phiên bầu cử: ' + (error as Error).message);
      return null;
    }
  }, [quanLyCuocBauCuContract, phienBauCuId, showMessage, showError]);

  // Check if a voter is already in the blockchain
  const checkVoterExists = useCallback(
    async (voterAddress: string) => {
      if (!quanLyCuocBauCuContract || !blockchainPhienBauCuId) {
        return false;
      }

      try {
        const isVoter = await quanLyCuocBauCuContract.laCuTri(
          1,
          blockchainPhienBauCuId,
          voterAddress,
        );
        return isVoter;
      } catch (error) {
        console.warn('Lỗi khi kiểm tra cử tri:', error);
        return false;
      }
    },
    [quanLyCuocBauCuContract, blockchainPhienBauCuId],
  );

  // Get list of verified voters with blockchain wallets
  const getVerifiedVotersWithWallet = useCallback(() => {
    // Log toàn bộ danh sách cử tri cho debug
    console.log('Lọc cử tri đã xác thực từ danh sách:', cuTris);

    // Lọc cử tri đã xác thực - chỉ dựa trên xacMinh
    const verifiedVoters = cuTris.filter((cuTri) => cuTri.xacMinh === true);

    console.log(`Tìm thấy ${verifiedVoters.length} cử tri đã xác thực`);

    // Log cử tri phù hợp
    verifiedVoters.forEach((voter) => {
      console.log('✅ Cử tri đã xác thực:', {
        id: voter.id,
        email: voter.email,
        taiKhoanId: voter.taiKhoanId,
        hasBlockchainWallet: voter.hasBlockchainWallet,
        blockchainAddress: voter.blockchainAddress,
      });
    });

    return verifiedVoters;
  }, [cuTris]);

  // Refresh voter verification status to get blockchain address
  const refreshVoterVerificationStatus = useCallback(async (voter: CuTri) => {
    if (!voter.email || !voter.phienBauCuId) {
      console.warn('Không thể kiểm tra xác thực - thiếu email hoặc phienBauCuId');
      return null;
    }

    try {
      console.log(`Kiểm tra trạng thái xác thực cho email ${voter.email}...`);

      // Sử dụng API check-verification để lấy thông tin đầy đủ về cử tri
      const response = await apiClient.get(
        `/api/CuTri/check-verification?email=${encodeURIComponent(voter.email)}&phienBauCuId=${voter.phienBauCuId}`,
      );

      if (response.data && response.data.success) {
        // Log thông tin chi tiết để gỡ lỗi
        console.log('Thông tin xác thực nhận được:', {
          id: response.data.id,
          email: response.data.email,
          xacMinh: response.data.xacMinh,
          hasBlockchainWallet: response.data.hasBlockchainWallet,
          blockchainAddress: response.data.blockchainAddress,
          status: response.data.status,
        });

        // Kiểm tra xem API có trả về địa chỉ blockchain không
        if (response.data.blockchainAddress) {
          console.log(`✅ Tìm thấy địa chỉ blockchain: ${response.data.blockchainAddress}`);
        } else if (response.data.hasBlockchainWallet) {
          console.log('⚠️ Tài khoản có ví blockchain nhưng API không trả về địa chỉ');
        } else {
          console.log('ℹ️ Cử tri không có ví blockchain');
        }

        // Cập nhật thông tin debug
        setAddressDebugInfo((prev) => ({
          ...prev,
          addressChecked: prev.addressChecked + 1,
          addressFound: response.data.blockchainAddress ? prev.addressFound + 1 : prev.addressFound,
          addressesLog: [
            ...prev.addressesLog,
            {
              email: voter.email || '',
              address: response.data.blockchainAddress || null,
              status: response.data.blockchainAddress ? 'success' : 'missing',
            },
          ].slice(-20), // Giữ 20 bản ghi gần nhất
        }));

        return response.data;
      } else {
        console.warn('API check-verification không trả về kết quả thành công:', response.data);
        return null;
      }
    } catch (error) {
      console.error(`❌ Lỗi khi kiểm tra xác thực: ${(error as Error).message}`);
      return null;
    }
  }, []);

  // Deploy a batch of voters to blockchain
  const deployVoterBatch = useCallback(
    async (batch: string[], batchIndex: number, totalBatches: number) => {
      if (
        !sessionKey ||
        !contractAddresses ||
        !quanLyCuocBauCuAddress ||
        !entryPointContract ||
        !blockchainPhienBauCuId
      ) {
        throw new Error('Thiếu thông tin cần thiết để triển khai cử tri');
      }

      try {
        showMessage(
          `Đang xử lý nhóm ${batchIndex + 1}/${totalBatches} với ${batch.length} cử tri...`,
        );

        // Get the current nonce
        let currentNonce;
        try {
          currentNonce = await entryPointContract.getNonce(sessionKey.scwAddress);
        } catch (error) {
          try {
            currentNonce = await entryPointContract.nonceNguoiGui(sessionKey.scwAddress);
          } catch (error2) {
            throw new Error('Không thể lấy nonce: ' + (error2 as Error).message);
          }
        }

        // Prepare calldata to add multiple voters
        const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');
        const simpleAccountAbi = [
          'function execute(address dest, uint256 value, bytes calldata func) external',
        ];
        const simpleAccount = new Contract(sessionKey.scwAddress, simpleAccountAbi, provider);

        const quanLyCuocBauCuAbi = [
          'function themNhieuCuTri(uint256 idCuocBauCu, uint256 idPhienBauCu, address[] danhSachCuTri) external',
        ];
        const quanLyCuocBauCu = new Contract(quanLyCuocBauCuAddress, quanLyCuocBauCuAbi, provider);

        // Prepare calldata for adding multiple voters
        // QUAN TRỌNG: Sử dụng blockchainPhienBauCuId thay vì phienBauCuId từ SQL
        const themNhieuCuTriCallData = quanLyCuocBauCu.interface.encodeFunctionData(
          'themNhieuCuTri',
          [1, blockchainPhienBauCuId, batch],
        );
        console.log(`Call data cho themNhieuCuTri: ${themNhieuCuTriCallData}`);
        console.log(`Danh sách cử tri: ${blockchainPhienBauCuId}`);

        const executeCallData = simpleAccount.interface.encodeFunctionData('execute', [
          quanLyCuocBauCuAddress,
          0,
          themNhieuCuTriCallData,
        ]);

        // Prepare paymasterAndData
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const deadlineTime = currentTimestamp + 3600; // 1 hour later
        const validationTime = currentTimestamp;

        const paymasterAndData = ethers.concat([
          contractAddresses.paymasterAddress,
          AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
          AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
        ]);

        // Create UserOperation
        const userOp = {
          sender: sessionKey.scwAddress,
          nonce: currentNonce.toString(),
          initCode: '0x',
          callData: executeCallData,
          callGasLimit: '2000000', // Tăng lên 5M (từ 500k)
          verificationGasLimit: '2000000', // Tăng lên 3M (từ 200k)
          preVerificationGas: '500000', // Tăng lên 500k (từ 100k)
          maxFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
          maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei').toString(),
          paymasterAndData: paymasterAndData,
          signature: '0x',
        };

        // Sign UserOperation
        const userOpHash = await entryPointContract.layHashThaoTac(userOp);
        const signingKey = new SigningKey(sessionKey.sessionKey);
        const signatureObj = signingKey.sign(ethers.getBytes(userOpHash));

        const signature = Signature.from({
          r: signatureObj.r,
          s: signatureObj.s,
          v: signatureObj.v,
        }).serialized;

        userOp.signature = signature;

        // Send UserOperation to bundler API
        const response = await apiClient.post('/api/bundler/submit', {
          ...userOp,
          userOpHash: userOpHash,
        });

        if (!response.data) {
          throw new Error('Không nhận được phản hồi từ bundler');
        }

        const txHash = response.data.txHash || response.data.userOpHash;
        setTxHash(txHash);

        showMessage(`Đã gửi giao dịch triển khai batch ${batchIndex + 1}/${totalBatches}`);

        // Wait for transaction confirmation
        let confirmed = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!confirmed && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
          attempts++;

          try {
            const statusResponse = await apiClient.get(
              `/api/bundler/check-status?userOpHash=${txHash}`,
            );

            if (statusResponse.data.status === 'success') {
              confirmed = true;
              showMessage(
                `Batch ${batchIndex + 1}/${totalBatches} đã triển khai thành công (${batch.length} cử tri)`,
              );
              setDeployedVotersCount((prev) => prev + batch.length);
              return {
                success: true,
                batchIndex,
                txHash: statusResponse.data.txHash || txHash,
              };
            } else if (statusResponse.data.status === 'failed') {
              throw new Error(
                `Giao dịch thất bại: ${statusResponse.data.message || 'Lỗi không xác định'}`,
              );
            } else {
              showMessage(
                `Đang chờ xác nhận batch ${batchIndex + 1}/${totalBatches} (${attempts}/${maxAttempts})...`,
              );
            }
          } catch (error) {
            console.warn('Lỗi khi kiểm tra trạng thái:', error);
          }
        }

        if (!confirmed) {
          showMessage(
            `Hết thời gian chờ xác nhận batch ${batchIndex + 1}/${totalBatches}. Tiếp tục với batch tiếp theo...`,
          );
        }

        return {
          success: confirmed,
          batchIndex,
          txHash,
        };
      } catch (error) {
        console.error(`Lỗi khi triển khai batch ${batchIndex + 1}:`, error);
        showError(`Lỗi khi triển khai batch ${batchIndex + 1}: ${(error as Error).message}`);

        // If batch size is too large, recommend using smaller batches
        if (batch.length > 10 && (error as Error).message.includes('gas')) {
          showMessage(`Batch quá lớn, có thể cần chia thành các batch nhỏ hơn`);
        }

        return {
          success: false,
          batchIndex,
          error: (error as Error).message,
        };
      }
    },
    [
      sessionKey,
      contractAddresses,
      quanLyCuocBauCuAddress,
      entryPointContract,
      blockchainPhienBauCuId,
      showMessage,
      showError,
    ],
  );

  // Main function to deploy voters to blockchain
  const deployVotersToBlockchain = useCallback(async () => {
    if (deploymentInProgress.current) {
      showMessage('Đang có quá trình triển khai đang diễn ra...');
      return;
    }

    try {
      deploymentInProgress.current = true;
      setIsLoading(true);
      updateStatus(DeploymentStatus.IN_PROGRESS);
      updateProgress(5);
      showMessage('Đang chuẩn bị triển khai cử tri lên blockchain...');

      // Kiểm tra thông tin bắt buộc
      if (!sessionKey) {
        throw new Error('Chưa có khóa phiên (session key)');
      }

      if (!quanLyCuocBauCuAddress) {
        throw new Error('Chưa có địa chỉ quản lý cuộc bầu cử');
      }

      // Khởi tạo contracts
      updateProgress(10);
      await initializeContracts();

      // Lấy ID phiên bầu cử từ blockchain thay vì sử dụng ID từ SQL
      updateProgress(15);
      const blockchainId = await fetchBlockchainPhienBauCuId();
      if (!blockchainId) {
        throw new Error('Không thể lấy ID phiên bầu cử từ blockchain');
      }

      setBlockchainPhienBauCuId(blockchainId);
      showMessage(`Đã lấy ID phiên bầu cử từ blockchain: ${blockchainId.toString()}`);

      // Lấy cử tri đã xác thực
      const verifiedVoters = cuTris.filter((cuTri) => cuTri.xacMinh === true);
      console.log(`Tìm thấy ${verifiedVoters.length} cử tri đã xác thực`);

      if (verifiedVoters.length === 0) {
        throw new Error('Không có cử tri đã xác thực để triển khai');
      }

      // Reset thông tin debug
      setAddressDebugInfo({
        verifiedVoters: verifiedVoters.length,
        addressFound: 0,
        addressChecked: 0,
        addressesLog: [],
      });

      updateProgress(20);
      showMessage(
        `Đang lấy thông tin địa chỉ ví blockchain cho ${verifiedVoters.length} cử tri...`,
      );

      // Mảng chứa địa chỉ ví blockchain
      const voterAddresses: string[] = [];

      // Gọi API check-verification để lấy địa chỉ ví blockchain
      for (let i = 0; i < verifiedVoters.length; i++) {
        const voter = verifiedVoters[i];

        // Cập nhật tiến độ lấy địa chỉ
        updateProgress(20 + Math.floor((i / verifiedVoters.length) * 10));

        if (voter.email && voter.phienBauCuId) {
          try {
            console.log(
              `[${i + 1}/${verifiedVoters.length}] Lấy địa chỉ blockchain cho ${voter.email}...`,
            );
            const verificationData = await refreshVoterVerificationStatus(voter);

            if (verificationData && verificationData.success) {
              // Nếu có blockchainAddress trong kết quả, sử dụng nó
              if (verificationData.blockchainAddress) {
                voterAddresses.push(verificationData.blockchainAddress);
                console.log(`✅ Đã lấy địa chỉ ví: ${verificationData.blockchainAddress}`);
              } else if (verificationData.hasBlockchainWallet && verificationData.taiKhoanId) {
                // Nếu không có blockchainAddress nhưng có ví blockchain, thử lấy địa chỉ từ API khác
                console.log(
                  `⚠️ Tài khoản có ví blockchain nhưng thiếu địa chỉ, thử phương thức khác...`,
                );

                // Ở đây có thể thêm code gọi API lấy địa chỉ ví từ taiKhoanId nếu cần
              }
            } else {
              console.warn(`⚠️ Không lấy được thông tin xác thực cho ${voter.email}`);
            }
          } catch (error) {
            console.warn(`⚠️ Lỗi khi lấy thông tin xác thực: ${(error as Error).message}`);
          }
        }
      }

      updateProgress(30);

      if (voterAddresses.length === 0) {
        throw new Error(
          'Không thể lấy địa chỉ ví blockchain cho bất kỳ cử tri nào. Vui lòng kiểm tra lại.',
        );
      }

      showMessage(
        `Đã lấy được ${voterAddresses.length}/${verifiedVoters.length} địa chỉ ví blockchain`,
      );

      // Kiểm tra cử tri đã tồn tại trên blockchain
      updateProgress(35);
      const filteredAddresses: string[] = [];
      let checkedCount = 0;

      for (const address of voterAddresses) {
        // Chỉ kiểm tra một số mẫu để tiết kiệm thời gian, hoặc tất cả nếu số lượng ít
        if (voterAddresses.length <= 10 || checkedCount < 5) {
          const exists = await checkVoterExists(address);
          checkedCount++;

          if (!exists) {
            filteredAddresses.push(address);
          } else {
            console.log(`Địa chỉ ${address} đã tồn tại trên blockchain, bỏ qua...`);
          }
        } else {
          // Thêm các địa chỉ còn lại mà không kiểm tra
          filteredAddresses.push(address);
        }
      }

      updateProgress(40);

      if (filteredAddresses.length === 0) {
        throw new Error('Tất cả cử tri đã được triển khai trước đó');
      }

      showMessage(`Sẽ triển khai ${filteredAddresses.length} cử tri mới`);

      // Chia cử tri thành các batch (tối đa 20 cử tri mỗi batch)
      const BATCH_SIZE = 20; // Tăng từ 1 lên 20
      const batches: string[][] = [];

      for (let i = 0; i < filteredAddresses.length; i += BATCH_SIZE) {
        batches.push(filteredAddresses.slice(i, i + BATCH_SIZE));
      }

      updateProgress(45);
      showMessage(`Chia thành ${batches.length} batch để triển khai`);

      // Triển khai các batch lần lượt
      let successCount = 0;

      for (let i = 0; i < batches.length; i++) {
        const batchResult = await deployVoterBatch(batches[i], i, batches.length);

        // Cập nhật tiến độ dựa trên số batch đã hoàn thành
        const batchProgress = 45 + Math.floor(((i + 1) / batches.length) * 50);
        updateProgress(batchProgress);

        if (batchResult.success) {
          successCount += batches[i].length;
        }

        // Đợi một chút giữa các batch để tránh quá tải
        if (i < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }

      // Hoàn thành triển khai
      updateProgress(100);

      if (successCount > 0) {
        updateStatus(DeploymentStatus.COMPLETED);
        setDeployedVotersCount(successCount);
        showMessage(
          `Đã triển khai thành công ${successCount}/${filteredAddresses.length} cử tri lên blockchain`,
        );

        if (onSuccess) {
          onSuccess();
        }

        toast({
          title: 'Triển khai thành công',
          description: `Đã triển khai ${successCount} cử tri lên blockchain`,
        });
      } else {
        updateStatus(DeploymentStatus.FAILED);
        showError('Không thể triển khai cử tri lên blockchain');
      }

      return successCount;
    } catch (error) {
      updateStatus(DeploymentStatus.FAILED);
      updateProgress(0);
      showError('Lỗi khi triển khai cử tri: ' + (error as Error).message);

      toast({
        variant: 'destructive',
        title: 'Lỗi triển khai',
        description: (error as Error).message,
      });

      return 0;
    } finally {
      setIsLoading(false);
      deploymentInProgress.current = false;
    }
  }, [
    sessionKey,
    quanLyCuocBauCuAddress,
    cuTris,
    initializeContracts,
    fetchBlockchainPhienBauCuId,
    refreshVoterVerificationStatus,
    checkVoterExists,
    deployVoterBatch,
    updateStatus,
    updateProgress,
    showMessage,
    showError,
    onSuccess,
    toast,
  ]);

  // Check if deployment is possible
  const canDeploy = useCallback(() => {
    return (
      !!sessionKey &&
      !!quanLyCuocBauCuAddress &&
      !isLoading &&
      deploymentStatus !== DeploymentStatus.IN_PROGRESS
    );
  }, [sessionKey, quanLyCuocBauCuAddress, isLoading, deploymentStatus]);

  // Get statistics
  const getStatistics = useCallback(() => {
    const totalVoters = cuTris.length;
    const verifiedVoters = cuTris.filter((voter) => voter.xacMinh).length;
    // Đếm số cử tri có ví blockchain
    const withWallet = cuTris.filter(
      (voter) => voter.hasBlockchainWallet === true || !!voter.blockchainAddress,
    ).length;
    const deployable = getVerifiedVotersWithWallet().length;

    return {
      totalVoters,
      verifiedVoters,
      withWallet,
      deployable,
    };
  }, [cuTris, getVerifiedVotersWithWallet]);

  // Fetch contracts on mount
  useEffect(() => {
    if (!contractAddresses) {
      fetchContractAddresses();
    }

    // Set a timeout to initialize contracts after contract addresses are fetched

    const timer = setTimeout(() => {
      if (contractAddresses && quanLyCuocBauCuAddress) {
        initializeContracts();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [contractAddresses, quanLyCuocBauCuAddress, fetchContractAddresses, initializeContracts]);

  // Render
  const stats = getStatistics();

  return (
    <Card className="bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-[#2A3A5A] shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800/50">
            <UserPlus className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
            Triển Khai Cử Tri
          </CardTitle>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Triển khai danh sách cử tri đã xác thực lên blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress */}
        {deploymentStatus === DeploymentStatus.IN_PROGRESS && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Đã triển khai {deployedVotersCount}/{stats.deployable}
              </span>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Status message */}
        {message && (
          <Alert
            className={`mb-4 ${
              deploymentStatus === DeploymentStatus.FAILED
                ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300'
                : deploymentStatus === DeploymentStatus.COMPLETED
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300'
            }`}
          >
            {deploymentStatus === DeploymentStatus.FAILED ? (
              <AlertCircle className="h-4 w-4" />
            ) : deploymentStatus === DeploymentStatus.COMPLETED ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {(deploymentStatus === DeploymentStatus.IN_PROGRESS || errorMessage) && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <Database className="w-4 h-4 mr-1 text-indigo-600 dark:text-indigo-400" />
                Chi tiết quá trình lấy địa chỉ
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {addressDebugInfo.addressFound}/{addressDebugInfo.verifiedVoters} địa chỉ
              </span>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
              {addressDebugInfo.addressesLog.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-center p-1.5 rounded ${
                    log.status === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {log.status === 'success' ? (
                    <CheckCircle2 className="w-3 h-3 mr-1.5" />
                  ) : (
                    <AlertCircle className="w-3 h-3 mr-1.5" />
                  )}
                  <span className="font-medium truncate max-w-[120px]">{log.email}</span>
                  {log.address ? (
                    <span className="ml-2 font-mono truncate flex-1">{log.address}</span>
                  ) : (
                    <span className="ml-2 italic">không có địa chỉ</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Info Panel */}
        {debugInfo && (
          <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center mb-2">
              <Database className="w-4 h-4 mr-2 text-purple-500" />
              <span className="text-sm font-semibold">Chi tiết dữ liệu cử tri</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="text-gray-500">Tổng số:</div>
              <div>{debugInfo.total}</div>
              <div className="text-gray-500">Có tài khoản:</div>
              <div>{debugInfo.withAccount}</div>
              <div className="text-gray-500">Flag hasBlockchainWallet=true:</div>
              <div>{debugInfo.withWalletFlag}</div>
              <div className="text-gray-500">Có blockchainAddress:</div>
              <div>{debugInfo.withAddress}</div>
            </div>
          </div>
        )}

        {/* Blockchain Phien ID Panel */}
        {blockchainPhienBauCuId !== null && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
            <div className="flex items-center mb-2">
              <Database className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-sm font-semibold">Thông tin phiên bầu cử Blockchain</span>
            </div>
            <div className="grid grid-cols-1 gap-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">ID Phiên SQL:</span>
                <span className="font-medium">{phienBauCuId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">ID Phiên Blockchain:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {blockchainPhienBauCuId ? String(blockchainPhienBauCuId) : '0'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
            <div className="text-sm text-blue-600 dark:text-blue-400">Tổng cử tri</div>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-300">
              {stats.totalVoters}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50">
            <div className="text-sm text-green-600 dark:text-green-400">Đã xác thực</div>
            <div className="text-xl font-bold text-green-900 dark:text-green-300">
              {stats.verifiedVoters}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50">
            <div className="text-sm text-purple-600 dark:text-purple-400">Có ví blockchain</div>
            <div className="text-xl font-bold text-purple-900 dark:text-purple-300">
              {stats.withWallet}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <div className="text-sm text-amber-600 dark:text-amber-400">Có thể triển khai</div>
            <div className="text-xl font-bold text-amber-900 dark:text-amber-300">
              {stats.deployable}
            </div>
          </div>
        </div>

        {/* Status display */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50">
            <div className="flex items-center">
              {deploymentStatus === DeploymentStatus.NOT_STARTED && (
                <Clock className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" />
              )}
              {deploymentStatus === DeploymentStatus.IN_PROGRESS && (
                <Loader className="w-5 h-5 mr-2 text-blue-500 dark:text-blue-400 animate-spin" />
              )}
              {deploymentStatus === DeploymentStatus.COMPLETED && (
                <CheckCircle2 className="w-5 h-5 mr-2 text-green-500 dark:text-green-400" />
              )}
              {deploymentStatus === DeploymentStatus.FAILED && (
                <AlertCircle className="w-5 h-5 mr-2 text-rose-500 dark:text-rose-400" />
              )}
              <div>
                <div className="font-medium">
                  {deploymentStatus === DeploymentStatus.NOT_STARTED && 'Chưa triển khai'}
                  {deploymentStatus === DeploymentStatus.IN_PROGRESS && 'Đang triển khai cử tri'}
                  {deploymentStatus === DeploymentStatus.COMPLETED && 'Triển khai thành công'}
                  {deploymentStatus === DeploymentStatus.FAILED && 'Triển khai thất bại'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {deploymentStatus === DeploymentStatus.COMPLETED &&
                    `Đã triển khai ${deployedVotersCount} cử tri lên blockchain`}
                  {deploymentStatus === DeploymentStatus.NOT_STARTED &&
                    `${stats.deployable} cử tri sẵn sàng để triển khai`}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchContractAddresses}
              disabled={isLoading}
              className="ml-2 hidden md:flex"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <Alert
            variant="destructive"
            className="mb-4 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* No deployable voters warning */}
        {stats.deployable === 0 && (
          <Alert className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Không có cử tri để triển khai</AlertTitle>
            <AlertDescription>
              Cần có cử tri đã xác thực và có trường hasBlockchainWallet=true hoặc blockchainAddress
              để triển khai. Vui lòng kiểm tra lại thông tin cử tri trước khi triển khai.
            </AlertDescription>
          </Alert>
        )}

        {/* Deploy button */}
        <Button
          onClick={deployVotersToBlockchain}
          disabled={!canDeploy() || stats.deployable === 0 || isLoading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-700 text-white"
        >
          {isLoading ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="mr-2 h-4 w-4" />
          )}
          {isLoading
            ? 'Đang triển khai...'
            : deploymentStatus === DeploymentStatus.COMPLETED
              ? 'Triển khai thêm cử tri'
              : 'Triển khai cử tri lên blockchain'}
        </Button>
      </CardContent>

      <CardFooter className="bg-gray-50 dark:bg-gray-900/20 border-t border-gray-200 dark:border-gray-800/50 px-6 py-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start mb-1">
            <Info className="w-4 h-4 mr-2 mt-0.5 text-blue-500 dark:text-blue-400" />
            <span>
              Chỉ các cử tri đã xác thực và có trường hasBlockchainWallet=true hoặc
              blockchainAddress mới có thể được triển khai lên blockchain. Địa chỉ ví blockchain sẽ
              được lấy tự động từ thông tin cử tri.
            </span>
          </div>
          {txHash && (
            <div className="mt-2 text-xs">
              <span className="font-medium">Transaction Hash: </span>
              <span className="font-mono">{txHash}</span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default VoterDeployment;
