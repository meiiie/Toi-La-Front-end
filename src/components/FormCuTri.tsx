'use client';

import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { CuTri } from '../store/types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';
import { PlusCircle, Save, Share2 } from 'lucide-react';
import VoterUploader from './VoterUploader';
import VoterList from './DanhSachCuTri';
import PaginationPhu from './PaginationPhu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from './ui/AlterDialog';
import type { RootState } from '../store/store';

interface VoterData {
  sdt: string;
  email: string;
  xacMinh: string;
}

interface VoterFormProps {
  onSave: (data: CuTri[]) => void;
  phienBauCuId: number;
}

const VoterForm: React.FC<VoterFormProps> = ({ onSave, phienBauCuId }) => {
  const { id: cuocBauCuId } = useParams<{ id: string }>();
  const [voterList, setVoterList] = useState<CuTri[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAlert, setShowAlert] = useState(false);
  const [selectedVoters, setSelectedVoters] = useState<Set<number>>(new Set());
  const [searchInput, setSearchInput] = useState('');
  const [nextId, setNextId] = useState(0);
  const nguoiDung = useSelector((state: RootState) => state.dangNhapTaiKhoan.taiKhoan);

  const itemsPerPage = 5;

  const handleAddVoter = () => {
    if (voterList.length >= 100) {
      alert('Bạn chỉ có thể thêm tối đa 100 cử tri một lần.');
      return;
    }
    setVoterList([
      ...voterList,
      {
        id: nextId,
        sdt: '',
        email: '',
        xacMinh: false,
        boPhieu: false,
        soLanGuiOTP: 0,
        cuocBauCuId: Number(cuocBauCuId),
        phienBauCuId: phienBauCuId,
        taiKhoanId: nguoiDung?.id ?? 1,
      },
    ]);
    setNextId(nextId + 1);
  };

  const handleChange = (index: number, field: keyof CuTri, value: string | boolean | number) => {
    const newVoterList = [...voterList];
    newVoterList[index] = { ...newVoterList[index], [field]: value };
    setVoterList(newVoterList);
  };

  const handleRemoveVoter = (index: number) => {
    const newVoterList = voterList.filter((_, i) => i !== index);
    setVoterList(newVoterList);
  };

  const handleSelectVoters = (newSelectedVoters: Set<number>) => {
    setSelectedVoters(newSelectedVoters);
  };

  const handleBulkRemoveVoters = () => {
    const newVoterList = voterList.filter((voter) => !selectedVoters.has(voter.id));
    setVoterList(newVoterList);
    setSelectedVoters(new Set());
  };

  const handleSubmit = () => {
    for (const voter of voterList) {
      if (!voter.email) {
        setShowAlert(true);
        return;
      }
    }
    onSave(voterList);
  };

  const generateShareableLink = () => {
    const baseUrl = window.location.origin;
    const sessionId = Math.random().toString(36).substring(7);
    return `${baseUrl}/join-session/${sessionId}`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setCurrentPage(1);
  };

  const handleUploadSuccess = useCallback(
    (uploadedVoters: VoterData[]) => {
      const newVoters = uploadedVoters.map((voter, index) => ({
        id: nextId + index,
        sdt: voter.sdt,
        email: voter.email,
        xacMinh: voter.xacMinh === 'yes',
        boPhieu: false,
        soLanGuiOTP: 0,
        cuocBauCuId: Number(cuocBauCuId),
        phienBauCuId: phienBauCuId,
        taiKhoanId: nguoiDung?.id ?? 1,
      }));
      setVoterList((prevList) => [...prevList, ...newVoters]);
      setNextId(nextId + uploadedVoters.length);
    },
    [nextId, cuocBauCuId, phienBauCuId, nguoiDung?.id],
  );

  const filteredVoters = voterList.filter(
    (voter) =>
      (typeof voter.sdt === 'string' && voter.sdt.includes(searchInput)) ||
      (typeof voter.email === 'string' &&
        voter.email.toLowerCase().includes(searchInput.toLowerCase())),
  );

  const paginatedVoters = filteredVoters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-100 dark:bg-gray-900">
      <Card className="shadow-lg border-blue-200 dark:border-blue-700">
        <CardHeader className="bg-blue-600 text-white dark:bg-blue-800">
          <CardTitle className="text-3xl font-bold text-center">Đăng Ký Cử Tri</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {voterList.length > 0 ? (
            <>
              <VoterList
                voters={paginatedVoters}
                onChange={(index, field, value) =>
                  handleChange((currentPage - 1) * itemsPerPage + index, field, value)
                }
                onRemove={(index) => handleRemoveVoter((currentPage - 1) * itemsPerPage + index)}
                onSelect={handleSelectVoters}
                selectedVoters={selectedVoters}
                onRemoveAll={handleBulkRemoveVoters}
                searchInput={searchInput}
                onSearchChange={handleSearchChange}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
              />
              <PaginationPhu
                currentPage={currentPage}
                totalPages={Math.ceil(filteredVoters.length / itemsPerPage)}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 my-4">
              Chưa có cử tri nào ở đây cả, hãy thêm vào.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between bg-gray-50 dark:bg-gray-800 p-6">
          <Button onClick={handleAddVoter} className="bg-blue-500 hover:bg-blue-600 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm Cử Tri
          </Button>
          <Button onClick={handleSubmit} className="bg-green-500 hover:bg-green-600 text-white">
            <Save className="mr-2 h-4 w-4" />
            Lưu Cử Tri
          </Button>
        </CardFooter>
      </Card>
      <div className="mt-4 flex justify-between">
        <Button
          onClick={() => setShowUploader(!showUploader)}
          className="bg-gray-500 hover:bg-gray-600 text-white"
        >
          Nhập File
        </Button>

        <div className="flex items-center">
          <Input
            readOnly
            value={generateShareableLink()}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="mr-2"
          />
          <Button onClick={() => navigator.clipboard.writeText(generateShareableLink())}>
            <Share2 className="mr-2 h-4 w-4" />
            Sao chép
          </Button>
        </div>
      </div>
      {showUploader && (
        <VoterUploader
          onUploadSuccess={handleUploadSuccess}
          phienBauCuid={phienBauCuId}
          taiKhoanid={nguoiDung?.id ?? 1}
        />
      )}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Thông báo</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng điền đầy đủ thông tin cho tất cả các cử tri.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowAlert(false)}>OK</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default React.memo(VoterForm);
