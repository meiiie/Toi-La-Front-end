'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TaoPhienBauCu from './TaoPhienBauCu';
import BatDauPhienBauCu from './BatDauPhienBauCu';
import apiClient from '../api/apiClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';

const PhienBauCuManager: React.FC = () => {
  const { idCuocBauCu } = useParams<{ idCuocBauCu: string }>();
  const [phienBauCus, setPhienBauCus] = useState<string[]>([]);
  const [selectedPhien, setSelectedPhien] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPhienBauCus = async () => {
      if (!idCuocBauCu) return;

      try {
        setIsLoading(true);
        const response = await apiClient.get(`/api/CuocBauCu/phienbaucu/${idCuocBauCu}`);

        if (response.data && Array.isArray(response.data)) {
          setPhienBauCus(response.data.map((phien) => phien.toString()));

          // Mặc định chọn phiên mới nhất
          if (response.data.length > 0) {
            setSelectedPhien(response.data[response.data.length - 1].toString());
          }
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách phiên bầu cử:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhienBauCus();
  }, [idCuocBauCu]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        Quản lý phiên bầu cử - Cuộc bầu cử #{idCuocBauCu}
      </h1>

      <Tabs defaultValue="tao-phien" className="mb-8">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="tao-phien">Tạo phiên mới</TabsTrigger>
          <TabsTrigger value="bat-dau-phien" disabled={phienBauCus.length === 0}>
            Bắt đầu phiên
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tao-phien" className="mt-6">
          <TaoPhienBauCu idCuocBauCu={idCuocBauCu || ''} />
        </TabsContent>

        <TabsContent value="bat-dau-phien" className="mt-6">
          {phienBauCus.length > 0 ? (
            <>
              <div className="mb-6">
                <label htmlFor="phien-select" className="block text-sm font-medium mb-2">
                  Chọn phiên bầu cử
                </label>
                <select
                  id="phien-select"
                  value={selectedPhien}
                  onChange={(e) => setSelectedPhien(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                >
                  {phienBauCus.map((phienId) => (
                    <option key={phienId} value={phienId}>
                      Phiên #{phienId}
                    </option>
                  ))}
                </select>
              </div>

              <BatDauPhienBauCu idCuocBauCu={idCuocBauCu || ''} idPhienBauCu={selectedPhien} />
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {isLoading ? 'Đang tải...' : 'Chưa có phiên bầu cử nào. Hãy tạo phiên bầu cử mới.'}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PhienBauCuManager;
