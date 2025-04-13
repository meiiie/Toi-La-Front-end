import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Calendar, Users, Trash, Clock } from 'lucide-react';
import { PhienBauCu } from '../store/types';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { removePhienBauCu } from '../store/slice/phienBauCuSlice';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../components/ui/AlterDialog';

// Hàm phân tích chuỗi ngày tháng theo định dạng Việt Nam
const parseVietnameseDate = (dateStr: string) => {
  const [datePart, timePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hour, minute] = timePart ? timePart.split(':') : ['00', '00'];
  return new Date(+year, +month - 1, +day, +hour, +minute);
};

// Hàm định dạng ngày tháng theo kiểu Việt Nam
const formatVietnameseDate = (date: Date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hour}:${minute}`;
};

const CardPhienBauCu = ({ session }: { session: PhienBauCu }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Format dates properly
  const formatDateFromAnySource = (dateSource: Date | string) => {
    if (dateSource instanceof Date) {
      return formatVietnameseDate(dateSource);
    }

    // Check if it's a string in Vietnamese date format (DD/MM/YYYY)
    if (typeof dateSource === 'string' && dateSource.includes('/')) {
      return formatVietnameseDate(parseVietnameseDate(dateSource));
    }

    // Handle other string formats (ISO, etc.)
    return formatVietnameseDate(new Date(dateSource));
  };

  const ngayBatDau = formatDateFromAnySource(session.ngayBatDau);
  const ngayKetThuc = formatDateFromAnySource(session.ngayKetThuc);

  const handleDelete = async () => {
    await dispatch(removePhienBauCu(session.id));
    setIsDialogOpen(false);
  };

  const handleManage = () => {
    navigate(`${location.pathname}/${session.id}/phien-bau-cu`);
  };

  return (
    <Card className="w-full rounded-xl shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-2">
              {session.tenPhienBauCu}
            </h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center text-[10px] sm:text-sm">
                <Calendar className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                <span className="truncate">Bắt đầu: {ngayBatDau}</span>
              </div>
              <div className="flex items-center text-[10px] sm:text-sm">
                <Clock className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                <span className="truncate">Kết thúc: {ngayKetThuc}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{session.moTa}</span>
              </div>
            </div>
          </div>
          <StatusBadge status={session.trangThai || ''} />
        </div>
        {session.trangThai === 'Đang diễn ra' && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${session.tienTrinhPhienBau}%` }}
              ></div>
            </div>
            <p className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(session.tienTrinhPhienBau ?? 0)}% hoàn thành
            </p>
          </div>
        )}
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline">Chi Tiết</Button>
          <Button onClick={handleManage}>Quản Lý</Button>
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="mr-1 h-4 w-4" /> Xóa
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa phiên bầu cử này? Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Sắp diễn ra':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Đang diễn ra':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Đã kết thúc':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
      {status}
    </span>
  );
};

export default CardPhienBauCu;
