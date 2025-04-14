import { ethers } from 'ethers';

// Địa chỉ và ABI của các smart contract
export const QUAN_LY_PHIEU_BAU_ADDRESS = '0x9c244B5E1F168510B9b812573b1B667bd1E654c8';
export const SCW_ADDRESS = '0x066BAdad3aEcfe447a31B3f3994C28F73a1A314F';
export const FACTORY_ADDRESS = '0x93e3b7720CAf68Fb4E4E0A9ca0152f61529D9900';

// ID của phiên bầu cử
export const ID_PHIEN_BAU_CU = 3;

// ABI tối thiểu cho các hợp đồng
export const QUAN_LY_PHIEU_BAU_ABI = [
  'function layDanhSachTokenCuaPhien(uint256 idPhienBauCu) view returns (uint256[])',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function tokenDenPhienBauCu(uint256 idToken) view returns (uint256)',
  'function tokenDenCuocBauCu(uint256 idToken) view returns (uint256)',
  'function daBoPhieu(uint128 serverId, uint256 idPhienBauCu, address cuTri) view returns (bool)',
  'function kiemTraQuyenBauCu(address cuTri, uint128 serverId, uint256 idPhienBauCu, uint256 idToken) view returns (bool)',
  'function kiemTraQuyenBauCuChiTiet(address cuTri, uint128 serverId, uint256 idPhienBauCu, uint256 idToken) view returns (tuple(bool tonTai, bool daBoPhieu, bool laNguoiSoHuu, bool phienHopLe, bool trongThoiGian))',
];

export const FACTORY_ABI = [
  'function layThongTinServer(uint128 id) view returns (address, string, string, uint8, uint64, uint64, address)',
  'function layThongTinServerTheoAddress(address serverAddress) view returns (uint128)',
];

// Xử lý tokenURI đặc biệt
export function processTokenURI(tokenURI: string): string {
  // Kiểm tra nếu tokenURI bắt đầu bằng https://holihu-metadata.com/data:
  if (tokenURI.startsWith('https://holihu-metadata.com/data:')) {
    // Trích xuất phần data: trở đi
    return tokenURI.substring('https://holihu-metadata.com/'.length);
  }
  return tokenURI;
}

// Thêm cache để tránh gọi lặp lại cho token không hợp lệ
const invalidTokenIds = new Set<number>();

/**
 * Lấy danh sách phiếu bầu của cử tri từ blockchain
 * @param voterAddress Địa chỉ ví của cử tri
 * @param sessionId ID phiên bầu cử
 * @returns Danh sách phiếu bầu
 */
export async function fetchBallotIPFSLinks(
  voterAddress: string,
  sessionId: number,
): Promise<{ tokenId: number; tokenURI: string; processedURI: string }[]> {
  console.log(`Đang lấy danh sách phiếu cho cử tri ${voterAddress} trong phiên ${sessionId}...`);

  try {
    const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');

    if (!provider) {
      console.error('Không thể kết nối đến blockchain provider');
      throw new Error('Không thể kết nối đến blockchain');
    }

    const quanLyPhieuBau = new ethers.Contract(
      QUAN_LY_PHIEU_BAU_ADDRESS,
      QUAN_LY_PHIEU_BAU_ABI,
      provider,
    );

    // Phương pháp 1: Lấy danh sách token của phiên
    let allTokensInSession: number[] = [];
    try {
      console.log(`Đang lấy danh sách phiếu của phiên ${sessionId}...`);
      const tokenListBigInt = await quanLyPhieuBau.layDanhSachTokenCuaPhien(sessionId);

      // Chuyển từ BigInt sang number
      allTokensInSession = tokenListBigInt.map((token) => Number(token));
      console.log(`Tìm thấy ${allTokensInSession.length} phiếu trong phiên ${sessionId}`);
    } catch (error) {
      console.error(`Lỗi khi lấy danh sách phiếu của phiên ${sessionId}:`, error);
      allTokensInSession = []; // Mảng rỗng nếu gặp lỗi
    }

    if (allTokensInSession.length === 0) {
      console.log(`Không tìm thấy phiếu nào trong phiên ${sessionId}`);
      return [];
    }

    // Lọc ra các phiếu thuộc về cử tri
    const validTokenLinks: { tokenId: number; tokenURI: string; processedURI: string }[] = [];

    for (const tokenId of allTokensInSession) {
      // Bỏ qua token đã biết là không hợp lệ
      if (invalidTokenIds.has(tokenId)) {
        console.log(`Bỏ qua token không hợp lệ đã biết: ${tokenId}`);
        continue;
      }

      try {
        // Kiểm tra chủ sở hữu
        const owner = await quanLyPhieuBau.ownerOf(tokenId);

        if (owner.toLowerCase() === voterAddress.toLowerCase()) {
          // Kiểm tra xem token có thuộc về phiên bầu cử đúng không
          const tokenSessionId = await quanLyPhieuBau.tokenDenPhienBauCu(tokenId);

          if (Number(tokenSessionId) === sessionId) {
            console.log(`Token ${tokenId} thuộc về cử tri ${voterAddress}`);

            // Lấy URI
            const tokenURI = await quanLyPhieuBau.tokenURI(tokenId);
            const processedURI = processTokenURI(tokenURI);

            validTokenLinks.push({
              tokenId,
              tokenURI,
              processedURI,
            });
          } else {
            console.log(`Token ${tokenId} không thuộc về phiên ${sessionId}`);
          }
        }
      } catch (error) {
        // Thêm token không hợp lệ vào cache
        invalidTokenIds.add(tokenId);

        if (error instanceof Error) {
          console.error(`Lỗi khi kiểm tra token ${tokenId}: ${error.message}`);
        } else {
          console.error(`Lỗi khi kiểm tra token ${tokenId}:`, error);
        }
      }
    }

    console.log(`Tìm thấy ${validTokenLinks.length} phiếu hợp lệ cho cử tri ${voterAddress}`);
    return validTokenLinks;
  } catch (error) {
    console.error('Lỗi trong hàm fetchBallotIPFSLinks:', error);
    throw error;
  }
}

/**
 * Kiểm tra xem cử tri đã bỏ phiếu chưa
 * @param voterAddress Địa chỉ ví của cử tri
 * @param tokenId ID token phiếu bầu
 * @param serverAddress Địa chỉ server/quản lý cuộc bầu cử
 * @param sessionId ID phiên bầu cử
 * @returns true nếu đã bỏ phiếu, false nếu chưa
 */
export async function checkVoterHasVotedSafely(
  voterAddress: string,
  tokenId: number,
  serverAddress: string,
  sessionId: number,
): Promise<boolean> {
  try {
    // Bỏ qua token đã biết là không hợp lệ
    if (invalidTokenIds.has(tokenId)) {
      console.log(`Bỏ qua token không hợp lệ: ${tokenId}`);
      return false;
    }

    const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');
    const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    const quanLyPhieuBau = new ethers.Contract(
      QUAN_LY_PHIEU_BAU_ADDRESS,
      QUAN_LY_PHIEU_BAU_ABI,
      provider,
    );

    // Lấy serverId từ địa chỉ server
    let serverId: number;
    try {
      const serverIdBigInt = await factory.layThongTinServerTheoAddress(serverAddress);
      serverId = Number(serverIdBigInt);
      console.log(`Lấy được server ID: ${serverId} từ địa chỉ ${serverAddress}`);
    } catch (error) {
      console.error('Lỗi khi lấy server ID:', error);
      serverId = 1; // Mặc định là server ID 1
    }

    // Phương pháp 1: Kiểm tra trực tiếp trạng thái bỏ phiếu
    try {
      const hasVoted = await quanLyPhieuBau.daBoPhieu(serverId, sessionId, voterAddress);
      if (hasVoted) {
        console.log(`Cử tri ${voterAddress} đã bỏ phiếu trong phiên ${sessionId}`);
        return true;
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái bỏ phiếu:', error);
      // Tiếp tục với phương pháp khác
    }

    // Phương pháp 2: Kiểm tra quyền bầu cử chi tiết
    try {
      const votingRightDetails = await quanLyPhieuBau.kiemTraQuyenBauCuChiTiet(
        voterAddress,
        serverId,
        sessionId,
        tokenId,
      );

      console.log(`Chi tiết quyền bầu cử cho token ${tokenId}:`, {
        tonTai: votingRightDetails[0],
        daBoPhieu: votingRightDetails[1],
        laNguoiSoHuu: votingRightDetails[2],
        phienHopLe: votingRightDetails[3],
        trongThoiGian: votingRightDetails[4],
      });

      // Nếu đã bỏ phiếu hoặc token không tồn tại hoặc không sở hữu, coi như đã sử dụng
      if (votingRightDetails[1] || !votingRightDetails[0] || !votingRightDetails[2]) {
        return true;
      }

      // Nếu phiên không hợp lệ hoặc hết thời gian, cũng coi như đã sử dụng
      if (!votingRightDetails[3] || !votingRightDetails[4]) {
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Lỗi khi kiểm tra quyền bầu cử chi tiết cho token ${tokenId}:`, error);

      // Phương pháp 3: Kiểm tra quyền bầu cử đơn giản
      try {
        const hasVotingRights = await quanLyPhieuBau.kiemTraQuyenBauCu(
          voterAddress,
          serverId,
          sessionId,
          tokenId,
        );

        // Nếu không có quyền bầu cử, coi như đã sử dụng phiếu
        return !hasVotingRights;
      } catch (error) {
        console.error(`Lỗi khi kiểm tra quyền bầu cử đơn giản cho token ${tokenId}:`, error);

        // Thêm vào danh sách token không hợp lệ để tránh gọi lại
        invalidTokenIds.add(tokenId);
        return false;
      }
    }
  } catch (error) {
    console.error(`Lỗi tổng quát khi kiểm tra phiếu đã bỏ:`, error);
    return false;
  }
}

// Giữ lại mô phỏng dữ liệu để kiểm tra
export async function getMockBallotIPFSLinks(): Promise<
  { tokenId: number; tokenURI: string; processedURI: string }[]
> {
  // Tạo một data URI mẫu với JSON tiếng Việt bị lỗi mã hóa
  const sampleJsonBase64 = btoa(`{
    "name": "Phiếu bầu cử HoLiHu #123",
    "description": "Phiếu bầu cử chính thức cho cuộc bầu cử Ban chấp hành 2025",
    "image": "ipfs://QmaWEMdg5Y1Fin1h4JxuMLDDYLEkTSD4uAV5ErkWiGhHHg",
    "attributes": [
      {
        "trait_type": "Loáº¡i phiáº¿u",
        "value": "Phiáº¿u báº§u cá»­ chÃ­nh thá»©c"
      },
      {
        "trait_type": "ÄÆ¡n vá» tá» chá»©c",
        "value": "Äáº¡i Há»c hehe"
      },
      {
        "trait_type": "Khu vá»±c báº§u cá»­",
        "value": "Hehe"
      },
      {
        "trait_type": "NgÃ y",
        "value": "Hehe"
      },
      {
        "trait_type": "Äá»a chá» cá»­ tri",
        "value": "0x066BAdad3aEcfe447a31B3f3994C28F73a1A314F"
      },
      {
        "trait_type": "Email cá»­ tri",
        "value": "gce65688@bcooq.com"
      },
      {
        "trait_type": "NgÃ y cáº¥p",
        "value": "14:25 09/04/2025"
      },
      {
        "trait_type": "Hash kiá»m chá»©ng",
        "value": "0xed0316ab8821a9c3a615f87030bb68b425bd7033a36c57146534d44f72d88d33"
      },
      {
        "trait_type": "ID phiÃªn báº§u cá»­",
        "value": "3"
      },
      {
        "trait_type": "TÃªn phiÃªn báº§u cá»­",
        "value": "PhiÃªn báº§u cá»­ cá»§a KhÃ´ng hiá»u"
      }
    ],
    "background_color": "4d80b3"
  }`);

  const dataUri = `data:application/json;base64,${sampleJsonBase64}`;
  const holihuDataUri = `https://holihu-metadata.com/${dataUri}`;

  // Giả lập delay để mô phỏng việc gọi blockchain
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      tokenId: 123,
      tokenURI: holihuDataUri,
      processedURI: dataUri,
    },
    {
      tokenId: 124,
      tokenURI: 'ipfs://QmXyz123456789...',
      processedURI: 'ipfs://QmXyz123456789...',
    },
  ];
}
