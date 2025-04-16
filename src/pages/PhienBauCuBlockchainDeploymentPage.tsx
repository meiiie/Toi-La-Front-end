'use client';

import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useToast } from '../test/components/use-toast';
import { SigningKey, AbiCoder, Contract, JsonRpcProvider, Signature, ethers } from 'ethers';

// Redux imports
import type { RootState, AppDispatch } from '../store/store';
import { getViByAddress } from '../store/sliceBlockchain/viBlockchainSlice';
import { fetchPhienBauCuById } from '../store/slice/phienBauCuSlice';
import { fetchCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice';
import {
  fetchViTriUngCuStatisticsByPhienBauCuId,
  selectPositionStats,
} from '../store/slice/viTriUngCuSlice';
import { fetchCuTriByPhienBauCuId } from '../store/slice/cuTriSlice';
import { fetchUngCuVienByPhienBauCuId } from '../store/slice/ungCuVienSlice';

// Components
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';

// Custom Blockchain Components
import ApproveHLU from '../components/blockchain/ApproveHLU';
import ElectionWorkflowManager from '../components/blockchain/ElectionWorkflowManager';
// First, import the new components at the top of the file with the other imports
import VoterDeployment from '../components/blockchain/VoterDeployment';
import CandidateDeployment from '../components/blockchain/CandidateDeployment';
// Icons
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Loader,
  ExternalLink,
  Server,
  Wallet,
  Key,
  Info,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Calendar,
  Users,
  Network,
  Link,
  ChevronLeft,
  Database,
  UserPlus,
  Award,
  Frame,
  Zap,
  FileText,
  Lock,
  Cpu,
} from 'lucide-react';

// API
import apiClient from '../api/apiClient';
import BlockchainStatusDisplay from '../components/blockchain/blockchain-status-display';

// Deployment status enum
enum DeploymentStatus {
  NOT_STARTED = 0,
  CHECKING_REQUIREMENTS = 1,
  CREATING_SESSION_KEY = 2,
  APPROVING_TOKENS = 3,
  PREPARING_CALLDATA = 4,
  CREATING_USEROP = 5,
  SENDING_USEROP = 6,
  WAITING_CONFIRMATION = 7,
  SUCCESS = 8,
  FAILED = 9,
}

// Session key info interface
interface SessionKeyInfo {
  sessionKey: string;
  expiresAt: number;
  scwAddress: string;
}

// Contract addresses interface
interface ContractAddresses {
  entryPointAddress: string;
  factoryAddress: string;
  paymasterAddress: string;
  hluTokenAddress: string;
  chainId: number;
}

// Component to display step status
const StepStatus: React.FC<{
  currentStatus: DeploymentStatus;
  stepStatus: DeploymentStatus;
  title: string;
  description: string;
  isCompleted?: boolean;
}> = ({ currentStatus, stepStatus, title, description, isCompleted }) => {
  let statusIcon;
  let statusClass;

  if (isCompleted) {
    statusIcon = <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
    statusClass = 'text-emerald-500';
  } else if (currentStatus === DeploymentStatus.FAILED) {
    statusIcon = <XCircle className="w-6 h-6 text-rose-500" />;
    statusClass = 'text-rose-500';
  } else if (currentStatus > stepStatus) {
    statusIcon = <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
    statusClass = 'text-emerald-500';
  } else if (currentStatus === stepStatus) {
    statusIcon = <Loader className="w-6 h-6 text-cyan-500 animate-spin" />;
    statusClass = 'text-cyan-500';
  } else {
    statusIcon = <Clock className="w-6 h-6 text-gray-400 dark:text-gray-500" />;
    statusClass = 'text-gray-400 dark:text-gray-500';
  }

  return (
    <div className="flex items-start space-x-3 mb-3">
      <div className={`flex-shrink-0 mt-1 ${statusClass}`}>{statusIcon}</div>
      <div>
        <h4 className={`text-lg font-medium ${statusClass}`}>{title}</h4>
        <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
      </div>
    </div>
  );
};

// First, import the BlockchainStatusDisplay component

const PhienBauCuBlockchainDeploymentPage: React.FC<{
  phienBauCu: any;
  onNavigateToBlockchain?: () => void;
}> = ({ phienBauCu, onNavigateToBlockchain }) => {
  const { sessionId: phienBauCuId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { toast } = useToast();

  // Redux state
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);
  const cuocBauCu = useSelector((state: RootState) => state.cuocBauCuById?.cuocBauCu);
  const cuTris = useSelector((state: RootState) => state.cuTri?.cacCuTri || []);
  const ungViens = useSelector((state: RootState) => state.ungCuVien?.cacUngCuVien || []);
  const positionStats = useSelector((state: RootState) => selectPositionStats(state));
  console.log('Cử tri từ Redux:', cuTris);

  // Local state
  const [taiKhoanId, setTaiKhoanId] = useState<string>('');
  const [viId, setViId] = useState<string>('');
  const [scwAddress, setScwAddress] = useState<string>('');
  const [status, setStatus] = useState(DeploymentStatus.NOT_STARTED);
  const [message, setMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [sessionKey, setSessionKey] = useState<SessionKeyInfo | null>(null);
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses | null>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [balances, setBalances] = useState({
    hluBalance: '0',
    allowanceForFactory: '0',
    allowanceForPaymaster: '0',
  });
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [frontendHash, setFrontendHash] = useState('');
  const [backendHash, setBackendHash] = useState('');
  const [hashesLinked, setHashesLinked] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showHelp, setShowHelp] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    isRunning: boolean;
    progress: number;
    message: string;
  }>({
    isRunning: false,
    progress: 0,
    message: '',
  });
  const [electionStatus, setElectionStatus] = useState<{
    owner: string;
    isOwner: boolean;
    isActive: boolean;
    hasBanToChucRole: boolean;
  }>({
    owner: '',
    isOwner: false,
    isActive: false,
    hasBanToChucRole: false,
  });

  // Deployment workflow state
  const [deploymentStep, setDeploymentStep] = useState<number>(1);
  const [voterDeploymentStatus, setVoterDeploymentStatus] = useState<
    'pending' | 'in_progress' | 'completed' | 'failed'
  >('pending');
  const [candidateDeploymentStatus, setCandidateDeploymentStatus] = useState<
    'pending' | 'in_progress' | 'completed' | 'failed'
  >('pending');
  const [voterDeploymentProgress, setVoterDeploymentProgress] = useState<number>(0);
  const [candidateDeploymentProgress, setCandidateDeploymentProgress] = useState<number>(0);
  const [deployedVotersCount, setDeployedVotersCount] = useState<number>(0);
  const [deployedCandidatesCount, setDeployedCandidatesCount] = useState<number>(0);
  const [voterDeploymentMessage, setVoterDeploymentMessage] = useState<string>('');
  const [candidateDeploymentMessage, setCandidateDeploymentMessage] = useState<string>('');

  // Add a state to track if checking permission
  const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(false);

  // Memoized functions
  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    console.log(msg);
  }, []);

  const showError = useCallback(
    (msg: string) => {
      setErrorMessage(msg);
      console.error(msg);

      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: msg,
      });
    },
    [toast],
  );

  // Fetch contract addresses
  const fetchContractAddresses = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/Blockchain/contract-addresses');
      if (response.data && response.data.success) {
        setContractAddresses(response.data);
        showMessage('Đã lấy thông tin địa chỉ contract');
        return response.data;
      } else {
        throw new Error('Không thể lấy địa chỉ contract');
      }
    } catch (error) {
      showError('Lỗi khi lấy địa chỉ contract: ' + (error as Error).message);
      return null;
    }
  }, [showMessage, showError]);

  // Add a function to check election status including BANTOCHUC role

  const checkElectionStatus = useCallback(async () => {
    if (!cuocBauCu?.blockchainAddress || !scwAddress) {
      showError('Thiếu thông tin cần thiết để kiểm tra trạng thái cuộc bầu cử');
      return false;
    }

    try {
      setIsLoading(true);
      setIsCheckingPermission(true);
      showMessage('Đang kiểm tra trạng thái cuộc bầu cử...');

      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');
      const quanLyCuocBauCuAbi = [
        'function layThongTinCoBan(uint256 idCuocBauCu) view returns (address, bool, uint256, uint256, string, uint256)',
        'function hasRole(bytes32 role, address account) view returns (bool)',
      ];

      const contract = new Contract(cuocBauCu.blockchainAddress, quanLyCuocBauCuAbi, provider);

      // Always use ID = 1 for contract
      const baseInfo = await contract.layThongTinCoBan(1);
      const owner = baseInfo[0];
      const isActive = baseInfo[1];
      console.log('Thông tin cơ bản:', baseInfo);

      // Kiểm tra quyền BANTOCHUC
      const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes('BANTOCHUC'));
      const hasBanToChucRole = await contract.hasRole(BANTOCHUC, scwAddress);

      setElectionStatus({
        owner,
        isOwner: owner.toLowerCase() === scwAddress.toLowerCase(),
        isActive,
        hasBanToChucRole,
      });

      showMessage(
        `Kiểm tra trạng thái cuộc bầu cử thành công. Quyền BANTOCHUC: ${hasBanToChucRole ? 'Có' : 'Không'}`,
      );
      return true;
    } catch (error) {
      showError('Lỗi khi kiểm tra trạng thái cuộc bầu cử: ' + (error as Error).message);
      return false;
    } finally {
      setIsLoading(false);
      setIsCheckingPermission(false);
    }
  }, [cuocBauCu, scwAddress, showMessage, showError]);

  // Fetch data on component mount
  useEffect(() => {
    if (phienBauCuId && !isDataFetched) {
      dispatch(fetchPhienBauCuById(Number(phienBauCuId)));
      dispatch(fetchCuTriByPhienBauCuId(Number(phienBauCuId)));
      dispatch(fetchUngCuVienByPhienBauCuId(Number(phienBauCuId)));
      dispatch(fetchViTriUngCuStatisticsByPhienBauCuId(Number(phienBauCuId)));
      fetchContractAddresses();
      setIsDataFetched(true);
    }
  }, [phienBauCuId, isDataFetched, dispatch, fetchContractAddresses]);

  // Update account info from userInfo
  useEffect(() => {
    if (userInfo && userInfo.id) {
      setTaiKhoanId(userInfo.id.toString());

      if (userInfo.diaChiVi) {
        dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
      }
    }
  }, [userInfo, dispatch]);

  // Update viId and scwAddress from walletInfo
  useEffect(() => {
    if (walletInfo) {
      setViId(walletInfo.viId.toString());
      setScwAddress(walletInfo.diaChiVi);
    }
  }, [walletInfo]);

  // Fetch cuoc bau cu data when phien bau cu is loaded
  useEffect(() => {
    if (phienBauCu && phienBauCu.cuocBauCuId) {
      dispatch(fetchCuocBauCuById(phienBauCu.cuocBauCuId));
    }
  }, [dispatch, phienBauCu]);

  // Update the useEffect to check election status when component mounts

  useEffect(() => {
    if (cuocBauCu?.blockchainAddress && scwAddress) {
      checkElectionStatus();
    }
  }, [cuocBauCu, scwAddress, checkElectionStatus]);

  // Link hashes function
  const linkHashes = useCallback(
    async (frontendHash: string, backendHash: string, sender: string) => {
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
        showError('Lỗi khi liên kết hash: ' + (error as Error).message);
        return false;
      }
    },
    [showMessage, showError, toast],
  );

  // Check UserOp status
  const checkUserOpStatus = useCallback(
    async (userOpHash: string, relatedHash?: string) => {
      if (!userOpHash) {
        showError('Hash không hợp lệ khi kiểm tra trạng thái');
        return false;
      }

      try {
        // Check with main hash
        const response = await apiClient.get(`/api/bundler/check-status?userOpHash=${userOpHash}`);

        if (response.data && response.data.status === 'success') {
          setStatus(DeploymentStatus.SUCCESS);
          setProgress(100);

          showMessage(`Phiên bầu cử đã được triển khai thành công!`);

          if (response.data.txHash) {
            setTxHash(response.data.txHash);
            showMessage(
              `Phiên bầu cử đã được triển khai thành công! TxHash: ${response.data.txHash}`,
            );
          }

          // Update session status in backend
          try {
            if (phienBauCu && phienBauCu.id) {
              const updateResponse = await apiClient.put(
                `/api/PhienBauCu/${phienBauCu.id}/status`,
                {
                  trangThai: 'Đã triển khai',
                  blockchainAddress: txHash || userOpHash,
                },
              );

              if (updateResponse.data) {
                showMessage(`Đã cập nhật trạng thái phiên bầu cử với ID: ${phienBauCu.id}`);
              }
            }
          } catch (updateError) {
            console.warn('Lỗi khi cập nhật trạng thái phiên bầu cử:', updateError);
          }

          toast({
            title: 'Triển khai thành công',
            description: 'Phiên bầu cử đã được triển khai lên blockchain thành công!',
          });

          return true;
        } else if (response.data && response.data.status === 'failed') {
          // If main hash failed and there's a related hash, try checking the related hash
          if (relatedHash && relatedHash !== userOpHash) {
            showMessage(`Kiểm tra với hash liên quan: ${relatedHash}`);
            return await checkUserOpStatus(relatedHash);
          }

          setStatus(DeploymentStatus.FAILED);
          showError(`Triển khai thất bại: ${response.data.message || 'Lỗi không xác định'}`);
          return false;
        } else if (response.data && response.data.status === 'pending') {
          showMessage(`Giao dịch đang chờ xử lý: ${response.data.txHash || userOpHash}`);

          // If there's a related hash and it's not linked yet, link them
          if (relatedHash && relatedHash !== userOpHash && !hashesLinked) {
            await linkHashes(frontendHash || userOpHash, backendHash || relatedHash, scwAddress);
          }

          return false;
        } else if (response.data && response.data.status === 'unknown') {
          // If main hash not found and there's a related hash, try checking the related hash
          if (relatedHash && relatedHash !== userOpHash) {
            showMessage(`Hash chính không tìm thấy, kiểm tra với hash liên quan: ${relatedHash}`);
            return await checkUserOpStatus(relatedHash);
          }

          showMessage(`Trạng thái giao dịch: không tìm thấy`);
          return false;
        } else {
          showMessage(`Trạng thái giao dịch: ${response.data?.status || 'không xác định'}`);
          return false;
        }
      } catch (error) {
        console.warn('Lỗi khi kiểm tra trạng thái:', error);
        showMessage(`Lỗi khi kiểm tra trạng thái: ${(error as Error).message}`);
        return false;
      }
    },
    [
      showMessage,
      showError,
      toast,
      linkHashes,
      frontendHash,
      backendHash,
      scwAddress,
      hashesLinked,
      phienBauCu,
      txHash,
    ],
  );

  // Add createAndSubmitUserOperation function after the checkUserOpStatus function

  // Create and submit UserOperation for deploying ballot session
  const createAndSubmitUserOperation = useCallback(async () => {
    try {
      if (!cuocBauCu?.blockchainAddress || !sessionKey) {
        throw new Error('Thiếu thông tin cần thiết để triển khai');
      }

      setStatus(DeploymentStatus.PREPARING_CALLDATA);
      setProgress(50);
      showMessage('Đang chuẩn bị dữ liệu triển khai phiên bầu cử...');

      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // Kết nối tới contracts
      const quanLyCuocBauCuAbi = [
        'function taoPhienBauCu(uint256 idCuocBauCu, uint256 thoiGianKeoDai, uint256 soCuTriToiDa) external returns (uint256)',
      ];

      const simpleAccountAbi = [
        'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
      ];

      const entryPointAbi = [
        'function getNonce(address sender) external view returns (uint256)',
        'function nonceNguoiGui(address) view returns (uint256)',
        'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
      ];

      const quanLyCuocBauCu = new Contract(
        cuocBauCu.blockchainAddress,
        quanLyCuocBauCuAbi,
        provider,
      );
      const simpleAccount = new Contract(sessionKey.scwAddress, simpleAccountAbi, provider);
      if (!contractAddresses) {
        throw new Error('Không thể lấy thông tin địa chỉ contract');
      }
      const entryPoint = new Contract(contractAddresses.entryPointAddress, entryPointAbi, provider);

      // Lấy nonce hiện tại
      let currentNonce;
      try {
        currentNonce = await entryPoint.getNonce(sessionKey.scwAddress);
      } catch (nonceError) {
        try {
          currentNonce = await entryPoint.nonceNguoiGui(sessionKey.scwAddress);
        } catch (nonceError2) {
          throw new Error('Không thể lấy nonce: ' + (nonceError2 as Error).message);
        }
      }

      // Tính thời gian kéo dài của phiên bầu cử
      // Nếu phienBauCu có ngày bắt đầu và kết thúc, tính thời gian giữa chúng
      let thoiGianKeoDai = 3 * 24 * 60 * 60; // Mặc định 3 ngày
      if (phienBauCu && phienBauCu.ngayBatDau && phienBauCu.ngayKetThuc) {
        try {
          const startDate = new Date(phienBauCu.ngayBatDau);
          const endDate = new Date(phienBauCu.ngayKetThuc);

          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            thoiGianKeoDai = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
            // Đảm bảo thời gian tối thiểu là 1 giờ
            thoiGianKeoDai = Math.max(thoiGianKeoDai, 3600);
          }
        } catch (dateError) {
          console.warn('Lỗi khi tính thời gian kéo dài:', dateError);
        }
      }

      // Số cử tri tối đa, dựa trên số cử tri hiện có cộng thêm dự phòng
      const soCuTriToiDa = Math.max(100, cuTris.length * 2);

      showMessage(
        `Thời gian kéo dài phiên: ${thoiGianKeoDai} giây, số cử tri tối đa: ${soCuTriToiDa}`,
      );

      // Chuẩn bị callData để gọi hàm taoPhienBauCu
      const taoPhienBauCuCallData = quanLyCuocBauCu.interface.encodeFunctionData('taoPhienBauCu', [
        1, // ID cuộc bầu cử luôn là 1 trong contract
        thoiGianKeoDai,
        soCuTriToiDa,
      ]);

      const executeCallData = simpleAccount.interface.encodeFunctionData('execute', [
        cuocBauCu.blockchainAddress,
        0,
        taoPhienBauCuCallData,
      ]);

      // Chuẩn bị paymasterAndData
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const deadlineTime = currentTimestamp + 3600; // 1 giờ sau
      const validationTime = currentTimestamp;

      const paymasterAndData = ethers.concat([
        contractAddresses.paymasterAddress,
        AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
      ]);

      // Chuẩn bị UserOperation
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

      setStatus(DeploymentStatus.CREATING_USEROP);
      setProgress(70);
      showMessage('Đang tạo và ký UserOperation...');

      // Ký UserOperation
      const userOpHash = await entryPoint.layHashThaoTac(userOp);

      const signingKey = new SigningKey(sessionKey.sessionKey);
      const signatureObj = signingKey.sign(ethers.getBytes(userOpHash));

      const signature = Signature.from({
        r: signatureObj.r,
        s: signatureObj.s,
        v: signatureObj.v,
      }).serialized;

      userOp.signature = signature;

      // Gửi UserOperation
      setStatus(DeploymentStatus.SENDING_USEROP);
      setProgress(80);
      showMessage('Đang gửi giao dịch triển khai phiên bầu cử...');

      const response = await apiClient.post('/api/bundler/submit', {
        ...userOp,
        userOpHash: userOpHash,
      });

      if (!response.data) {
        throw new Error('Không nhận được phản hồi từ bundler');
      }

      const frontendHash = response.data.userOpHash || userOpHash;
      const backendHash = response.data.backendHash || frontendHash;
      const txHash = response.data.txHash || frontendHash;

      setFrontendHash(frontendHash);
      setBackendHash(backendHash);
      setTxHash(txHash);

      // Liên kết frontend và backend hash nếu khác nhau
      if (frontendHash !== backendHash) {
        await linkHashes(frontendHash, backendHash, userOp.sender);
      }

      setStatus(DeploymentStatus.WAITING_CONFIRMATION);
      setProgress(90);
      showMessage('Đã gửi giao dịch thành công, đang chờ xác nhận...');

      // Kiểm tra trạng thái giao dịch
      let checkCount = 0;
      const maxChecks = 30;
      const checkInterval = setInterval(async () => {
        try {
          checkCount++;
          const isConfirmed = await checkUserOpStatus(frontendHash, backendHash);

          if (isConfirmed || checkCount >= maxChecks) {
            clearInterval(checkInterval);
            if (!isConfirmed && checkCount >= maxChecks) {
              showMessage(
                'Đã hết thời gian chờ xác nhận. Vui lòng kiểm tra trạng thái thủ công sau.',
              );
            }
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra trạng thái:', error);
        }
      }, 5000); // Kiểm tra mỗi 5 giây

      return frontendHash;
    } catch (error) {
      setStatus(DeploymentStatus.FAILED);
      showError('Lỗi khi tạo và gửi UserOperation: ' + (error as Error).message);
      throw error;
    }
  }, [
    cuocBauCu,
    sessionKey,
    phienBauCu,
    contractAddresses,
    cuTris,
    linkHashes,
    checkUserOpStatus,
    showMessage,
    showError,
  ]);

  // Get session key
  const getSessionKey = useCallback(async () => {
    if (!taiKhoanId || !viId) {
      showError('Vui lòng đảm bảo đã đăng nhập và có thông tin tài khoản');
      return null;
    }

    // Check if session key exists and is still valid
    if (sessionKey && sessionKey.expiresAt * 1000 > Date.now()) {
      showMessage('Đã có khóa phiên và còn hạn sử dụng');

      toast({
        title: 'Khóa phiên hiện tại',
        description: `Khóa phiên còn hạn đến: ${new Date(sessionKey.expiresAt * 1000).toLocaleString()}`,
      });

      return sessionKey;
    }

    try {
      setIsLoading(true);
      setStatus(DeploymentStatus.CREATING_SESSION_KEY);
      setProgress(20);

      // Call API to get session key
      const response = await apiClient.post('/api/Blockchain/get-session-key', {
        TaiKhoanID: Number.parseInt(taiKhoanId, 10),
        ViID: Number.parseInt(viId, 10),
      });

      if (response.data && response.data.success && response.data.sessionKey) {
        // Save session key and related info
        const sessionKeyInfo = {
          sessionKey: response.data.sessionKey,
          expiresAt: response.data.expiresAt,
          scwAddress: response.data.scwAddress || scwAddress,
        };

        setSessionKey(sessionKeyInfo);
        setScwAddress(sessionKeyInfo.scwAddress);

        showMessage(
          `Đã lấy session key thành công, hết hạn: ${new Date(sessionKeyInfo.expiresAt * 1000).toLocaleString()}`,
        );

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

      // If can't get, try creating a new one
      try {
        const createResponse = await apiClient.post('/api/Blockchain/create-session', {
          TaiKhoanID: Number.parseInt(taiKhoanId, 10),
          ViID: Number.parseInt(viId, 10),
        });

        if (createResponse.data && createResponse.data.success) {
          showMessage('Đã tạo session key mới');

          toast({
            title: 'Đã tạo khóa phiên mới',
            description: 'Khóa phiên mới đã được tạo thành công',
          });

          // Call get-session-key API again to get the new key
          return await getSessionKey();
        }
      } catch (createError) {
        showError('Không thể tạo session key mới: ' + (createError as Error).message);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [taiKhoanId, viId, scwAddress, sessionKey, showMessage, showError, toast]);

  // Sửa hàm checkOwnership để kiểm tra cả quyền chủ sở hữu và quyền BANTOCHUC
  const checkOwnership = useCallback(
    async (contractAddress: string, scwAddr: string): Promise<boolean> => {
      try {
        const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

        const quanLyCuocBauCuAbi = [
          'function layThongTinCoBan(uint256 idCuocBauCu) view returns (address, bool, uint256, uint256, string, uint256)',
          'function hasRole(bytes32 role, address account) view returns (bool)',
        ];

        const contract = new Contract(contractAddress, quanLyCuocBauCuAbi, provider);

        // Always use ID = 1 for contract
        const baseInfo = await contract.layThongTinCoBan(1);
        const owner = baseInfo[0];

        const isOwner = owner.toLowerCase() === scwAddr.toLowerCase();

        // Kiểm tra quyền BANTOCHUC
        const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes('BANTOCHUC'));
        const hasBanToChucRole = await contract.hasRole(BANTOCHUC, scwAddr);

        if (!isOwner) {
          showError(`SCW (${scwAddr}) không phải là chủ sở hữu của cuộc bầu cử (${owner})`);
        }

        if (!hasBanToChucRole) {
          showError(
            `SCW (${scwAddr}) không có quyền BANTOCHUC. Cần cấp quyền trước khi triển khai.`,
          );

          // Nếu là chủ sở hữu nhưng không có quyền BANTOCHUC, gợi ý cấp quyền
          if (isOwner) {
            toast({
              title: 'Cần cấp quyền BANTOCHUC',
              description:
                'Bạn là chủ sở hữu nhưng chưa có quyền BANTOCHUC. Hãy sử dụng chức năng cấp quyền.',
            });
          }
        }

        return isOwner && hasBanToChucRole;
      } catch (error) {
        console.error('Lỗi khi kiểm tra quyền chủ sở hữu và quyền BANTOCHUC:', error);
        showError('Không thể kiểm tra quyền chủ sở hữu và quyền BANTOCHUC. Vui lòng thử lại.');
        return false;
      }
    },
    [showError, toast],
  );

  // Thêm hàm mới để cấp quyền BANTOCHUC
  const grantBanToChucRole = useCallback(async () => {
    if (!cuocBauCu?.blockchainAddress || !scwAddress || !sessionKey || !contractAddresses) {
      showError('Thiếu thông tin cần thiết để cấp quyền BANTOCHUC');
      return false;
    }

    try {
      setIsLoading(true);
      setStatus(DeploymentStatus.CHECKING_REQUIREMENTS);
      showMessage('Đang cấp quyền BANTOCHUC...');

      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // Kết nối tới contracts
      const quanLyCuocBauCuAbi = [
        'function themBanToChuc(address newBanToChuc) external',
        'function hasRole(bytes32 role, address account) view returns (bool)',
      ];

      const simpleAccountAbi = [
        'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
      ];

      const entryPointAbi = [
        'function getNonce(address sender) external view returns (uint256)',
        'function nonceNguoiGui(address) view returns (uint256)',
        'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
      ];

      const quanLyCuocBauCu = new Contract(
        cuocBauCu.blockchainAddress,
        quanLyCuocBauCuAbi,
        provider,
      );
      const simpleAccount = new Contract(scwAddress, simpleAccountAbi, provider);
      const entryPoint = new Contract(contractAddresses.entryPointAddress, entryPointAbi, provider);

      // Lấy nonce hiện tại
      let currentNonce;
      try {
        currentNonce = await entryPoint.getNonce(scwAddress);
      } catch (nonceError) {
        // Nếu thất bại với getNonce, thử nonceNguoiGui
        try {
          currentNonce = await entryPoint.nonceNguoiGui(scwAddress);
        } catch (nonceError2) {
          throw new Error('Không thể lấy nonce: ' + (nonceError2 as Error).message);
        }
      }

      // Chuẩn bị callData để cấp quyền BANTOCHUC
      const themBanToChucCallData = quanLyCuocBauCu.interface.encodeFunctionData('themBanToChuc', [
        scwAddress,
      ]);

      const executeCallData = simpleAccount.interface.encodeFunctionData('execute', [
        cuocBauCu.blockchainAddress,
        0,
        themBanToChucCallData,
      ]);

      // Chuẩn bị paymasterAndData
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const deadlineTime = currentTimestamp + 3600; // 1 giờ sau
      const validationTime = currentTimestamp;

      const paymasterAndData = ethers.concat([
        contractAddresses.paymasterAddress,
        AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
      ]);

      // Chuẩn bị UserOperation
      const userOp = {
        sender: scwAddress,
        nonce: currentNonce.toString(),
        initCode: '0x',
        callData: executeCallData,
        callGasLimit: '1000000',
        verificationGasLimit: '1000000',
        preVerificationGas: '300000',
        maxFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei').toString(),
        paymasterAndData: paymasterAndData,
        signature: '0x',
      };

      // Lấy UserOpHash từ contract
      const userOpHash = await entryPoint.layHashThaoTac(userOp);

      // Ký UserOperation
      const signingKey = new SigningKey(sessionKey.sessionKey);
      const signatureObj = signingKey.sign(userOpHash);

      // Tạo signature theo chuẩn ethers v6
      const signature = Signature.from({
        r: signatureObj.r,
        s: signatureObj.s,
        v: signatureObj.v,
      }).serialized;

      userOp.signature = signature;

      // Gửi UserOperation
      const response = await apiClient.post('/api/bundler/submit', {
        ...userOp,
        userOpHash: userOpHash,
      });

      if (!response.data) {
        throw new Error('Không nhận được phản hồi từ bundler');
      }

      const txHash = response.data.txHash || response.data.userOpHash;
      setTxHash(txHash);

      showMessage('Đã gửi giao dịch cấp quyền BANTOCHUC thành công');

      // Thiết lập interval để kiểm tra trạng thái giao dịch
      let checkCount = 0;
      const checkInterval = setInterval(async () => {
        try {
          const statusResponse = await apiClient.get(
            `/api/bundler/check-status?userOpHash=${response.data.userOpHash}`,
          );

          if (statusResponse.data && statusResponse.data.status === 'success') {
            clearInterval(checkInterval);

            // Kiểm tra lại quyền BANTOCHUC
            const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes('BANTOCHUC'));
            const hasRole = await quanLyCuocBauCu.hasRole(BANTOCHUC, scwAddress);

            if (hasRole) {
              showMessage('Đã cấp quyền BANTOCHUC thành công');
              toast({
                title: 'Thành công',
                description: 'Đã cấp quyền BANTOCHUC thành công',
              });

              // Update election status
              await checkElectionStatus();
              return true;
            } else {
              throw new Error('Giao dịch thành công nhưng chưa cấp được quyền BANTOCHUC');
            }
          } else if (statusResponse.data && statusResponse.data.status === 'failed') {
            clearInterval(checkInterval);
            throw new Error(
              'Giao dịch thất bại: ' + (statusResponse.data.message || 'Lỗi không xác định'),
            );
          }

          checkCount++;
          if (checkCount >= 30) {
            // Tối đa 30 lần kiểm tra (~150 giây)
            clearInterval(checkInterval);
            showMessage('Đã hết thời gian chờ. Vui lòng làm mới trang để kiểm tra trạng thái.');
          }
        } catch (error) {
          clearInterval(checkInterval);
          throw error;
        }
      }, 5000); // Kiểm tra mỗi 5 giây

      return true;
    } catch (error) {
      showError('Lỗi khi cấp quyền BANTOCHUC: ' + (error as Error).message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [
    cuocBauCu,
    scwAddress,
    sessionKey,
    contractAddresses,
    showMessage,
    showError,
    toast,
    checkElectionStatus,
  ]);

  // Sửa hàm deployBallotSession để kiểm tra và cấp quyền BANTOCHUC nếu cần
  const deployBallotSession = useCallback(async () => {
    if (!cuocBauCu?.blockchainAddress) {
      showError('Election has not been deployed to blockchain');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      setStatus(DeploymentStatus.CHECKING_REQUIREMENTS);
      setProgress(10);

      // Check session key
      if (!sessionKey) {
        const sessionKeyInfo = await getSessionKey();
        if (!sessionKeyInfo) {
          throw new Error('Cannot get session key');
        }
      }

      // Kiểm tra quyền BANTOCHUC
      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');
      const quanLyCuocBauCuAbi = [
        'function hasRole(bytes32 role, address account) view returns (bool)',
      ];
      const quanLyCuocBauCu = new Contract(
        cuocBauCu.blockchainAddress,
        quanLyCuocBauCuAbi,
        provider,
      );
      const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes('BANTOCHUC'));
      const hasBanToChucRole = await quanLyCuocBauCu.hasRole(BANTOCHUC, sessionKey!.scwAddress);

      // Nếu không có quyền BANTOCHUC, hiển thị thông báo và dừng lại
      if (!hasBanToChucRole) {
        setStatus(DeploymentStatus.NOT_STARTED);
        showError('SCW chưa có quyền BANTOCHUC. Vui lòng cấp quyền trước khi triển khai.');
        toast({
          title: 'Cần cấp quyền BANTOCHUC',
          description:
            "Hãy sử dụng nút 'Cấp Quyền BANTOCHUC' trong tab Quy trình để cấp quyền trước khi triển khai.",
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Check ownership
      const isOwner = await checkOwnership(cuocBauCu.blockchainAddress, sessionKey!.scwAddress);
      if (!isOwner) {
        throw new Error('SCW is not the owner of the election or does not have BANTOCHUC role');
      }

      // Check balances
      const hasEnoughBalance = Number.parseFloat(balances.hluBalance) >= 5.0;
      const hasFactoryAllowance = Number.parseFloat(balances.allowanceForFactory) >= 4.0;
      const hasPaymasterAllowance = Number.parseFloat(balances.allowanceForPaymaster) >= 1.0;

      if (!hasEnoughBalance || !hasFactoryAllowance || !hasPaymasterAllowance) {
        setStatus(DeploymentStatus.APPROVING_TOKENS);
        setProgress(30);
        showError('Need to approve tokens before deployment');
        return;
      }

      // Create and send UserOperation
      await createAndSubmitUserOperation();
    } catch (error) {
      setStatus(DeploymentStatus.FAILED);
      showError('Error deploying ballot session: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [
    cuocBauCu,
    sessionKey,
    balances,
    getSessionKey,
    checkOwnership,
    createAndSubmitUserOperation,
    showError,
    showMessage,
    toast,
  ]);

  // Add a new UI element in the deploy tab to show permission status and grant button
  // Add this after the "Notification if cannot deploy" section in the deploy tab:

  // Add a new section to display BANTOCHUC permission status and grant button
  // Add this after the renderDeploymentStatus() call in the deploy tab:

  const renderBanToChucPermissionSection = () => {
    // Check if we need to show this section
    if (!cuocBauCu?.blockchainAddress || !sessionKey) {
      return null;
    }

    return (
      <BlockchainStatusDisplay
        scwAddress={scwAddress}
        electionStatus={electionStatus}
        isCheckingPermission={isCheckingPermission}
        onCheckPermission={checkElectionStatus}
        grantBanToChucRole={grantBanToChucRole}
        isLoading={isLoading}
      />
    );
  };

  // Update the Card content in the deploy tab to include the new section
  // Add this after the renderDeploymentStatus() call:

  // Refresh data
  const refreshData = useCallback(() => {
    if (phienBauCuId) {
      dispatch(fetchPhienBauCuById(Number(phienBauCuId)));
      dispatch(fetchCuTriByPhienBauCuId(Number(phienBauCuId)));
      dispatch(fetchUngCuVienByPhienBauCuId(Number(phienBauCuId)));
      dispatch(fetchViTriUngCuStatisticsByPhienBauCuId(Number(phienBauCuId)));
      fetchContractAddresses();

      if (userInfo && userInfo.id && userInfo.diaChiVi) {
        dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
      }

      toast({
        title: 'Làm mới dữ liệu',
        description: 'Đang tải lại thông tin phiên bầu cử và ví',
      });
    }
  }, [phienBauCuId, userInfo, dispatch, fetchContractAddresses, toast]);

  // Handle sync data
  const handleSyncData = useCallback(async () => {
    if (!phienBauCuId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Election session ID not found',
      });
      return;
    }

    try {
      setSyncStatus({
        isRunning: true,
        progress: 10,
        message: 'Đang bắt đầu đồng bộ dữ liệu...',
      });

      // Call API to sync
      const response = await apiClient.post(`/api/PhienBauCu/syncBlockchain/${phienBauCuId}`, {
        forceCheck: true,
      });

      setSyncStatus({
        isRunning: true,
        progress: 50,
        message: 'Đang xử lý dữ liệu...',
      });

      // Simulate processing time
      setTimeout(() => {
        if (response.data && response.data.success) {
          setSyncStatus({
            isRunning: false,
            progress: 100,
            message: 'Đồng bộ dữ liệu thành công!',
          });

          toast({
            title: 'Thành công',
            description: 'Đồng bộ dữ liệu SQL và blockchain thành công',
          });

          // Refresh data after sync
          refreshData();
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
  }, [phienBauCuId, toast, refreshData]);

  // Deploy voters to blockchain
  const deployVotersToBlockchain = useCallback(async () => {
    try {
      setVoterDeploymentStatus('in_progress');
      setVoterDeploymentProgress(10);
      setVoterDeploymentMessage('Đang chuẩn bị triển khai cử tri lên blockchain...');

      // Simulate API call to deploy voters
      const verifiedVoters = cuTris.filter((voter) => voter.xacMinh);
      const totalVoters = verifiedVoters.length;

      if (totalVoters === 0) {
        setVoterDeploymentMessage('Không có cử tri đã xác thực để triển khai');
        setVoterDeploymentStatus('failed');
        return;
      }

      // Simulate deployment process
      for (let i = 0; i < totalVoters; i++) {
        // Update progress
        const progress = Math.round(((i + 1) / totalVoters) * 100);
        setVoterDeploymentProgress(progress);
        setDeployedVotersCount(i + 1);
        setVoterDeploymentMessage(`Đang triển khai cử tri ${i + 1}/${totalVoters}...`);

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setVoterDeploymentMessage(`Đã triển khai thành công ${totalVoters} cử tri lên blockchain`);
      setVoterDeploymentStatus('completed');

      // Move to next step if all voters are deployed
      if (deploymentStep === 2) {
        setDeploymentStep(3);
      }

      toast({
        title: 'Triển khai cử tri thành công',
        description: `Đã triển khai ${totalVoters} cử tri lên blockchain`,
      });
    } catch (error) {
      setVoterDeploymentStatus('failed');
      setVoterDeploymentMessage('Lỗi khi triển khai cử tri: ' + (error as Error).message);

      toast({
        variant: 'destructive',
        title: 'Lỗi triển khai cử tri',
        description: (error as Error).message,
      });
    }
  }, [cuTris, deploymentStep, toast]);

  // Deploy candidates to blockchain
  const deployCandidatesToBlockchain = useCallback(async () => {
    try {
      setCandidateDeploymentStatus('in_progress');
      setCandidateDeploymentProgress(10);
      setCandidateDeploymentMessage('Đang chuẩn bị triển khai ứng viên lên blockchain...');

      // Simulate API call to deploy candidates
      const totalCandidates = ungViens.length;

      if (totalCandidates === 0) {
        setCandidateDeploymentMessage('Không có ứng viên để triển khai');
        setCandidateDeploymentStatus('failed');
        return;
      }

      // Simulate deployment process
      for (let i = 0; i < totalCandidates; i++) {
        // Update progress
        const progress = Math.round(((i + 1) / totalCandidates) * 100);
        setCandidateDeploymentProgress(progress);
        setDeployedCandidatesCount(i + 1);
        setCandidateDeploymentMessage(`Đang triển khai ứng viên ${i + 1}/${totalCandidates}...`);

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 700));
      }

      setCandidateDeploymentMessage(
        `Đã triển khai thành công ${totalCandidates} ứng viên lên blockchain`,
      );
      setCandidateDeploymentStatus('completed');

      toast({
        title: 'Triển khai ứng viên thành công',
        description: `Đã triển khai ${totalCandidates} ứng viên lên blockchain`,
      });
    } catch (error) {
      setCandidateDeploymentStatus('failed');
      setCandidateDeploymentMessage('Lỗi khi triển khai ứng viên: ' + (error as Error).message);

      toast({
        variant: 'destructive',
        title: 'Lỗi triển khai ứng viên',
        description: (error as Error).message,
      });
    }
  }, [ungViens, toast]);

  // Check if we have required allowances
  const hasRequiredAllowances = useMemo(
    () =>
      Number.parseFloat(balances.allowanceForFactory) >= 4.0 &&
      Number.parseFloat(balances.allowanceForPaymaster) >= 1.0 &&
      Number.parseFloat(balances.hluBalance) >= 5.0,
    [balances],
  );

  // Check if we can deploy
  const canDeploy = useMemo(() => {
    return (
      cuocBauCu?.blockchainAddress &&
      phienBauCu &&
      sessionKey &&
      hasRequiredAllowances &&
      status !== DeploymentStatus.SENDING_USEROP &&
      status !== DeploymentStatus.WAITING_CONFIRMATION &&
      status !== DeploymentStatus.SUCCESS
    );
  }, [cuocBauCu, phienBauCu, sessionKey, hasRequiredAllowances, status]);

  // Handle setApproveLoading from ApproveHLU component
  const handleApproveLoading = useCallback((loading: boolean) => {
    // Only update if value changes to avoid constant re-renders
    setIsLoading((prevLoading) => {
      if (prevLoading !== loading) {
        return loading;
      }
      return prevLoading;
    });
  }, []);

  // Go back to election management
  const handleGoBack = useCallback(() => {
    if (cuocBauCu && phienBauCuId) {
      navigate(
        `/app/user-elections/elections/${cuocBauCu.id}/election-management/${phienBauCuId}/phien-bau-cu`,
      );
    } else {
      navigate(-1);
    }
  }, [navigate, cuocBauCu, phienBauCuId]);

  // Handle next step in deployment workflow
  const handleNextStep = useCallback(() => {
    if (deploymentStep < 3) {
      setDeploymentStep((prev) => prev + 1);
    }
  }, [deploymentStep]);

  // Handle previous step in deployment workflow
  const handlePrevStep = useCallback(() => {
    if (deploymentStep > 1) {
      setDeploymentStep((prev) => prev - 1);
    }
  }, [deploymentStep]);

  // Calculate time info
  const getTimeInfo = useCallback(() => {
    if (!phienBauCu) return null;

    try {
      const now = new Date();
      const startDate = new Date(phienBauCu.ngayBatDau);
      const endDate = new Date(phienBauCu.ngayKetThuc);

      // Handle invalid dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          isActive: false,
          isUpcoming: false,
          isCompleted: false,
          percentComplete: 0,
        };
      }

      const timeRemaining = {
        days: 0,
        hours: 0,
        minutes: 0,
        isActive: false,
        isUpcoming: false,
        isCompleted: false,
        percentComplete: 0,
      };

      if (now < startDate) {
        // Upcoming
        const diff = startDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        timeRemaining.days = days;
        timeRemaining.hours = hours;
        timeRemaining.minutes = minutes;
        timeRemaining.isUpcoming = true;
      } else if (now > endDate) {
        // Completed
        timeRemaining.isCompleted = true;
        timeRemaining.percentComplete = 100;
      } else {
        // Active
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsed = now.getTime() - startDate.getTime();
        const percentComplete = Math.min(100, Math.round((elapsed / totalDuration) * 100));

        const diff = endDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        timeRemaining.days = days;
        timeRemaining.hours = hours;
        timeRemaining.minutes = minutes;
        timeRemaining.isActive = true;
        timeRemaining.percentComplete = percentComplete;
      }

      return timeRemaining;
    } catch (error) {
      console.error('Error calculating time info:', error);
      return null;
    }
  }, [phienBauCu]);

  // Get status badge color based on election status
  const getStatusBadgeClass = useCallback(() => {
    if (!phienBauCu) return '';

    switch (phienBauCu.trangThai) {
      case 'Đang diễn ra':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Sắp diễn ra':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Đã kết thúc':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  }, [phienBauCu]);

  // Format date
  const formatDate = useCallback((dateString: string): string => {
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
  }, []);

  // Get time info
  const timeInfo = getTimeInfo();

  // Render deployment status section
  const renderDeploymentStatus = () => (
    <Card className="mb-8 border-t-4 border-cyan-500 dark:border-cyan-600 bg-gradient-to-br from-white to-cyan-50 dark:from-[#162A45]/90 dark:to-[#1A2942]/70">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800/50">
            <Server className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
            Tiến Trình Triển Khai
          </CardTitle>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Theo dõi quá trình triển khai phiên bầu cử lên blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tiến Độ:</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {progress}%
            </span>
          </div>
          <div className="relative h-2 bg-gray-200 dark:bg-gray-800/70 rounded-full overflow-hidden">
            <div
              className={`absolute h-full rounded-full transition-all duration-500 ${
                status === DeploymentStatus.FAILED
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                  : status === DeploymentStatus.SUCCESS
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-600'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <StepStatus
              currentStatus={status}
              stepStatus={DeploymentStatus.CHECKING_REQUIREMENTS}
              title="Kiểm Tra Yêu Cầu"
              description="Xác minh rằng tài khoản của bạn đáp ứng tất cả các điều kiện để triển khai"
            />

            <StepStatus
              currentStatus={status}
              stepStatus={DeploymentStatus.CREATING_SESSION_KEY}
              title="Tạo Khóa Phiên"
              description="Tạo khóa phiên an toàn để ký các giao dịch blockchain"
              isCompleted={sessionKey ? sessionKey.expiresAt * 1000 > Date.now() : undefined}
            />

            <StepStatus
              currentStatus={status}
              stepStatus={DeploymentStatus.APPROVING_TOKENS}
              title="Phê Duyệt Token"
              description="Phê duyệt token HLU cho Factory và Paymaster"
              isCompleted={hasRequiredAllowances}
            />
          </div>

          <div className="space-y-4">
            <StepStatus
              currentStatus={status}
              stepStatus={DeploymentStatus.PREPARING_CALLDATA}
              title="Chuẩn Bị Dữ Liệu"
              description="Chuẩn bị dữ liệu phiên bầu cử để triển khai lên blockchain"
            />

            <StepStatus
              currentStatus={status}
              stepStatus={DeploymentStatus.SENDING_USEROP}
              title="Gửi Giao Dịch"
              description="Gửi giao dịch đến mạng blockchain"
            />

            <StepStatus
              currentStatus={status}
              stepStatus={DeploymentStatus.WAITING_CONFIRMATION}
              title="Chờ Xác Nhận"
              description="Đợi mạng blockchain xác nhận giao dịch"
            />
          </div>
        </div>

        {/* Status Messages */}
        {message && (
          <Alert className="mb-4 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800/50">
            <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <AlertDescription className="text-cyan-700 dark:text-cyan-300">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert
            variant="destructive"
            className="mb-4 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50"
          >
            <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <AlertDescription className="text-rose-700 dark:text-rose-300">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Transaction Info */}
        {txHash && (
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-cyan-50 to-indigo-50 dark:from-[#1A2942]/50 dark:to-[#1E1A29]/50 border border-cyan-100 dark:border-[#2A3A5A]/70">
            <h3 className="text-lg font-medium mb-3 flex items-center text-gray-800 dark:text-white">
              <Network className="w-5 h-5 mr-2 text-cyan-600 dark:text-cyan-400" />
              Thông Tin Giao Dịch
            </h3>

            <div className="p-3 rounded-lg bg-white/70 dark:bg-[#1A2942]/50 border border-cyan-100 dark:border-[#2A3A5A]/50 mb-3">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                Mã Giao Dịch (Transaction Hash)
              </p>
              <div className="flex items-center">
                <p className="font-mono text-sm truncate text-gray-800 dark:text-gray-200">
                  {txHash}
                </p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={`https://explorer.holihu.online/transactions/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#243656] text-cyan-600 dark:text-cyan-400"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Xem trên blockchain explorer</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Hash Linking Information */}
            {frontendHash && backendHash && frontendHash !== backendHash && (
              <div className="p-3 rounded-lg bg-white/70 dark:bg-[#1A2942]/50 border border-cyan-100 dark:border-[#2A3A5A]/50 mb-3">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Liên Kết Hash</p>
                <div className="flex items-center mb-2">
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                    <Link className="w-4 h-4 mr-2 text-cyan-600 dark:text-cyan-400" />
                    Frontend Hash:
                  </p>
                  <p className="font-mono text-sm truncate ml-2 text-gray-800 dark:text-gray-200">
                    {frontendHash.substring(0, 10)}...
                    {frontendHash.substring(frontendHash.length - 8)}
                  </p>
                </div>
                <div className="flex items-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                    <Link className="w-4 h-4 mr-2 text-cyan-600 dark:text-cyan-400" />
                    Backend Hash:
                  </p>
                  <p className="font-mono text-sm truncate ml-2 text-gray-800 dark:text-gray-200">
                    {backendHash.substring(0, 10)}...
                    {backendHash.substring(backendHash.length - 8)}
                  </p>
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  {hashesLinked ? (
                    <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Đã liên kết hash thành công
                    </span>
                  ) : (
                    <span className="flex items-center text-amber-600 dark:text-amber-400">
                      <Info className="w-3 h-3 mr-1" />
                      Đang chờ liên kết hash
                    </span>
                  )}
                </div>
              </div>
            )}

            {status === DeploymentStatus.SUCCESS && (
              <Alert className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Triển khai thành công</AlertTitle>
                <AlertDescription>
                  Phiên bầu cử đã được triển khai thành công lên blockchain! Bạn có thể quay lại
                  trang quản lý cuộc bầu cử để xem chi tiết.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render session key section
  const renderSessionKeySection = () => (
    <Card className="mb-8 border-t-4 border-indigo-500 dark:border-indigo-600 bg-gradient-to-br from-white to-indigo-50 dark:from-[#162A45]/90 dark:to-[#1E1A29]/70">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50">
            <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
            Cấu Hình Ví Blockchain
          </CardTitle>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Cấu hình ví và khóa phiên để triển khai lên blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-300">
            <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <AlertTitle>Thông tin quan trọng</AlertTitle>
            <AlertDescription>
              Để triển khai phiên bầu cử lên blockchain, bạn cần có khóa phiên và đủ token HLU.
              {sessionKey && sessionKey.expiresAt * 1000 > Date.now() && (
                <span className="block mt-2 font-medium">
                  Bạn đã có khóa phiên còn hạn sử dụng đến:{' '}
                  {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                </span>
              )}
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <Button
              onClick={getSessionKey}
              disabled={isLoading}
              className="w-full md:w-auto px-6 py-5 text-base font-medium bg-gradient-to-r from-indigo-500 to-violet-600 dark:from-indigo-600 dark:to-violet-700 hover:shadow-lg text-white transition-all duration-300"
            >
              {isLoading && status === DeploymentStatus.CREATING_SESSION_KEY ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Key className="mr-2 h-4 w-4" />
              )}
              {isLoading && status === DeploymentStatus.CREATING_SESSION_KEY
                ? 'Đang tạo...'
                : sessionKey && sessionKey.expiresAt * 1000 > Date.now()
                  ? 'Làm Mới Khóa Phiên'
                  : 'Lấy Khóa Phiên'}
            </Button>
          </div>

          {sessionKey && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-[#1A2942]/50 dark:to-[#1E1A29]/50 border border-indigo-100 dark:border-[#2A3A5A]/70">
              <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-white flex items-center">
                <Key className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Thông Tin Khóa Phiên
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/70 dark:bg-[#1A2942]/50 border border-indigo-100 dark:border-[#2A3A5A]/50">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                    Địa Chỉ Ví Thông Minh (SCW)
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

                <div className="p-3 rounded-lg bg-white/70 dark:bg-[#1A2942]/50 border border-indigo-100 dark:border-[#2A3A5A]/50">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Thời Hạn Sử Dụng</p>
                  <p className="text-gray-800 dark:text-gray-200 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
                    {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                    <span className="ml-2 text-sm text-emerald-600 dark:text-emerald-400">
                      (Còn{' '}
                      {Math.floor((sessionKey.expiresAt * 1000 - Date.now()) / (1000 * 60 * 60))}{' '}
                      giờ)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render session info section
  const renderSessionInfoSection = () => (
    <Card className="mb-8 border-t-4 border-violet-500 dark:border-violet-600 bg-gradient-to-br from-white to-violet-50 dark:from-[#162A45]/90 dark:to-[#1A2942]/70">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/50">
            <Frame className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
            Thông Tin Phiên Bầu Cử
          </CardTitle>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Thông tin chi tiết về phiên bầu cử sẽ được triển khai
        </CardDescription>
      </CardHeader>
      <CardContent>
        {phienBauCu ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Tên phiên bầu cử
              </h3>
              <p className="text-base font-medium text-gray-900 dark:text-white break-words">
                {phienBauCu.tenPhienBauCu}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mô tả</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                {phienBauCu.moTa || 'Chưa có mô tả'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Thời gian</h3>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-violet-600 dark:text-violet-400 flex-shrink-0" />
                  <span className="text-gray-900 dark:text-white break-words">
                    {formatDate(phienBauCu.ngayBatDau)} - {formatDate(phienBauCu.ngayKetThuc)}
                  </span>
                </div>
              </div>
            </div>

            {/* Trạng thái blockchain */}
            <div className="flex items-center mt-4 p-4 rounded-lg bg-blue-50/80 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
              <Shield className="h-5 w-5 mr-3 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium">
                  Trạng thái blockchain:{' '}
                  {phienBauCu.trangThaiBlockchain === 2 ? 'Đã triển khai' : 'Chưa triển khai'}
                </p>
                <p className="text-sm mt-1">
                  {phienBauCu.trangThaiBlockchain === 2
                    ? 'Phiên bầu cử đã được triển khai thành công lên blockchain'
                    : 'Triển khai lên blockchain để đảm bảo tính minh bạch'}
                </p>
              </div>
            </div>

            {timeInfo && (
              <div className="flex items-center mt-4 p-4 rounded-lg dark:border bg-gray-50/80 dark:bg-gray-800/20 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700/50">
                <Clock className="h-5 w-5 mr-3 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium">
                    Trạng thái phiên:{' '}
                    {timeInfo.isActive
                      ? 'Đang diễn ra'
                      : timeInfo.isUpcoming
                        ? 'Sắp diễn ra'
                        : 'Đã kết thúc'}
                  </p>
                  <p className="text-sm mt-1">
                    {timeInfo.isActive
                      ? `Tiến độ: ${timeInfo.percentComplete}% (Còn ${timeInfo.days} ngày, ${timeInfo.hours} giờ)`
                      : timeInfo.isUpcoming
                        ? `Còn ${timeInfo.days} ngày, ${timeInfo.hours} giờ để bắt đầu`
                        : 'Phiên bầu cử đã kết thúc'}
                  </p>
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-cyan-50/80 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-cyan-700 dark:text-cyan-300">Cử Tri</h4>
                  <Users className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                    {cuTris.length}
                  </span>
                  <span className="text-sm text-cyan-600 dark:text-cyan-400">Đã thêm</span>
                </div>
              </div>
              <div className="p-4 bg-indigo-50/80 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    Ứng Viên
                  </h4>
                  <UserPlus className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    {ungViens.length}
                  </span>
                  <span className="text-sm text-indigo-600 dark:text-indigo-400">Đã thêm</span>
                </div>
              </div>
              <div className="p-4 bg-emerald-50/80 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Vị Trí
                  </h4>
                  <Award className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {positionStats.totalPositions}
                  </span>
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">
                    Đã thiết lập
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800/50" />
            <Skeleton className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800/50" />
            <Skeleton className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800/50" />
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render blockchain sync section
  const renderBlockchainSyncSection = () => (
    <Card className="mb-8 border-t-4 border-emerald-500 dark:border-emerald-600 bg-gradient-to-br from-white to-emerald-50 dark:from-[#162A45]/90 dark:to-[#1A3529]/70">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50">
            <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
            Đồng Bộ Dữ Liệu Blockchain
          </CardTitle>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Đồng bộ dữ liệu giữa cơ sở dữ liệu SQL và blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 mb-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300">
          <p className="flex items-start">
            <Info className="mr-2 flex-shrink-0 mt-1" size={18} />
            <span>
              Công cụ này giúp đồng bộ dữ liệu giữa cơ sở dữ liệu SQL và blockchain, đảm bảo tính
              nhất quán của dữ liệu.
              {phienBauCu && phienBauCu.blockchainAddress && (
                <span className="block mt-2">
                  Địa chỉ blockchain hiện tại:{' '}
                  <code className="bg-white/30 dark:bg-blue-900/50 px-2 py-1 rounded font-mono text-sm">
                    {phienBauCu.blockchainAddress}
                  </code>
                </span>
              )}
            </span>
          </p>
        </div>

        {/* Sync Progress */}
        {syncStatus.isRunning && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>{syncStatus.message}</span>
              <span>{syncStatus.progress}%</span>
            </div>
            <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="absolute h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-600 dark:to-cyan-600"
                style={{ width: `${syncStatus.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Sync Status Message */}
        {!syncStatus.isRunning && syncStatus.message && (
          <div
            className={`p-4 rounded-lg mb-4 ${
              syncStatus.progress === 100
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-300'
            }`}
          >
            <p className="flex items-start">
              {syncStatus.progress === 100 ? (
                <CheckCircle className="mr-2 flex-shrink-0 mt-1" size={18} />
              ) : (
                <AlertCircle className="mr-2 flex-shrink-0 mt-1" size={18} />
              )}
              <span>{syncStatus.message}</span>
            </p>
          </div>
        )}

        {/* Sync Actions */}
        <div className="grid grid-cols-1 gap-3">
          <Button
            onClick={handleSyncData}
            disabled={syncStatus.isRunning}
            className="px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-emerald-500 to-cyan-600 dark:from-emerald-600 dark:to-cyan-700 hover:shadow-lg disabled:opacity-50 transition-all duration-300 flex items-center justify-center"
          >
            {syncStatus.isRunning ? (
              <Loader className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Đồng Bộ Phiên Bầu Cử Này
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Define handleApproveSuccess and handleBalancesUpdated
  const handleApproveSuccess = useCallback(() => {
    showMessage('Token approval successful!');
  }, [showMessage]);

  const handleBalancesUpdated = useCallback(
    (newBalances: any) => {
      setBalances(newBalances);
      showMessage('Balances updated successfully!');
    },
    [showMessage],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] p-4 md:p-8">
      <div className="bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-[#2A3A5A] rounded-xl shadow-md p-4 md:p-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate max-w-[250px] sm:max-w-none">
                {phienBauCu ? phienBauCu.tenPhienBauCu : 'Triển Khai Blockchain'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {phienBauCu && phienBauCu.trangThai && (
                  <Badge className={getStatusBadgeClass()}>
                    {phienBauCu.trangThai === 'Đang diễn ra' ? (
                      <Zap className="h-4 w-4 mr-1" />
                    ) : phienBauCu.trangThai === 'Sắp diễn ra' ? (
                      <Clock className="h-4 w-4 mr-1" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    {phienBauCu.trangThai}
                  </Badge>
                )}
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-cyan-600 dark:text-cyan-400" />
                  <span className="hidden xs:inline">{phienBauCu?.ngayBatDau} - </span>
                  <span>{phienBauCu?.ngayKetThuc}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A] text-gray-700 dark:text-white"
              onClick={handleGoBack}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Quay lại</span>
            </Button>
            <Button
              variant="outline"
              className="bg-white dark:bg-[#1A2942]/50 border-gray-200 dark:border-[#2A3A5A] text-gray-700 dark:text-white"
              onClick={refreshData}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Làm mới</span>
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 gap-2 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden md:inline">Tổng quan</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden md:inline">Cấu hình ví</span>
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden md:inline">Quy trình</span>
            </TabsTrigger>
            <TabsTrigger value="deploy" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span className="hidden md:inline">Triển khai</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {renderSessionInfoSection()}
            {phienBauCu && phienBauCu.trangThaiBlockchain === 2 && renderBlockchainSyncSection()}
          </TabsContent>

          <TabsContent value="wallet">
            {renderSessionKeySection()}
            {sessionKey && (
              <ApproveHLU
                scwAddress={scwAddress}
                sessionKey={sessionKey}
                onSuccess={handleApproveSuccess}
                onBalancesUpdated={handleBalancesUpdated}
                setIsLoading={handleApproveLoading}
                showMessage={showMessage}
                showError={showError}
              />
            )}
          </TabsContent>

          <TabsContent value="workflow">
            <ElectionWorkflowManager
              phienBauCu={phienBauCu}
              cuocBauCu={cuocBauCu}
              sessionKey={sessionKey}
              cuTris={cuTris}
              ungViens={ungViens}
              onSessionKeyGenerated={setSessionKey}
              onRefreshData={refreshData}
            />
          </TabsContent>

          <TabsContent value="deploy">
            <Card className="mb-8 border-t-4 border-cyan-500 dark:border-cyan-600 bg-gradient-to-br from-white to-cyan-50 dark:from-[#162A45]/90 dark:to-[#1A2942]/70">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800/50">
                    <Lock className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                    Triển Khai Phiên Bầu Cử
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Triển khai phiên bầu cử lên blockchain để đảm bảo tính minh bạch và bảo mật
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderDeploymentStatus()}
                {renderBanToChucPermissionSection()}

                <div className="flex justify-center mt-6">
                  <Button
                    onClick={deployBallotSession}
                    disabled={
                      isLoading ||
                      !canDeploy ||
                      status === DeploymentStatus.SUCCESS ||
                      status === DeploymentStatus.SENDING_USEROP ||
                      status === DeploymentStatus.WAITING_CONFIRMATION ||
                      !electionStatus.hasBanToChucRole
                    }
                    className="px-8 py-6 text-lg bg-gradient-to-r from-cyan-500 to-indigo-600 dark:from-cyan-600 dark:to-indigo-700 text-white hover:shadow-xl disabled:opacity-50 transition-all duration-300"
                  >
                    {isLoading ? (
                      <Loader className="mr-2 h-5 w-5 animate-spin" />
                    ) : status === DeploymentStatus.SUCCESS ? (
                      <CheckCircle className="mr-2 h-5 w-5" />
                    ) : (
                      <Lock className="mr-2 h-5 w h-5 w-5" />
                    )}
                    {isLoading
                      ? 'Đang xử lý...'
                      : status === DeploymentStatus.SUCCESS
                        ? 'Đã triển khai thành công'
                        : 'Triển Khai Phiên Bầu Cử'}
                  </Button>
                </div>

                {/* Notification if cannot deploy */}
                {!canDeploy && (
                  <Alert className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Không thể triển khai</AlertTitle>
                    <AlertDescription>
                      {!cuocBauCu?.blockchainAddress
                        ? 'Cuộc bầu cử chưa được triển khai lên blockchain. Vui lòng triển khai cuộc bầu cử trước.'
                        : !sessionKey
                          ? 'Bạn cần lấy khóa phiên để ký giao dịch.'
                          : !hasRequiredAllowances
                            ? 'Bạn cần phê duyệt token HLU để triển khai phiên bầu cử.'
                            : status === DeploymentStatus.SUCCESS
                              ? 'Phiên bầu cử đã được triển khai thành công.'
                              : status === DeploymentStatus.SENDING_USEROP ||
                                  status === DeploymentStatus.WAITING_CONFIRMATION
                                ? 'Đang trong quá trình triển khai, vui lòng đợi.'
                                : 'Vui lòng kiểm tra lại thông tin trước khi triển khai.'}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Additional message if BANTOCHUC role is missing */}
                {canDeploy && !electionStatus.hasBanToChucRole && (
                  <Alert className="mt-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Thiếu quyền BANTOCHUC</AlertTitle>
                    <AlertDescription>
                      SCW của bạn chưa có quyền BANTOCHUC. Vui lòng sử dụng nút "Cấp Quyền
                      BANTOCHUC" ở trên để cấp quyền trước khi triển khai.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Deployment of Voters and Candidates */}
                {status === DeploymentStatus.SUCCESS && (
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <VoterDeployment
                      phienBauCuId={Number(phienBauCuId)}
                      cuocBauCuId={cuocBauCu?.id || 0}
                      sessionKey={sessionKey}
                      cuTris={cuTris}
                      quanLyCuocBauCuAddress={cuocBauCu?.blockchainAddress}
                      onSuccess={() => {
                        toast({
                          title: 'Triển khai cử tri thành công',
                          description: 'Đã triển khai cử tri lên blockchain thành công',
                        });
                        refreshData();
                      }}
                      onError={(error) => {
                        toast({
                          variant: 'destructive',
                          title: 'Lỗi triển khai cử tri',
                          description: error,
                        });
                      }}
                      onStatusChange={setVoterDeploymentStatus}
                      onProgressChange={setVoterDeploymentProgress}
                    />

                    <CandidateDeployment
                      phienBauCuId={Number(phienBauCuId)}
                      cuocBauCuId={cuocBauCu?.id || 0}
                      sessionKey={sessionKey}
                      ungViens={ungViens}
                      quanLyCuocBauCuAddress={cuocBauCu?.blockchainAddress}
                      hluTokenAddress={contractAddresses?.hluTokenAddress}
                      onSuccess={() => {
                        toast({
                          title: 'Triển khai ứng viên thành công',
                          description: 'Đã triển khai ứng viên lên blockchain thành công',
                        });
                        refreshData();
                      }}
                      onError={(error) => {
                        toast({
                          variant: 'destructive',
                          title: 'Lỗi triển khai ứng viên',
                          description: error,
                        });
                      }}
                      onStatusChange={setCandidateDeploymentStatus}
                      onProgressChange={setCandidateDeploymentProgress}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deployment Guide */}
            <Card className="mb-8 border-t-4 border-indigo-500 dark:border-indigo-600 bg-gradient-to-br from-white to-indigo-50 dark:from-[#162A45]/90 dark:to-[#1A2942]/70">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50">
                    <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                    Hướng Dẫn Triển Khai
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Các bước cần thực hiện để triển khai phiên bầu cử lên blockchain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800/30">
                    <h3 className="text-lg font-medium text-indigo-800 dark:text-indigo-300 mb-2">
                      Quy trình triển khai
                    </h3>
                    <ol className="list-decimal pl-5 space-y-2 text-indigo-700 dark:text-indigo-400">
                      <li>
                        <span className="font-medium">Kiểm tra quyền BANTOCHUC:</span> Xác minh ví
                        của bạn có quyền quản lý bầu cử.
                      </li>
                      <li>
                        <span className="font-medium">Bắt đầu cuộc bầu cử:</span> Kích hoạt cuộc bầu
                        cử trên blockchain.
                      </li>
                      <li>
                        <span className="font-medium">Cấu hình ví:</span> Lấy khóa phiên để ký các
                        giao dịch blockchain.
                      </li>
                      <li>
                        <span className="font-medium">Phê duyệt token:</span> Phê duyệt token HLU
                        cho Factory và Paymaster.
                      </li>
                      <li>
                        <span className="font-medium">Triển khai phiên bầu cử:</span> Gửi giao dịch
                        triển khai lên blockchain.
                      </li>
                      <li>
                        <span className="font-medium">Triển khai cử tri:</span> Triển khai danh sách
                        cử tri đã xác thực.
                      </li>
                      <li>
                        <span className="font-medium">Triển khai ứng viên:</span> Triển khai danh
                        sách ứng viên.
                      </li>
                    </ol>
                  </div>

                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
                    <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300 mb-2">
                      Lưu ý quan trọng
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-amber-700 dark:text-amber-400">
                      <li>Sau khi triển khai lên blockchain, dữ liệu sẽ không thể thay đổi.</li>
                      <li>
                        Đảm bảo thông tin cử tri và ứng viên đã chính xác trước khi triển khai.
                      </li>
                      <li>Quá trình triển khai lên blockchain sẽ phát sinh chi phí gas.</li>
                      <li>
                        Đồng bộ dữ liệu thường xuyên để đảm bảo tính nhất quán giữa cơ sở dữ liệu và
                        blockchain.
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800/30">
                    <h3 className="text-lg font-medium text-cyan-800 dark:text-cyan-300 mb-2">
                      Lợi ích của blockchain
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-cyan-700 dark:text-cyan-400">
                      <li>Tính minh bạch: Mọi giao dịch đều được ghi lại và có thể kiểm chứng.</li>
                      <li>
                        Tính bất biến: Dữ liệu không thể bị thay đổi sau khi đã được xác nhận.
                      </li>
                      <li>Tính phân tán: Không có điểm lỗi đơn lẻ, tăng tính bảo mật.</li>
                      <li>Tính toàn vẹn: Đảm bảo dữ liệu không bị sửa đổi trái phép.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PhienBauCuBlockchainDeploymentPage;
