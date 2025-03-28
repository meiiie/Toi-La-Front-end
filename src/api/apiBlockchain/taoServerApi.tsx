import apiClient from '../apiClient';

// Types for Elections/Servers
export interface CuocBauCu {
  Id?: number;
  TenCuocBauCu: string;
  MoTa: string;
  NgayBatDau: string;
  NgayKetThuc: string;
  TaiKhoanId: number;
  AnhCuocBauCu?: string;
  BlockchainServerId?: number;
  BlockchainAddress?: string;
  TrangThaiBlockchain?: number;
  ErrorMessage?: string | null;
}

// Blockchain deployment response
export interface BlockchainResponse {
  success: boolean;
  status?: number;
  blockchainServerId?: number;
  blockchainAddress?: string;
  errorMessage?: string | null;
  transactionHash?: string;
  paymasterUsed?: boolean;
  requiredHLU?: string;
  message?: string;
}

// Image upload response
export interface ImageUploadResponse {
  success: boolean;
  message: string;
  imageUrl: string;
}

// Server/Election API services
const taoServerApi = {
  // Get all elections
  getAll: async (): Promise<CuocBauCu[]> => {
    const response = await apiClient.get<CuocBauCu[]>('/api/CuocBauCu/all');
    return response.data;
  },

  // Get election by ID
  getById: async (id: number): Promise<CuocBauCu> => {
    const response = await apiClient.get<CuocBauCu>(`/api/CuocBauCu/layId/${id}`);
    return response.data;
  },

  // Get detailed election info (with blockchain details)
  getDetails: async (id: number): Promise<CuocBauCu> => {
    const response = await apiClient.get<CuocBauCu>(`/api/CuocBauCu/details/${id}`);
    return response.data;
  },

  // Create a new election
  create: async (election: CuocBauCu): Promise<CuocBauCu> => {
    const response = await apiClient.post<CuocBauCu>('/api/CuocBauCu/tao', election);
    return response.data;
  },

  // Update an election
  update: async (election: CuocBauCu): Promise<void> => {
    await apiClient.put('/api/CuocBauCu/update', election);
  },

  // Delete an election
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/CuocBauCu/delete/${id}`);
  },

  // Search for an election by name
  search: async (name: string): Promise<CuocBauCu> => {
    const response = await apiClient.get<CuocBauCu>(`/api/CuocBauCu/tim/${name}`);
    return response.data;
  },

  // Get elections by account ID
  getByAccount: async (accountId: number): Promise<CuocBauCu[]> => {
    const response = await apiClient.get<CuocBauCu[]>(`/api/CuocBauCu/taikhoan/${accountId}`);
    return response.data;
  },

  // Upload an image for an election
  uploadImage: async (id: number, imageFile: File): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('imageFile', imageFile);

    const response = await apiClient.post<ImageUploadResponse>(
      `/api/CuocBauCu/uploadImage/${id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  },

  // Get blockchain deployment status
  getBlockchainStatus: async (id: number): Promise<BlockchainResponse> => {
    const response = await apiClient.get<BlockchainResponse>(`/api/CuocBauCu/blockchain/${id}`);
    return response.data;
  },

  // Deploy an election to blockchain
  deployToBlockchain: async (id: number, SCWAddress: string): Promise<BlockchainResponse> => {
    const response = await apiClient.post<BlockchainResponse>(
      `/api/CuocBauCu/deployBlockchain/${id}`,
      { SCWAddress },
    );
    return response.data;
  },

  // Sync blockchain status
  syncBlockchain: async (id: number): Promise<BlockchainResponse> => {
    const response = await apiClient.post<BlockchainResponse>(
      `/api/CuocBauCu/syncBlockchain/${id}`,
    );
    return response.data;
  },
};

export default taoServerApi;
