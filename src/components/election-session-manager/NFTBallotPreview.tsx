import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  ChevronRight,
  Image as ImageIcon,
  RotateCw,
  Ticket,
  Database,
  FileText,
  User,
  Calendar,
  Shield,
  Box,
  ExternalLink,
} from 'lucide-react';
import { Separator } from '../../components/ui/Separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/Tooltip';
import { groupAttributes, shortenAddress } from '../../utils/ballotUtils';
import { ipfsToGatewayUrl, isIpfsUrl } from '../../utils/ipfsUtils';
import IPFSImage from '../../components/bophieu/IPFSImage';
import Model3DViewer from './Model3DView';

interface NFTBallotPreviewProps {
  // Direct props (for use in BallotConfigTab)
  name?: string;
  description?: string;
  imageUrl?: string;
  attributes?: { trait_type: string; value: string }[];
  backgroundColor?: string;
  externalUrl?: string;
  animationUrl?: string;
  is3DModel?: boolean;
  ipfsGateways?: string[];
  currentGatewayIndex?: number;
  onGatewayChange?: () => void;

  // Alternative: Complete metadata object
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
  // Direct props
  name,
  description,
  imageUrl,
  attributes,
  backgroundColor,
  externalUrl,
  animationUrl,
  is3DModel: propIs3DModel,
  ipfsGateways = ['https://ipfs.io/ipfs/'],
  currentGatewayIndex = 0,
  onGatewayChange,

  // Alternative metadata object
  metadata,

  isLoading = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFullAttributes, setShowFullAttributes] = useState(false);

  // Combine props or use metadata object
  const finalMetadata = useMemo(() => {
    if (metadata) return metadata;

    return {
      name: name || 'Phiếu bầu cử',
      description: description,
      image: imageUrl,
      attributes: attributes || [],
      background_color: backgroundColor?.replace('#', ''),
      external_url: externalUrl,
      animation_url: animationUrl,
    };
  }, [
    name,
    description,
    imageUrl,
    attributes,
    backgroundColor,
    externalUrl,
    animationUrl,
    metadata,
  ]);

  // Determine if content is a 3D model
  const is3DModel = useMemo(() => {
    if (propIs3DModel !== undefined) return propIs3DModel;

    const image = finalMetadata.image || '';

    return (
      image.endsWith('.glb') ||
      image.endsWith('.gltf') ||
      image.toLowerCase().includes('.glb') ||
      image.toLowerCase().includes('.gltf')
    );
  }, [propIs3DModel, finalMetadata.image]);

  // Process image URL with IPFS gateway
  const processedImageUrl = useMemo(() => {
    const image = finalMetadata.image;
    if (!image) return null;

    if (isIpfsUrl(image)) {
      // Use current gateway from props or default
      const gateway = ipfsGateways[currentGatewayIndex];
      const ipfsHash = image.replace('ipfs://', '');
      return `${gateway}${ipfsHash}`;
    }

    return image;
  }, [finalMetadata.image, ipfsGateways, currentGatewayIndex]);

  // Group attributes for display
  const groupedAttributes = useMemo(() => {
    return groupAttributes(finalMetadata.attributes || []);
  }, [finalMetadata.attributes]);

  // Reset state when image changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [finalMetadata.image]);

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const handleImageLoaded = () => {
    setImageLoaded(true);
  };

  // Try alternative IPFS gateway if image fails to load
  const handleTryNextGateway = () => {
    if (onGatewayChange) {
      onGatewayChange();
      setImageError(false);
      setImageLoaded(false);
    } else {
      setImageError(false); // Just retry with current gateway
    }
  };

  // Render image or 3D model
  const renderMedia = () => {
    if (isLoading) {
      return (
        <Skeleton className="w-full aspect-square rounded-lg bg-gray-200 dark:bg-gray-800/50" />
      );
    }

    if (!processedImageUrl || imageError) {
      return (
        <div className="w-full aspect-square rounded-lg bg-gray-100 dark:bg-gray-800/50 flex flex-col items-center justify-center p-4">
          {is3DModel ? (
            <Box className="h-8 w-8 md:h-12 md:w-12 text-gray-400 dark:text-gray-600 mb-2" />
          ) : (
            <ImageIcon className="h-8 w-8 md:h-12 md:w-12 text-gray-400 dark:text-gray-600 mb-2" />
          )}
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm text-center">
            {imageError
              ? `Không thể tải ${is3DModel ? 'mô hình 3D' : 'hình ảnh'}`
              : `Chưa có ${is3DModel ? 'mô hình 3D' : 'hình ảnh'}`}
          </p>
          {imageError && (
            <button
              onClick={handleTryNextGateway}
              className="mt-2 flex items-center text-blue-600 dark:text-blue-400 text-xs"
            >
              <RotateCw className="h-3 w-3 mr-1" />
              Thử lại {onGatewayChange ? 'với gateway khác' : ''}
            </button>
          )}
        </div>
      );
    }

    if (is3DModel) {
      return (
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800/50">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="w-full h-full" />
            </div>
          )}

          <Model3DViewer
            modelUrl={processedImageUrl}
            height="100%"
            autoRotate={true}
            onLoad={handleImageLoaded}
            onError={handleImageError}
            className="w-full h-full rounded-lg"
          />

          {/* 3D Model badge */}
          {imageLoaded && !imageError && (
            <div className="absolute bottom-2 right-2 bg-indigo-500/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
              <Box className="h-3 w-3 mr-1" />
              3D Model
            </div>
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

        {isIpfsUrl(finalMetadata.image || '') ? (
          <img
            src={processedImageUrl}
            alt={finalMetadata.name || 'NFT Ballot Preview'}
            onLoad={handleImageLoaded}
            onError={handleImageError}
            className={`w-full h-full object-cover transition-opacity duration-300 rounded-lg ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <img
            src={processedImageUrl}
            alt={finalMetadata.name || 'NFT Ballot Preview'}
            onLoad={handleImageLoaded}
            onError={handleImageError}
            className={`w-full h-full object-cover transition-opacity duration-300 rounded-lg ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Hiển thị badge IPFS nếu là ảnh từ IPFS */}
        {imageLoaded && !imageError && isIpfsUrl(finalMetadata.image || '') && (
          <div className="absolute bottom-2 right-2 bg-blue-500/80 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
            <Database className="h-3 w-3 mr-1" />
            IPFS
          </div>
        )}
      </div>
    );
  };

  // Render attribute group
  const renderAttributeGroup = (title: string, icon: React.ReactNode, attributes: any[]) => {
    if (!attributes || attributes.length === 0) return null;

    const visibleAttributes = showFullAttributes
      ? attributes
      : attributes.slice(0, title === 'Thông tin khác' ? 3 : 4);

    const hasMore = visibleAttributes.length < attributes.length;

    return (
      <div className="space-y-2">
        <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
          {icon}
          <span className="ml-1.5">{title}</span>
          {hasMore && <span className="ml-1 text-xs text-gray-500">({attributes.length})</span>}
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {visibleAttributes.map((attr, index) => (
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

  // Apply background color from metadata if available
  const cardStyle = finalMetadata.background_color
    ? {
        background: `linear-gradient(to bottom right, #${finalMetadata.background_color}10, #${finalMetadata.background_color}20)`,
        borderColor: `#${finalMetadata.background_color}40`,
      }
    : {};

  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-700" style={cardStyle}>
      <CardHeader className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-sm text-gray-800 dark:text-gray-100">
            <Ticket className="h-3.5 w-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
            {isLoading ? (
              <Skeleton className="h-4 w-40 bg-gray-200 dark:bg-gray-700" />
            ) : (
              finalMetadata?.name || 'Phiếu bầu cử'
            )}
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-white/50 dark:bg-gray-800/50 text-xs border-gray-300 dark:border-gray-600 font-normal flex items-center gap-1"
          >
            {is3DModel ? <Box className="h-3 w-3" /> : <Ticket className="h-3 w-3" />}
            {is3DModel ? 'NFT 3D' : 'Phiếu bầu NFT'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-3">
          {/* NFT Image/Model */}
          {renderMedia()}

          {/* Description */}
          {(finalMetadata?.description || isLoading) && (
            <div className="mt-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-3 w-full mb-1 bg-gray-200 dark:bg-gray-800/50" />
                  <Skeleton className="h-3 w-2/3 bg-gray-200 dark:bg-gray-800/50" />
                </>
              ) : (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {finalMetadata.description}
                </p>
              )}
            </div>
          )}

          {/* External URL if available */}
          {finalMetadata.external_url && (
            <div className="mt-1 flex items-center text-xs text-blue-600 dark:text-blue-400">
              <ExternalLink className="h-3 w-3 mr-1" />
              <a
                href={finalMetadata.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline truncate"
              >
                {finalMetadata.external_url}
              </a>
            </div>
          )}

          {/* Attributes */}
          {isLoading ? (
            <div className="mt-2 space-y-2">
              <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-800/50" />
              <div className="grid grid-cols-1 gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 rounded-md bg-gray-200 dark:bg-gray-800/50" />
                ))}
              </div>
            </div>
          ) : finalMetadata?.attributes && finalMetadata.attributes.length > 0 ? (
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
              {finalMetadata.attributes.length > 6 && !showFullAttributes && (
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
        </div>
      </CardContent>
    </Card>
  );
};

export default NFTBallotPreview;
