import React, { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

// Các kiểu dữ liệu
type StatusType = 'idle' | 'loading' | 'success' | 'error';
type LogType = { message: string; type: 'info' | 'success' | 'error' | 'warning' };

// Cấu hình mặc định
const DEFAULT_CONFIG = {
  providerUrl: 'https://geth.holihu.online/rpc',
  entryPointAddress: '0x2eb38B2483e14a103dc4F840e6c854F133D98c37',
  paymasterAddress: '0x1B0e7A821d918d9C8d3703aC4b87CBdaE3F13F9c',
  electionContract: '0x37F0a479783a75F879DFd9154f3e5FeD6412eAC3',
  hluTokenAddress: '0x820F15F12Aa75BAa89A16B20768024C8604Ea16f',
  sessionKey: '0xf59ff3f1451d1f08f976b9bf519d9f55bb772755e905fed104249ffa40b33f86',
  electionId: 1, // Luôn là 1 trong contract
  sessionDuration: 3 * 24 * 60 * 60, // 3 ngày
  maxVoters: 100,
  // Thêm giá trị gas đã được tăng lên
  callGasLimit: 2000000,
  verificationGasLimit: 2000000,
  preVerificationGas: 500000,
  maxFeePerGas: 10, // Gwei
  maxPriorityFeePerGas: 5, // Gwei
};

// ABI cần thiết
const ABI = {
  scw: [
    'function sessionKeys(address) view returns (uint256)',
    'function owner() view returns (address)',
    'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
  ],
  quanLyCuocBauCu: [
    'function layThongTinCoBan(uint256 idCuocBauCu) view returns (address, bool, uint256, uint256, string, uint256)',
    'function taoPhienBauCu(uint256 idCuocBauCu, uint256 thoiGianKeoDai, uint256 soCuTriToiDa) external returns (uint256)',
    'function batDauCuocBauCu(uint256 idCuocBauCu, uint256 thoiGianKeoDai) external',
    'function themBanToChuc(address) external',
    'function hasRole(bytes32 role, address account) view returns (bool)',
    'event PhienBauCuDaTao(uint256 indexed idCuocBauCu, uint256 indexed idPhienBauCu, address nguoiSoHuu)',
  ],
  entryPoint: [
    'function getNonce(address sender) external view returns (uint256)',
    'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
    'function xuLyCacThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[], address) payable',
  ],
  hluToken: [
    'function balanceOf(address account) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
  ],
};

const BallotDeployer: React.FC = () => {
  // State
  const [scwAddress, setScwAddress] = useState<string>(
    '0x8Ab98b94495b3447a2bc9B2fB003336e82698b85',
  );
  const [sessionKey, setSessionKey] = useState<string>(DEFAULT_CONFIG.sessionKey);
  const [sessionDuration, setSessionDuration] = useState<number>(DEFAULT_CONFIG.sessionDuration);
  const [maxVoters, setMaxVoters] = useState<number>(DEFAULT_CONFIG.maxVoters);
  const [deployer, setDeployer] = useState<string>('');
  const [status, setStatus] = useState<StatusType>('idle');
  const [operation, setOperation] = useState<string>('');
  const [logs, setLogs] = useState<LogType[]>([]);
  const [txHash, setTxHash] = useState<string>('');
  const [sessionInfo, setSessionInfo] = useState<{ expiration: number; isValid: boolean }>({
    expiration: 0,
    isValid: false,
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
  const [hluStatus, setHluStatus] = useState<{
    balance: string;
    allowance: string;
    isApproved: boolean;
  }>({
    balance: '0',
    allowance: '0',
    isApproved: false,
  });
  const [deployerBalance, setDeployerBalance] = useState<string>('0');

  // Provider và contracts
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);

  // Hàm thêm log
  const addLog = useCallback((message: string, type: LogType['type'] = 'info') => {
    setLogs((prev) => [...prev, { message, type }]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);

  // Khởi tạo provider
  useEffect(() => {
    const initProvider = async () => {
      try {
        const providerInstance = new ethers.JsonRpcProvider(DEFAULT_CONFIG.providerUrl);
        const network = await providerInstance.getNetwork();
        addLog(`Kết nối thành công đến mạng blockchain, chainId: ${network.chainId}`, 'success');
        setProvider(providerInstance);
      } catch (error) {
        addLog(`Không thể kết nối đến blockchain provider: ${(error as Error).message}`, 'error');
      }
    };

    initProvider();
  }, [addLog]);

  // Kiểm tra session key
  const checkSessionKey = useCallback(async () => {
    if (!provider || !scwAddress || !sessionKey) {
      addLog('Thiếu thông tin SCW hoặc session key', 'warning');
      return false;
    }

    try {
      // Tạo signing key từ private key
      const signingKey = new ethers.SigningKey(sessionKey);
      // Sử dụng ethers.computeAddress() với publicKey từ signingKey
      const sessionAddress = ethers.computeAddress(signingKey.publicKey);

      addLog(`Địa chỉ từ session key: ${sessionAddress}`, 'info');

      // Kiểm tra thời hạn của session key
      const scwContract = new ethers.Contract(scwAddress, ABI.scw, provider);

      // Lấy owner
      const owner = await scwContract.owner();
      addLog(`Owner của SCW: ${owner}`, 'info');

      // Lấy thời hạn
      const expiration = await scwContract.sessionKeys(sessionAddress);
      const expirationDate = new Date(Number(expiration) * 1000);

      addLog(`Thời hạn session key: ${expirationDate.toLocaleString()}`, 'info');

      const currentTime = Math.floor(Date.now() / 1000);
      const isValid = Number(expiration) > currentTime;

      setSessionInfo({
        expiration: Number(expiration),
        isValid,
      });

      if (!isValid) {
        addLog('Session key đã hết hạn', 'error');
        return false;
      }

      const remainingTime = Number(expiration) - currentTime;
      addLog(
        `Session key còn hiệu lực trong ${Math.floor(remainingTime / 3600)} giờ ${Math.floor((remainingTime % 3600) / 60)} phút`,
        'success',
      );

      return true;
    } catch (error) {
      addLog(`Lỗi khi kiểm tra session key: ${(error as Error).message}`, 'error');
      return false;
    }
  }, [provider, scwAddress, sessionKey, addLog]);

  // Kiểm tra quyền sở hữu, trạng thái cuộc bầu cử và quyền BANTOCHUC
  const checkElectionStatus = useCallback(async () => {
    if (!provider || !scwAddress) {
      addLog('Thiếu thông tin SCW', 'warning');
      return false;
    }

    try {
      // Kết nối đến hợp đồng QuanLyCuocBauCu
      const quanLyCuocBauCuContract = new ethers.Contract(
        DEFAULT_CONFIG.electionContract,
        ABI.quanLyCuocBauCu,
        provider,
      );

      // Lấy thông tin cơ bản về cuộc bầu cử
      const baseInfo = await quanLyCuocBauCuContract.layThongTinCoBan(DEFAULT_CONFIG.electionId);
      const owner = baseInfo[0];
      const isActive = baseInfo[1]; // Kiểm tra cuộc bầu cử đang hoạt động

      addLog(`Chủ sở hữu cuộc bầu cử: ${owner}`, 'info');
      addLog(`Cuộc bầu cử đang hoạt động: ${isActive ? 'Có' : 'Không'}`, 'info');

      if (!isActive) {
        addLog(
          'Cuộc bầu cử chưa được bắt đầu. Cần bắt đầu cuộc bầu cử trước khi tạo phiên.',
          'warning',
        );
      }

      // Kiểm tra quyền BANTOCHUC
      const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes('BANTOCHUC'));
      const hasBanToChucRole = await quanLyCuocBauCuContract.hasRole(BANTOCHUC, scwAddress);
      addLog(`SCW có quyền BANTOCHUC: ${hasBanToChucRole ? 'Có' : 'Không'}`, 'info');

      const isOwner = owner.toLowerCase() === scwAddress.toLowerCase();
      setElectionStatus({
        owner,
        isOwner,
        isActive,
        hasBanToChucRole,
      });

      if (!isOwner) {
        addLog(`SCW (${scwAddress}) không phải là chủ sở hữu của cuộc bầu cử (${owner})`, 'error');
      } else {
        addLog(`SCW là chủ sở hữu của cuộc bầu cử ✓`, 'success');
      }

      if (!hasBanToChucRole) {
        addLog('SCW không có quyền BANTOCHUC. Cần cấp quyền để tạo phiên.', 'warning');
      }

      // Kiểm tra token HLU
      const hluContract = new ethers.Contract(
        DEFAULT_CONFIG.hluTokenAddress,
        ABI.hluToken,
        provider,
      );
      const balance = await hluContract.balanceOf(scwAddress);
      const allowance = await hluContract.allowance(scwAddress, DEFAULT_CONFIG.electionContract);
      const formattedBalance = ethers.formatEther(balance);
      const formattedAllowance = ethers.formatEther(allowance);
      const isApproved = allowance >= ethers.parseEther('3');

      setHluStatus({
        balance: formattedBalance,
        allowance: formattedAllowance,
        isApproved,
      });

      addLog(`Số dư HLU của SCW: ${formattedBalance} HLU`, 'info');
      addLog(`Allowance cho QuanLyCuocBauCu: ${formattedAllowance} HLU`, 'info');

      if (!isApproved) {
        addLog('Cần phê duyệt token HLU cho hợp đồng QuanLyCuocBauCu', 'warning');
      } else {
        addLog('HLU token đã được phê duyệt đủ cho QuanLyCuocBauCu ✓', 'success');
      }

      return isOwner;
    } catch (error) {
      addLog(`Lỗi khi kiểm tra trạng thái cuộc bầu cử: ${(error as Error).message}`, 'error');
      return false;
    }
  }, [provider, scwAddress, addLog]);

  // Kiểm tra số dư của deployer
  const checkDeployerBalance = useCallback(async () => {
    if (!provider || !deployer) {
      addLog('Thiếu thông tin deployer', 'warning');
      return false;
    }

    try {
      const deployerWallet = new ethers.Wallet(deployer, provider);
      const balance = await provider.getBalance(deployerWallet.address);
      const balanceInEth = ethers.formatEther(balance);

      setDeployerBalance(balanceInEth);
      addLog(`Số dư ETH của deployer (${deployerWallet.address}): ${balanceInEth} ETH`, 'info');

      if (balance < ethers.parseEther('0.1')) {
        addLog('Số dư ETH không đủ để gửi giao dịch (yêu cầu tối thiểu 0.1 ETH)', 'warning');
        return false;
      }

      return true;
    } catch (error) {
      addLog(`Lỗi khi kiểm tra số dư deployer: ${(error as Error).message}`, 'error');
      return false;
    }
  }, [provider, deployer, addLog]);

  // Cấp quyền BANTOCHUC cho SCW
  const grantBanToChucRole = useCallback(async () => {
    if (!provider || !scwAddress || !sessionKey || !deployer) {
      addLog('Thiếu thông tin cần thiết', 'warning');
      return;
    }

    try {
      setStatus('loading');
      setOperation('grantRole');
      addLog('Bắt đầu quy trình cấp quyền BANTOCHUC...', 'info');

      // Kiểm tra session key
      const isSessionValid = await checkSessionKey();
      if (!isSessionValid) {
        throw new Error('Session key không hợp lệ hoặc đã hết hạn');
      }

      // Kiểm tra quyền sở hữu
      await checkElectionStatus();

      if (electionStatus.hasBanToChucRole) {
        addLog('SCW đã có quyền BANTOCHUC. Không cần cấp thêm.', 'info');
        setStatus('idle');
        return;
      }

      // Kiểm tra số dư deployer
      const hasEnoughBalance = await checkDeployerBalance();
      if (!hasEnoughBalance) {
        throw new Error('Số dư ETH của deployer không đủ');
      }

      // Kết nối đến các contracts
      const entryPointContract = new ethers.Contract(
        DEFAULT_CONFIG.entryPointAddress,
        ABI.entryPoint,
        provider,
      );

      const quanLyCuocBauCuContract = new ethers.Contract(
        DEFAULT_CONFIG.electionContract,
        ABI.quanLyCuocBauCu,
        provider,
      );

      const simpleAccountContract = new ethers.Contract(scwAddress, ABI.scw, provider);

      // Lấy nonce
      const currentNonce = await entryPointContract.getNonce(scwAddress);
      addLog(`Nonce hiện tại: ${currentNonce.toString()}`, 'info');

      // Tạo callData cho themBanToChuc
      const themBanToChucCallData = quanLyCuocBauCuContract.interface.encodeFunctionData(
        'themBanToChuc',
        [scwAddress],
      );

      addLog(`CallData cho themBanToChuc: ${themBanToChucCallData}`, 'info');

      // Tạo callData cho execute
      const executeCallData = simpleAccountContract.interface.encodeFunctionData('execute', [
        DEFAULT_CONFIG.electionContract,
        0,
        themBanToChucCallData,
      ]);

      addLog(`CallData cho execute: ${executeCallData}`, 'info');

      // Chuẩn bị paymasterAndData
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const deadlineTime = currentTimestamp + 3600; // 1 giờ sau
      const validationTime = currentTimestamp;

      const paymasterAndData = ethers.concat([
        DEFAULT_CONFIG.paymasterAddress,
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
      ]);

      // Chuẩn bị UserOperation
      const userOp = {
        sender: scwAddress,
        nonce: currentNonce,
        initCode: '0x',
        callData: executeCallData,
        callGasLimit: BigInt(DEFAULT_CONFIG.callGasLimit),
        verificationGasLimit: BigInt(DEFAULT_CONFIG.verificationGasLimit),
        preVerificationGas: BigInt(DEFAULT_CONFIG.preVerificationGas),
        maxFeePerGas: ethers.parseUnits(DEFAULT_CONFIG.maxFeePerGas.toString(), 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits(
          DEFAULT_CONFIG.maxPriorityFeePerGas.toString(),
          'gwei',
        ),
        paymasterAndData: paymasterAndData,
        signature: '0x',
      };

      // Lấy UserOpHash từ contract
      const userOpHash = await entryPointContract.layHashThaoTac(userOp);
      addLog(`UserOpHash: ${userOpHash}`, 'info');

      // Ký UserOperation
      const signingKey = new ethers.SigningKey(sessionKey);
      const signatureObj = signingKey.sign(ethers.getBytes(userOpHash));

      // Tạo signature theo chuẩn ethers v6
      const signature = ethers.Signature.from({
        r: signatureObj.r,
        s: signatureObj.s,
        v: signatureObj.v,
      }).serialized;

      userOp.signature = signature;

      addLog(`Đã ký UserOperation thành công`, 'success');

      // Gửi userOp đến blockchain
      const deployerWallet = new ethers.Wallet(deployer, provider);
      addLog(`Đang gửi UserOperation từ địa chỉ: ${deployerWallet.address}`, 'info');

      // Gửi giao dịch
      const tx = await entryPointContract
        .connect(deployerWallet)
        .xuLyCacThaoTac([userOp], deployerWallet.address, { gasLimit: 5000000 });

      setTxHash(tx.hash);
      addLog(`Giao dịch đã gửi, hash: ${tx.hash}`, 'success');

      // Đợi giao dịch được xác nhận
      addLog('Đang đợi giao dịch được xác nhận...', 'info');
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        addLog('Quyền BANTOCHUC đã được cấp thành công!', 'success');
        setStatus('success');

        // Kiểm tra lại quyền
        const BANTOCHUC = ethers.keccak256(ethers.toUtf8Bytes('BANTOCHUC'));
        const hasBanToChucRole = await quanLyCuocBauCuContract.hasRole(BANTOCHUC, scwAddress);
        addLog(
          `Sau khi cấp quyền, SCW có quyền BANTOCHUC: ${hasBanToChucRole ? 'Có' : 'Không'}`,
          'info',
        );

        // Cập nhật trạng thái
        await checkElectionStatus();
      } else {
        addLog('Giao dịch thất bại!', 'error');
        setStatus('error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      addLog(`Lỗi khi cấp quyền BANTOCHUC: ${errorMessage}`, 'error');
      setStatus('error');
    } finally {
      setOperation('');
    }
  }, [
    provider,
    scwAddress,
    sessionKey,
    deployer,
    electionStatus,
    checkSessionKey,
    checkElectionStatus,
    checkDeployerBalance,
    addLog,
  ]);

  // Phê duyệt token HLU
  const approveHluToken = useCallback(async () => {
    if (!provider || !scwAddress || !sessionKey || !deployer) {
      addLog('Thiếu thông tin cần thiết', 'warning');
      return;
    }

    try {
      setStatus('loading');
      setOperation('approveToken');
      addLog('Bắt đầu quy trình phê duyệt token HLU...', 'info');

      // Kiểm tra session key
      const isSessionValid = await checkSessionKey();
      if (!isSessionValid) {
        throw new Error('Session key không hợp lệ hoặc đã hết hạn');
      }

      // Kiểm tra token HLU
      await checkElectionStatus();

      if (hluStatus.isApproved) {
        addLog('Token HLU đã được phê duyệt đủ. Không cần phê duyệt thêm.', 'info');
        setStatus('idle');
        return;
      }

      // Kiểm tra số dư deployer
      const hasEnoughBalance = await checkDeployerBalance();
      if (!hasEnoughBalance) {
        throw new Error('Số dư ETH của deployer không đủ');
      }

      // Kết nối đến các contracts
      const entryPointContract = new ethers.Contract(
        DEFAULT_CONFIG.entryPointAddress,
        ABI.entryPoint,
        provider,
      );

      const hluContract = new ethers.Contract(
        DEFAULT_CONFIG.hluTokenAddress,
        ABI.hluToken,
        provider,
      );

      const simpleAccountContract = new ethers.Contract(scwAddress, ABI.scw, provider);

      // Lấy nonce
      const currentNonce = await entryPointContract.getNonce(scwAddress);
      addLog(`Nonce hiện tại: ${currentNonce.toString()}`, 'info');

      // Tạo callData cho approve
      const approveAmount = ethers.parseEther('10'); // Phê duyệt 10 HLU
      const approveCallData = hluContract.interface.encodeFunctionData('approve', [
        DEFAULT_CONFIG.electionContract,
        approveAmount,
      ]);

      addLog(`CallData cho approve: ${approveCallData}`, 'info');

      // Tạo callData cho execute
      const executeCallData = simpleAccountContract.interface.encodeFunctionData('execute', [
        DEFAULT_CONFIG.hluTokenAddress,
        0,
        approveCallData,
      ]);

      addLog(`CallData cho execute: ${executeCallData}`, 'info');

      // Chuẩn bị paymasterAndData
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const deadlineTime = currentTimestamp + 3600; // 1 giờ sau
      const validationTime = currentTimestamp;

      const paymasterAndData = ethers.concat([
        DEFAULT_CONFIG.paymasterAddress,
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
      ]);

      // Chuẩn bị UserOperation
      const userOp = {
        sender: scwAddress,
        nonce: currentNonce,
        initCode: '0x',
        callData: executeCallData,
        callGasLimit: BigInt(DEFAULT_CONFIG.callGasLimit),
        verificationGasLimit: BigInt(DEFAULT_CONFIG.verificationGasLimit),
        preVerificationGas: BigInt(DEFAULT_CONFIG.preVerificationGas),
        maxFeePerGas: ethers.parseUnits(DEFAULT_CONFIG.maxFeePerGas.toString(), 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits(
          DEFAULT_CONFIG.maxPriorityFeePerGas.toString(),
          'gwei',
        ),
        paymasterAndData: paymasterAndData,
        signature: '0x',
      };

      // Lấy UserOpHash từ contract
      const userOpHash = await entryPointContract.layHashThaoTac(userOp);
      addLog(`UserOpHash: ${userOpHash}`, 'info');

      // Ký UserOperation
      const signingKey = new ethers.SigningKey(sessionKey);
      const signatureObj = signingKey.sign(ethers.getBytes(userOpHash));

      // Tạo signature theo chuẩn ethers v6
      const signature = ethers.Signature.from({
        r: signatureObj.r,
        s: signatureObj.s,
        v: signatureObj.v,
      }).serialized;

      userOp.signature = signature;

      addLog(`Đã ký UserOperation thành công`, 'success');

      // Gửi userOp đến blockchain
      const deployerWallet = new ethers.Wallet(deployer, provider);
      addLog(`Đang gửi UserOperation từ địa chỉ: ${deployerWallet.address}`, 'info');

      // Gửi giao dịch
      const tx = await entryPointContract
        .connect(deployerWallet)
        .xuLyCacThaoTac([userOp], deployerWallet.address, { gasLimit: 5000000 });

      setTxHash(tx.hash);
      addLog(`Giao dịch đã gửi, hash: ${tx.hash}`, 'success');

      // Đợi giao dịch được xác nhận
      addLog('Đang đợi giao dịch được xác nhận...', 'info');
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        addLog('Token HLU đã được phê duyệt thành công!', 'success');
        setStatus('success');

        // Kiểm tra lại allowance
        const newAllowance = await hluContract.allowance(
          scwAddress,
          DEFAULT_CONFIG.electionContract,
        );
        addLog(`Allowance mới: ${ethers.formatEther(newAllowance)} HLU`, 'info');

        // Cập nhật trạng thái
        await checkElectionStatus();
      } else {
        addLog('Giao dịch thất bại!', 'error');
        setStatus('error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      addLog(`Lỗi khi phê duyệt token HLU: ${errorMessage}`, 'error');
      setStatus('error');
    } finally {
      setOperation('');
    }
  }, [
    provider,
    scwAddress,
    sessionKey,
    deployer,
    hluStatus,
    checkSessionKey,
    checkElectionStatus,
    checkDeployerBalance,
    addLog,
  ]);

  // Bắt đầu cuộc bầu cử
  const startElection = useCallback(async () => {
    if (!provider || !scwAddress || !sessionKey || !deployer) {
      addLog('Thiếu thông tin cần thiết', 'warning');
      return;
    }

    try {
      setStatus('loading');
      setOperation('startElection');
      addLog('Bắt đầu quy trình bắt đầu cuộc bầu cử...', 'info');

      // Kiểm tra session key
      const isSessionValid = await checkSessionKey();
      if (!isSessionValid) {
        throw new Error('Session key không hợp lệ hoặc đã hết hạn');
      }

      // Kiểm tra quyền sở hữu
      await checkElectionStatus();
      if (!electionStatus.isOwner) {
        throw new Error('SCW không phải là chủ sở hữu của cuộc bầu cử');
      }

      // Kiểm tra nếu cuộc bầu cử đã hoạt động
      if (electionStatus.isActive) {
        addLog('Cuộc bầu cử đã trong trạng thái hoạt động. Không cần bắt đầu lại.', 'info');
        setStatus('idle');
        return;
      }

      // Kiểm tra quyền BANTOCHUC
      if (!electionStatus.hasBanToChucRole) {
        const grantRoleConfirm = window.confirm(
          'SCW chưa có quyền BANTOCHUC. Bạn có muốn cấp quyền BANTOCHUC trước khi bắt đầu cuộc bầu cử không?',
        );

        if (grantRoleConfirm) {
          await grantBanToChucRole();
          if (!electionStatus.hasBanToChucRole) {
            throw new Error('Không thể cấp quyền BANTOCHUC. Vui lòng thử lại.');
          }
        } else {
          throw new Error('Cần có quyền BANTOCHUC trước khi bắt đầu cuộc bầu cử.');
        }
      }

      // Kiểm tra số dư deployer
      const hasEnoughBalance = await checkDeployerBalance();
      if (!hasEnoughBalance) {
        throw new Error('Số dư ETH của deployer không đủ');
      }

      // Kết nối đến các contracts
      const entryPointContract = new ethers.Contract(
        DEFAULT_CONFIG.entryPointAddress,
        ABI.entryPoint,
        provider,
      );

      const quanLyCuocBauCuContract = new ethers.Contract(
        DEFAULT_CONFIG.electionContract,
        ABI.quanLyCuocBauCu,
        provider,
      );

      const simpleAccountContract = new ethers.Contract(scwAddress, ABI.scw, provider);

      // Lấy nonce
      const currentNonce = await entryPointContract.getNonce(scwAddress);
      addLog(`Nonce hiện tại: ${currentNonce.toString()}`, 'info');

      // Tạo callData cho batDauCuocBauCu
      const thoiGianKeoDai = 7 * 24 * 60 * 60; // 7 ngày
      const batDauCuocBauCuCallData = quanLyCuocBauCuContract.interface.encodeFunctionData(
        'batDauCuocBauCu',
        [
          BigInt(DEFAULT_CONFIG.electionId), // LUÔN LÀ 1
          BigInt(thoiGianKeoDai),
        ],
      );

      addLog(`CallData cho batDauCuocBauCu: ${batDauCuocBauCuCallData}`, 'info');

      // Tạo callData cho execute
      const executeCallData = simpleAccountContract.interface.encodeFunctionData('execute', [
        DEFAULT_CONFIG.electionContract,
        0,
        batDauCuocBauCuCallData,
      ]);

      addLog(`CallData cho execute: ${executeCallData}`, 'info');

      // Chuẩn bị paymasterAndData
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const deadlineTime = currentTimestamp + 3600; // 1 giờ sau
      const validationTime = currentTimestamp;

      const paymasterAndData = ethers.concat([
        DEFAULT_CONFIG.paymasterAddress,
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
      ]);

      // Chuẩn bị UserOperation
      const userOp = {
        sender: scwAddress,
        nonce: currentNonce,
        initCode: '0x',
        callData: executeCallData,
        callGasLimit: BigInt(DEFAULT_CONFIG.callGasLimit),
        verificationGasLimit: BigInt(DEFAULT_CONFIG.verificationGasLimit),
        preVerificationGas: BigInt(DEFAULT_CONFIG.preVerificationGas),
        maxFeePerGas: ethers.parseUnits(DEFAULT_CONFIG.maxFeePerGas.toString(), 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits(
          DEFAULT_CONFIG.maxPriorityFeePerGas.toString(),
          'gwei',
        ),
        paymasterAndData: paymasterAndData,
        signature: '0x',
      };

      // Lấy UserOpHash từ contract
      const userOpHash = await entryPointContract.layHashThaoTac(userOp);
      addLog(`UserOpHash: ${userOpHash}`, 'info');

      // Ký UserOperation
      const signingKey = new ethers.SigningKey(sessionKey);
      const signatureObj = signingKey.sign(ethers.getBytes(userOpHash));

      // Tạo signature theo chuẩn ethers v6
      const signature = ethers.Signature.from({
        r: signatureObj.r,
        s: signatureObj.s,
        v: signatureObj.v,
      }).serialized;

      userOp.signature = signature;

      addLog(`Đã ký UserOperation thành công`, 'success');

      // Gửi userOp đến blockchain
      const deployerWallet = new ethers.Wallet(deployer, provider);
      addLog(`Đang gửi UserOperation từ địa chỉ: ${deployerWallet.address}`, 'info');

      // Gửi giao dịch
      const tx = await entryPointContract
        .connect(deployerWallet)
        .xuLyCacThaoTac([userOp], deployerWallet.address, { gasLimit: 5000000 });

      setTxHash(tx.hash);
      addLog(`Giao dịch đã gửi, hash: ${tx.hash}`, 'success');

      // Đợi giao dịch được xác nhận
      addLog('Đang đợi giao dịch được xác nhận...', 'info');
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        addLog('Cuộc bầu cử đã được bắt đầu thành công!', 'success');
        setStatus('success');

        // Kiểm tra lại trạng thái cuộc bầu cử
        await checkElectionStatus();
      } else {
        addLog('Giao dịch thất bại!', 'error');
        setStatus('error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      addLog(`Lỗi khi bắt đầu cuộc bầu cử: ${errorMessage}`, 'error');
      setStatus('error');
    } finally {
      setOperation('');
    }
  }, [
    provider,
    scwAddress,
    sessionKey,
    deployer,
    electionStatus,
    checkSessionKey,
    checkElectionStatus,
    checkDeployerBalance,
    grantBanToChucRole,
    addLog,
  ]);

  // Triển khai phiên bầu cử
  const deployBallotSession = useCallback(async () => {
    if (!provider || !scwAddress || !sessionKey || !deployer) {
      addLog('Thiếu thông tin cần thiết', 'warning');
      return;
    }

    try {
      setStatus('loading');
      setOperation('deploySession');
      addLog('Bắt đầu quá trình triển khai phiên bầu cử...', 'info');

      // Kiểm tra session key
      const isSessionValid = await checkSessionKey();
      if (!isSessionValid) {
        throw new Error('Session key không hợp lệ hoặc đã hết hạn');
      }

      // Kiểm tra quyền sở hữu và trạng thái
      await checkElectionStatus();

      // Kiểm tra các điều kiện
      const checksNeeded = [];

      if (!electionStatus.isOwner) {
        checksNeeded.push('Quyền sở hữu cuộc bầu cử');
      }

      if (!electionStatus.isActive) {
        checksNeeded.push('Trạng thái cuộc bầu cử hoạt động');
      }

      if (!electionStatus.hasBanToChucRole) {
        checksNeeded.push('Quyền BANTOCHUC');
      }

      if (!hluStatus.isApproved) {
        checksNeeded.push('Phê duyệt token HLU');
      }

      if (checksNeeded.length > 0) {
        const confirmMessage = `Các điều kiện sau chưa thỏa mãn:\n- ${checksNeeded.join('\n- ')}\n\nBạn có muốn tiếp tục thiết lập các điều kiện đó không?`;
        const setupConfirm = window.confirm(confirmMessage);

        if (setupConfirm) {
          // Thiết lập từng điều kiện
          if (!electionStatus.isOwner) {
            throw new Error('SCW không phải là chủ sở hữu cuộc bầu cử. Không thể tiếp tục.');
          }

          if (!electionStatus.hasBanToChucRole) {
            await grantBanToChucRole();
            await checkElectionStatus();
            if (!electionStatus.hasBanToChucRole) {
              throw new Error('Không thể cấp quyền BANTOCHUC. Vui lòng thử lại.');
            }
          }

          if (!hluStatus.isApproved) {
            await approveHluToken();
            await checkElectionStatus();
            if (!hluStatus.isApproved) {
              throw new Error('Không thể phê duyệt token HLU. Vui lòng thử lại.');
            }
          }

          if (!electionStatus.isActive) {
            await startElection();
            await checkElectionStatus();
            if (!electionStatus.isActive) {
              throw new Error('Không thể bắt đầu cuộc bầu cử. Vui lòng thử lại.');
            }
          }
        } else {
          throw new Error('Cần thiết lập đầy đủ các điều kiện trước khi triển khai.');
        }
      }

      // Kiểm tra số dư deployer
      const hasEnoughBalance = await checkDeployerBalance();
      if (!hasEnoughBalance) {
        throw new Error('Số dư ETH của deployer không đủ');
      }

      // Kết nối đến các contracts
      const entryPointContract = new ethers.Contract(
        DEFAULT_CONFIG.entryPointAddress,
        ABI.entryPoint,
        provider,
      );

      const quanLyCuocBauCuContract = new ethers.Contract(
        DEFAULT_CONFIG.electionContract,
        ABI.quanLyCuocBauCu,
        provider,
      );

      const simpleAccountContract = new ethers.Contract(scwAddress, ABI.scw, provider);

      // Lấy nonce
      const currentNonce = await entryPointContract.getNonce(scwAddress);
      addLog(`Nonce hiện tại: ${currentNonce.toString()}`, 'info');

      // Tạo callData cho taoPhienBauCu
      const taoPhienBauCuCallData = quanLyCuocBauCuContract.interface.encodeFunctionData(
        'taoPhienBauCu',
        [
          BigInt(DEFAULT_CONFIG.electionId), // LUÔN LÀ 1
          BigInt(sessionDuration),
          BigInt(maxVoters),
        ],
      );

      addLog(`CallData cho taoPhienBauCu: ${taoPhienBauCuCallData}`, 'info');

      // Tạo callData cho execute
      const executeCallData = simpleAccountContract.interface.encodeFunctionData('execute', [
        DEFAULT_CONFIG.electionContract,
        0,
        taoPhienBauCuCallData,
      ]);

      addLog(`CallData cho execute: ${executeCallData}`, 'info');

      // Chuẩn bị paymasterAndData
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const deadlineTime = currentTimestamp + 3600; // 1 giờ sau
      const validationTime = currentTimestamp;

      // Dùng AbiCoder để mã hóa uint48 như trong luonghoanchinh.js
      const paymasterAndData = ethers.concat([
        DEFAULT_CONFIG.paymasterAddress,
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [deadlineTime]),
        ethers.AbiCoder.defaultAbiCoder().encode(['uint48'], [validationTime]),
      ]);

      // Chuẩn bị UserOperation với gas limits cao hơn
      const userOp = {
        sender: scwAddress,
        nonce: currentNonce,
        initCode: '0x',
        callData: executeCallData,
        callGasLimit: BigInt(DEFAULT_CONFIG.callGasLimit),
        verificationGasLimit: BigInt(DEFAULT_CONFIG.verificationGasLimit),
        preVerificationGas: BigInt(DEFAULT_CONFIG.preVerificationGas),
        maxFeePerGas: ethers.parseUnits(DEFAULT_CONFIG.maxFeePerGas.toString(), 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits(
          DEFAULT_CONFIG.maxPriorityFeePerGas.toString(),
          'gwei',
        ),
        paymasterAndData: paymasterAndData,
        signature: '0x',
      };

      // Lấy UserOpHash từ contract
      const userOpHash = await entryPointContract.layHashThaoTac(userOp);
      addLog(`UserOpHash: ${userOpHash}`, 'info');

      // Ký UserOperation - Sử dụng SigningKey và Signature
      const signingKey = new ethers.SigningKey(sessionKey);
      const signatureObj = signingKey.sign(ethers.getBytes(userOpHash));

      // Tạo signature theo chuẩn ethers v6
      const signature = ethers.Signature.from({
        r: signatureObj.r,
        s: signatureObj.s,
        v: signatureObj.v,
      }).serialized;

      userOp.signature = signature;

      addLog(`Đã ký UserOperation thành công`, 'success');

      // Gửi UserOperation từ deployer
      const deployerWallet = new ethers.Wallet(deployer, provider);
      addLog(`Đang gửi UserOperation từ địa chỉ: ${deployerWallet.address}`, 'info');

      // Gửi giao dịch với gas limit cao hơn
      const tx = await entryPointContract.connect(deployerWallet).xuLyCacThaoTac(
        [userOp],
        deployerWallet.address,
        { gasLimit: 5000000 }, // Gas limit cao cho EntryPoint
      );

      setTxHash(tx.hash);
      addLog(`Giao dịch đã gửi, hash: ${tx.hash}`, 'success');

      // Đợi giao dịch được xác nhận
      addLog('Đang đợi giao dịch được xác nhận...', 'info');
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        addLog('Giao dịch đã được xác nhận thành công!', 'success');
        setStatus('success');

        // Tìm event PhienBauCuDaTao để lấy ID phiên bầu cử
        try {
          const phienBauCuEvents = receipt.logs
            .map((log) => {
              try {
                return quanLyCuocBauCuContract.interface.parseLog({
                  topics: log.topics,
                  data: log.data,
                });
              } catch (e) {
                return null;
              }
            })
            .filter((event) => event && event.name === 'PhienBauCuDaTao');

          if (phienBauCuEvents && phienBauCuEvents.length > 0) {
            const phienBauCuId = phienBauCuEvents[0].args[1];
            addLog(`ID phiên bầu cử mới: ${phienBauCuId.toString()}`, 'success');
          } else {
            addLog('Không thể xác định ID phiên bầu cử mới từ event', 'warning');
          }
        } catch (eventError) {
          addLog(`Lỗi khi phân tích event: ${(eventError as Error).message}`, 'warning');
        }
      } else {
        addLog('Giao dịch thất bại!', 'error');
        setStatus('error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      addLog(`Lỗi khi triển khai phiên bầu cử: ${errorMessage}`, 'error');
      setStatus('error');
    } finally {
      setOperation('');
    }
  }, [
    provider,
    scwAddress,
    sessionKey,
    sessionDuration,
    maxVoters,
    deployer,
    electionStatus,
    hluStatus,
    checkSessionKey,
    checkElectionStatus,
    checkDeployerBalance,
    grantBanToChucRole,
    approveHluToken,
    startElection,
    addLog,
  ]);

  // Xóa logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Kiểm tra tất cả điều kiện
  const checkAllConditions = useCallback(async () => {
    if (!provider || !scwAddress || !sessionKey || !deployer) {
      addLog('Thiếu thông tin cần thiết', 'warning');
      return;
    }

    setStatus('loading');
    setOperation('checkAll');
    addLog('Kiểm tra tất cả điều kiện trước khi triển khai...', 'info');

    try {
      // Kiểm tra session key
      const isSessionValid = await checkSessionKey();
      if (!isSessionValid) {
        addLog('❌ Session key không hợp lệ hoặc đã hết hạn', 'error');
      } else {
        addLog('✅ Session key hợp lệ', 'success');
      }

      // Kiểm tra quyền sở hữu và điều kiện cuộc bầu cử
      await checkElectionStatus();

      addLog(
        `${electionStatus.isOwner ? '✅' : '❌'} Quyền sở hữu cuộc bầu cử`,
        electionStatus.isOwner ? 'success' : 'error',
      );
      addLog(
        `${electionStatus.isActive ? '✅' : '❌'} Trạng thái cuộc bầu cử hoạt động`,
        electionStatus.isActive ? 'success' : 'warning',
      );
      addLog(
        `${electionStatus.hasBanToChucRole ? '✅' : '❌'} Quyền BANTOCHUC`,
        electionStatus.hasBanToChucRole ? 'success' : 'warning',
      );
      addLog(
        `${hluStatus.isApproved ? '✅' : '❌'} Phê duyệt token HLU`,
        hluStatus.isApproved ? 'success' : 'warning',
      );

      // Kiểm tra số dư deployer
      const hasEnoughBalance = await checkDeployerBalance();
      addLog(
        `${hasEnoughBalance ? '✅' : '❌'} Số dư ETH đủ để trả phí gas`,
        hasEnoughBalance ? 'success' : 'warning',
      );

      const allConditionsMet =
        isSessionValid &&
        electionStatus.isOwner &&
        electionStatus.isActive &&
        electionStatus.hasBanToChucRole &&
        hluStatus.isApproved &&
        hasEnoughBalance;

      if (allConditionsMet) {
        addLog('✅ Tất cả điều kiện đều đã thỏa mãn! Có thể triển khai phiên bầu cử.', 'success');
      } else {
        addLog(
          '⚠️ Một số điều kiện chưa thỏa mãn. Cần thiết lập đầy đủ trước khi triển khai.',
          'warning',
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      addLog(`Lỗi khi kiểm tra điều kiện: ${errorMessage}`, 'error');
    } finally {
      setStatus('idle');
      setOperation('');
    }
  }, [
    provider,
    scwAddress,
    sessionKey,
    deployer,
    checkSessionKey,
    checkElectionStatus,
    checkDeployerBalance,
    electionStatus,
    hluStatus,
    addLog,
  ]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-6">
        Triển Khai Phiên Bầu Cử Lên Blockchain
      </h1>

      {/* Thông tin Provider */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Thông tin Kết Nối</h2>
        <p>
          <strong>Provider:</strong> {DEFAULT_CONFIG.providerUrl}
          <br />
          <strong>EntryPoint:</strong> {DEFAULT_CONFIG.entryPointAddress}
          <br />
          <strong>Paymaster:</strong> {DEFAULT_CONFIG.paymasterAddress}
          <br />
          <strong>Hợp đồng cuộc bầu cử:</strong> {DEFAULT_CONFIG.electionContract}
          <br />
          <strong>Token HLU:</strong> {DEFAULT_CONFIG.hluTokenAddress}
        </p>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa Chỉ SCW (Ví Thông Minh)
          </label>
          <input
            type="text"
            value={scwAddress}
            onChange={(e) => setScwAddress(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="0x..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Session Key (Private Key)
          </label>
          <input
            type="text"
            value={sessionKey}
            onChange={(e) => setSessionKey(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="0x..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thời Gian Kéo Dài (giây)
          </label>
          <input
            type="number"
            value={sessionDuration}
            onChange={(e) => setSessionDuration(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">Mặc định: 3 ngày = {3 * 24 * 60 * 60} giây</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số Cử Tri Tối Đa</label>
          <input
            type="number"
            value={maxVoters}
            onChange={(e) => setMaxVoters(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deployer Private Key (Để Gửi Giao Dịch)
          </label>
          <input
            type="password"
            value={deployer}
            onChange={(e) => setDeployer(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="0x..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Cần có ETH để trả phí gas.{' '}
            {deployerBalance ? `Số dư hiện tại: ${deployerBalance} ETH` : ''}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gas Settings (Đã tăng lên để đảm bảo thành công)
          </label>
          <div className="text-sm p-2 bg-gray-50 rounded-md">
            <p>Call Gas: {DEFAULT_CONFIG.callGasLimit}</p>
            <p>Verification Gas: {DEFAULT_CONFIG.verificationGasLimit}</p>
            <p>Max Fee: {DEFAULT_CONFIG.maxFeePerGas} Gwei</p>
          </div>
        </div>
      </div>

      {/* Trạng thái Session Key */}
      {sessionInfo.expiration > 0 && (
        <div className={`mb-4 p-4 rounded-lg ${sessionInfo.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
          <h2 className="text-lg font-semibold mb-2">Thông Tin Session Key</h2>
          <p>
            <strong>Thời hạn:</strong> {new Date(sessionInfo.expiration * 1000).toLocaleString()}
            <br />
            <strong>Trạng thái:</strong> {sessionInfo.isValid ? '✅ Còn hạn' : '❌ Đã hết hạn'}
          </p>
        </div>
      )}

      {/* Thông tin trạng thái cuộc bầu cử */}
      {electionStatus.owner && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            electionStatus.isOwner
              ? electionStatus.isActive
                ? 'bg-green-50'
                : 'bg-yellow-50'
              : 'bg-red-50'
          }`}
        >
          <h2 className="text-lg font-semibold mb-2">Thông Tin Cuộc Bầu Cử</h2>
          <p>
            <strong>Chủ sở hữu cuộc bầu cử:</strong> {electionStatus.owner}
            <br />
            <strong>Quyền sở hữu:</strong>{' '}
            {electionStatus.isOwner ? '✅ SCW là chủ sở hữu' : '❌ SCW KHÔNG phải là chủ sở hữu'}
            <br />
            <strong>Trạng thái:</strong>{' '}
            {electionStatus.isActive
              ? '✅ Đang hoạt động'
              : '⚠️ Chưa hoạt động (cần bắt đầu cuộc bầu cử trước)'}
            <br />
            <strong>Quyền BANTOCHUC:</strong>{' '}
            {electionStatus.hasBanToChucRole ? '✅ Có' : '❌ Không'}
          </p>
          {hluStatus.balance && (
            <p className="mt-2">
              <strong>Số dư HLU:</strong> {hluStatus.balance} HLU
              <br />
              <strong>Phê duyệt HLU:</strong> {hluStatus.allowance} HLU
              {hluStatus.isApproved ? ' ✅' : ' ❌ (cần phê duyệt ít nhất 3 HLU)'}
            </p>
          )}
        </div>
      )}

      {/* Thông tin giao dịch */}
      {txHash && (
        <div className="mb-4 p-4 bg-purple-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Thông Tin Giao Dịch</h2>
          <p>
            <strong>Hash:</strong> {txHash}
            <br />
            <a
              href={`https://explorer.holihu.online/transactions/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              Xem trên blockchain explorer
            </a>
          </p>
        </div>
      )}

      {/* Buttons - Kiểm tra cơ bản */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={checkSessionKey}
          disabled={!provider || !scwAddress || !sessionKey || status === 'loading'}
          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Kiểm Tra Session Key
        </button>

        <button
          onClick={checkElectionStatus}
          disabled={!provider || !scwAddress || status === 'loading'}
          className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Kiểm Tra Cuộc Bầu Cử
        </button>

        <button
          onClick={checkDeployerBalance}
          disabled={!provider || !deployer || status === 'loading'}
          className="flex-1 bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Kiểm Tra Số Dư
        </button>

        <button
          onClick={checkAllConditions}
          disabled={!provider || !scwAddress || !sessionKey || !deployer || status === 'loading'}
          className="flex-1 bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Kiểm Tra Tất Cả
        </button>
      </div>

      {/* Phần nút thiết lập các điều kiện */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Nút cấp quyền BANTOCHUC */}
        <button
          onClick={grantBanToChucRole}
          disabled={
            !provider ||
            !scwAddress ||
            !sessionKey ||
            !deployer ||
            status === 'loading' ||
            !sessionInfo.isValid ||
            !electionStatus.isOwner ||
            electionStatus.hasBanToChucRole
          }
          className={`w-1/3 py-3 px-4 rounded-md text-white font-medium
                    ${operation === 'grantRole' ? 'bg-orange-400' : 'bg-orange-500'} 
                    hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed 
                    ${electionStatus.hasBanToChucRole ? 'opacity-50' : ''}`}
        >
          {status === 'loading' && operation === 'grantRole'
            ? 'Đang Xử Lý...'
            : electionStatus.hasBanToChucRole
              ? '✓ Đã Có Quyền BANTOCHUC'
              : '1. Cấp Quyền BANTOCHUC'}
        </button>

        {/* Nút phê duyệt token HLU */}
        <button
          onClick={approveHluToken}
          disabled={
            !provider ||
            !scwAddress ||
            !sessionKey ||
            !deployer ||
            status === 'loading' ||
            !sessionInfo.isValid ||
            !electionStatus.isOwner ||
            hluStatus.isApproved
          }
          className={`w-1/3 py-3 px-4 rounded-md text-white font-medium
                    ${operation === 'approveToken' ? 'bg-blue-400' : 'bg-blue-500'} 
                    hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed 
                    ${hluStatus.isApproved ? 'opacity-50' : ''}`}
        >
          {status === 'loading' && operation === 'approveToken'
            ? 'Đang Xử Lý...'
            : hluStatus.isApproved
              ? '✓ Đã Phê Duyệt HLU'
              : '2. Phê Duyệt Token HLU'}
        </button>

        {/* Nút bắt đầu cuộc bầu cử */}
        <button
          onClick={startElection}
          disabled={
            !provider ||
            !scwAddress ||
            !sessionKey ||
            !deployer ||
            status === 'loading' ||
            !sessionInfo.isValid ||
            !electionStatus.isOwner ||
            electionStatus.isActive
          }
          className={`w-1/3 py-3 px-4 rounded-md text-white font-medium 
                    ${operation === 'startElection' ? 'bg-green-400' : 'bg-green-500'} 
                    hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed 
                    ${electionStatus.isActive ? 'opacity-50' : ''}`}
        >
          {status === 'loading' && operation === 'startElection'
            ? 'Đang Xử Lý...'
            : electionStatus.isActive
              ? '✓ Cuộc Bầu Cử Đang Hoạt Động'
              : '3. Bắt Đầu Cuộc Bầu Cử'}
        </button>
      </div>

      {/* Nút triển khai phiên bầu cử */}
      <button
        onClick={deployBallotSession}
        disabled={
          !provider ||
          !scwAddress ||
          !sessionKey ||
          !deployer ||
          status === 'loading' ||
          !sessionInfo.isValid ||
          !electionStatus.isOwner
        }
        className={`w-full py-3 px-4 rounded-md text-white font-semibold text-lg
                  ${operation === 'deploySession' ? 'bg-purple-500' : 'bg-purple-600'} 
                  hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed mb-6`}
      >
        {status === 'loading' && operation === 'deploySession'
          ? 'Đang Xử Lý...'
          : '4. Triển Khai Phiên Bầu Cử'}
      </button>

      {/* Checklist */}
      <div className="mb-6 p-4 rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">Checklist Triển Khai</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div
            className={`p-2 rounded flex items-center ${sessionInfo.isValid ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}
          >
            <span className="mr-2">{sessionInfo.isValid ? '✅' : '⬜'}</span>
            <span>Session key còn hiệu lực</span>
          </div>
          <div
            className={`p-2 rounded flex items-center ${electionStatus.isOwner ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}
          >
            <span className="mr-2">{electionStatus.isOwner ? '✅' : '⬜'}</span>
            <span>SCW là chủ sở hữu cuộc bầu cử</span>
          </div>
          <div
            className={`p-2 rounded flex items-center ${electionStatus.hasBanToChucRole ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}
          >
            <span className="mr-2">{electionStatus.hasBanToChucRole ? '✅' : '⬜'}</span>
            <span>SCW có quyền BANTOCHUC</span>
          </div>
          <div
            className={`p-2 rounded flex items-center ${hluStatus.isApproved ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}
          >
            <span className="mr-2">{hluStatus.isApproved ? '✅' : '⬜'}</span>
            <span>Đã phê duyệt token HLU</span>
          </div>
          <div
            className={`p-2 rounded flex items-center ${electionStatus.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}
          >
            <span className="mr-2">{electionStatus.isActive ? '✅' : '⬜'}</span>
            <span>Cuộc bầu cử đang hoạt động</span>
          </div>
          <div
            className={`p-2 rounded flex items-center ${deployerBalance && Number(deployerBalance) > 0.1 ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}
          >
            <span className="mr-2">
              {deployerBalance && Number(deployerBalance) > 0.1 ? '✅' : '⬜'}
            </span>
            <span>Số dư ETH đủ để trả phí gas</span>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Log</h2>
          <button
            onClick={clearLogs}
            className="text-sm text-gray-600 hover:text-gray-800 bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
          >
            Xóa Log
          </button>
        </div>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">Không có log nào</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`mb-1 ${
                  log.type === 'success'
                    ? 'text-green-400'
                    : log.type === 'error'
                      ? 'text-red-400'
                      : log.type === 'warning'
                        ? 'text-yellow-400'
                        : 'text-blue-400'
                }`}
              >
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lưu ý */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Quy trình triển khai phiên bầu cử</h2>
        <ol className="list-decimal pl-6">
          <li className="mb-1">
            <strong>Cấp quyền BANTOCHUC cho SCW</strong> - SCW cần có quyền này để tương tác với hợp
            đồng
          </li>
          <li className="mb-1">
            <strong>Phê duyệt token HLU</strong> - SCW phải phê duyệt ít nhất 3 HLU cho hợp đồng
            QuanLyCuocBauCu
          </li>
          <li className="mb-1">
            <strong>Bắt đầu cuộc bầu cử</strong> - Cuộc bầu cử phải ở trạng thái hoạt động trước khi
            tạo phiên
          </li>
          <li className="mb-1">
            <strong>Triển khai phiên bầu cử</strong> - Sau khi tất cả điều kiện trên được đáp ứng
          </li>
        </ol>
        <p className="mt-3 text-sm text-gray-700">
          Làm theo đúng thứ tự các bước trên để đảm bảo triển khai thành công.
        </p>
      </div>

      {/* Thông tin debug */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-gray-600 text-xs">
        <details>
          <summary className="cursor-pointer">Thông tin debug</summary>
          <div className="mt-2">
            <p>
              Session Key Address:{' '}
              {sessionInfo.expiration > 0
                ? ethers.computeAddress(new ethers.SigningKey(sessionKey).publicKey)
                : 'Chưa kiểm tra'}
            </p>
            <p>Deployer Address: {deployer ? new ethers.Wallet(deployer).address : 'Chưa nhập'}</p>
            <p>
              Gas Settings:{' '}
              {`${DEFAULT_CONFIG.callGasLimit}/${DEFAULT_CONFIG.verificationGasLimit}/${DEFAULT_CONFIG.preVerificationGas}`}
            </p>
            <p>
              Gas Price:{' '}
              {`${DEFAULT_CONFIG.maxFeePerGas}/${DEFAULT_CONFIG.maxPriorityFeePerGas} Gwei`}
            </p>
            <p>Election Status: {electionStatus.isActive ? 'Active' : 'Inactive'}</p>
            <p>BANTOCHUC Role: {electionStatus.hasBanToChucRole ? 'Granted' : 'Not Granted'}</p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default BallotDeployer;
