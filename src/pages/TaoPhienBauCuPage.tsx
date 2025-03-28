import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { addPhienBauCu } from '../store/slice/phienBauCuSlice';
import { PhienBauCu } from '../store/types';
import ElectionForm from '../features/CuocBauCuForm';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '../components/ui/AlterDialog';
import { Spinner } from '../components/ui/Spinner';

const TaoPhienBauCuPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [savedElectionId, setSavedElectionId] = useState<number | null>(null);

  const handleSave = async (newElectionData: Omit<PhienBauCu, 'id'>): Promise<PhienBauCu> => {
    try {
      setIsLoading(true);
      const createdElection = await dispatch(addPhienBauCu(newElectionData)).unwrap();
      setSavedElectionId(createdElection.id);
      setShowAlert(true);
      return createdElection;
    } catch (error) {
      setShowError('Đã xảy ra lỗi khi tạo phiên bầu cử. Vui lòng thử lại.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (savedElectionId) {
      navigate(`/app/user-elections/elections/${savedElectionId}/election-management`);
    }
  };

  return (
    <div className="min-h-screen bg-blue-400 dark:bg-gray-900 p-6 flex flex-col items-center justify-center rounded-lg">
      <Helmet>
        <title>Tạo Cuộc Bầu Cử Mới | Nền Tảng Bầu Cử Blockchain</title>
        <meta
          name="description"
          content="Trang tạo cuộc bầu cử mới trên nền tảng bầu cử blockchain. Điền thông tin để tạo cuộc bầu cử mới."
        />
        <meta name="keywords" content="Tạo cuộc bầu cử, Bầu cử, Blockchain, Cuộc bầu cử mới" />
        <meta name="author" content="Nền Tảng Bầu Cử Blockchain" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>
      <div className="max-w-7xl w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-gray-800 to-blue-700 dark:from-green-300 dark:to-blue-400 text-transparent bg-clip-text">
          Tạo Cuộc Bầu Cử Mới
        </h1>
        {showAlert && (
          <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tạo phiên bầu cử thành công</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn đã được chuyển sang trang quản lý phiên bầu cử này.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowAlert(false)}>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm}>Xác Nhận</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {showError && (
          <AlertDialog open={!!showError} onOpenChange={() => setShowError(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Lỗi</AlertDialogTitle>
                <AlertDialogDescription>{showError}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowError(null)}>Đóng</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {isLoading && (
          <div className="flex justify-center items-center">
            <Spinner size="large" />
          </div>
        )}
        {!isLoading && <ElectionForm onSave={handleSave} />}
      </div>
    </div>
  );
};

export default TaoPhienBauCuPage;
