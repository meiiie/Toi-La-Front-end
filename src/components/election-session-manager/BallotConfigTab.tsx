'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import { useToast } from '../../test/components/use-toast';
import {
  Image,
  Save,
  FileImage,
  Database,
  RefreshCw,
  AlertTriangle,
  Info,
  Check,
  Trash2,
  Plus,
  Globe,
  Settings,
  ImagePlus,
  FileCode,
  PanelLeftOpen,
  Sparkles,
  RotateCw,
  Layers,
  Shield,
  CheckCircle,
  Calendar,
  User,
  MapPin,
  CopyCheck,
  BookOpen,
  Box,
} from 'lucide-react';
import type { PhienBauCu } from '../../store/types';
import BallotImageUploader from './BallotImageUploader';
import Model3DViewer from './Model3DView';
import NFTBallotPreview from './NFTBallotPreview';

// Ballot metadata structure
interface BallotMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
  background_color?: string;
  external_url?: string;
  animation_url?: string;
}

interface BallotConfigTabProps {
  selectedSession: PhienBauCu | null;
  onMetadataChange?: (metadata: BallotMetadata) => void;
}

const BallotConfigTab: React.FC<BallotConfigTabProps> = ({ selectedSession, onMetadataChange }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');

  // Basic configuration
  const [ballotName, setBallotName] = useState<string>('');
  const [ballotDescription, setBallotDescription] = useState<string>('');
  const [ballotImageUrl, setBallotImageUrl] = useState<string>('');
  const [ballotBgColor, setBallotBgColor] = useState<string>('#f8f9fa');

  // Advanced configuration
  const [externalUrl, setExternalUrl] = useState<string>('');
  const [animationUrl, setAnimationUrl] = useState<string>('');
  const [attributes, setAttributes] = useState<{ trait_type: string; value: string }[]>([
    { trait_type: 'Loại phiếu', value: 'Phiếu bầu cử chính thức' },
    { trait_type: 'Đơn vị tổ chức', value: '' },
    { trait_type: 'Khu vực bầu cử', value: '' },
  ]);

  // Status
  const [imagePreviewError, setImagePreviewError] = useState<string | null>(null);
  const [imagePreviewSuccess, setImagePreviewSuccess] = useState<boolean>(false);
  const [previewKey, setPreviewKey] = useState<number>(0); // For refreshing preview
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [is3DModel, setIs3DModel] = useState<boolean>(false);
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState<number>(0);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);

  // IPFS Gateways array - multiple alternatives to try
  const ipfsGateways = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://ipfs.infura.io/ipfs/',
    'https://dweb.link/ipfs/',
  ];

  // Example attributes (for adding common attribute types)
  const exampleAttributes = [
    { trait_type: 'Mã đợt bầu cử', value: '' },
    { trait_type: 'Thời hạn hiệu lực', value: '' },
    { trait_type: 'Cơ quan tổ chức', value: '' },
    { trait_type: 'Mã bảo mật', value: '' },
    { trait_type: 'Vòng bầu cử', value: '' },
  ];

  // Load data from localStorage when component mounts
  useEffect(() => {
    if (selectedSession?.id) {
      try {
        const savedConfig = localStorage.getItem(`ballot_config_${selectedSession.id}`);
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          setBallotName(config.name || '');
          setBallotDescription(config.description || '');
          setBallotImageUrl(config.image || '');
          setBallotBgColor(config.background_color ? `#${config.background_color}` : '#f8f9fa');
          setExternalUrl(config.external_url || '');
          setAnimationUrl(config.animation_url || '');

          // Check if it's a 3D model
          setIs3DModel(
            config.image?.endsWith('.glb') ||
              config.image?.endsWith('.gltf') ||
              config.image?.toLowerCase().includes('.glb') ||
              config.image?.toLowerCase().includes('.gltf') ||
              false,
          );

          if (config.attributes && Array.isArray(config.attributes)) {
            setAttributes(config.attributes);
          } else if (config.attributesObj) {
            // Support legacy format
            const formattedAttributes = Object.entries(config.attributesObj).map(
              ([trait_type, value]) => ({ trait_type, value: value as string }),
            );
            setAttributes(formattedAttributes);
          }
        }
      } catch (error) {
        console.warn('Lỗi khi tải cấu hình phiếu bầu:', error);
      }
    }
  }, [selectedSession?.id]);

  // Create metadata and save configuration
  const saveConfiguration = useCallback(() => {
    if (!selectedSession?.id) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng chọn phiên bầu cử trước',
      });
      return;
    }

    try {
      setIsSaving(true);

      // Create metadata
      const metadata: BallotMetadata = {
        name: ballotName || `Phiếu bầu cử - ${selectedSession?.tenPhienBauCu || 'Không xác định'}`,
        description:
          ballotDescription ||
          `Phiếu bầu chính thức cho phiên bầu cử "${selectedSession?.tenPhienBauCu || 'Không xác định'}"`,
        image: ballotImageUrl,
        attributes: attributes.filter((attr) => attr.trait_type && attr.value),
        background_color: ballotBgColor.replace('#', ''),
        external_url: externalUrl || undefined,
        animation_url: animationUrl || undefined,
      };

      // Save to localStorage
      localStorage.setItem(`ballot_config_${selectedSession.id}`, JSON.stringify(metadata));

      // Notify parent component if needed
      if (onMetadataChange) {
        onMetadataChange(metadata);
      }

      setTimeout(() => {
        setIsSaving(false);
        toast({
          title: 'Đã lưu cấu hình',
          description: 'Cấu hình phiếu bầu đã được lưu thành công',
        });
      }, 600);
    } catch (error) {
      console.error('Lỗi khi lưu cấu hình phiếu bầu:', error);
      setIsSaving(false);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể lưu cấu hình phiếu bầu',
      });
    }
  }, [
    selectedSession,
    ballotName,
    ballotDescription,
    ballotImageUrl,
    ballotBgColor,
    externalUrl,
    animationUrl,
    attributes,
    onMetadataChange,
    toast,
  ]);

  // Add new attribute
  const addAttribute = useCallback(() => {
    setAttributes((prev) => [...prev, { trait_type: '', value: '' }]);
  }, []);

  // Add example attribute
  const addExampleAttribute = useCallback(
    (example: { trait_type: string; value: string }) => {
      // Check if the attribute type already exists
      const exists = attributes.some((attr) => attr.trait_type === example.trait_type);
      if (!exists) {
        setAttributes((prev) => [...prev, { ...example }]);
        toast({
          title: 'Đã thêm thuộc tính',
          description: `Thuộc tính "${example.trait_type}" đã được thêm vào phiếu bầu`,
        });
      } else {
        toast({
          variant: 'default',
          title: 'Thuộc tính đã tồn tại',
          description: `Thuộc tính "${example.trait_type}" đã có trong danh sách`,
        });
      }
    },
    [attributes, toast],
  );

  // Update attribute
  const updateAttribute = useCallback(
    (index: number, field: 'trait_type' | 'value', value: string) => {
      setAttributes((prev) => {
        const newAttributes = [...prev];
        newAttributes[index] = { ...newAttributes[index], [field]: value };
        return newAttributes;
      });
    },
    [],
  );

  // Remove attribute
  const removeAttribute = useCallback((index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Reset preview to reload image
  const refreshPreview = useCallback(() => {
    setPreviewKey((prev) => prev + 1);
    setImagePreviewError(null);
  }, []);

  // Try next gateway when image loading fails
  const tryNextGateway = useCallback(() => {
    setCurrentGatewayIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % ipfsGateways.length;
      console.log(`Thử gateway IPFS tiếp theo: ${ipfsGateways[nextIndex]}`);
      return nextIndex;
    });
    setImagePreviewError(null);
    setIsImageLoading(true);
    refreshPreview();
  }, [ipfsGateways.length, refreshPreview]);

  // Process image URL for display
  const processImageUrl = useCallback(
    (url: string) => {
      if (!url) return '';

      // IPFS URL
      if (url.startsWith('ipfs://')) {
        // Phân tích URL IPFS để lấy đúng hash và đuôi file nếu có
        const ipfsPath = url.replace('ipfs://', '');
        const match = ipfsPath.match(/^([a-zA-Z0-9]+)(.*)$/);

        if (match) {
          const [_, cid, extension] = match;
          const gatewayUrl = `${ipfsGateways[currentGatewayIndex]}${cid}${extension || ''}`;
          console.log(`Chuyển đổi URL IPFS: ${url} thành URL gateway: ${gatewayUrl}`);
          return gatewayUrl;
        }

        // Fallback nếu không phân tích được URL
        const gatewayUrl = `${ipfsGateways[currentGatewayIndex]}${ipfsPath}`;
        console.log(`Chuyển đổi URL IPFS (fallback): ${url} thành URL gateway: ${gatewayUrl}`);
        return gatewayUrl;
      }

      return url;
    },
    [currentGatewayIndex, ipfsGateways],
  );

  // Generate JSON preview
  const generateJsonPreview = useCallback(() => {
    const metadata: BallotMetadata = {
      name: ballotName || `Phiếu bầu cử - ${selectedSession?.tenPhienBauCu || 'Không xác định'}`,
      description:
        ballotDescription ||
        `Phiếu bầu chính thức cho phiên bầu cử "${selectedSession?.tenPhienBauCu || 'Không xác định'}"`,
      image: ballotImageUrl,
      attributes: attributes.filter((attr) => attr.trait_type && attr.value),
      background_color: ballotBgColor.replace('#', ''),
    };

    if (externalUrl) metadata.external_url = externalUrl;
    if (animationUrl) metadata.animation_url = animationUrl;

    return JSON.stringify(metadata, null, 2);
  }, [
    ballotName,
    ballotDescription,
    ballotImageUrl,
    attributes,
    ballotBgColor,
    externalUrl,
    animationUrl,
    selectedSession,
  ]);

  // Handle image URL change from the uploader component
  const handleImageChange = useCallback((url: string) => {
    setBallotImageUrl(url);
    setImagePreviewError(null);
    setImagePreviewSuccess(true);

    // Kiểm tra xem có phải là mô hình 3D không dựa trên đuôi file hoặc chuỗi trong URL
    const is3DModelFile =
      url.endsWith('.glb') ||
      url.endsWith('.gltf') ||
      url.toLowerCase().includes('.glb') ||
      url.toLowerCase().includes('.gltf');

    setIs3DModel(is3DModelFile);
  }, []);

  // Render Component
  if (!selectedSession) {
    return (
      <Alert className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle>Chưa chọn phiên bầu cử</AlertTitle>
        <AlertDescription>Vui lòng chọn một phiên bầu cử để cấu hình phiếu bầu.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-t-4 border-blue-500 dark:border-blue-600 bg-gradient-to-br from-white to-blue-50 dark:from-[#162A45]/90 dark:to-[#1A3545]/70 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100 flex items-center">
            Cấu Hình Phiếu Bầu
            <span className="ml-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-full px-2 py-0.5">
              NFT
            </span>
            {is3DModel && (
              <span className="ml-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs rounded-full px-2 py-0.5 flex items-center">
                <Box className="h-3 w-3 mr-1" />
                3D
              </span>
            )}
          </CardTitle>
        </div>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Tùy chỉnh thiết kế và thông tin cho phiếu bầu của phiên "{selectedSession.tenPhienBauCu}"
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 gap-2 mb-6 bg-blue-50/50 dark:bg-blue-900/10 p-1">
            <TabsTrigger
              value="basic"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
            >
              <Settings className="h-4 w-4" />
              <span>Cấu hình cơ bản</span>
            </TabsTrigger>
            <TabsTrigger
              value="attributes"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
            >
              <Layers className="h-4 w-4" />
              <span>Thuộc tính</span>
            </TabsTrigger>
            <TabsTrigger
              value="preview"
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
            >
              <FileCode className="h-4 w-4" />
              <span>Xem trước</span>
            </TabsTrigger>
          </TabsList>

          {/* Basic configuration tab */}
          <TabsContent value="basic" className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="ballotName"
                  className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300"
                >
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Tên phiếu bầu
                </Label>
                <Input
                  id="ballotName"
                  placeholder="Ví dụ: Phiếu bầu cử trường Đại học Luật Hà Nội"
                  value={ballotName}
                  onChange={(e) => setBallotName(e.target.value)}
                  className="border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Mặc định sẽ sử dụng tên phiên bầu cử nếu không được cung cấp
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="ballotDescription"
                  className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300"
                >
                  <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Mô tả phiếu bầu
                </Label>
                <Textarea
                  id="ballotDescription"
                  placeholder="Phiếu bầu cử chính thức..."
                  rows={3}
                  value={ballotDescription}
                  onChange={(e) => setBallotDescription(e.target.value)}
                  className="border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="ballotImageUrl"
                  className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300"
                >
                  <ImagePlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Hình ảnh phiếu bầu
                </Label>
                <BallotImageUploader
                  initialImageUrl={ballotImageUrl}
                  onImageChange={handleImageChange}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="ballotBgColor"
                  className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300"
                >
                  <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Màu nền (HEX)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="ballotBgColor"
                    type="text"
                    placeholder="#f8f9fa"
                    value={ballotBgColor}
                    onChange={(e) => setBallotBgColor(e.target.value)}
                    maxLength={7}
                    className="w-32 border-gray-300 dark:border-gray-700"
                  />
                  <input
                    type="color"
                    value={ballotBgColor}
                    onChange={(e) => setBallotBgColor(e.target.value)}
                    className="h-10 w-10 rounded cursor-pointer border border-gray-300 dark:border-gray-700"
                  />
                  <span className="text-sm text-gray-500">Màu nền cho phiếu bầu NFT</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="externalUrl"
                    className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300"
                  >
                    <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    URL tham chiếu ngoài (tùy chọn)
                  </Label>
                  <Input
                    id="externalUrl"
                    placeholder="https://..."
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="border-gray-300 dark:border-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="animationUrl"
                    className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300"
                  >
                    <FileImage className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    URL animation (tùy chọn)
                  </Label>
                  <Input
                    id="animationUrl"
                    placeholder="https://... hoặc ipfs://..."
                    value={animationUrl}
                    onChange={(e) => setAnimationUrl(e.target.value)}
                    className="border-gray-300 dark:border-gray-700"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Attributes tab */}
          <TabsContent value="attributes" className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium flex items-center gap-2">
                  <CopyCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Thuộc tính phiếu bầu
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addAttribute}
                  className="h-8 gap-1 border-blue-200 dark:border-blue-800/60 bg-white dark:bg-gray-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm thuộc tính
                </Button>
              </div>

              {/* Quick add common attributes */}
              <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-900/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-full mb-1">
                  Thuộc tính phổ biến:
                </span>
                {exampleAttributes.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    onClick={() => addExampleAttribute(example)}
                  >
                    {example.trait_type}
                  </Button>
                ))}
              </div>

              <Table className="border dark:border-gray-800 rounded-md overflow-hidden">
                <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                  <TableRow>
                    <TableHead className="w-[40%]">Tên thuộc tính</TableHead>
                    <TableHead>Giá trị</TableHead>
                    <TableHead className="w-[70px] text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attributes.map((attr, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={attr.trait_type}
                          onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                          placeholder="Tên thuộc tính"
                          className="border-gray-300 dark:border-gray-700"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={attr.value}
                          onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                          placeholder="Giá trị"
                          className="border-gray-300 dark:border-gray-700"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttribute(index)}
                          className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {attributes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                        Chưa có thuộc tính nào. Thêm thuộc tính để mô tả chi tiết hơn về phiếu bầu.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription>
                  Các thuộc tính này sẽ được hiển thị trong metadata của NFT phiếu bầu và có thể
                  được sử dụng để lọc hoặc tìm kiếm phiếu bầu.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          {/* Preview tab */}
          <TabsContent value="preview" className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="space-y-4">
              <h3 className="text-base font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <FileCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                JSON Metadata
              </h3>

              <div className="relative">
                <pre className="p-4 rounded-md bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 overflow-x-auto text-xs font-mono">
                  {generateJsonPreview()}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 h-7 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generateJsonPreview());
                    toast({
                      description: 'Đã sao chép metadata vào clipboard',
                    });
                  }}
                >
                  Sao chép
                </Button>
              </div>

              <Alert className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription>
                  Khi cấp phiếu bầu, metadata này sẽ được đính kèm với phiếu bầu NFT cho mỗi cử tri.
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <ImagePlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Xem trước phiếu bầu
              </h3>

              {/* Thêm component xem trước được nâng cấp */}
              <NFTBallotPreview
                name={ballotName || `Phiếu bầu cử - ${selectedSession?.tenPhienBauCu || ''}`}
                description={
                  ballotDescription ||
                  `Phiếu bầu chính thức cho phiên bầu cử "${selectedSession?.tenPhienBauCu || 'Không xác định'}"`
                }
                imageUrl={ballotImageUrl}
                ipfsGateways={ipfsGateways}
                currentGatewayIndex={currentGatewayIndex}
                attributes={attributes.filter((attr) => attr.trait_type && attr.value)}
                backgroundColor={ballotBgColor}
                is3DModel={is3DModel}
                externalUrl={externalUrl}
                onGatewayChange={tryNextGateway}
              />

              <Alert className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800/50">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <AlertDescription>
                  Phiếu bầu được thiết kế như NFT, giúp cử tri dễ dàng xác thực và ngăn chặn gian
                  lận trên blockchain.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="bg-gradient-to-r from-gray-50 to-blue-50/30 dark:from-gray-900/20 dark:to-blue-900/10 border-t border-gray-200 dark:border-gray-800/50 px-6 py-4 flex justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="h-4 w-4 inline-block mr-1" />
          Cấu hình phiếu cho phiên bầu cử:{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {selectedSession.tenPhienBauCu}
          </span>
        </div>
        <Button
          onClick={saveConfiguration}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
        >
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Lưu cấu hình
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BallotConfigTab;
