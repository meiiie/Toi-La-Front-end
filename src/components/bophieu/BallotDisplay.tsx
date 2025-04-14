import React, { useState, useEffect } from 'react';
import IPFSImage from './IPFSImage'; // Component hiển thị ảnh từ IPFS

const BallotDisplay = ({ ballot }) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const parseMetadata = () => {
      if (!ballot) {
        setError('Không có dữ liệu phiếu bầu');
        setLoading(false);
        return;
      }

      try {
        // Nếu là chỉ có processedURI đã được xử lý
        if (
          ballot.processedURI &&
          ballot.processedURI.startsWith('data:application/json;base64,')
        ) {
          const base64Content = ballot.processedURI.split(',')[1];
          const jsonString = atob(base64Content);
          const parsedMetadata = JSON.parse(jsonString);
          setMetadata(parsedMetadata);
          setLoading(false);
        }
        // Nếu đã có metadata được parse sẵn
        else if (ballot.metadata) {
          setMetadata(ballot.metadata);
          setLoading(false);
        }
        // Nếu chỉ có tokenURI (holihu format)
        else if (
          ballot.tokenURI &&
          ballot.tokenURI.startsWith('https://holihu-metadata.com/data:')
        ) {
          const dataUri = ballot.tokenURI.substring('https://holihu-metadata.com/'.length);
          const base64Content = dataUri.split(',')[1];
          const jsonString = atob(base64Content);
          const parsedMetadata = JSON.parse(jsonString);
          setMetadata(parsedMetadata);
          setLoading(false);
        }
        // Nếu là IPFS URI
        else if (ballot.tokenURI && ballot.tokenURI.startsWith('ipfs://')) {
          setMetadata({
            name: `Phiếu bầu cử #${ballot.tokenId}`,
            description: 'Phiếu bầu cử HoLiHu',
            image: ballot.tokenURI,
          });
          setLoading(false);
        } else {
          setError('Không thể đọc dữ liệu từ phiếu bầu');
          setLoading(false);
        }
      } catch (err) {
        console.error('Lỗi khi parse metadata:', err);
        setError(`Lỗi khi phân tích dữ liệu: ${err.message}`);
        setLoading(false);
      }
    };

    parseMetadata();
  }, [ballot]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
        <p>{error}</p>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <p>Không có dữ liệu phiếu bầu</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            />
          </svg>
          {metadata.name || `Phiếu bầu cử #${ballot.tokenId}`}
        </h3>
      </div>

      <div className="p-4">
        <div className="mb-4 aspect-square w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
          {metadata.image ? (
            metadata.image.startsWith('ipfs://') ? (
              <IPFSImage
                src={metadata.image}
                alt={metadata.name || 'Hình ảnh phiếu bầu'}
                className="w-full h-full object-contain"
                showStatus={true}
              />
            ) : (
              <img
                src={metadata.image}
                alt={metadata.name || 'Hình ảnh phiếu bầu'}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/400x400/e2e8f0/667085?text=Phiếu+Bầu+Cử';
                }}
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-gray-400 dark:text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {metadata.description && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mô tả</h4>
            <p className="text-gray-700 dark:text-gray-300">{metadata.description}</p>
          </div>
        )}

        {metadata.attributes && metadata.attributes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Thuộc tính
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {metadata.attributes.map((attr, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-800/30 rounded-md p-2 border border-gray-200 dark:border-gray-700/50"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{attr.trait_type}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {attr.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">ID Phiếu:</span>
            <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              #{ballot.tokenId}
            </span>
          </div>

          {ballot.isUsed !== undefined && (
            <div>
              {ballot.isUsed ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  Đã sử dụng
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Chưa sử dụng
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BallotDisplay;
