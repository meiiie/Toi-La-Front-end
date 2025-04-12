// src/utils/blockchainTestUtils.ts

import { ethers } from 'ethers';

// ABI definitions for testing
const testFactoryAbi = [
  'function layServerCuaNguoiDung(address nguoiDung) view returns (uint256[])',
  'function tonTaiServer(address server) view returns (bool)',
  'function hluPaymaster() view returns (address)',
  'function layThongTinServer(uint128 serverId) view returns (address, string, string, uint8, uint256, uint256)',
];

const testElectionAbi = [
  'function layThongTinCoBan(uint256 idCuocBauCu) view returns (address, bool, uint256, uint256, string, uint256)',
  'function laPhienHoatDong(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (bool)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 chiSoBatDau, uint256 gioiHan) view returns (uint256[])',
  'function layThongTinPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (bool, uint256, uint256, uint256, uint256, uint256, address[], bool, uint256, uint256)',
];

/**
 * RPC URL và factory address
 */
const DEFAULT_RPC_URL = 'https://geth.holihu.online/rpc';
const DEFAULT_FACTORY_ADDRESS = '0x93e3b7720CAf68Fb4E4E0A9ca0152f61529D9900';

/**
 * Tạo provider mới
 */
export function getProvider(rpcUrl: string = DEFAULT_RPC_URL): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Kiểm tra trực tiếp danh sách server từ blockchain
 * @param scwAddress Địa chỉ SCW để kiểm tra
 * @returns Kết quả kiểm tra
 */
export async function testDirectElectionList(scwAddress: string) {
  try {
    console.log('Testing direct election list fetch for address:', scwAddress);

    const provider = getProvider();
    const factoryContract = new ethers.Contract(DEFAULT_FACTORY_ADDRESS, testFactoryAbi, provider);

    // 1. Kiểm tra address có hợp lệ không
    const addressCode = await provider.getCode(scwAddress);
    console.log('Address has code:', addressCode !== '0x');

    // 2. Gọi hàm lấy server của người dùng
    const userServers = await factoryContract.layServerCuaNguoiDung(scwAddress);
    console.log('Direct call server IDs:', userServers);
    console.log('Server count:', userServers.length);

    // 3. Thử với các biến thể địa chỉ
    const withoutChecksum = scwAddress.toLowerCase();
    if (withoutChecksum !== scwAddress) {
      console.log('Trying without checksum:', withoutChecksum);
      const noChecksumServers = await factoryContract.layServerCuaNguoiDung(withoutChecksum);
      console.log('Servers without checksum:', noChecksumServers);
    }

    const withChecksum = ethers.getAddress(scwAddress);
    if (withChecksum !== scwAddress) {
      console.log('Trying with checksum:', withChecksum);
      const checksumServers = await factoryContract.layServerCuaNguoiDung(withChecksum);
      console.log('Servers with checksum:', checksumServers);
    }

    // 4. Nếu có server, lấy thông tin chi tiết
    const serverDetails = [];
    if (userServers.length > 0) {
      for (const serverId of userServers) {
        try {
          const serverInfo = await factoryContract.layThongTinServer(serverId);
          serverDetails.push({
            id: Number(serverId),
            address: serverInfo[0],
            name: serverInfo[1],
            status: Number(serverInfo[3]),
          });
        } catch (error) {
          console.error(`Error fetching details for server ${serverId}:`, error);
        }
      }
    }

    return {
      success: true,
      servers: userServers,
      count: userServers.length,
      details: serverDetails,
    };
  } catch (error) {
    console.error('Error in direct test:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Kiểm tra trạng thái phiên bầu cử
 * @param electionAddress Địa chỉ contract cuộc bầu cử
 * @param sessionId ID của phiên bầu cử
 * @returns Thông tin trạng thái phiên
 */
export async function testSessionStatus(electionAddress: string, sessionId: number) {
  try {
    const provider = getProvider();
    const electionContract = new ethers.Contract(electionAddress, testElectionAbi, provider);

    // 1. Kiểm tra xem phiên có đang hoạt động không
    const isActive = await electionContract.laPhienHoatDong(1, sessionId);

    // 2. Lấy thông tin chi tiết về phiên
    const sessionInfo = await electionContract.layThongTinPhienBauCu(1, sessionId);

    // Phân tích kết quả
    const [
      isActiveFromInfo,
      startTime,
      endTime,
      maxVoters,
      candidateCount,
      voterCount,
      winners,
      isReelection,
      confirmCount,
      confirmDeadline,
    ] = sessionInfo;

    return {
      success: true,
      isActive,
      isActiveFromInfo,
      startTime: Number(startTime),
      endTime: Number(endTime),
      maxVoters: Number(maxVoters),
      candidateCount: Number(candidateCount),
      voterCount: Number(voterCount),
      winnerCount: winners.length,
      isReelection,
    };
  } catch (error) {
    console.error('Error checking session status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Kiểm tra quyền của người dùng trên cuộc bầu cử
 * @param electionAddress Địa chỉ contract cuộc bầu cử
 * @param userAddress Địa chỉ người dùng cần kiểm tra
 * @returns Thông tin quyền
 */
export async function testElectionPermissions(electionAddress: string, userAddress: string) {
  try {
    const provider = getProvider();
    const electionContract = new ethers.Contract(electionAddress, testElectionAbi, provider);

    // 1. Lấy thông tin cơ bản
    const basicInfo = await electionContract.layThongTinCoBan(1);
    const [owner, isActive, startTime, endTime, name, fee] = basicInfo;

    // 2. Kiểm tra các role
    const BANTOCHUC_ROLE = ethers.keccak256(ethers.toUtf8Bytes('BANTOCHUC'));
    const QUANTRI_CUOCBAUCU_ROLE = ethers.keccak256(ethers.toUtf8Bytes('QUANTRI_CUOCBAUCU'));

    const hasBanToChucRole = await electionContract.hasRole(BANTOCHUC_ROLE, userAddress);
    const hasAdminRole = await electionContract.hasRole(QUANTRI_CUOCBAUCU_ROLE, userAddress);

    return {
      success: true,
      owner,
      isOwner: owner.toLowerCase() === userAddress.toLowerCase(),
      isActive,
      hasBanToChucRole,
      hasAdminRole,
      electionName: name,
      startTime: Number(startTime),
      endTime: Number(endTime),
    };
  } catch (error) {
    console.error('Error checking permissions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Kiểm tra xem địa chỉ có phải là địa chỉ contract hợp lệ không
 * @param address Địa chỉ cần kiểm tra
 * @param provider Provider Ethereum
 * @returns true nếu là contract, false nếu không phải
 */
export async function isValidContract(address: string, provider?: ethers.JsonRpcProvider) {
  try {
    const _provider = provider || getProvider();
    const code = await _provider.getCode(address);
    return code !== '0x';
  } catch (error) {
    console.error('Error checking contract:', error);
    return false;
  }
}

/**
 * Chuẩn hóa địa chỉ Ethereum thành EIP-55 checksum format
 * @param address Địa chỉ cần chuẩn hóa
 * @returns Địa chỉ chuẩn hóa
 */
export function normalizeAddress(address: string): string {
  try {
    return ethers.getAddress(address);
  } catch (error) {
    console.error('Invalid address format:', address);
    return address;
  }
}

/**
 * Kiểm tra xem tài khoản có phiếu bầu hợp lệ không
 * @param electionAddress Địa chỉ contract cuộc bầu cử
 * @param ballotManagerAddress Địa chỉ của Ballot Manager
 * @param sessionId ID phiên bầu cử
 * @param voterAddress Địa chỉ của cử tri
 * @returns Kết quả kiểm tra
 */
export async function checkVoterBallot(
  electionAddress: string,
  ballotManagerAddress: string,
  sessionId: number,
  voterAddress: string,
) {
  try {
    const provider = getProvider();
    const ballotManagerAbi = [
      'function daNhanNFT(address server, uint256 idPhienBauCu, address cuTri) view returns (bool)',
    ];

    const ballotManager = new ethers.Contract(ballotManagerAddress, ballotManagerAbi, provider);

    const hasTicket = await ballotManager.daNhanNFT(electionAddress, sessionId, voterAddress);

    return {
      success: true,
      hasTicket,
      electionAddress,
      sessionId,
      voterAddress,
    };
  } catch (error) {
    console.error('Error checking voter ballot:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      electionAddress,
      sessionId,
      voterAddress,
    };
  }
}
