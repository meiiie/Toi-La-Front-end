'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet';
import type { CuTri } from '../store/types';
import VoterForm from '../components/FormCuTri';
import VoterTable from '../components/BangCuTri';
import EnhancedQRCode from '../components/EnhancedQRCode';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import {
  fetchCuTriByPhienBauCuId,
  addBulkCuTri,
  removeCuTri,
  clearCuTriState,
} from '../store/slice/cuTriSlice';
import { fetchCacVaiTro, clearVaiTroState } from '../store/slice/vaiTroSlice';
import { taoPhieuMoi } from '../store/slice/phieuMoiPhienBauCuSlice';
import { fetchPhienBauCuById } from '../store/slice/phienBauCuSlice';
import type { RootState, AppDispatch } from '../store/store';
import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastViewport,
} from '../components/ui/Toast';

type VoterManagementProps = {
  darkMode: boolean;
  phienBauCuId: string;
};

const QuanLyCuTriPage: React.FC<VoterManagementProps> = ({ phienBauCuId, darkMode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { id: cuocBauCuId } = useParams<{ id: string }>();
  const cuTris = useSelector((state: RootState) => state.cuTri.cacCuTri);
  const roles = useSelector((state: RootState) => state.vaiTro.cacVaiTro);
  const loading = useSelector((state: RootState) => state.cuTri.dangTai);
  const error = useSelector((state: RootState) => state.cuTri.loi);
  const nguoiDung = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [electionName, setElectionName] = useState<string>('Không phải phiên bầu cử');
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    variant?: 'default' | 'destructive';
  } | null>(null);

  const fetchData = useCallback(async () => {
    dispatch({ type: 'cuTris/dangTai', payload: true });
    dispatch(clearCuTriState());
    dispatch(clearVaiTroState());
    try {
      await Promise.all([
        dispatch(fetchCuTriByPhienBauCuId(Number(phienBauCuId))).unwrap(),
        dispatch(fetchCacVaiTro()).unwrap(),
      ]);
      const election = await dispatch(fetchPhienBauCuById(Number(phienBauCuId))).unwrap();
      setElectionName(election.tenPhienBauCu);
    } catch (error) {
      console.error('Không thể tải dữ liệu:', error);
      dispatch({ type: 'cuTris/loi', payload: 'Không thể tải dữ liệu. Vui lòng thử lại sau.' });
      setToastMessage({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu cử tri. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      dispatch({ type: 'cuTris/dangTai', payload: false });
    }
  }, [dispatch, phienBauCuId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveCuTris = async (newCuTris: CuTri[]) => {
    try {
      dispatch({ type: 'cuTris/dangTai', payload: true });
      await dispatch(addBulkCuTri(newCuTris)).unwrap();
      console.log('Thanh cong', newCuTris);
      setToastMessage({
        title: 'Thành công',
        description: 'Cử tri mới đã được lưu.',
      });
    } catch (error) {
      console.log('That bai', newCuTris);
      console.error('Không thể lưu cử tri:', error);
      setToastMessage({
        title: 'Lỗi',
        description: 'Không thể lưu cử tri mới. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      dispatch({ type: 'cuTris/dangTai', payload: false });
    }
  };

  const handleAssignRole = async (cuTri: CuTri, roleId: number) => {
    // try {
    //   dispatch({ type: 'cuTris/dangTai', payload: true });
    //   await dispatch(editCuTri({ id: cuTri.id, cuTri: { ...cuTri, vaiTroId: roleId } })).unwrap();
    //   setToastMessage({
    //     title: 'Thành công',
    //     description: `Vai trò đã được cập nhật cho cử tri ${cuTri.email}.`,
    //   });
    // } catch (error) {
    //   console.error('Không thể cập nhật vai trò:', error);
    //   setToastMessage({
    //     title: 'Lỗi',
    //     description: 'Không thể cập nhật vai trò. Vui lòng thử lại sau.',
    //     variant: 'destructive',
    //   });
    // } finally {
    //   dispatch({ type: 'cuTris/dangTai', payload: false });
    // }
  };

  const handleRemoveCuTri = async (id: number) => {
    try {
      dispatch({ type: 'cuTris/dangTai', payload: true });
      await dispatch(removeCuTri(id)).unwrap();
      setToastMessage({
        title: 'Thành công',
        description: 'Cử tri đã được xóa.',
      });
    } catch (error) {
      console.error('Không thể xóa cử tri:', error);
      setToastMessage({
        title: 'Lỗi',
        description: 'Không thể xóa cử tri. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      dispatch({ type: 'cuTris/dangTai', payload: false });
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const result = await dispatch(
        taoPhieuMoi({
          nguoiTaoId: nguoiDung?.id ?? 0,
          phienBauCuId: Number.parseInt(phienBauCuId),
          cuocBauCuId: Number.parseInt(cuocBauCuId ?? '0'), // Assuming cuocBauCuId is the same as phienBauCuId
        }),
      ).unwrap();
      const inviteLink = result.inviteUrl ?? ''; // Sử dụng inviteUrl trả về từ backend

      // Trích xuất token từ inviteLink
      const url = new URL(inviteLink);
      const token = url.searchParams.get('token');

      setInviteLink(token ?? '');
      setToastMessage({
        title: 'Thành công',
        description: 'Đã tạo mã mời thành công.',
      });

      console.log('Token:', token); // In ra token để kiểm tra
    } catch (error) {
      console.error('Không thể tạo mã mời:', error);
      setToastMessage({
        title: 'Lỗi',
        description: 'Không thể tạo mã mời. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Đang tải...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <ToastProvider>
      <div className={`min-h-screen p-4 ${darkMode ? 'dark' : ''}`}>
        <Helmet>
          <title>Quản lý cử tri | Nền Tảng Bầu Cử Blockchain</title>
          <meta name="description" content="Quản lý và thêm cử tri cho phiên bầu cử." />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="keywords" content="quản lý cử tri, bầu cử, thêm cử tri" />
        </Helmet>
        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Quản Lý Cử Tri</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="list">Danh Sách Cử Tri</TabsTrigger>
                <TabsTrigger value="add">Thêm Cử Tri</TabsTrigger>
                <TabsTrigger value="invite">Mời Cử Tri</TabsTrigger>
              </TabsList>
              <TabsContent value="list">
                <VoterTable
                  voters={cuTris}
                  roles={roles}
                  onAssignRole={handleAssignRole}
                  onSaveChanges={(updatedCuTris) =>
                    dispatch({ type: 'cuTris/setVoters', payload: updatedCuTris })
                  }
                  onRemoveVoter={handleRemoveCuTri}
                  isEditPage={true}
                />
              </TabsContent>
              <TabsContent value="add">
                <VoterForm onSave={handleSaveCuTris} phienBauCuId={Number(phienBauCuId)} />
              </TabsContent>
              <TabsContent value="invite">
                <div className="space-y-4">
                  <Button
                    onClick={handleGenerateInvite}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Tạo Mã Mời Mới
                  </Button>
                  {inviteLink && (
                    <div className="flex justify-center">
                      <EnhancedQRCode result={inviteLink} electionName={electionName} />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        {toastMessage && (
          <Toast variant={toastMessage.variant}>
            <ToastTitle>{toastMessage.title}</ToastTitle>
            <ToastDescription>{toastMessage.description}</ToastDescription>
          </Toast>
        )}
        <ToastViewport />
      </div>
    </ToastProvider>
  );
};

export default QuanLyCuTriPage;
