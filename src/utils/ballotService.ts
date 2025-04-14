// ballotService.js - Dịch vụ xử lý phiếu bầu cử

/**
 * Giải mã dữ liệu metadata từ URI phiếu bầu cử
 * @param {string} uri - URI của phiếu bầu cử (có thể là tokenURI hoặc processedURI)
 * @returns {Object|null} Đối tượng metadata đã giải mã, hoặc null nếu có lỗi
 */
export const decodeMetadataFromUri = (uri) => {
  if (!uri) return null;

  try {
    // Trường hợp 1: URI dạng data:application/json;base64,...
    if (uri.startsWith('data:application/json;base64,')) {
      const base64Content = uri.split(',')[1];
      const jsonString = atob(base64Content);
      return JSON.parse(jsonString);
    }

    // Trường hợp 2: URI từ HoLiHu (https://holihu-metadata.com/data:...)
    if (uri.startsWith('https://holihu-metadata.com/data:')) {
      const dataUri = uri.substring('https://holihu-metadata.com/'.length);
      if (dataUri.startsWith('data:application/json;base64,')) {
        const base64Content = dataUri.split(',')[1];
        const jsonString = atob(base64Content);
        return JSON.parse(jsonString);
      }
    }

    // Trường hợp 3: Cố gắng parse nếu là JSON string
    if (typeof uri === 'string' && (uri.startsWith('{') || uri.startsWith('['))) {
      return JSON.parse(uri);
    }

    return null;
  } catch (error) {
    console.error('Lỗi khi giải mã metadata:', error);
    return null;
  }
};

/**
 * Chuyển đổi URI IPFS thành URL có thể truy cập được
 * @param {string} ipfsUri - URI IPFS (ipfs://...)
 * @param {number} gatewayIndex - Chỉ số gateway sử dụng (mặc định là 0)
 * @returns {string} URL từ gateway IPFS
 */
export const ipfsToGatewayUrl = (ipfsUri, gatewayIndex = 0) => {
  if (!ipfsUri || !ipfsUri.startsWith('ipfs://')) {
    return ipfsUri;
  }

  const IPFS_GATEWAYS = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
  ];

  const safeGatewayIndex = gatewayIndex % IPFS_GATEWAYS.length;
  const gateway = IPFS_GATEWAYS[safeGatewayIndex];
  const cid = ipfsUri.replace('ipfs://', '');

  return `${gateway}${cid}`;
};

/**
 * Xử lý nhiều phiếu bầu cử để lấy metadata
 * @param {Array} ballots - Mảng các phiếu bầu từ blockchain
 * @returns {Array} Mảng các phiếu bầu với metadata đã được giải mã
 */
export const processBallotsMetadata = (ballots) => {
  if (!Array.isArray(ballots)) return [];

  return ballots.map((ballot) => {
    let metadata = null;

    // Ưu tiên sử dụng processedURI nếu có
    if (ballot.processedURI) {
      metadata = decodeMetadataFromUri(ballot.processedURI);
    }

    // Nếu không có metadata từ processedURI, thử từ tokenURI
    if (!metadata && ballot.tokenURI) {
      metadata = decodeMetadataFromUri(ballot.tokenURI);
    }

    // Nếu vẫn không có metadata, tạo metadata mặc định
    if (!metadata) {
      metadata = {
        name: `Phiếu bầu cử #${ballot.tokenId}`,
        description: 'Phiếu bầu cử HoLiHu',
        image: 'https://placehold.co/400x400/e2e8f0/667085?text=Phiếu+Bầu+Cử',
      };
    }

    return {
      ...ballot,
      metadata,
    };
  });
};

/**
 * Trích xuất attribute từ metadata của phiếu bầu cử
 * @param {Object} metadata - Đối tượng metadata đã giải mã
 * @param {string} traitType - Loại thuộc tính cần trích xuất
 * @returns {string|null} Giá trị của thuộc tính, hoặc null nếu không tìm thấy
 */
export const getAttributeValue = (metadata, traitType) => {
  if (!metadata || !metadata.attributes || !Array.isArray(metadata.attributes)) {
    return null;
  }

  const attribute = metadata.attributes.find((attr) => attr.trait_type === traitType);

  return attribute ? attribute.value : null;
};
