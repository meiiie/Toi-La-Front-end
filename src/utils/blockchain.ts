import { ethers } from 'ethers';

// Địa chỉ và ABI của các smart contract
export const QUAN_LY_PHIEU_BAU_ADDRESS = '0x9c244B5E1F168510B9b812573b1B667bd1E654c8';
export const SCW_ADDRESS = '0x066BAdad3aEcfe447a31B3f3994C28F73a1A314F';

// ID của phiên bầu cử
export const ID_PHIEN_BAU_CU = 3;

// ABI tối thiểu cho các hợp đồng
export const QUAN_LY_PHIEU_BAU_ABI = [
  'function layDanhSachTokenCuaPhien(uint256 idPhienBauCu) view returns (uint256[])',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
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

// Add a cache to prevent repeated calls for invalid tokens
const invalidTokenIds = new Set<number>();

// Modified version with better error handling
export async function fetchBallotIPFSLinks(
  voterAddress: string,
  sessionId: number,
): Promise<{ tokenId: number; tokenURI: string; processedURI: string }[]> {
  try {
    const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');

    // Safe provider check
    if (!provider) {
      console.error('Failed to create provider');
      throw new Error('Failed to connect to blockchain');
    }

    const phieuBauCuAbi = [
      'function balanceOf(address owner) view returns (uint256)',
      'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
      'function tokenURI(uint256 tokenId) view returns (string)',
      'function ownerOf(uint256 tokenId) view returns (address)',
    ];

    const phieuBauCuContract = new ethers.Contract(
      '0x9c244B5E1F168510B9b812573b1B667bd1E654c8', // Consider making this configurable
      phieuBauCuAbi,
      provider,
    );

    // Get token balance
    let balance;
    try {
      balance = await phieuBauCuContract.balanceOf(voterAddress);
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw new Error('Could not fetch ballot balance');
    }

    balance = Number(balance);
    if (balance <= 0) {
      console.log('No ballots found for address:', voterAddress);
      return [];
    }

    const tokenIds: number[] = [];
    const validTokenLinks: { tokenId: number; tokenURI: string; processedURI: string }[] = [];

    // Fetch all token IDs first
    for (let i = 0; i < balance; i++) {
      try {
        const tokenIdBigInt = await phieuBauCuContract.tokenOfOwnerByIndex(voterAddress, i);
        const tokenId = Number(tokenIdBigInt);
        tokenIds.push(tokenId);
      } catch (error) {
        console.error(`Error fetching token ID at index ${i}:`, error);
        // Continue with the next token
      }
    }

    console.log(`Fetched ${tokenIds.length} tokens for session ${sessionId}`);

    // Then process the valid token IDs
    for (const tokenId of tokenIds) {
      // Skip already known invalid tokens
      if (invalidTokenIds.has(tokenId)) {
        continue;
      }

      try {
        // Verify ownership first before doing more operations
        const owner = await phieuBauCuContract.ownerOf(tokenId);
        if (owner.toLowerCase() !== voterAddress.toLowerCase()) {
          console.log(`Token ${tokenId} is not owned by ${voterAddress}`);
          continue;
        }

        // Now get URI for valid tokens
        const tokenURI = await phieuBauCuContract.tokenURI(tokenId);

        // Process URI to handle IPFS and base64 formats
        let processedURI = tokenURI;

        // ...existing URI processing code...

        validTokenLinks.push({
          tokenId,
          tokenURI,
          processedURI,
        });
      } catch (error) {
        // Add to invalid token cache
        invalidTokenIds.add(tokenId);

        if (error instanceof Error) {
          console.error(`Lỗi khi kiểm tra token ${tokenId}: ${error.message}`);
        } else {
          console.error(`Lỗi khi kiểm tra token ${tokenId}:`, error);
        }
      }
    }

    console.log(`Successfully retrieved ${validTokenLinks.length} valid ballots`);
    return validTokenLinks;
  } catch (error) {
    console.error('Error in fetchBallotIPFSLinks:', error);
    throw error;
  }
}

// Improved version with better error handling
export async function checkVoterHasVotedSafely(
  voterAddress: string,
  tokenId: number,
  quanLyCuocBauCuAddress: string,
  phienId: number,
): Promise<boolean> {
  try {
    // Skip known invalid tokens
    if (invalidTokenIds.has(tokenId)) {
      return false;
    }

    const provider = new ethers.JsonRpcProvider('https://geth.holihu.online/rpc');

    // Safe guard against invalid addresses
    if (!ethers.isAddress(quanLyCuocBauCuAddress)) {
      console.error('Invalid contract address:', quanLyCuocBauCuAddress);
      return false;
    }

    const quanLyCuocBauCuAbi = [
      'function daBoPhieu(address cuTri, uint256 idPhienBauCu, uint256 idToken) view returns (bool)',
    ];

    const quanLyCuocBauCu = new ethers.Contract(
      quanLyCuocBauCuAddress,
      quanLyCuocBauCuAbi,
      provider,
    );

    // Use a timeout to prevent hanging calls
    const hasVotedPromise = quanLyCuocBauCu.daBoPhieu(voterAddress, phienId, tokenId);

    // Add timeout handling
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Blockchain query timed out')), 10000);
    });

    // Race the promises
    const hasVoted = await Promise.race([hasVotedPromise, timeoutPromise]);

    return hasVoted as boolean;
  } catch (error) {
    // Add to invalid token cache if it's an invalid token error
    if (error instanceof Error && error.message.includes('invalid token ID')) {
      invalidTokenIds.add(tokenId);
    }

    console.error(`Error checking if voter has voted (token ${tokenId}):`, error);
    return false;
  }
}

// Mô phỏng dữ liệu để kiểm tra
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
