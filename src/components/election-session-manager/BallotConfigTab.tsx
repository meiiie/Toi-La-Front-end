'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';
import { Button } from '../../components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alter';
import { useToast } from '../../test/components/use-toast';
import BallotImageUploader from './BallotImageUploader';
import {
  CreditCard,
  Image as ImageIcon,
  Save,
  Settings,
  Edit,
  Info,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import type { PhienBauCu } from '../../store/types';
import NFTBallotPreview from './NFTBallotPreview';
import Model3DView from './Model3DView';

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
  initialMetadata?: BallotMetadata;
}

const BallotConfigTab: React.FC<BallotConfigTabProps> = ({
  selectedSession,
  onMetadataChange,
  initialMetadata,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basic');

  // Basic configuration
  const [ballotName, setBallotName] = useState<string>('');
  const [ballotDescription, setBallotDescription] = useState<string>('');
  const [ballotImage, setBallotImage] = useState<string>('');
  const [ballotAttributes, setBallotAttributes] = useState<{ trait_type: string; value: string }[]>(
    [],
  );
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [externalUrl, setExternalUrl] = useState<string>('');
  const [animationUrl, setAnimationUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load initial metadata
  useEffect(() => {
    if (initialMetadata) {
      setBallotName(initialMetadata.name || '');
      setBallotDescription(initialMetadata.description || '');
      setBallotImage(initialMetadata.image || '');
      setBallotAttributes(initialMetadata.attributes || []);
      setBackgroundColor(initialMetadata.background_color || '#ffffff');
      setExternalUrl(initialMetadata.external_url || '');
      setAnimationUrl(initialMetadata.animation_url || '');
    } else {
      // Set default values
      setBallotName(selectedSession?.tenPhienBauCu || 'Phiếu bầu cử');
      setBallotDescription('Phiếu bầu cử HoLiHu Blockchain');
      setBallotAttributes([{ trait_type: 'Loại phiếu', value: 'Bầu cử chính thức' }]);
      setBackgroundColor('#ffffff');
    }
  }, [initialMetadata, selectedSession]);

  // Handle image upload
  const handleImageUpload = (url: string) => {
    setBallotImage(url);
    toast({
      title: 'Tải lên thành công',
      description: 'Hình ảnh đã được tải lên thành công.',
      variant: 'default',
    });
  };

  // Handle adding new attribute
  const handleAddAttribute = () => {
    setBallotAttributes([...ballotAttributes, { trait_type: '', value: '' }]);
  };

  // Handle removing attribute
  const handleRemoveAttribute = (index: number) => {
    const newAttributes = [...ballotAttributes];
    newAttributes.splice(index, 1);
    setBallotAttributes(newAttributes);
  };

  // Handle attribute change
  const handleAttributeChange = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newAttributes = [...ballotAttributes];
    newAttributes[index][field] = value;
    setBallotAttributes(newAttributes);
  };

  // Handle 3D model URL change
  const handleModelUrlChange = (url: string) => {
    setAnimationUrl(url);
  };

  // Handle save configuration
  const handleSaveConfig = () => {
    setIsLoading(true);

    // Create metadata object
    const metadata: BallotMetadata = {
      name: ballotName,
      description: ballotDescription,
      image: ballotImage,
      attributes: ballotAttributes.filter((attr) => attr.trait_type && attr.value),
    };

    // Add optional fields if they have values
    if (backgroundColor !== '#ffffff') metadata.background_color = backgroundColor;
    if (externalUrl) metadata.external_url = externalUrl;
    if (animationUrl) metadata.animation_url = animationUrl;

    // Call onMetadataChange callback
    if (onMetadataChange) {
      onMetadataChange(metadata);
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  // Create a metadata object for preview
  const previewMetadata = {
    name: ballotName,
    description: ballotDescription,
    image: ballotImage,
    attributes: ballotAttributes.filter((attr) => attr.trait_type && attr.value),
    background_color: backgroundColor,
    external_url: externalUrl,
    animation_url: animationUrl,
  };

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-purple-500 dark:border-purple-600 bg-gradient-to-br from-white to-purple-50 dark:from-[#162A45]/90 dark:to-[#1A2942]/70">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50">
              <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
              Cấu Hình Phiếu Bầu
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4 md:px-6">
              {/* Improved tab layout for mobile */}
              <TabsList className="grid w-full grid-cols-3 gap-1 overflow-x-auto max-w-full text-xs md:text-sm">
                <TabsTrigger
                  value="basic"
                  className="flex items-center gap-1 md:gap-2 py-1.5 px-2 md:py-2 md:px-3"
                >
                  <Edit className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="truncate">Thông tin cơ bản</span>
                </TabsTrigger>
                <TabsTrigger
                  value="advanced"
                  className="flex items-center gap-1 md:gap-2 py-1.5 px-2 md:py-2 md:px-3"
                >
                  <Settings className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="truncate">Cấu hình nâng cao</span>
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="flex items-center gap-1 md:gap-2 py-1.5 px-2 md:py-2 md:px-3"
                >
                  <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
                  <span className="truncate">Xem trước</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Basic Configuration */}
            <TabsContent value="basic" className="p-4 md:p-6 space-y-6">
              {/* Improved grid layout for mobile */}
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ballot-name">Tên phiếu bầu</Label>
                    <Input
                      id="ballot-name"
                      value={ballotName}
                      onChange={(e) => setBallotName(e.target.value)}
                      placeholder="Nhập tên phiếu bầu"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ballot-description">Mô tả</Label>
                    <Textarea
                      id="ballot-description"
                      value={ballotDescription}
                      onChange={(e) => setBallotDescription(e.target.value)}
                      placeholder="Nhập mô tả phiếu bầu"
                      className="h-24 md:h-32"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hình ảnh phiếu bầu</Label>
                    <BallotImageUploader
                      currentImage={ballotImage}
                      onImageUpload={handleImageUpload}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Thuộc tính phiếu bầu</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddAttribute}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Thêm</span>
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-60 md:max-h-72 overflow-y-auto pr-1">
                      {ballotAttributes.map((attr, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="grid grid-cols-2 gap-2 flex-1">
                            <Input
                              placeholder="Tên thuộc tính"
                              value={attr.trait_type}
                              onChange={(e) =>
                                handleAttributeChange(index, 'trait_type', e.target.value)
                              }
                              className="text-sm"
                            />
                            <Input
                              placeholder="Giá trị"
                              value={attr.value}
                              onChange={(e) =>
                                handleAttributeChange(index, 'value', e.target.value)
                              }
                              className="text-sm"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAttribute(index)}
                            className="p-0 h-9 w-9 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {ballotAttributes.length === 0 && (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                          Chưa có thuộc tính nào. Nhấn "Thêm" để bắt đầu.
                        </div>
                      )}
                    </div>
                  </div>

                  <Alert>
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle>Lưu ý</AlertTitle>
                    <AlertDescription className="text-xs">
                      Cấu hình này sẽ được sử dụng để tạo phiếu bầu NFT cho cử tri. Các cử tri sẽ
                      nhìn thấy thông tin này khi họ nhận phiếu bầu.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white w-full md:w-auto"
                  onClick={handleSaveConfig}
                  disabled={isLoading || !ballotName || !ballotImage}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2 justify-center w-full">
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Lưu...</span>
                    </div>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu cấu hình
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Advanced Configuration */}
            <TabsContent value="advanced" className="p-4 md:p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="background-color">Màu nền</Label>
                    <div className="flex gap-2">
                      <div
                        className="w-10 h-10 rounded border border-gray-200 dark:border-gray-700"
                        style={{ backgroundColor: backgroundColor }}
                      />
                      <Input
                        id="background-color"
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="external-url">Đường dẫn ngoài (External URL)</Label>
                    <Input
                      id="external-url"
                      type="url"
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="animation-url">Đường dẫn mô hình 3D (Animation URL)</Label>
                    <Input
                      id="animation-url"
                      value={animationUrl}
                      onChange={(e) => handleModelUrlChange(e.target.value)}
                      placeholder="https://example.com/model.glb"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Đường dẫn đến mô hình 3D định dạng .glb hoặc .gltf
                    </p>
                  </div>

                  {animationUrl && (
                    <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="p-3 md:p-4 bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="text-sm font-medium">Xem trước mô hình 3D</h3>
                      </div>
                      <div className="h-48 bg-gray-100 dark:bg-gray-800/30">
                        <Model3DView url={animationUrl} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced configuration actions */}
              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white w-full md:w-auto"
                  onClick={handleSaveConfig}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2 justify-center w-full">
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Lưu...</span>
                    </div>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu cấu hình nâng cao
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Preview */}
            <TabsContent value="preview" className="p-4 md:p-6">
              {/* More responsive preview layout */}
              <div className="flex flex-col gap-6">
                <div className="w-full">
                  <NFTBallotPreview metadata={previewMetadata} />
                </div>
                <div className="w-full space-y-4">
                  <Card>
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-base flex items-center">
                        <Info className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                        Thông tin JSON metadata
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-50 dark:bg-gray-800/50 p-3 md:p-4 rounded-md overflow-auto text-xs max-h-64 md:max-h-96">
                        {JSON.stringify(previewMetadata, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>

                  <Alert>
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle>Lưu ý về xem trước</AlertTitle>
                    <AlertDescription className="text-xs">
                      Đây là bản xem trước của phiếu bầu NFT. Hình ảnh và metadata sẽ được hiển thị
                      cho cử tri khi họ nhận được phiếu bầu. Nhấn "Lưu cấu hình" để áp dụng các thay
                      đổi.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BallotConfigTab;
