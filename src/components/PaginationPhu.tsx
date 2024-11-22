// src/components/PaginationPhu.tsx
import React, { useState } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationPhu: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const [inputPage, setInputPage] = useState<number>(currentPage);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      setInputPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      setInputPage(currentPage + 1);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      setInputPage(value);
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(value) && value >= 1 && value <= totalPages) {
        onPageChange(value);
      }
    }
  };

  return (
    <div className="flex items-center justify-center mt-4">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300`}
      >
        &lt;
      </button>
      <input
        type="number"
        value={inputPage}
        onChange={handlePageInputChange}
        onKeyDown={handlePageInputKeyDown}
        className="w-12 text-center border rounded mx-2"
        min="1"
        max={totalPages}
      />
      <span className="mx-2">/ {totalPages}</span>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300`}
      >
        &gt;
      </button>
    </div>
  );
};

export default PaginationPhu;
