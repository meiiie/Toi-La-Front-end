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
  CheckCircle,
  Sparkles,
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
 * NFTBallotPreview - Hiển thị xem trước phiếu bầu dạng NFT với thiết kế nghệ thuật
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
  const [isHovered, setIsHovered] = useState(false);

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

  // Generate a unique decorative pattern based on name or metadata
  const generatePatternId = () => {
    const str = finalMetadata.name || 'ballot';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 10) + 1; // Return a number between 1-10
  };

  const patternId = useMemo(() => generatePatternId(), [finalMetadata.name]);

  // Render image or 3D model with artistic framing
  const renderMedia = () => {
    if (isLoading) {
      return (
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg opacity-75 blur-sm"></div>
          <Skeleton className="relative w-full aspect-[4/3] rounded-lg bg-gray-200 dark:bg-gray-800/50" />
        </div>
      );
    }

    if (!processedImageUrl || imageError) {
      return (
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg opacity-50 blur-sm group-hover:opacity-75 transition-opacity duration-300"></div>
          <div className="relative w-full aspect-[4/3] rounded-lg bg-gray-100 dark:bg-gray-800/50 flex flex-col items-center justify-center p-4 overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-pattern-${patternId}"></div>
            {is3DModel ? (
              <Box className="h-8 w-8 md:h-10 md:w-10 text-gray-400 dark:text-gray-600 mb-2" />
            ) : (
              <ImageIcon className="h-8 w-8 md:h-10 md:w-10 text-gray-400 dark:text-gray-600 mb-2" />
            )}
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm text-center">
              {imageError
                ? `Không thể tải ${is3DModel ? 'mô hình 3D' : 'hình ảnh'}`
                : `Chưa có ${is3DModel ? 'mô hình 3D' : 'hình ảnh'}`}
            </p>
            {imageError && (
              <button
                onClick={handleTryNextGateway}
                className="mt-2 flex items-center text-blue-600 dark:text-blue-400 text-xs group-hover:scale-105 transition-transform"
              >
                <RotateCw className="h-3 w-3 mr-1" />
                Thử lại {onGatewayChange ? 'với gateway khác' : ''}
              </button>
            )}
          </div>
        </div>
      );
    }

    if (is3DModel) {
      return (
        <div
          className="relative group cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 rounded-lg opacity-50 blur-sm transition-all duration-300 ${isHovered ? 'opacity-75' : 'opacity-50'}`}
          ></div>
          <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
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

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 h-12 w-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-bl-lg"></div>
            <div className="absolute bottom-0 left-0 h-12 w-12 bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 rounded-tr-lg"></div>

            {/* 3D Model badge */}
            {imageLoaded && !imageError && (
              <div className="absolute bottom-2 right-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center backdrop-blur-sm">
                <Box className="h-3 w-3 mr-1" />
                3D Model
              </div>
            )}

            {/* Artistic overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            ></div>
          </div>
        </div>
      );
    }

    return (
      <div
        className="relative group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Decorative frame with gradient */}
        <div
          className={`absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-lg opacity-50 blur-sm transition-all duration-300 ${isHovered ? 'opacity-75' : 'opacity-50'}`}
        ></div>

        {/* Image container */}
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Skeleton className="w-full h-full" />
            </div>
          )}

          {/* Actual image */}
          <img
            src={processedImageUrl}
            alt={finalMetadata.name || 'NFT Ballot Preview'}
            onLoad={handleImageLoaded}
            onError={handleImageError}
            className={`w-full h-full object-cover transition-all duration-500 rounded-lg ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${isHovered ? 'scale-[1.03]' : 'scale-100'}`}
          />

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 h-10 w-10 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-bl-lg"></div>
          <div className="absolute bottom-0 left-0 h-10 w-10 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 rounded-tr-lg"></div>

          {/* IPFS badge */}
          {imageLoaded && !imageError && isIpfsUrl(finalMetadata.image || '') && (
            <div className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center backdrop-blur-sm shadow-md">
              <Database className="h-3 w-3 mr-1" />
              IPFS
            </div>
          )}

          {/* Artistic overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
          ></div>
        </div>
      </div>
    );
  };

  // Render attribute group with artistic styling
  const renderAttributeGroup = (title: string, icon: React.ReactNode, attributes: any[]) => {
    if (!attributes || attributes.length === 0) return null;

    const visibleAttributes = showFullAttributes
      ? attributes
      : attributes.slice(0, title === 'Thông tin khác' ? 2 : 3);

    const hasMore = visibleAttributes.length < attributes.length;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
            {icon}
            <span className="ml-1.5">{title}</span>
          </div>
          {hasMore && (
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">
              {attributes.length}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {visibleAttributes.map((attr, index) => (
            <div
              key={index}
              className="flex justify-between py-1.5 px-2.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-800/50 rounded-md text-xs hover:shadow-sm transition-shadow duration-200"
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

  // Apply background color from metadata if available with artistic enhancement
  const bgColor = finalMetadata.background_color || '6366f1';
  const textColor = isLoading ? 'text-gray-700 dark:text-gray-300' : getContrastColor(bgColor);

  // Generate style for card based on background color
  const cardStyle = finalMetadata.background_color
    ? {
        background: `linear-gradient(135deg, #${bgColor}05, #${bgColor}15, #${bgColor}05)`,
        borderColor: `#${bgColor}30`,
      }
    : {};

  return (
    <Card
      className={`overflow-hidden border-gray-200 dark:border-gray-700 relative backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${
        isHovered ? 'shadow-md shadow-indigo-500/10' : ''
      }`}
      style={cardStyle}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-blue-500/30 dark:border-indigo-500/30 rounded-tl-md"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-blue-500/30 dark:border-indigo-500/30 rounded-tr-md"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-blue-500/30 dark:border-indigo-500/30 rounded-bl-md"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-blue-500/30 dark:border-indigo-500/30 rounded-br-md"></div>

      {/* Header section with elegant gradient */}
      <CardHeader className="bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-indigo-50/90 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700 p-3 relative overflow-hidden">
        {/* Optional subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5 bg-[url('/patterns/topography.svg')]"></div>

        <div className="flex items-center justify-between relative z-10">
          <CardTitle className="flex items-center text-sm text-gray-800 dark:text-gray-100">
            <div className="mr-2 p-1 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
              <Ticket className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            {isLoading ? (
              <Skeleton className="h-4 w-40 bg-gray-200 dark:bg-gray-700" />
            ) : (
              <span className="font-medium">{finalMetadata?.name || 'Phiếu bầu cử'}</span>
            )}
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-white/70 dark:bg-gray-800/70 text-xs border-gray-300 dark:border-gray-600 font-normal flex items-center gap-1 backdrop-blur-sm"
          >
            {is3DModel ? (
              <>
                <Box className="h-3 w-3 text-indigo-500" />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-semibold">
                  NFT 3D
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 text-indigo-500" />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-semibold">
                  Phiếu NFT
                </span>
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      {/* Content section with refined layout */}
      <CardContent className="p-3 space-y-4">
        {/* NFT Image/Model section */}
        <div className="mb-4">{renderMedia()}</div>

        {/* Description section with artistic separator */}
        {(finalMetadata?.description || isLoading) && (
          <div className="relative">
            <div className="absolute left-0 top-0 w-10 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            {isLoading ? (
              <>
                <Skeleton className="h-3 w-full mb-1 mt-2 bg-gray-200 dark:bg-gray-800/50" />
                <Skeleton className="h-3 w-2/3 bg-gray-200 dark:bg-gray-800/50" />
              </>
            ) : (
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 mt-2 italic">
                {finalMetadata.description}
              </p>
            )}
          </div>
        )}

        {/* External URL if available */}
        {finalMetadata.external_url && (
          <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
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

        {/* Attributes section with artistic grouping */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-800/50" />
            <div className="grid grid-cols-1 gap-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-8 rounded-md bg-gray-200 dark:bg-gray-800/50" />
              ))}
            </div>
          </div>
        ) : finalMetadata?.attributes && finalMetadata.attributes.length > 0 ? (
          <div className="relative">
            {/* Artistic attribute container with subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-indigo-50/30 dark:from-gray-900/30 dark:to-indigo-900/10 rounded-lg -z-10"></div>

            <div className="space-y-3 p-3 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
              {/* Attribute groups */}
              <div className="space-y-4">
                {/* Primary attributes */}
                {renderAttributeGroup(
                  'Thông tin bầu cử',
                  <FileText className="h-3.5 w-3.5 text-blue-500" />,
                  groupedAttributes.election,
                )}

                {/* Identity section */}
                {renderAttributeGroup(
                  'Thông tin cử tri',
                  <User className="h-3.5 w-3.5 text-green-500" />,
                  groupedAttributes.identity,
                )}

                {/* Verification section */}
                {renderAttributeGroup(
                  'Xác thực',
                  <Shield className="h-3.5 w-3.5 text-purple-500" />,
                  groupedAttributes.verification,
                )}

                {/* Other attributes with artistic separator */}
                {groupedAttributes.other.length > 0 && (
                  <>
                    <div className="relative py-1">
                      <Separator className="my-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-white dark:bg-gray-900 px-2 text-xs text-gray-400">
                          chi tiết
                        </span>
                      </div>
                    </div>
                    {renderAttributeGroup(
                      'Thông tin khác',
                      <Calendar className="h-3.5 w-3.5 text-gray-500" />,
                      groupedAttributes.other,
                    )}
                  </>
                )}
              </div>

              {/* Show more button with hover effect */}
              {finalMetadata.attributes.length > 5 && !showFullAttributes && (
                <button
                  onClick={() => setShowFullAttributes(true)}
                  className="text-xs flex items-center justify-center w-full mt-2 py-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md"
                >
                  Xem tất cả thuộc tính
                  <ChevronRight className="h-3 w-3 ml-1" />
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* Verification seal for extra professional touch */}
        <div className="flex justify-end">
          <div className="flex items-center text-xs text-indigo-600 dark:text-indigo-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            <span>Đã xác thực</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to determine contrasting text color based on background
function getContrastColor(hexcolor: string): string {
  // Remove # if present
  hexcolor = hexcolor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);

  // Calculate brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Return black or white based on brightness
  return brightness > 128 ? 'text-gray-900' : 'text-gray-50';
}

export default NFTBallotPreview;
