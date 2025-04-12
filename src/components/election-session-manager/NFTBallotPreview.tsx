'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert, AlertDescription } from '../../components/ui/Alter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import {
  AlertTriangle,
  FileImage,
  RefreshCw,
  Code,
  Globe,
  User,
  Calendar,
  Database,
  Box,
  ExternalLink,
  Info,
  ChevronsRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  QrCode,
  Copy,
  Lock,
  Award,
  ChevronsLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import Model3DViewer from './Model3DView';

interface NFTBallotPreviewProps {
  name: string;
  description: string;
  imageUrl: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
  backgroundColor?: string;
  externalUrl?: string;
  ipfsGateways?: string[];
  currentGatewayIndex?: number;
  onGatewayChange?: () => void;
  is3DModel?: boolean;
}

const NFTBallotPreview: React.FC<NFTBallotPreviewProps> = ({
  name,
  description,
  imageUrl,
  attributes,
  backgroundColor = '#f8f9fa',
  externalUrl,
  ipfsGateways = ['https://ipfs.io/ipfs/'],
  currentGatewayIndex = 0,
  onGatewayChange,
  is3DModel = false,
}) => {
  const [activeTab, setActiveTab] = useState<string>('visual');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [displayImageUrl, setDisplayImageUrl] = useState<string>('');
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const [isImageError, setIsImageError] = useState<boolean>(false);
  const [showCopied, setShowCopied] = useState<boolean>(false);

  // Làm sạch và chuẩn hóa tên và mô tả
  const cleanName = useMemo(() => cleanupVietnameseText(name), [name]);
  const cleanDescription = useMemo(() => cleanupVietnameseText(description), [description]);

  // Làm sạch các thuộc tính
  const cleanAttributes = useMemo(() => cleanupNFTAttributes(attributes), [attributes]);

  // Hàm để khắc phục một số vấn đề mã hóa tiếng Việt phổ biến
  function cleanupVietnameseText(text: string): string {
    if (typeof text !== 'string') return String(text);

    // Một số mẫu thay thế phổ biến cho tiếng Việt bị mã hóa sai
    const replacements: Record<string, string> = {
      'Loáº¡i phiáº¿u': 'Loại phiếu',
      'Phiáº¿u báº§u cá»­ chÃ­nh thá»©c': 'Phiếu bầu cử chính thức',
      'ÄÆ¡n vá» tá» chá»©c': 'Đơn vị tổ chức',
      'Khu vá»±c báº§u cá»­': 'Khu vực bầu cử',
      'NgÃ y': 'Ngày',
      'NgÃ y cáº¥p': 'Ngày cấp',
      'Hash kiá»m chá»©ng': 'Hash kiểm chứng',
      'ID phiÃªn báº§u cá»­': 'ID phiên bầu cử',
      'TÃªn phiÃªn báº§u cá»­': 'Tên phiên bầu cử',
      'Email cá»­ tri': 'Email cử tri',
      'Äá»a chá» cá»­ tri': 'Địa chỉ cử tri',
      'PhiÃªn báº§u cá»­': 'Phiên bầu cử',
      'KhÃ´ng hiá»u': 'Không hiểu',
    };

    // Thực hiện thay thế
    let result = text;
    for (const [encoded, decoded] of Object.entries(replacements)) {
      // Thay thế toàn cục với biểu thức chính quy
      result = result.replace(new RegExp(encoded, 'g'), decoded);
    }

    return result;
  }

  // Hàm để làm sạch các thuộc tính NFT
  function cleanupNFTAttributes(attributesArray: any[]) {
    if (!attributesArray || !Array.isArray(attributesArray)) return [];

    return attributesArray.map((attr) => {
      if (attr && typeof attr === 'object') {
        return {
          trait_type: cleanupVietnameseText(attr.trait_type || ''),
          value: cleanupVietnameseText(attr.value || ''),
        };
      }
      return attr;
    });
  }

  // Xử lý URL IPFS nếu có
  useEffect(() => {
    if (imageUrl.startsWith('ipfs://')) {
      const ipfsPath = imageUrl.replace('ipfs://', '');
      const match = ipfsPath.match(/^([a-zA-Z0-9]+)(.*)$/);

      if (match) {
        const [_, cid, extension] = match;
        const gatewayUrl = `${ipfsGateways[currentGatewayIndex]}${cid}${extension || ''}`;
        setDisplayImageUrl(gatewayUrl);
      } else {
        setDisplayImageUrl(`${ipfsGateways[currentGatewayIndex]}${ipfsPath}`);
      }
    } else {
      setDisplayImageUrl(imageUrl);
    }
  }, [imageUrl, currentGatewayIndex, ipfsGateways]);

  // Xử lý lỗi tải hình ảnh
  const handleImageError = () => {
    setIsImageError(true);
    setIsImageLoading(false);
    if (imageUrl.startsWith('ipfs://')) {
      setPreviewError(
        `Không thể tải từ gateway: ${currentGatewayIndex + 1}/${ipfsGateways.length}`,
      );
    } else {
      setPreviewError('Không thể tải hình ảnh từ URL đã cung cấp');
    }
  };

  // Thử lại với gateway IPFS khác
  const handleTryNextGateway = () => {
    if (onGatewayChange) {
      setIsLoading(true);
      setIsImageLoading(true);
      setPreviewError(null);
      setIsImageError(false);
      onGatewayChange();
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  // Chọn icon phù hợp với thuộc tính
  const getAttributeIcon = (attributeName: string) => {
    const name = attributeName.toLowerCase();
    if (name.includes('địa chỉ') || name.includes('address'))
      return <Database className="h-3 w-3" />;
    if (name.includes('date') || name.includes('ngày')) return <Calendar className="h-3 w-3" />;
    if (name.includes('name') || name.includes('tên')) return <User className="h-3 w-3" />;
    if (name.includes('url') || name.includes('link')) return <Globe className="h-3 w-3" />;
    return <Info className="h-3 w-3" />;
  };

  // Xử lý tên phiếu bầu rút gọn
  const shortenName = (name: string, maxLength = 28) => {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength)}...`;
  };

  // Rút gọn IPFS hash để hiển thị
  const shortenIPFSHash = (url: string) => {
    if (!url.startsWith('ipfs://')) return url;
    const hash = url.replace('ipfs://', '');
    const hashParts = hash.split('.');
    const cid = hashParts[0];
    if (cid.length <= 16) return hash;
    return `${cid.substring(0, 6)}...${cid.substring(cid.length - 4)}${
      hashParts.length > 1 ? '.' + hashParts.slice(1).join('.') : ''
    }`;
  };

  // Xử lý copy IPFS URL
  const handleCopyIPFS = () => {
    navigator.clipboard.writeText(imageUrl);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  // Định dạng thời gian
  const formatCurrentTime = () => {
    const now = new Date();
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(now);
  };

  // Tạo mã phiếu bầu giả lập
  const generateBallotCode = () => {
    if (!imageUrl.startsWith('ipfs://')) return 'BALLOT-000000';
    const hash = imageUrl.replace('ipfs://', '').split('.')[0];
    return `BALLOT-${hash.substring(0, 6).toUpperCase()}`;
  };

  // Tạo dữ liệu cho QR code
  const generateQRData = () => {
    if (imageUrl.startsWith('ipfs://')) {
      return JSON.stringify({
        ballot_id: generateBallotCode(),
        name: shortenName(cleanName, 15),
        ipfs: imageUrl,
        timestamp: new Date().toISOString(),
        type: is3DModel ? '3d-model' : 'image',
      });
    }

    return JSON.stringify({
      ballot_id: generateBallotCode(),
      name: shortenName(cleanName.split('-').pop() || '', 12),
      session: cleanName,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full max-w-6xl mx-auto shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
    >
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-900/30 dark:to-blue-900/10">
        <TabsList className="bg-transparent p-0">
          <TabsTrigger
            value="visual"
            className="h-10 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none"
          >
            <FileImage className="h-4 w-4 mr-2" />
            Xem trước
          </TabsTrigger>
          <TabsTrigger
            value="json"
            className="h-10 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none"
          >
            <Code className="h-4 w-4 mr-2" />
            JSON
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Visual Preview Tab - Thiết kế NFT Card mới */}
      <TabsContent value="visual" className="p-0 m-0">
        <div className="w-full max-w-4xl mx-auto p-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            {/* NFT Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md ring-2 ring-white/80 dark:ring-gray-800">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Phiếu Bầu Blockchain</h3>
                  <div className="flex items-center mt-0.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {generateBallotCode()}
                    </span>
                    <span className="inline-block mx-2 w-1 h-1 rounded-full bg-gray-400"></span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                      Đã xác minh
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm ring-2 ring-white dark:ring-gray-800">
                  NFT Token
                </span>
                {is3DModel && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm animate-pulse">
                    <Sparkles className="w-3 h-3 mr-1" />
                    3D
                  </span>
                )}
              </div>
            </div>

            {/* NFT Preview Content */}
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-5">
                {/* NFT Image/Model Preview */}
                <div className="lg:col-span-3 relative">
                  <div
                    className={`aspect-square rounded-lg overflow-hidden relative shadow-md border border-gray-200 dark:border-gray-700 ${
                      is3DModel ? 'shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10' : ''
                    }`}
                    style={{ backgroundColor: backgroundColor || '#f8f9fa' }}
                  >
                    {isImageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm z-10">
                        <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                      </div>
                    )}

                    {isImageError && imageUrl.startsWith('ipfs://') && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/90 dark:bg-red-900/30 p-3 z-10">
                        <p className="text-sm text-red-600 dark:text-red-400 text-center mb-2">
                          Không thể tải từ gateway: {currentGatewayIndex + 1}/{ipfsGateways.length}
                        </p>
                        <button
                          onClick={handleTryNextGateway}
                          className="text-xs bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 px-3 py-1 rounded border border-red-200 dark:border-red-800 hover:bg-red-50"
                        >
                          <RefreshCw className="w-3 h-3 mr-1 inline" />
                          Thử gateway khác
                        </button>
                      </div>
                    )}

                    {is3DModel ? (
                      <Model3DViewer
                        modelUrl={displayImageUrl}
                        height="100%"
                        autoRotate={true}
                        rotationSpeed={1}
                        backgroundColor={backgroundColor || '#f4f6f8'}
                        showControls={false}
                      />
                    ) : imageUrl.startsWith('ipfs://') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center relative">
                        <img
                          src={displayImageUrl}
                          alt={name}
                          className="max-h-full max-w-full object-contain mx-auto shadow-lg rounded"
                          onError={handleImageError}
                          onLoad={() => {
                            setIsImageError(false);
                            setIsImageLoading(false);
                          }}
                        />

                        {/* IPFS Badge */}
                        <div className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-2 py-1 rounded-md text-xs font-medium shadow-sm backdrop-blur-sm flex items-center ring-1 ring-white/30">
                          <Database className="w-3 h-3 mr-1" />
                          IPFS {currentGatewayIndex + 1}/{ipfsGateways.length}
                        </div>
                      </div>
                    ) : (
                      <img
                        src={
                          displayImageUrl ||
                          'https://placehold.co/400x400/e2e8f0/667085?text=Ballot+Image'
                        }
                        alt={name}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    )}
                  </div>

                  {/* IPFS URL & Controls */}
                  {imageUrl.startsWith('ipfs://') && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-3 flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-md border border-blue-100 dark:border-blue-800/50 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-center overflow-hidden">
                        <Database className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mr-2" />
                        <span className="text-xs text-blue-600 dark:text-blue-300 font-mono truncate">
                          ipfs://{shortenIPFSHash(imageUrl)}
                        </span>
                      </div>
                      <div className="flex space-x-1 ml-2 flex-shrink-0">
                        <button
                          onClick={handleCopyIPFS}
                          className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors relative"
                        >
                          <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          {showCopied && (
                            <span className="absolute -top-7 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded">
                              Copied!
                            </span>
                          )}
                        </button>
                        <button
                          className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
                          onClick={handleTryNextGateway}
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* NFT Details */}
                <div className="lg:col-span-2 space-y-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                      {shortenName(cleanName)}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {cleanDescription}
                    </p>
                  </div>

                  {/* Properties/Attributes */}
                  <div className="mt-4 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                      <Award className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                      Thuộc tính phiếu bầu
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {cleanAttributes
                        .filter((attr) => attr.trait_type && attr.value)
                        .slice(0, 6)
                        .map((attr, index) => (
                          <div
                            key={index}
                            className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-transform duration-200 hover:shadow-md"
                          >
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                              {attr.trait_type}
                            </span>
                            <span className="block text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {attr.value}
                            </span>
                          </div>
                        ))}
                    </div>
                    {cleanAttributes.filter((attr) => attr.trait_type && attr.value).length > 6 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 text-right">
                        +
                        {cleanAttributes.filter((attr) => attr.trait_type && attr.value).length - 6}{' '}
                        thuộc tính khác
                      </div>
                    )}
                  </div>

                  {/* Status & Security */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-2 py-1.5 border border-gray-100 dark:border-gray-700">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                          {formatCurrentTime()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-2 py-1.5 border border-emerald-100 dark:border-emerald-800/30">
                        <Lock className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          Đã xác thực blockchain
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* External Link */}
                  {externalUrl && (
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 text-sm flex items-center px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors duration-200"
                    >
                      <Globe className="w-3.5 h-3.5 mr-1.5" />
                      Xem chi tiết
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </a>
                  )}
                </div>
              </div>

              {/* QR Code Implementation */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center mb-3">
                  <QrCode className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Quét mã QR để xác minh
                  </span>
                </h3>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* QR Code */}
                  <div className="relative bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-auto transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <QRCode
                      value={generateQRData()}
                      size={120}
                      level="H"
                      fgColor="#000000"
                      bgColor="#FFFFFF"
                      className="h-[120px] w-[120px]"
                    />
                    {/* Badge để phân biệt loại QR */}
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                      Verify
                    </div>
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mã QR xác minh phiếu bầu
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Mã QR này chứa thông tin phiếu bầu và có thể được sử dụng để xác minh tính hợp
                      lệ trên blockchain.
                    </p>
                    <div className="flex items-center justify-center sm:justify-start space-x-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Xác thực bảo mật
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
                        <Shield className="w-3 h-3 mr-1" />
                        Blockchain
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hướng dẫn phân biệt giữa các mã QR */}
              {imageUrl.startsWith('ipfs://') && (
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/30 dark:to-blue-900/10 rounded-md p-2 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors duration-300">
                  <div className="flex items-center space-x-2">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    <span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">Lưu ý:</span>{' '}
                      Phiếu bầu có mã QR nhỏ - mã QR xác minh ở trên dùng để kiểm tra tính hợp lệ.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* NFT Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/70 dark:to-blue-900/20 p-3 flex justify-between items-center">
              <div className="flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span className="text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                  Powered by HoLiHu Blockchain
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Phiếu bầu được bảo mật bởi công nghệ NFT
              </div>
            </div>
          </motion.div>
        </div>
      </TabsContent>

      {/* JSON Preview Tab */}
      <TabsContent value="json" className="p-4 m-0">
        <div className="space-y-4 max-w-4xl mx-auto">
          <pre className="p-4 rounded-md bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-900/30 dark:to-blue-900/10 border border-gray-200 dark:border-gray-700 overflow-x-auto text-xs font-mono shadow-inner">
            {JSON.stringify(
              {
                name: cleanName,
                description: cleanDescription,
                image: imageUrl,
                attributes: cleanAttributes,
                background_color: backgroundColor.replace('#', ''),
                external_url: externalUrl,
                ballot_id: generateBallotCode(),
                timestamp: new Date().toISOString(),
                verification: {
                  verified: true,
                  blockchain: 'Ethereum',
                  type: is3DModel ? '3D-Model' : 'Image',
                },
              },
              null,
              2,
            )}
          </pre>
          <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800/50 shadow-sm">
            <AlertDescription className="text-xs">
              Đây là JSON metadata của phiếu bầu NFT. Khi cấp phiếu, hệ thống sẽ thêm thông tin cử
              tri và các thuộc tính riêng biệt cho từng cử tri.
            </AlertDescription>
          </Alert>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default NFTBallotPreview;
