import { searchCacTaiKhoan } from './nguoiDungApi';
import { TaiKhoan } from '../store/types';

export async function authenticate(
  tenDangNhap: string,
  matKhau: string,
): Promise<TaiKhoan | undefined> {
  try {
    const taiKhoans = await searchCacTaiKhoan({ tenDangNhap });
    if (taiKhoans.length > 0 && taiKhoans[0].matKhau === matKhau) {
      return taiKhoans[0];
    }
    return undefined;
  } catch (error) {
    console.error('Lỗi khi xác thực tài khoản:', error);
    throw error;
  }
}

export type { TaiKhoan };
