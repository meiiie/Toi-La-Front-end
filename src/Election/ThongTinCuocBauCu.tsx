import React from 'react';
import { CuocBauCu } from '../store/types';

interface ElectionInfoProps {
  cuocBauCu: CuocBauCu;
  formattedNgayBatDau: string;
  formattedNgayKetThuc: string;
  getStatusBadge: (status: string) => JSX.Element;
}

const ThongTinCuocBauCu: React.FC<ElectionInfoProps> = ({
  cuocBauCu,
  formattedNgayBatDau,
  formattedNgayKetThuc,
  getStatusBadge,
}) => {
  return (
    <div className="card mb-4">
      <h3 className="text-xl font-bold text-blue-700 mb-2">Thông tin chung</h3>
      {cuocBauCu.anh && (
        <div className="w-full h-61 mb-4 relative overflow-hidden rounded-lg">
          <div className="w-full h-full rounded-lg overflow-hidden shadow-md transition-transform duration-300 ease-in-out transform hover:scale-105">
            <img
              src={cuocBauCu.anh}
              alt={`Ảnh của ${cuocBauCu.tenCuocBauCu}`}
              className="w-full h-full object-cover rounded-lg border-4 border-gradient-to-r from-[#F88195] to-[#C06C84]"
            />
            <div className="absolute inset-0 rounded-lg border-4 border-transparent bg-gradient-to-r from-[#F88195] to-[#C06C84] opacity-15"></div>
          </div>
        </div>
      )}
      <p className="text-base text-slate-900 mb-2">{cuocBauCu.moTa}</p>
      <p className="text-base text-slate-800 mb-2">Ngày tổ chức: {formattedNgayBatDau}</p>
      <p className="text-base text-slate-800 mb-2">Ngày kết thúc: {formattedNgayKetThuc}</p>
      <p className="text-base text-slate-800 mb-2">
        Trạng thái: {getStatusBadge(cuocBauCu.trangThai)}
      </p>
    </div>
  );
};

export default ThongTinCuocBauCu;
