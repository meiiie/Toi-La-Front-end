import React, { useState, useEffect, useCallback, useRef } from 'react';
import { parseUnits, SigningKey, Contract, JsonRpcProvider, Signature, formatEther } from 'ethers';
import { useToast } from '../../test/components/use-toast';
import apiClient from '../../api/apiClient';
import {
  AlertCircle,
  CheckCircle,
  Loader,
  ArrowRightCircle,
  Info,
  RefreshCw,
  Shield,
  ExternalLink,
  Wallet,
  Zap,
} from 'lucide-react';

interface SessionKeyInfo {
  sessionKey: string;
  expiresAt: number;
  scwAddress: string;
}

interface ApproveHLUProps {
  scwAddress: string;
  sessionKey: SessionKeyInfo | null;
  contractAddress?: string; // Thêm địa chỉ cuộc bầu cử
  onSuccess?: () => void;
  onBalancesUpdated?: (balances: {
    hluBalance: string;
    allowanceForFactory: string;
    allowanceForPaymaster: string;
    allowanceForElection?: string; // Thêm allowance cho cuộc bầu cử
  }) => void;
  setIsLoading?: (loading: boolean) => void;
  showMessage?: (message: string) => void;
  showError?: (message: string) => void;
}

interface ContractAddresses {
  entryPointAddress: string;
  factoryAddress: string;
  paymasterAddress: string;
  hluTokenAddress: string;
  chainId: number;
}

interface BalanceInfo {
  hluBalance: string;
  allowanceForFactory: string;
  allowanceForPaymaster: string;
  allowanceForElection?: string; // Thêm allowance cho cuộc bầu cử
}

enum ApproveStatus {
  NOT_STARTED = 0,
  CHECKING = 1,
  APPROVING_PAYMASTER = 2,
  APPROVING_FACTORY = 3,
  APPROVING_ELECTION = 4, // Thêm trạng thái approve cho cuộc bầu cử
  SUCCESS = 5, // Cập nhật con số
  FAILED = 6, // Cập nhật con số
}

const ApproveHLU: React.FC<ApproveHLUProps> = ({
  scwAddress,
  sessionKey,
  contractAddress, // Thêm địa chỉ cuộc bầu cử
  onSuccess,
  onBalancesUpdated,
  setIsLoading: setParentLoading,
  showMessage: parentShowMessage,
  showError: parentShowError,
}) => {
  // State
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses | null>(null);
  const [balances, setBalances] = useState<BalanceInfo>({
    hluBalance: '0',
    allowanceForFactory: '0',
    allowanceForPaymaster: '0',
    allowanceForElection: '0',
  });
  const [hasEnoughBalance, setHasEnoughBalance] = useState(false);
  const [hasFactoryAllowance, setHasFactoryAllowance] = useState(false);
  const [hasPaymasterAllowance, setHasPaymasterAllowance] = useState(false);
  const [hasElectionAllowance, setHasElectionAllowance] = useState(false); // Thêm trạng thái cho cuộc bầu cử
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState(ApproveStatus.NOT_STARTED);
  const [txHash, setTxHash] = useState('');
  const [userOpHash, setUserOpHash] = useState('');
  const [isInitialCheck, setIsInitialCheck] = useState(true); // Thêm state để tránh kiểm tra lặp lại

  // Flag để tránh lặp vô hạn
  const isCheckingRef = useRef(false);
  const isMounted = useRef(true);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Toast notification hook
  const { toast } = useToast();

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // Hàm hiển thị thông báo
  const showMessage = useCallback(
    (msg: string) => {
      if (!isMounted.current) return;
      setMessage(msg);
      console.log(msg);
      if (parentShowMessage) parentShowMessage(msg);
    },
    [parentShowMessage],
  );

  // Hàm hiển thị lỗi
  const showError = useCallback(
    (msg: string) => {
      if (!isMounted.current) return;
      setError(msg);
      console.error(msg);
      if (parentShowError) parentShowError(msg);

      // Show toast notification for errors
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: msg,
      });
    },
    [toast, parentShowError],
  );

  // Thiết lập isLoading - sửa để tránh vòng lặp vô hạn
  useEffect(() => {
    if (setParentLoading) {
      setParentLoading(isLoading);
    }
  }, [isLoading, setParentLoading]);

  // Lấy địa chỉ các contract
  const fetchContractAddresses = useCallback(async () => {
    try {
      if (contractAddresses) return contractAddresses; // Tránh gọi API nếu đã có dữ liệu

      setIsLoading(true);
      const response = await apiClient.get('/api/Blockchain/contract-addresses');
      if (response.data && response.data.success) {
        if (!isMounted.current) return null;
        setContractAddresses(response.data);
        showMessage('Đã lấy thông tin địa chỉ contract');
        return response.data;
      } else {
        throw new Error('Không thể lấy địa chỉ contract');
      }
    } catch (error) {
      showError('Lỗi khi lấy địa chỉ contract: ' + (error as Error).message);
      return null;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [showMessage, showError, contractAddresses]);

  // Kiểm tra số dư và allowances - sửa đổi để tránh vòng lặp vô hạn
  const checkBalancesAndAllowances = useCallback(async () => {
    // Ngăn không cho kiểm tra nhiều lần cùng lúc
    if (isCheckingRef.current) {
      return null;
    }

    if (!scwAddress) {
      showError('Không có địa chỉ ví thông minh (SCW)');
      return null;
    }

    try {
      isCheckingRef.current = true;
      setStatus(ApproveStatus.CHECKING);
      setIsLoading(true);

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

      // Khởi tạo balanceInfo
      const balanceInfo: BalanceInfo = {
        hluBalance: balanceResponse.data?.balance?.toString() || '0',
        allowanceForFactory: factoryAllowanceResponse.data?.allowance?.toString() || '0',
        allowanceForPaymaster: paymasterAllowanceResponse.data?.allowance?.toString() || '0',
      };

      // Kiểm tra allowance của địa chỉ cuộc bầu cử nếu có
      if (contractAddress) {
        try {
          const electionAllowanceResponse = await apiClient.get(
            `/api/Blockchain/check-contract-allowance?scwAddress=${scwAddress}&contractAddress=${contractAddress}`,
          );
          balanceInfo.allowanceForElection =
            electionAllowanceResponse.data?.allowance?.toString() || '0';
        } catch (error) {
          console.warn('Không thể kiểm tra allowance cho cuộc bầu cử:', error);
          balanceInfo.allowanceForElection = '0';
        }
      }

      if (!isMounted.current) return null;

      setBalances(balanceInfo);

      // Gọi callback để cập nhật balances ở component cha nếu có
      if (onBalancesUpdated) {
        onBalancesUpdated(balanceInfo);
      }

      const hasBalance = Number.parseFloat(balanceInfo.hluBalance) >= 5.0;
      const hasFactory = Number.parseFloat(balanceInfo.allowanceForFactory) >= 4.0;
      const hasPaymaster = Number.parseFloat(balanceInfo.allowanceForPaymaster) >= 1.0;
      const hasElection =
        !contractAddress || Number.parseFloat(balanceInfo.allowanceForElection || '0') >= 10.0;

      setHasEnoughBalance(hasBalance);
      setHasFactoryAllowance(hasFactory);
      setHasPaymasterAllowance(hasPaymaster);
      setHasElectionAllowance(hasElection);

      showMessage(
        `Số dư: ${balanceInfo.hluBalance} HLU, Factory: ${balanceInfo.allowanceForFactory}, Paymaster: ${balanceInfo.allowanceForPaymaster}${contractAddress ? `, Cuộc bầu cử: ${balanceInfo.allowanceForElection}` : ''}`,
      );

      // Kiểm tra nếu đủ tất cả điều kiện
      if (hasBalance && hasFactory && hasPaymaster && hasElection) {
        setStatus(ApproveStatus.SUCCESS);
        showMessage('Đã có đủ số dư và quyền truy cập token');

        // Gọi callback onSuccess nếu có
        if (onSuccess) {
          onSuccess();
        }

        // Show toast notification
        toast({
          title: 'Đã cấp quyền thành công',
          description: 'Số dư và quyền truy cập token đã đầy đủ',
          variant: 'default',
        });
      } else if (!hasBalance) {
        showError(`Số dư HLU không đủ. Cần ít nhất 5 HLU, hiện có ${balanceInfo.hluBalance} HLU`);
        setStatus(ApproveStatus.FAILED);
      } else {
        setStatus(ApproveStatus.NOT_STARTED);
      }

      return balanceInfo;
    } catch (error) {
      if (!isMounted.current) return null;
      showError('Lỗi khi kiểm tra số dư và quyền: ' + (error as Error).message);
      setStatus(ApproveStatus.FAILED);
      return null;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsInitialCheck(false); // Đánh dấu đã kiểm tra xong
        isCheckingRef.current = false; // Reset flag
      }
    }
  }, [scwAddress, contractAddress, showMessage, showError, toast, onBalancesUpdated, onSuccess]);

  // Kiểm tra trạng thái UserOperation
  const checkUserOpStatus = useCallback(
    async (hash: string) => {
      if (!hash) return false;

      try {
        const response = await apiClient.get(`/api/bundler/check-status?userOpHash=${hash}`);

        if (!isMounted.current) return false;

        if (response.data.status === 'success') {
          showMessage('Giao dịch đã được xác nhận thành công!');
          setTxHash(response.data.txHash || '');
          await checkBalancesAndAllowances();
          return true;
        } else if (response.data.status === 'failed') {
          showError(`Giao dịch thất bại: ${response.data.message || 'Không rõ lý do'}`);
          return false;
        } else if (response.data.status === 'pending') {
          showMessage('Giao dịch đang chờ xác nhận...');
          return false;
        }

        return false;
      } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái:', error);
        return false;
      }
    },
    [showMessage, showError, checkBalancesAndAllowances],
  );

  // Hàm approve token cho Paymaster, Factory, hoặc cuộc bầu cử - được tối ưu hóa
  // Sửa đổi hàm approveToken trong ApproveHLU.tsx
  const approveToken = useCallback(
    async (target: 'paymaster' | 'factory' | 'election') => {
      if (!sessionKey || !contractAddresses) {
        showError('Thiếu thông tin session key hoặc địa chỉ contract');
        return false;
      }

      // Xác định loại target và địa chỉ target
      let targetType: string;
      let targetAddress: string;
      let approveAmount: string;
      // Xác định xem có sử dụng paymaster hay không (chỉ factory và election sử dụng paymaster)
      const usePaymaster = target !== 'paymaster'; // QUAN TRỌNG: KHÔNG sử dụng paymaster khi approve cho paymaster

      switch (target) {
        case 'factory':
          targetType = 'Factory';
          targetAddress = contractAddresses.factoryAddress;
          approveAmount = '8'; // 8 HLU cho Factory
          break;
        case 'paymaster':
          targetType = 'Paymaster';
          targetAddress = contractAddresses.paymasterAddress;
          approveAmount = '10'; // 10 HLU cho Paymaster
          break;
        case 'election':
          if (!contractAddress) {
            showError('Thiếu địa chỉ cuộc bầu cử');
            return false;
          }
          targetType = 'Cuộc bầu cử';
          targetAddress = contractAddress;
          approveAmount = '20'; // 20 HLU cho cuộc bầu cử
          break;
        default:
          showError('Loại target không hợp lệ');
          return false;
      }

      try {
        setIsLoading(true);
        switch (target) {
          case 'factory':
            setStatus(ApproveStatus.APPROVING_FACTORY);
            break;
          case 'paymaster':
            setStatus(ApproveStatus.APPROVING_PAYMASTER);
            break;
          case 'election':
            setStatus(ApproveStatus.APPROVING_ELECTION);
            break;
        }

        showMessage(
          `Bắt đầu phê duyệt token cho ${targetType}${usePaymaster ? ' (sử dụng paymaster)' : ''}...`,
        );

        // Khởi tạo provider CHỈ ĐỂ LẤY DỮ LIỆU
        const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

        // Khởi tạo các contract cần thiết
        const hluTokenAbi = [
          'function approve(address spender, uint256 amount) public returns (bool)',
        ];
        const simpleAccountAbi = [
          'function execute(address dest, uint256 value, bytes calldata func) external',
        ];
        const entryPointAbi = [
          'function nonceNguoiGui(address) view returns (uint256)',
          'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
        ];

        const hluToken = new Contract(contractAddresses.hluTokenAddress, hluTokenAbi, provider);
        const simpleAccount = new Contract(scwAddress, simpleAccountAbi, provider);
        const entryPoint = new Contract(
          contractAddresses.entryPointAddress,
          entryPointAbi,
          provider,
        );

        // Lấy nonce hiện tại
        let nonce;
        try {
          nonce = await entryPoint.nonceNguoiGui(scwAddress);
        } catch (error) {
          console.error('Error fetching nonce:', error);
          throw new Error('Không thể lấy nonce từ EntryPoint');
        }
        console.log('Nonce hiện tại:', nonce.toString());

        // Tạo callData cho việc approve
        const approveCallData = hluToken.interface.encodeFunctionData('approve', [
          targetAddress,
          parseUnits(approveAmount, 18),
        ]);

        // Tạo callData cho việc execute
        const executeCallData = simpleAccount.interface.encodeFunctionData('execute', [
          contractAddresses.hluTokenAddress,
          0,
          approveCallData,
        ]);

        // Tạo userOperation - sử dụng cấu hình phù hợp dựa trên script approveHLU.js
        const userOp = {
          sender: scwAddress,
          nonce: nonce.toString(),
          initCode: '0x',
          callData: executeCallData,
          callGasLimit: '200000', // Theo script approveHLU.js
          verificationGasLimit: usePaymaster ? '250000' : '150000', // Tăng gas limit cho paymaster
          preVerificationGas: '50000',
          maxFeePerGas: parseUnits('5', 'gwei').toString(),
          maxPriorityFeePerGas: parseUnits('2', 'gwei').toString(),
          // Dựa theo script approveHLU.js, chỉ đơn giản là địa chỉ paymaster hoặc '0x'
          paymasterAndData: usePaymaster ? contractAddresses.paymasterAddress : '0x',
          signature: '0x',
        };

        // Lấy hash của userOperation
        let userOpHash;
        try {
          userOpHash = await entryPoint.layHashThaoTac(userOp);
        } catch (error) {
          console.error('Error getting userOpHash:', error);
          throw new Error('Không thể lấy userOpHash từ EntryPoint');
        }

        // Ký userOperation với session key
        const signingKey = new SigningKey(sessionKey.sessionKey);
        const signatureObj = signingKey.sign(userOpHash);
        userOp.signature = Signature.from({
          r: signatureObj.r,
          s: signatureObj.s,
          v: signatureObj.v,
        }).serialized;

        // Log toàn bộ userOp để debug
        console.log('UserOp được gửi:', JSON.stringify(userOp, null, 2));

        // Thay vì gửi trực tiếp, chúng ta sẽ dùng API bundler
        showMessage(`Đang gửi giao dịch approve cho ${targetType} qua bundler API...`);

        // Gửi userOp đến API endpoint
        const bundlerResponse = await apiClient.post('/api/bundler/submit', {
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

        if (!isMounted.current) return false;

        if (
          bundlerResponse.data &&
          (bundlerResponse.data.UserOpHash || bundlerResponse.data.userOpHash)
        ) {
          const hash =
            bundlerResponse.data.UserOpHash || bundlerResponse.data.userOpHash || userOpHash;
          setUserOpHash(hash);
          showMessage(`Giao dịch đã gửi với UserOpHash: ${hash}`);

          // Đợi xác nhận
          let confirmed = false;
          let attempts = 0;
          const maxAttempts = 10;

          while (!confirmed && attempts < maxAttempts && isMounted.current) {
            await new Promise((resolve) => setTimeout(resolve, 3000)); // đợi 3 giây
            attempts++;

            confirmed = await checkUserOpStatus(hash);

            if (confirmed) {
              showMessage(`Approve ${targetType} thành công!`);

              // Show toast notification
              toast({
                title: 'Phê duyệt thành công',
                description: `Đã phê duyệt token cho ${targetType}`,
                variant: 'default',
              });

              return true;
            }
          }

          if (!confirmed && isMounted.current) {
            showMessage(
              `Giao dịch đang chờ xử lý, bạn có thể kiểm tra sau trên blockchain explorer.`,
            );
          }

          return true;
        } else {
          throw new Error(
            `Không nhận được phản hồi từ bundler API: ${JSON.stringify(bundlerResponse.data)}`,
          );
        }
      } catch (error) {
        if (!isMounted.current) return false;
        console.error(`Lỗi khi approve token cho ${targetType}:`, error);
        showError(`Lỗi khi approve token cho ${targetType}: ` + (error as Error).message);
        setStatus(ApproveStatus.FAILED);
        return false;
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    [
      sessionKey,
      contractAddresses,
      scwAddress,
      contractAddress,
      showMessage,
      showError,
      toast,
      checkUserOpStatus,
    ],
  );

  // Hàm approve cho Paymaster
  const approvePaymaster = useCallback(async () => {
    return approveToken('paymaster');
  }, [approveToken]);

  // Hàm approve cho Factory
  const approveFactory = useCallback(async () => {
    return approveToken('factory');
  }, [approveToken]);

  // Hàm approve cho cuộc bầu cử
  const approveElection = useCallback(async () => {
    return approveToken('election');
  }, [approveToken]);

  // Lấy địa chỉ contract khi component mount - sửa để tránh vòng lặp nhiều lần
  useEffect(() => {
    if (!contractAddresses && !isLoading) {
      fetchContractAddresses();
    }
  }, [contractAddresses, fetchContractAddresses, isLoading]);

  // Kiểm tra số dư và allowances khi địa chỉ SCW hoặc contract thay đổi - sửa để tránh vòng lặp
  useEffect(() => {
    // Chỉ kiểm tra khi có đủ điều kiện và khi là lần kiểm tra đầu tiên
    if (scwAddress && contractAddresses && isInitialCheck && !isCheckingRef.current) {
      // Sử dụng timeout để tránh nhiều kiểm tra liên tiếp
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      checkTimeoutRef.current = setTimeout(() => {
        checkBalancesAndAllowances();
      }, 100);
    }
  }, [scwAddress, contractAddresses, isInitialCheck, checkBalancesAndAllowances]);

  // Render UI với cải tiến cho UX
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#162A45]/50 backdrop-blur-md border border-gray-200 dark:border-[#2A3A5A] shadow-lg dark:shadow-[0_0_50px_rgba(79,139,255,0.15)]">
      <div className="flex items-center mb-4">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A] mr-3">
          <Shield className="h-6 w-6 text-blue-500 dark:text-[#4F8BFF]" />
        </div>
        <h2 className="text-xl font-medium text-gray-800 dark:text-white">Phê Duyệt Token HLU</h2>
      </div>

      {/* Thông báo hướng dẫn */}
      <div className="p-4 mb-6 rounded-lg bg-blue-50 dark:bg-[#1A2942]/80 border border-blue-200 dark:border-[#4F8BFF]/30 text-blue-800 dark:text-[#E1F5FE]">
        <p className="flex items-start">
          <Info className="mr-2 flex-shrink-0 mt-1" size={18} />
          <span>
            Để triển khai cuộc bầu cử lên blockchain, bạn cần phê duyệt quyền sử dụng token HLU:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Cần ít nhất <strong>5 HLU</strong> trong ví
              </li>
              <li>
                Cần phê duyệt <strong>ít nhất 4 HLU</strong> cho Factory
              </li>
              <li>
                Cần phê duyệt <strong>ít nhất 1 HLU</strong> cho Paymaster
              </li>
              {contractAddress && (
                <li>
                  Cần phê duyệt <strong>ít nhất 10 HLU</strong> cho Cuộc bầu cử
                </li>
              )}
            </ul>
          </span>
        </p>
      </div>

      {/* Thông tin số dư và allowance */}
      <div
        className={`grid grid-cols-1 ${contractAddress ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 mb-6`}
      >
        <div
          className={`p-4 rounded-lg border ${hasEnoughBalance ? 'bg-green-50 dark:bg-[#1A442A]/50 border-green-200 dark:border-[#2A5A3A]/50' : 'bg-red-50 dark:bg-[#421A1A]/50 border-red-200 dark:border-[#5A2A2A]/50'}`}
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Số dư HLU</p>
          <p
            className={`text-lg font-medium ${hasEnoughBalance ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}
          >
            {balances.hluBalance} HLU
          </p>
          {!hasEnoughBalance && (
            <p className="text-red-600 dark:text-red-400 text-xs mt-1">
              Cần ít nhất 5 HLU để triển khai
            </p>
          )}
        </div>

        <div
          className={`p-4 rounded-lg border ${hasFactoryAllowance ? 'bg-green-50 dark:bg-[#1A442A]/50 border-green-200 dark:border-[#2A5A3A]/50' : 'bg-yellow-50 dark:bg-[#333A1A]/50 border-yellow-200 dark:border-[#5A5A2A]/50'}`}
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Factory Allowance</p>
          <p
            className={`text-lg font-medium ${hasFactoryAllowance ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'}`}
          >
            {balances.allowanceForFactory} HLU
          </p>
          {!hasFactoryAllowance && (
            <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">Cần ít nhất 4 HLU</p>
          )}
        </div>

        <div
          className={`p-4 rounded-lg border ${hasPaymasterAllowance ? 'bg-green-50 dark:bg-[#1A442A]/50 border-green-200 dark:border-[#2A5A3A]/50' : 'bg-yellow-50 dark:bg-[#333A1A]/50 border-yellow-200 dark:border-[#5A5A2A]/50'}`}
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Paymaster Allowance</p>
          <p
            className={`text-lg font-medium ${hasPaymasterAllowance ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'}`}
          >
            {balances.allowanceForPaymaster} HLU
          </p>
          {!hasPaymasterAllowance && (
            <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">Cần ít nhất 1 HLU</p>
          )}
        </div>

        {/* Thêm thông tin allowance cho cuộc bầu cử nếu có */}
        {contractAddress && (
          <div
            className={`p-4 rounded-lg border ${hasElectionAllowance ? 'bg-green-50 dark:bg-[#1A442A]/50 border-green-200 dark:border-[#2A5A3A]/50' : 'bg-yellow-50 dark:bg-[#333A1A]/50 border-yellow-200 dark:border-[#5A5A2A]/50'}`}
          >
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Cuộc Bầu Cử Allowance</p>
            <p
              className={`text-lg font-medium ${hasElectionAllowance ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'}`}
            >
              {balances.allowanceForElection || '0'} HLU
            </p>
            {!hasElectionAllowance && (
              <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                Cần ít nhất 10 HLU
              </p>
            )}
          </div>
        )}
      </div>

      {/* Địa chỉ cuộc bầu cử nếu có */}
      {contractAddress && (
        <div className="p-4 mb-6 rounded-lg bg-gray-50 dark:bg-[#1A2942]/20 border border-gray-200 dark:border-[#2A3A5A]/50">
          <h3 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center">
            <Wallet className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
            Thông tin cuộc bầu cử
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
            Địa chỉ contract cuộc bầu cử:
          </p>
          <p className="font-mono text-sm text-gray-800 dark:text-gray-200 truncate">
            {contractAddress}
          </p>
        </div>
      )}

      {/* Nút Refresh */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            if (!isCheckingRef.current) {
              checkBalancesAndAllowances();
            }
          }}
          disabled={isLoading || isCheckingRef.current}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 dark:bg-[#1A2942]/50 border border-blue-100 dark:border-[#2A3A5A] text-blue-700 dark:text-[#4F8BFF] hover:bg-blue-100 dark:hover:bg-[#1A2942] disabled:opacity-50 flex items-center"
        >
          {isLoading && status === ApproveStatus.CHECKING ? (
            <Loader className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {isLoading && status === ApproveStatus.CHECKING ? 'Đang kiểm tra...' : 'Làm mới'}
        </button>
      </div>

      {/* Nút Approve */}
      <div className="flex flex-col space-y-4">
        {/* Approve Paymaster */}
        {!hasPaymasterAllowance && hasEnoughBalance && (
          <button
            onClick={approvePaymaster}
            disabled={isLoading || !sessionKey}
            className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-blue-600 dark:from-[#0288D1] dark:to-[#0277BD] text-white hover:shadow-lg hover:shadow-blue-300/30 dark:hover:shadow-[#4F8BFF]/20 disabled:opacity-50 transition-all duration-300 flex items-center justify-center"
          >
            {isLoading && status === ApproveStatus.APPROVING_PAYMASTER ? (
              <Loader className="animate-spin mr-2" size={18} />
            ) : (
              <ArrowRightCircle className="mr-2" size={18} />
            )}
            {isLoading && status === ApproveStatus.APPROVING_PAYMASTER
              ? 'Đang phê duyệt cho Paymaster...'
              : 'Phê duyệt cho Paymaster'}
          </button>
        )}

        {/* Approve Factory */}
        {!hasFactoryAllowance && hasEnoughBalance && hasPaymasterAllowance && (
          <button
            onClick={approveFactory}
            disabled={isLoading || !sessionKey}
            className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-purple-500 to-purple-600 dark:from-[#7B1FA2] dark:to-[#6A1B9A] text-white hover:shadow-lg hover:shadow-purple-300/30 dark:hover:shadow-[#6A1B9A]/20 disabled:opacity-50 transition-all duration-300 flex items-center justify-center"
          >
            {isLoading && status === ApproveStatus.APPROVING_FACTORY ? (
              <Loader className="animate-spin mr-2" size={18} />
            ) : (
              <ArrowRightCircle className="mr-2" size={18} />
            )}
            {isLoading && status === ApproveStatus.APPROVING_FACTORY
              ? 'Đang phê duyệt cho Factory...'
              : 'Phê duyệt cho Factory'}
          </button>
        )}

        {/* Approve cuộc bầu cử */}
        {contractAddress &&
          !hasElectionAllowance &&
          hasEnoughBalance &&
          hasFactoryAllowance &&
          hasPaymasterAllowance && (
            <button
              onClick={approveElection}
              disabled={isLoading || !sessionKey}
              className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-green-500 to-green-600 dark:from-[#2E7D32] dark:to-[#1B5E20] text-white hover:shadow-lg hover:shadow-green-300/30 dark:hover:shadow-[#1B5E20]/20 disabled:opacity-50 transition-all duration-300 flex items-center justify-center"
            >
              {isLoading && status === ApproveStatus.APPROVING_ELECTION ? (
                <Loader className="animate-spin mr-2" size={18} />
              ) : (
                <Zap className="mr-2" size={18} />
              )}
              {isLoading && status === ApproveStatus.APPROVING_ELECTION
                ? 'Đang phê duyệt cho Cuộc bầu cử...'
                : 'Phê duyệt cho Cuộc bầu cử'}
            </button>
          )}

        {/* Trạng thái thành công */}
        {hasEnoughBalance &&
          hasFactoryAllowance &&
          hasPaymasterAllowance &&
          (!contractAddress || hasElectionAllowance) && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-[#1A442A]/50 border border-green-200 dark:border-[#2A5A3A]/50 flex items-start">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-700 dark:text-green-400 font-medium">
                  Đã phê duyệt đầy đủ token!
                </p>
                <p className="text-gray-600 dark:text-[#B0BEC5] text-sm mt-1">
                  Tất cả điều kiện đã đáp ứng, bạn có thể tiếp tục triển khai cuộc bầu cử.
                </p>
              </div>
            </div>
          )}

        {/* Không đủ số dư */}
        {!hasEnoughBalance && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-[#421A1A]/50 border border-red-200 dark:border-[#5A2A2A]/50 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 dark:text-red-400 font-medium">Không đủ số dư HLU</p>
              <p className="text-gray-600 dark:text-[#B0BEC5] text-sm mt-1">
                Vui lòng liên hệ quản trị viên để được cấp thêm token HLU vào ví của bạn.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hiển thị hash giao dịch gần nhất */}
      {(txHash || userOpHash) && (
        <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-[#1A2942]/30 border border-gray-200 dark:border-[#2A3A5A]/50">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
            Thông tin giao dịch gần nhất
          </p>
          {txHash && (
            <div className="mb-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Mã giao dịch (TxHash):</p>
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
          )}
          {userOpHash && !txHash && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">UserOpHash:</p>
              <div className="flex items-center">
                <p className="font-mono text-sm text-gray-800 dark:text-gray-200 truncate">
                  {userOpHash}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Thông báo lỗi */}
      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-[#421A1A]/80 border border-red-200 dark:border-[#F44336]/30 text-red-800 dark:text-[#FFCDD2]">
          <p className="flex items-start">
            <AlertCircle className="mr-2 flex-shrink-0 mt-1" size={18} />
            <span>{error}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ApproveHLU;
