import {
  getHluBalance,
  getHluTokenInfo,
  getProvider,
  getHluTokenContract,
  getAddressDetails,
  checkRole,
} from './blockchain-utils';
import { ethers } from 'ethers';

// API để lấy số dư HLU trực tiếp từ blockchain
export const getHluBalanceDirectly = async (address: string): Promise<string> => {
  return await getHluBalance(address);
};

// API để lấy thông tin HLU token trực tiếp từ blockchain
export const getHluTokenInfoDirectly = async () => {
  return await getHluTokenInfo();
};

// API để kiểm tra kết nối với blockchain
export const checkBlockchainConnection = async (): Promise<boolean> => {
  try {
    // Thử lấy thông tin token để kiểm tra kết nối
    await getHluTokenInfoDirectly();
    return true;
  } catch (error) {
    console.error('Lỗi kết nối blockchain:', error);
    return false;
  }
};

// Lấy thông tin chi tiết về một địa chỉ
export const getAddressDetailsDirectly = async (address: string) => {
  return await getAddressDetails(address);
};

// Thực hiện chuyển token
export const transferHluToken = async (
  senderPrivateKey: string,
  toAddress: string,
  amount: string,
): Promise<ethers.TransactionReceipt | null> => {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(senderPrivateKey, provider);
    const hluToken = getHluTokenContract().connect(wallet) as ReturnType<
      typeof getHluTokenContract
    >;

    const amountWei = ethers.parseEther(amount);
    const tx = await hluToken.transfer(toAddress, amountWei);
    return await tx.wait();
  } catch (error) {
    console.error('Lỗi khi chuyển token:', error);
    throw error;
  }
};

// Thực hiện approve token
export const approveHluToken = async (
  ownerPrivateKey: string,
  spenderAddress: string,
  amount: string,
): Promise<ethers.TransactionReceipt | null> => {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(ownerPrivateKey, provider);
    const hluToken = getHluTokenContract().connect(wallet) as ReturnType<
      typeof getHluTokenContract
    >;

    const amountWei = ethers.parseEther(amount);
    const tx = await hluToken.approve(spenderAddress, amountWei);
    return await tx.wait();
  } catch (error) {
    console.error('Lỗi khi approve token:', error);
    throw error;
  }
};

// Lấy số lượng token đã approve
export const getAllowance = async (
  ownerAddress: string,
  spenderAddress: string,
): Promise<string> => {
  try {
    const hluToken = getHluTokenContract();
    const allowance = await hluToken.allowance(ownerAddress, spenderAddress);
    return ethers.formatEther(allowance);
  } catch (error) {
    console.error('Lỗi khi lấy allowance:', error);
    throw error;
  }
};

// ADMIN FUNCTIONS

// Mint token (cần quyền VAI_TRO_MINTER)
export const mintHluToken = async (
  adminPrivateKey: string,
  toAddress: string,
  amount: string,
): Promise<ethers.TransactionReceipt | null> => {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(adminPrivateKey, provider);
    const hluToken = getHluTokenContract().connect(wallet) as ReturnType<
      typeof getHluTokenContract
    >;

    // Kiểm tra quyền
    const isMinter = await checkRole('VAI_TRO_MINTER', wallet.address);
    if (!isMinter) {
      throw new Error('Địa chỉ không có quyền mint token');
    }

    const amountWei = ethers.parseEther(amount);
    const tx = await hluToken.mint(toAddress, amountWei);
    return await tx.wait();
  } catch (error) {
    console.error('Lỗi khi mint token:', error);
    throw error;
  }
};

// Đốt token từ tài khoản (cần quyền admin hoặc approve)
export const burnFromAddress = async (
  callerPrivateKey: string,
  targetAddress: string,
  amount: string,
): Promise<ethers.TransactionReceipt | null> => {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(callerPrivateKey, provider);
    const hluToken = getHluTokenContract().connect(wallet) as ReturnType<
      typeof getHluTokenContract
    >;

    const amountWei = ethers.parseEther(amount);

    // Kiểm tra xem có phải admin không
    const isAdmin = await checkRole('DEFAULT_ADMIN_ROLE', wallet.address);

    if (isAdmin) {
      // Nếu là admin, sử dụng dotTuTaiKhoan
      const tx = await hluToken.dotTuTaiKhoan(targetAddress, amountWei);
      return await tx.wait();
    } else {
      // Nếu không phải admin, sử dụng burnFrom
      const tx = await hluToken.burnFrom(targetAddress, amountWei);
      return await tx.wait();
    }
  } catch (error) {
    console.error('Lỗi khi đốt token:', error);
    throw error;
  }
};

// Cập nhật phí chuyển (cần quyền VAI_TRO_QUAN_LY_PHI)
export const updateTransferFee = async (
  adminPrivateKey: string,
  newFeePercentage: number,
): Promise<ethers.TransactionReceipt | null> => {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(adminPrivateKey, provider);
    const hluToken = getHluTokenContract().connect(wallet) as ReturnType<
      typeof getHluTokenContract
    >;

    // Kiểm tra quyền
    const isFeeManager = await checkRole('VAI_TRO_QUAN_LY_PHI', wallet.address);
    if (!isFeeManager) {
      throw new Error('Địa chỉ không có quyền cập nhật phí');
    }

    const tx = await hluToken.capNhatPhiChuyen(newFeePercentage);
    return await tx.wait();
  } catch (error) {
    console.error('Lỗi khi cập nhật phí chuyển:', error);
    throw error;
  }
};

// Cập nhật địa chỉ nhận phí (cần quyền VAI_TRO_QUAN_LY_PHI)
export const updateFeeRecipient = async (
  adminPrivateKey: string,
  newRecipientAddress: string,
): Promise<ethers.TransactionReceipt | null> => {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(adminPrivateKey, provider);
    const hluToken = getHluTokenContract().connect(wallet) as ReturnType<
      typeof getHluTokenContract
    >;

    // Kiểm tra quyền
    const isFeeManager = await checkRole('VAI_TRO_QUAN_LY_PHI', wallet.address);
    if (!isFeeManager) {
      throw new Error('Địa chỉ không có quyền cập nhật địa chỉ nhận phí');
    }

    const tx = await hluToken.capNhatDiaChiNhanPhi(newRecipientAddress);
    return await tx.wait();
  } catch (error) {
    console.error('Lỗi khi cập nhật địa chỉ nhận phí:', error);
    throw error;
  }
};

// Đặt giảm phí cho địa chỉ (cần quyền VAI_TRO_QUAN_LY_PHI)
export const setFeeDiscount = async (
  adminPrivateKey: string,
  targetAddress: string,
  discountPercentage: number,
): Promise<ethers.TransactionReceipt | null> => {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(adminPrivateKey, provider);
    const hluToken = getHluTokenContract().connect(wallet) as ReturnType<
      typeof getHluTokenContract
    >;

    // Kiểm tra quyền
    const isFeeManager = await checkRole('VAI_TRO_QUAN_LY_PHI', wallet.address);
    if (!isFeeManager) {
      throw new Error('Địa chỉ không có quyền đặt giảm phí');
    }

    const tx = await hluToken.datGiamPhi(targetAddress, discountPercentage);
    return await tx.wait();
  } catch (error) {
    console.error('Lỗi khi đặt giảm phí cho địa chỉ:', error);
    throw error;
  }
};

// Tạm dừng giao dịch token (cần quyền VAI_TRO_PAUSER)
export const pauseToken = async (
  adminPrivateKey: string,
): Promise<ethers.TransactionReceipt | null> => {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(adminPrivateKey, provider);
    const hluToken = getHluTokenContract().connect(wallet) as ReturnType<
      typeof getHluTokenContract
    >;

    // Kiểm tra quyền
    const isPauser = await checkRole('VAI_TRO_PAUSER', wallet.address);
    if (!isPauser) {
      throw new Error('Địa chỉ không có quyền tạm dừng giao dịch');
    }

    const tx = await hluToken.tamDung();
    return await tx.wait();
  } catch (error) {
    console.error('Lỗi khi tạm dừng giao dịch token:', error);
    throw error;
  }
};

// Bật lại giao dịch token (cần quyền VAI_TRO_PAUSER)
export const unpauseToken = async (
  adminPrivateKey: string,
): Promise<ethers.TransactionReceipt | null> => {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(adminPrivateKey, provider);
    const hluToken = getHluTokenContract().connect(wallet) as ReturnType<
      typeof getHluTokenContract
    >;

    // Kiểm tra quyền
    const isPauser = await checkRole('VAI_TRO_PAUSER', wallet.address);
    if (!isPauser) {
      throw new Error('Địa chỉ không có quyền bật lại giao dịch');
    }

    const tx = await hluToken.batLai();
    return await tx.wait();
  } catch (error) {
    console.error('Lỗi khi bật lại giao dịch token:', error);
    throw error;
  }
};
