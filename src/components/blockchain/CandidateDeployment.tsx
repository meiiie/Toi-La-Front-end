import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Contract, JsonRpcProvider, SigningKey, Signature, AbiCoder, ethers } from 'ethers';
import { useToast } from '../../test/components/use-toast';
import {
  Award,
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
import type { UngCuVien, UngCuVienWithAddress } from '../../store/types';

// Enum for deployment status
enum DeploymentStatus {
  NOT_STARTED = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Interface for the component props
interface CandidateDeploymentProps {
  phienBauCuId: number;
  cuocBauCuId: number;
  sessionKey: {
    sessionKey: string;
    expiresAt: number;
    scwAddress: string;
  } | null;
  ungViens: UngCuVien[];
  quanLyCuocBauCuAddress?: string;
  hluTokenAddress?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: DeploymentStatus) => void;
  onProgressChange?: (progress: number) => void;
}

const CandidateDeployment: React.FC<CandidateDeploymentProps> = ({
  phienBauCuId,
  cuocBauCuId,
  sessionKey,
  ungViens,
  quanLyCuocBauCuAddress,
  hluTokenAddress,
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
  const [deployedCandidatesCount, setDeployedCandidatesCount] = useState<number>(0);
  const [contractAddresses, setContractAddresses] = useState<any>(null);
  const [entryPointContract, setEntryPointContract] = useState<Contract | null>(null);
  const [quanLyCuocBauCuContract, setQuanLyCuocBauCuContract] = useState<Contract | null>(null);
  const [hluTokenContract, setHluTokenContract] = useState<Contract | null>(null);
  const [hluApproved, setHluApproved] = useState<boolean>(false);

  // Thêm state cho blockchain
  const [blockchainPhienBauCuId, setBlockchainPhienBauCuId] = useState<string | null>(null);

  // State để lưu trữ địa chỉ blockchain của ứng viên
  const [candidateAddresses, setCandidateAddresses] = useState<Record<number, string>>({});
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Debug info
  const [addressDebugInfo, setAddressDebugInfo] = useState<{
    totalCandidates: number;
    addressesFound: number;
    addressChecked: number;
    addressesLog: Array<{ id: number; hoTen: string; source: string; address: string | null }>;
  }>({
    totalCandidates: 0,
    addressesFound: 0,
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
        'function themNhieuUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu, address[] danhSachUngVien) external',
        'function layDanhSachUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (address[])',
        'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 chiSoBatDau, uint256 gioiHan) view returns (uint256[])',
        'function laPhienHoatDong(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (bool)',
      ];

      const hluTokenAbi = [
        'function balanceOf(address account) view returns (uint256)',
        'function allowance(address owner, address spender) view returns (uint256)',
        'function approve(address spender, uint256 amount) returns (bool)',
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

      if (hluTokenAddress || contractAddresses?.hluTokenAddress) {
        const hluTokenContract = new Contract(
          hluTokenAddress || contractAddresses?.hluTokenAddress,
          hluTokenAbi,
          provider,
        );
        setHluTokenContract(hluTokenContract);
      }

      return {
        entryPointContract,
        quanLyCuocBauCuContract,
        hluTokenContract: hluTokenAddress
          ? new Contract(hluTokenAddress, hluTokenAbi, provider)
          : null,
        simpleAccountAbi,
        provider,
      };
    } catch (error) {
      showError('Lỗi khi khởi tạo contracts: ' + (error as Error).message);
      return null;
    }
  }, [
    contractAddresses,
    quanLyCuocBauCuAddress,
    hluTokenAddress,
    fetchContractAddresses,
    showError,
  ]);

  // Lấy thông tin phiên bầu cử từ blockchain
  const fetchBlockchainPhienBauCuId = useCallback(async () => {
    if (!quanLyCuocBauCuContract) {
      showError('Chưa khởi tạo kết nối đến contract');
      return null;
    }

    try {
      showMessage('Đang lấy thông tin phiên bầu cử từ blockchain...');

      // Lấy danh sách phiên bầu cử từ blockchain
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
        phienBauCuList.map((id: any) => id.toString()),
      );
      console.log('Phiên bầu cử mới nhất:', latestPhienBauCuId.toString());
      console.log('Phiên bầu cử SQL ID:', phienBauCuId);

      // Kiểm tra trạng thái phiên bầu cử
      const isActive = await quanLyCuocBauCuContract.laPhienHoatDong(1, latestPhienBauCuId);
      console.log('Trạng thái phiên bầu cử:', isActive ? 'Đang hoạt động' : 'Chưa bắt đầu');

      showMessage(
        `Phiên bầu cử SQL ID: ${phienBauCuId}, Blockchain ID: ${latestPhienBauCuId.toString()}`,
      );

      return latestPhienBauCuId;
    } catch (error) {
      showError('Lỗi khi lấy thông tin phiên bầu cử: ' + (error as Error).message);
      return null;
    }
  }, [quanLyCuocBauCuContract, phienBauCuId, showMessage, showError]);

  // Check HLU token allowance
  const checkHluAllowance = useCallback(async () => {
    if (!sessionKey || !hluTokenContract || !quanLyCuocBauCuAddress) {
      return false;
    }

    try {
      const allowance = await hluTokenContract.allowance(
        sessionKey.scwAddress,
        quanLyCuocBauCuAddress,
      );
      const hasAllowance = allowance >= ethers.parseEther('10'); // Need at least 10 HLU
      setHluApproved(hasAllowance);
      return hasAllowance;
    } catch (error) {
      console.warn('Lỗi khi kiểm tra allowance HLU:', error);
      return false;
    }
  }, [sessionKey, hluTokenContract, quanLyCuocBauCuAddress]);

  // Approve HLU token
  const approveHluToken = useCallback(async () => {
    if (
      !sessionKey ||
      !contractAddresses ||
      !hluTokenContract ||
      !quanLyCuocBauCuAddress ||
      !entryPointContract
    ) {
      throw new Error('Thiếu thông tin cần thiết để approve token');
    }

    try {
      setIsLoading(true);
      showMessage('Đang phê duyệt token HLU cho cuộc bầu cử...');

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

      // Prepare calldata for approving HLU token
      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');
      const simpleAccountAbi = [
        'function execute(address dest, uint256 value, bytes calldata func) external',
      ];
      const simpleAccount = new Contract(sessionKey.scwAddress, simpleAccountAbi, provider);

      const hluTokenAbi = ['function approve(address spender, uint256 amount) returns (bool)'];
      const hluToken = new Contract(contractAddresses.hluTokenAddress, hluTokenAbi, provider);

      // Prepare calldata for approving HLU token
      const approveAmount = ethers.parseEther('20'); // Approve 20 HLU
      const approveCallData = hluToken.interface.encodeFunctionData('approve', [
        quanLyCuocBauCuAddress,
        approveAmount,
      ]);

      const executeCallData = simpleAccount.interface.encodeFunctionData('execute', [
        contractAddresses.hluTokenAddress,
        0,
        approveCallData,
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
        callGasLimit: '500000',
        verificationGasLimit: '500000',
        preVerificationGas: '100000',
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

      showMessage('Đã gửi giao dịch phê duyệt token');

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
            showMessage('Phê duyệt token HLU thành công');
            setHluApproved(true);
            return true;
          } else if (statusResponse.data.status === 'failed') {
            throw new Error(
              `Giao dịch thất bại: ${statusResponse.data.message || 'Lỗi không xác định'}`,
            );
          } else {
            showMessage(`Đang chờ xác nhận phê duyệt token (${attempts}/${maxAttempts})...`);
          }
        } catch (error) {
          console.warn('Lỗi khi kiểm tra trạng thái:', error);
        }
      }

      if (!confirmed) {
        showMessage('Hết thời gian chờ xác nhận phê duyệt token. Kiểm tra lại sau...');
        // We'll continue anyway, as the approval might still go through
      }

      return confirmed;
    } catch (error) {
      console.error('Lỗi khi phê duyệt token HLU:', error);
      showError(`Lỗi khi phê duyệt token HLU: ${(error as Error).message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [
    sessionKey,
    contractAddresses,
    hluTokenContract,
    quanLyCuocBauCuAddress,
    entryPointContract,
    showMessage,
    showError,
  ]);

  // Check if a candidate is already deployed
  const checkExistingCandidates = useCallback(async () => {
    if (!quanLyCuocBauCuContract || !blockchainPhienBauCuId) {
      return [];
    }

    try {
      const candidates = await quanLyCuocBauCuContract.layDanhSachUngVien(
        1,
        blockchainPhienBauCuId,
      );
      return candidates;
    } catch (error) {
      console.warn('Lỗi khi kiểm tra danh sách ứng viên:', error);
      return [];
    }
  }, [quanLyCuocBauCuContract, blockchainPhienBauCuId]);

  // Hàm lấy địa chỉ blockchain cho ứng viên từ cử tri
  const getBlockchainAddressByCuTriId = useCallback(async (cuTriId: number) => {
    if (!cuTriId) return null;

    try {
      const response = await apiClient.get(`/api/CuTri/${cuTriId}`);
      if (response.data) {
        // Kiểm tra xem có blockchainAddress trong response không
        if (response.data.blockchainAddress) {
          console.log(
            `Tìm thấy địa chỉ blockchain từ cử tri ID ${cuTriId}: ${response.data.blockchainAddress}`,
          );
          return response.data.blockchainAddress;
        } else {
          console.log(`Cử tri ID ${cuTriId} không có blockchainAddress trực tiếp trong DB`);
        }
      }
      return null;
    } catch (error) {
      console.warn(`Lỗi khi lấy thông tin cử tri ${cuTriId}:`, error);
      return null;
    }
  }, []);

  // Hàm lấy địa chỉ blockchain từ API check-verification
  const getBlockchainAddressByVerification = useCallback(
    async (cuTriId: number, phienBauCuId: number) => {
      if (!cuTriId || !phienBauCuId) return null;

      try {
        // Đầu tiên, lấy thông tin email của cử tri
        const cuTriResponse = await apiClient.get(`/api/CuTri/${cuTriId}`);
        if (!cuTriResponse.data || !cuTriResponse.data.email) {
          console.warn(`Không tìm thấy email cho cử tri ID ${cuTriId}`);
          return null;
        }

        const email = cuTriResponse.data.email;
        console.log(`Kiểm tra xác thực cho cử tri ID ${cuTriId} với email ${email}`);

        // Sau đó gọi API check-verification với email và phienBauCuId
        const verificationResponse = await apiClient.get(
          `/api/CuTri/check-verification?email=${encodeURIComponent(email)}&phienBauCuId=${phienBauCuId}`,
        );

        if (verificationResponse.data && verificationResponse.data.success) {
          if (verificationResponse.data.blockchainAddress) {
            console.log(
              `Tìm thấy địa chỉ blockchain qua API check-verification: ${verificationResponse.data.blockchainAddress}`,
            );
            return verificationResponse.data.blockchainAddress;
          } else {
            console.log('API check-verification không trả về địa chỉ blockchain');
          }
        }
        return null;
      } catch (error) {
        console.warn(`Lỗi khi kiểm tra xác thực cho cử tri ID ${cuTriId}:`, error);
        return null;
      }
    },
    [],
  );

  // Lấy địa chỉ blockchain cho tất cả ứng viên
  const fetchAllCandidateBlockchainAddresses = useCallback(async () => {
    if (ungViens.length === 0) {
      return {};
    }

    // Tránh gọi API liên tục nếu mới vừa gọi gần đây
    const now = Date.now();
    if (now - lastFetchTime < 10000 && Object.keys(candidateAddresses).length > 0) {
      return candidateAddresses;
    }

    const addresses: Record<number, string> = {};
    const addressLogs: Array<{
      id: number;
      hoTen: string;
      source: string;
      address: string | null;
    }> = [];
    let foundCount = 0;
    let checkedCount = 0;

    // Lấy địa chỉ blockchain cho từng ứng viên
    for (const ungVien of ungViens) {
      checkedCount++;
      console.log(`Kiểm tra địa chỉ cho ứng viên ID ${ungVien.id} - ${ungVien.hoTen}`);

      // Phương pháp 1: Nếu ứng viên đã có diaChiVi, sử dụng luôn
      const candidate = ungVien as UngCuVienWithAddress;
      if (candidate.diaChiVi) {
        addresses[ungVien.id] = candidate.diaChiVi;
        foundCount++;
        addressLogs.push({
          id: ungVien.id,
          hoTen: ungVien.hoTen,
          source: 'direct',
          address: candidate.diaChiVi,
        });
        console.log(`✅ Có địa chỉ trực tiếp: ${candidate.diaChiVi}`);
        continue;
      }

      // Phương pháp 2: Nếu ứng viên có cuTriId, lấy địa chỉ từ cử tri
      if (ungVien.cuTriId) {
        // Phương pháp 2.1: Lấy trực tiếp từ API cử tri
        const directAddress = await getBlockchainAddressByCuTriId(ungVien.cuTriId);
        if (directAddress) {
          addresses[ungVien.id] = directAddress;
          foundCount++;
          addressLogs.push({
            id: ungVien.id,
            hoTen: ungVien.hoTen,
            source: 'cutri_direct',
            address: directAddress,
          });
          console.log(`✅ Tìm thấy từ cử tri trực tiếp: ${directAddress}`);
          continue;
        }

        // Phương pháp 2.2: Thử dùng API xác thực
        if (ungVien.phienBauCuId) {
          const verificationAddress = await getBlockchainAddressByVerification(
            ungVien.cuTriId,
            ungVien.phienBauCuId,
          );
          if (verificationAddress) {
            addresses[ungVien.id] = verificationAddress;
            foundCount++;
            addressLogs.push({
              id: ungVien.id,
              hoTen: ungVien.hoTen,
              source: 'verification',
              address: verificationAddress,
            });
            console.log(`✅ Tìm thấy từ API xác thực: ${verificationAddress}`);
            continue;
          }
        }
      }

      // Nếu không tìm được địa chỉ
      console.log(`❌ Không tìm thấy địa chỉ cho ứng viên ID ${ungVien.id}`);
      addressLogs.push({
        id: ungVien.id,
        hoTen: ungVien.hoTen,
        source: 'not_found',
        address: null,
      });
    }

    // Cập nhật state
    setAddressDebugInfo({
      totalCandidates: ungViens.length,
      addressesFound: foundCount,
      addressChecked: checkedCount,
      addressesLog: addressLogs.slice(-20), // Giữ 20 bản ghi gần nhất
    });

    setCandidateAddresses(addresses);
    setLastFetchTime(now);

    console.log(`Đã tìm thấy ${foundCount}/${ungViens.length} địa chỉ blockchain`);
    return addresses;
  }, [
    ungViens,
    lastFetchTime,
    candidateAddresses,
    getBlockchainAddressByCuTriId,
    getBlockchainAddressByVerification,
  ]);

  // Lấy danh sách ứng viên có địa chỉ blockchain
  const getCandidatesWithWallets = useCallback(() => {
    // Lọc các ứng viên có địa chỉ blockchain từ cache
    const candidates = ungViens.filter((candidate) => {
      const candidateWithAddr = candidate as UngCuVienWithAddress;
      // Kiểm tra nếu đã có diaChiVi trực tiếp
      if (candidateWithAddr.diaChiVi) return true;

      // Kiểm tra trong state candidateAddresses
      return candidateAddresses[candidate.id] !== undefined;
    });

    // Tạo bản sao của các ứng viên và gán địa chỉ blockchain từ cache
    return candidates.map((candidate) => {
      const candidateCopy = { ...candidate } as UngCuVienWithAddress;

      // Nếu không có diaChiVi trực tiếp, lấy từ cache
      if (!candidateCopy.diaChiVi && candidateAddresses[candidate.id]) {
        candidateCopy.diaChiVi = candidateAddresses[candidate.id];
      }

      return candidateCopy;
    });
  }, [ungViens, candidateAddresses]);

  // Deploy a batch of candidates to blockchain
  const deployCandidateBatch = useCallback(
    async (batch: string[], batchIndex: number, totalBatches: number) => {
      if (
        !sessionKey ||
        !contractAddresses ||
        !quanLyCuocBauCuAddress ||
        !entryPointContract ||
        !blockchainPhienBauCuId
      ) {
        throw new Error('Thiếu thông tin cần thiết để triển khai ứng viên');
      }

      try {
        showMessage(
          `Đang xử lý nhóm ${batchIndex + 1}/${totalBatches} với ${batch.length} ứng viên...`,
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

        // Prepare calldata to add multiple candidates
        const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');
        const simpleAccountAbi = [
          'function execute(address dest, uint256 value, bytes calldata func) external',
        ];
        const simpleAccount = new Contract(sessionKey.scwAddress, simpleAccountAbi, provider);

        const quanLyCuocBauCuAbi = [
          'function themNhieuUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu, address[] danhSachUngVien) external',
        ];
        const quanLyCuocBauCu = new Contract(quanLyCuocBauCuAddress, quanLyCuocBauCuAbi, provider);

        // Prepare calldata for adding multiple candidates
        // QUAN TRỌNG: Sử dụng blockchainPhienBauCuId thay vì phienBauCuId từ SQL
        const themNhieuUngVienCallData = quanLyCuocBauCu.interface.encodeFunctionData(
          'themNhieuUngVien',
          [1, blockchainPhienBauCuId, batch],
        );

        const executeCallData = simpleAccount.interface.encodeFunctionData('execute', [
          quanLyCuocBauCuAddress,
          0,
          themNhieuUngVienCallData,
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
          callGasLimit: '2000000', // Tăng gas limit
          verificationGasLimit: '2000000', // Tăng gas limit
          preVerificationGas: '500000', // Tăng gas limit
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
                `Batch ${batchIndex + 1}/${totalBatches} đã triển khai thành công (${
                  batch.length
                } ứng viên)`,
              );
              setDeployedCandidatesCount((prev) => prev + batch.length);
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
            `Hết thời gian chờ xác nhận batch ${
              batchIndex + 1
            }/${totalBatches}. Tiếp tục với batch tiếp theo...`,
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
        if (batch.length > 5 && (error as Error).message.includes('gas')) {
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

  // Main function to deploy candidates to blockchain
  const deployCandidatesToBlockchain = useCallback(async () => {
    if (deploymentInProgress.current) {
      showMessage('Đang có quá trình triển khai đang diễn ra...');
      return;
    }

    try {
      deploymentInProgress.current = true;
      setIsLoading(true);
      updateStatus(DeploymentStatus.IN_PROGRESS);
      updateProgress(5);
      showMessage('Đang chuẩn bị triển khai ứng viên lên blockchain...');

      // Check required information
      if (!sessionKey) {
        throw new Error('Chưa có khóa phiên (session key)');
      }

      if (!quanLyCuocBauCuAddress) {
        throw new Error('Chưa có địa chỉ quản lý cuộc bầu cử');
      }

      // Initialize contracts
      updateProgress(10);
      await initializeContracts();

      // Lấy ID phiên bầu cử từ blockchain thay vì sử dụng ID từ SQL
      updateProgress(15);
      const blockchainId = await fetchBlockchainPhienBauCuId();
      if (!blockchainId) {
        throw new Error('Không thể lấy ID phiên bầu cử từ blockchain');
      }

      setBlockchainPhienBauCuId(blockchainId.toString());
      showMessage(`Đã lấy ID phiên bầu cử từ blockchain: ${blockchainId.toString()}`);

      // Check HLU token approval
      const hasAllowance = await checkHluAllowance();
      if (!hasAllowance) {
        updateProgress(20);
        showMessage('Cần phê duyệt token HLU cho cuộc bầu cử...');
        const approved = await approveHluToken();
        if (!approved) {
          throw new Error('Không thể phê duyệt token HLU');
        }
      }

      updateProgress(30);

      // Lấy địa chỉ blockchain cho các ứng viên
      showMessage('Đang lấy địa chỉ blockchain cho ứng viên...');
      await fetchAllCandidateBlockchainAddresses();

      // Lấy danh sách ứng viên có địa chỉ blockchain
      const candidatesWithWallets = getCandidatesWithWallets();

      updateProgress(40);

      if (candidatesWithWallets.length === 0) {
        throw new Error('Không có ứng viên nào có địa chỉ ví blockchain. Vui lòng kiểm tra lại.');
      }

      showMessage(`Đã tìm thấy ${candidatesWithWallets.length} ứng viên có thể triển khai`);

      // Get existing candidates
      const existingCandidates = await checkExistingCandidates();

      // Extract wallet addresses and filter out already deployed candidates
      const candidateAddresses: string[] = candidatesWithWallets
        .filter((candidate) => {
          const candidateWithAddr = candidate as UngCuVienWithAddress;
          return !!candidateWithAddr.diaChiVi; // Ensure wallet address exists
        })
        .map((candidate) => {
          const candidateWithAddr = candidate as UngCuVienWithAddress;
          return candidateWithAddr.diaChiVi as string;
        })
        .filter((address) => {
          const isExisting = existingCandidates.some(
            (existingAddr: string) => existingAddr.toLowerCase() === address.toLowerCase(),
          );

          if (isExisting) {
            console.log(`Địa chỉ ${address} đã tồn tại trên blockchain, bỏ qua...`);
          }

          return !isExisting;
        });

      if (candidateAddresses.length === 0) {
        throw new Error(
          'Tất cả ứng viên đã được triển khai trước đó hoặc không có địa chỉ ví hợp lệ',
        );
      }

      showMessage(`Sẽ triển khai ${candidateAddresses.length} ứng viên mới`);
      updateProgress(50);

      // Split candidates into batches (maximum 5 candidates per batch due to fees)
      const BATCH_SIZE = 5;
      const batches: string[][] = [];

      for (let i = 0; i < candidateAddresses.length; i += BATCH_SIZE) {
        batches.push(candidateAddresses.slice(i, i + BATCH_SIZE));
      }

      updateProgress(60);
      showMessage(`Chia thành ${batches.length} batch để triển khai`);

      // Deploy batches sequentially
      let successCount = 0;

      for (let i = 0; i < batches.length; i++) {
        const batchResult = await deployCandidateBatch(batches[i], i, batches.length);

        // Update progress based on completed batches
        const batchProgress = 60 + Math.floor(((i + 1) / batches.length) * 35);
        updateProgress(batchProgress);

        if (batchResult.success) {
          successCount += batches[i].length;
        }

        // Wait a bit between batches to avoid overloading
        if (i < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }

      // Deployment complete
      updateProgress(100);

      if (successCount > 0) {
        updateStatus(DeploymentStatus.COMPLETED);
        setDeployedCandidatesCount(successCount);
        showMessage(
          `Đã triển khai thành công ${successCount}/${candidateAddresses.length} ứng viên lên blockchain`,
        );

        if (onSuccess) {
          onSuccess();
        }

        toast({
          title: 'Triển khai thành công',
          description: `Đã triển khai ${successCount} ứng viên lên blockchain`,
        });
      } else {
        updateStatus(DeploymentStatus.FAILED);
        showError('Không thể triển khai ứng viên lên blockchain');
      }

      return successCount;
    } catch (error) {
      updateStatus(DeploymentStatus.FAILED);
      updateProgress(0);
      showError('Lỗi khi triển khai ứng viên: ' + (error as Error).message);

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
    initializeContracts,
    fetchBlockchainPhienBauCuId,
    checkHluAllowance,
    approveHluToken,
    getCandidatesWithWallets,
    checkExistingCandidates,
    deployCandidateBatch,
    updateStatus,
    updateProgress,
    showMessage,
    showError,
    onSuccess,
    toast,
    fetchAllCandidateBlockchainAddresses,
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
  const statistics = useMemo(() => {
    const totalCandidates = ungViens.length;
    const withWallet = Object.keys(candidateAddresses).length;
    const deployable = getCandidatesWithWallets().length;

    return {
      totalCandidates,
      withWallet,
      deployable,
    };
  }, [ungViens, candidateAddresses, getCandidatesWithWallets]);

  // Lấy thông tin địa chỉ blockchain cho ứng viên khi component mount hoặc khi danh sách ứng viên thay đổi
  useEffect(() => {
    if (ungViens.length > 0) {
      // Không gọi hàm async trực tiếp trong useEffect
      const fetchAddresses = async () => {
        await fetchAllCandidateBlockchainAddresses();
      };

      fetchAddresses();
    }
  }, [ungViens, fetchAllCandidateBlockchainAddresses]);

  // Fetch contracts on mount
  useEffect(() => {
    if (!contractAddresses) {
      fetchContractAddresses();
    }

    // Set a timeout to initialize contracts after contract addresses are fetched
    const timer = setTimeout(() => {
      if (contractAddresses && quanLyCuocBauCuAddress) {
        initializeContracts().then(() => {
          checkHluAllowance();
        });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    contractAddresses,
    quanLyCuocBauCuAddress,
    fetchContractAddresses,
    initializeContracts,
    checkHluAllowance,
  ]);

  // Render
  return (
    <Card className="bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-[#2A3A5A] shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Award className="mr-2 h-5 w-5 text-purple-600 dark:text-purple-400" />
          Triển Khai Ứng Viên
        </CardTitle>
        <CardDescription>Triển khai danh sách ứng viên lên blockchain</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Progress */}
        {deploymentStatus === DeploymentStatus.IN_PROGRESS && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Đã triển khai {deployedCandidatesCount}/{statistics.deployable}
              </span>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
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

        {/* HLU Approval status */}
        {!hluApproved && (
          <Alert className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Cần phê duyệt token HLU</AlertTitle>
            <AlertDescription>
              Để thêm ứng viên vào blockchain, bạn cần phê duyệt token HLU cho cuộc bầu cử. Quá
              trình này sẽ được thực hiện tự động khi bạn bắt đầu triển khai.
            </AlertDescription>
          </Alert>
        )}

        {/* Debug UI - Hiển thị thông tin địa chỉ blockchain*/}
        {(deploymentStatus === DeploymentStatus.IN_PROGRESS || errorMessage) &&
          addressDebugInfo.addressesLog.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                  <Database className="w-4 h-4 mr-1 text-purple-600 dark:text-purple-400" />
                  Chi tiết địa chỉ blockchain
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {addressDebugInfo.addressesFound}/{addressDebugInfo.totalCandidates} địa chỉ
                </span>
              </div>

              <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
                {addressDebugInfo.addressesLog.map((log, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-1.5 rounded ${
                      log.address
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                        : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {log.address ? (
                      <CheckCircle2 className="w-3 h-3 mr-1.5" />
                    ) : (
                      <AlertCircle className="w-3 h-3 mr-1.5" />
                    )}
                    <span className="font-medium truncate max-w-[120px]">{log.hoTen}</span>
                    <span className="ml-2 text-xs opacity-75">({log.source})</span>
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

        {/* Blockchain Phien ID Panel */}
        {blockchainPhienBauCuId && (
          <div className="mb-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50">
            <div className="flex items-center mb-2">
              <Database className="w-4 h-4 mr-2 text-purple-500" />
              <span className="text-sm font-semibold">Thông tin phiên bầu cử Blockchain</span>
            </div>
            <div className="grid grid-cols-1 gap-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">ID Phiên SQL:</span>
                <span className="font-medium">{phienBauCuId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">ID Phiên Blockchain:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {blockchainPhienBauCuId.toString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50">
            <div className="text-sm text-purple-600 dark:text-purple-400">Tổng ứng viên</div>
            <div className="text-xl font-bold text-purple-900 dark:text-purple-300">
              {statistics.totalCandidates}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50">
            <div className="text-sm text-indigo-600 dark:text-indigo-400">Có ví blockchain</div>
            <div className="text-xl font-bold text-indigo-900 dark:text-indigo-300">
              {statistics.withWallet}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <div className="text-sm text-amber-600 dark:text-amber-400">Có thể triển khai</div>
            <div className="text-xl font-bold text-amber-900 dark:text-amber-300">
              {statistics.deployable}
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
                <Loader className="w-5 h-5 mr-2 text-purple-500 dark:text-purple-400 animate-spin" />
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
                  {deploymentStatus === DeploymentStatus.IN_PROGRESS && 'Đang triển khai ứng viên'}
                  {deploymentStatus === DeploymentStatus.COMPLETED && 'Triển khai thành công'}
                  {deploymentStatus === DeploymentStatus.FAILED && 'Triển khai thất bại'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {deploymentStatus === DeploymentStatus.COMPLETED &&
                    `Đã triển khai ${deployedCandidatesCount} ứng viên lên blockchain`}
                  {deploymentStatus === DeploymentStatus.NOT_STARTED &&
                    `${statistics.deployable} ứng viên sẵn sàng để triển khai`}
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

        {/* No deployable candidates warning */}
        {statistics.deployable === 0 && (
          <Alert className="mb-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Không có ứng viên để triển khai</AlertTitle>
            <AlertDescription>
              Ứng viên cần có địa chỉ ví blockchain để triển khai. Ứng viên phải được liên kết với
              cử tri đã xác thực và có ví blockchain.
            </AlertDescription>
          </Alert>
        )}

        {/* Deploy button */}
        <Button
          onClick={deployCandidatesToBlockchain}
          disabled={!canDeploy() || statistics.deployable === 0 || isLoading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 dark:bg-gradient-to-r dark:from-purple-600 dark:to-indigo-700 text-white"
        >
          {isLoading ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="mr-2 h-4 w-4" />
          )}
          {isLoading
            ? 'Đang triển khai...'
            : deploymentStatus === DeploymentStatus.COMPLETED
              ? 'Triển khai thêm ứng viên'
              : 'Triển khai ứng viên lên blockchain'}
        </Button>
      </CardContent>

      <CardFooter className="bg-gray-50 dark:bg-gray-900/20 border-t border-gray-200 dark:border-gray-800/50 px-6 py-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-start mb-1">
            <Info className="w-4 h-4 mr-2 mt-0.5 text-purple-500 dark:text-purple-400" />
            <span>
              Việc triển khai ứng viên sẽ tốn một khoản phí HLU token (khoảng 1 HLU/ứng viên). Mỗi
              ứng viên cần có ví blockchain và đã được xác thực làm cử tri trước đó.
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

export default CandidateDeployment;
