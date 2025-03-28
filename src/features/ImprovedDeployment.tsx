'use client';

import type React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
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
import apiClient from '../api/apiClient';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { getViByAddress } from '../store/sliceBlockchain/viBlockchainSlice';
import { fetchImageUrl } from '../store/slice/cuocBauCuImageSlice';
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
  Lock,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
  RefreshCw,
  Hexagon,
  Network,
  Link,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useToast } from '../test/components/use-toast';
import ApproveHLU from '../components/blockchain/ApproveHLU';

// Các trạng thái triển khai
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

// Định nghĩa UserOperation theo EIP-4337
interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
  userOpHash?: string;
}

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
}

interface ContractAddresses {
  entryPointAddress: string;
  factoryAddress: string;
  paymasterAddress: string;
  hluTokenAddress: string;
  chainId: number;
}

// Giá trị gas cố định
const FIXED_CALL_GAS_LIMIT = '2245362';
const FIXED_VERIFICATION_GAS_LIMIT = '600000';
const FIXED_PRE_VERIFICATION_GAS = '210000';

// Component hiển thị trạng thái các bước
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
    statusIcon = <CheckCircle2 className="w-6 h-6 text-green-500" />;
    statusClass = 'text-green-500';
  } else if (currentStatus === DeploymentStatus.FAILED) {
    statusIcon = <XCircle className="w-6 h-6 text-red-500" />;
    statusClass = 'text-red-500';
  } else if (currentStatus > stepStatus) {
    statusIcon = <CheckCircle2 className="w-6 h-6 text-green-500" />;
    statusClass = 'text-green-500';
  } else if (currentStatus === stepStatus) {
    statusIcon = <Loader className="w-6 h-6 text-blue-500 animate-spin" />;
    statusClass = 'text-blue-500';
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

const BlockchainDeployment: React.FC = () => {
  // Get the election ID from URL params
  const { id } = useParams<{ id: string }>();
  const electionId = id || '';

  // Toast notifications
  const { toast } = useToast();

  // Redux dispatch
  const dispatch = useDispatch<AppDispatch>();

  // Lấy thông tin từ Redux store
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);
  const electionImage = useSelector((state: RootState) => state.cuocBauCuImage?.imageUrl);

  // State
  const [taiKhoanId, setTaiKhoanId] = useState('');
  const [viId, setViId] = useState('');
  const [scwAddress, setScwAddress] = useState('');
  const [status, setStatus] = useState(DeploymentStatus.NOT_STARTED);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [sessionKey, setSessionKey] = useState<SessionKeyInfo | null>(null);
  const [electionData, setElectionData] = useState<ElectionData | null>(null);
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses | null>(null);
  const [txHash, setTxHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balances, setBalances] = useState({
    hluBalance: '0',
    allowanceForFactory: '0',
    allowanceForPaymaster: '0',
  });
  const [isDataFetched, setIsDataFetched] = useState(false);
  // Thêm state để lưu trữ cả frontend và backend hash
  const [frontendHash, setFrontendHash] = useState('');
  const [backendHash, setBackendHash] = useState('');
  const [hashesLinked, setHashesLinked] = useState(false);

  // Hàm hiển thị thông báo - memoized function
  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    console.log(msg);
  }, []);

  // Hàm hiển thị lỗi - memoized function
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

  // Lấy địa chỉ các contract - memoized function
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

  // Lấy thông tin cuộc bầu cử - memoized function
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

  // Auto-fetch election details when electionId is available
  useEffect(() => {
    if (electionId && !isDataFetched) {
      fetchElectionDetails(electionId);
      fetchContractAddresses();
      dispatch(fetchImageUrl(Number(electionId)));
      setIsDataFetched(true);
    }
  }, [electionId, isDataFetched, fetchElectionDetails, fetchContractAddresses, dispatch]);

  // Cập nhật tài khoản từ userInfo khi component được tải
  useEffect(() => {
    if (userInfo && userInfo.id) {
      setTaiKhoanId(userInfo.id.toString());

      if (userInfo.diaChiVi) {
        dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
      }
    }
  }, [userInfo, dispatch]);

  // Set viId and scwAddress from walletInfo when available
  useEffect(() => {
    if (walletInfo) {
      setViId(walletInfo.viId.toString());
      setScwAddress(walletInfo.diaChiVi);
    }
  }, [walletInfo]);

  // Hàm liên kết frontend hash và backend hash
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

  // Kiểm tra trạng thái của UserOperation với cả hai hash
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

          showMessage(`Cuộc bầu cử đã được triển khai thành công!`);

          if (response.data.txHash) {
            setTxHash(response.data.txHash);
            showMessage(
              `Cuộc bầu cử đã được triển khai thành công! TxHash: ${response.data.txHash}`,
            );
          }

          await apiClient.post(`/api/CuocBauCu/syncBlockchain/${electionId}`);

          toast({
            title: 'Triển khai thành công',
            description: 'Cuộc bầu cử đã được triển khai lên blockchain thành công!',
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
      electionId,
      showMessage,
      showError,
      toast,
      linkHashes,
      frontendHash,
      backendHash,
      scwAddress,
      hashesLinked,
    ],
  );

  // Lấy session key từ API - memoized function
  const getSessionKey = useCallback(async () => {
    if (!taiKhoanId || !viId) {
      showError('Vui lòng nhập ID tài khoản và ID ví');
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

  // Xử lý khi balances được cập nhật từ component ApproveHLU
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
        setStatus(DeploymentStatus.PREPARING_CALLDATA);
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

  // Xử lý khi approve token thành công
  const handleApproveSuccess = useCallback(() => {
    setStatus(DeploymentStatus.PREPARING_CALLDATA);
    setProgress(40);
    showMessage('Đã phê duyệt token thành công, tiếp tục triển khai');
  }, [showMessage]);

  // Tính thời gian kéo dài
  const calculateDuration = useMemo(
    () =>
      (startDateStr: string, endDateStr: string): number => {
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
      },
    [],
  );

  // Ký UserOperation bằng session key
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

  // Tạo và gửi UserOperation - memoized function
  const createAndSubmitUserOperation = useCallback(async () => {
    if (!electionData || !sessionKey || !contractAddresses) {
      throw new Error('Thiếu thông tin cần thiết để tạo UserOperation');
    }

    try {
      setStatus(DeploymentStatus.CREATING_USEROP);
      setProgress(50);

      // Bước 1: Tính thời gian kéo dài
      const thoiGianKeoDai = calculateDuration(electionData.ngayBatDau, electionData.ngayKetThuc);

      // Bước 2: Thêm randomness cho tên cuộc bầu cử
      const timestamp = Date.now();
      const randomValue = Math.floor(Math.random() * 1000000);
      const tenCuocBauCuUnique = `${electionData.tenCuocBauCu}-${timestamp}-${randomValue}`;
      const moTaUnique = `${electionData.moTa || 'Không có mô tả'} (ID: ${timestamp}-${randomValue})`;

      // Bước 3: Lấy nonce từ blockchain
      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // ABI tối thiểu cho hàm getNonce
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

      // Bước 4: Tạo callData từ Factory Contract
      const factoryAbi = [
        'function taoUserOpTrienKhaiServer(address sender, string memory tenCuocBauCu, uint256 thoiGianKeoDai, string memory moTa) view returns (tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature))',
      ];

      const factoryContract = new Contract(contractAddresses.factoryAddress, factoryAbi, provider);

      // Gọi hàm từ factory contract
      let callData;
      let userOpRaw;
      try {
        userOpRaw = await factoryContract.taoUserOpTrienKhaiServer(
          sessionKey.scwAddress,
          tenCuocBauCuUnique,
          thoiGianKeoDai.toString(),
          moTaUnique,
        );

        // Lấy callData từ userOpRaw
        callData = userOpRaw.callData;
      } catch (error) {
        // Fallback: Tạo callData thủ công nếu không gọi được factory
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
        throw new Error('Không thể lấy callData từ Factory: ' + (error as Error).message);
      }

      // Bước 5: Lấy UserOpHash từ contract
      let userOpHash;
      try {
        // Tạo phiên bản userOp tạm thời để lấy hash
        const tempUserOp = {
          sender: sessionKey.scwAddress,
          nonce: nonce.toString(),
          initCode: '0x',
          callData: callData,
          callGasLimit: FIXED_CALL_GAS_LIMIT,
          verificationGasLimit: FIXED_VERIFICATION_GAS_LIMIT,
          preVerificationGas: FIXED_PRE_VERIFICATION_GAS,
          maxFeePerGas: parseUnits('5', 'gwei').toString(),
          maxPriorityFeePerGas: parseUnits('2', 'gwei').toString(),
          paymasterAndData: contractAddresses.paymasterAddress,
          signature: '0x',
        };

        // Sử dụng contract để lấy hash
        userOpHash = await entryPointContract.layHashThaoTac(tempUserOp);
      } catch (hashError) {
        // Fallback: Tính hash thủ công
        throw new Error('Không thể lấy hash từ contract: ' + (hashError as Error).message);
      }

      // Bước 6: Tạo UserOperation hoàn chỉnh
      const userOp = {
        sender: sessionKey.scwAddress,
        nonce: nonce.toString(),
        initCode: '0x',
        callData: callData,
        callGasLimit: FIXED_CALL_GAS_LIMIT,
        verificationGasLimit: FIXED_VERIFICATION_GAS_LIMIT,
        preVerificationGas: FIXED_PRE_VERIFICATION_GAS,
        maxFeePerGas: parseUnits('5', 'gwei').toString(),
        maxPriorityFeePerGas: parseUnits('2', 'gwei').toString(),
        paymasterAndData: contractAddresses.paymasterAddress,
        signature: '0x',
        userOpHash: userOpHash,
      };

      // Bước 7: Ký UserOperation với session key
      const signature = signUserOp(userOpHash, sessionKey.sessionKey);
      userOp.signature = signature;

      showMessage('Đã tạo và ký UserOperation thành công');

      toast({
        title: 'Đã tạo UserOperation',
        description: 'UserOperation đã được tạo và ký thành công',
      });

      try {
        setStatus(DeploymentStatus.SENDING_USEROP);
        setProgress(70);

        // Gửi UserOperation đến bundler
        const response = await apiClient.post('/api/bundler/submit', {
          sender: userOp.sender,
          nonce: userOp.nonce,
          initCode: userOp.initCode,
          callData: userOp.callData,
          callGasLimit: userOp.callGasLimit,
          verificationGasLimit: userOp.verificationGasLimit,
          preVerificationGas: userOp.preVerificationGas,
          maxFeePerGas: userOp.maxFeePerGas,
          maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
          paymasterAndData: userOp.paymasterAndData,
          signature: userOp.signature,
          userOpHash: userOpHash,
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
          await apiClient.post(`/api/CuocBauCu/recordTransaction/${electionId}`, {
            TxHash: txHash,
            ScwAddress: userOp.sender,
            UserOpHash: frontendUserOpHash,
            BackendHash: backendUserOpHash,
            Source: 'frontend',
          });
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
                await apiClient.post(`/api/CuocBauCu/syncBlockchain/${electionId}`);
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
    electionId,
    calculateDuration,
    signUserOp,
    checkUserOpStatus,
    showMessage,
    showError,
    toast,
    linkHashes,
  ]);

  // Triển khai cuộc bầu cử - memoized function
  const deployElection = useCallback(async () => {
    if (!electionId) {
      showError('Vui lòng nhập ID cuộc bầu cử');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      // 1. Lấy thông tin cuộc bầu cử
      const election = await fetchElectionDetails(electionId);
      if (!election) return;

      // 2. Lấy địa chỉ contract
      const contracts = contractAddresses || (await fetchContractAddresses());
      if (!contracts) return;

      // 3. Lấy session key
      const sessionKeyInfo = sessionKey || (await getSessionKey());
      if (!sessionKeyInfo) return;

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
      showError('Lỗi khi triển khai cuộc bầu cử: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [
    electionId,
    contractAddresses,
    sessionKey,
    balances,
    fetchElectionDetails,
    fetchContractAddresses,
    getSessionKey,
    createAndSubmitUserOperation,
    showError,
  ]);

  // Refresh data - memoized function
  const refreshData = useCallback(() => {
    if (electionId) {
      fetchElectionDetails(electionId);
      fetchContractAddresses();

      if (userInfo && userInfo.id && userInfo.diaChiVi) {
        dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
      }

      // Fetch election image
      dispatch(fetchImageUrl(Number(electionId)));

      toast({
        title: 'Đang làm mới dữ liệu',
        description: 'Đang tải lại thông tin cuộc bầu cử và ví',
      });
    }
  }, [electionId, userInfo, dispatch, fetchElectionDetails, fetchContractAddresses, toast]);

  // Kiểm tra xem có thể triển khai hay không
  const canDeploy = useMemo(
    () =>
      electionData &&
      (electionData.trangThaiBlockchain === 0 || electionData.trangThaiBlockchain === 3),
    [electionData],
  );

  // Kiểm tra xem đã có đủ token allowance chưa
  const hasRequiredAllowances = useMemo(
    () =>
      Number.parseFloat(balances.allowanceForFactory) >= 4.0 &&
      Number.parseFloat(balances.allowanceForPaymaster) >= 1.0 &&
      Number.parseFloat(balances.hluBalance) >= 5.0,
    [balances],
  );

  // Xử lý sự kiện setApproveLoading từ component ApproveHLU
  // ĐÂY LÀ ĐIỂM QUAN TRỌNG GÂY RA LỖI: Không truyền setIsLoading trực tiếp vào ApproveHLU
  const handleApproveLoading = useCallback((loading: boolean) => {
    // Chỉ cập nhật nếu giá trị thay đổi để tránh re-render liên tục
    setIsLoading((prevLoading) => {
      if (prevLoading !== loading) {
        return loading;
      }
      return prevLoading;
    });
  }, []);

  return (
    <div className="relative p-8 bg-gradient-to-b from-white to-gray-50 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] rounded-xl shadow-lg overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Triển Khai Blockchain
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
              {electionData ? (
                <>
                  Triển khai cuộc bầu cử{' '}
                  <span className="font-medium">"{electionData.tenCuocBauCu}"</span> lên blockchain
                </>
              ) : (
                <>Triển khai cuộc bầu cử lên blockchain để đảm bảo tính minh bạch và bất biến</>
              )}
            </p>
          </div>
          <button
            onClick={refreshData}
            className="p-3 rounded-full bg-white dark:bg-[#1A2942]/50 hover:bg-gray-100 dark:hover:bg-[#1A2942] transition-colors shadow-md flex items-center gap-2"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-5 h-5 text-blue-500 dark:text-[#4F8BFF]" />
            <span className="text-gray-700 dark:text-gray-200 font-medium">Làm mới</span>
          </button>
        </div>

        {/* Election Info Card */}
        {electionData && (
          <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-[#162A45]/50 border border-gray-200 dark:border-[#2A3A5A] shadow-lg">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Election Image */}
              <div className="w-full md:w-1/3 flex-shrink-0">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-[#1A2942]/50 border border-gray-200 dark:border-[#2A3A5A] flex items-center justify-center">
                  {electionImage ? (
                    <img
                      src={electionImage || '/placeholder.svg'}
                      alt={electionData.tenCuocBauCu}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <Hexagon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Không có hình ảnh</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Election Details */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-blue-500 dark:text-[#4F8BFF]" />
                  {electionData.tenCuocBauCu}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1A2942]/30 border border-gray-200 dark:border-[#2A3A5A]/50">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      Thời gian bầu cử
                    </p>
                    <p className="text-gray-800 dark:text-gray-200 font-medium flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                      {electionData.ngayBatDau} - {electionData.ngayKetThuc}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1A2942]/30 border border-gray-200 dark:border-[#2A3A5A]/50">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      Trạng thái blockchain
                    </p>
                    <p className="font-medium flex items-center">
                      {electionData.trangThaiBlockchain === 0 && (
                        <span className="text-yellow-600 dark:text-yellow-300 flex items-center">
                          <Info className="w-4 h-4 mr-2" />
                          Chưa triển khai
                        </span>
                      )}
                      {electionData.trangThaiBlockchain === 1 && (
                        <span className="text-blue-600 dark:text-blue-400 flex items-center">
                          <Hourglass className="w-4 h-4 mr-2" />
                          Đang triển khai
                        </span>
                      )}
                      {electionData.trangThaiBlockchain === 2 && (
                        <span className="text-green-600 dark:text-green-400 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Đã triển khai
                        </span>
                      )}
                      {electionData.trangThaiBlockchain === 3 && (
                        <span className="text-red-600 dark:text-red-400 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Triển khai thất bại
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1A2942]/30 border border-gray-200 dark:border-[#2A3A5A]/50">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Mô tả</p>
                  <p className="text-gray-800 dark:text-gray-200">
                    {electionData.moTa || 'Không có mô tả'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Configuration Section */}
        <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-[#162A45]/50 border border-gray-200 dark:border-[#2A3A5A] shadow-lg">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A] mr-3">
              <Wallet className="h-6 w-6 text-blue-500 dark:text-[#4F8BFF]" />
            </div>
            <h2 className="text-xl font-medium text-gray-800 dark:text-white">
              Cấu Hình Ví Blockchain
            </h2>
          </div>

          <div className="p-4 mb-6 rounded-lg bg-blue-50 dark:bg-[#1A2942]/80 border border-blue-200 dark:border-[#4F8BFF]/30 text-blue-800 dark:text-[#E1F5FE]">
            <p className="flex items-start">
              <Info className="mr-2 flex-shrink-0 mt-1" size={18} />
              <span>
                Để triển khai cuộc bầu cử lên blockchain, bạn cần có khóa phiên. Hệ thống sẽ tự động
                lấy thông tin tài khoản và ví của bạn.
                {sessionKey && sessionKey.expiresAt * 1000 > Date.now() ? (
                  <span className="block mt-2 font-medium">
                    Bạn đã có khóa phiên còn hạn sử dụng đến:{' '}
                    {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                  </span>
                ) : (
                  <span className="block mt-2">
                    Nhấn nút "Lấy Khóa Phiên" để tạo hoặc lấy khóa phiên hiện có.
                  </span>
                )}
              </span>
            </p>
          </div>

          <div className="flex justify-center">
            <button
              onClick={getSessionKey}
              disabled={isLoading}
              className="px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-purple-600 dark:from-[#0288D1] dark:to-[#6A1B9A] text-white hover:shadow-lg disabled:opacity-50 transition-all duration-300 flex items-center"
            >
              {isLoading && status === DeploymentStatus.CREATING_SESSION_KEY ? (
                <Loader className="animate-spin mr-2" size={18} />
              ) : (
                <Key className="mr-2" size={18} />
              )}
              {isLoading && status === DeploymentStatus.CREATING_SESSION_KEY
                ? 'Đang tạo...'
                : sessionKey && sessionKey.expiresAt * 1000 > Date.now()
                  ? 'Làm Mới Khóa Phiên'
                  : 'Lấy Khóa Phiên'}
            </button>
          </div>

          {/* Session Key Info */}
          {sessionKey && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-[#1A2942]/50 dark:to-[#1E1A29]/50 border border-blue-100 dark:border-[#2A3A5A]/70">
              <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-white flex items-center">
                <Key className="w-5 h-5 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                Thông Tin Khóa Phiên
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-white/50 dark:bg-[#1A2942]/30 border border-blue-100 dark:border-[#2A3A5A]/50">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                    Địa Chỉ Ví Thông Minh (SCW)
                  </p>
                  <div className="flex items-center">
                    <p className="font-mono text-sm text-gray-800 dark:text-gray-200 truncate">
                      {sessionKey.scwAddress}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sessionKey.scwAddress);
                        toast({
                          title: 'Đã sao chép',
                          description: 'Địa chỉ ví đã được sao chép vào clipboard',
                        });
                      }}
                      className="ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#1A2942] text-gray-500 dark:text-gray-400"
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
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white/50 dark:bg-[#1A2942]/30 border border-blue-100 dark:border-[#2A3A5A]/50">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Thời Hạn Sử Dụng</p>
                  <p className="text-gray-800 dark:text-gray-200 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                    {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                    <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                      (Còn {Math.floor((sessionKey.expiresAt - Date.now() / 1000) / 3600)} giờ)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tích hợp component ApproveHLU */}
        {sessionKey && (
          <div className="mb-8">
            <ApproveHLU
              scwAddress={scwAddress}
              sessionKey={sessionKey}
              onSuccess={handleApproveSuccess}
              onBalancesUpdated={handleBalancesUpdated}
              setIsLoading={handleApproveLoading} // Sử dụng hàm wrapper để tránh re-render vô tận
              showMessage={showMessage}
              showError={showError}
            />
          </div>
        )}

        {/* Deployment Progress Section */}
        <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-[#162A45]/50 border border-gray-200 dark:border-[#2A3A5A] shadow-lg">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A] mr-3">
              <Server className="h-6 w-6 text-blue-500 dark:text-[#4F8BFF]" />
            </div>
            <h2 className="text-xl font-medium text-gray-800 dark:text-white">
              Tiến Trình Triển Khai
            </h2>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Tiến Độ:</span>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{progress}%</span>
            </div>

            <div className="relative h-3 bg-gray-200 dark:bg-[#1A2942] rounded-full overflow-hidden">
              <div
                className={`absolute h-full rounded-full transition-all duration-500 ${
                  status === DeploymentStatus.FAILED
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : status === DeploymentStatus.SUCCESS
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600'
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
                isCompleted={
                  Number.parseFloat(balances.allowanceForFactory) >= 4.0 &&
                  Number.parseFloat(balances.allowanceForPaymaster) >= 1.0
                }
              />
            </div>

            <div className="space-y-4">
              <StepStatus
                currentStatus={status}
                stepStatus={DeploymentStatus.PREPARING_CALLDATA}
                title="Chuẩn Bị Dữ Liệu"
                description="Chuẩn bị dữ liệu cuộc bầu cử để triển khai lên blockchain"
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

              {status === DeploymentStatus.SUCCESS && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1 text-green-500">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-green-500">Triển Khai Thành Công</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Cuộc bầu cử đã được triển khai thành công lên blockchain
                    </p>
                  </div>
                </div>
              )}

              {status === DeploymentStatus.FAILED && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1 text-red-500">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-red-500">Triển Khai Thất Bại</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Có lỗi xảy ra trong quá trình triển khai. Vui lòng thử lại.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {message && (
            <div className="mb-4 p-4 rounded-lg bg-blue-50 dark:bg-[#1A2942]/80 border border-blue-200 dark:border-[#4F8BFF]/30 text-blue-800 dark:text-[#E1F5FE]">
              <p className="flex items-start">
                <Info className="mr-2 flex-shrink-0 mt-1" size={18} />
                <span>{message}</span>
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-[#421A1A]/80 border border-red-200 dark:border-[#F44336]/30 text-red-800 dark:text-[#FFCDD2]">
              <p className="flex items-start">
                <AlertCircle className="mr-2 flex-shrink-0 mt-1" size={18} />
                <span>{errorMessage}</span>
              </p>
            </div>
          )}

          {/* Transaction Info */}
          {txHash && (
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-[#1A2942]/50 dark:to-[#1E1A29]/50 border border-blue-100 dark:border-[#2A3A5A]/70">
              <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-white flex items-center">
                <Network className="w-5 h-5 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                Thông Tin Giao Dịch
              </h3>

              <div className="p-3 rounded-lg bg-white/50 dark:bg-[#1A2942]/30 border border-blue-100 dark:border-[#2A3A5A]/50 mb-3">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                  Mã Giao Dịch (Transaction Hash)
                </p>
                <div className="flex items-center">
                  <p className="font-mono text-sm text-gray-800 dark:text-gray-200 truncate">
                    {txHash}
                  </p>
                  <a
                    href={`https://explorer.holihu.online/transactions/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-[#1A2942] text-blue-500 dark:text-[#4F8BFF]"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              {/* Hash Linking Information */}
              {frontendHash && backendHash && frontendHash !== backendHash && (
                <div className="p-3 rounded-lg bg-white/50 dark:bg-[#1A2942]/30 border border-blue-100 dark:border-[#2A3A5A]/50 mb-3">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Liên Kết Hash</p>
                  <div className="flex items-center mb-2">
                    <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center">
                      <Link className="w-4 h-4 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                      Frontend Hash:
                    </p>
                    <p className="font-mono text-sm text-gray-800 dark:text-gray-200 truncate ml-2">
                      {frontendHash.substring(0, 10)}...
                      {frontendHash.substring(frontendHash.length - 8)}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-800 dark:text-gray-200 flex items-center">
                      <Link className="w-4 h-4 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                      Backend Hash:
                    </p>
                    <p className="font-mono text-sm text-gray-800 dark:text-gray-200 truncate ml-2">
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
                <div className="p-3 rounded-lg bg-green-50 dark:bg-[#1A442A]/50 border border-green-200 dark:border-[#2A5A3A]/50 flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-700 dark:text-green-400 font-medium">
                      Cuộc bầu cử đã được triển khai thành công lên blockchain!
                    </p>
                    <p className="text-gray-600 dark:text-[#B0BEC5] text-sm mt-1">
                      Bạn có thể quay lại trang quản lý cuộc bầu cử để xem chi tiết và tiếp tục cấu
                      hình.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deploy Button */}
        <div className="flex justify-center">
          <button
            onClick={deployElection}
            disabled={
              isLoading ||
              !electionId ||
              !sessionKey ||
              !canDeploy ||
              status === DeploymentStatus.SUCCESS ||
              status === DeploymentStatus.SENDING_USEROP ||
              status === DeploymentStatus.WAITING_CONFIRMATION ||
              !hasRequiredAllowances
            }
            className="px-8 py-4 rounded-xl text-xl font-medium bg-gradient-to-r from-blue-500 to-purple-600 dark:from-[#0288D1] dark:to-[#6A1B9A] text-white hover:shadow-xl disabled:opacity-50 transition-all duration-300 flex items-center"
          >
            {isLoading ? (
              <Loader className="animate-spin mr-2" size={24} />
            ) : status === DeploymentStatus.SUCCESS ? (
              <CheckCircle className="mr-2" size={24} />
            ) : (
              <Lock className="mr-2" size={24} />
            )}
            {isLoading
              ? 'Đang xử lý...'
              : status === DeploymentStatus.SUCCESS
                ? 'Đã triển khai thành công'
                : !canDeploy
                  ? 'Không thể triển khai'
                  : 'Triển Khai Cuộc Bầu Cử'}
          </button>
        </div>

        {/* Thông báo nếu không thể triển khai */}
        {!canDeploy &&
          electionData &&
          electionData.trangThaiBlockchain !== 0 &&
          electionData.trangThaiBlockchain !== 3 && (
            <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-[#332A1A]/80 border border-yellow-200 dark:border-[#FFB300]/30 text-yellow-800 dark:text-[#FFECB3]">
              <p className="flex items-start">
                <Info className="mr-2 flex-shrink-0 mt-1" size={18} />
                <span>
                  {electionData.trangThaiBlockchain === 1
                    ? 'Cuộc bầu cử đang trong quá trình triển khai, vui lòng đợi.'
                    : electionData.trangThaiBlockchain === 2
                      ? 'Cuộc bầu cử đã được triển khai thành công lên blockchain.'
                      : 'Không thể triển khai cuộc bầu cử với trạng thái hiện tại.'}
                </span>
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default BlockchainDeployment;
