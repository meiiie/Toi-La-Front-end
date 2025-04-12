import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, UserPlus, Info, ArrowRight, CheckCircle, Loader, AlertTriangle } from 'lucide-react';

import { AppDispatch, RootState } from '../store/store';
import {
  checkAccountIsCandidateStatus,
  registerCandidateWithVoter,
  registerCandidateFromAccount,
  resetDangKyUngVien,
} from '../store/slice/ungCuVienSlice';
import { fetchViTriUngCuByPhienBauCuId } from '../store/slice/viTriUngCuSlice';

import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import IntegratedCandidateForm from './FormUngVienTichHop';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/Dialog';

interface DangKyUngVienProps {
  phienBauCuId: number;
  cuocBauCuId?: number;
  className?: string;
}

const DangKyUngVien: React.FC<DangKyUngVienProps> = ({
  phienBauCuId,
  cuocBauCuId,
  className = '',
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Lấy thông tin từ Redux store
  const { dangKyUngVien, isCandidateStatus } = useSelector((state: RootState) => state.ungCuVien);
  const viTriList = useSelector((state: RootState) => state.viTriUngCu.cacViTriUngCu);
  const currentUser = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);

  // Check if the user is already a candidate
  useEffect(() => {
    const checkCandidateStatus = async () => {
      if (currentUser?.id && phienBauCuId) {
        setIsChecking(true);
        try {
          await dispatch(
            checkAccountIsCandidateStatus({
              taiKhoanId: currentUser.id,
              phienBauCuId,
            }),
          );
        } catch (error) {
          console.error('Lỗi khi kiểm tra trạng thái ứng viên:', error);
        } finally {
          setIsChecking(false);
        }
      }
    };

    checkCandidateStatus();

    // Tải danh sách vị trí ứng cử
    if (phienBauCuId) {
      dispatch(fetchViTriUngCuByPhienBauCuId(phienBauCuId));
    }

    // Reset trạng thái đăng ký khi component unmount
    return () => {
      dispatch(resetDangKyUngVien());
    };
  }, [dispatch, currentUser?.id, phienBauCuId]);

  // Xử lý khi form đăng ký thành công
  const handleRegistrationSuccess = () => {
    setIsFormOpen(false);

    // Cập nhật lại trạng thái ứng viên
    if (currentUser?.id) {
      dispatch(
        checkAccountIsCandidateStatus({
          taiKhoanId: currentUser.id,
          phienBauCuId,
        }),
      );
    }
  };

  // Hiển thị loading khi đang kiểm tra
  if (isChecking) {
    return (
      <Card
        className={`${className} bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-[#2A3A5A]`}
      >
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader size={40} className="animate-spin text-blue-500 dark:text-blue-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Đang kiểm tra trạng thái ứng viên...</p>
        </CardContent>
      </Card>
    );
  }

  // Hiển thị thông báo nếu người dùng đã là ứng viên
  if (isCandidateStatus[currentUser?.id]) {
    return (
      <Card
        className={`${className} bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-[#2A3A5A]`}
      >
        <CardHeader className="bg-green-500 text-white dark:bg-gradient-to-r dark:from-green-600 dark:to-green-800">
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5" />
            Bạn đã đăng ký làm ứng viên
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Đăng ký thành công</AlertTitle>
            <AlertDescription>
              Bạn đã đăng ký thành công làm ứng viên trong phiên bầu cử này. Bạn có thể theo dõi
              thông tin ứng cử của mình trong phần "Quản lý ứng viên".
            </AlertDescription>
          </Alert>

          <div className="mt-4 text-gray-600 dark:text-gray-300">
            <p>Hãy chuẩn bị thật tốt cho cuộc bầu cử sắp tới:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Chuẩn bị thông tin giới thiệu đầy đủ</li>
              <li>Cập nhật ảnh đại diện chuyên nghiệp</li>
              <li>Xây dựng kế hoạch vận động</li>
              <li>Liên hệ với ban tổ chức nếu cần hỗ trợ</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`${className} bg-white dark:bg-[#162A45]/80 border border-gray-200 dark:border-[#2A3A5A]`}
    >
      <CardHeader className="bg-blue-600 text-white dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A]">
        <CardTitle className="flex items-center">
          <UserPlus className="mr-2 h-5 w-5" />
          Đăng Ký Ứng Viên
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">Tham gia ứng cử</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-200">
              Bạn có thể đăng ký làm ứng viên trong phiên bầu cử này. Để đăng ký, bạn cần cung cấp
              thông tin cá nhân và thông tin cử tri.
            </AlertDescription>
          </Alert>

          {dangKyUngVien.loi && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>{dangKyUngVien.loi}</AlertDescription>
            </Alert>
          )}

          {viTriList.length === 0 && (
            <Alert
              variant="default"
              className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50"
            >
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-400">
                Chưa có vị trí ứng cử
              </AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                Chưa có vị trí ứng cử nào được tạo. Vui lòng liên hệ ban tổ chức để biết thêm thông
                tin.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col items-center text-center p-4 bg-gray-50 dark:bg-[#1A2942]/30 rounded-lg">
            <User className="h-16 w-16 text-blue-500 dark:text-blue-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Trở thành ứng viên
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Bạn muốn tham gia ứng cử trong phiên bầu cử này? Hãy đăng ký ngay để có cơ hội được
              chọn!
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-[#1A2942]/50 p-6 flex justify-center">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-[#0288D1] dark:to-[#6A1B9A] text-white"
              disabled={dangKyUngVien.dangXuLy || viTriList.length === 0}
            >
              {dangKyUngVien.dangXuLy ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Đăng ký làm ứng viên
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <IntegratedCandidateForm
              onSuccess={handleRegistrationSuccess}
              onCancel={() => setIsFormOpen(false)}
              phienBauCuId={phienBauCuId.toString()}
              cuocBauCuId={cuocBauCuId?.toString()}
              taiKhoanId={currentUser?.id}
            />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default DangKyUngVien;
