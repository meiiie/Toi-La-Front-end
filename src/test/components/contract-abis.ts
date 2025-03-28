export const QUAN_LY_PHIEN_BAU_CU_ABI = [
  // Lấy thời gian bắt đầu phiên bầu cử
  'function layThoiGianBatDauPhienBauCu(uint256 idPhienBauCu) view returns (uint256)',

  // Lấy thời gian kết thúc phiên bầu cử
  'function layThoiGianKetThucPhienBauCu(uint256 idPhienBauCu) view returns (uint256)',

  // Kiểm tra phiên bầu cử có đang hoạt động
  'function dangHoatDong(uint256 idPhienBauCu) view returns (bool)',

  // Lấy số cử tri tối đa
  'function soCuTriToiDa(uint256 idPhienBauCu) view returns (uint256)',

  // Lấy số phiếu đã bầu
  'function soPhieuDaBau(uint256 idPhienBauCu) view returns (uint256)',

  // Lấy tên phiên bầu cử
  'function tenPhienBauCu(uint256 idPhienBauCu) view returns (string)',

  // Lấy danh sách ứng viên
  'function layDanhSachUngVien(uint256 idPhienBauCu) view returns (address[])',

  // Lấy tên ứng viên
  'function tenUngVien(uint256 idPhienBauCu, address ungVien) view returns (string)',
];

export const QUAN_LY_PHIEU_BAU_ABI = [
  // Kiểm tra quyền bầu cử
  'function kiemTraQuyenBauCu(address cuTri, uint256 idPhienBauCu, uint256 idToken) view returns (bool)',

  // Bỏ phiếu
  'function boPhieu(uint256 idToken, uint256 idPhienBauCu, address ungVien) returns (bool)',

  // Event khi phiếu đã bỏ
  'event PhieuDaBo(address indexed cuTri, uint256 indexed idToken, uint256 indexed idPhienBauCu, address ungVien)',
];
