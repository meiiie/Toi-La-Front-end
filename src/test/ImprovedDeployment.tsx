import React, { useState, useEffect, useCallback } from 'react';
import {
  parseUnits,
  formatEther,
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
  encodeBytes32String,
} from 'ethers';
import apiClient from '../api/apiClient';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Loader,
  ExternalLink,
  ArrowRight,
  Server,
  Wallet,
  Key,
  Info,
  Lock,
  Database,
  Clock,
  CheckCircle2,
  XCircle,
  Hourglass,
} from 'lucide-react';

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
  userOpHash?: string; // Optional field for frontend reference
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

// Giá trị gas cố định từ script test thành công
const FIXED_CALL_GAS_LIMIT = '1407976';
const FIXED_VERIFICATION_GAS_LIMIT = '600000';
const FIXED_PRE_VERIFICATION_GAS = '210000';

// Hàm tạo PaymasterAndData đơn giản - CHỈ trả về địa chỉ như trong script thành công
const createPaymasterAndData = (paymasterAddress: string): string => {
  try {
    // Đảm bảo rằng paymasterAddress là định dạng 0x đúng
    if (!paymasterAddress.startsWith('0x') || paymasterAddress.length !== 42) {
      throw new Error('Địa chỉ paymaster không hợp lệ');
    }

    // Trả về chỉ địa chỉ paymaster như trong script thành công
    return paymasterAddress;
  } catch (error) {
    console.error('Lỗi khi tạo PaymasterAndData:', error);
    throw error;
  }
};

// Hàm debug UserOperation chi tiết
const debugUserOperation = (userOp: any, userOpHash: string) => {
  console.log('====== DEBUG USER OPERATION ======');
  console.log('Sender:', userOp.sender);
  console.log('Nonce:', userOp.nonce);
  console.log(
    'InitCode:',
    userOp.initCode.length > 10 ? userOp.initCode.substring(0, 10) + '...' : userOp.initCode,
  );
  console.log('CallData length:', userOp.callData.length);
  console.log('CallData start:', userOp.callData.substring(0, 10) + '...');
  console.log('CallGasLimit:', userOp.callGasLimit);
  console.log('VerificationGasLimit:', userOp.verificationGasLimit);
  console.log('PreVerificationGas:', userOp.preVerificationGas);
  console.log('MaxFeePerGas:', userOp.maxFeePerGas);
  console.log('MaxPriorityFeePerGas:', userOp.maxPriorityFeePerGas);
  console.log('PaymasterAndData:', userOp.paymasterAndData);
  console.log('PaymasterAndData length:', userOp.paymasterAndData.length);
  console.log('Signature:', userOp.signature.substring(0, 10) + '...');
  console.log('Signature length:', userOp.signature.length);
  console.log('Signature bytes:', getBytes(userOp.signature).length);
  console.log('UserOpHash:', userOpHash);
  console.log('================================');

  // Kiểm tra nếu PaymasterAndData chỉ là một địa chỉ (quan trọng)
  if (userOp.paymasterAndData.length === 42) {
    console.log('✓ PaymasterAndData chỉ chứa địa chỉ, đúng format với script thành công');
  } else {
    console.warn(
      '⚠️ PaymasterAndData chứa thêm dữ liệu ngoài địa chỉ, khác với script thành công!',
    );
  }

  // Kiểm tra chiều dài chữ ký
  if (getBytes(userOp.signature).length !== 65) {
    console.warn('⚠️ Chiều dài chữ ký không phải 65 bytes - đây có thể là vấn đề!');
    console.warn('Chiều dài chữ ký thực tế:', getBytes(userOp.signature).length, 'bytes');
  } else {
    console.log('✓ Chiều dài chữ ký đúng 65 bytes');
  }

  // Kiểm tra các tham số gas có khớp với script test thành công không
  if (userOp.callGasLimit === FIXED_CALL_GAS_LIMIT) {
    console.log('✓ CallGasLimit khớp với script test thành công');
  } else {
    console.warn(
      `⚠️ CallGasLimit (${userOp.callGasLimit}) khác với script test thành công (${FIXED_CALL_GAS_LIMIT})`,
    );
  }

  if (userOp.verificationGasLimit === FIXED_VERIFICATION_GAS_LIMIT) {
    console.log('✓ VerificationGasLimit khớp với script test thành công');
  } else {
    console.warn(
      `⚠️ VerificationGasLimit (${userOp.verificationGasLimit}) khác với script test thành công (${FIXED_VERIFICATION_GAS_LIMIT})`,
    );
  }

  if (userOp.preVerificationGas === FIXED_PRE_VERIFICATION_GAS) {
    console.log('✓ PreVerificationGas khớp với script test thành công');
  } else {
    console.warn(
      `⚠️ PreVerificationGas (${userOp.preVerificationGas}) khác với script test thành công (${FIXED_PRE_VERIFICATION_GAS})`,
    );
  }

  return 'UserOp Debug Complete';
};

// Particle component for space dust effect
const SpaceDust = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute w-full h-full">
        {Array.from({ length: 60 }).map((_, index) => {
          const size = Math.random() * 3 + 1;
          const opacity = Math.random() * 0.5 + 0.2;
          const top = Math.random() * 100;
          const left = Math.random() * 100;
          const animationDuration = Math.random() * 100 + 50;

          return (
            <div
              key={index}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                top: `${top}%`,
                left: `${left}%`,
                opacity: opacity,
                background:
                  index % 3 === 0
                    ? 'rgba(79, 139, 255, 0.7)'
                    : index % 3 === 1
                      ? 'rgba(106, 27, 154, 0.7)'
                      : 'rgba(255, 255, 255, 0.7)',
                boxShadow: `0 0 ${size * 2}px rgba(${index % 3 === 0 ? '79, 139, 255' : index % 3 === 1 ? '106, 27, 154' : '255, 255, 255'}, 0.7)`,
                animation: `float ${animationDuration}s linear infinite`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// Tooltip component
interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-10 w-64 p-2 text-sm text-white bg-gray-800 rounded-md shadow-lg -top-2 left-full ml-2">
          {text}
        </div>
      )}
    </div>
  );
};

// Step status indicator component
const StepStatus: React.FC<{
  currentStatus: DeploymentStatus;
  stepStatus: DeploymentStatus;
  title: string;
  description: string;
}> = ({ currentStatus, stepStatus, title, description }) => {
  let statusIcon;
  let statusClass;

  if (currentStatus === DeploymentStatus.FAILED) {
    statusIcon = <XCircle className="w-6 h-6 text-red-500" />;
    statusClass = 'text-red-500';
  } else if (currentStatus > stepStatus) {
    statusIcon = <CheckCircle2 className="w-6 h-6 text-green-500" />;
    statusClass = 'text-green-500';
  } else if (currentStatus === stepStatus) {
    statusIcon = <Loader className="w-6 h-6 text-blue-500 animate-spin" />;
    statusClass = 'text-blue-500';
  } else {
    statusIcon = <Clock className="w-6 h-6 text-gray-400" />;
    statusClass = 'text-gray-400';
  }

  return (
    <div className="flex items-start space-x-3 mb-3">
      <div className={`flex-shrink-0 mt-1 ${statusClass}`}>{statusIcon}</div>
      <div>
        <h4 className={`text-lg font-medium ${statusClass}`}>{title}</h4>
        <p className="text-gray-300 text-sm">{description}</p>
      </div>
    </div>
  );
};

const BlockchainDeployment: React.FC = () => {
  // Lấy dark mode từ Redux store (giả định rằng bạn có một slice cho theme)
  const darkMode = true;

  // Lấy thông tin người dùng đã đăng nhập
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);

  // State
  const [electionId, setElectionId] = useState('');
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
  // Thêm trạng thái để lưu trữ cả frontend hash và backend hash
  const [frontendHash, setFrontendHash] = useState('');
  const [backendHash, setBackendHash] = useState('');

  // Cập nhật taiKhoanId từ userInfo khi component được tải
  useEffect(() => {
    if (userInfo && userInfo.id) {
      setTaiKhoanId(userInfo.id.toString());
    }
  }, [userInfo]);

  // Hàm hiển thị thông báo
  const showMessage = (msg: string) => {
    setMessage(msg);
    console.log(msg);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    console.error(msg);
  };

  // Hàm đồng bộ blockchain trực tiếp - Cải tiến để gửi cả hai hash
  const syncBlockchainDirect = useCallback(
    async (frontend: string, backend: string) => {
      try {
        console.log('Đồng bộ blockchain trực tiếp với cả hai hash...');
        console.log('- Frontend hash:', frontend);
        console.log('- Backend hash:', backend);

        // Đảm bảo đúng Content-Type để tránh lỗi 415
        const response = await apiClient.post(
          `/api/CuocBauCu/syncBlockchain/${electionId}`,
          {
            forceCheck: true,
            frontendHash: frontend,
            backendHash: backend,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (response.data && response.data.success) {
          // Hiển thị thông tin transaction thực tế (actualTxHash) nếu có
          if (response.data.transaction && response.data.transaction.hash) {
            showMessage(
              `Đồng bộ blockchain thành công! Transaction Hash: ${response.data.transaction.hash}`,
            );
            setTxHash(response.data.transaction.hash); // Hiển thị actualTxHash
          } else {
            showMessage('Đồng bộ blockchain thành công: ' + response.data.status);
          }

          if (response.data.status === 2) {
            setStatus(DeploymentStatus.SUCCESS);
            setProgress(100);
          }
          return true;
        } else if (response.data) {
          showMessage(
            'Đồng bộ blockchain: ' + (response.data.message || JSON.stringify(response.data)),
          );
        }
        return false;
      } catch (error) {
        console.warn('Lỗi khi đồng bộ blockchain:', error);
        // Thêm log chi tiết để debug
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          error.response &&
          typeof error.response === 'object'
        ) {
          const response = error.response as { status?: any; data?: any; headers?: any };
          console.error('Response status:', response.status);
          console.error('Response data:', response.data);
          console.error('Response headers:', response.headers);
        }
        return false;
      }
    },
    [electionId],
  );

  // Thêm hàm để liên kết frontend hash và backend hash
  const linkHashes = useCallback(async (frontendH: string, backendH: string, sender: string) => {
    try {
      console.log(`Liên kết hash: frontend (${frontendH}) với backend (${backendH})`);
      const response = await apiClient.post('/api/bundler/link-hashes', {
        frontendHash: frontendH,
        backendHash: backendH,
        sender: sender,
      });

      if (response.data && response.data.success) {
        console.log('Đã liên kết hash thành công');
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Lỗi khi liên kết hash:', error);
      return false;
    }
  }, []);

  // Kiểm tra trạng thái của UserOperation - Cải tiến để kiểm tra cả hai hash
  const checkUserOpStatus = useCallback(
    async (frontendH: string, backendH: string) => {
      if (!frontendH && !backendH) {
        showError('Hash không hợp lệ khi kiểm tra trạng thái');
        return false;
      }

      try {
        // Thử kiểm tra với frontend hash trước
        console.log('Kiểm tra trạng thái với frontend hash:', frontendH);
        const frontendResponse = await apiClient.get(
          `/api/bundler/check-status?userOpHash=${frontendH}`,
        );

        if (frontendResponse.data && frontendResponse.data.status === 'success') {
          setStatus(DeploymentStatus.SUCCESS);
          setProgress(100);
          showMessage(
            `Cuộc bầu cử đã được triển khai thành công! TxHash: ${frontendResponse.data.txHash}`,
          );
          await apiClient.post(`/api/CuocBauCu/syncBlockchain/${electionId}`);
          return true;
        }

        // Nếu frontend hash chưa được xử lý xong, kiểm tra backend hash
        if (backendH && backendH !== frontendH) {
          console.log('Kiểm tra trạng thái với backend hash:', backendH);
          const backendResponse = await apiClient.get(
            `/api/bundler/check-status?userOpHash=${backendH}`,
          );

          if (backendResponse.data && backendResponse.data.status === 'success') {
            setStatus(DeploymentStatus.SUCCESS);
            setProgress(100);
            showMessage(
              `Cuộc bầu cử đã được triển khai thành công! TxHash: ${backendResponse.data.txHash}`,
            );
            await apiClient.post(`/api/CuocBauCu/syncBlockchain/${electionId}`);
            return true;
          } else if (backendResponse.data && backendResponse.data.status === 'failed') {
            setStatus(DeploymentStatus.FAILED);
            showError(
              `Triển khai thất bại: ${backendResponse.data.message || 'Lỗi không xác định'}`,
            );
            return false;
          }
        }

        // Trả về kết quả từ frontend hash nếu có
        if (frontendResponse.data) {
          if (frontendResponse.data.status === 'failed') {
            setStatus(DeploymentStatus.FAILED);
            showError(
              `Triển khai thất bại: ${frontendResponse.data.message || 'Lỗi không xác định'}`,
            );
            return false;
          } else if (frontendResponse.data.status === 'pending') {
            showMessage(`Giao dịch đang chờ xử lý: ${frontendResponse.data.txHash || frontendH}`);
            return false;
          } else {
            showMessage(
              `Trạng thái giao dịch: ${frontendResponse.data.status || 'không xác định'}`,
            );
            return false;
          }
        }

        // Nếu không tìm thấy với cả 2 hash, thử đồng bộ trực tiếp
        try {
          const syncResponse = await syncBlockchainDirect(frontendH, backendH);
          if (syncResponse) {
            showMessage('Đã đồng bộ blockchain thành công');
            return true;
          }
        } catch (syncError) {
          console.warn('Lỗi khi đồng bộ:', syncError);
        }

        showMessage('Không tìm thấy thông tin giao dịch, sẽ tiếp tục kiểm tra');
        return false;
      } catch (error) {
        console.warn('Lỗi khi kiểm tra trạng thái:', error);
        showMessage(`Lỗi khi kiểm tra trạng thái: ${(error as Error).message}`);
        return false;
      }
    },
    [electionId, syncBlockchainDirect],
  );

  // Lấy địa chỉ các contract
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
  }, []);

  // Lấy thông tin cuộc bầu cử
  const fetchElectionDetails = useCallback(async (id: string) => {
    if (!id) return null;

    try {
      setIsLoading(true);
      const response = await apiClient.get(`/api/CuocBauCu/details/${id}`);

      if (response.data) {
        setElectionData(response.data);
        showMessage(`Đã tải thông tin cuộc bầu cử "${response.data.tenCuocBauCu}"`);
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
  }, []);

  // Lấy session key từ API
  const getSessionKey = useCallback(async () => {
    if (!taiKhoanId || !viId) {
      showError('Vui lòng nhập ID tài khoản và ID ví');
      return null;
    }

    try {
      setIsLoading(true);
      setStatus(DeploymentStatus.CREATING_SESSION_KEY);
      setProgress(20);

      // Gọi API để lấy session key
      const response = await apiClient.post('/api/Blockchain/get-session-key', {
        TaiKhoanID: parseInt(taiKhoanId, 10),
        ViID: parseInt(viId, 10),
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
        return sessionKeyInfo;
      } else {
        throw new Error(response.data?.message || 'Không thể lấy session key');
      }
    } catch (error) {
      showError('Lỗi khi lấy session key: ' + (error as Error).message);

      // Nếu không lấy được, thử tạo mới
      try {
        const createResponse = await apiClient.post('/api/Blockchain/create-session', {
          TaiKhoanID: parseInt(taiKhoanId, 10),
          ViID: parseInt(viId, 10),
        });

        if (createResponse.data && createResponse.data.success) {
          showMessage('Đã tạo session key mới');

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
  }, [taiKhoanId, viId, scwAddress]);

  // Kiểm tra số dư và allowances
  const checkBalancesAndAllowances = useCallback(async () => {
    if (!scwAddress || !contractAddresses) return null;

    try {
      setIsLoading(true);
      setStatus(DeploymentStatus.CHECKING_REQUIREMENTS);
      setProgress(30);

      // Lấy balance HLU
      const balanceResponse = await apiClient.get(
        `/api/Blockchain/token-balance?scwAddress=${scwAddress}`,
      );

      // Lấy allowance của Factory
      const factoryAllowanceResponse = await apiClient.get(
        `/api/Blockchain/check-allowance?scwAddress=${scwAddress}&spenderType=factory`,
      );

      // Lấy allowance của Paymaster
      const paymasterAllowanceResponse = await apiClient.get(
        `/api/Blockchain/check-allowance?scwAddress=${scwAddress}&spenderType=paymaster`,
      );

      const balanceInfo = {
        hluBalance: balanceResponse.data?.balance?.toString() || '0',
        allowanceForFactory: factoryAllowanceResponse.data?.allowance?.toString() || '0',
        allowanceForPaymaster: paymasterAllowanceResponse.data?.allowance?.toString() || '0',
      };

      setBalances(balanceInfo);

      showMessage(
        `Số dư: ${balanceInfo.hluBalance} HLU, Factory allowance: ${balanceInfo.allowanceForFactory}, Paymaster allowance: ${balanceInfo.allowanceForPaymaster}`,
      );

      const hasEnoughBalance = parseFloat(balanceInfo.hluBalance) >= 5.0;
      const hasFactoryAllowance = parseFloat(balanceInfo.allowanceForFactory) >= 4.0;
      const hasPaymasterAllowance = parseFloat(balanceInfo.allowanceForPaymaster) >= 1.0;

      if (!hasEnoughBalance) {
        throw new Error(
          `Số dư HLU không đủ để triển khai. Cần ít nhất 5 HLU, hiện có ${balanceInfo.hluBalance} HLU`,
        );
      }

      if (!hasFactoryAllowance || !hasPaymasterAllowance) {
        setStatus(DeploymentStatus.APPROVING_TOKENS);
        throw new Error('Cần phê duyệt token cho factory hoặc paymaster trước khi triển khai');
      }

      return balanceInfo;
    } catch (error) {
      showError('Lỗi khi kiểm tra số dư: ' + (error as Error).message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [scwAddress, contractAddresses]);

  // Tính thời gian kéo dài
  const calculateDuration = useCallback((startDateStr: string, endDateStr: string): number => {
    // Hàm parse date từ định dạng dd/MM/yyyy HH:mm
    const parseDate = (dateStr: string): Date => {
      const parts = dateStr.split(' ');
      const datePart = parts[0];
      const timePart = parts.length > 1 ? parts[1] : '00:00';

      const [day, month, year] = datePart.split('/').map((num) => parseInt(num, 10));
      const [hour, minute] = timePart.split(':').map((num) => parseInt(num, 10));

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

  // Phương thức tính UserOpHash như trong EntryPoint.sol và script test
  // Phương thức tính UserOpHash theo đúng cách trong EntryPoint.sol
  const calculateUserOpHash = useCallback(
    (userOp: UserOperation, entryPointAddress: string, chainId: number): string => {
      try {
        // QUAN TRỌNG: Xác địnxh đúng TYPE HASH với backend
        const userOpTypeHash = keccak256(
          toUtf8Bytes(
            'UserOperation(address sender,uint256 nonce,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,bytes paymasterAndData,bytes signature)',
          ),
        );

        // Loại bỏ signature để tính hash
        const userOpForHash = { ...userOp, signature: '0x' };

        // Sử dụng AbiCoder để mã hóa dữ liệu
        const abiCoder = new AbiCoder();

        // Tính keccak256 cho các trường có kiểu bytes
        const initCodeHash = keccak256(
          userOpForHash.initCode !== '0x' ? userOpForHash.initCode : '0x',
        );
        const callDataHash = keccak256(userOpForHash.callData);
        const paymasterAndDataHash = keccak256(
          userOpForHash.paymasterAndData !== '0x' ? userOpForHash.paymasterAndData : '0x',
        );

        // Mã hóa theo đúng thứ tự và type trong EntryPoint.sol
        const encodedUserOp = abiCoder.encode(
          [
            'bytes32', // userOpTypeHash
            'address', // sender
            'uint256', // nonce
            'bytes32', // initCodeHash
            'bytes32', // callDataHash
            'uint256', // callGasLimit
            'uint256', // verificationGasLimit
            'uint256', // preVerificationGas
            'uint256', // maxFeePerGas
            'uint256', // maxPriorityFeePerGas
            'bytes32', // paymasterAndDataHash
          ],
          [
            userOpTypeHash,
            userOpForHash.sender,
            userOpForHash.nonce,
            initCodeHash,
            callDataHash,
            userOpForHash.callGasLimit,
            userOpForHash.verificationGasLimit,
            userOpForHash.preVerificationGas,
            userOpForHash.maxFeePerGas,
            userOpForHash.maxPriorityFeePerGas,
            paymasterAndDataHash,
          ],
        );

        // Hash lại kết quả
        const userOpHash = keccak256(encodedUserOp);

        // Thêm entryPoint và chainId theo EIP-4337
        const encodedData = abiCoder.encode(
          ['bytes32', 'address', 'uint256'],
          [userOpHash, entryPointAddress, chainId],
        );

        // Hash cuối cùng
        const finalHash = keccak256(encodedData);

        console.log('Đã tính UserOpHash:', finalHash);

        return finalHash;
      } catch (error) {
        console.error('Lỗi khi tính UserOpHash:', error);
        throw new Error(`Lỗi khi tính UserOpHash: ${(error as Error).message}`);
      }
    },
    [],
  );

  // Ký UserOperation bằng session key theo đúng cách trong testVoiPaymaster.js
  const signUserOp = useCallback((userOpHash: string, sessionKeyPrivate: string): string => {
    try {
      // Chuyển userOpHash thành bytes nếu cần
      const userOpHashBytes = getBytes(userOpHash);

      // Sử dụng SigningKey để ký - cách này giống với script test
      const signingKey = new SigningKey(sessionKeyPrivate);
      const signatureObj = signingKey.sign(userOpHashBytes);

      // Tạo signature theo chuẩn ethers v6 - đúng với cách script test tạo
      const signature = Signature.from({
        r: signatureObj.r,
        s: signatureObj.s,
        v: signatureObj.v,
      }).serialized;

      // Log chi tiết về signature để debug
      console.log('Thông tin chữ ký:');
      console.log('  r:', signatureObj.r);
      console.log('  s:', signatureObj.s);
      console.log('  v:', signatureObj.v);
      console.log('Chữ ký cuối cùng:', signature);
      console.log('Chiều dài chữ ký:', signature.length, 'ký tự');
      console.log('Chiều dài bytes chữ ký:', getBytes(signature).length, 'bytes');

      // Xác minh chữ ký
      const recoveredAddress = recoverAddress(userOpHashBytes, signature);
      const sessionKeyAddress = computeAddress(signingKey.publicKey);

      console.log('Địa chỉ khôi phục:', recoveredAddress);
      console.log('Địa chỉ session key:', sessionKeyAddress);
      console.log(
        'Khớp không?',
        recoveredAddress.toLowerCase() === sessionKeyAddress.toLowerCase()
          ? '✓ Khớp'
          : '✗ Không khớp',
      );

      if (recoveredAddress.toLowerCase() !== sessionKeyAddress.toLowerCase()) {
        throw new Error('Xác minh chữ ký thất bại!');
      }

      return signature;
    } catch (error) {
      console.error('Lỗi khi ký UserOperation:', error);
      throw error;
    }
  }, []);

  // Tạo và gửi UserOperation với các tham số cố định từ script test thành công
  const createAndSubmitUserOperation = useCallback(async () => {
    if (!electionData || !sessionKey || !contractAddresses) {
      throw new Error('Thiếu thông tin cần thiết để tạo UserOperation');
    }

    try {
      setStatus(DeploymentStatus.CREATING_USEROP);
      setProgress(50);

      // Bước 1: Tính thời gian kéo dài
      const thoiGianKeoDai = calculateDuration(electionData.ngayBatDau, electionData.ngayKetThuc);
      console.log('Thời gian kéo dài (giây):', thoiGianKeoDai);

      // Bước 2: Thêm randomness cho tên cuộc bầu cử
      const timestamp = Date.now();
      const randomValue = Math.floor(Math.random() * 1000000);
      const tenCuocBauCuUnique = `${electionData.tenCuocBauCu}-${timestamp}-${randomValue}`;
      const moTaUnique = `${electionData.moTa || 'Không có mô tả'} (ID: ${timestamp}-${randomValue})`;

      // Bước 3: Lấy nonce trực tiếp từ blockchain
      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // ABI tối thiểu cho hàm getNonce/nonceNguoiGui
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
          console.error('Lỗi khi lấy nonce:', nonceError2);
          throw new Error('Không thể lấy nonce: ' + (nonceError2 as Error).message);
        }
      }
      console.log('Nonce hiện tại:', nonce.toString());

      // Bước 4: TẠO CALLDATA BẰNG FACTORY CONTRACT
      const factoryAbi = [
        'function taoUserOpTrienKhaiServer(address sender, string memory tenCuocBauCu, uint256 thoiGianKeoDai, string memory moTa) view returns (tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature))',
      ];

      const factoryContract = new Contract(contractAddresses.factoryAddress, factoryAbi, provider);

      // Gọi hàm taoUserOpTrienKhaiServer từ factory contract
      console.log('Gọi taoUserOpTrienKhaiServer từ Factory...');

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
        console.log('Đã nhận callData từ Factory:', callData.substring(0, 66) + '...');
        console.log('Thông số gợi ý từ Factory:');
        console.log('- callGasLimit:', userOpRaw.callGasLimit.toString());
        console.log('- verificationGasLimit:', userOpRaw.verificationGasLimit.toString());
        console.log('- preVerificationGas:', userOpRaw.preVerificationGas.toString());
      } catch (error) {
        console.error('Lỗi khi gọi taoUserOpTrienKhaiServer:', error);

        // Fallback: Nếu không gọi được hàm taoUserOpTrienKhaiServer, dùng cách tạo callData thủ công
        console.log('Fallback: Tạo callData thủ công...');

        // Tạo callData cho hàm trienKhaiServer
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
        console.log('Đã tạo callData thủ công:', callData.substring(0, 66) + '...');
        throw new Error('Không thể lấy callData từ Factory: ' + (error as Error).message);
      }
      // Bước 6: Lấy UserOpHash từ contract thay vì tự tính
      let userOpHash;
      try {
        // Tạo phiên bản userOp tạm thời (không có userOpHash) để lấy hash
        const tempUserOp = {
          sender: sessionKey.scwAddress,
          nonce: nonce.toString(),
          initCode: '0x',
          callData: callData,
          callGasLimit: '2245362',
          verificationGasLimit: '600000',
          preVerificationGas: '210000',
          maxFeePerGas: parseUnits('5', 'gwei').toString(),
          maxPriorityFeePerGas: parseUnits('2', 'gwei').toString(),
          paymasterAndData: contractAddresses.paymasterAddress,
          signature: '0x',
        };

        // Cách 1: Sử dụng contract để lấy hash chính xác
        userOpHash = await entryPointContract.layHashThaoTac(tempUserOp);
        console.log('UserOpHash từ contract:', userOpHash);
      } catch (hashError) {
        // Cách 2: Fallback - tự tính nếu không gọi được contract
        const tempUserOp = {
          sender: sessionKey.scwAddress,
          nonce: nonce.toString(),
          initCode: '0x',
          callData: callData,
          callGasLimit: '2245362',
          verificationGasLimit: '600000',
          preVerificationGas: '210000',
          maxFeePerGas: parseUnits('5', 'gwei').toString(),
          maxPriorityFeePerGas: parseUnits('2', 'gwei').toString(),
          paymasterAndData: contractAddresses.paymasterAddress,
          signature: '0x',
        };

        userOpHash = calculateUserOpHash(
          tempUserOp,
          contractAddresses.entryPointAddress,
          contractAddresses.chainId,
        );
        console.log('UserOpHash tự tính (fallback):', userOpHash);
      }

      // Lưu frontend hash
      setFrontendHash(userOpHash);

      // Bước 5: Tạo UserOperation với CHÍNH XÁC giá trị từ createElection.js
      const userOp = {
        sender: sessionKey.scwAddress,
        nonce: nonce.toString(),
        initCode: '0x',
        callData: callData,
        callGasLimit: '2245362',
        verificationGasLimit: '600000',
        preVerificationGas: '210000',
        maxFeePerGas: parseUnits('5', 'gwei').toString(),
        maxPriorityFeePerGas: parseUnits('2', 'gwei').toString(),
        paymasterAndData: contractAddresses.paymasterAddress,
        signature: '0x',
        userOpHash: userOpHash, // Bây giờ userOpHash đã được tính toán
      };

      // Bước 7: Ký UserOperation với session key
      const signature = signUserOp(userOpHash, sessionKey.sessionKey);
      userOp.signature = signature;

      // Debug UserOperation trước khi gửi
      debugUserOperation(userOp, userOpHash);

      showMessage('Đã tạo và ký UserOperation thành công');

      try {
        setStatus(DeploymentStatus.SENDING_USEROP);
        setProgress(70);

        // Thêm bước log trước khi gửi đi
        console.log('Chuẩn bị gửi UserOperation đến bundler với format:');
        console.log(
          '  - PaymasterAndData:',
          userOp.paymasterAndData,
          '(chiều dài:',
          userOp.paymasterAndData.length,
          ')',
        );
        console.log('  - Nonce:', userOp.nonce);
        console.log('  - Gas limit:', userOp.callGasLimit);

        // Thêm tham số gasLimit vào request - lấy từ createElection.js
        const response = await apiClient.post('/api/bundler/submit', {
          sender: userOp.sender,
          nonce: userOp.nonce,
          initCode: userOp.initCode,
          callData: userOp.callData,
          callGasLimit: userOp.callGasLimit, // đảm bảo là string '2245362'
          verificationGasLimit: userOp.verificationGasLimit, // đảm bảo là string '600000'
          preVerificationGas: userOp.preVerificationGas, // đảm bảo là string '210000'
          maxFeePerGas: userOp.maxFeePerGas,
          maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
          paymasterAndData: userOp.paymasterAndData,
          signature: userOp.signature,
          userOpHash: userOpHash,
        });

        if (!response.data) {
          throw new Error('Không nhận được phản hồi từ bundler');
        }

        // Lưu backend hash từ phản hồi
        const backendH = response.data.backendHash || response.data.userOpHash || userOpHash;
        setBackendHash(backendH);

        console.log('Hash từ frontend:', userOpHash);
        console.log('Hash từ backend:', backendH);

        if (backendH !== userOpHash) {
          console.warn('Cảnh báo: Hash từ backend khác với hash được tính ở frontend!');
          console.warn('- Hash frontend: ' + userOpHash);
          console.warn('- Hash backend: ' + backendH);

          // Liên kết hai hash
          await linkHashes(userOpHash, backendH, userOp.sender);
        }

        // Sử dụng hash từ backend để theo dõi
        const txHash = response.data.txHash || backendH;
        setTxHash(txHash);

        showMessage('Đã gửi UserOperation thành công');

        // Ghi nhận transaction vào backend với CẢ HAI hash
        try {
          await apiClient.post(`/api/CuocBauCu/recordTransaction/${electionId}`, {
            TxHash: txHash, // Hash chính
            ScwAddress: userOp.sender,
            UserOpHash: userOpHash, // Hash từ frontend
            FrontendHash: userOpHash,
            BackendHash: backendH,
            Source: 'frontend',
          });
          console.log('Đã ghi nhận transaction với cả hai hash:', userOpHash, backendH);
        } catch (recordError) {
          console.warn('Lỗi khi ghi nhận transaction:', recordError);
          // Không throw error ở đây để tiếp tục quá trình
        }

        setStatus(DeploymentStatus.WAITING_CONFIRMATION);
        setProgress(80);

        // Tạo một cơ chế kiểm tra giao dịch với timeout
        let maxAttempts = 15; // Tăng số lần thử lên 15
        let attempts = 0;

        const checkInterval = setInterval(async () => {
          attempts++;
          // Gửi cả hai hash để kiểm tra
          const statusCheck = await checkUserOpStatus(userOpHash, backendH);

          if (statusCheck || attempts >= maxAttempts) {
            clearInterval(checkInterval);
            if (!statusCheck && attempts >= maxAttempts) {
              showMessage('Đã đạt tối đa số lần kiểm tra. Giao dịch có thể vẫn đang chờ xử lý.');
              // Thử đồng bộ lần cuối trước khi kết thúc
              try {
                await syncBlockchainDirect(userOpHash, backendH);
              } catch (finalSyncError) {
                console.warn('Lỗi khi đồng bộ lần cuối:', finalSyncError);
              }
            }
          }
        }, 5000);

        return txHash;
      } catch (error) {
        const errorMessage = (error as Error).message;

        // Xử lý cụ thể hơn tùy vào loại lỗi
        if (errorMessage.includes('paymaster') || errorMessage.includes('Paymaster')) {
          showError('Lỗi liên quan đến paymaster: ' + errorMessage);
          console.error(
            'Paymaster error - kiểm tra lại PaymasterAndData:',
            userOp.paymasterAndData,
          );
        } else if (errorMessage.includes('signature') || errorMessage.includes('Signature')) {
          showError('Lỗi chữ ký: ' + errorMessage);
          console.error('Signature error - kiểm tra lại signUserOp:', userOp.signature);
        } else if (errorMessage.includes('gas')) {
          showError('Lỗi gas: ' + errorMessage);
          console.error('Gas error - kiểm tra lại gas limits');
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
    calculateUserOpHash,
    signUserOp,
    checkUserOpStatus,
    syncBlockchainDirect,
    linkHashes,
  ]);

  // Triển khai cuộc bầu cử
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
      const balanceInfo = await checkBalancesAndAllowances();
      if (!balanceInfo) return;

      // 5. Tạo và gửi UserOperation trong một bước duy nhất
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
    fetchElectionDetails,
    fetchContractAddresses,
    getSessionKey,
    checkBalancesAndAllowances,
    createAndSubmitUserOperation,
  ]);

  // Effect để tải địa chỉ contract khi component được mount
  useEffect(() => {
    fetchContractAddresses();
  }, [fetchContractAddresses]);

  return (
    <div className="relative p-8 bg-gradient-to-b from-[#0A0F18] via-[#121A29] to-[#0D1321] min-h-screen">
      {/* Animated space dust effect */}
      <SpaceDust />

      <div className="relative z-10 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-[#0288D1] to-[#6A1B9A]">
          Triển Khai Cuộc Bầu Cử Lên Blockchain
        </h1>

        <div className="mb-8 p-6 rounded-2xl bg-[#162A45]/50 backdrop-blur-md border border-[#2A3A5A] shadow-[0_0_50px_rgba(79,139,255,0.2)]">
          <h2 className="text-2xl font-medium mb-4 text-white">
            <Shield className="inline-block mr-2 text-[#4F8BFF]" size={24} />
            Thông Tin Cuộc Bầu Cử
          </h2>

          <div className="mb-4">
            <label className="block mb-2 text-lg text-[#E1F5FE] font-medium">
              ID Cuộc Bầu Cử:
              <Tooltip text="Nhập mã ID cuộc bầu cử của bạn">
                <Info size={16} className="ml-1 inline text-blue-400" />
              </Tooltip>
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={electionId}
                onChange={(e) => setElectionId(e.target.value)}
                className="w-full p-3 border border-[#2A3A5A] rounded-lg bg-[#263238]/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4F8BFF]/50 focus:border-[#4F8BFF] backdrop-blur-sm"
                placeholder="Nhập ID cuộc bầu cử"
              />
              <button
                onClick={() => fetchElectionDetails(electionId)}
                disabled={isLoading || !electionId}
                className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white hover:shadow-lg hover:shadow-[#4F8BFF]/20 disabled:opacity-50 transition-all duration-300 flex items-center"
              >
                {isLoading ? (
                  <Loader className="animate-spin mr-2" size={18} />
                ) : (
                  <ArrowRight className="mr-2" size={18} />
                )}
                {isLoading ? 'Đang tải...' : 'Tải Thông Tin'}
              </button>
            </div>
          </div>

          {electionData && (
            <div className="mt-4 p-4 rounded-xl bg-[#1E3A5F]/30 border border-[#2A3A5A]/50">
              <h3 className="text-xl font-medium mb-3 text-[#E1F5FE]">
                {electionData.tenCuocBauCu}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[#B0BEC5]">
                <div>
                  <p className="font-medium text-[#E1F5FE]">Thời Gian Bầu Cử:</p>
                  <p className="mb-2">
                    <Clock className="inline-block mr-1 text-[#4F8BFF]" size={16} />
                    {electionData.ngayBatDau} - {electionData.ngayKetThuc}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-[#E1F5FE]">Trạng Thái Blockchain:</p>
                  <p className="mb-2">
                    {electionData.trangThaiBlockchain === 0 && (
                      <span className="text-yellow-300">
                        <Info className="inline-block mr-1" size={16} />
                        Chưa triển khai
                      </span>
                    )}
                    {electionData.trangThaiBlockchain === 1 && (
                      <span className="text-blue-400">
                        <Hourglass className="inline-block mr-1" size={16} />
                        Đang triển khai
                      </span>
                    )}
                    {electionData.trangThaiBlockchain === 2 && (
                      <span className="text-green-400">
                        <CheckCircle className="inline-block mr-1" size={16} />
                        Đã triển khai
                      </span>
                    )}
                    {electionData.trangThaiBlockchain === 3 && (
                      <span className="text-red-400">
                        <AlertCircle className="inline-block mr-1" size={16} />
                        Triển khai thất bại
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <p className="font-medium text-[#E1F5FE]">Mô Tả:</p>
                <p className="text-[#B0BEC5]">{electionData.moTa || 'Không có mô tả'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8 p-6 rounded-2xl bg-[#162A45]/50 backdrop-blur-md border border-[#2A3A5A] shadow-[0_0_50px_rgba(79,139,255,0.2)]">
          <h2 className="text-2xl font-medium mb-4 text-white">
            <Wallet className="inline-block mr-2 text-[#4F8BFF]" size={24} />
            Cấu Hình Ví Blockchain
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-lg text-[#E1F5FE] font-medium">
                ID Tài Khoản:
                <Tooltip text="ID tài khoản của bạn trong hệ thống">
                  <Info size={16} className="ml-1 inline text-blue-400" />
                </Tooltip>
              </label>
              <input
                type="text"
                value={taiKhoanId}
                onChange={(e) => setTaiKhoanId(e.target.value)}
                className="w-full p-3 border border-[#2A3A5A] rounded-lg bg-[#263238]/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4F8BFF]/50 focus:border-[#4F8BFF] backdrop-blur-sm"
                placeholder="Nhập ID tài khoản"
              />
            </div>

            <div>
              <label className="block mb-2 text-lg text-[#E1F5FE] font-medium">
                ID Ví:
                <Tooltip text="ID ví Smart Contract Wallet của bạn">
                  <Info size={16} className="ml-1 inline text-blue-400" />
                </Tooltip>
              </label>
              <input
                type="text"
                value={viId}
                onChange={(e) => setViId(e.target.value)}
                className="w-full p-3 border border-[#2A3A5A] rounded-lg bg-[#263238]/50 text-white placeholder-gray-400 focus:ring-2 focus:ring-[#4F8BFF]/50 focus:border-[#4F8BFF] backdrop-blur-sm"
                placeholder="Nhập ID ví"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              onClick={getSessionKey}
              disabled={isLoading || !taiKhoanId || !viId}
              className="px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white hover:shadow-lg hover:shadow-[#4F8BFF]/20 disabled:opacity-50 transition-all duration-300 flex items-center"
            >
              {isLoading && status === DeploymentStatus.CREATING_SESSION_KEY ? (
                <Loader className="animate-spin mr-2" size={18} />
              ) : (
                <Key className="mr-2" size={18} />
              )}
              {isLoading && status === DeploymentStatus.CREATING_SESSION_KEY
                ? 'Đang tạo...'
                : 'Lấy Khóa Phiên'}
            </button>
          </div>

          {sessionKey && (
            <div className="mt-4 p-4 rounded-xl bg-[#1E3A5F]/30 border border-[#2A3A5A]/50">
              <h3 className="text-xl font-medium mb-2 text-[#E1F5FE]">Thông Tin Khóa Phiên</h3>

              <div className="mb-3">
                <p className="text-[#E1F5FE] font-medium">Địa Chỉ Ví Thông Minh (SCW):</p>
                <p className="font-mono text-sm text-[#B0BEC5] break-all">
                  {sessionKey.scwAddress}
                </p>
              </div>

              <div className="mb-3">
                <p className="text-[#E1F5FE] font-medium">Thời Hạn Sử Dụng:</p>
                <p className="text-[#B0BEC5]">
                  {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                  <span className="ml-2 text-sm text-green-400">
                    (Còn {Math.floor((sessionKey.expiresAt - Date.now() / 1000) / 3600)} giờ)
                  </span>
                </p>
              </div>

              <div>
                <p className="text-[#E1F5FE] font-medium">Khóa Phiên (đã ẩn):</p>
                <p className="font-mono text-sm text-[#B0BEC5]">
                  {sessionKey.sessionKey.substring(0, 10)}...
                  {sessionKey.sessionKey.substring(sessionKey.sessionKey.length - 8)}
                </p>
              </div>
            </div>
          )}

          {balances.hluBalance !== '0' && (
            <div className="mt-4 p-4 rounded-xl bg-[#1E3A5F]/30 border border-[#2A3A5A]/50">
              <h3 className="text-xl font-medium mb-2 text-[#E1F5FE]">Thông Tin Token</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-[#1A2942]/50 border border-[#2A3A5A]/50">
                  <p className="text-[#E1F5FE] font-medium">Số Dư HLU:</p>
                  <p
                    className={`text-lg font-medium ${parseFloat(balances.hluBalance) >= 5 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {parseFloat(balances.hluBalance).toFixed(2)} HLU
                    {parseFloat(balances.hluBalance) < 5 && (
                      <span className="text-xs block text-red-300">(Cần ít nhất 5 HLU)</span>
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#1A2942]/50 border border-[#2A3A5A]/50">
                  <p className="text-[#E1F5FE] font-medium">Factory Allowance:</p>
                  <p
                    className={`text-lg font-medium ${parseFloat(balances.allowanceForFactory) >= 4 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {parseFloat(balances.allowanceForFactory).toFixed(2)} HLU
                    {parseFloat(balances.allowanceForFactory) < 4 && (
                      <span className="text-xs block text-red-300">(Cần ít nhất 4 HLU)</span>
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#1A2942]/50 border border-[#2A3A5A]/50">
                  <p className="text-[#E1F5FE] font-medium">Paymaster Allowance:</p>
                  <p
                    className={`text-lg font-medium ${parseFloat(balances.allowanceForPaymaster) >= 1 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {parseFloat(balances.allowanceForPaymaster).toFixed(2)} HLU
                    {parseFloat(balances.allowanceForPaymaster) < 1 && (
                      <span className="text-xs block text-red-300">(Cần ít nhất 1 HLU)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8 p-6 rounded-2xl bg-[#162A45]/50 backdrop-blur-md border border-[#2A3A5A] shadow-[0_0_50px_rgba(79,139,255,0.2)]">
          <h2 className="text-2xl font-medium mb-4 text-white">
            <Server className="inline-block mr-2 text-[#4F8BFF]" size={24} />
            Tiến Trình Triển Khai
          </h2>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#E1F5FE] font-medium">Tiến Độ Triển Khai:</span>
              <span className="text-[#E1F5FE]">{progress}%</span>
            </div>

            <div className="relative h-3 bg-[#1A2942] rounded-full overflow-hidden">
              <div
                className={`absolute h-full rounded-full transition-all duration-500 ${
                  status === DeploymentStatus.FAILED
                    ? 'bg-gradient-to-r from-[#F44336] to-[#D50000]'
                    : status === DeploymentStatus.SUCCESS
                      ? 'bg-gradient-to-r from-[#00C853] to-[#64DD17]'
                      : 'bg-gradient-to-r from-[#0288D1] to-[#6A1B9A]'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-medium mb-3 text-[#E1F5FE]">Các Bước Triển Khai:</h3>

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
              />

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
                    <p className="text-gray-300 text-sm">
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
                    <p className="text-gray-300 text-sm">
                      Có lỗi xảy ra trong quá trình triển khai. Vui lòng thử lại.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hiển thị thông báo gần đây */}
          {message && (
            <div className="mb-4 p-4 rounded-lg bg-[#1A2942]/80 border border-[#4F8BFF]/30 text-[#E1F5FE]">
              <p className="flex items-start">
                <Info className="mr-2 flex-shrink-0 mt-1" size={18} />
                <span>{message}</span>
              </p>
            </div>
          )}

          {/* Hiển thị lỗi nếu có */}
          {errorMessage && (
            <div className="mb-4 p-4 rounded-lg bg-[#421A1A]/80 border border-[#F44336]/30 text-[#FFCDD2]">
              <p className="flex items-start">
                <AlertCircle className="mr-2 flex-shrink-0 mt-1" size={18} />
                <span>{errorMessage}</span>
              </p>
            </div>
          )}

          {/* Hiển thị transaction hash và các hash liên quan */}
          {(txHash || frontendHash || backendHash) && (
            <div className="mt-6 p-4 rounded-lg bg-[#1A2942]/80 border border-[#2A3A5A]">
              <h3 className="text-xl font-medium mb-3 text-[#E1F5FE]">
                <Database className="inline-block mr-2" size={20} />
                Thông Tin Giao Dịch:
              </h3>

              {txHash && (
                <div className="mb-3">
                  <p className="text-[#E1F5FE] font-medium">Mã Giao Dịch (Transaction Hash):</p>
                  <div className="flex items-center">
                    <p className="font-mono text-sm text-[#B0BEC5] break-all">{txHash}</p>
                    <a
                      href={`https://explorer.holihu.online/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-[#4F8BFF] hover:text-[#6A1B9A] transition-colors"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              )}

              {status === DeploymentStatus.SUCCESS && (
                <div className="p-3 mt-4 rounded-lg bg-[#1A442A]/50 border border-[#2A5A3A]/50">
                  <p className="text-green-400 font-medium flex items-center">
                    <CheckCircle className="mr-2" size={18} />
                    Cuộc bầu cử đã được triển khai thành công lên blockchain!
                  </p>
                  <p className="text-[#B0BEC5] text-sm mt-1">
                    Bạn có thể quay lại trang quản lý cuộc bầu cử để xem chi tiết và tiếp tục cấu
                    hình.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            onClick={deployElection}
            disabled={
              isLoading ||
              !electionId ||
              !sessionKey ||
              status === DeploymentStatus.SUCCESS ||
              status === DeploymentStatus.SENDING_USEROP ||
              status === DeploymentStatus.WAITING_CONFIRMATION
            }
            className="px-8 py-4 rounded-xl text-xl font-medium bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] text-white hover:shadow-xl hover:shadow-[#4F8BFF]/30 disabled:opacity-50 transition-all duration-300 transform hover:scale-105 flex items-center"
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
                : 'Triển Khai Cuộc Bầu Cử'}
          </button>
        </div>
      </div>

      {/* Floating hexagon background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 opacity-20 pointer-events-none">
        <svg viewBox="0 0 100 100">
          <polygon
            points="50,3 100,28 100,75 50,100 3,75 3,25"
            fill="none"
            stroke="url(#hexGradient)"
            strokeWidth="0.5"
          />
          <defs>
            <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0288D1" />
              <stop offset="100%" stopColor="#6A1B9A" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute bottom-40 left-10 w-48 h-48 opacity-15 pointer-events-none">
        <svg viewBox="0 0 100 100">
          <polygon
            points="50,3 100,28 100,75 50,100 3,75 3,25"
            fill="none"
            stroke="url(#hexGradient)"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      {/* Help section with blockchain explanation */}
      <div className="relative z-10 max-w-5xl mx-auto mt-12 p-6 rounded-2xl bg-[#162A45]/20 backdrop-blur-sm border border-[#2A3A5A]/50">
        <h3 className="text-xl font-medium mb-3 text-[#E1F5FE]">Về Triển Khai Blockchain</h3>
        <p className="text-[#B0BEC5] mb-2">
          Khi triển khai cuộc bầu cử lên blockchain, dữ liệu sẽ được lưu trữ trên chuỗi khối phân
          tán, đảm bảo tính minh bạch, bất biến và an toàn cho quá trình bầu cử.
        </p>
        <p className="text-[#B0BEC5]">
          Mỗi phiếu bầu sẽ được mã hóa và xác thực, đảm bảo không thể thay đổi sau khi đã được ghi
          nhận, tạo ra một cuộc bầu cử công bằng và đáng tin cậy.
        </p>
      </div>
    </div>
  );
};

export default BlockchainDeployment;

// Add keyframe animation for space dust
const style = document.createElement('style');
style.innerHTML = `
  @keyframes float {
    0% {
      transform: translateY(0) translateX(0);
    }
    25% {
      transform: translateY(-10px) translateX(10px);
    }
    50% {
      transform: translateY(-20px) translateX(-5px);
    }
    75% {
      transform: translateY(-10px) translateX(-15px);
    }
    100% {
      transform: translateY(0) translateX(0);
    }
  }
`;
document.head.appendChild(style);
