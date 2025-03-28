import React, { useMemo, useState } from 'react';
import ElectionCard from '../features/CardCuocBauCu';
import { CuocBauCu } from '../store/types';

interface PaginationProps {
  filteredElections: CuocBauCu[];
  itemsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({ filteredElections, itemsPerPage }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = useMemo(
    () => Math.ceil(filteredElections.length / itemsPerPage),
    [filteredElections.length, itemsPerPage],
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedElections = filteredElections.slice(startIndex, startIndex + itemsPerPage);

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

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedElections.map((election) => (
          <ElectionCard key={election.id} election={election} />
        ))}
      </div>
      <div className="flex items-center justify-center mt-4">
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
          className="w-12 text-center border rounded mx-1 text-black"
          min="1"
          max={totalPages}
        />
        <span className="mx-2 text-pink-500">/ {totalPages}</span>
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
  );
};

export default Pagination;
