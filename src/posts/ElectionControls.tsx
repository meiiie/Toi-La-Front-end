import React, { useState } from 'react';
import { Election } from './types';
import { ElectionsList } from './ElectionsList';
import logo from '../logo.svg'; // Đường dẫn đến icon SVG

type Props = {
  elections: Election[];
};

const ElectionControls: React.FC<Props> = ({ elections }) => {
  const [showElections, setShowElections] = useState<boolean>(true);
  const [hover, setHover] = useState<boolean>(false); // Trạng thái hover cho nút
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(elections.length / itemsPerPage);

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    } else {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      setCurrentPage(value);
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(value) && value >= 1 && value <= totalPages) {
        setCurrentPage(value);
      }
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedElections = elections.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="relative">
      {/* Nút Hiện/Ẩn Cuộc Bầu Cử */}
      <div className="fixed top-0 right-4 mt-10 flex items-center z-50">
        <button
          onClick={() => setShowElections(!showElections)}
          onMouseEnter={() => setHover(true)} // Bật trạng thái hover
          onMouseLeave={() => setHover(false)} // Tắt trạng thái hover
          className={`transition-all duration-300 ease-in-out ${
            hover ? 'w-40 h-12 px-4' : 'w-12 h-12'
          } flex items-center justify-center bg-blue-600 text-white rounded-full overflow-hidden`}
          style={{
            borderRadius: hover ? '9999px' : '50%',
          }}
        >
          {hover ? (
            <span className="font-semibold">
              {' '}
              {showElections ? 'Ẩn Cuộc Bầu Cử' : 'Hiện Cuộc Bầu Cử'}{' '}
            </span>
          ) : (
            <img src={logo} alt="Icon" className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Danh sách và điều khiển trang */}
      {showElections && (
        <div className="flex-grow mt-16">
          <ElectionsList elections={paginatedElections} />
          <div className="flex items-center justify-center mt-4">
            {/* Nút phân trang */}
            <button
              onClick={() => handlePageChange('prev')}
              disabled={currentPage === 1}
              className={`h-8 w-8 flex items-center justify-center rounded-full mr-2 ${
                currentPage === 1 ? 'bg-gray-300 text-black' : 'bg-blue-600 text-white'
              }`}
            >
              &lt;
            </button>
            <input
              type="number"
              value={currentPage}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputKeyDown}
              className="w-12 text-center border rounded mx-1"
              min="1"
              max={totalPages}
            />
            <span className="mx-2">/ {totalPages}</span>
            <button
              onClick={() => handlePageChange('next')}
              disabled={currentPage === totalPages}
              className={`h-8 w-8 flex items-center justify-center rounded-full ml-2 ${
                currentPage === totalPages ? 'bg-gray-300 text-black' : 'bg-blue-600 text-white'
              }`}
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectionControls;
