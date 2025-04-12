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
    // Tạo tên file phù hợp với định dạng
    let uploadFileName = file.name;

    // Đảm bảo tên file có đuôi phù hợp đối với model 3D
    if (fileType === '3d-model') {
      // Kiểm tra và thêm đuôi file nếu không có
      if (
        !uploadFileName.toLowerCase().endsWith('.glb') &&
        !uploadFileName.toLowerCase().endsWith('.gltf')
      ) {
        // Thêm đuôi file phù hợp dựa vào loại MIME hoặc mặc định là .glb
        uploadFileName += '.glb';
      }
    }

    const formData = new FormData();
    // Đổi tên blob trước khi upload để đảm bảo đúng đuôi file
    const fileBlob = new File([file], uploadFileName, { type: file.type });

    formData.append('image', fileBlob); // Thay đổi key từ 'file' thành 'image' theo IpfsController.cs
    formData.append('fileType', fileType);

    // Thêm metadata cho model 3D để hỗ trợ xử lý phía server
    if (fileType === '3d-model') {
      formData.append('extension', uploadFileName.split('.').pop() || 'glb');
      formData.append('contentType', 'model/gltf-binary');
    }

    try {
      const response = await apiClient.post<UploadToIPFSResponse>(
        '/api/Ipfs/upload', // Sử dụng đúng endpoint từ IpfsController.cs
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      // Xử lý đặc biệt cho model 3D - đảm bảo CID có đuôi file phù hợp
      if (fileType === '3d-model' && response.data.success) {
        const fileExtension = uploadFileName.split('.').pop() || 'glb';

        // Kiểm tra nếu CID chưa có đuôi file thì thêm vào
        if (!response.data.cid.toLowerCase().endsWith(`.${fileExtension}`)) {
          const enhancedResponse = { ...response.data };
          enhancedResponse.cid = `${response.data.cid}.${fileExtension}`;
          enhancedResponse.url = response.data.url.replace(response.data.cid, enhancedResponse.cid);

          // Đảm bảo fileInfo có đầy đủ thông tin
          if (!enhancedResponse.fileInfo) {
            enhancedResponse.fileInfo = {};
          }
          enhancedResponse.fileInfo.tenFile = uploadFileName;
          enhancedResponse.fileInfo.noiDungType = 'model/gltf-binary';

          return enhancedResponse;
        }
      }

      return response.data;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw error;
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
