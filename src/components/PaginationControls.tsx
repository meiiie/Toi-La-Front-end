import React, { useMemo, useState } from 'react';

interface PaginationControlsProps {
  items: string[];
  itemsPerPage: number;
  renderItem: (item: string, index: number) => React.ReactNode;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  items,
  itemsPerPage,
  renderItem,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = useMemo(
    () => Math.ceil(items.length / itemsPerPage),
    [items.length, itemsPerPage],
  );

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, items, itemsPerPage]);

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (direction === 'next') {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    } else if (direction === 'prev' && currentPage !== 0) {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    }
  };

  return (
    <div>
      <ul className="list-disc list-inside">{paginatedItems.map(renderItem)}</ul>
      <div className="flex items-center justify-center mt-4">
        <button
          onClick={() => handlePageChange('prev')}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          &lt;
        </button>
        <span className="mx-2">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => handlePageChange('next')}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
