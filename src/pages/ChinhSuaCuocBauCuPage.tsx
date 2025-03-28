import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchCacCuocBauCu, editCuocBauCu } from '../store/slice/cuocBauCuSlice';
import { PhienBauCu, DuLieuCuocBauCuMoi } from '../store/types';
import ElectionForm from '../features/CuocBauCuForm';

const ChinhSuaCuocBauCuPage: React.FC = () => {
  const { id: cuocBauCuId } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const cuocBauCu = useSelector((state: RootState) =>
    state.cuocBauCu.cacCuocBauCu.find((cuocBauCu) => cuocBauCu.id === Number(cuocBauCuId)),
  );
  const [initialData, setInitialData] = useState<PhienBauCu | null>(null);

  useEffect(() => {
    if (!cuocBauCu) {
      dispatch(fetchCacCuocBauCu());
    } else {
      setInitialData({
        ...cuocBauCu,
        tenPhienBauCu: cuocBauCu.tenCuocBauCu || '',
        cuocBauCuId: cuocBauCu.id || 0,
      });
    }
  }, [dispatch, cuocBauCu]);

  const handleSave = async (updatedCuocBauCuData: DuLieuCuocBauCuMoi): Promise<void> => {
    if (!cuocBauCu) {
      throw new Error('Không tìm thấy cuộc bầu cử');
    }

    const updatedCuocBauCu = {
      ...cuocBauCu,
      ...updatedCuocBauCuData,
    };

    await dispatch(editCuocBauCu({ id: Number(cuocBauCuId), tenCuocBauCu: updatedCuocBauCu }));
    navigate('/app/user-elections');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 p-4 sm:p-6">
      <Helmet>
        <title>Chỉnh sửa Cuộc Bầu Cử | Nền Tảng Bầu Cử Blockchain</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Trang chỉnh sửa các chi tiết của cuộc bầu cử, bao gồm tên, mô tả, thời gian bắt đầu và kết thúc."
        />
        <meta
          name="keywords"
          content="chỉnh sửa cuộc bầu cử, bầu cử, quản lý bầu cử, nền tảng bầu cử blockchain"
        />
        <meta property="og:title" content="Chỉnh sửa Cuộc Bầu Cử - Bầu Cử Blockchain" />
        <meta
          property="og:description"
          content="Trang chỉnh sửa các chi tiết của cuộc bầu cử, bao gồm tên, mô tả, thời gian bắt đầu và kết thúc."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="http://localhost:3000/edit-election" />
        <meta property="og:image" content="http://localhost:3000/logo.png" />
      </Helmet>
      <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-gray-700 to-blue-500 dark:from-green-400 to-blue-500 text-transparent bg-clip-text">
          Chỉnh sửa Cuộc Bầu Cử
        </h1>
        {initialData ? (
          <ElectionForm />
        ) : (
          <p className="text-center text-gray-500">Đang tải dữ liệu...</p>
        )}
      </div>
    </div>
  );
};

export default ChinhSuaCuocBauCuPage;
