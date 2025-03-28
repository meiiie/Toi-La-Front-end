import type { PhoneInputRefType } from 'react-international-phone';

export type CuTri = {
  id: number;
  sdt?: string;
  email?: string;
  xacMinh?: boolean;
  boPhieu?: boolean;
  soLanGuiOTP?: number;
  cuocBauCuId?: number;
  phienBauCuId?: number;
  taiKhoanId?: number;
};

export type ContactData = {
  ten: string;
  tuoi: number;
  email: string;
  lyDo: 'Hỗ trợ kỹ thuật' | 'Phản hồi và góp ý' | 'Hợp tác kinh doanh' | 'Lý do khác';
  ghiChu?: string;
};

export type RegisterResponse = {
  success: boolean;
  message: string;
  accessToken: string;
  user: {
    Id: number;
    TenDangNhap: string;
    Email: string;
    TenHienThi: string;
    NgayThamGia: string;
    VaiTro: string;
  };
  wallets: Array<{
    ViId: number;
    TaiKhoanId: number;
    DiaChiVi: string;
    LoaiVi: number;
    SCWNonce: number | null;
    ThoiGianTao: string;
    TrangThai: boolean;
    IsPrimaryWallet: boolean;
  }>;
};

export type RegisterPayload = {
  account: TaoTaiKhoanTamThoi;
  recaptchaToken: string;
};

export type TrangThaiDangKyTaiKhoan = {
  dangTai: boolean;
  loi: string | null;
  thanhCong: boolean;
  user: {
    id: number;
    tenDangNhap: string;
    email: string;
    tenHienThi: string;
    ngayThamGia: string;
    vaiTro: string;
  } | null;
  wallets: Array<{
    ViId: number;
    TaiKhoanId: number;
    DiaChiVi: string;
    LoaiVi: number;
    SCWNonce: number | null;
    ThoiGianTao: string;
    TrangThai: boolean;
    IsPrimaryWallet: boolean;
  }> | null;
  accessToken: string | null;
};

export type SubscribeData = {
  email: string;
};

export type UploadFileResponse = {
  message: string;
  data: {
    tenFileDuocTao: string;
    tenFileGoc: string;
    fileUrl: string;
    noiDungType: string;
    kichThuoc: number;
    ngayUpload: string;
    kichThuocHienThi: string;
    ngayHienThi: string;
  };
  fileName?: string;
  url?: string;
  fileUrl?: string;
  tenFileDuocTao?: string;
  noiDungType?: string;
  ngayHienThi?: string;
  kichThuocHienThi?: string;
  cuocBauCuId?: number;
  phienBauCuId?: number;
};

// Interface cho response khi upload ảnh cuộc bầu cử
export type UploadImageResponse = {
  success: boolean;
  message: string;
  imageUrl: string;
  fileName: string;
  fileInfo?: {
    id: number;
    tenFile: string;
    kichThuoc: string;
    ngayUpload: string;
    noiDungType?: string;
  };
};

// Interface cho response khi lấy nhiều ảnh
export type MultipleImagesResponse = {
  success: boolean;
  images: Array<{
    cuocBauCuId: number;
    imageUrl: string;
    fileName: string;
    fileInfo?: {
      id: number;
      tenFile: string;
      kichThuoc: string;
      ngayUpload: string;
      noiDungType?: string;
    };
  }>;
};

export type PhieuMoiPhienBauCu = {
  id: number;
  phienBauCuId: number;
  cuocBauCuId: number;
  nguoiTaoId: number;
  ngayTao: Date;
  ngayHetHan: Date;
  hieuLuc: boolean;
  token: string;
  inviteUrl?: string;
};

export type UngCuVien = {
  id: number;
  hoTen: string;
  anh: string;
  moTa: string;
  viTriUngCuId: number;
  cuocBauCuId?: number;
  phienBauCuId?: number;
};

export type VaiTro = {
  id: number;
  tenVaiTro: string;
  //quyen: Quyen[];
  chucNang?: ChucNang[];
};

export type ChucNang = {
  id: number;
  tenChucNang: string;
};

// export type VaiTroChucNang = {
//   id: number;
//   vaiTroId: number;
//   chucNangId: number;
//   tenVaiTro?: string;
//   chucNangs?: ChucNang;
// };

export type VaiTroChucNang = {
  id: number;
  vaiTroId: number;
  tenVaiTro?: string;
  chucNangs?: ChucNang[];
};

export type TaiKhoan = {
  id: number;
  tenDangNhap: string;
  matKhau: string;
  email: string;
  sdt: string;
  trangThai: boolean;
  lanDangNhapCuoi?: Date;
  ngayThamGia?: Date;
  vaiTro?: VaiTro;
  avatar?: string;
  lichSuHoatDong?: string[]; // Thêm thuộc tính recentActivities
  anhDaiDien?: string;
  diaChiVi?: string;
  isMetaMask?: boolean;
  tenHienThi?: string;
};

export type BauCuVaiTro = {
  id: number;
  vaiTroId: number;
  cuTriId: number;
  cuocBauCuId: number;
  phienBauCuId: number;
};

export type TaiKhoanVaiTro = {
  id: number;
  taiKhoanId: number;
  vaiTroId: number;
};

export type CuocBauCu = {
  id: number;
  tenCuocBauCu: string;
  moTa: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  taiKhoanId: number;
  // Thêm các trường từ CuocBauCuDetailDTO
  anhCuocBauCu?: string;
  blockchainServerId?: number;
  blockchainAddress?: string;
  trangThaiBlockchain?: number;
  errorMessage?: string;
  // Các trường khác
  anh?: string; // Giữ lại trường anh để tương thích ngược
  trangThai?: string;
  phienBauCu?: PhienBauCu[];
  gioBatDau?: string;
  gioKetThuc?: string;
  soLuongUngVien?: number;
  tongSoPhieuBau?: number;
};

// Định nghĩa các trạng thái blockchain
export enum TrangThaiBlockchain {
  ChuaTrienKhai = 0,
  DangTrienKhai = 1,
  DaTrienKhai = 2,
  TrienKhaiThatBai = 3,
}

export type PhienBauCu = {
  id: number;
  tenPhienBauCu: string;
  cuocBauCuId: number;
  moTa: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  trangThai?: string;
  tienTrinhPhienBau?: number;
  gioBatDau?: string;
  gioKetThuc?: string;
};

export type ViTriUngCu = {
  id: number;
  tenViTriUngCu: string;
  soPhieuToiDa: number;
  phienBauCuId: number;
  cuocBauCuId?: number;
  ungCuVien?: UngCuVien[];
};

export type PhieuBau = {
  id: number;
  ungCuVienId: number;
  cuTriId: number;
  viTriUngCuId: number;
  phienBauCuId?: number;
  cuocBauCuId: number;
  ungCuVien?: UngCuVien;
};

export type LichSuHoatDong = {
  id: number;
  taiKhoanId: number;
  hoatDong: string;
  thoiGian: Date;
  moTa?: string;
};

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export type PhienDangNhap = {
  id: string;
  taiKhoanId: number;
  duLieuPhien: string;
  ip: string;
  thietBi: string;
  trinhDuyet: string;
  ngayTao: Date;
  ngayHetHan: Date;
  isActive: boolean;
  accessToken?: string;
  refreshToken?: string;
};
export type ThongBao = {
  id: number;
  taiKhoanId: number;
  tieuDe: string;
  noiDung: string;
  ngayGui: Date;
  trangThai: boolean;
};

export type CauHinhHeThong = {
  id: number;
  tenCauHinh: string;
  giaTri: string;
};

export type SendOtpResponse = {
  success: boolean;
  message: string;
};

export type VerifyOtpRequest = {
  email: string;
  otp: string;
};

export type VerifyOtpResponse = {
  success: boolean;
  message: string;
};

//them moi
export type TaoTaiKhoanTamThoi = {
  id: string;
  tenDangNhap: string;
  matKhau: string;
  email: string;
  trangThai: boolean;
  ngayThamGia: string;
  lanDangNhapCuoi: string;
  recaptcha?: string;
  //tach ra
  hoten?: string;
  refreshTokenExpiryTime?: string;
  avatar?: string;
  linkFacebook?: string;
  linkTwitter?: string;
  linkLinkedIn?: string;
  linkInstagram?: string;
  linkGithub?: string;
  linkMetaMask?: string;
  diaChi?: string;
  tieuSu?: string;
  ngaySinh?: Date | string; // Updated to accept string for date input
  gioiTinh?: boolean | string; // Updated to accept string for radio input
  socialLinks?: {
    linkedIn?: string;
    github?: string;
    twitter?: string;
  };
  twoFactorEnabled?: boolean;
  notifications?: {
    email?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
  ho?: string;
  ten?: string;
  xacNhanMatKhau?: string;
  sdt?: string;
  vaiTro?: VaiTro;
  agreeTerms?: boolean;
  phoneInputRef?: React.RefObject<PhoneInputRefType>; // Add this for the phone input ref
  diaChiVi?: string;
  isMetaMask?: boolean;
};

export type LoginMetaMaskData = {
  diaChiVi: string;
  nonce: string;
  signature: string;
};

//them moi
export interface SearchTaiKhoanResponse {
  data: TaoTaiKhoanTamThoi[];
  pageIndex: number;
  pageSize: number;
  totalData: number;
  avatar?: string;
  email?: string;
}

export type TaiKhoanVaiTroAdmin = {
  id: number;
  tenDangNhap: string;
  email: string;
  taiKhoanId: number;
  vaiTroId: number;
  rangThai: boolean;
  tenVaiTro: string;
};

export type DuLieuTaiKhoanMoi = TaiKhoan & {
  linkFacebook?: string;
  linkTwitter?: string;
  linkLinkedIn?: string;
  linkInstagram?: string;
  linkGithub?: string;
  linkMetaMask?: string;
  diaChi?: string;
  tieuSu?: string;
  ngaySinh?: Date;
  gioiTinh?: boolean;
  socialLinks?: {
    linkedIn?: string;
    github?: string;
    twitter?: string;
  };
  twoFactorEnabled?: boolean;
  notifications?: {
    email?: boolean;
    sms?: boolean;
    inApp?: boolean;
  };
  ho?: string;
  ten?: string;
  xacNhanMatKhau?: string;
};

export type DuLieuQuanLyCuocBauCu = CuocBauCu & {
  soLuongUngVien?: number;
  tongSoPhieuBau?: number;
};

export type DuLieuCuocBauCuMoi = CuocBauCu;

export type DuLieuCuocBauCuDaLuu = CuocBauCu;

export type TheCuocBauCu = CuocBauCu;

export type DuLieuCuTri = CuTri;

export type DuLieuUngCuVien = UngCuVien;

// Request type cho deploy blockchain
export type DeployBlockchainRequest = {
  SCWAddress: string;
};

// Request type cho record transaction
export type RecordTransactionRequest = {
  txHash: string;
  scwAddress: string;
};

// Request type cho sync blockchain
export type SyncBlockchainRequest = {
  forceCheck?: boolean;
  frontendHash?: string;
  backendHash?: string;
};

// Response type từ blockchain API
export type BlockchainStatusResponse = {
  success: boolean;
  status: number;
  blockchainServerId?: number;
  blockchainAddress?: string;
  errorMessage?: string;
  transactionHash?: string;
  paymasterUsed?: boolean;
};

// Thêm vào types.tsx
export type DieuLe = {
  id: number;
  cuocBauCuId: number;
  tieuDe: string;
  noiDung: string;
  tenFile?: string;
  fileUrl?: string;
  phienBan: number; // Số phiên bản (1, 2, 3, ...)
  thoiGianTao: string;
  thoiGianCapNhat: string;
  taiKhoanCapNhatId: number;
  daCongBo: boolean; // Trạng thái công bố
  yeuCauXacNhan: boolean; // Yêu cầu người dùng xác nhận đã đọc
};

export type XacNhanDieuLe = {
  id: number;
  dieuLeId: number;
  taiKhoanId: number;
  thoiGianXacNhan: string;
};

export type UploadDieuLeResponse = {
  success: boolean;
  message: string;
  dieuLeId: number;
  fileUrl: string;
  fileName: string;
  fileInfo: {
    id: number;
    tenFile: string;
    kichThuoc: string;
    ngayUpload: string;
    noiDungType: string;
  };
};

export type ViBlockchain = {
  viId: number;
  taiKhoanId: number;
  diaChiVi: string;
  loaiVi: number; // 0: Không xác định, 1: MetaMask, 2: SCW
  scwNonce: number | null;
  thoiGianTao: string;
  trangThai: boolean;
  isPrimaryWallet: boolean;
  nguonTao: string;
};

// Định nghĩa tương tự như các payload từ Backend
export type DieuLeDTO = {
  cuocBauCuId: number;
  tieuDe: string;
  noiDung: string;
  daCongBo: boolean;
  yeuCauXacNhan: boolean;
};

export type CapNhatTrangThaiDTO = {
  daCongBo: boolean;
};

export type ThongBaoDieuLeDTO = {
  cuocBauCuId: number;
};

export type XacNhanDieuLeDTO = {
  taiKhoanId: number;
};
