import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  ChevronRight,
  Image as ImageIcon,
  RotateCw,
  Ticket,
  Check,
  Database,
  FileText,
  User,
  Calendar,
  Shield,
} from 'lucide-react';
import { Separator } from '../../components/ui/Separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/Tooltip';
import { groupAttributes, processIpfsImageUrl, shortenAddress } from '../../utils/ballotUtils';
import IPFSImage from '../../components/bophieu/IPFSImage';

interface NFTBallotPreviewProps {
  ballot?: any; // Thay đổi từ metadata sang ballot
  metadata?: {
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

/**
 * NFTBallotPreview - Hiển thị xem trước phiếu bầu dạng NFT
 */
const NFTBallotPreview: React.FC<NFTBallotPreviewProps> = ({
  ballot,
  metadata: propMetadata,
  isLoading = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullAttributes, setShowFullAttributes] = useState(false);
  const [metadata, setMetadata] = useState<any>(propMetadata || null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(isLoading);

  // Parse metadata từ ballot giống như trong BallotDisplay
  useEffect(() => {
    if (propMetadata) {
      // Nếu đã có metadata được truyền vào qua props, dùng luôn
      setMetadata(propMetadata);
      setLoading(false);
      return;
    }

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
  }, [ballot, propMetadata]);

  // Xử lý URL hình ảnh IPFS
  const imageUrl = useMemo(() => {
    if (!metadata?.image) return null;
    if (metadata.image.startsWith('ipfs://')) {
      return processIpfsImageUrl(metadata.image);
    }
    return metadata.image;
  }, [metadata?.image]);

  // Nhóm thuộc tính để hiển thị theo danh mục
  const groupedAttributes = useMemo(() => {
    return groupAttributes(metadata?.attributes || []);
  }, [metadata?.attributes]);

  // Reset trạng thái khi metadata thay đổi
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

  // Hiển thị hình ảnh phiếu bầu
  const renderImage = () => {
    if (loading) {
      return (
        <Skeleton className="w-full aspect-square rounded-lg bg-gray-200 dark:bg-gray-800/50" />
      );
    }

    if (error) {
      return (
        <div className="w-full aspect-square rounded-lg bg-red-50 dark:bg-red-900/20 flex flex-col items-center justify-center p-4">
          <p className="text-red-600 dark:text-red-400 text-xs md:text-sm text-center">{error}</p>
        </div>
      );
    }

    if (!imageUrl || imageError) {
      return (
        <div className="w-full aspect-square rounded-lg bg-gray-100 dark:bg-gray-800/50 flex flex-col items-center justify-center p-4">
          <ImageIcon className="h-8 w-8 md:h-12 md:w-12 text-gray-400 dark:text-gray-600 mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm text-center">
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

        {imageUrl.startsWith('ipfs://') ? (
          <IPFSImage
            src={imageUrl}
            alt={metadata.name || 'NFT Ballot Preview'}
            onLoad={handleImageLoaded}
            onError={handleImageError}
            className={`w-full h-full object-cover transition-opacity duration-300 rounded-lg ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <img
            src={imageUrl}
            alt={metadata.name || 'NFT Ballot Preview'}
            onLoad={handleImageLoaded}
            onError={handleImageError}
            className={`w-full h-full object-cover transition-opacity duration-300 rounded-lg ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}

        {/* Hiển thị badge IPFS nếu là ảnh từ IPFS */}
        {imageLoaded && !imageError && imageUrl.includes('ipfs') && (
          <div className="absolute bottom-2 right-2 bg-blue-500/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
            <Database className="h-3 w-3 mr-1" />
            IPFS
          </div>
        )}
      </div>
    );
  };

  // Hiển thị thuộc tính theo nhóm
  const renderAttributeGroup = (title: string, icon: React.ReactNode, attributes: any[]) => {
    if (!attributes || attributes.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          {icon}
          <span className="ml-1.5">{title}</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {attributes.map((attr, index) => (
            <div
              key={index}
              className="flex justify-between py-1 px-2 bg-gray-50 dark:bg-gray-800/30 rounded-md text-xs"
            >
              <span className="text-gray-500 dark:text-gray-400 truncate mr-2">
                {attr.trait_type}:
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[150px]">
                      {attr.trait_type.includes('địa chỉ') || attr.trait_type.includes('hash')
                        ? shortenAddress(attr.value)
                        : attr.value}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{attr.value}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
      <CardHeader className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-sm text-gray-800 dark:text-gray-100">
            <Ticket className="h-3.5 w-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
            {loading ? (
              <Skeleton className="h-4 w-40 bg-gray-200 dark:bg-gray-700" />
            ) : (
              metadata?.name || (ballot ? `Phiếu bầu cử #${ballot.tokenId}` : 'Phiếu bầu cử')
            )}
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-white/50 dark:bg-gray-800/50 text-xs border-gray-300 dark:border-gray-600 font-normal"
          >
            Phiếu bầu NFT
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* NFT Image */}
          {renderImage()}

          {/* Description */}
          {(metadata?.description || loading) && (
            <div className="mt-2">
              {loading ? (
                <>
                  <Skeleton className="h-3 w-full mb-1 bg-gray-200 dark:bg-gray-800/50" />
                  <Skeleton className="h-3 w-2/3 bg-gray-200 dark:bg-gray-800/50" />
                </>
              ) : (
                <p className="text-xs text-gray-600 dark:text-gray-400">{metadata.description}</p>
              )}
            </div>
          )}

          {/* Attributes */}
          {loading ? (
            <div className="mt-2 space-y-2">
              <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-800/50" />
              <div className="grid grid-cols-1 gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 rounded-md bg-gray-200 dark:bg-gray-800/50" />
                ))}
              </div>
            </div>
          ) : metadata?.attributes && metadata.attributes.length > 0 ? (
            <div className="mt-3 space-y-4 bg-gray-50/70 dark:bg-gray-800/30 p-2 rounded-lg">
              {/* Thông tin cuộc bầu cử */}
              {renderAttributeGroup(
                'Thông tin bầu cử',
                <FileText className="h-3.5 w-3.5 text-blue-500" />,
                groupedAttributes.election,
              )}

              {/* Thông tin cử tri */}
              {renderAttributeGroup(
                'Thông tin cử tri',
                <User className="h-3.5 w-3.5 text-green-500" />,
                groupedAttributes.identity,
              )}

              {/* Thông tin xác thực */}
              {renderAttributeGroup(
                'Xác thực',
                <Shield className="h-3.5 w-3.5 text-purple-500" />,
                groupedAttributes.verification,
              )}

              {/* Thông tin khác */}
              {groupedAttributes.other.length > 0 && (
                <>
                  <Separator className="my-2" />
                  {renderAttributeGroup(
                    'Thông tin khác',
                    <Calendar className="h-3.5 w-3.5 text-gray-500" />,
                    groupedAttributes.other,
                  )}
                </>
              )}

              {/* Nút hiển thị đầy đủ thuộc tính */}
              {metadata.attributes.length > 6 && !showFullAttributes && (
                <button
                  onClick={() => setShowFullAttributes(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center mx-auto mt-1"
                >
                  Xem tất cả thuộc tính
                  <ChevronRight className="h-3 w-3 ml-1" />
                </button>
              )}
            </div>
          ) : null}

          {/* Hiển thị trạng thái phiếu bầu */}
          {ballot && ballot.isUsed !== undefined && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">ID Phiếu:</span>
                <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  #{ballot.tokenId}
                </span>
              </div>

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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NFTBallotPreview;
