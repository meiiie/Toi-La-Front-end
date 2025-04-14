// uploadFileBallotApi.tsx - Phiên bản sửa lỗi
import axios from 'axios';

// Định nghĩa interface cho response từ API IPFS
interface UploadToIPFSResponse {
  success: boolean;
  message?: string;
  cid?: string; // Từ IpfsController.cs
  url?: string; // Từ IpfsController.cs
  ipfsHash?: string; // Cho tương thích với code cũ
  fileInfo?: {
    tenFile?: string;
    kichThuoc?: string;
    ngayUpload?: string;
    noiDungType?: string;
  };
}

interface ValidateUrlResponse {
  success: boolean;
  message: string;
  imageUrl?: string;
  isValid?: boolean;
}

export default class FileService {
  // Tạo một API client riêng - không sử dụng apiClient để tránh xung đột
  private static client = axios.create({
    baseURL: window.location.origin,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  static async uploadToIPFS(
    file: File,
    fileType: 'image' | '3d-model',
  ): Promise<UploadToIPFSResponse> {
    try {
      // Tạo FormData và sử dụng tên field "image" theo đúng IpfsController.cs
      const formData = new FormData();
      formData.append('image', file); // IpfsController.cs yêu cầu field name là "image"

      // Đặt timeouts dài hơn cho uploads file lớn
      const response = await FileService.client.post<UploadToIPFSResponse>(
        '/api/Ipfs/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 giây cho uploads lớn
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 100),
            );
            console.log(`Upload progress: ${percentCompleted}%`);
            // Có thể dispatch progress update ở đây nếu cần
          },
        },
      );

      // Kiểm tra response có hợp lệ không
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('Invalid response from server');
      }

      // Chuẩn hóa response để phù hợp với interface
      const result: UploadToIPFSResponse = {
        success: response.data.success,
        message: response.data.message || 'Upload successful',
        cid: response.data.cid,
        url: response.data.url,
        ipfsHash: response.data.cid, // Đồng bộ cid thành ipfsHash cho code cũ
        fileInfo: {
          tenFile: file.name,
          kichThuoc: `${(file.size / 1024).toFixed(2)} KB`,
          ngayUpload: new Date().toISOString(),
          noiDungType: fileType === '3d-model' ? 'model/gltf-binary' : file.type,
        },
      };

      console.log('IPFS upload successful:', result);
      return result;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);

      // Xử lý lỗi chi tiết hơn
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message || 'Network error';
        throw new Error(`IPFS upload failed: ${message}`);
      }

      throw new Error('IPFS upload failed: Unknown error');
    }
  }

  static async validateUrl(url: string): Promise<ValidateUrlResponse> {
    // Xử lý URL IPFS
    if (url.startsWith('ipfs://')) {
      // Kiểm tra xem có phải là model 3D không
      const is3DModel =
        url.toLowerCase().endsWith('.glb') ||
        url.toLowerCase().endsWith('.gltf') ||
        url.toLowerCase().includes('.glb') ||
        url.toLowerCase().includes('.gltf');

      return {
        success: true,
        message: is3DModel ? 'Valid IPFS 3D Model URL' : 'Valid IPFS URL',
        imageUrl: url,
        isValid: true,
      };
    }

    // Kiểm tra URL model 3D
    if (
      url.endsWith('.glb') ||
      url.endsWith('.gltf') ||
      url.toLowerCase().includes('.glb') ||
      url.toLowerCase().includes('.gltf')
    ) {
      return {
        success: true,
        message: 'Valid 3D Model URL',
        imageUrl: url,
        isValid: true,
      };
    }

    // Kiểm tra cơ bản cho các URL khác
    try {
      const isValidUrl = url.match(/^(https?:\/\/)([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i);
      if (isValidUrl) {
        // Thực hiện HEAD request để kiểm tra URL có tồn tại không
        await FileService.client.head(url, { timeout: 5000 });

        return {
          success: true,
          message: 'Valid URL',
          imageUrl: url,
          isValid: true,
        };
      } else {
        return {
          success: false,
          message: 'Invalid URL format',
          isValid: false,
        };
      }
    } catch (error) {
      console.error('Error validating URL:', error);

      // Kiểm tra URL theo định dạng cơ bản (không kiểm tra nội dung)
      const urlRegex = /^(https?:\/\/)([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i;
      if (urlRegex.test(url)) {
        return {
          success: true,
          message: 'URL format is valid, but content could not be verified',
          imageUrl: url,
          isValid: true,
        };
      }

      return {
        success: false,
        message: 'Invalid or inaccessible URL',
        isValid: false,
      };
    }
  }

  // Helper method để chuyển đổi IPFS URLs
  static getViewableUrl(ipfsUrl: string): string {
    if (!ipfsUrl) return '';

    // Các IPFS gateways phổ biến
    const gateways = [
      'https://gateway.pinata.cloud/ipfs/',
      'https://ipfs.io/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
    ];

    // Mặc định sử dụng Pinata vì đó là gateway chúng ta đã tích hợp
    const preferredGateway = gateways[0];

    // Nếu đã là URL gateway, trả về nguyên bản
    if (gateways.some((gateway) => ipfsUrl.startsWith(gateway))) {
      return ipfsUrl;
    }

    // Nếu là ipfs:// protocol
    if (ipfsUrl.startsWith('ipfs://')) {
      const path = ipfsUrl.replace('ipfs://', '');
      return `${preferredGateway}${path}`;
    }

    // Trả về URL gốc nếu không nhận dạng được
    return ipfsUrl;
  }
}
