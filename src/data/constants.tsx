import {
  FaUserFriends,
  FaLock,
  FaEye,
  FaCheckCircle,
  FaChartLine,
  FaDatabase,
} from 'react-icons/fa';

export const blockchainBenefits = [
  {
    title: 'An toàn',
    icon: <FaCheckCircle size={48} className="mx-auto mb-4 text-white" />,
    description: 'Blockchain cung cấp một nền tảng an toàn cho các cuộc bầu cử.',
  },
  {
    title: 'Minh bạch',
    icon: <FaChartLine size={48} className="mx-auto mb-4 text-white" />,
    description: 'Mọi thông tin đều được công khai và không thể bị can thiệp.',
  },
  {
    title: 'Không thể thay đổi',
    icon: <FaDatabase size={48} className="mx-auto mb-4 text-white" />,
    description: 'Dữ liệu được lưu trữ trên blockchain không thể bị thay đổi.',
  },
];

export const userBenefits = [
  {
    title: 'Dễ dàng sử dụng',
    icon: <FaUserFriends size={48} className="mx-auto mb-4 text-white" />,
    description: 'Giao diện thân thiện và dễ sử dụng cho mọi người.',
  },
  {
    title: 'Bảo mật cao',
    icon: <FaLock size={48} className="mx-auto mb-4 text-white" />,
    description: 'Thông tin cá nhân được bảo vệ tuyệt đối.',
  },
  {
    title: 'Minh bạch',
    icon: <FaEye size={48} className="mx-auto mb-4 text-white" />,
    description: 'Mọi thông tin đều được công khai và không thể bị can thiệp.',
  },
];

export const introductionCards = [
  {
    title: 'Bảo mật',
    imgSrc: './logo_truong.png',
    description: 'Hệ thống sử dụng công nghệ blockchain để đảm bảo tính bảo mật cao nhất.',
  },
  {
    title: 'Minh bạch',
    imgSrc: './logo_truong.png',
    description: 'Mọi thông tin đều được công khai và không thể bị can thiệp.',
  },
  {
    title: 'Không thể thay đổi',
    imgSrc: './logo_truong.png',
    description: 'Dữ liệu được lưu trữ trên blockchain không thể bị thay đổi.',
  },
];

export const electionSteps = [
  'Đăng ký tham gia bầu cử.',
  'Xác minh danh tính.',
  'Tham gia bỏ phiếu.',
  'Kết quả được công bố.',
];

export const partners = [
  { name: 'Anh Hùng', imgSrc: './anhdong.jpg' },
  { name: 'Anh Vũ', imgSrc: './anhvu.jpg' },
  { name: 'Thầy Duy', imgSrc: './thayduy.jpg' },
];

export interface User {
  id: number;
  name: string;
  avatar: string;
}

export const users: User[] = [
  {
    id: 1,
    name: 'Hồng',
    avatar: './hong.jpg',
  },
  {
    id: 2,
    name: 'Linh',
    avatar: './linh.jpg',
  },
  {
    id: 3,
    name: 'Hùng',
    avatar: './hung.jpg',
  },
  // Thêm nhiều người dùng khác ở đây
];
