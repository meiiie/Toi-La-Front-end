import apiClient from './apiClient';
import { CuTri } from '../store/types';

const API_URL = '/api/CuTri';

// Lấy tất cả cử tri
export const getCacCuTri = async (): Promise<CuTri[]> => {
  const response = await apiClient.get(API_URL);
  return response.data;
};

// Lấy cử tri theo ID
export const getCuTriById = async (id: number): Promise<CuTri> => {
  const response = await apiClient.get(`${API_URL}/${id}`);
  return response.data;
};

// Lấy cử tri theo ID phiên bầu cử
export const getCuTriByPhienBauCuId = async (phienBauCuId: number): Promise<CuTri[]> => {
  const response = await apiClient.get(`${API_URL}/phienbaucu/${phienBauCuId}`);
  return response.data;
};

// Lấy cử tri theo ID cuộc bầu cử
export const getCuTriByCuocBauCuId = async (cuocBauCuId: number): Promise<CuTri[]> => {
  const response = await apiClient.get(`${API_URL}/cuocbaucu/${cuocBauCuId}`);
  return response.data;
};

// Lấy cử tri theo tên phiên bầu cử
export const getCuTriByTenPhienBauCu = async (tenPhienBauCu: string): Promise<CuTri[]> => {
  const response = await apiClient.get(`${API_URL}/tenphienbaucu/${tenPhienBauCu}`);
  return response.data;
};

// Lấy cử tri theo tên cuộc bầu cử
export const getCuTriByTenCuocBauCu = async (tenCuocBauCu: string): Promise<CuTri[]> => {
  const response = await apiClient.get(`${API_URL}/tencuocbaucu/${tenCuocBauCu}`);
  return response.data;
};

// Lấy cử tri theo email
export const getCuTriByEmail = async (email: string): Promise<CuTri[]> => {
  const response = await apiClient.get(`${API_URL}/email/${email}`);
  return response.data;
};

// Thêm cử tri
export const createCuTri = async (cuTri: CuTri): Promise<CuTri> => {
  // Đảm bảo taiKhoanId không null
  const sanitizedCuTri = {
    ...cuTri,
    taiKhoanId: cuTri.taiKhoanId || 0, // Chuyển null thành 0
  };

  const response = await apiClient.post(API_URL, sanitizedCuTri);
  return response.data;
};

// Thêm hàng loạt cử tri - Phiên bản cải tiến
export const createBulkCuTri = async (cuTris: Omit<CuTri, 'id'>[]): Promise<any> => {
  try {
    // Log dữ liệu gốc (debug)
    console.log('Dữ liệu cử tri gốc trước khi xử lý:', JSON.stringify(cuTris));

    // Đảm bảo không có trường nào là null trước khi gửi lên server
    const sanitizedCuTris = cuTris.map((cuTri) => ({
      // Đối với các trường chuỗi: đảm bảo không null/undefined
      email: typeof cuTri.email === 'string' ? cuTri.email : '',
      sdt: typeof cuTri.sdt === 'string' ? cuTri.sdt : '',

      // Đối với các trường boolean: ÉP KIỂU RÕ RÀNG thành true/false
      xacMinh: cuTri.xacMinh === true,
      boPhieu: cuTri.boPhieu === true,
      hasBlockchainWallet: cuTri.hasBlockchainWallet === true,

      // Đối với các trường số: đảm bảo luôn có giá trị số
      phienBauCuId: Number(cuTri.phienBauCuId) || 0,
      cuocBauCuId: Number(cuTri.cuocBauCuId) || 0,
      // Loại bỏ trường taiKhoanId, để server tự xác định dựa trên email
      vaiTroId: Number(cuTri.vaiTroId) || 0,
      soLanGuiOTP: Number(cuTri.soLanGuiOTP) || 0,

      // Các trường khác
      tenVaiTro: typeof cuTri.tenVaiTro === 'string' ? cuTri.tenVaiTro : '',
      trangThai: typeof cuTri.trangThai === 'string' ? cuTri.trangThai : '',
    }));

    // Log dữ liệu đã xử lý để kiểm tra
    console.log(
      'Dữ liệu cử tri đã được làm sạch trước khi gửi:',
      JSON.stringify(sanitizedCuTris, null, 2),
    );

    // Thêm timeout để đảm bảo request không bị cắt quá sớm nếu dữ liệu lớn
    const response = await apiClient.post(`${API_URL}/bulk`, sanitizedCuTris, {
      timeout: 30000, // 30 giây timeout
    });

    console.log('Kết quả từ server:', response.data);
    return response.data;
  } catch (error: any) {
    // Ghi log chi tiết lỗi
    console.error('Lỗi khi gửi dữ liệu cử tri:', error);
    console.error('Chi tiết lỗi:', error.response?.data || 'Không có chi tiết');

    // Xử lý lỗi theo mã trạng thái HTTP
    if (error.response) {
      switch (error.response.status) {
        case 400:
          throw new Error(
            error.response.data?.message || 'Dữ liệu cử tri không hợp lệ. Vui lòng kiểm tra lại.',
          );
        case 401:
          throw new Error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        case 403:
          throw new Error('Bạn không có quyền thực hiện thao tác này.');
        case 500:
          throw new Error(
            'Lỗi máy chủ: Không thể xử lý dữ liệu cử tri. Vui lòng liên hệ quản trị viên.',
          );
        default:
          throw new Error(
            `Lỗi HTTP ${error.response.status}: ${error.response.data?.message || 'Đã xảy ra lỗi'}`,
          );
      }
    }

    // Lỗi không liên quan đến phản hồi HTTP
    if (error.request) {
      throw new Error('Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }

    // Lỗi khác
    throw new Error(error.message || 'Không thể thêm cử tri. Vui lòng thử lại sau.');
  }
};

// Cập nhật cử tri
export const updateCuTri = async (id: number, cuTri: CuTri): Promise<CuTri> => {
  try {
    // Đảm bảo taiKhoanId không null
    const sanitizedCuTri = {
      ...cuTri,
      taiKhoanId: cuTri.taiKhoanId || 0, // Chuyển null thành 0
    };

    const response = await apiClient.put(`${API_URL}/${id}`, sanitizedCuTri);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Dữ liệu cử tri không hợp lệ');
    }
    throw error;
  }
};

// Cập nhật hàng loạt cử tri
export const updateBulkCuTri = async (cuTris: CuTri[]): Promise<CuTri[]> => {
  try {
    // Đảm bảo không có taiKhoanId là null
    const sanitizedCuTris = cuTris.map((cuTri) => ({
      ...cuTri,
      taiKhoanId: cuTri.taiKhoanId || 0, // Chuyển null thành 0
    }));

    const response = await apiClient.put(`${API_URL}/bulk`, sanitizedCuTris);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Dữ liệu cập nhật cử tri không hợp lệ');
    }
    throw error;
  }
};

// Xóa cử tri theo ID
export const deleteCuTri = async (id: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

// Xóa tất cả cử tri theo ID phiên bầu cử
export const deleteCuTriByPhienBauCuId = async (phienBauCuId: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/phienbaucu/${phienBauCuId}`);
};

// Xóa tất cả cử tri theo ID cuộc bầu cử
export const deleteCuTriByCuocBauCuId = async (cuocBauCuId: number): Promise<void> => {
  await apiClient.delete(`${API_URL}/cuocbaucu/${cuocBauCuId}`);
};

// Xóa cử tri theo nhiều ID
export const deleteMultipleCuTri = async (ids: number[]): Promise<void> => {
  await apiClient.delete(`${API_URL}/multiple`, { data: ids });
};

// Kiểm tra trùng lặp email và số điện thoại
export const checkDuplicateVoter = async (
  email?: string,
  sdt?: string,
  phienBauCuId?: number,
): Promise<any> => {
  try {
    let url = `${API_URL}/kiemtratrung?`;

    if (email) url += `email=${encodeURIComponent(email)}&`;
    if (sdt) url += `sdt=${encodeURIComponent(sdt)}&`;
    if (phienBauCuId) url += `phienBauCuId=${phienBauCuId}`;

    const response = await apiClient.get(url);
    return response.data;
  } catch (error: any) {
    console.error('Lỗi kiểm tra trùng lặp:', error);
    // Trả về đối tượng chi tiết hơn thay vì chỉ là boolean
    return {
      trungLap: true,
      truong: error.response?.data?.truong || 'unknown',
      message: error.response?.data?.message || 'Đã xảy ra lỗi khi kiểm tra trùng lặp',
    };
  }
};

// Kiểm tra trạng thái xác thực cử tri
export const checkVoterVerificationStatus = async (
  email: string,
  phienBauCuId: number,
): Promise<any> => {
  try {
    const response = await apiClient.get(
      `${API_URL}/check-verification?email=${encodeURIComponent(email)}&phienBauCuId=${phienBauCuId}`,
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy cử tri với email này.');
    } else {
      throw new Error(error.response?.data?.message || 'Không thể kiểm tra trạng thái xác thực.');
    }
  }
};

// Xác thực một cử tri
export const verifyVoter = async (id: number): Promise<any> => {
  try {
    const response = await apiClient.post(`${API_URL}/xacthuc/${id}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy cử tri.');
    } else {
      throw new Error(error.response?.data?.message || 'Không thể xác thực cử tri.');
    }
  }
};

// Xác thực hàng loạt cử tri
export const verifyMultipleVoters = async (voterIds: number[]): Promise<any[]> => {
  try {
    const response = await apiClient.post(`${API_URL}/xacthuc-hangloat`, voterIds);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error('Danh sách ID cử tri không hợp lệ.');
    } else {
      const message = error.response?.data?.message || 'Không thể xác thực hàng loạt cử tri.';
      throw new Error(message);
    }
  }
};
