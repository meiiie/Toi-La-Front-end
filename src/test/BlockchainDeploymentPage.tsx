'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  parseUnits,
  keccak256,
  getBytes,
  recoverAddress,
  SigningKey,
  AbiCoder,
  Contract,
  JsonRpcProvider,
  Signature,
  computeAddress,
  toUtf8Bytes,
} from 'ethers';

// Redux
import type { RootState, AppDispatch } from '../store/store';
import { getViByAddress } from '../store/sliceBlockchain/viBlockchainSlice';

// API
import apiClient from '../api/apiClient';

// Components và UI
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Progress } from '../components/ui/Progress';
import { Button } from '../components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { useToast } from './components/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import ApproveHLU from '../components/blockchain/ApproveHLU';

// Icons
import {
  ArrowLeft,
  RefreshCw,
  Wallet,
  Key,
  Check,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Server,
  ShieldCheck,
  Database,
  BarChart,
  Hexagon,
  Landmark,
  Loader,
  Info,
  Users,
  Calendar,
  Layers,
  Link,
  Network,
} from 'lucide-react';

// Enums
enum DeploymentStatus {
  NOT_STARTED = 0,
  CHECKING_REQUIREMENTS = 1,
  CREATING_SESSION_KEY = 2,
  APPROVING_TOKENS = 3,
  PREPARING_DATA = 4,
  CREATING_OPERATION = 5,
  SENDING_TRANSACTION = 6,
  WAITING_CONFIRMATION = 7,
  SUCCESS = 8,
  FAILED = 9,
}

// Interfaces
interface SessionKeyInfo {
  sessionKey: string;
  expiresAt: number;
  scwAddress: string;
}

interface ElectionData {
  id: number;
  tenCuocBauCu: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  moTa: string;
  trangThaiBlockchain: number;
  blockchainAddress?: string;
  blockchainServerId?: number;
  anhCuocBauCu?: string;
}

interface SessionData {
  id?: number;
  tenPhienBauCu: string;
  moTa: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  soCuTriToiDa: number;
  trangThai?: string;
  cuocBauCuId?: number;
}

interface ContractAddresses {
  entryPointAddress: string;
  factoryAddress: string;
  paymasterAddress: string;
  hluTokenAddress: string;
  chainId: number;
}

// Component đánh dấu các bước
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
    statusIcon = <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
    statusClass = 'text-emerald-500 dark:text-emerald-400';
  } else if (currentStatus === DeploymentStatus.FAILED) {
    statusIcon = <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" />;
    statusClass = 'text-rose-500 dark:text-rose-400';
  } else if (currentStatus > stepStatus) {
    statusIcon = <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
    statusClass = 'text-emerald-500 dark:text-emerald-400';
  } else if (currentStatus === stepStatus) {
    statusIcon = <Loader className="w-5 h-5 text-primary animate-spin" />;
    statusClass = 'text-primary';
  } else {
    statusIcon = <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />;
    statusClass = 'text-gray-400 dark:text-gray-500';
  }

  return (
    <div className="flex items-start space-x-3 mb-4">
      <div className={`flex-shrink-0 mt-1 ${statusClass}`}>{statusIcon}</div>
      <div>
        <h4 className={`text-base font-medium ${statusClass}`}>{title}</h4>
        <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
      </div>
    </div>
  );
};

const BlockchainDeploymentPage: React.FC = () => {
  // Router
  const { id: electionId, sessionId } = useParams<{ id: string; sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();

  // Redux state
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);

  // State for account and blockchain data
  const [taiKhoanId, setTaiKhoanId] = useState<string>('');
  const [viId, setViId] = useState<string>('');
  const [scwAddress, setScwAddress] = useState<string>('');
  const [electionData, setElectionData] = useState<ElectionData | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [deploymentType, setDeploymentType] = useState<'election' | 'session'>('election');
  const [isForElection, setIsForElection] = useState<boolean>(true);

  // Deployment state
  const [status, setStatus] = useState<DeploymentStatus>(DeploymentStatus.NOT_STARTED);
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionKey, setSessionKey] = useState<SessionKeyInfo | null>(null);
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses | null>(null);
  const [balances, setBalances] = useState({
    hluBalance: '0',
    allowanceForFactory: '0',
    allowanceForPaymaster: '0',
  });
  const [txHash, setTxHash] = useState<string>('');
  const [frontendHash, setFrontendHash] = useState<string>('');
  const [backendHash, setBackendHash] = useState<string>('');
  const [hashesLinked, setHashesLinked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isDataFetched, setIsDataFetched] = useState<boolean>(false);

  // Helpers
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

  // Navigate back
  const handleGoBack = useCallback(() => {
    if (sessionId) {
      navigate(
        `/app/user-elections/elections/${electionId}/election-management/${sessionId}/phien-bau-cu`,
      );
    } else if (electionId) {
      navigate(`/app/user-elections/elections/${electionId}/details`);
    } else {
      navigate('/app/user-elections');
    }
  }, [navigate, electionId, sessionId]);

  // Fetch data
  const fetchElectionDetails = useCallback(
    async (id: string) => {
      if (!id) return null;

      try {
        setIsLoading(true);
        const response = await apiClient.get(`/api/CuocBauCu/details/${id}`);

        if (response.data) {
          setElectionData(response.data);
          showMessage(`Đã tải thông tin cuộc bầu cử "${response.data.tenCuocBauCu}"`);

          toast({
            title: 'Đã tải thông tin cuộc bầu cử',
            description: `"${response.data.tenCuocBauCu}"`,
          });

          return response.data;
        } else {
          throw new Error('Không tìm thấy thông tin cuộc bầu cử');
        }
      } catch (error) {
        showError('Lỗi khi lấy thông tin cuộc bầu cử: ' + (error as Error).message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showMessage, showError, toast],
  );

  const fetchSessionDetails = useCallback(
    async (id: string) => {
      if (!id) return null;

      try {
        setIsLoading(true);
        const response = await apiClient.get(`/api/PhienBauCu/${id}`);

        if (response.data) {
          setSessionData(response.data);
          showMessage(`Đã tải thông tin phiên bầu cử "${response.data.tenPhienBauCu}"`);

          toast({
            title: 'Đã tải thông tin phiên bầu cử',
            description: `"${response.data.tenPhienBauCu}"`,
          });

          return response.data;
        } else {
          throw new Error('Không tìm thấy thông tin phiên bầu cử');
        }
      } catch (error) {
        showError('Lỗi khi lấy thông tin phiên bầu cử: ' + (error as Error).message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [showMessage, showError, toast],
  );

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

  // Auto-fetch data when component mounts
  useEffect(() => {
    if (!isDataFetched) {
      if (sessionId) {
        setDeploymentType('session');
        setIsForElection(false);
        fetchSessionDetails(sessionId);
        if (electionId) {
          fetchElectionDetails(electionId);
        }
      } else if (electionId) {
        setDeploymentType('election');
        setIsForElection(true);
        fetchElectionDetails(electionId);
      }

      fetchContractAddresses();
      setIsDataFetched(true);
    }
  }, [
    electionId,
    sessionId,
    isDataFetched,
    fetchElectionDetails,
    fetchSessionDetails,
    fetchContractAddresses,
  ]);

  // Update account from userInfo
  useEffect(() => {
    if (userInfo && userInfo.id) {
      setTaiKhoanId(userInfo.id.toString());

      if (userInfo.diaChiVi) {
        dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
      }
    }
  }, [userInfo, dispatch]);

  // Update wallet from walletInfo
  useEffect(() => {
    if (walletInfo) {
      setViId(walletInfo.viId.toString());
      setScwAddress(walletInfo.diaChiVi);
    }
  }, [walletInfo]);

  // Refresh data
  const refreshData = useCallback(() => {
    if (sessionId) {
      fetchSessionDetails(sessionId);
    }
    if (electionId) {
      fetchElectionDetails(electionId);
    }
    fetchContractAddresses();

    if (userInfo && userInfo.id && userInfo.diaChiVi) {
      dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
    }

    toast({
      title: 'Đang làm mới dữ liệu',
      description: 'Đang tải lại thông tin bầu cử và ví blockchain',
    });
  }, [
    electionId,
    sessionId,
    userInfo,
    dispatch,
    fetchElectionDetails,
    fetchSessionDetails,
    fetchContractAddresses,
    toast,
  ]);

  // Session key management
  const getSessionKey = useCallback(async () => {
    if (!taiKhoanId || !viId) {
      showError('Vui lòng đảm bảo đã đăng nhập và có thông tin tài khoản');
      return null;
    }

    // Kiểm tra nếu đã có session key và còn hạn thì không tạo mới
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

      // Gọi API để lấy session key
      const response = await apiClient.post('/api/Blockchain/get-session-key', {
        TaiKhoanID: Number.parseInt(taiKhoanId, 10),
        ViID: Number.parseInt(viId, 10),
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

      // Nếu không lấy được, thử tạo mới
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

          // Gọi lại API get-session-key để lấy key mới
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

  // Balances handling
  const handleBalancesUpdated = useCallback(
    (newBalances: {
      hluBalance: string;
      allowanceForFactory: string;
      allowanceForPaymaster: string;
    }) => {
      setBalances(newBalances);

      // Kiểm tra nếu đã có đủ allowance
      const hasEnoughBalance = Number.parseFloat(newBalances.hluBalance) >= 5.0;
      const hasFactoryAllowance = Number.parseFloat(newBalances.allowanceForFactory) >= 4.0;
      const hasPaymasterAllowance = Number.parseFloat(newBalances.allowanceForPaymaster) >= 1.0;

      if (hasEnoughBalance && hasFactoryAllowance && hasPaymasterAllowance) {
        // Nếu đã có đủ allowance, chuyển sang bước tiếp theo
        setStatus(DeploymentStatus.PREPARING_DATA);
        setProgress(40);
        showMessage('Đã có đủ quyền truy cập token, có thể tiếp tục triển khai');
      } else if (hasEnoughBalance) {
        // Nếu có đủ số dư nhưng chưa đủ allowance
        setStatus(DeploymentStatus.APPROVING_TOKENS);
        setProgress(30);
      }
    },
    [showMessage],
  );

  // Approve success handling
  const handleApproveSuccess = useCallback(() => {
    setStatus(DeploymentStatus.PREPARING_DATA);
    setProgress(40);
    showMessage('Đã phê duyệt token thành công, tiếp tục triển khai');
  }, [showMessage]);

  // Calculate duration for election/session
  const calculateDuration = useCallback((startDateStr: string, endDateStr: string): number => {
    // Hàm parse date từ định dạng dd/MM/yyyy HH:mm
    const parseDate = (dateStr: string): Date => {
      const parts = dateStr.split(' ');
      const datePart = parts[0];
      const timePart = parts.length > 1 ? parts[1] : '00:00';

      const [day, month, year] = datePart.split('/').map((num) => Number.parseInt(num, 10));
      const [hour, minute] = timePart.split(':').map((num) => Number.parseInt(num, 10));

      return new Date(year, month - 1, day, hour, minute);
    };

    try {
      const startDate = parseDate(startDateStr);
      const endDate = parseDate(endDateStr);

      // Kiểm tra ngày hợp lệ
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 7 * 24 * 60 * 60; // 7 ngày mặc định nếu lỗi
      }

      // Tính khoảng cách thời gian theo giây
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationSeconds = Math.floor(durationMs / 1000);

      // Kiểm tra thời gian hợp lệ
      if (durationSeconds <= 0) {
        return 7 * 24 * 60 * 60; // 7 ngày mặc định nếu thời gian không hợp lệ
      }

      return durationSeconds;
    } catch (error) {
      console.error('Lỗi khi tính thời gian kéo dài:', error);
      return 7 * 24 * 60 * 60; // 7 ngày mặc định nếu có lỗi
    }
  }, []);

  // User Operation signing
  const signUserOp = useCallback((userOpHash: string, sessionKeyPrivate: string): string => {
    try {
      // Chuyển userOpHash thành bytes
      const userOpHashBytes = getBytes(userOpHash);

      // Sử dụng SigningKey để ký
      const signingKey = new SigningKey(sessionKeyPrivate);
      const signatureObj = signingKey.sign(userOpHashBytes);

      // Tạo signature theo chuẩn ethers v6
      const signature = Signature.from({
        r: signatureObj.r,
        s: signatureObj.s,
        v: signatureObj.v,
      }).serialized;

      // Xác minh chữ ký
      const recoveredAddress = recoverAddress(userOpHashBytes, signature);
      const sessionKeyAddress = computeAddress(signingKey.publicKey);

      if (recoveredAddress.toLowerCase() !== sessionKeyAddress.toLowerCase()) {
        throw new Error('Xác minh chữ ký thất bại!');
      }

      return signature;
    } catch (error) {
      console.error('Lỗi khi ký UserOperation:', error);
      throw error;
    }
  }, []);

  // Link hashes
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
        // Kiểm tra với hash chính
        const response = await apiClient.get(`/api/bundler/check-status?userOpHash=${userOpHash}`);

        if (response.data && response.data.status === 'success') {
          setStatus(DeploymentStatus.SUCCESS);
          setProgress(100);

          showMessage(
            `${isForElection ? 'Cuộc bầu cử' : 'Phiên bầu cử'} đã được triển khai thành công!`,
          );

          if (response.data.txHash) {
            setTxHash(response.data.txHash);
            showMessage(
              `${isForElection ? 'Cuộc bầu cử' : 'Phiên bầu cử'} đã được triển khai thành công! TxHash: ${response.data.txHash}`,
            );
          }

          // Cập nhật trạng thái trên backend
          if (isForElection && electionId) {
            await apiClient.post(`/api/CuocBauCu/syncBlockchain/${electionId}`);
          } else if (!isForElection && sessionId && sessionData) {
            await apiClient.put(`/api/PhienBauCu/${sessionId}/status`, {
              trangThai: 'Đã triển khai',
              blockchainAddress: txHash || userOpHash,
            });
          }

          toast({
            title: 'Triển khai thành công',
            description: `${isForElection ? 'Cuộc bầu cử' : 'Phiên bầu cử'} đã được triển khai lên blockchain thành công!`,
          });

          return true;
        } else if (response.data && response.data.status === 'failed') {
          // Nếu hash chính thất bại và có hash liên quan, thử kiểm tra hash liên quan
          if (relatedHash && relatedHash !== userOpHash) {
            showMessage(`Kiểm tra với hash liên quan: ${relatedHash}`);
            return await checkUserOpStatus(relatedHash);
          }

          setStatus(DeploymentStatus.FAILED);
          showError(`Triển khai thất bại: ${response.data.message || 'Lỗi không xác định'}`);
          return false;
        } else if (response.data && response.data.status === 'pending') {
          showMessage(`Giao dịch đang chờ xử lý: ${response.data.txHash || userOpHash}`);

          // Nếu có hash liên quan và chưa được liên kết, thực hiện liên kết
          if (relatedHash && relatedHash !== userOpHash && !hashesLinked) {
            await linkHashes(frontendHash || userOpHash, backendHash || relatedHash, scwAddress);
          }

          return false;
        } else if (response.data && response.data.status === 'unknown') {
          // Nếu hash chính không tìm thấy và có hash liên quan, thử kiểm tra hash liên quan
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
      isForElection,
      electionId,
      sessionId,
      sessionData,
      showMessage,
      showError,
      toast,
      linkHashes,
      frontendHash,
      backendHash,
      scwAddress,
      hashesLinked,
      txHash,
    ],
  );

  // Prepare callData for election or session
  const prepareCallData = useCallback(async () => {
    try {
      if (!contractAddresses || !scwAddress) {
        throw new Error('Thiếu thông tin contract hoặc địa chỉ ví');
      }

      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');
      let callData = '0x';

      if (isForElection && electionData) {
        // Tạo callData cho cuộc bầu cử
        const factoryAbi = [
          'function trienKhaiServer(string memory tenCuocBauCu, uint256 thoiGianKeoDai, string memory moTa) external returns (uint256)',
        ];

        // Thêm timestamp để đảm bảo tên là duy nhất
        const timestamp = Math.floor(Date.now() / 1000);
        const randomValue = Math.floor(Math.random() * 1000);
        const tenCuocBauCuUnique = `${electionData.tenCuocBauCu}-${timestamp}-${randomValue}`;
        const moTaUnique = `${electionData.moTa || 'Không có mô tả'} (ID: ${timestamp}-${randomValue})`;
        const thoiGianKeoDai = calculateDuration(electionData.ngayBatDau, electionData.ngayKetThuc);

        const factoryContract = new Contract(
          contractAddresses.factoryAddress,
          factoryAbi,
          provider,
        );

        // Chuẩn bị callData cho việc triển khai server cuộc bầu cử
        const functionSignature = 'trienKhaiServer(string,uint256,string)';
        const functionSelector = keccak256(toUtf8Bytes(functionSignature)).substring(0, 10);

        const abiCoder = new AbiCoder();
        const encodedParams = abiCoder
          .encode(
            ['string', 'uint256', 'string'],
            [tenCuocBauCuUnique, thoiGianKeoDai.toString(), moTaUnique],
          )
          .substring(2); // remove '0x'

        const innerCallData = functionSelector + encodedParams;

        // Tạo callData cho hàm execute của SCW
        const executeSignature = 'execute(address,uint256,bytes)';
        const executeSelector = keccak256(toUtf8Bytes(executeSignature)).substring(0, 10);

        const executeParams = abiCoder
          .encode(
            ['address', 'uint256', 'bytes'],
            [contractAddresses.factoryAddress, '0', innerCallData],
          )
          .substring(2); // remove '0x'

        callData = executeSelector + executeParams;
      } else if (!isForElection && sessionData && electionData?.blockchainAddress) {
        // Tạo callData cho phiên bầu cử
        const quanLyCuocBauCuAbi = [
          'function taoPhienBauCu(uint256 idCuocBauCu, uint256 thoiGianKeoDai, uint256 soCuTriToiDa) external returns (uint256)',
        ];

        const thoiGianKeoDai = calculateDuration(sessionData.ngayBatDau, sessionData.ngayKetThuc);
        const soCuTriToiDa = sessionData.soCuTriToiDa;

        const quanLyCuocBauCuContract = new Contract(
          electionData.blockchainAddress,
          quanLyCuocBauCuAbi,
          provider,
        );

        // Chuẩn bị callData để gọi hàm taoPhienBauCu - LUÔN DÙNG ID = 1
        const taoPhienBauCuCallData = quanLyCuocBauCuContract.interface.encodeFunctionData(
          'taoPhienBauCu',
          [
            1, // ID cuộc bầu cử LUÔN LÀ 1 trong contract
            BigInt(thoiGianKeoDai),
            BigInt(soCuTriToiDa),
          ],
        );

        // ABI cho contract SCW
        const scwAbi = [
          'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
        ];

        const scwContract = new Contract(scwAddress, scwAbi, provider);

        // Tạo callData để gọi hàm execute của SCW
        callData = scwContract.interface.encodeFunctionData('execute', [
          electionData.blockchainAddress,
          0,
          taoPhienBauCuCallData,
        ]);
      } else {
        throw new Error('Thiếu thông tin cần thiết để tạo CallData');
      }

      return callData;
    } catch (error) {
      console.error('Lỗi khi chuẩn bị CallData:', error);
      throw new Error(`Lỗi khi chuẩn bị CallData: ${(error as Error).message}`);
    }
  }, [isForElection, electionData, sessionData, contractAddresses, scwAddress, calculateDuration]);

  // Create and submit UserOperation
  const createAndSubmitUserOperation = useCallback(async () => {
    if (!electionData || !sessionKey || !contractAddresses) {
      throw new Error('Thiếu thông tin cần thiết để tạo UserOperation');
    }

    try {
      setStatus(DeploymentStatus.CREATING_OPERATION);
      setProgress(50);

      // Lấy nonce từ blockchain
      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');
      const entryPointAbi = [
        'function getNonce(address sender) external view returns (uint256)',
        'function nonceNguoiGui(address) view returns (uint256)',
        'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
      ];

      const entryPointContract = new Contract(
        contractAddresses.entryPointAddress,
        entryPointAbi,
        provider,
      );

      // Lấy nonce - thử cả hai phương thức
      let nonce;
      try {
        nonce = await entryPointContract.getNonce(sessionKey.scwAddress);
      } catch (nonceError) {
        // Nếu fails với getNonce, thử nonceNguoiGui
        try {
          nonce = await entryPointContract.nonceNguoiGui(sessionKey.scwAddress);
        } catch (nonceError2) {
          throw new Error('Không thể lấy nonce: ' + (nonceError2 as Error).message);
        }
      }

      // Chuẩn bị callData
      const callData = await prepareCallData();

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
        nonce: nonce.toString(),
        initCode: '0x',
        callData: callData,
        callGasLimit: '2000000', // Tăng gas limit cho an toàn
        verificationGasLimit: '2000000',
        preVerificationGas: '500000',
        maxFeePerGas: parseUnits('5', 'gwei').toString(),
        maxPriorityFeePerGas: parseUnits('2', 'gwei').toString(),
        paymasterAndData: paymasterAndData,
        signature: '0x',
      };

      // Lấy UserOpHash từ contract
      const userOpHash = await entryPointContract.layHashThaoTac(userOp);

      // Ký UserOperation
      const signature = signUserOp(userOpHash, sessionKey.sessionKey);
      userOp.signature = signature;

      showMessage('Đã tạo và ký UserOperation thành công');

      toast({
        title: 'Đã tạo UserOperation',
        description: 'UserOperation đã được tạo và ký thành công',
      });

      try {
        setStatus(DeploymentStatus.SENDING_TRANSACTION);
        setProgress(70);

        // Gửi UserOperation đến bundler
        const response = await apiClient.post('/api/bundler/submit', {
          ...userOp,
          userOpHash,
        });

        if (!response.data) {
          throw new Error('Không nhận được phản hồi từ bundler');
        }

        // Lưu cả frontend hash và backend hash
        const frontendUserOpHash = response.data.userOpHash || userOpHash;
        const backendUserOpHash = response.data.backendHash || frontendUserOpHash;

        setFrontendHash(frontendUserOpHash);
        setBackendHash(backendUserOpHash);

        // Nếu có cả hai hash và chúng khác nhau, liên kết chúng
        if (frontendUserOpHash && backendUserOpHash && frontendUserOpHash !== backendUserOpHash) {
          showMessage(`Phát hiện hai hash khác nhau, đang liên kết...`);
          await linkHashes(frontendUserOpHash, backendUserOpHash, userOp.sender);
        }

        const txHash = response.data.txHash || frontendUserOpHash;
        setTxHash(txHash);

        showMessage('Đã gửi UserOperation thành công');

        toast({
          title: 'Đã gửi UserOperation',
          description: 'Giao dịch đã được gửi đến blockchain',
        });

        // Ghi nhận transaction vào backend với cả hai hash
        try {
          if (isForElection && electionId) {
            await apiClient.post(`/api/CuocBauCu/recordTransaction/${electionId}`, {
              TxHash: txHash,
              ScwAddress: userOp.sender,
              UserOpHash: frontendUserOpHash,
              BackendHash: backendUserOpHash,
              Source: 'frontend',
            });
          } else if (!isForElection && sessionId) {
            // Ghi nhận transaction cho phiên bầu cử nếu cần
            await apiClient.post(`/api/PhienBauCu/recordTransaction/${sessionId}`, {
              TxHash: txHash,
              ScwAddress: userOp.sender,
              UserOpHash: frontendUserOpHash,
              BackendHash: backendUserOpHash,
              Source: 'frontend',
              CuocBauCuId: electionData.id,
            });
          }
        } catch (recordError) {
          console.warn('Lỗi khi ghi nhận transaction:', recordError);
        }

        setStatus(DeploymentStatus.WAITING_CONFIRMATION);
        setProgress(80);

        // Thiết lập theo dõi giao dịch
        const maxAttempts = 15;
        let attempts = 0;

        const checkInterval = setInterval(async () => {
          attempts++;
          // Kiểm tra với cả hai hash
          const statusCheck = await checkUserOpStatus(frontendUserOpHash, backendUserOpHash);

          if (statusCheck || attempts >= maxAttempts) {
            clearInterval(checkInterval);
            if (!statusCheck && attempts >= maxAttempts) {
              showMessage('Đã đạt tối đa số lần kiểm tra. Giao dịch có thể vẫn đang chờ xử lý.');
              try {
                if (isForElection && electionId) {
                  await apiClient.post(`/api/CuocBauCu/syncBlockchain/${electionId}`);
                } else if (!isForElection && sessionId) {
                  // Sync phiên bầu cử nếu cần
                }
              } catch (finalSyncError) {
                console.warn('Lỗi khi đồng bộ lần cuối:', finalSyncError);
              }
            }
          }
        }, 5000);

        return txHash;
      } catch (error) {
        const errorMessage = (error as Error).message;

        if (errorMessage.includes('paymaster')) {
          showError('Lỗi liên quan đến paymaster: ' + errorMessage);
        } else if (errorMessage.includes('signature')) {
          showError('Lỗi chữ ký: ' + errorMessage);
        } else if (errorMessage.includes('gas')) {
          showError('Lỗi gas: ' + errorMessage);
        } else {
          showError('Lỗi khi tạo và gửi UserOperation: ' + errorMessage);
        }

        setStatus(DeploymentStatus.FAILED);
        throw error;
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      showError('Lỗi khi tạo và gửi UserOperation: ' + errorMessage);
      setStatus(DeploymentStatus.FAILED);
      throw error;
    }
  }, [
    electionData,
    sessionKey,
    contractAddresses,
    isForElection,
    electionId,
    sessionId,
    prepareCallData,
    signUserOp,
    checkUserOpStatus,
    showMessage,
    showError,
    toast,
    linkHashes,
  ]);

  // Deploy function
  const handleDeploy = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      setStatus(DeploymentStatus.CHECKING_REQUIREMENTS);
      setProgress(10);

      // 1. Kiểm tra thông tin cơ bản
      if (isForElection && !electionData) {
        throw new Error('Không tìm thấy thông tin cuộc bầu cử');
      }

      if (!isForElection && (!sessionData || !electionData || !electionData.blockchainAddress)) {
        throw new Error(
          'Thiếu thông tin cần thiết cho phiên bầu cử hoặc cuộc bầu cử chưa được triển khai',
        );
      }

      // 2. Lấy địa chỉ contract
      const contracts = contractAddresses || (await fetchContractAddresses());
      if (!contracts) {
        throw new Error('Không thể lấy địa chỉ contract');
      }

      // 3. Lấy session key
      const sessionKeyInfo = sessionKey || (await getSessionKey());
      if (!sessionKeyInfo) {
        throw new Error('Không thể lấy khóa phiên');
      }

      // 4. Kiểm tra balances
      const hasEnoughBalance = Number.parseFloat(balances.hluBalance) >= 5.0;
      const hasFactoryAllowance = Number.parseFloat(balances.allowanceForFactory) >= 4.0;
      const hasPaymasterAllowance = Number.parseFloat(balances.allowanceForPaymaster) >= 1.0;

      if (!hasEnoughBalance || !hasFactoryAllowance || !hasPaymasterAllowance) {
        setStatus(DeploymentStatus.APPROVING_TOKENS);
        setProgress(30);
        showError('Cần phê duyệt token trước khi triển khai');
        return;
      }

      // 5. Tạo và gửi UserOperation
      await createAndSubmitUserOperation();
    } catch (error) {
      setStatus(DeploymentStatus.FAILED);
      showError('Lỗi khi triển khai: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [
    isForElection,
    electionData,
    sessionData,
    contractAddresses,
    sessionKey,
    balances,
    fetchContractAddresses,
    getSessionKey,
    createAndSubmitUserOperation,
    showError,
  ]);

  // Memoized values
  const hasRequiredAllowances = useMemo(
    () =>
      Number.parseFloat(balances.allowanceForFactory) >= 4.0 &&
      Number.parseFloat(balances.allowanceForPaymaster) >= 1.0 &&
      Number.parseFloat(balances.hluBalance) >= 5.0,
    [balances],
  );

  const canDeploy = useMemo(() => {
    if (isForElection) {
      return (
        electionData &&
        (electionData.trangThaiBlockchain === 0 || electionData.trangThaiBlockchain === 3) &&
        sessionKey &&
        hasRequiredAllowances &&
        status !== DeploymentStatus.SENDING_TRANSACTION &&
        status !== DeploymentStatus.WAITING_CONFIRMATION &&
        status !== DeploymentStatus.SUCCESS
      );
    } else {
      return (
        electionData &&
        electionData.blockchainAddress &&
        electionData.trangThaiBlockchain === 2 &&
        sessionData &&
        sessionKey &&
        hasRequiredAllowances &&
        status !== DeploymentStatus.SENDING_TRANSACTION &&
        status !== DeploymentStatus.WAITING_CONFIRMATION &&
        status !== DeploymentStatus.SUCCESS
      );
    }
  }, [isForElection, electionData, sessionData, sessionKey, hasRequiredAllowances, status]);

  // Deployment Status title
  const getStatusTitle = useMemo(() => {
    switch (status) {
      case DeploymentStatus.NOT_STARTED:
        return 'Chưa bắt đầu';
      case DeploymentStatus.CHECKING_REQUIREMENTS:
        return 'Đang kiểm tra yêu cầu';
      case DeploymentStatus.CREATING_SESSION_KEY:
        return 'Đang tạo khóa phiên';
      case DeploymentStatus.APPROVING_TOKENS:
        return 'Đang phê duyệt token';
      case DeploymentStatus.PREPARING_DATA:
        return 'Đang chuẩn bị dữ liệu';
      case DeploymentStatus.CREATING_OPERATION:
        return 'Đang tạo giao dịch';
      case DeploymentStatus.SENDING_TRANSACTION:
        return 'Đang gửi giao dịch';
      case DeploymentStatus.WAITING_CONFIRMATION:
        return 'Đang chờ xác nhận';
      case DeploymentStatus.SUCCESS:
        return 'Triển khai thành công';
      case DeploymentStatus.FAILED:
        return 'Triển khai thất bại';
      default:
        return 'Không xác định';
    }
  }, [status]);

  // Format blockchain status
  const formatBlockchainStatus = useCallback((status: number | undefined) => {
    switch (status) {
      case 0:
        return {
          label: 'Chưa triển khai',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        };
      case 1:
        return {
          label: 'Đang triển khai',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        };
      case 2:
        return {
          label: 'Đã triển khai',
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        };
      case 3:
        return {
          label: 'Triển khai thất bại',
          color: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
        };
      default:
        return {
          label: 'Không xác định',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        };
    }
  }, []);

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center">
            <Landmark className="mr-2 h-8 w-8 text-primary" />
            {isForElection ? 'Triển Khai Cuộc Bầu Cử' : 'Triển Khai Phiên Bầu Cử'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
            {electionData ? (
              <>
                {isForElection
                  ? `Triển khai cuộc bầu cử "${electionData.tenCuocBauCu}" lên blockchain`
                  : `Triển khai phiên bầu cử "${sessionData?.tenPhienBauCu || ''}" thuộc cuộc bầu cử "${electionData.tenCuocBauCu}" lên blockchain`}
              </>
            ) : (
              <>Triển khai lên blockchain để đảm bảo tính minh bạch và bất biến</>
            )}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleGoBack} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </Button>
          <Button onClick={refreshData} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Status bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">Trạng thái:</span>
            <Badge
              variant={
                status === DeploymentStatus.SUCCESS
                  ? 'success'
                  : status === DeploymentStatus.FAILED
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {getStatusTitle}
            </Badge>
          </div>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Election/Session Info */}
        <div className="lg:col-span-1">
          {/* Info Card */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Hexagon className="w-5 h-5 mr-2 text-primary" />
                {isForElection ? 'Thông Tin Cuộc Bầu Cử' : 'Thông Tin Phiên Bầu Cử'}
              </CardTitle>
              <CardDescription>
                {isForElection
                  ? 'Chi tiết về cuộc bầu cử được triển khai'
                  : 'Chi tiết về phiên bầu cử được triển khai'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isForElection && electionData ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Tên cuộc bầu cử
                      </h3>
                      <p className="text-lg font-semibold">{electionData.tenCuocBauCu}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Thời gian
                      </h3>
                      <p className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>
                          {electionData.ngayBatDau} - {electionData.ngayKetThuc}
                        </span>
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Trạng thái blockchain
                      </h3>
                      <Badge
                        variant="outline"
                        className={formatBlockchainStatus(electionData.trangThaiBlockchain).color}
                      >
                        {formatBlockchainStatus(electionData.trangThaiBlockchain).label}
                      </Badge>
                    </div>
                    {electionData.blockchainAddress && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Địa chỉ blockchain
                        </h3>
                        <div className="flex items-center">
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded font-mono">
                            {electionData.blockchainAddress.substring(0, 12)}...
                            {electionData.blockchainAddress.substring(
                              electionData.blockchainAddress.length - 8,
                            )}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 ml-1"
                            onClick={() => {
                              navigator.clipboard.writeText(electionData.blockchainAddress || '');
                              toast({
                                title: 'Đã sao chép',
                                description: 'Địa chỉ đã được sao chép vào clipboard',
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
                    )}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Mô tả
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {electionData.moTa || 'Không có mô tả'}
                      </p>
                    </div>
                  </div>
                </>
              ) : !isForElection && sessionData ? (
                <>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Tên phiên bầu cử
                      </h3>
                      <p className="text-lg font-semibold">{sessionData.tenPhienBauCu}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Thuộc cuộc bầu cử
                      </h3>
                      <p className="text-sm font-medium">{electionData?.tenCuocBauCu || 'N/A'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Thời gian
                      </h3>
                      <p className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>
                          {sessionData.ngayBatDau} - {sessionData.ngayKetThuc}
                        </span>
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Số cử tri tối đa
                      </h3>
                      <p className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-primary" />
                        <span>{sessionData.soCuTriToiDa} cử tri</span>
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Trạng thái
                      </h3>
                      <Badge
                        variant={sessionData.trangThai === 'Đã triển khai' ? 'success' : 'outline'}
                        className={
                          sessionData.trangThai === 'Đã triển khai'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        }
                      >
                        {sessionData.trangThai || 'Chưa triển khai'}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Mô tả
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {sessionData.moTa || 'Không có mô tả'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Đang tải thông tin...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session Key Card */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Key className="w-5 h-5 mr-2 text-primary" />
                Khóa Phiên
              </CardTitle>
              <CardDescription>Khóa phiên để xác thực giao dịch blockchain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Thông tin quan trọng</AlertTitle>
                  <AlertDescription>
                    Để triển khai lên blockchain, bạn cần có khóa phiên và đủ token HLU.
                    {sessionKey && sessionKey.expiresAt * 1000 > Date.now() && (
                      <span className="block mt-2 font-medium">
                        Bạn đã có khóa phiên còn hạn sử dụng đến:{' '}
                        {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={getSessionKey}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
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

                {sessionKey && (
                  <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <Key className="w-4 h-4 mr-2 text-primary" />
                      Thông Tin Khóa Phiên
                    </h3>

                    <div className="space-y-3 text-sm">
                      <div className="p-2 rounded-md bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                          Địa Chỉ Ví Thông Minh (SCW)
                        </p>
                        <div className="flex items-center">
                          <p className="font-mono text-xs truncate">{sessionKey.scwAddress}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1"
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
                      </div>

                      <div className="p-2 rounded-md bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                          Thời Hạn Sử Dụng
                        </p>
                        <p className="flex items-center text-xs">
                          <Clock className="w-3 h-3 mr-1 text-primary" />
                          {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                          <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                            (Còn{' '}
                            {Math.floor(
                              (sessionKey.expiresAt * 1000 - Date.now()) / (1000 * 60 * 60),
                            )}{' '}
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
        </div>

        {/* Right column - Main Deployment Interface */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                Tổng Quan
              </TabsTrigger>
              <TabsTrigger value="token" className="flex items-center">
                <Wallet className="w-4 h-4 mr-2" />
                Phê Duyệt Token
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center">
                <BarChart className="w-4 h-4 mr-2" />
                Tiến Trình
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Database className="w-5 h-5 mr-2 text-primary" />
                    Thông Tin Triển Khai
                  </CardTitle>
                  <CardDescription>
                    Tổng quan về việc triển khai {isForElection ? 'cuộc bầu cử' : 'phiên bầu cử'}{' '}
                    lên blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Blockchain deploy summary */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-blue-100 dark:border-blue-900/30">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                          <ShieldCheck className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
                          Bảo Mật Blockchain
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Bằng cách triển khai lên blockchain, dữ liệu bầu cử của bạn sẽ được bảo vệ
                          bởi mạng lưới phân tán, đảm bảo tính minh bạch và bất biến.
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30">
                        <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-2 flex items-center">
                          <Network className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" />
                          Smart Contracts
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Hệ thống sử dụng các smart contract để đảm bảo tính toàn vẹn của quá trình
                          bầu cử và độ tin cậy của kết quả.
                        </p>
                      </div>
                    </div>

                    <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300">
                      <Info className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                      <AlertDescription className="text-sm">
                        {isForElection
                          ? 'Quá trình triển khai cuộc bầu cử sẽ yêu cầu phí giao dịch được thanh toán bằng token HLU. Vui lòng đảm bảo bạn có đủ token HLU và đã phê duyệt token cho hệ thống.'
                          : 'Cuộc bầu cử phải được triển khai trước khi bạn có thể triển khai phiên bầu cử. Nếu cuộc bầu cử chưa được triển khai, hãy thực hiện bước đó trước.'}
                      </AlertDescription>
                    </Alert>

                    {/* Requirements summary */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-base font-medium mb-3">Yêu Cầu Triển Khai</h3>
                      <ul className="space-y-2.5">
                        <li className="flex items-center">
                          {sessionKey ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                          )}
                          <span
                            className={
                              sessionKey
                                ? 'text-gray-800 dark:text-gray-200'
                                : 'text-gray-500 dark:text-gray-400'
                            }
                          >
                            Khóa phiên hợp lệ
                          </span>
                        </li>
                        <li className="flex items-center">
                          {Number.parseFloat(balances.hluBalance) >= 5.0 ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                          )}
                          <span
                            className={
                              Number.parseFloat(balances.hluBalance) >= 5.0
                                ? 'text-gray-800 dark:text-gray-200'
                                : 'text-gray-500 dark:text-gray-400'
                            }
                          >
                            Số dư HLU tối thiểu (5 HLU)
                          </span>
                        </li>
                        <li className="flex items-center">
                          {Number.parseFloat(balances.allowanceForFactory) >= 4.0 ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                          )}
                          <span
                            className={
                              Number.parseFloat(balances.allowanceForFactory) >= 4.0
                                ? 'text-gray-800 dark:text-gray-200'
                                : 'text-gray-500 dark:text-gray-400'
                            }
                          >
                            Phê duyệt token cho Factory
                          </span>
                        </li>
                        <li className="flex items-center">
                          {Number.parseFloat(balances.allowanceForPaymaster) >= 1.0 ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                          )}
                          <span
                            className={
                              Number.parseFloat(balances.allowanceForPaymaster) >= 1.0
                                ? 'text-gray-800 dark:text-gray-200'
                                : 'text-gray-500 dark:text-gray-400'
                            }
                          >
                            Phê duyệt token cho Paymaster
                          </span>
                        </li>
                        {!isForElection && (
                          <li className="flex items-center">
                            {electionData?.blockchainAddress ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            ) : (
                              <Clock className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                            )}
                            <span
                              className={
                                electionData?.blockchainAddress
                                  ? 'text-gray-800 dark:text-gray-200'
                                  : 'text-gray-500 dark:text-gray-400'
                              }
                            >
                              Cuộc bầu cử đã được triển khai
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button
                    onClick={handleDeploy}
                    disabled={
                      isLoading ||
                      !canDeploy ||
                      status === DeploymentStatus.SUCCESS ||
                      status === DeploymentStatus.SENDING_TRANSACTION ||
                      status === DeploymentStatus.WAITING_CONFIRMATION
                    }
                    className="w-full md:w-auto"
                    size="lg"
                  >
                    {isLoading ? (
                      <Loader className="mr-2 h-5 w-5 animate-spin" />
                    ) : status === DeploymentStatus.SUCCESS ? (
                      <CheckCircle className="mr-2 h-5 w-5" />
                    ) : (
                      <ShieldCheck className="mr-2 h-5 w-5" />
                    )}
                    {isLoading
                      ? 'Đang xử lý...'
                      : status === DeploymentStatus.SUCCESS
                        ? 'Đã triển khai thành công'
                        : `Triển Khai ${isForElection ? 'Cuộc Bầu Cử' : 'Phiên Bầu Cử'}`}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Token Tab */}
            <TabsContent value="token">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Wallet className="w-5 h-5 mr-2 text-primary" />
                    Phê Duyệt Token HLU
                  </CardTitle>
                  <CardDescription>
                    Phê duyệt token HLU cho các contract để thanh toán phí giao dịch
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* ApproveHLU Component */}
                  <ApproveHLU
                    scwAddress={scwAddress}
                    sessionKey={sessionKey}
                    onSuccess={handleApproveSuccess}
                    onBalancesUpdated={handleBalancesUpdated}
                    setIsLoading={setIsLoading}
                    showMessage={showMessage}
                    showError={showError}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <BarChart className="w-5 h-5 mr-2 text-primary" />
                    Tiến Trình Triển Khai
                  </CardTitle>
                  <CardDescription>
                    Theo dõi quá trình triển khai {isForElection ? 'cuộc bầu cử' : 'phiên bầu cử'}{' '}
                    lên blockchain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          isCompleted={
                            sessionKey ? sessionKey.expiresAt * 1000 > Date.now() : undefined
                          }
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
                          stepStatus={DeploymentStatus.PREPARING_DATA}
                          title="Chuẩn Bị Dữ Liệu"
                          description={`Chuẩn bị dữ liệu ${isForElection ? 'cuộc bầu cử' : 'phiên bầu cử'} để triển khai lên blockchain`}
                        />

                        <StepStatus
                          currentStatus={status}
                          stepStatus={DeploymentStatus.SENDING_TRANSACTION}
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

                    {/* Messages */}
                    {message && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>{message}</AlertDescription>
                      </Alert>
                    )}

                    {errorMessage && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errorMessage}</AlertDescription>
                      </Alert>
                    )}

                    {/* Transaction Info */}
                    {txHash && (
                      <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                        <h3 className="text-lg font-medium mb-3 flex items-center text-blue-800 dark:text-blue-300">
                          <Network className="w-5 h-5 mr-2 text-blue-500" />
                          Thông Tin Giao Dịch
                        </h3>

                        <div className="p-3 rounded-lg bg-white/70 dark:bg-gray-800/40 border border-blue-100 dark:border-blue-900/30 mb-3">
                          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                            Mã Giao Dịch (Transaction Hash)
                          </p>
                          <div className="flex items-center">
                            <p className="font-mono text-sm truncate">{txHash}</p>
                            <a
                              href={`https://explorer.holihu.online/transactions/${txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500 dark:text-blue-400"
                            >
                              <ExternalLink size={16} />
                            </a>
                          </div>
                        </div>

                        {/* Hash Linking Information */}
                        {frontendHash && backendHash && frontendHash !== backendHash && (
                          <div className="p-3 rounded-lg bg-white/70 dark:bg-gray-800/40 border border-blue-100 dark:border-blue-900/30 mb-3">
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                              Liên Kết Hash
                            </p>
                            <div className="flex items-center mb-2">
                              <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                                <Link className="w-4 h-4 mr-2 text-blue-500" />
                                Frontend Hash:
                              </p>
                              <p className="font-mono text-sm truncate ml-2">
                                {frontendHash.substring(0, 10)}...
                                {frontendHash.substring(frontendHash.length - 8)}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                                <Link className="w-4 h-4 mr-2 text-blue-500" />
                                Backend Hash:
                              </p>
                              <p className="font-mono text-sm truncate ml-2">
                                {backendHash.substring(0, 10)}...
                                {backendHash.substring(backendHash.length - 8)}
                              </p>
                            </div>
                            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                              {hashesLinked ? (
                                <span className="flex items-center text-green-600 dark:text-green-400">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Đã liên kết hash thành công
                                </span>
                              ) : (
                                <span className="flex items-center text-yellow-600 dark:text-yellow-400">
                                  <Info className="w-3 h-3 mr-1" />
                                  Đang chờ liên kết hash
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {status === DeploymentStatus.SUCCESS && (
                          <Alert variant="success">
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Triển khai thành công</AlertTitle>
                            <AlertDescription>
                              {isForElection ? 'Cuộc bầu cử' : 'Phiên bầu cử'} đã được triển khai
                              thành công lên blockchain! Bạn có thể quay lại trang quản lý để xem
                              chi tiết.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Not possible to deploy alert */}
          {!canDeploy && (
            <Alert variant="warning" className="mt-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Không thể triển khai</AlertTitle>
              <AlertDescription>
                {!electionData
                  ? 'Không tìm thấy thông tin cuộc bầu cử.'
                  : isForElection && electionData.trangThaiBlockchain === 2
                    ? 'Cuộc bầu cử đã được triển khai lên blockchain.'
                    : !isForElection && electionData.trangThaiBlockchain !== 2
                      ? 'Cuộc bầu cử chưa được triển khai lên blockchain. Vui lòng triển khai cuộc bầu cử trước.'
                      : !sessionKey
                        ? 'Bạn cần lấy khóa phiên để ký giao dịch.'
                        : !hasRequiredAllowances
                          ? 'Bạn cần phê duyệt token HLU để triển khai lên blockchain.'
                          : status === DeploymentStatus.SUCCESS
                            ? `${isForElection ? 'Cuộc bầu cử' : 'Phiên bầu cử'} đã được triển khai thành công.`
                            : status === DeploymentStatus.SENDING_TRANSACTION ||
                                status === DeploymentStatus.WAITING_CONFIRMATION
                              ? 'Đang trong quá trình triển khai, vui lòng đợi.'
                              : 'Vui lòng kiểm tra lại thông tin trước khi triển khai.'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockchainDeploymentPage;
