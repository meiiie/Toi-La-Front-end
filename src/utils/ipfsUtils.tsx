// ipfsUtils.ts - Các hàm tiện ích xử lý IPFS URL và nội dung

// Danh sách các IPFS gateway có hỗ trợ CORS tốt
export const IPFS_GATEWAYS = [
  'https://plum-characteristic-butterfly-246.mypinata.cloud/ipfs/', // Dedicated Pinata gateway - ưu tiên cao nhất
  'https://gateway.pinata.cloud/ipfs/', // Pinata public gateway
  'https://nftstorage.link/ipfs/', // NFT.Storage gateway - hỗ trợ CORS tốt
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
];

/**
 * Xóa các đuôi file trùng lặp như .glb.glb
 */
export function sanitizeIpfsPath(path: string): string {
  // Loại bỏ các đuôi file trùng lặp (.glb.glb, .gltf.gltf)
  let result = path.replace(/\.(glb|gltf)\.(glb|gltf)$/i, '.$1');

  // Thêm đuôi file nếu thiếu và cần thiết
  if (!result.match(/\.(glb|gltf)$/i) && (result.includes('glb') || result.includes('gltf'))) {
    if (result.toLowerCase().includes('glb')) {
      result += '.glb';
    } else if (result.toLowerCase().includes('gltf')) {
      result += '.gltf';
    }
  }

  return result;
}

/**
 * Chuyển đổi IPFS URL sang Gateway URL
 */
export function ipfsToGatewayUrl(ipfsUrl: string, gatewayIndex: number = 0): string {
  // Đảm bảo không vượt quá số lượng gateway
  const safeGatewayIndex = gatewayIndex % IPFS_GATEWAYS.length;
  const gateway = IPFS_GATEWAYS[safeGatewayIndex];

  // Nếu URL đã là URL HTTP/HTTPS thông thường, trả về nguyên dạng
  if (ipfsUrl.startsWith('http://') || ipfsUrl.startsWith('https://')) {
    // Kiểm tra xem URL có phải đã là URL gateway IPFS không
    for (const gatewayUrl of IPFS_GATEWAYS) {
      if (ipfsUrl.includes(gatewayUrl)) {
        // Đây là URL gateway, có thể muốn chuyển sang gateway khác
        const cidPath = ipfsUrl.split(gatewayUrl)[1];
        return `${gateway}${cidPath}`;
      }
    }
    return ipfsUrl; // URL thông thường, không phải IPFS
  }

  // Xử lý URL ipfs://
  if (ipfsUrl.startsWith('ipfs://')) {
    const ipfsPath = sanitizeIpfsPath(ipfsUrl.replace('ipfs://', ''));
    return `${gateway}${ipfsPath}`;
  }

  // Không nhận diện được dạng URL, trả về URL gốc
  return ipfsUrl;
}

/**
 * Kiểm tra xem URL có phải là IPFS URL không
 */
export function isIpfsUrl(url: string): boolean {
  if (!url) return false;

  // Kiểm tra protocol ipfs://
  if (url.startsWith('ipfs://')) return true;

  // Kiểm tra các gateway IPFS
  for (const gateway of IPFS_GATEWAYS) {
    if (url.includes(gateway)) return true;
  }

  return false;
}

/**
 * Trích xuất CID từ IPFS URL
 */
export function extractCidFromIpfsUrl(url: string): string | null {
  if (!url) return null;

  // Trường hợp ipfs://
  if (url.startsWith('ipfs://')) {
    const path = url.replace('ipfs://', '');
    // Trích xuất phần CID (không bao gồm đuôi file nếu có)
    const match = path.match(/^([a-zA-Z0-9]+)/);
    return match ? match[1] : path;
  }

  // Trường hợp URL gateway
  for (const gateway of IPFS_GATEWAYS) {
    if (url.includes(gateway)) {
      const cidPath = url.split(gateway)[1];
      // Trích xuất phần CID (không bao gồm đuôi file nếu có)
      const match = cidPath.match(/^([a-zA-Z0-9]+)/);
      return match ? match[1] : cidPath;
    }
  }

  return null;
}

/**
 * Làm ngắn gọn IPFS URL để hiển thị
 */
export function shortenIpfsUrl(url: string, maxLength: number = 16): string {
  const cid = extractCidFromIpfsUrl(url);
  if (!cid) return url;

  if (cid.length <= maxLength) return cid;

  return `${cid.substring(0, 6)}...${cid.substring(cid.length - 4)}`;
}

/**
 * Kiểm tra xem URL có phải là Model 3D không (dựa vào đuôi file)
 */
export function is3DModelUrl(url: string): boolean {
  if (!url) return false;

  const lowercaseUrl = url.toLowerCase();
  return (
    lowercaseUrl.endsWith('.glb') ||
    lowercaseUrl.endsWith('.gltf') ||
    lowercaseUrl.includes('.glb') ||
    lowercaseUrl.includes('.gltf')
  );
}

/**
 * Xác định đuôi file cho model 3D
 */
export function get3DModelExtension(url: string): string {
  if (!url) return '.glb'; // Mặc định là .glb

  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes('.gltf')) return '.gltf';
  return '.glb'; // Mặc định là .glb
}

/**
 * Tạo URL cho model 3D IPFS với đuôi file phù hợp
 */
export function create3DModelIpfsUrl(cid: string, extension?: string): string {
  const fileExt = extension || '.glb';
  return `ipfs://${cid}${fileExt}`;
}

/**
 * Tạo đường dẫn an toàn cho model 3D IPFS
 */
export function sanitize3DModelUrl(url: string): string {
  if (!url) return '';

  // Nếu không phải là URL IPFS, trả về nguyên dạng
  if (!isIpfsUrl(url)) return url;

  // Trích xuất CID
  const cid = extractCidFromIpfsUrl(url);
  if (!cid) return url;

  // Xác định đuôi file
  const extension = is3DModelUrl(url) ? get3DModelExtension(url) : '';

  // Tạo URL IPFS mới
  return create3DModelIpfsUrl(cid, extension);
}
