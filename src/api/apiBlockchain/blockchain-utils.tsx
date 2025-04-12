import { ethers } from 'ethers';

// Hard-code địa chỉ HoLiHu Token
const HLU_TOKEN_ADDRESS = '0x0c69a0bF43618D8ba8465e095F78AdB3A15F2666';
// RPC endpoint của mạng blockchain private
const RPC_URL = 'https://geth.holihu.online/rpc';

// Tạo interface cho HoLiHu Token contract
interface HoLiHuTokenContract extends ethers.BaseContract {
  // ERC20 cơ bản
  balanceOf(owner: string): Promise<bigint>;
  transfer(to: string, amount: bigint): Promise<ethers.ContractTransactionResponse>;
  allowance(owner: string, spender: string): Promise<bigint>;
  approve(spender: string, amount: bigint): Promise<ethers.ContractTransactionResponse>;
  transferFrom(
    from: string,
    to: string,
    amount: bigint,
  ): Promise<ethers.ContractTransactionResponse>;

  // Thông tin token
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<number>;
  totalSupply(): Promise<bigint>;

  // Hằng số
  NGUON_CUNG_BAN_DAU(): Promise<bigint>;
  NGUON_CUNG_TOI_DA(): Promise<bigint>;
  PHAN_TRAM_PHI_TOI_DA(): Promise<bigint>;
  MINT_TOI_DA_MOT_LAN(): Promise<bigint>;

  // Vai trò
  hasRole(role: string, account: string): Promise<boolean>;
  getRoleMemberCount(role: string): Promise<bigint>;
  VAI_TRO_MINTER(): Promise<string>;
  VAI_TRO_PAUSER(): Promise<string>;
  VAI_TRO_QUAN_LY_PHI(): Promise<string>;

  // Phí
  phanTramPhiChuyen(): Promise<bigint>;
  diaChiNhanPhi(): Promise<string>;
  giamPhi(address: string): Promise<bigint>;

  // Các hàm đặc biệt
  paused(): Promise<boolean>;
  danhDauDeDotToken(address: string): Promise<boolean>;

  // Admin functions (cần quyền)
  mint(to: string, amount: bigint): Promise<ethers.ContractTransactionResponse>;
  burn(amount: bigint): Promise<ethers.ContractTransactionResponse>;
  burnFrom(account: string, amount: bigint): Promise<ethers.ContractTransactionResponse>;
  dotTuTaiKhoan(account: string, amount: bigint): Promise<ethers.ContractTransactionResponse>;
  danhDauDeDot(account: string, status: boolean): Promise<ethers.ContractTransactionResponse>;
  tamDung(): Promise<ethers.ContractTransactionResponse>;
  batLai(): Promise<ethers.ContractTransactionResponse>;
  capNhatPhiChuyen(phiMoi: number): Promise<ethers.ContractTransactionResponse>;
  capNhatDiaChiNhanPhi(diaChiMoi: string): Promise<ethers.ContractTransactionResponse>;
  datGiamPhi(account: string, mucGiam: number): Promise<ethers.ContractTransactionResponse>;
}

// ABI đầy đủ cho HoLiHu Token
const HLU_TOKEN_ABI = [
  // ERC20 cơ bản
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',

  // Thông tin token
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',

  // Hằng số
  'function NGUON_CUNG_BAN_DAU() view returns (uint256)',
  'function NGUON_CUNG_TOI_DA() view returns (uint256)',
  'function PHAN_TRAM_PHI_TOI_DA() view returns (uint256)',
  'function MINT_TOI_DA_MOT_LAN() view returns (uint256)',

  // Vai trò
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function getRoleMemberCount(bytes32 role) view returns (uint256)',
  'function VAI_TRO_MINTER() view returns (bytes32)',
  'function VAI_TRO_PAUSER() view returns (bytes32)',
  'function VAI_TRO_QUAN_LY_PHI() view returns (bytes32)',

  // Phí
  'function phanTramPhiChuyen() view returns (uint256)',
  'function diaChiNhanPhi() view returns (address)',
  'function giamPhi(address) view returns (uint256)',

  // Các hàm đặc biệt
  'function paused() view returns (bool)',
  'function danhDauDeDotToken(address) view returns (bool)',

  // Admin functions (cần quyền)
  'function mint(address to, uint256 amount)',
  'function burn(uint256 amount)',
  'function burnFrom(address account, uint256 amount)',
  'function dotTuTaiKhoan(address account, uint256 amount)',
  'function danhDauDeDot(address account, bool status)',
  'function tamDung()',
  'function batLai()',
  'function capNhatPhiChuyen(uint256 phiMoi)',
  'function capNhatDiaChiNhanPhi(address diaChiMoi)',
  'function datGiamPhi(address account, uint256 mucGiam)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event PhiDaThu(address indexed nguoiGui, address indexed nguoiNhan, uint256 phi)',
  'event GiamPhiDaDat(address indexed taiKhoan, uint256 mucGiam)',
  'event CapNhatPhiChuyen(uint256 phiMoi)',
  'event CapNhatDiaChiNhanPhi(address indexed diaChiMoi)',
  'event TaiKhoanBiDanhDauDeDot(address indexed taiKhoan, bool trangThai)',
];

// Tạo provider để kết nối với blockchain
export const getProvider = () => {
  return new ethers.JsonRpcProvider(RPC_URL);
};

// Lấy instance của HoLiHu Token contract
export const getHluTokenContract = (): HoLiHuTokenContract => {
  const provider = getProvider();
  return new ethers.Contract(
    HLU_TOKEN_ADDRESS,
    HLU_TOKEN_ABI,
    provider,
  ) as unknown as HoLiHuTokenContract;
};

// Lấy số dư HLU của một địa chỉ
export const getHluBalance = async (address: string): Promise<string> => {
  try {
    const hluToken = getHluTokenContract();
    const balance = await hluToken.balanceOf(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Lỗi khi lấy số dư HLU:', error);
    throw error;
  }
};

// Lấy thông tin chi tiết của HLU token
export const getHluTokenInfo = async () => {
  try {
    const hluToken = getHluTokenContract();
    const [
      name,
      symbol,
      decimals,
      totalSupply,
      nguonCungBanDau,
      nguonCungToiDa,
      phanTramPhiToiDa,
      phanTramPhiChuyen,
      diaChiNhanPhi,
      paused,
    ] = await Promise.all([
      hluToken.name(),
      hluToken.symbol(),
      hluToken.decimals(),
      hluToken.totalSupply(),
      hluToken.NGUON_CUNG_BAN_DAU(),
      hluToken.NGUON_CUNG_TOI_DA(),
      hluToken.PHAN_TRAM_PHI_TOI_DA(),
      hluToken.phanTramPhiChuyen(),
      hluToken.diaChiNhanPhi(),
      hluToken.paused(),
    ]);

    return {
      name,
      symbol,
      decimals,
      totalSupply: ethers.formatEther(totalSupply),
      nguonCungBanDau: ethers.formatEther(nguonCungBanDau),
      nguonCungToiDa: ethers.formatEther(nguonCungToiDa),
      phanTramPhiToiDa: Number(phanTramPhiToiDa),
      phanTramPhiChuyen: Number(phanTramPhiChuyen),
      diaChiNhanPhi,
      paused,
    };
  } catch (error) {
    console.error('Lỗi khi lấy thông tin token:', error);
    throw error;
  }
};

// Kiểm tra xem địa chỉ có hợp lệ không
export const isValidAddress = (address: string): boolean => {
  try {
    ethers.getAddress(address); // Kiểm tra và chuẩn hóa địa chỉ
    return true;
  } catch (error) {
    return false;
  }
};

// Kiểm tra vai trò của một tài khoản
export const checkRole = async (
  role: 'DEFAULT_ADMIN_ROLE' | 'VAI_TRO_MINTER' | 'VAI_TRO_PAUSER' | 'VAI_TRO_QUAN_LY_PHI',
  account: string,
): Promise<boolean> => {
  try {
    const hluToken = getHluTokenContract();
    let roleHash;

    if (role === 'DEFAULT_ADMIN_ROLE') {
      roleHash = ethers.ZeroHash; // Vai trò admin mặc định trong OpenZeppelin là 0x00
    } else {
      roleHash = await hluToken[role]();
    }

    return await hluToken.hasRole(roleHash, account);
  } catch (error) {
    console.error('Lỗi khi kiểm tra vai trò:', error);
    throw error;
  }
};

// Lấy thông tin giảm phí của một địa chỉ
export const getDiscountRate = async (address: string): Promise<number> => {
  try {
    const hluToken = getHluTokenContract();
    const discount = await hluToken.giamPhi(address);
    return Number(discount);
  } catch (error) {
    console.error('Lỗi khi lấy tỷ lệ giảm phí:', error);
    throw error;
  }
};

// Kiểm tra xem địa chỉ có bị đánh dấu để đốt token không
export const checkMarkedForBurn = async (address: string): Promise<boolean> => {
  try {
    const hluToken = getHluTokenContract();
    return await hluToken.danhDauDeDotToken(address);
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái đánh dấu đốt:', error);
    throw error;
  }
};

// Lấy tất cả thông tin chi tiết về một địa chỉ
export const getAddressDetails = async (address: string) => {
  try {
    const hluToken = getHluTokenContract();
    const provider = getProvider();

    const [
      balance,
      etherBalance,
      isMarkedForBurn,
      discountRate,
      isAdmin,
      isMinter,
      isPauser,
      isFeeManager,
    ] = await Promise.all([
      hluToken.balanceOf(address),
      provider.getBalance(address),
      hluToken.danhDauDeDotToken(address),
      hluToken.giamPhi(address),
      checkRole('DEFAULT_ADMIN_ROLE', address),
      checkRole('VAI_TRO_MINTER', address),
      checkRole('VAI_TRO_PAUSER', address),
      checkRole('VAI_TRO_QUAN_LY_PHI', address),
    ]);

    return {
      address,
      hluBalance: ethers.formatEther(balance),
      etherBalance: ethers.formatEther(etherBalance),
      isMarkedForBurn,
      discountRate: Number(discountRate),
      roles: {
        isAdmin,
        isMinter,
        isPauser,
        isFeeManager,
      },
    };
  } catch (error) {
    console.error('Lỗi khi lấy thông tin chi tiết địa chỉ:', error);
    throw error;
  }
};
