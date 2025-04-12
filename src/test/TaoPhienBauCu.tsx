'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { parseUnits, getBytes, SigningKey, Contract, JsonRpcProvider } from 'ethers';
import apiClient from '../api/apiClient';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { getViByAddress } from '../store/sliceBlockchain/viBlockchainSlice';
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
  Plus,
  Calendar,
  Clock as ClockIcon,
  Network,
} from 'lucide-react';
import { useToast } from '../test/components/use-toast';
import ApproveHLU from '../components/blockchain/ApproveHLU';

// Trạng thái triển khai
enum DeploySessionStatus {
  NOT_STARTED = 0,
  GETTING_SESSION_KEY = 1,
  APPROVING_TOKENS = 2,
  PREPARING_DATA = 3,
  SENDING_TRANSACTION = 4,
  WAITING_CONFIRMATION = 5,
  SUCCESS = 6,
  FAILED = 7,
}

// Thông tin session key
interface SessionKeyInfo {
  sessionKey: string;
  expiresAt: number;
  scwAddress: string;
}

// Component hiển thị trạng thái
const StepStatus = ({
  currentStatus,
  stepStatus,
  title,
  description,
}: {
  currentStatus: DeploySessionStatus;
  stepStatus: DeploySessionStatus;
  title: string;
  description: string;
}) => {
  let statusIcon;
  let statusClass;

  if (currentStatus === DeploySessionStatus.FAILED) {
    statusIcon = <XCircle className="w-5 h-5 text-red-500" />;
    statusClass = 'text-red-500';
  } else if (currentStatus > stepStatus) {
    statusIcon = <CheckCircle2 className="w-5 h-5 text-green-500" />;
    statusClass = 'text-green-500';
  } else if (currentStatus === stepStatus) {
    statusIcon = <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
    statusClass = 'text-blue-500';
  } else {
    statusIcon = <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />;
    statusClass = 'text-gray-400 dark:text-gray-500';
  }

  return (
    <div className="flex items-start space-x-3 mb-3">
      <div className={`flex-shrink-0 mt-1 ${statusClass}`}>{statusIcon}</div>
      <div>
        <h4 className={`text-base font-medium ${statusClass}`}>{title}</h4>
        <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
      </div>
    </div>
  );
};

const SimpleDeployBallotSession: React.FC = () => {
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();

  // Lấy thông tin từ Redux store
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);

  // State cho form
  const [serverId, setServerId] = useState<string>(''); // ID của server trong Factory
  const [electionId, setElectionId] = useState<string>('');
  const [electionAddress, setElectionAddress] = useState<string>('');
  const [sessionName, setSessionName] = useState<string>('');
  const [sessionDescription, setSessionDescription] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [maxVoters, setMaxVoters] = useState<string>('100');

  // State cho thông tin tài khoản
  const [taiKhoanId, setTaiKhoanId] = useState<string>('');
  const [viId, setViId] = useState<string>('');
  const [scwAddress, setScwAddress] = useState<string>('');

  // State cho quá trình triển khai
  const [status, setStatus] = useState(DeploySessionStatus.NOT_STARTED);
  const [message, setMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [sessionKey, setSessionKey] = useState<SessionKeyInfo | null>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [balances, setBalances] = useState({
    hluBalance: '0',
    allowanceForFactory: '0',
    allowanceForPaymaster: '0',
  });
  const [contractAddresses, setContractAddresses] = useState<any>(null);

  // Hàm hiển thị thông báo
  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    console.log(msg);
  }, []);

  // Hàm hiển thị lỗi
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

  // Parse ngày Việt Nam (DD/MM/YYYY HH:MM) sang Date
  const parseVietnameseDateString = (dateString: string): Date => {
    const parts = dateString.split(' ');
    const datePart = parts[0];
    const timePart = parts.length > 1 ? parts[1] : '00:00';

    const [day, month, year] = datePart.split('/').map((num) => Number.parseInt(num, 10));
    const [hour, minute] = timePart.split(':').map((num) => Number.parseInt(num, 10));

    return new Date(year, month - 1, day, hour, minute);
  };

  // Tính thời gian kéo dài theo giây
  const calculateDuration = (startDateStr: string, endDateStr: string): number => {
    try {
      const startDate = parseVietnameseDateString(startDateStr);
      const endDate = parseVietnameseDateString(endDateStr);

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
  };

  // Kiểm tra quyền chủ sở hữu trước khi triển khai
  const checkOwnership = useCallback(
    async (contractAddress: string, scwAddr: string): Promise<boolean> => {
      try {
        const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

        const quanLyCuocBauCuAbi = [
          'function layThongTinCoBan(uint256 idCuocBauCu) view returns (address, bool, uint256, uint256)',
        ];

        const contract = new Contract(contractAddress, quanLyCuocBauCuAbi, provider);

        // Luôn sử dụng ID = 1 cho contract
        const baseInfo = await contract.layThongTinCoBan(1);
        const owner = baseInfo[0];

        console.log(`Chủ sở hữu cuộc bầu cử: ${owner}`);
        console.log(`SCW address: ${scwAddr}`);

        const isOwner = owner.toLowerCase() === scwAddr.toLowerCase();

        if (!isOwner) {
          showError(`SCW (${scwAddr}) không phải là chủ sở hữu của cuộc bầu cử (${owner})`);
        }

        return isOwner;
      } catch (error) {
        console.error('Lỗi khi kiểm tra quyền chủ sở hữu:', error);
        showError('Không thể kiểm tra quyền chủ sở hữu cuộc bầu cử. Vui lòng thử lại.');
        return false;
      }
    },
    [showError],
  );

  // Cập nhật tài khoản từ userInfo
  useEffect(() => {
    if (userInfo && userInfo.id) {
      setTaiKhoanId(userInfo.id.toString());

      if (userInfo.diaChiVi) {
        dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
      }
    }
  }, [userInfo, dispatch]);

  // Cập nhật viId và scwAddress từ walletInfo
  useEffect(() => {
    if (walletInfo) {
      setViId(walletInfo.viId.toString());
      setScwAddress(walletInfo.diaChiVi);
    }
  }, [walletInfo]);

  // Auto-fetch contract addresses when component mounts
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchContractAddresses();
      } catch (error) {
        console.error('Không thể lấy địa chỉ contract khi khởi tạo:', error);
      }
    };

    initializeData();
  }, []);

  // Lấy địa chỉ các contract
  const fetchContractAddresses = useCallback(async () => {
    try {
      console.log('Đang gọi API để lấy địa chỉ các contract...');
      const response = await apiClient.get('/api/Blockchain/contract-addresses');
      console.log('Kết quả lấy địa chỉ contract:', response.data);

      if (response.data && response.data.success) {
        setContractAddresses(response.data);
        showMessage('Đã lấy thông tin địa chỉ contract');
        return response.data;
      } else {
        throw new Error(
          'Không thể lấy địa chỉ contract: ' + (response.data?.message || 'Không có phản hồi'),
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      showError('Lỗi khi lấy địa chỉ contract: ' + errorMsg);
      console.error('Chi tiết lỗi khi lấy địa chỉ contract:', error);
      return null;
    }
  }, [showMessage, showError]);

  // Lấy thông tin cuộc bầu cử từ API
  const fetchElectionDetails = useCallback(
    async (id: string) => {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await apiClient.get(`/api/CuocBauCu/details/${id}`);

        if (response.data) {
          // Cập nhật địa chỉ blockchain của cuộc bầu cử
          setElectionAddress(response.data.blockchainAddress || '');

          // Cập nhật serverId
          if (response.data.blockchainServerId) {
            setServerId(response.data.blockchainServerId.toString());
            showMessage(`ID Server Blockchain: ${response.data.blockchainServerId}`);
          }

          toast({
            title: 'Đã tải thông tin cuộc bầu cử',
            description: `"${response.data.tenCuocBauCu}"`,
          });
        }
      } catch (error) {
        showError('Lỗi khi lấy thông tin cuộc bầu cử: ' + (error as Error).message);
      } finally {
        setIsLoading(false);
      }
    },
    [showMessage, showError, toast],
  );

  // Lấy session key
  const getSessionKey = useCallback(async () => {
    if (!taiKhoanId || !viId) {
      showError('Vui lòng đảm bảo đã đăng nhập và có thông tin tài khoản');
      return null;
    }

    try {
      setIsLoading(true);
      setStatus(DeploySessionStatus.GETTING_SESSION_KEY);
      setProgress(20);

      console.log('Đang lấy khóa phiên với taiKhoanId:', taiKhoanId, 'viId:', viId);

      // Kiểm tra nếu đã có session key và còn hạn thì không tạo mới
      if (sessionKey && sessionKey.expiresAt * 1000 > Date.now()) {
        showMessage('Đã có khóa phiên và còn hạn sử dụng');

        toast({
          title: 'Khóa phiên hiện tại',
          description: `Khóa phiên còn hạn đến: ${new Date(sessionKey.expiresAt * 1000).toLocaleString()}`,
        });

        return sessionKey;
      }

      // Ưu tiên tạo khóa phiên mới
      try {
        const createResponse = await apiClient.post('/api/Blockchain/create-session', {
          TaiKhoanID: Number.parseInt(taiKhoanId, 10),
          ViID: Number.parseInt(viId, 10),
        });

        if (createResponse.data && createResponse.data.success) {
          showMessage('Đã tạo session key mới');
        } else {
          showMessage('Không thể tạo session key mới, đang thử lấy session key hiện có...');
        }
      } catch (createError) {
        console.warn('Không thể tạo session key mới, thử lấy session key hiện có:', createError);
      }

      // Gọi API để lấy session key (dù đã tạo mới hay chưa)
      const response = await apiClient.post('/api/Blockchain/get-session-key', {
        TaiKhoanID: Number.parseInt(taiKhoanId, 10),
        ViID: Number.parseInt(viId, 10),
      });

      console.log('Kết quả get-session-key:', response.data);

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
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định';
      showError(`Lỗi khi lấy khóa phiên: ${errorMsg}`);
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
        setStatus(DeploySessionStatus.PREPARING_DATA);
        setProgress(40);
        showMessage('Đã có đủ quyền truy cập token, có thể tiếp tục');
      } else if (hasEnoughBalance) {
        // Nếu có đủ số dư nhưng chưa đủ allowance
        setStatus(DeploySessionStatus.APPROVING_TOKENS);
        setProgress(30);
      }
    },
    [showMessage],
  );

  // Xử lý khi approve token thành công
  const handleApproveSuccess = useCallback(() => {
    setStatus(DeploySessionStatus.PREPARING_DATA);
    setProgress(40);
    showMessage('Đã phê duyệt token thành công, tiếp tục triển khai');
  }, [showMessage]);

  // Xử lý sự kiện setApproveLoading từ component ApproveHLU
  const handleApproveLoading = useCallback((loading: boolean) => {
    setIsLoading((prevLoading) => {
      if (prevLoading !== loading) {
        return loading;
      }
      return prevLoading;
    });
  }, []);

  // Hàm để chuẩn bị callData cho tạo phiên bầu cử
  const prepareCreateSessionCallData = async (
    electionContract: string,
    thoiGianKeoDai: string | number,
    soCuTriToiDa: string | number,
  ) => {
    try {
      if (!contractAddresses || !scwAddress) {
        throw new Error('Thiếu thông tin cần thiết để tạo phiên bầu cử');
      }

      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // ABI đầy đủ hơn cho contract QuanLyCuocBauCu
      const quanLyCuocBauCuAbi = [
        'function taoPhienBauCu(uint256 idCuocBauCu, uint256 thoiGianKeoDai, uint256 soCuTriToiDa) external returns (uint256)',
        'function layThongTinCoBan(uint256 idCuocBauCu) view returns (address, bool, uint256, uint256)',
        'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 batDau, uint256 ketThuc) view returns (uint256[])',
      ];

      const quanLyCuocBauCuContract = new Contract(electionContract, quanLyCuocBauCuAbi, provider);

      // Kiểm tra xem SCW có phải là chủ sở hữu của cuộc bầu cử không - LUÔN DÙNG ID = 1
      try {
        const baseInfo = await quanLyCuocBauCuContract.layThongTinCoBan(1);
        const owner = baseInfo[0];

        if (owner.toLowerCase() !== scwAddress.toLowerCase()) {
          console.warn(`SCW (${scwAddress}) không phải là chủ sở hữu của cuộc bầu cử (${owner})`);
        } else {
          console.log('SCW là chủ sở hữu của cuộc bầu cử');
        }
      } catch (error) {
        console.warn('Không thể kiểm tra chủ sở hữu cuộc bầu cử:', error);
      }

      // Chuẩn bị callData để gọi hàm taoPhienBauCu - LUÔN DÙNG ID = 1
      const taoPhienBauCuCallData = quanLyCuocBauCuContract.interface.encodeFunctionData(
        'taoPhienBauCu',
        [
          22, // ID cuộc bầu cử LUÔN LÀ 1 trong contract
          BigInt(thoiGianKeoDai),
          BigInt(soCuTriToiDa),
        ],
      );

      console.log('Đã tạo callData cho taoPhienBauCu:', taoPhienBauCuCallData);

      // ABI cho contract SCW
      const scwAbi = [
        'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
        'function owner() view returns (address)',
        'function sessionKeys(address) view returns (uint256)',
      ];

      const scwContract = new Contract(scwAddress, scwAbi, provider);

      // Kiểm tra owner của SCW
      try {
        const scwOwner = await scwContract.owner();
        console.log('SCW Owner:', scwOwner);
      } catch (error) {
        console.warn('Không thể kiểm tra owner của SCW:', error);
      }

      // Kiểm tra session key
      if (sessionKey) {
        try {
          const expiration = await scwContract.sessionKeys(sessionKey.sessionKey);
          console.log('Session key expiration:', expiration.toString());
        } catch (error) {
          console.warn('Không thể kiểm tra session key:', error);
        }
      }

      // Tạo callData để gọi hàm execute của SCW
      const executeCallData = scwContract.interface.encodeFunctionData('execute', [
        electionContract,
        0,
        taoPhienBauCuCallData,
      ]);

      console.log('Đã tạo callData cho execute:', executeCallData);

      return executeCallData;
    } catch (error) {
      console.error('Lỗi khi chuẩn bị callData tạo phiên bầu cử:', error);
      throw error;
    }
  };

  // Tạo và gửi UserOperation để triển khai phiên bầu cử
  const createAndSubmitUserOperation = async () => {
    if (!sessionKey || !contractAddresses || !electionAddress) {
      const missingInfo = [];
      if (!sessionKey) missingInfo.push('Khóa phiên');
      if (!contractAddresses) missingInfo.push('Địa chỉ hợp đồng');
      if (!electionAddress) missingInfo.push('Địa chỉ cuộc bầu cử');

      const errorMsg = `Thiếu thông tin cần thiết để tạo UserOperation: ${missingInfo.join(', ')}`;
      showError(errorMsg);
      console.error(errorMsg, { sessionKey, contractAddresses, electionAddress });
      throw new Error(errorMsg);
    }

    try {
      setStatus(DeploySessionStatus.SENDING_TRANSACTION);
      setProgress(50);

      // Tính thời gian kéo dài
      const thoiGianKeoDai = calculateDuration(startDate, endDate);

      // Lấy nonce từ blockchain
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

      // Lấy nonce
      let nonce;
      try {
        nonce = await entryPointContract.getNonce(scwAddress);
        showMessage(`Đã lấy nonce: ${nonce.toString()}`);
      } catch (nonceError) {
        // Nếu fails với getNonce, thử nonceNguoiGui
        try {
          nonce = await entryPointContract.nonceNguoiGui(scwAddress);
          showMessage(`Đã lấy nonce (phương thức thay thế): ${nonce.toString()}`);
        } catch (nonceError2) {
          throw new Error('Không thể lấy nonce: ' + (nonceError2 as Error).message);
        }
      }

      // Chuẩn bị callData - LUÔN SỬ DỤNG ID = 1 cho smart contract
      const callData = await prepareCreateSessionCallData(
        electionAddress,
        thoiGianKeoDai,
        Number.parseInt(maxVoters, 10),
      );

      if (!callData) {
        throw new Error('Không thể tạo callData');
      }

      showMessage('Đã tạo callData thành công');

      // Chuẩn bị UserOperation với gas limit cao hơn
      const userOp = {
        sender: scwAddress,
        nonce: nonce.toString(),
        initCode: '0x',
        callData: callData,
        callGasLimit: '3000000', // Tăng gas limit cho an toàn
        verificationGasLimit: '1000000',
        preVerificationGas: '200000',
        maxFeePerGas: parseUnits('10', 'gwei').toString(),
        maxPriorityFeePerGas: parseUnits('5', 'gwei').toString(),
        paymasterAndData: contractAddresses.paymasterAddress,
        signature: '0x',
      };

      // Lấy UserOpHash từ contract
      const userOpHash = await entryPointContract.layHashThaoTac(userOp);

      // Ký UserOperation
      const signingKey = new SigningKey(sessionKey.sessionKey);
      const signature = signingKey.sign(getBytes(userOpHash));

      userOp.signature = signature.serialized;

      showMessage('Đã tạo và ký UserOperation thành công');

      toast({
        title: 'Đã tạo UserOperation',
        description: 'UserOperation đã được tạo và ký thành công',
      });

      try {
        setStatus(DeploySessionStatus.SENDING_TRANSACTION);
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

        // Hiển thị hash giao dịch
        const txHash = response.data.txHash || frontendUserOpHash;
        setTxHash(txHash);

        showMessage(`Đã gửi UserOperation thành công. Hash: ${txHash}`);

        toast({
          title: 'Đã gửi UserOperation',
          description: 'Giao dịch đã được gửi đến blockchain',
        });

        setStatus(DeploySessionStatus.WAITING_CONFIRMATION);
        setProgress(80);

        // Thiết lập theo dõi giao dịch
        const maxAttempts = 15;
        let attempts = 0;

        const checkInterval = setInterval(async () => {
          attempts++;
          try {
            // Kiểm tra trạng thái giao dịch
            const statusResponse = await apiClient.get(
              `/api/bundler/check-status?userOpHash=${txHash}`,
            );

            if (statusResponse.data && statusResponse.data.status === 'success') {
              clearInterval(checkInterval);
              setStatus(DeploySessionStatus.SUCCESS);
              setProgress(100);

              showMessage(`Phiên bầu cử đã được tạo thành công!`);

              toast({
                title: 'Thành công',
                description: 'Phiên bầu cử đã được tạo thành công!',
              });

              // Tạo phiên bầu cử trên backend
              try {
                const backendResponse = await apiClient.post('/api/PhienBauCu', {
                  tenPhienBauCu: sessionName,
                  cuocBauCuId: Number.parseInt(electionId, 10),
                  moTa: sessionDescription,
                  ngayBatDau: startDate,
                  ngayKetThuc: endDate,
                  trangThai: 'Sắp diễn ra',
                });

                if (backendResponse.data && backendResponse.data.id) {
                  showMessage(
                    `Đã tạo phiên bầu cử trên backend với ID: ${backendResponse.data.id}`,
                  );
                }
              } catch (backendError) {
                console.warn('Lỗi khi tạo phiên bầu cử trên backend:', backendError);
              }

              return;
            } else if (statusResponse.data && statusResponse.data.status === 'failed') {
              clearInterval(checkInterval);
              setStatus(DeploySessionStatus.FAILED);
              showError(
                `Giao dịch thất bại: ${statusResponse.data.message || 'Lỗi không xác định'}`,
              );
              return;
            } else if (attempts >= maxAttempts) {
              clearInterval(checkInterval);
              showMessage('Đã đạt tối đa số lần kiểm tra. Giao dịch có thể vẫn đang chờ xử lý.');
            }
          } catch (checkError) {
            console.warn('Lỗi khi kiểm tra trạng thái giao dịch:', checkError);
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

        setStatus(DeploySessionStatus.FAILED);
        throw error;
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      showError('Lỗi khi tạo và gửi UserOperation: ' + errorMessage);
      setStatus(DeploySessionStatus.FAILED);
      throw error;
    }
  };

  // Triển khai phiên bầu cử
  const deploySession = async () => {
    if (!electionAddress) {
      showError('Vui lòng nhập địa chỉ hợp đồng cuộc bầu cử');
      return;
    }

    if (!sessionName || !startDate || !endDate) {
      showError('Vui lòng nhập đầy đủ thông tin phiên bầu cử');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      // Cần phải có contract addresses
      if (!contractAddresses) {
        console.log('Đang lấy địa chỉ contract...', contractAddresses);
        const addresses = await fetchContractAddresses();
        if (!addresses) {
          throw new Error('Không thể lấy địa chỉ contract');
        }
      }

      // Lấy session key nếu chưa có
      if (!sessionKey) {
        console.log('Đang lấy khóa phiên...');
        const sessionKeyInfo = await getSessionKey();
        if (!sessionKeyInfo) {
          throw new Error('Không thể lấy khóa phiên');
        }
      }

      // Kiểm tra và hiển thị thông tin debug
      console.log('Kiểm tra thông tin trước khi tạo UserOperation:');
      console.log('- sessionKey:', sessionKey ? '✅ Có' : '❌ Không');
      console.log('- contractAddresses:', contractAddresses ? '✅ Có' : '❌ Không');
      console.log('- electionAddress:', electionAddress ? `✅ ${electionAddress}` : '❌ Không');

      if (!sessionKey || !contractAddresses || !electionAddress) {
        throw new Error(
          `Thiếu thông tin bắt buộc: ${!sessionKey ? 'sessionKey' : ''} ${!contractAddresses ? 'contractAddresses' : ''} ${!electionAddress ? 'electionAddress' : ''}`,
        );
      }

      // Kiểm tra quyền chủ sở hữu
      const isOwner = await checkOwnership(electionAddress, sessionKey.scwAddress);
      if (!isOwner) {
        throw new Error(
          `SCW không phải là chủ sở hữu của cuộc bầu cử. Bạn không có quyền tạo phiên bầu cử.`,
        );
      }

      // Kiểm tra balances
      const hasEnoughBalance = Number.parseFloat(balances.hluBalance) >= 5.0;
      const hasFactoryAllowance = Number.parseFloat(balances.allowanceForFactory) >= 4.0;
      const hasPaymasterAllowance = Number.parseFloat(balances.allowanceForPaymaster) >= 1.0;

      if (!hasEnoughBalance || !hasFactoryAllowance || !hasPaymasterAllowance) {
        setStatus(DeploySessionStatus.APPROVING_TOKENS);
        setProgress(30);
        showError('Cần phê duyệt token trước khi triển khai');
        return;
      }

      // Tạo và gửi UserOperation
      await createAndSubmitUserOperation();
    } catch (error) {
      setStatus(DeploySessionStatus.FAILED);
      showError('Lỗi khi triển khai phiên bầu cử: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh dữ liệu
  const refreshData = () => {
    fetchContractAddresses();

    if (electionId) {
      fetchElectionDetails(electionId);
    }

    if (userInfo && userInfo.id && userInfo.diaChiVi) {
      dispatch(getViByAddress({ taiKhoanId: userInfo.id, diaChiVi: userInfo.diaChiVi }));
    }

    toast({
      title: 'Đang làm mới dữ liệu',
      description: 'Đang tải lại thông tin các hợp đồng và ví',
    });
  };

  // Kiểm tra xem đã có đủ token allowance chưa
  const hasRequiredAllowances = useMemo(
    () =>
      Number.parseFloat(balances.allowanceForFactory) >= 4.0 &&
      Number.parseFloat(balances.allowanceForPaymaster) >= 1.0 &&
      Number.parseFloat(balances.hluBalance) >= 5.0,
    [balances],
  );

  // Hàm kiểm tra xem có thể triển khai không
  const canDeploySession = useMemo(() => {
    return (
      sessionName !== '' &&
      startDate !== '' &&
      endDate !== '' &&
      electionAddress !== '' &&
      sessionKey !== null &&
      hasRequiredAllowances
    );
  }, [sessionName, startDate, endDate, electionAddress, sessionKey, hasRequiredAllowances]);

  return (
    <div className="relative p-8 bg-gradient-to-b from-white to-gray-50 dark:from-[#0A0F18] dark:via-[#121A29] dark:to-[#0D1321] rounded-xl shadow-lg overflow-hidden">
      {/* Overlay loading khi đang xử lý */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm dark:bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#1A2942] p-4 rounded-lg shadow-lg flex items-center space-x-3">
            <Loader className="w-6 h-6 text-blue-500 animate-spin" />
            <p className="text-gray-700 dark:text-gray-200">Đang xử lý...</p>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Triển Khai Phiên Bầu Cử Lên Blockchain
            </h1>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
              Tạo và triển khai phiên bầu cử mới lên blockchain để đảm bảo tính minh bạch và bất
              biến
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

        {/* Form nhập thông tin */}
        <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-[#162A45]/50 border border-gray-200 dark:border-[#2A3A5A] shadow-lg">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A] mr-3">
              <Server className="h-6 w-6 text-blue-500 dark:text-[#4F8BFF]" />
            </div>
            <h2 className="text-xl font-medium text-gray-800 dark:text-white">
              Thông Tin Phiên Bầu Cử
            </h2>
          </div>

          <div className="space-y-6">
            {/* Cuộc bầu cử */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="electionId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  ID Cuộc Bầu Cử (Database)
                </label>
                <input
                  type="text"
                  id="electionId"
                  value={electionId}
                  onChange={(e) => setElectionId(e.target.value)}
                  onBlur={() => electionId && fetchElectionDetails(electionId)}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A2942]/70 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                  placeholder="Nhập ID cuộc bầu cử từ database"
                />
              </div>

              <div>
                <label
                  htmlFor="serverId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  ID Server Blockchain
                </label>
                <input
                  type="text"
                  id="serverId"
                  value={serverId}
                  onChange={(e) => setServerId(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A2942]/70 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                  placeholder="ID của server trên blockchain"
                  readOnly={!!electionAddress} // Chỉ cho phép sửa nếu chưa có địa chỉ blockchain
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  ID server được lấy từ trường blockchainServerId của cuộc bầu cử.
                  <br />
                  Lưu ý: ID này chỉ dùng để lấy thông tin, khi gọi smart contract luôn dùng ID = 1.
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="electionAddress"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Địa Chỉ Hợp Đồng Cuộc Bầu Cử
              </label>
              <input
                type="text"
                id="electionAddress"
                value={electionAddress}
                onChange={(e) => setElectionAddress(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A2942]/70 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                placeholder="0x..."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Sẽ được tự động điền khi bạn nhập ID cuộc bầu cử từ database
              </p>
            </div>

            {/* Thông tin phiên bầu cử */}
            <div>
              <label
                htmlFor="sessionName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Tên Phiên Bầu Cử
              </label>
              <input
                type="text"
                id="sessionName"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A2942]/70 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                placeholder="Nhập tên phiên bầu cử"
              />
            </div>

            <div>
              <label
                htmlFor="sessionDescription"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Mô Tả Phiên Bầu Cử
              </label>
              <textarea
                id="sessionDescription"
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A2942]/70 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                placeholder="Nhập mô tả phiên bầu cử"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Ngày Bắt Đầu
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A2942]/70 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                    placeholder="DD/MM/YYYY HH:MM"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Ngày Kết Thúc
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A2942]/70 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                    placeholder="DD/MM/YYYY HH:MM"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="maxVoters"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Số Cử Tri Tối Đa
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="maxVoters"
                    value={maxVoters}
                    onChange={(e) => setMaxVoters(e.target.value)}
                    className="w-full p-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1A2942]/70 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                    placeholder="Số cử tri tối đa"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Xác nhận thông tin */}
          <div className="mt-6 p-4 rounded-lg bg-yellow-50 dark:bg-[#332A1A]/80 border border-yellow-200 dark:border-[#FFB300]/30 text-yellow-800 dark:text-[#FFECB3]">
            <p className="flex items-start">
              <Info className="mr-2 flex-shrink-0 mt-1" size={18} />
              <span>
                Thông tin phiên bầu cử sẽ được lưu trữ trên blockchain và không thể thay đổi sau khi
                triển khai. Vui lòng kiểm tra kỹ thông tin trước khi tiếp tục.
              </span>
            </p>
          </div>
        </div>

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
                Để triển khai phiên bầu cử lên blockchain, bạn cần có khóa phiên. Hệ thống sẽ tự
                động lấy thông tin tài khoản và ví của bạn.
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
              {isLoading && status === DeploySessionStatus.GETTING_SESSION_KEY ? (
                <Loader className="animate-spin mr-2" size={18} />
              ) : (
                <Key className="mr-2" size={18} />
              )}
              {isLoading && status === DeploySessionStatus.GETTING_SESSION_KEY
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
                    <ClockIcon className="w-4 h-4 mr-2 text-blue-500 dark:text-[#4F8BFF]" />
                    {new Date(sessionKey.expiresAt * 1000).toLocaleString()}
                    <span className="ml-2 text-sm text-green-600 dark:text-green-400">
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

        {/* Tích hợp component ApproveHLU */}
        {sessionKey && (
          <div className="mb-8">
            <ApproveHLU
              scwAddress={scwAddress}
              sessionKey={sessionKey}
              onSuccess={handleApproveSuccess}
              onBalancesUpdated={handleBalancesUpdated}
              setIsLoading={handleApproveLoading}
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
                  status === DeploySessionStatus.FAILED
                    ? 'bg-gradient-to-r from-red-500 to-red-600'
                    : status === DeploySessionStatus.SUCCESS
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
                stepStatus={DeploySessionStatus.GETTING_SESSION_KEY}
                title="Lấy Khóa Phiên"
                description="Tạo hoặc lấy khóa phiên để ký giao dịch blockchain"
              />

              <StepStatus
                currentStatus={status}
                stepStatus={DeploySessionStatus.APPROVING_TOKENS}
                title="Phê Duyệt Token"
                description="Phê duyệt token HLU cho các hợp đồng blockchain"
              />

              <StepStatus
                currentStatus={status}
                stepStatus={DeploySessionStatus.PREPARING_DATA}
                title="Chuẩn Bị Dữ Liệu"
                description="Chuẩn bị dữ liệu phiên bầu cử để triển khai"
              />
            </div>

            <div className="space-y-4">
              <StepStatus
                currentStatus={status}
                stepStatus={DeploySessionStatus.SENDING_TRANSACTION}
                title="Gửi Giao Dịch"
                description="Gửi giao dịch đến mạng blockchain"
              />

              <StepStatus
                currentStatus={status}
                stepStatus={DeploySessionStatus.WAITING_CONFIRMATION}
                title="Chờ Xác Nhận"
                description="Đợi mạng blockchain xác nhận giao dịch"
              />

              {status === DeploySessionStatus.SUCCESS && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1 text-green-500">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-green-500">Triển Khai Thành Công</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Phiên bầu cử đã được triển khai thành công lên blockchain
                    </p>
                  </div>
                </div>
              )}

              {status === DeploySessionStatus.FAILED && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1 text-red-500">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-red-500">Triển Khai Thất Bại</h4>
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

              <div className="p-3 rounded-lg bg-white/50 dark:bg-[#1A2942]/30 border border-blue-100 dark:border-[#2A3A5A]/50">
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

              {status === DeploySessionStatus.SUCCESS && (
                <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-[#1A442A]/50 border border-green-200 dark:border-[#2A5A3A]/50 flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-700 dark:text-green-400 font-medium">
                      Phiên bầu cử đã được tạo thành công trên blockchain!
                    </p>
                    <p className="text-gray-600 dark:text-[#B0BEC5] text-sm mt-1">
                      Bạn có thể quay lại trang quản lý cuộc bầu cử để xem chi tiết.
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
            onClick={deploySession}
            disabled={
              isLoading ||
              !canDeploySession ||
              status === DeploySessionStatus.SUCCESS ||
              status === DeploySessionStatus.SENDING_TRANSACTION ||
              status === DeploySessionStatus.WAITING_CONFIRMATION
            }
            className="px-8 py-4 rounded-xl text-xl font-medium bg-gradient-to-r from-blue-500 to-purple-600 dark:from-[#0288D1] dark:to-[#6A1B9A] text-white hover:shadow-xl disabled:opacity-50 transition-all duration-300 flex items-center"
          >
            {isLoading ? (
              <Loader className="animate-spin mr-2" size={24} />
            ) : status === DeploySessionStatus.SUCCESS ? (
              <CheckCircle className="mr-2" size={24} />
            ) : (
              <Plus className="mr-2" size={24} />
            )}
            {isLoading
              ? 'Đang xử lý...'
              : status === DeploySessionStatus.SUCCESS
                ? 'Đã triển khai thành công'
                : 'Triển Khai Phiên Bầu Cử'}
          </button>
        </div>

        {/* Thông báo nếu không thể triển khai */}
        {!canDeploySession && (
          <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-[#332A1A]/80 border border-yellow-200 dark:border-[#FFB300]/30 text-yellow-800 dark:text-[#FFECB3]">
            <p className="flex items-start">
              <Info className="mr-2 flex-shrink-0 mt-1" size={18} />
              <span>
                {!electionAddress
                  ? 'Bạn cần nhập ID cuộc bầu cử từ database để lấy địa chỉ hợp đồng blockchain.'
                  : !sessionName
                    ? 'Vui lòng nhập tên phiên bầu cử.'
                    : !startDate || !endDate
                      ? 'Vui lòng nhập thời gian bắt đầu và kết thúc.'
                      : !sessionKey
                        ? 'Bạn cần lấy khóa phiên để ký giao dịch.'
                        : !hasRequiredAllowances
                          ? 'Bạn cần phê duyệt token HLU để triển khai phiên bầu cử.'
                          : 'Vui lòng kiểm tra lại thông tin trước khi triển khai.'}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleDeployBallotSession;
