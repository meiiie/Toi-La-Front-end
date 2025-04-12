import apiClient from './apiClient';
import {
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  VoterVerificationRequest,
  VoterVerificationResponse,
  CuTri,
} from '../store/types';

const API_URL = '/api/Otp';

/**
 * Gửi mã OTP đến email
 * @param email Email người dùng
 * @returns Kết quả gửi OTP
 */
export const sendOtp = async (email: string): Promise<SendOtpResponse> => {
  try {
    const response = await apiClient.post(`${API_URL}/send`, JSON.stringify(email), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    // Xử lý các trường hợp lỗi cụ thể
    if (error.response?.status === 429) {
      throw new Error('Đã gửi quá nhiều yêu cầu OTP. Vui lòng thử lại sau 5 phút.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Email không hợp lệ.');
    } else if (error.response?.status === 500) {
      throw new Error('Lỗi máy chủ khi gửi OTP. Vui lòng thử lại sau.');
    } else {
      const message = error.response?.data?.message || 'Không thể gửi mã OTP';
      throw new Error(message);
    }
  }
};

/**
 * Xác thực mã OTP
 * @param data Thông tin xác thực OTP (email và mã OTP)
 * @returns Kết quả xác thực
 */
export const verifyOtp = async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
  try {
    const response = await apiClient.post(`${API_URL}/verify`, data);
    return response.data;
  } catch (error: any) {
    // Xử lý các trường hợp lỗi cụ thể
    if (error.response?.status === 400) {
      if (error.response.data?.message?.includes('hết hạn')) {
        throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.');
      } else if (error.response.data?.message?.includes('không hợp lệ')) {
        throw new Error('Mã OTP không đúng. Vui lòng kiểm tra lại.');
      } else {
        throw new Error(error.response.data?.message || 'Không thể xác thực mã OTP');
      }
    } else {
      const message = error.response?.data?.message || 'Không thể xác thực mã OTP';
      throw new Error(message);
    }
  }
};

/**
 * Gửi email xác thực cho cử tri
 * @param data Thông tin cử tri cần xác thực
 * @returns Kết quả gửi email xác thực
 */
export const sendVoterVerification = async (data: VoterVerificationRequest): Promise<any> => {
  try {
    const response = await apiClient.post(`${API_URL}/send-verification`, data);
    return response.data;
  } catch (error: any) {
    // Xử lý và làm rõ lỗi gửi xác thực
    let errorMessage: string;

    if (error.response?.status === 429) {
      errorMessage = 'Đã gửi quá nhiều lời mời. Vui lòng thử lại sau 5 phút.';
    } else if (error.response?.status === 400) {
      if (error.response.data?.message?.includes('không có địa chỉ email')) {
        errorMessage = 'Cử tri không có địa chỉ email để gửi xác thực.';
      } else if (error.response.data?.message?.includes('đã được xác thực')) {
        errorMessage = 'Cử tri này đã được xác thực trước đó.';
      } else {
        errorMessage = error.response.data?.message || 'Email không hợp lệ hoặc đã bị chặn gửi.';
      }
    } else if (error.response?.status === 404) {
      errorMessage = 'Không tìm thấy phiên bầu cử hoặc cử tri. Vui lòng kiểm tra lại thông tin.';
    } else if (error.response?.status === 500) {
      errorMessage = 'Lỗi máy chủ khi gửi email. Vui lòng thử lại sau.';
    } else {
      errorMessage = error.response?.data?.message || 'Không thể gửi email xác thực.';
    }

    throw new Error(errorMessage);
  }
};

/**
 * Xác thực token cử tri từ URL
 * @param token Token xác thực
 * @returns Kết quả xác thực token
 */
export const verifyVoterToken = async (token: string): Promise<VoterVerificationResponse> => {
  try {
    const response = await apiClient.get(
      `${API_URL}/verify-token?token=${encodeURIComponent(token)}`,
    );
    return response.data;
  } catch (error: any) {
    // Xử lý và làm rõ lỗi xác thực token
    let errorMessage: string;

    if (error.response?.status === 400) {
      if (error.response.data?.message?.includes('hết hạn')) {
        errorMessage = 'Token xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.';
      } else {
        errorMessage =
          'Token không hợp lệ. Vui lòng kiểm tra lại đường dẫn hoặc yêu cầu gửi lại email xác thực.';
      }
    } else if (error.response?.status === 404) {
      errorMessage = 'Không tìm thấy thông tin cử tri hoặc phiên bầu cử.';
    } else {
      errorMessage = error.response?.data?.message || 'Không thể xác thực token.';
    }

    throw new Error(errorMessage);
  }
};

/**
 * Kiểm tra trạng thái xác thực của cử tri
 * @param email Email của cử tri
 * @param phienBauCuId ID phiên bầu cử
 * @returns Thông tin cử tri và trạng thái xác thực
 */
export const checkVoterVerificationStatus = async (
  email: string,
  phienBauCuId: number,
): Promise<any> => {
  try {
    const response = await apiClient.get(
      `/api/CuTri/check-verification?email=${encodeURIComponent(email)}&phienBauCuId=${phienBauCuId}`,
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Không tìm thấy cử tri với email này.');
    } else {
      const message =
        error.response?.data?.message || error.message || 'Không thể kiểm tra trạng thái xác thực.';
      throw new Error(message);
    }
  }
};

/**
 * Gửi lại email xác thực cho cử tri
 * @param email Email của cử tri
 * @param phienBauCuId ID phiên bầu cử
 * @param cuocBauCuId ID cuộc bầu cử
 * @returns Kết quả gửi lại email
 */
export const resendVerification = async (
  email: string,
  phienBauCuId: number,
  cuocBauCuId: number,
): Promise<SendOtpResponse> => {
  try {
    // Tìm cử tri theo email
    const cuTriResponse = await apiClient.get(`/api/CuTri/email/${encodeURIComponent(email)}`);

    if (!cuTriResponse.data) {
      throw new Error('Không tìm thấy thông tin cử tri.');
    }

    // Kiểm tra xem cử tri có phải của phiên bầu cử này không
    const cuTri: CuTri = cuTriResponse.data;
    if (cuTri.phienBauCuId !== phienBauCuId) {
      throw new Error('Cử tri không thuộc phiên bầu cử này.');
    }

    // Kiểm tra xem cử tri đã được xác thực chưa
    if (cuTri.xacMinh) {
      return {
        success: true,
        message: 'Cử tri này đã được xác thực trước đó và không cần gửi lại email.',
      };
    }

    // Gửi lại email xác thực
    const verificationRequest: VoterVerificationRequest = {
      email,
      phienBauCuId,
      cuocBauCuId,
    };

    const response = await apiClient.post(`${API_URL}/send-verification`, verificationRequest);

    return {
      ...response.data,
      message: 'Email xác thực đã được gửi lại thành công.',
    };
  } catch (error: any) {
    // Xử lý các lỗi cụ thể
    if (error.response?.status === 429) {
      throw new Error('Đã gửi quá nhiều email xác thực. Vui lòng thử lại sau ít phút.');
    } else if (error.response?.status === 404) {
      throw new Error('Không tìm thấy cử tri với email này.');
    } else {
      const message =
        error.response?.data?.message || error.message || 'Không thể gửi lại email xác thực.';
      throw new Error(message);
    }
  }
};

/**
 * Xác thực hàng loạt cử tri
 * @param voterIds Danh sách ID cử tri cần xác thực
 * @returns Kết quả xác thực hàng loạt
 */
export const verifyMultipleVoters = async (voterIds: number[]): Promise<any[]> => {
  try {
    const response = await apiClient.post(`/api/CuTri/xacthuc-hangloat`, voterIds);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error('Danh sách ID cử tri không hợp lệ.');
    } else {
      const message = error.response?.data?.message || 'Không thể gửi xác thực hàng loạt.';
      throw new Error(message);
    }
  }
};

/**
 * Kiểm tra trùng lặp email và số điện thoại
 * @param email Email cần kiểm tra
 * @param sdt Số điện thoại cần kiểm tra
 * @param phienBauCuId ID phiên bầu cử
 * @returns Kết quả kiểm tra chi tiết
 */
export const checkDuplicateVoter = async (
  email?: string,
  sdt?: string,
  phienBauCuId?: number,
): Promise<any> => {
  try {
    let url = `/api/CuTri/kiemtratrung?`;

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

/**
 * Gửi liên hệ đến hỗ trợ (để cử tri báo lỗi hoặc yêu cầu hỗ trợ)
 * @param data Dữ liệu liên hệ (tên, email, lý do, ghi chú)
 * @returns Kết quả gửi liên hệ
 */
export const sendContactSupport = async (data: {
  ten: string;
  email: string;
  lyDo: string;
  ghiChu?: string;
  phienBauCuId?: number;
}): Promise<any> => {
  try {
    const response = await apiClient.post(`${API_URL}/contact`, data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Thông tin liên hệ không hợp lệ.');
    } else {
      throw new Error('Không thể gửi thông tin liên hệ. Vui lòng thử lại sau.');
    }
  }
};

/**
 * Đăng ký nhận thông báo về cuộc bầu cử
 * @param email Email đăng ký
 * @returns Kết quả đăng ký
 */
export const subscribeToUpdates = async (email: string): Promise<any> => {
  try {
    const response = await apiClient.post(`${API_URL}/subscribe`, { email });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Email không hợp lệ.');
    } else {
      throw new Error('Không thể đăng ký nhận thông báo. Vui lòng thử lại sau.');
    }
  }
};

/**
 * Kiểm tra hiệu lực của phiếu mời tham gia bầu cử
 * @param token Token phiếu mời
 * @returns Thông tin phiếu mời
 */
export const checkInviteTokenValidity = async (token: string): Promise<any> => {
  try {
    const response = await apiClient.get(
      `/api/PhieuMoi/kiem-tra?token=${encodeURIComponent(token)}`,
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error('Token không hợp lệ.');
    } else if (error.response?.status === 404) {
      throw new Error('Không tìm thấy phiếu mời hoặc phiếu mời đã hết hạn.');
    } else {
      throw new Error('Không thể kiểm tra phiếu mời. Vui lòng thử lại sau.');
    }
  }
};
