// ballotUtils.ts - Các tiện ích xử lý phiếu bầu cử

/**
 * Giải mã dữ liệu metadata từ URI base64
 * @param base64URI URI base64 cần giải mã
 * @returns Đối tượng JavaScript đã giải mã
 */
export function decodeBase64Metadata(base64URI: string): any {
  if (!base64URI) return null;

  try {
    // Trường hợp 1: URI dạng data:application/json;base64,...
    if (base64URI.startsWith('data:application/json;base64,')) {
      const base64Content = base64URI.split(',')[1];
      const jsonString = atob(base64Content);
      return JSON.parse(jsonString);
    }

    // Trường hợp 2: URI từ HoLiHu (https://holihu-metadata.com/data:...)
    if (base64URI.startsWith('https://holihu-metadata.com/data:')) {
      const dataUri = base64URI.substring('https://holihu-metadata.com/'.length);
      if (dataUri.startsWith('data:application/json;base64,')) {
        const base64Content = dataUri.split(',')[1];
        const jsonString = atob(base64Content);
        return JSON.parse(jsonString);
      }
    }

    // Trường hợp 3: Chuỗi base64 thuần túy
    try {
      const jsonString = atob(base64URI);
      return JSON.parse(jsonString);
    } catch (e) {
      // Không phải base64 thuần túy
    }

    return null;
  } catch (error) {
    console.error('Lỗi khi giải mã metadata:', error);
    return null;
  }
}

/**
 * Xử lý địa chỉ IPFS để hiển thị hình ảnh
 * @param ipfsUrl URL IPFS (dạng ipfs://...)
 * @returns URL có thể truy cập được
 */
export function processIpfsImageUrl(ipfsUrl: string): string {
  if (!ipfsUrl) return null;

  // Nếu không phải URL IPFS, trả về nguyên bản
  if (!ipfsUrl.startsWith('ipfs://')) {
    return ipfsUrl;
  }

  // Danh sách các IPFS gateway có hỗ trợ CORS tốt
  const IPFS_GATEWAYS = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://ipfs.io/ipfs/',
  ];

  // Sử dụng gateway đầu tiên (có thể tùy chỉnh)
  const gateway = IPFS_GATEWAYS[0];
  const cid = ipfsUrl.replace('ipfs://', '');

  return `${gateway}${cid}`;
}

/**
 * Hiển thị rút gọn địa chỉ ví Ethereum
 * @param address Địa chỉ ví cần rút gọn
 * @returns Địa chỉ ví đã rút gọn (ví dụ: 0x1234...5678)
 */
export function shortenAddress(address: string): string {
  if (!address) return '';
  if (address.length < 12) return address;

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Định dạng lại ngày giờ từ định dạng Việt Nam
 * @param dateStr Chuỗi ngày giờ Việt Nam (ví dụ: "01:20 15/04/2025")
 * @returns Ngày giờ đã định dạng lại
 */
export function formatVietnameseDate(dateStr: string): string {
  if (!dateStr) return '';

  // Xử lý một số định dạng phổ biến
  if (dateStr.includes('/')) {
    // Định dạng: HH:mm DD/MM/YYYY
    if (dateStr.includes(':')) {
      const parts = dateStr.split(' ');
      if (parts.length === 2) {
        const timePart = parts[0]; // HH:mm
        const datePart = parts[1]; // DD/MM/YYYY
        const [day, month, year] = datePart.split('/');

        // Định dạng lại thành: DD/MM/YYYY HH:mm
        return `${day}/${month}/${year} ${timePart}`;
      }
    }
  }

  // Trả về nguyên bản nếu không khớp định dạng nào
  return dateStr;
}

/**
 * Lấy giá trị thuộc tính từ metadata
 * @param metadata Metadata của phiếu bầu
 * @param traitType Loại thuộc tính cần lấy
 * @returns Giá trị của thuộc tính
 */
export function getAttributeValue(metadata: any, traitType: string): string {
  if (!metadata || !metadata.attributes || !Array.isArray(metadata.attributes)) {
    return null;
  }

  const attribute = metadata.attributes.find((attr) => attr.trait_type === traitType);

  return attribute ? attribute.value : null;
}

/**
 * Nhóm các thuộc tính theo danh mục
 * @param attributes Mảng thuộc tính
 * @returns Thuộc tính đã được nhóm theo danh mục
 */
export function groupAttributes(attributes: any[]): Record<string, any[]> {
  if (!attributes || !Array.isArray(attributes)) {
    return {};
  }

  const groups = {
    identity: ['Địa chỉ cử tri', 'Email cử tri', 'Mã cử tri'],
    election: ['Cuộc bầu cử', 'Loại phiếu', 'ID phiên bầu cử', 'Tên phiên bầu cử'],
    verification: ['Hash kiểm chứng', 'Ngày cấp'],
    other: [], // Các thuộc tính khác
  };

  const result: Record<string, any[]> = {
    identity: [],
    election: [],
    verification: [],
    other: [],
  };

  attributes.forEach((attr) => {
    const traitType = attr.trait_type;

    if (groups.identity.some((type) => traitType.includes(type))) {
      result.identity.push(attr);
    } else if (groups.election.some((type) => traitType.includes(type))) {
      result.election.push(attr);
    } else if (groups.verification.some((type) => traitType.includes(type))) {
      result.verification.push(attr);
    } else {
      result.other.push(attr);
    }
  });

  return result;
}
