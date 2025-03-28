'use client';

import type React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  theme?: 'light' | 'dark';
}

const PaginationPhu: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  theme = 'dark',
}) => {
  // Không hiển thị phân trang nếu chỉ có 1 trang
  if (totalPages <= 1) return null;

  // Tạo mảng các trang để hiển thị
  const getPageNumbers = () => {
    const pageNumbers = [];

    // Luôn hiển thị trang đầu tiên
    pageNumbers.push(1);

    // Thêm "..." nếu trang hiện tại > 3
    if (currentPage > 3) {
      pageNumbers.push('ellipsis1');
    }

    // Thêm trang trước trang hiện tại nếu > 1
    if (currentPage > 2) {
      pageNumbers.push(currentPage - 1);
    }

    // Thêm trang hiện tại nếu không phải trang đầu hoặc cuối
    if (currentPage !== 1 && currentPage !== totalPages) {
      pageNumbers.push(currentPage);
    }

    // Thêm trang sau trang hiện tại nếu < totalPages
    if (currentPage < totalPages - 1) {
      pageNumbers.push(currentPage + 1);
    }

    // Thêm "..." nếu trang hiện tại < totalPages - 2
    if (currentPage < totalPages - 2) {
      pageNumbers.push('ellipsis2');
    }

    // Luôn hiển thị trang cuối cùng nếu > 1
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex justify-center items-center space-x-2" aria-label="Phân trang">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${theme === 'dark' ? 'bg-[#1A2942] border-[#2A3A5A] text-white hover:bg-[#243656]' : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'} rounded-xl`}
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis1' || page === 'ellipsis2') {
          return (
            <span
              key={`ellipsis-${index}`}
              className={`w-9 h-9 flex items-center justify-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          );
        }

        return (
          <Button
            key={index}
            variant={currentPage === page ? 'default' : 'outline'}
            onClick={() => onPageChange(page as number)}
            className={`
              w-9 h-9 p-0 rounded-xl
              ${
                currentPage === page
                  ? theme === 'dark'
                    ? 'bg-[#0288D1] hover:bg-[#0277BD] text-white'
                    : 'bg-[#0288D1] hover:bg-[#0277BD] text-white'
                  : theme === 'dark'
                    ? 'bg-[#1A2942] border-[#2A3A5A] text-white hover:bg-[#243656]'
                    : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
              }
            `}
            aria-label={`Trang ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${theme === 'dark' ? 'bg-[#1A2942] border-[#2A3A5A] text-white hover:bg-[#243656]' : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'} rounded-xl`}
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
};

export default PaginationPhu;
