import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  SigningKey,
  AbiCoder,
  Contract,
  JsonRpcProvider,
  Signature,
  ethers,
  parseUnits,
} from 'ethers';

// Components
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alter';
import { Progress } from '../ui/Progress';
import { useToast } from '../../test/components/use-toast';

// Custom Blockchain Components
import BlockchainStatusDisplay from './blockchain-status-display';

// Icons
import {
  Shield,
  CheckCircle,
  AlertCircle,
  Loader,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Key,
  Zap,
  Database,
  Lock,
  Coins,
  ArrowRightCircle,
} from 'lucide-react';

// API
import apiClient from '../../api/apiClient';

// Types
import type { RootState } from '../../store/store';

// Status enum for each workflow step
enum StepStatus {
  PENDING = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  FAILED = 3,
  SKIPPED = 4,
}

// Election workflow steps
enum WorkflowStep {
  CHECK_BANTOCHUC_ROLE = 0,
  GRANT_BANTOCHUC_ROLE = 1,
  START_ELECTION = 2,
  APPROVE_HLU_TOKEN = 3,
  CREATE_BALLOT_SESSION = 4,
  DEPLOY_BALLOT_SESSION = 5,
  ADD_VOTERS = 6,
  ADD_CANDIDATES = 7,
  START_BALLOT_SESSION = 8,
  ISSUE_BALLOTS = 9,
}

interface SessionKeyInfo {
  sessionKey: string;
  expiresAt: number;
  scwAddress: string;
}

interface ElectionWorkflowManagerProps {
  phienBauCu: any;
  cuocBauCu: any;
  sessionKey: SessionKeyInfo | null;
  cuTris: any[];
  ungViens: any[];
  onSessionKeyGenerated?: (sessionKey: SessionKeyInfo) => void;
  onRefreshData?: () => void;
}

interface ContractAddresses {
  entryPointAddress: string;
  factoryAddress: string;
  paymasterAddress: string;
  hluTokenAddress: string;
  chainId: number;
}

const ElectionWorkflowManager: React.FC<ElectionWorkflowManagerProps> = ({
  phienBauCu,
  cuocBauCu,
  sessionKey,
  cuTris,
  ungViens,
  onSessionKeyGenerated,
  onRefreshData,
}) => {
  // Hooks
  const { toast } = useToast();

  // Redux state
  const userInfo = useSelector((state: RootState) => state.dangNhapTaiKhoan?.taiKhoan);
  const walletInfo = useSelector((state: RootState) => state.viBlockchain?.data);

  // Local state
  const [taiKhoanId, setTaiKhoanId] = useState<string>('');
  const [viId, setViId] = useState<string>('');
  const [scwAddress, setScwAddress] = useState<string>('');
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses | null>(null);
  const [stepStatuses, setStepStatuses] = useState<Record<WorkflowStep, StepStatus>>({
    [WorkflowStep.CHECK_BANTOCHUC_ROLE]: StepStatus.PENDING,
    [WorkflowStep.GRANT_BANTOCHUC_ROLE]: StepStatus.PENDING,
    [WorkflowStep.START_ELECTION]: StepStatus.PENDING,
    [WorkflowStep.APPROVE_HLU_TOKEN]: StepStatus.PENDING,
    [WorkflowStep.CREATE_BALLOT_SESSION]: StepStatus.PENDING,
    [WorkflowStep.DEPLOY_BALLOT_SESSION]: StepStatus.PENDING,
    [WorkflowStep.ADD_VOTERS]: StepStatus.PENDING,
    [WorkflowStep.ADD_CANDIDATES]: StepStatus.PENDING,
    [WorkflowStep.START_BALLOT_SESSION]: StepStatus.PENDING,
    [WorkflowStep.ISSUE_BALLOTS]: StepStatus.PENDING,
  });
  const [activeStep, setActiveStep] = useState<WorkflowStep>(WorkflowStep.CHECK_BANTOCHUC_ROLE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [electionInfo, setElectionInfo] = useState<any>(null);
  const [bantochucRoleCheck, setBantochucRoleCheck] = useState<{
    hasRole: boolean;
    checked: boolean;
  }>({ hasRole: false, checked: false });
  const [electionStarted, setElectionStarted] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>('');
  const [workflowProgress, setWorkflowProgress] = useState<number>(0);
  const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(false);
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

  // State cho trạng thái approve token riêng biệt
  enum ApproveTargetType {
    FACTORY,
    PAYMASTER,
    ELECTION,
  }
  const [approvingTarget, setApprovingTarget] = useState<ApproveTargetType | null>(null);
  const [userOpHash, setUserOpHash] = useState<string>('');

  // State cho trạng thái HLU token - bổ sung allowanceForElection
  const [hluTokenStatus, setHluTokenStatus] = useState<{
    isChecking: boolean;
    hluBalance: string;
    allowanceForFactory: string;
    allowanceForPaymaster: string;
    allowanceForElection: string;
    hasEnoughBalance: boolean;
    hasFactoryAllowance: boolean;
    hasPaymasterAllowance: boolean;
    hasElectionAllowance: boolean;
    isApproved: boolean;
    lastCheckedAt: number;
  }>({
    isChecking: false,
    hluBalance: '0',
    allowanceForFactory: '0',
    allowanceForPaymaster: '0',
    allowanceForElection: '0',
    hasEnoughBalance: false,
    hasFactoryAllowance: false,
    hasPaymasterAllowance: false,
    hasElectionAllowance: false,
    isApproved: false,
    lastCheckedAt: 0,
  });

  // Refs
  const initialCheckPerformed = useRef(false);
  const isMounted = useRef(true);
  const isCheckingRef = useRef(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Helper functions for showing messages
  const showMessage = useCallback((msg: string) => {
    if (!isMounted.current) return;
    setMessage(msg);
    console.log(msg);
  }, []);

  const showError = useCallback(
    (msg: string) => {
      if (!isMounted.current) return;
      setErrorMessage(msg);
      console.error(msg);

      // Hiển thị toast khi có lỗi
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: msg,
      });
    },
    [toast],
  );

  // 2. Fetch contract addresses
  const fetchContractAddresses = useCallback(async () => {
    try {
      // Nếu đã có contract addresses, không cần gọi API lại
      if (contractAddresses) {
        return contractAddresses;
      }

      showMessage('Đang lấy thông tin địa chỉ contract...');
      const response = await apiClient.get('/api/Blockchain/contract-addresses');
      if (response.data && response.data.success) {
        if (!isMounted.current) return null;
        setContractAddresses(response.data);
        showMessage('Đã lấy thông tin địa chỉ contract thành công');
        return response.data;
      } else {
        throw new Error('Không thể lấy địa chỉ contract');
      }
    } catch (error) {
      showError('Lỗi khi lấy địa chỉ contract: ' + (error as Error).message);
      return null;
    }
  }, [showMessage, showError, contractAddresses]);

  // 3. Sign UserOperation with session key
  const signUserOp = useCallback((userOpHash: string, sessionKeyPrivate: string): string => {
    try {
      // Convert userOpHash to bytes
      const userOpHashBytes = ethers.getBytes(userOpHash);

      // Use SigningKey to sign
      const signingKey = new SigningKey(sessionKeyPrivate);
      const signatureObj = signingKey.sign(userOpHashBytes);

      // Create signature according to ethers v6 standard
      const signature = Signature.from({
        r: signatureObj.r,
        s: signatureObj.s,
        v: signatureObj.v,
      }).serialized;

      return signature;
    } catch (error) {
      console.error('Error signing UserOperation:', error);
      throw error;
    }
  }, []);

  // 4. Update workflow progress
  const updateWorkflowProgress = useCallback(() => {
    if (!isMounted.current) return;

    const steps = Object.keys(stepStatuses).length;
    const completedSteps = Object.values(stepStatuses).filter(
      (status) => status === StepStatus.COMPLETED || status === StepStatus.SKIPPED,
    ).length;

    const progress = Math.floor((completedSteps / steps) * 100);
    setWorkflowProgress(progress);
  }, [stepStatuses]);

  // 5. Kiểm tra HLU token balances và allowances
  const checkHluTokenStatus = useCallback(
    async (forceUpdate = false) => {
      // Tránh kiểm tra nhiều lần đồng thời hoặc quá thường xuyên
      if (isCheckingRef.current) return false;

      // Kiểm tra xem đã kiểm tra gần đây chưa, trừ khi được buộc cập nhật
      const now = Date.now();
      if (!forceUpdate && now - hluTokenStatus.lastCheckedAt < 5000) {
        return false;
      }

      if (!scwAddress) {
        showError('Địa chỉ ví thông minh (SCW) chưa được thiết lập');
        return false;
      }

      if (!cuocBauCu?.blockchainAddress) {
        showError('Cuộc bầu cử chưa có địa chỉ blockchain hợp lệ');
        return false;
      }

      try {
        // Đánh dấu đang kiểm tra
        isCheckingRef.current = true;

        setStepStatuses((prev) => ({
          ...prev,
          [WorkflowStep.APPROVE_HLU_TOKEN]: StepStatus.IN_PROGRESS,
        }));
        setHluTokenStatus((prev) => ({ ...prev, isChecking: true }));
        showMessage('Đang kiểm tra số dư và quyền HLU token...');

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

        // Lấy allowance cho địa chỉ cuộc bầu cử
        let electionAllowanceResponse;
        try {
          electionAllowanceResponse = await apiClient.get(
            `/api/Blockchain/check-contract-allowance?scwAddress=${scwAddress}&contractAddress=${cuocBauCu.blockchainAddress}`,
          );
        } catch (error) {
          console.warn('Không thể kiểm tra allowance cho cuộc bầu cử:', error);
        }

        if (!isMounted.current) {
          isCheckingRef.current = false;
          return false;
        }

        const hluBalance = balanceResponse.data?.balance?.toString() || '0';
        const allowanceForFactory = factoryAllowanceResponse.data?.allowance?.toString() || '0';
        const allowanceForPaymaster = paymasterAllowanceResponse.data?.allowance?.toString() || '0';
        const allowanceForElection = electionAllowanceResponse?.data?.allowance?.toString() || '0';

        // Các giá trị ngưỡng
        const hasEnoughBalance = Number.parseFloat(hluBalance) >= 5.0;
        const hasFactoryAllowance = Number.parseFloat(allowanceForFactory) >= 4.0;
        const hasPaymasterAllowance = Number.parseFloat(allowanceForPaymaster) >= 1.0;
        const hasElectionAllowance = Number.parseFloat(allowanceForElection) >= 10.0;

        const isApproved =
          hasEnoughBalance && hasFactoryAllowance && hasPaymasterAllowance && hasElectionAllowance;

        // Cập nhật state một lần duy nhất để tránh re-render nhiều lần
        const updatedTokenStatus = {
          isChecking: false,
          hluBalance,
          allowanceForFactory,
          allowanceForPaymaster,
          allowanceForElection,
          hasEnoughBalance,
          hasFactoryAllowance,
          hasPaymasterAllowance,
          hasElectionAllowance,
          isApproved,
          lastCheckedAt: now,
        };

        setHluTokenStatus(updatedTokenStatus);

        // Log chi tiết để debug
        console.log('HLU Token Status:', updatedTokenStatus);

        if (isApproved) {
          showMessage(`Đã có đủ số dư (${hluBalance} HLU) và quyền sử dụng token HLU`);
          setStepStatuses((prev) => ({
            ...prev,
            [WorkflowStep.APPROVE_HLU_TOKEN]: StepStatus.COMPLETED,
          }));
          setActiveStep(WorkflowStep.CREATE_BALLOT_SESSION);
        } else {
          showMessage(`Cần phê duyệt token HLU để tiếp tục. Số dư hiện tại: ${hluBalance} HLU`);
          setStepStatuses((prev) => ({
            ...prev,
            [WorkflowStep.APPROVE_HLU_TOKEN]: StepStatus.PENDING,
          }));
          setActiveStep(WorkflowStep.APPROVE_HLU_TOKEN);
        }

        // Cập nhật tiến trình workflow
        updateWorkflowProgress();
        return isApproved;
      } catch (error) {
        if (!isMounted.current) return false;

        showError('Lỗi khi kiểm tra token HLU: ' + (error as Error).message);
        setStepStatuses((prev) => ({
          ...prev,
          [WorkflowStep.APPROVE_HLU_TOKEN]: StepStatus.FAILED,
        }));
        setHluTokenStatus((prev) => ({
          ...prev,
          isChecking: false,
          lastCheckedAt: now,
        }));
        return false;
      } finally {
        if (isMounted.current) {
          isCheckingRef.current = false;
        }
      }
    },
    [
      scwAddress,
      showMessage,
      showError,
      updateWorkflowProgress,
      hluTokenStatus.lastCheckedAt,
      cuocBauCu?.blockchainAddress,
    ],
  );

  // 5. Kiểm tra UserOp status
  const checkUserOpStatus = useCallback(
    async (hash: string, waitForSuccess = false) => {
      if (!hash) return false;

      try {
        const response = await apiClient.get(`/api/bundler/check-status?userOpHash=${hash}`);

        if (!isMounted.current) return false;

        if (response.data.status === 'success') {
          showMessage('Giao dịch đã được xác nhận thành công!');
          setTxHash(response.data.txHash || '');

          // Đợi một chút và kiểm tra lại trạng thái token
          if (waitForSuccess) {
            setTimeout(() => {
              if (isMounted.current && !isCheckingRef.current) {
                checkHluTokenStatus();
              }
            }, 2000);
          }

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
    [showMessage, showError, checkHluTokenStatus],
  );

  // 6. Check if SCW has BANTOCHUC role
  const checkBantochucRole = useCallback(async () => {
    if (!isMounted.current) return false;

    if (!cuocBauCu?.blockchainAddress) {
      showError('Cuộc bầu cử chưa được triển khai lên blockchain');
      return false;
    }

    if (!scwAddress) {
      showError('Địa chỉ ví thông minh (SCW) chưa được thiết lập');
      return false;
    }

    // Đã kiểm tra thì không kiểm tra lại
    if (isCheckingPermission) {
      return false;
    }

    try {
      setStepStatuses((prev) => ({
        ...prev,
        [WorkflowStep.CHECK_BANTOCHUC_ROLE]: StepStatus.IN_PROGRESS,
      }));
      setActiveStep(WorkflowStep.CHECK_BANTOCHUC_ROLE);
      setIsLoading(true);
      setIsCheckingPermission(true);
      showMessage('Đang kiểm tra quyền BANTOCHUC...');

      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // Kết nối tới contract QuanLyCuocBauCu
      const quanLyCuocBauCuAbi = [
        'function hasRole(bytes32 role, address account) view returns (bool)',
        'function layThongTinCoBan(uint256 idCuocBauCu) view returns (address, bool, uint256, uint256, string, uint256)',
      ];

      const contract = new Contract(cuocBauCu.blockchainAddress, quanLyCuocBauCuAbi, provider);

      // Kiểm tra chủ sở hữu của cuộc bầu cử
      const baseInfo = await contract.layThongTinCoBan(1);
      const owner = baseInfo[0];
      const isOwner = owner.toLowerCase() === scwAddress.toLowerCase();

      // Tạo BANTOCHUC role hash
      const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes('BANTOCHUC'));

      // Kiểm tra quyền BANTOCHUC
      const hasRole = await contract.hasRole(BANTOCHUC, scwAddress);

      if (!isMounted.current) return false;

      // Cập nhật trạng thái theo từng bước để tránh re-render
      if (hasRole) {
        showMessage('SCW đã có quyền BANTOCHUC');
        setStepStatuses((prev) => ({
          ...prev,
          [WorkflowStep.CHECK_BANTOCHUC_ROLE]: StepStatus.COMPLETED,
          [WorkflowStep.GRANT_BANTOCHUC_ROLE]: StepStatus.SKIPPED,
        }));
        setActiveStep(WorkflowStep.START_ELECTION);
      } else {
        showMessage('SCW chưa có quyền BANTOCHUC');
        setStepStatuses((prev) => ({
          ...prev,
          [WorkflowStep.CHECK_BANTOCHUC_ROLE]: StepStatus.COMPLETED,
          [WorkflowStep.GRANT_BANTOCHUC_ROLE]: StepStatus.PENDING,
        }));
        setActiveStep(WorkflowStep.GRANT_BANTOCHUC_ROLE);
      }

      // Sử dụng functional update để tránh dependency
      setElectionInfo(() => ({
        owner,
        isOwner,
        hasRole,
        dangHoatDong: baseInfo[1],
      }));

      // Các cập nhật state khác
      setBantochucRoleCheck({
        hasRole,
        checked: true,
      });

      // Kiểm tra nếu cuộc bầu cử đã bắt đầu
      setElectionStarted(baseInfo[1]);

      // Update election status
      setElectionStatus({
        owner,
        isOwner,
        isActive: baseInfo[1],
        hasBanToChucRole: hasRole,
      });

      // Cập nhật tiến trình workflow
      updateWorkflowProgress();

      return hasRole;
    } catch (error) {
      if (!isMounted.current) return false;

      showError('Lỗi khi kiểm tra quyền BANTOCHUC: ' + (error as Error).message);
      setStepStatuses((prev) => ({
        ...prev,
        [WorkflowStep.CHECK_BANTOCHUC_ROLE]: StepStatus.FAILED,
      }));
      return false;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsCheckingPermission(false);
      }
    }
  }, [cuocBauCu, scwAddress, showMessage, showError, updateWorkflowProgress, isCheckingPermission]);

  // 7. Grant BANTOCHUC role to SCW
  const grantBanToChucRole = useCallback(async () => {
    // Kiểm tra chi tiết các thông tin cần thiết
    if (!cuocBauCu) {
      showError('Thông tin cuộc bầu cử không có sẵn');
      return false;
    }

    if (!cuocBauCu.blockchainAddress) {
      showError('Địa chỉ blockchain của cuộc bầu cử chưa được thiết lập');
      return false;
    }

    if (!scwAddress) {
      showError('Địa chỉ ví thông minh (SCW) chưa được thiết lập');
      return false;
    }

    if (!sessionKey) {
      showError('Khóa phiên (session key) chưa được tạo');
      return false;
    }

    // Lấy địa chỉ contract nếu chưa có
    let addresses = contractAddresses;
    if (!addresses) {
      try {
        addresses = await fetchContractAddresses();
        if (!addresses) {
          showError('Không thể lấy địa chỉ contract');
          return false;
        }
      } catch (error) {
        showError('Lỗi khi lấy địa chỉ contract: ' + (error as Error).message);
        return false;
      }
    }

    try {
      setStepStatuses((prev) => ({
        ...prev,
        [WorkflowStep.GRANT_BANTOCHUC_ROLE]: StepStatus.IN_PROGRESS,
      }));
      setIsLoading(true);
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

      const entryPoint = new Contract(addresses.entryPointAddress, entryPointAbi, provider);

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
        addresses.paymasterAddress,
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
      const signature = signUserOp(userOpHash, sessionKey.sessionKey);
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
          if (!isMounted.current) {
            clearInterval(checkInterval);
            return;
          }

          const statusResponse = await apiClient.get(
            `/api/bundler/check-status?userOpHash=${response.data.userOpHash}`,
          );

          if (statusResponse.data && statusResponse.data.status === 'success') {
            clearInterval(checkInterval);

            // Kiểm tra lại quyền BANTOCHUC
            const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes('BANTOCHUC'));
            const hasRole = await quanLyCuocBauCu.hasRole(BANTOCHUC, scwAddress);

            if (!isMounted.current) return;

            if (hasRole) {
              showMessage('Đã cấp quyền BANTOCHUC thành công');
              setBantochucRoleCheck({ hasRole: true, checked: true });
              setStepStatuses((prev) => ({
                ...prev,
                [WorkflowStep.GRANT_BANTOCHUC_ROLE]: StepStatus.COMPLETED,
              }));
              setActiveStep(WorkflowStep.START_ELECTION);
              updateWorkflowProgress();

              // Update election status
              setElectionStatus((prev) => ({
                ...prev,
                hasBanToChucRole: true,
              }));

              // Hiển thị toast thành công
              toast({
                title: 'Thành công',
                description: 'Đã cấp quyền BANTOCHUC thành công',
              });

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
      setStepStatuses((prev) => ({
        ...prev,
        [WorkflowStep.GRANT_BANTOCHUC_ROLE]: StepStatus.FAILED,
      }));
      return false;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [
    cuocBauCu,
    scwAddress,
    sessionKey,
    contractAddresses,
    fetchContractAddresses,
    signUserOp,
    showMessage,
    showError,
    updateWorkflowProgress,
    toast,
  ]);

  // 8. Start election
  const startElection = useCallback(async () => {
    if (!cuocBauCu?.blockchainAddress || !scwAddress || !sessionKey || !contractAddresses) {
      showError('Thiếu thông tin cần thiết để bắt đầu cuộc bầu cử');
      return false;
    }

    try {
      setStepStatuses((prev) => ({
        ...prev,
        [WorkflowStep.START_ELECTION]: StepStatus.IN_PROGRESS,
      }));
      setIsLoading(true);
      showMessage('Đang bắt đầu cuộc bầu cử...');

      const provider = new JsonRpcProvider('https://geth.holihu.online/rpc');

      // Kết nối tới contracts
      const quanLyCuocBauCuAbi = [
        'function batDauCuocBauCu(uint256 idCuocBauCu, uint256 thoiGianKeoDai) external',
        'function layThongTinCoBan(uint256 idCuocBauCu) view returns (address, bool, uint256, uint256, string, uint256)',
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

      // Kiểm tra xem cuộc bầu cử đã bắt đầu chưa
      const baseInfo = await quanLyCuocBauCu.layThongTinCoBan(1);
      const isActive = baseInfo[1];

      if (isActive) {
        showMessage('Cuộc bầu cử đã bắt đầu');
        setElectionStarted(true);
        setStepStatuses((prev) => ({
          ...prev,
          [WorkflowStep.START_ELECTION]: StepStatus.SKIPPED,
        }));

        // Kiểm tra tiếp trạng thái HLU
        await checkHluTokenStatus(true);

        updateWorkflowProgress();

        // Update election status
        setElectionStatus((prev) => ({
          ...prev,
          isActive: true,
        }));

        return true;
      }

      // Lấy nonce hiện tại
      let currentNonce;
      try {
        currentNonce = await entryPoint.getNonce(scwAddress);
      } catch (nonceError) {
        try {
          currentNonce = await entryPoint.nonceNguoiGui(scwAddress);
        } catch (nonceError2) {
          throw new Error('Không thể lấy nonce: ' + (nonceError2 as Error).message);
        }
      }

      // Tham số thời gian kéo dài cuộc bầu cử (7 ngày)
      const thoiGianKeoDai = 7 * 24 * 60 * 60;

      // Chuẩn bị callData để bắt đầu cuộc bầu cử
      const batDauCuocBauCuCallData = quanLyCuocBauCu.interface.encodeFunctionData(
        'batDauCuocBauCu',
        [
          1, // ID cuộc bầu cử trong contract là 1
          thoiGianKeoDai,
        ],
      );

      const executeCallData = simpleAccount.interface.encodeFunctionData('execute', [
        cuocBauCu.blockchainAddress,
        0,
        batDauCuocBauCuCallData,
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
        callGasLimit: '800000',
        verificationGasLimit: '800000',
        preVerificationGas: '200000',
        maxFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei').toString(),
        paymasterAndData: paymasterAndData,
        signature: '0x',
      };

      // Ký UserOperation
      const userOpHash = await entryPoint.layHashThaoTac(userOp);
      const signature = signUserOp(userOpHash, sessionKey.sessionKey);
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

      showMessage('Đã gửi giao dịch bắt đầu cuộc bầu cử thành công');

      // Thiết lập interval để kiểm tra trạng thái giao dịch
      let checkCount = 0;
      const checkInterval = setInterval(async () => {
        try {
          if (!isMounted.current) {
            clearInterval(checkInterval);
            return;
          }

          const statusResponse = await apiClient.get(
            `/api/bundler/check-status?userOpHash=${response.data.userOpHash}`,
          );

          if (statusResponse.data && statusResponse.data.status === 'success') {
            clearInterval(checkInterval);

            // Kiểm tra lại trạng thái cuộc bầu cử
            const updatedInfo = await quanLyCuocBauCu.layThongTinCoBan(1);
            const isActiveNow = updatedInfo[1];

            if (!isMounted.current) return;

            if (isActiveNow) {
              showMessage('Đã bắt đầu cuộc bầu cử thành công');
              setElectionStarted(true);
              setStepStatuses((prev) => ({
                ...prev,
                [WorkflowStep.START_ELECTION]: StepStatus.COMPLETED,
              }));

              // Kiểm tra tiếp trạng thái HLU
              await checkHluTokenStatus(true);

              updateWorkflowProgress();

              // Update election status
              setElectionStatus((prev) => ({
                ...prev,
                isActive: true,
              }));

              // Hiển thị toast thành công
              toast({
                title: 'Thành công',
                description: 'Đã bắt đầu cuộc bầu cử thành công',
              });

              return true;
            } else {
              throw new Error('Giao dịch thành công nhưng cuộc bầu cử chưa bắt đầu');
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
      showError('Lỗi khi bắt đầu cuộc bầu cử: ' + (error as Error).message);
      setStepStatuses((prev) => ({
        ...prev,
        [WorkflowStep.START_ELECTION]: StepStatus.FAILED,
      }));
      return false;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [
    cuocBauCu,
    scwAddress,
    sessionKey,
    contractAddresses,
    signUserOp,
    showMessage,
    showError,
    updateWorkflowProgress,
    checkHluTokenStatus,
    toast,
  ]);

  // Hàm approve token trực tiếp cho Factory, Paymaster, hoặc cuộc bầu cử
  const approveToken = useCallback(
    async (target: ApproveTargetType) => {
      if (!sessionKey || !contractAddresses) {
        showError('Thiếu thông tin session key hoặc địa chỉ contract');
        return false;
      }

      // Xác định loại target và địa chỉ target
      let targetType: string;
      let targetAddress: string;
      let approveAmount: string;

      switch (target) {
        case ApproveTargetType.FACTORY:
          targetType = 'Factory';
          targetAddress = contractAddresses.factoryAddress;
          approveAmount = '8'; // 8 HLU cho Factory
          break;
        case ApproveTargetType.PAYMASTER:
          targetType = 'Paymaster';
          targetAddress = contractAddresses.paymasterAddress;
          approveAmount = '10'; // 10 HLU cho Paymaster
          break;
        case ApproveTargetType.ELECTION:
          if (!cuocBauCu?.blockchainAddress) {
            showError('Thiếu địa chỉ cuộc bầu cử');
            return false;
          }
          targetType = 'Cuộc bầu cử';
          targetAddress = cuocBauCu.blockchainAddress;
          approveAmount = '20'; // 20 HLU cho cuộc bầu cử
          break;
        default:
          showError('Loại target không hợp lệ');
          return false;
      }

      try {
        setIsLoading(true);
        setApprovingTarget(target);
        showMessage(`Bắt đầu phê duyệt token cho ${targetType}...`);

        // Khởi tạo provider
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

        // Tạo userOperation
        const userOp = {
          sender: scwAddress,
          nonce: nonce.toString(),
          initCode: '0x',
          callData: executeCallData,
          callGasLimit: '200000',
          verificationGasLimit: target === ApproveTargetType.FACTORY ? '250000' : '150000',
          preVerificationGas: '50000',
          maxFeePerGas: parseUnits('5', 'gwei').toString(),
          maxPriorityFeePerGas: parseUnits('2', 'gwei').toString(),
          paymasterAndData:
            target === ApproveTargetType.FACTORY ? contractAddresses.paymasterAddress : '0x',
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

        // Gửi userOp đến API endpoint
        showMessage(`Đang gửi giao dịch approve cho ${targetType} qua bundler API...`);
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
          setTxHash(hash);
          showMessage(`Giao dịch đã gửi với UserOpHash: ${hash}`);

          // Đợi xác nhận
          let confirmed = false;
          let attempts = 0;
          const maxAttempts = 10;

          while (!confirmed && attempts < maxAttempts && isMounted.current) {
            await new Promise((resolve) => setTimeout(resolve, 3000)); // đợi 3 giây
            attempts++;

            confirmed = await checkUserOpStatus(hash, true);

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
        return false;
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          setApprovingTarget(null);

          // Đợi một chút và kiểm tra lại trạng thái token
          setTimeout(() => {
            if (isMounted.current && !isCheckingRef.current) {
              checkHluTokenStatus(true);
            }
          }, 2000);
        }
      }
    },
    [
      sessionKey,
      contractAddresses,
      scwAddress,
      cuocBauCu?.blockchainAddress,
      showMessage,
      showError,
      toast,
      checkUserOpStatus,
      checkHluTokenStatus,
    ],
  );

  // Functions to approve specific targets
  const approveFactory = useCallback(() => {
    return approveToken(ApproveTargetType.FACTORY);
  }, [approveToken]);

  const approvePaymaster = useCallback(() => {
    return approveToken(ApproveTargetType.PAYMASTER);
  }, [approveToken]);

  const approveElection = useCallback(() => {
    return approveToken(ApproveTargetType.ELECTION);
  }, [approveToken]);

  // 10. Refresh all data
  const refreshData = useCallback(() => {
    if (onRefreshData) {
      onRefreshData();
    }

    // Reset trạng thái để làm mới quá trình kiểm tra
    initialCheckPerformed.current = false;

    // Tránh bắt đầu kiểm tra nếu đang có quá trình kiểm tra khác
    if (isCheckingPermission || isLoading || isCheckingRef.current) {
      showMessage('Đang có quá trình kiểm tra đang diễn ra, vui lòng đợi');
      return;
    }

    // Kiểm tra xem có đủ thông tin không
    if (!scwAddress || !cuocBauCu?.blockchainAddress) {
      showMessage('Thiếu thông tin SCW hoặc địa chỉ blockchain của cuộc bầu cử');
      return;
    }

    // Sử dụng async IIFE để xử lý các promise theo trình tự
    (async () => {
      try {
        showMessage('Đang làm mới dữ liệu...');

        // Kiểm tra quyền BANTOCHUC
        const hasRole = await checkBantochucRole();

        // Nếu có quyền BANTOCHUC và cuộc bầu cử đã bắt đầu, kiểm tra token HLU
        if (hasRole && electionStarted && isMounted.current) {
          await checkHluTokenStatus(true);
        }

        showMessage('Đã làm mới dữ liệu thành công');

        // Hiển thị toast khi làm mới thành công
        toast({
          title: 'Làm mới thành công',
          description: 'Đã cập nhật trạng thái mới nhất',
        });
      } catch (error) {
        console.error('Lỗi khi làm mới dữ liệu:', error);
        showError(`Lỗi khi làm mới dữ liệu: ${(error as Error).message}`);
      }
    })();
  }, [
    onRefreshData,
    checkBantochucRole,
    checkHluTokenStatus,
    scwAddress,
    cuocBauCu?.blockchainAddress,
    electionStarted,
    showMessage,
    showError,
    isCheckingPermission,
    isLoading,
    toast,
  ]);

  // Clean up on component unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  // Update account info from userInfo
  useEffect(() => {
    if (userInfo && userInfo.id) {
      setTaiKhoanId(userInfo.id.toString());
    }
  }, [userInfo]);

  // Update viId and scwAddress from walletInfo or sessionKey
  useEffect(() => {
    if (walletInfo) {
      setViId(walletInfo.viId.toString());
      setScwAddress(walletInfo.diaChiVi);
    } else if (sessionKey) {
      setScwAddress(sessionKey.scwAddress);
    }
  }, [walletInfo, sessionKey]);

  // Fetch contract addresses only once
  useEffect(() => {
    // Tránh gọi fetchContractAddresses() nếu isLoading đang là true hoặc đã có contractAddresses
    if (!contractAddresses && !isLoading && isMounted.current) {
      fetchContractAddresses();
    }
  }, [contractAddresses, fetchContractAddresses, isLoading]);

  // Initial check on mount - cải tiến để tránh render lặp đi lặp lại
  useEffect(() => {
    // Sử dụng ref để theo dõi việc kiểm tra đã được thực hiện hay chưa
    // Chỉ kiểm tra một lần khi component mount hoặc khi các dependencies thay đổi đáng kể
    const shouldCheck =
      scwAddress &&
      cuocBauCu?.blockchainAddress &&
      !initialCheckPerformed.current &&
      !isCheckingPermission &&
      !isLoading &&
      !isCheckingRef.current &&
      isMounted.current;

    if (shouldCheck) {
      // Đánh dấu đã kiểm tra để tránh kiểm tra lại
      initialCheckPerformed.current = true;

      // Sử dụng timeout để tránh nhiều cập nhật state liên tiếp
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }

      checkTimeoutRef.current = setTimeout(async () => {
        try {
          const hasRole = await checkBantochucRole();
          // Chỉ kiểm tra HLU token nếu có quyền BANTOCHUC và cuộc bầu cử đã bắt đầu
          if (hasRole && electionStarted && isMounted.current) {
            await checkHluTokenStatus(true);
          }
        } catch (error) {
          console.error('Lỗi khi kiểm tra ban đầu:', error);
        }
      }, 300);
    }
    // Chỉ phụ thuộc vào các giá trị cốt lõi để tránh render liên tục
  }, [
    scwAddress,
    cuocBauCu?.blockchainAddress,
    checkBantochucRole,
    checkHluTokenStatus,
    electionStarted,
    isCheckingPermission,
    isLoading,
  ]);

  // Step card component
  const StepCard: React.FC<{
    status: StepStatus;
    title: string;
    description: string;
    icon: React.ReactNode;
    actionButton?: React.ReactNode;
  }> = ({ status, title, description, icon, actionButton }) => {
    let statusIcon;
    let statusClass;

    switch (status) {
      case StepStatus.COMPLETED:
        statusIcon = <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
        statusClass = 'text-emerald-500';
        break;
      case StepStatus.IN_PROGRESS:
        statusIcon = <Loader className="w-6 h-6 text-cyan-500 animate-spin" />;
        statusClass = 'text-cyan-500';
        break;
      case StepStatus.FAILED:
        statusIcon = <XCircle className="w-6 h-6 text-rose-500" />;
        statusClass = 'text-rose-500';
        break;
      case StepStatus.SKIPPED:
        statusIcon = <CheckCircle2 className="w-6 h-6 text-gray-400" />;
        statusClass = 'text-gray-400';
        break;
      default:
        statusIcon = <Clock className="w-6 h-6 text-gray-400" />;
        statusClass = 'text-gray-400';
    }

    return (
      <div className="p-4 rounded-lg border-l-4 border-gray-300 mb-4">
        <div className="flex items-start">
          <div className="mr-4 mt-1">{icon}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">{title}</h3>
              <div>{statusIcon}</div>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{description}</p>
            {actionButton && <div className="mt-2">{actionButton}</div>}
          </div>
        </div>
      </div>
    );
  };

  // Kiểm tra xem có thể cấp quyền BANTOCHUC hay không
  const canGrantBanToChucRole = !!(
    cuocBauCu?.blockchainAddress &&
    scwAddress &&
    sessionKey &&
    contractAddresses
  );

  // Kiểm tra xem có thể bắt đầu cuộc bầu cử hay không
  const canStartElection = !!(
    cuocBauCu?.blockchainAddress &&
    scwAddress &&
    sessionKey &&
    contractAddresses &&
    bantochucRoleCheck.hasRole
  );

  return (
    <Card className="mb-8 border-t-4 border-indigo-500 dark:border-indigo-600 bg-gradient-to-br from-white to-indigo-50 dark:from-[#162A45]/90 dark:to-[#1E1A29]/70">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800/50">
            <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
            Quy Trình Triển Khai Bầu Cử
          </CardTitle>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Các bước cần thiết để triển khai cuộc bầu cử lên blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tiến trình</span>
            <span className="text-sm font-medium">{workflowProgress}%</span>
          </div>
          <Progress className="h-2" value={workflowProgress} />
        </div>

        {/* Current Status */}
        <div className="mb-6">
          <BlockchainStatusDisplay
            scwAddress={scwAddress || 'Chưa có địa chỉ ví'}
            electionStatus={electionStatus}
            isCheckingPermission={isCheckingPermission}
            onCheckPermission={checkBantochucRole}
            grantBanToChucRole={grantBanToChucRole}
            startElection={startElection}
            isLoading={isLoading || isCheckingRef.current}
          />
        </div>

        {/* Display messages/errors */}
        {message && (
          <Alert className="mb-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-300">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert
            className="mb-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300"
            variant="destructive"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Required components missing warning */}
        {(!scwAddress || !cuocBauCu?.blockchainAddress || !sessionKey || !contractAddresses) && (
          <Alert className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Thiếu thông tin cần thiết</AlertTitle>
            <AlertDescription>
              {!scwAddress && <div>- Chưa có địa chỉ ví thông minh (SCW)</div>}
              {!cuocBauCu?.blockchainAddress && (
                <div>- Chưa có địa chỉ blockchain của cuộc bầu cử</div>
              )}
              {!sessionKey && <div>- Chưa có khóa phiên (session key)</div>}
              {!contractAddresses && <div>- Chưa có thông tin địa chỉ contract</div>}
              Vui lòng thiết lập đầy đủ thông tin trên để tiếp tục quy trình.
            </AlertDescription>
          </Alert>
        )}

        {/* Transaction Hash (if available) */}
        {txHash && (
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Mã Giao Dịch (Transaction Hash)
            </p>
            <p className="font-mono text-sm truncate text-gray-800 dark:text-gray-200">{txHash}</p>
          </div>
        )}

        {/* Workflow Steps */}
        <div className="space-y-2 mt-6">
          <h3 className="text-lg font-medium mb-4">Các bước triển khai</h3>

          {/* Step 1: Check BANTOCHUC Role */}
          <StepCard
            status={stepStatuses[WorkflowStep.CHECK_BANTOCHUC_ROLE]}
            title="Kiểm tra quyền BANTOCHUC"
            description="Xác minh rằng ví thông minh của bạn có quyền quản lý cuộc bầu cử"
            icon={<Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            actionButton={
              stepStatuses[WorkflowStep.CHECK_BANTOCHUC_ROLE] === StepStatus.FAILED && (
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={checkBantochucRole}
                  disabled={isLoading || !scwAddress || !cuocBauCu?.blockchainAddress}
                >
                  {isLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                  Kiểm tra lại
                </Button>
              )
            }
          />

          {/* Step 2: Grant BANTOCHUC Role */}
          {stepStatuses[WorkflowStep.CHECK_BANTOCHUC_ROLE] === StepStatus.COMPLETED &&
            !bantochucRoleCheck.hasRole && (
              <StepCard
                status={stepStatuses[WorkflowStep.GRANT_BANTOCHUC_ROLE]}
                title="Cấp quyền BANTOCHUC"
                description="Cấp quyền ban tổ chức cho ví thông minh của bạn"
                icon={<Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                actionButton={
                  stepStatuses[WorkflowStep.GRANT_BANTOCHUC_ROLE] !== StepStatus.COMPLETED &&
                  stepStatuses[WorkflowStep.GRANT_BANTOCHUC_ROLE] !== StepStatus.IN_PROGRESS && (
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={grantBanToChucRole}
                      disabled={isLoading || !canGrantBanToChucRole}
                    >
                      {isLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                      Cấp quyền
                    </Button>
                  )
                }
              />
            )}

          {/* Step 3: Start Election */}
          {bantochucRoleCheck.hasRole && (
            <StepCard
              status={stepStatuses[WorkflowStep.START_ELECTION]}
              title="Bắt đầu cuộc bầu cử"
              description="Kích hoạt cuộc bầu cử trên blockchain"
              icon={<Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              actionButton={
                !electionStarted &&
                stepStatuses[WorkflowStep.START_ELECTION] !== StepStatus.IN_PROGRESS &&
                stepStatuses[WorkflowStep.START_ELECTION] !== StepStatus.COMPLETED && (
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={startElection}
                    disabled={isLoading || !canStartElection}
                  >
                    {isLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                    Bắt đầu cuộc bầu cử
                  </Button>
                )
              }
            />
          )}

          {/* Step 4: Approve HLU Token */}
          {electionStarted && (
            <StepCard
              status={stepStatuses[WorkflowStep.APPROVE_HLU_TOKEN]}
              title="Phê duyệt token HLU"
              description="Phê duyệt token HLU cho Factory, Paymaster và cuộc bầu cử"
              icon={<Coins className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
              actionButton={
                <>
                  {/* Hiển thị thông tin số dư hiện tại */}
                  <div className="mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                      <div
                        className={`flex items-center ${hluTokenStatus.hasEnoughBalance ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                      >
                        {hluTokenStatus.hasEnoughBalance ? (
                          <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        )}
                        <span>Số dư: {hluTokenStatus.hluBalance} HLU</span>
                      </div>
                      <div
                        className={`flex items-center ${hluTokenStatus.hasFactoryAllowance ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}
                      >
                        {hluTokenStatus.hasFactoryAllowance ? (
                          <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        )}
                        <span>Factory: {hluTokenStatus.allowanceForFactory} HLU</span>
                      </div>
                      <div
                        className={`flex items-center ${hluTokenStatus.hasPaymasterAllowance ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}
                      >
                        {hluTokenStatus.hasPaymasterAllowance ? (
                          <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        )}
                        <span>Paymaster: {hluTokenStatus.allowanceForPaymaster} HLU</span>
                      </div>
                      <div
                        className={`flex items-center ${hluTokenStatus.hasElectionAllowance ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}
                      >
                        {hluTokenStatus.hasElectionAllowance ? (
                          <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        )}
                        <span>Cuộc bầu cử: {hluTokenStatus.allowanceForElection} HLU</span>
                      </div>
                    </div>
                  </div>

                  {/* Nút Approve riêng */}
                  {!hluTokenStatus.isApproved && (
                    <div className="space-y-3 mt-4">
                      {/* Approve Paymaster */}
                      {!hluTokenStatus.hasPaymasterAllowance && hluTokenStatus.hasEnoughBalance && (
                        <Button
                          onClick={approvePaymaster}
                          disabled={isLoading || !sessionKey || approvingTarget !== null}
                          className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-blue-600 dark:from-[#0288D1] dark:to-[#0277BD] text-white hover:shadow-lg hover:shadow-blue-300/30 dark:hover:shadow-[#4F8BFF]/20 disabled:opacity-50 transition-all duration-300 flex items-center justify-center"
                        >
                          {approvingTarget === ApproveTargetType.PAYMASTER ? (
                            <Loader className="animate-spin mr-2" size={18} />
                          ) : (
                            <ArrowRightCircle className="mr-2" size={18} />
                          )}
                          {approvingTarget === ApproveTargetType.PAYMASTER
                            ? 'Đang phê duyệt cho Paymaster...'
                            : 'Phê duyệt cho Paymaster'}
                        </Button>
                      )}

                      {/* Approve Factory */}
                      {!hluTokenStatus.hasFactoryAllowance &&
                        hluTokenStatus.hasEnoughBalance &&
                        hluTokenStatus.hasPaymasterAllowance && (
                          <Button
                            onClick={approveFactory}
                            disabled={isLoading || !sessionKey || approvingTarget !== null}
                            className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-purple-500 to-purple-600 dark:from-[#7B1FA2] dark:to-[#6A1B9A] text-white hover:shadow-lg hover:shadow-purple-300/30 dark:hover:shadow-[#6A1B9A]/20 disabled:opacity-50 transition-all duration-300 flex items-center justify-center"
                          >
                            {approvingTarget === ApproveTargetType.FACTORY ? (
                              <Loader className="animate-spin mr-2" size={18} />
                            ) : (
                              <ArrowRightCircle className="mr-2" size={18} />
                            )}
                            {approvingTarget === ApproveTargetType.FACTORY
                              ? 'Đang phê duyệt cho Factory...'
                              : 'Phê duyệt cho Factory'}
                          </Button>
                        )}

                      {/* Approve cuộc bầu cử */}
                      {!hluTokenStatus.hasElectionAllowance &&
                        hluTokenStatus.hasEnoughBalance &&
                        hluTokenStatus.hasFactoryAllowance &&
                        hluTokenStatus.hasPaymasterAllowance && (
                          <Button
                            onClick={approveElection}
                            disabled={isLoading || !sessionKey || approvingTarget !== null}
                            className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-green-500 to-green-600 dark:from-[#2E7D32] dark:to-[#1B5E20] text-white hover:shadow-lg hover:shadow-green-300/30 dark:hover:shadow-[#1B5E20]/20 disabled:opacity-50 transition-all duration-300 flex items-center justify-center"
                          >
                            {approvingTarget === ApproveTargetType.ELECTION ? (
                              <Loader className="animate-spin mr-2" size={18} />
                            ) : (
                              <Zap className="mr-2" size={18} />
                            )}
                            {approvingTarget === ApproveTargetType.ELECTION
                              ? 'Đang phê duyệt cho Cuộc bầu cử...'
                              : 'Phê duyệt cho Cuộc bầu cử'}
                          </Button>
                        )}
                    </div>
                  )}

                  {/* Hiển thị thông báo khi đã approve thành công */}
                  {hluTokenStatus.isApproved && (
                    <div className="mt-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-300 flex items-start">
                      <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Đã phê duyệt đầy đủ token HLU</p>
                        <p className="text-sm mt-1">
                          Tất cả điều kiện về token đã được đáp ứng. Bạn có thể tiếp tục triển khai
                          phiên bầu cử.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              }
            />
          )}

          {/* Step 5: Mention Ballot Session Deployment */}
          {electionStarted && hluTokenStatus.isApproved && (
            <StepCard
              status={
                phienBauCu?.trangThaiBlockchain === 2 ? StepStatus.COMPLETED : StepStatus.PENDING
              }
              title="Triển khai phiên bầu cử"
              description="Tạo và triển khai phiên bầu cử lên blockchain"
              icon={<Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              actionButton={
                phienBauCu?.trangThaiBlockchain !== 2 &&
                hluTokenStatus.isApproved && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="mb-1">
                      Sử dụng chức năng "Triển Khai Phiên Bầu Cử" trong tab Triển khai
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Đã sẵn sàng triển khai - Đã phê duyệt đủ token HLU
                    </p>
                  </div>
                )
              }
            />
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={isLoading || isCheckingPermission || isCheckingRef.current}
            className="w-full md:w-auto border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
          >
            {isLoading || isCheckingPermission || isCheckingRef.current ? (
              <Loader className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Làm mới trạng thái
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ElectionWorkflowManager;
