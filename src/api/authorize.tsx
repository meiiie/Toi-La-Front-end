import { searchCacTaiKhoan } from './nguoiDungApi';

export async function authorize(id: number): Promise<string[]> {
  const taiKhoan = await searchCacTaiKhoan({ id });
  if (taiKhoan.length > 0) {
    return [taiKhoan[0].vaiTro.tenVaiTro];
  } else {
    return [];
  }
}
