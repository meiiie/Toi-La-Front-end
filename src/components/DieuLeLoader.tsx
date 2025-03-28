'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import type { AppDispatch, RootState } from '../store/store';
import { fetchDieuLeByCuocBauCuId, kiemTraXacNhan } from '../store/slice/dieuLeSlice';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/Alter';
import { AlertCircle } from 'lucide-react';

interface DieuLeLoaderProps {
  children: React.ReactNode;
  onLoaded?: (hasRules: boolean) => void;
}

const DieuLeLoader: React.FC<DieuLeLoaderProps> = ({ children, onLoaded }) => {
  const { id: cuocBauCuId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const [isInitialized, setIsInitialized] = useState(false);

  // Redux state
  const { dieuLeCuocBauCu, dangTai, loi } = useSelector((state: RootState) => state.dieuLe);
  const user = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);

  useEffect(() => {
    if (cuocBauCuId && !isInitialized) {
      dispatch(fetchDieuLeByCuocBauCuId(Number(cuocBauCuId)));
      setIsInitialized(true);
    }
  }, [dispatch, cuocBauCuId, isInitialized]);

  useEffect(() => {
    // Kiểm tra xác nhận điều lệ nếu người dùng đã đăng nhập và có điều lệ
    if (user?.id && dieuLeCuocBauCu?.id && dieuLeCuocBauCu.yeuCauXacNhan) {
      dispatch(kiemTraXacNhan({ dieuLeId: dieuLeCuocBauCu.id, taiKhoanId: user.id }));
    }
  }, [dispatch, user, dieuLeCuocBauCu]);

  useEffect(() => {
    // Thông báo cho component cha biết trạng thái tải điều lệ
    if (!dangTai && onLoaded) {
      onLoaded(!!dieuLeCuocBauCu);
    }
  }, [dangTai, dieuLeCuocBauCu, onLoaded]);

  if (dangTai) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600 dark:text-gray-300">Đang tải thông tin điều lệ...</span>
      </div>
    );
  }

  if (loi) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Lỗi</AlertTitle>
        <AlertDescription>Không thể tải thông tin điều lệ: {loi}</AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

export default DieuLeLoader;
