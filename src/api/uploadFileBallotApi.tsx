// services/FileService.ts - Phiên bản cập nhật
import apiClient from './apiClient';

interface UploadToIPFSResponse {
  success: boolean;
  message: string;
  cid: string; // Đã thay đổi từ ipfsHash sang cid phù hợp với IpfsController.cs
  url: string; // Đã thay đổi từ fileUrl sang url phù hợp với IpfsController.cs
  fileName?: string;
  fileInfo?: {
    id?: number;
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
  static async uploadToIPFS(file: File, fileType: 'image' | '3d-model') {
    try {
      console.log('uploadToIPFS service started:', { fileName: file.name, fileType });

      // Tạo tên file phù hợp
      let uploadFileName = file.name;
      if (fileType === '3d-model' && !uploadFileName.toLowerCase().match(/\.(glb|gltf)$/)) {
        uploadFileName += '.glb';
      }

      const formData = new FormData();
      // QUAN TRỌNG: Sử dụng đúng tên field 'image' theo yêu cầu của IpfsController
      formData.append('image', file, uploadFileName);

      // Thêm thông tin bổ sung
      formData.append('fileType', fileType);
      if (fileType === '3d-model') {
        formData.append('extension', uploadFileName.split('.').pop() || 'glb');
        formData.append('contentType', 'model/gltf-binary');
      }

      const response = await apiClient.post<UploadToIPFSResponse>('/api/Ipfs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('IPFS upload response:', response.data);

      // Kiểm tra kết quả
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'IPFS upload failed: Unknown error');
      }

      return response.data;
    } catch (error: any) {
      console.error('Error in uploadToIPFS service:', error);
      if (error.response) {
        console.error('Response details:', {
          status: error.response.status,
          data: error.response.data,
        });
      }
      throw new Error(error.message || 'Invalid response from server');
    }
  }

  static async validateUrl(url: string) {
    // Nếu là URL IPFS, trả về kết quả ngay
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
        fileType: is3DModel ? '3d-model' : 'image',
      };
    }

    // Kiểm tra nếu là URL mô hình 3D
    if (url.endsWith('.glb') || url.endsWith('.gltf')) {
      return {
        success: true,
        message: 'Valid 3D Model URL',
        imageUrl: url,
        isValid: true,
        fileType: '3d-model',
      };
    }

    // Nếu không có endpoint validate-url, ta có thể thực hiện kiểm tra cơ bản
    const urlPattern = /^(https?:\/\/)([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i;
    if (urlPattern.test(url)) {
      return {
        success: true,
        message: 'Valid URL',
        imageUrl: url,
        isValid: true,
        fileType: 'image',
      };
    }

    throw new Error('URL không hợp lệ');
  }

  static async getIPFSBalance() {
    try {
      const response = await apiClient.get('/api/Ipfs/balance');
      return response.data;
    } catch (error) {
      console.error('Error getting IPFS balance:', error);
      return { success: false, message: 'Could not retrieve IPFS balance' };
    }
  }

  /**
   * Chuyển đổi đường dẫn IPFS thành URL có thể xem được trong browser
   */
  static getViewableUrl(ipfsUrl: string): string {
    // Danh sách các gateway IPFS đáng tin cậy
    const gateways = [
      'https://gateway.pinata.cloud/ipfs/',
      'https://cloudflare-ipfs.com/ipfs/',
      'https://ipfs.io/ipfs/',
    ];

    // Mặc định sử dụng Pinata vì chúng ta đã tích hợp với nó
    const preferredGateway = gateways[0];

    // Nếu đã là URL gateway, trả về nguyên bản
    for (const gateway of gateways) {
      if (ipfsUrl.startsWith(gateway)) {
        return ipfsUrl;
      }
    }

    // Nếu là ipfs:// protocol
    if (ipfsUrl.startsWith('ipfs://')) {
      const path = ipfsUrl.replace('ipfs://', '');
      return `${preferredGateway}${path}`;
    }

    // Nếu không nhận dạng được, trả về URL gốc
    return ipfsUrl;
  }
}
