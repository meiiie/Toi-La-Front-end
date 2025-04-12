'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ChevronRight, Image as ImageIcon, RotateCw, Ticket } from 'lucide-react';
import Image from 'next/image';

interface NFTBallotPreviewProps {
  metadata: {
    name: string;
    description?: string;
    image?: string;
    attributes?: { trait_type: string; value: string }[];
    background_color?: string;
    external_url?: string;
    animation_url?: string;
  };
  isLoading?: boolean;
}

const NFTBallotPreview: React.FC<NFTBallotPreviewProps> = ({ metadata, isLoading = false }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset image error state when metadata changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [metadata?.image]);

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const handleImageLoaded = () => {
    setImageLoaded(true);
  };

  const renderImage = () => {
    if (isLoading) {
      return (
        <Skeleton className="w-full aspect-square rounded-lg bg-gray-200 dark:bg-gray-800/50" />
      );
    }

    if (!metadata?.image || imageError) {
      return (
        <div className="w-full aspect-square rounded-lg bg-gray-100 dark:bg-gray-800/50 flex flex-col items-center justify-center">
          <ImageIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {imageError ? 'Không thể tải hình ảnh' : 'Chưa có hình ảnh'}
          </p>
          {imageError && (
            <button
              onClick={() => setImageError(false)}
              className="mt-2 flex items-center text-blue-600 dark:text-blue-400 text-xs"
            >
              <RotateCw className="h-3 w-3 mr-1" />
              Thử lại
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800/50">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        )}
        <Image
          src={metadata.image}
          alt={metadata.name || 'NFT Ballot Preview'}
          onLoad={handleImageLoaded}
          onError={handleImageError}
          layout="fill"
          objectFit="cover"
          className={`transition-opacity duration-300 rounded-lg ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
    );
  };

  const renderAttributes = () => {
    if (!metadata?.attributes || metadata.attributes.length === 0) {
      return null;
    }

    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thuộc tính</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
    );
  };

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
      <CardHeader className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base text-gray-800 dark:text-gray-100">
            <Ticket className="h-4 w-4 mr-2 text-indigo-600 dark:text-indigo-400" />
            Xem Trước Phiếu Bầu
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-white/50 dark:bg-gray-800/50 text-xs border-gray-300 dark:border-gray-600 font-normal"
          >
            NFT Preview
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="w-full max-w-sm mx-auto">
          {/* NFT Image */}
          {renderImage()}

          {/* NFT Details */}
          <div className="mt-4 space-y-3">
            <div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Tên phiếu bầu
              </h3>
              {isLoading ? (
                <Skeleton className="h-6 w-3/4 mt-1 bg-gray-200 dark:bg-gray-800/50" />
              ) : (
                <p className="text-base font-medium text-gray-900 dark:text-gray-100 break-words">
                  {metadata?.name || 'Chưa cấu hình tên phiếu'}
                </p>
              )}
            </div>

            {(metadata?.description || isLoading) && (
              <div>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">Mô tả</h3>
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-full mt-1 bg-gray-200 dark:bg-gray-800/50" />
                    <Skeleton className="h-4 w-2/3 mt-1 bg-gray-200 dark:bg-gray-800/50" />
                  </>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                    {metadata.description}
                  </p>
                )}
              </div>
            )}

            {/* Attributes */}
            {isLoading ? (
              <div className="mt-4">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Thuộc tính
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 rounded-md bg-gray-200 dark:bg-gray-800/50" />
                  ))}
                </div>
              </div>
            ) : (
              renderAttributes()
            )}

            {metadata?.external_url && (
              <div className="pt-2">
                <a
                  href={metadata.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  Xem chi tiết
                  <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NFTBallotPreview;
