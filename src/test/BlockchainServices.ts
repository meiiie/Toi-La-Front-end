// Dịch vụ xử lý các hoạt động liên quan đến blockchain
import { ethers } from 'ethers';
import apiClient from '../api/apiClient';

// Các interface
export interface SessionKeyInfo {
  sessionKey: string;
  expiresAt: number;
  scwAddress: string;
}

export interface UserOperation {
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

export interface TokenBalances {
  hluBalance: string;
  allowanceForFactory: string;
  allowanceForPaymaster: string;
}

export interface ContractAddresses {
  entryPointAddress: string;
  factoryAddress: string;
  paymasterAddress: string;
  hluTokenAddress: string;
  chainId: number;
}

// Lấy session key từ backend hoặc tạo mới
export const getSessionKey = async (taiKhoanId: string, viId: string): Promise<SessionKeyInfo> => {
  try {
    // Gọi API để lấy session key
    const response = await apiClient.post('/api/Blockchain/get-session-key', {
      TaiKhoanID: Number.parseInt(taiKhoanId, 10),
      ViID: Number.parseInt(viId, 10),
    });

    if (response.data && response.data.success && response.data.sessionKey) {
      return {
        sessionKey: response.data.sessionKey,
        expiresAt: response.data.expiresAt,
        scwAddress: response.data.scwAddress,
      };
    } else {
      throw new Error(response.data?.message || 'Không thể lấy session key');
    }
  } catch (error) {
    console.error('Lỗi khi lấy session key:', error);
    // Nếu không lấy được, thử tạo mới
    const createResponse = await apiClient.post('/api/Blockchain/create-session', {
      TaiKhoanID: Number.parseInt(taiKhoanId, 10),
      ViID: Number.parseInt(viId, 10),
    });

    if (createResponse.data && createResponse.data.success) {
      // Gọi lại API get-session-key để lấy key mới
      return getSessionKey(taiKhoanId, viId);
    } else {
      throw new Error(createResponse.data?.message || 'Không thể tạo session key mới');
    }
  }
};

// Lấy địa chỉ contract
export const getContractAddresses = async (): Promise<ContractAddresses> => {
  try {
    const response = await apiClient.get('/api/Blockchain/contract-addresses');
    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error('Không thể lấy địa chỉ contract');
    }
  } catch (error) {
    console.error('Lỗi khi lấy địa chỉ contract:', error);
    throw error;
  }
};

// Lấy số dư token HLU và allowance
export const getTokenBalances = async (scwAddress: string): Promise<TokenBalances> => {
  try {
    // Lấy HLU balance
    const balanceResponse = await apiClient.get(
      `/api/Blockchain/token-balance?scwAddress=${scwAddress}`,
    );

    // Lấy Factory allowance
    const factoryAllowanceResponse = await apiClient.get(
      `/api/Blockchain/check-allowance?scwAddress=${scwAddress}&spenderType=factory`,
    );

    // Lấy Paymaster allowance
    const paymasterAllowanceResponse = await apiClient.get(
      `/api/Blockchain/check-allowance?scwAddress=${scwAddress}&spenderType=paymaster`,
    );

    return {
      hluBalance: balanceResponse.data?.balance?.toString() || '0',
      allowanceForFactory: factoryAllowanceResponse.data?.allowance?.toString() || '0',
      allowanceForPaymaster: paymasterAllowanceResponse.data?.allowance?.toString() || '0',
    };
  } catch (error) {
    console.error('Lỗi khi lấy số dư và allowance:', error);
    return {
      hluBalance: '0',
      allowanceForFactory: '0',
      allowanceForPaymaster: '0',
    };
  }
};

// Approve token HLU cho Factory
export const approveFactory = async (
  scwAddress: string,
  sessionKey: SessionKeyInfo,
  onProgress?: (message: string) => void,
): Promise<boolean> => {
  try {
    const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
    const contractAddresses = await getContractAddresses();

    onProgress?.('Lấy thông tin nonce...');

    // Lấy nonce
    const entryPointAbi = [
      'function getNonce(address sender) external view returns (uint256)',
      'function nonceNguoiGui(address) view returns (uint256)',
      'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
    ];

    const entryPointContract = new ethers.Contract(
      contractAddresses.entryPointAddress,
      entryPointAbi,
      provider,
    );

    let nonce;
    try {
      nonce = await entryPointContract.getNonce(scwAddress);
    } catch (nonceError) {
      nonce = await entryPointContract.nonceNguoiGui(scwAddress);
    }

    onProgress?.('Chuẩn bị dữ liệu approval...');

    // Chuẩn bị callData cho approve Factory
    const hluTokenAbi = [
      'function approve(address spender, uint256 amount) external returns (bool)',
    ];
    const hluTokenContract = new ethers.Contract(
      contractAddresses.hluTokenAddress,
      hluTokenAbi,
      provider,
    );

    const approveCallData = hluTokenContract.interface.encodeFunctionData('approve', [
      contractAddresses.factoryAddress,
      ethers.parseEther('10'), // Approve 10 HLU
    ]);

    // Chuẩn bị callData cho SCW
    const scwAbi = [
      'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
    ];
    const scwContract = new ethers.Contract(scwAddress, scwAbi, provider);

    const executeCallData = scwContract.interface.encodeFunctionData('execute', [
      contractAddresses.hluTokenAddress,
      0,
      approveCallData,
    ]);

    // Chuẩn bị paymasterAndData
    onProgress?.('Tạo UserOperation...');

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const deadlineTime = currentTimestamp + 3600; // 1 giờ sau
    const validationTime = currentTimestamp;

    // Không sử dụng paymaster cho bước approve đầu tiên nếu chưa có allowance
    const userOp = {
      sender: scwAddress,
      nonce: nonce.toString(),
      initCode: '0x',
      callData: executeCallData,
      callGasLimit: '1000000',
      verificationGasLimit: '1000000',
      preVerificationGas: '300000',
      maxFeePerGas: ethers.parseUnits('10', 'gwei').toString(),
      maxPriorityFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
      paymasterAndData: '0x', // Không dùng paymaster
      signature: '0x',
    };

    // Ký UserOperation
    onProgress?.('Ký UserOperation...');

    const userOpHash = await entryPointContract.layHashThaoTac(userOp);
    const signingKey = new ethers.SigningKey(sessionKey.sessionKey);
    const signatureObj = signingKey.sign(ethers.getBytes(userOpHash));

    userOp.signature = ethers.Signature.from({
      r: signatureObj.r,
      s: signatureObj.s,
      v: signatureObj.v,
    }).serialized;

    // Gửi UserOperation
    onProgress?.('Gửi giao dịch approve Factory...');

    const response = await apiClient.post('/api/bundler/submit', {
      ...userOp,
      userOpHash,
    });

    if (response.data && (response.data.status === 'success' || response.data.userOpHash)) {
      onProgress?.('Đã gửi giao dịch approve Factory thành công, đang chờ xác nhận...');
      return true;
    } else {
      throw new Error(response.data?.message || 'Không thể gửi UserOperation approve Factory');
    }
  } catch (error) {
    console.error('Lỗi khi approve Factory:', error);
    throw error;
  }
};

// Approve token HLU cho Paymaster
export const approvePaymaster = async (
  scwAddress: string,
  sessionKey: SessionKeyInfo,
  onProgress?: (message: string) => void,
): Promise<boolean> => {
  try {
    const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
    const contractAddresses = await getContractAddresses();

    onProgress?.('Lấy thông tin nonce...');

    // Lấy nonce
    const entryPointAbi = [
      'function getNonce(address sender) external view returns (uint256)',
      'function nonceNguoiGui(address) view returns (uint256)',
      'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
    ];

    const entryPointContract = new ethers.Contract(
      contractAddresses.entryPointAddress,
      entryPointAbi,
      provider,
    );

    let nonce;
    try {
      nonce = await entryPointContract.getNonce(scwAddress);
    } catch (nonceError) {
      nonce = await entryPointContract.nonceNguoiGui(scwAddress);
    }

    onProgress?.('Chuẩn bị dữ liệu approval...');

    // Chuẩn bị callData cho approve Paymaster
    const hluTokenAbi = [
      'function approve(address spender, uint256 amount) external returns (bool)',
    ];
    const hluTokenContract = new ethers.Contract(
      contractAddresses.hluTokenAddress,
      hluTokenAbi,
      provider,
    );

    const approveCallData = hluTokenContract.interface.encodeFunctionData('approve', [
      contractAddresses.paymasterAddress,
      ethers.parseEther('5'), // Approve 5 HLU
    ]);

    // Chuẩn bị callData cho SCW
    const scwAbi = [
      'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
    ];
    const scwContract = new ethers.Contract(scwAddress, scwAbi, provider);

    const executeCallData = scwContract.interface.encodeFunctionData('execute', [
      contractAddresses.hluTokenAddress,
      0,
      approveCallData,
    ]);

    // Chuẩn bị paymasterAndData
    onProgress?.('Tạo UserOperation...');

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const deadlineTime = currentTimestamp + 3600; // 1 giờ sau
    const validationTime = currentTimestamp;

    // Không sử dụng paymaster cho bước approve
    const userOp = {
      sender: scwAddress,
      nonce: nonce.toString(),
      initCode: '0x',
      callData: executeCallData,
      callGasLimit: '1000000',
      verificationGasLimit: '1000000',
      preVerificationGas: '300000',
      maxFeePerGas: ethers.parseUnits('10', 'gwei').toString(),
      maxPriorityFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
      paymasterAndData: '0x', // Không dùng paymaster
      signature: '0x',
    };

    // Ký UserOperation
    onProgress?.('Ký UserOperation...');

    const userOpHash = await entryPointContract.layHashThaoTac(userOp);
    const signingKey = new ethers.SigningKey(sessionKey.sessionKey);
    const signatureObj = signingKey.sign(ethers.getBytes(userOpHash));

    userOp.signature = ethers.Signature.from({
      r: signatureObj.r,
      s: signatureObj.s,
      v: signatureObj.v,
    }).serialized;

    // Gửi UserOperation
    onProgress?.('Gửi giao dịch approve Paymaster...');

    const response = await apiClient.post('/api/bundler/submit', {
      ...userOp,
      userOpHash,
    });

    if (response.data && (response.data.status === 'success' || response.data.userOpHash)) {
      onProgress?.('Đã gửi giao dịch approve Paymaster thành công, đang chờ xác nhận...');
      return true;
    } else {
      throw new Error(response.data?.message || 'Không thể gửi UserOperation approve Paymaster');
    }
  } catch (error) {
    console.error('Lỗi khi approve Paymaster:', error);
    throw error;
  }
};

// Liên kết hash frontend và backend
export const linkHashes = async (
  frontendHash: string,
  backendHash: string,
  sender: string,
): Promise<boolean> => {
  try {
    const response = await apiClient.post('/api/bundler/link-hashes', {
      frontendHash,
      backendHash,
      sender,
    });

    return response.data?.success || false;
  } catch (error) {
    console.error('Lỗi khi liên kết hash:', error);
    return false;
  }
};

// Kiểm tra trạng thái giao dịch
export const checkTransactionStatus = async (
  txHash: string,
  relatedHash?: string,
): Promise<{
  status: 'success' | 'pending' | 'failed' | 'unknown';
  message?: string;
  resultTxHash?: string;
}> => {
  try {
    // Thử kiểm tra với hash chính
    const response = await apiClient.get(`/api/bundler/check-status?userOpHash=${txHash}`);

    if (response.data) {
      if (response.data.status === 'success') {
        return {
          status: 'success',
          message: 'Giao dịch đã được xác nhận thành công',
          resultTxHash: response.data.txHash || txHash,
        };
      } else if (response.data.status === 'failed') {
        // Nếu hash chính thất bại và có hash liên quan, thử kiểm tra hash liên quan
        if (relatedHash && relatedHash !== txHash) {
          return checkTransactionStatus(relatedHash);
        }

        return {
          status: 'failed',
          message: response.data.message || 'Giao dịch thất bại',
        };
      } else if (response.data.status === 'pending') {
        return {
          status: 'pending',
          message: 'Giao dịch đang chờ xác nhận',
          resultTxHash: response.data.txHash || txHash,
        };
      } else if (response.data.status === 'unknown') {
        // Nếu hash chính không tìm thấy và có hash liên quan, thử kiểm tra hash liên quan
        if (relatedHash && relatedHash !== txHash) {
          return checkTransactionStatus(relatedHash);
        }

        return {
          status: 'unknown',
          message: 'Không tìm thấy thông tin giao dịch',
        };
      }
    }

    return {
      status: 'unknown',
      message: 'Không thể kiểm tra trạng thái giao dịch',
    };
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái giao dịch:', error);
    return {
      status: 'unknown',
      message: `Lỗi khi kiểm tra trạng thái: ${(error as Error).message}`,
    };
  }
};

// Tính thời gian kéo dài từ chuỗi ngày tháng
export const calculateDuration = (startDateStr: string, endDateStr: string): number => {
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
};

// Ký UserOperation
export const signUserOp = (userOpHash: string, sessionKeyPrivate: string): string => {
  try {
    // Chuyển userOpHash thành bytes
    const userOpHashBytes = ethers.getBytes(userOpHash);

    // Sử dụng SigningKey để ký
    const signingKey = new ethers.SigningKey(sessionKeyPrivate);
    const signatureObj = signingKey.sign(userOpHashBytes);

    // Tạo signature theo chuẩn ethers v6
    const signature = ethers.Signature.from({
      r: signatureObj.r,
      s: signatureObj.s,
      v: signatureObj.v,
    }).serialized;

    return signature;
  } catch (error) {
    console.error('Lỗi khi ký UserOperation:', error);
    throw error;
  }
};

// Triển khai cuộc bầu cử
export const deployElection = async (
  electionData: {
    tenCuocBauCu: string;
    moTa: string;
    ngayBatDau: string;
    ngayKetThuc: string;
  },
  sessionKey: SessionKeyInfo,
  onProgress?: (message: string) => void,
): Promise<{
  success: boolean;
  txHash?: string;
  frontendHash?: string;
  backendHash?: string;
  message?: string;
}> => {
  try {
    const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
    const contractAddresses = await getContractAddresses();

    onProgress?.('Lấy thông tin nonce...');

    // Lấy nonce
    const entryPointAbi = [
      'function getNonce(address sender) external view returns (uint256)',
      'function nonceNguoiGui(address) view returns (uint256)',
      'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
    ];

    const entryPointContract = new ethers.Contract(
      contractAddresses.entryPointAddress,
      entryPointAbi,
      provider,
    );

    let nonce;
    try {
      nonce = await entryPointContract.getNonce(sessionKey.scwAddress);
    } catch (nonceError) {
      nonce = await entryPointContract.nonceNguoiGui(sessionKey.scwAddress);
    }

    onProgress?.('Chuẩn bị dữ liệu cuộc bầu cử...');

    // Tính thời gian kéo dài
    const thoiGianKeoDai = calculateDuration(electionData.ngayBatDau, electionData.ngayKetThuc);

    // Thêm timestamp để đảm bảo tên là duy nhất
    const timestamp = Math.floor(Date.now() / 1000);
    const randomValue = Math.floor(Math.random() * 1000000);
    const tenCuocBauCuUnique = `${electionData.tenCuocBauCu}-${timestamp}-${randomValue}`;
    const moTaUnique = `${electionData.moTa || 'Không có mô tả'} (ID: ${timestamp}-${randomValue})`;

    // Tạo callData cho cuộc bầu cử
    const factoryAbi = [
      'function trienKhaiServer(string memory tenCuocBauCu, uint256 thoiGianKeoDai, string memory moTa) external returns (uint256)',
    ];
    const factoryContract = new ethers.Contract(
      contractAddresses.factoryAddress,
      factoryAbi,
      provider,
    );

    // Chuẩn bị callData
    const functionSignature = 'trienKhaiServer(string,uint256,string)';
    const functionSelector = ethers
      .keccak256(ethers.toUtf8Bytes(functionSignature))
      .substring(0, 10);

    const abiCoder = new ethers.AbiCoder();
    const encodedParams = abiCoder
      .encode(
        ['string', 'uint256', 'string'],
        [tenCuocBauCuUnique, thoiGianKeoDai.toString(), moTaUnique],
      )
      .substring(2); // remove '0x'

    const innerCallData = functionSelector + encodedParams;

    // Tạo callData cho hàm execute của SCW
    const executeSignature = 'execute(address,uint256,bytes)';
    const executeSelector = ethers.keccak256(ethers.toUtf8Bytes(executeSignature)).substring(0, 10);

    const executeParams = abiCoder
      .encode(
        ['address', 'uint256', 'bytes'],
        [contractAddresses.factoryAddress, '0', innerCallData],
      )
      .substring(2); // remove '0x'

    const callData = executeSelector + executeParams;

    // Chuẩn bị paymasterAndData
    onProgress?.('Tạo UserOperation...');

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const deadlineTime = currentTimestamp + 3600; // 1 giờ sau
    const validationTime = currentTimestamp;

    const paymasterAndData = ethers.concat([
      contractAddresses.paymasterAddress,
      abiCoder.encode(['uint48'], [deadlineTime]),
      abiCoder.encode(['uint48'], [validationTime]),
    ]);

    // Chuẩn bị UserOperation
    const userOp = {
      sender: sessionKey.scwAddress,
      nonce: nonce.toString(),
      initCode: '0x',
      callData: callData,
      callGasLimit: '2000000',
      verificationGasLimit: '2000000',
      preVerificationGas: '500000',
      maxFeePerGas: ethers.parseUnits('10', 'gwei').toString(),
      maxPriorityFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
      paymasterAndData: paymasterAndData,
      signature: '0x',
    };

    // Lấy UserOpHash
    const userOpHash = await entryPointContract.layHashThaoTac(userOp);

    // Ký UserOperation
    onProgress?.('Ký UserOperation...');

    const signature = signUserOp(userOpHash, sessionKey.sessionKey);
    userOp.signature = signature;

    // Gửi UserOperation
    onProgress?.('Gửi giao dịch triển khai cuộc bầu cử...');

    const response = await apiClient.post('/api/bundler/submit', {
      ...userOp,
      userOpHash,
    });

    if (response.data) {
      const frontendUserOpHash = response.data.userOpHash || userOpHash;
      const backendUserOpHash = response.data.backendHash || frontendUserOpHash;
      const txHash = response.data.txHash || frontendUserOpHash;

      // Liên kết hash nếu khác nhau
      if (frontendUserOpHash !== backendUserOpHash) {
        await linkHashes(frontendUserOpHash, backendUserOpHash, userOp.sender);
      }

      onProgress?.('Đã gửi giao dịch triển khai cuộc bầu cử thành công, đang chờ xác nhận...');

      return {
        success: true,
        txHash,
        frontendHash: frontendUserOpHash,
        backendHash: backendUserOpHash,
        message: 'Đã gửi giao dịch triển khai cuộc bầu cử',
      };
    } else {
      throw new Error('Không nhận được phản hồi từ bundler');
    }
  } catch (error) {
    console.error('Lỗi khi triển khai cuộc bầu cử:', error);
    return {
      success: false,
      message: `Lỗi khi triển khai cuộc bầu cử: ${(error as Error).message}`,
    };
  }
};

// Triển khai phiên bầu cử
export const deploySession = async (
  sessionData: {
    tenPhienBauCu: string;
    moTa: string;
    ngayBatDau: string;
    ngayKetThuc: string;
    soCuTriToiDa: number;
  },
  electionContractAddress: string,
  sessionKey: SessionKeyInfo,
  onProgress?: (message: string) => void,
): Promise<{
  success: boolean;
  txHash?: string;
  frontendHash?: string;
  backendHash?: string;
  message?: string;
}> => {
  try {
    const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
    const contractAddresses = await getContractAddresses();

    onProgress?.('Lấy thông tin nonce...');

    // Lấy nonce
    const entryPointAbi = [
      'function getNonce(address sender) external view returns (uint256)',
      'function nonceNguoiGui(address) view returns (uint256)',
      'function layHashThaoTac(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)) view returns (bytes32)',
    ];

    const entryPointContract = new ethers.Contract(
      contractAddresses.entryPointAddress,
      entryPointAbi,
      provider,
    );

    let nonce;
    try {
      nonce = await entryPointContract.getNonce(sessionKey.scwAddress);
    } catch (nonceError) {
      nonce = await entryPointContract.nonceNguoiGui(sessionKey.scwAddress);
    }

    onProgress?.('Chuẩn bị dữ liệu phiên bầu cử...');

    // Tính thời gian kéo dài
    const thoiGianKeoDai = calculateDuration(sessionData.ngayBatDau, sessionData.ngayKetThuc);

    // Tạo callData cho phiên bầu cử
    const quanLyCuocBauCuAbi = [
      'function taoPhienBauCu(uint256 idCuocBauCu, uint256 thoiGianKeoDai, uint256 soCuTriToiDa) external returns (uint256)',
    ];

    const quanLyCuocBauCuContract = new ethers.Contract(
      electionContractAddress,
      quanLyCuocBauCuAbi,
      provider,
    );

    // Chuẩn bị callData để gọi hàm taoPhienBauCu - luôn dùng ID = 1
    const taoPhienBauCuCallData = quanLyCuocBauCuContract.interface.encodeFunctionData(
      'taoPhienBauCu',
      [
        1, // ID cuộc bầu cử luôn là 1 trong contract
        BigInt(thoiGianKeoDai),
        BigInt(sessionData.soCuTriToiDa),
      ],
    );

    // Tạo callData cho SCW
    const scwAbi = [
      'function execute(address to, uint256 value, bytes calldata data) external returns (bytes memory)',
    ];

    const scwContract = new ethers.Contract(sessionKey.scwAddress, scwAbi, provider);

    // Tạo callData để gọi hàm execute của SCW
    const callData = scwContract.interface.encodeFunctionData('execute', [
      electionContractAddress,
      0,
      taoPhienBauCuCallData,
    ]);

    // Chuẩn bị paymasterAndData
    onProgress?.('Tạo UserOperation...');

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const deadlineTime = currentTimestamp + 3600; // 1 giờ sau
    const validationTime = currentTimestamp;

    const abiCoder = new ethers.AbiCoder();
    const paymasterAndData = ethers.concat([
      contractAddresses.paymasterAddress,
      abiCoder.encode(['uint48'], [deadlineTime]),
      abiCoder.encode(['uint48'], [validationTime]),
    ]);

    // Chuẩn bị UserOperation
    const userOp = {
      sender: sessionKey.scwAddress,
      nonce: nonce.toString(),
      initCode: '0x',
      callData: callData,
      callGasLimit: '2000000',
      verificationGasLimit: '2000000',
      preVerificationGas: '500000',
      maxFeePerGas: ethers.parseUnits('10', 'gwei').toString(),
      maxPriorityFeePerGas: ethers.parseUnits('5', 'gwei').toString(),
      paymasterAndData: paymasterAndData,
      signature: '0x',
    };

    // Lấy UserOpHash
    const userOpHash = await entryPointContract.layHashThaoTac(userOp);

    // Ký UserOperation
    onProgress?.('Ký UserOperation...');

    const signature = signUserOp(userOpHash, sessionKey.sessionKey);
    userOp.signature = signature;

    // Gửi UserOperation
    onProgress?.('Gửi giao dịch triển khai phiên bầu cử...');

    const response = await apiClient.post('/api/bundler/submit', {
      ...userOp,
      userOpHash,
    });

    if (response.data) {
      const frontendUserOpHash = response.data.userOpHash || userOpHash;
      const backendUserOpHash = response.data.backendHash || frontendUserOpHash;
      const txHash = response.data.txHash || frontendUserOpHash;

      // Liên kết hash nếu khác nhau
      if (frontendUserOpHash !== backendUserOpHash) {
        await linkHashes(frontendUserOpHash, backendUserOpHash, userOp.sender);
      }

      onProgress?.('Đã gửi giao dịch triển khai phiên bầu cử thành công, đang chờ xác nhận...');

      return {
        success: true,
        txHash,
        frontendHash: frontendUserOpHash,
        backendHash: backendUserOpHash,
        message: 'Đã gửi giao dịch triển khai phiên bầu cử',
      };
    } else {
      throw new Error('Không nhận được phản hồi từ bundler');
    }
  } catch (error) {
    console.error('Lỗi khi triển khai phiên bầu cử:', error);
    return {
      success: false,
      message: `Lỗi khi triển khai phiên bầu cử: ${(error as Error).message}`,
    };
  }
};

// Lưu transaction hash vào backend
export const recordTransaction = async (
  electionId: string,
  txHash: string,
  scwAddress: string,
  userOpHash: string,
  backendHash: string,
): Promise<boolean> => {
  try {
    const response = await apiClient.post(`/api/CuocBauCu/recordTransaction/${electionId}`, {
      TxHash: txHash,
      ScwAddress: scwAddress,
      UserOpHash: userOpHash,
      BackendHash: backendHash,
      Source: 'frontend',
    });

    return response.data?.success || false;
  } catch (error) {
    console.error('Lỗi khi lưu transaction hash:', error);
    return false;
  }
};

// Đồng bộ blockchain sau khi triển khai
export const syncBlockchain = async (
  electionId: string,
  forceCheck: boolean = false,
): Promise<boolean> => {
  try {
    const response = await apiClient.post(`/api/CuocBauCu/syncBlockchain/${electionId}`, {
      forceCheck,
    });

    return response.data?.success || false;
  } catch (error) {
    console.error('Lỗi khi đồng bộ blockchain:', error);
    return false;
  }
};
