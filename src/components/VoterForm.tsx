'use client';

import React, { useState, useRef } from 'react';
import { Voter } from '../store/types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Checkbox } from './ui/Checkbox';
import { Label } from './ui/Label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { ScrollArea } from './ui/Scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/Dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './ui/Carousel';
import {
  PlusCircle,
  Save,
  Trash2,
  User,
  Phone,
  Mail,
  Shield,
  Tag,
  Upload,
  Share2,
  Search,
  GripVertical,
} from 'lucide-react';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface VoterFormProps {
  onSave: (data: Voter[]) => void;
}

export default function VoterForm({ onSave }: VoterFormProps) {
  const [voterList, setVoterList] = useState<Voter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Voter[]>([]);
  const [currentVoterIndex, setCurrentVoterIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddVoter = () => {
    setVoterList([
      ...voterList,
      { id: Date.now().toString(), name: '', phone: '', email: '', isRestricted: false, roleId: 0 },
    ]);
    setCurrentVoterIndex(voterList.length);
  };

  const handleChange = (index: number, field: keyof Voter, value: string | boolean | number) => {
    const newVoterList = [...voterList];
    newVoterList[index] = { ...newVoterList[index], [field]: value };
    setVoterList(newVoterList);
  };

  const handleRemoveVoter = (index: number) => {
    const newVoterList = voterList.filter((_, i) => i !== index);
    setVoterList(newVoterList);
    if (currentVoterIndex >= newVoterList.length) {
      setCurrentVoterIndex(Math.max(0, newVoterList.length - 1));
    }
  };

  const handleSubmit = () => {
    onSave(voterList);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        handleExcelFile(file);
      } else if (fileExtension === 'csv') {
        handleCSVFile(file);
      } else {
        alert('Unsupported file format. Please upload an Excel or CSV file.');
      }
    }
  };

  const handleExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Voter[];
      setVoterList(jsonData.map((voter) => ({ ...voter, id: Date.now().toString() })));
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCSVFile = (file: File) => {
    Papa.parse(file, {
      complete: (results) => {
        const jsonData = results.data as Voter[];
        setVoterList(jsonData.map((voter) => ({ ...voter, id: Date.now().toString() })));
      },
      header: true,
      skipEmptyLines: true,
    });
  };

  const handleSearch = () => {
    const results = voterList.filter(
      (voter) =>
        voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setSearchResults(results);
  };

  const handleAddFoundVoter = (voter: Voter) => {
    setVoterList([...voterList, voter]);
    setSearchResults(searchResults.filter((v) => v.id !== voter.id));
  };

  const generateShareableLink = () => {
    const baseUrl = window.location.origin;
    const sessionId = Math.random().toString(36).substring(7);
    return `${baseUrl}/join-session/${sessionId}`;
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(voterList);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setVoterList(items);
    setCurrentVoterIndex(result.destination.index);
  };

  const VoterCard = ({ voter, index }: { voter: Voter; index: number }) => (
    <Card className="w-full">
      <CardHeader className="bg-gray-50 pb-2 flex flex-row items-center">
        <CardTitle className="text-xl text-blue-600">Voter {index + 1}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`name-${index}`} className="flex items-center text-gray-700">
              <User className="w-4 h-4 mr-2 text-blue-500" />
              Tên
            </Label>
            <Input
              id={`name-${index}`}
              placeholder="Nhập tên"
              value={voter.name}
              onChange={(e) => handleChange(index, 'name', e.target.value)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`phone-${index}`} className="flex items-center text-gray-700">
              <Phone className="w-4 h-4 mr-2 text-blue-500" />
              Số điện thoại
            </Label>
            <Input
              id={`phone-${index}`}
              placeholder="Nhập số điện thoại"
              value={voter.phone}
              onChange={(e) => handleChange(index, 'phone', e.target.value)}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`email-${index}`} className="flex items-center text-gray-700">
            <Mail className="w-4 h-4 mr-2 text-blue-500" />
            Email
          </Label>
          <Input
            id={`email-${index}`}
            type="email"
            placeholder="Nhập địa chỉ email"
            value={voter.email}
            onChange={(e) => handleChange(index, 'email', e.target.value)}
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`restricted-${index}`}
            checked={voter.isRestricted}
            onCheckedChange={(checked) => handleChange(index, 'isRestricted', checked)}
            className="border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Label htmlFor={`restricted-${index}`} className="flex items-center text-gray-700">
            <Shield className="w-4 h-4 mr-2 text-blue-500" />
            Restricted
          </Label>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`role-${index}`} className="flex items-center text-gray-700">
            <Tag className="w-4 h-4 mr-2 text-blue-500" />
            Role ID
          </Label>
          <Input
            id={`role-${index}`}
            type="number"
            placeholder="Enter role ID"
            value={voter.roleId}
            onChange={(e) => handleChange(index, 'roleId', parseInt(e.target.value))}
            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="destructive"
          onClick={() => handleRemoveVoter(index)}
          className="w-full bg-red-500 hover:bg-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Xóa Cử Tri
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-100">
      <Card className="shadow-lg border-blue-200">
        <CardHeader className="bg-blue-600 text-white">
          <CardTitle className="text-3xl font-bold text-center">Đăng Ký Cử Tri</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="manual">Nhập Thủ Công</TabsTrigger>
              <TabsTrigger value="import">Nhập File</TabsTrigger>
              <TabsTrigger value="search">Tìm Cử Tri</TabsTrigger>
              <TabsTrigger value="share">Chia Sẻ</TabsTrigger>
            </TabsList>
            <TabsContent value="manual">
              {voterList.length > 0 ? (
                <Carousel className="w-full max-w-xs mx-auto">
                  <CarouselContent>
                    {voterList.map((voter, index) => (
                      <CarouselItem key={voter.id}>
                        <VoterCard voter={voter} index={index} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              ) : (
                <p className="text-center text-gray-500 my-4">
                  Chưa có cử tri nào ở đây cả, hãy thêm vào.
                </p>
              )}
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Kéo thả thứ tự cử tri</h3>
                <ScrollArea className="h-[200px] w-full border rounded-md p-4">
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="voters">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                          {voterList.map((voter, index) => (
                            <Draggable key={voter.id} draggableId={voter.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="flex items-center p-2 mb-2 bg-white rounded-md shadow-sm"
                                >
                                  <GripVertical className="mr-2 h-5 w-5 text-gray-400" />
                                  <span>{voter.name || `Voter ${index + 1}`}</span>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </ScrollArea>
              </div>
            </TabsContent>
            <TabsContent value="import">
              <Card>
                <CardHeader>
                  <CardTitle>Nhập Cử Tri Từ File</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="dropzone-file"
                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">Excel or CSV file</p>
                      </div>
                      <input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        ref={fileInputRef}
                      />
                    </label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle>Tìm Cử Tri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Tìm kiếm bằng tên hoặc email ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button onClick={handleSearch}>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                  </div>
                  <ScrollArea className="h-[40vh] w-full mt-4">
                    {searchResults.map((voter) => (
                      <Card key={voter.id} className="mb-2">
                        <CardContent className="flex justify-between items-center p-4">
                          <div>
                            <p className="font-semibold">{voter.name}</p>
                            <p className="text-sm text-gray-500">{voter.email}</p>
                          </div>
                          <Button onClick={() => handleAddFoundVoter(voter)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="share">
              <Card>
                <CardHeader>
                  <CardTitle>Chia sẻ phiên bầu cử</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Tạo liên kết có thể chia sẻ để người khác tham gia phiên bỏ phiếu này:
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Share2 className="mr-2 h-4 w-4" />
                        Tạo liên kết chia sẻ
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Đã tạo liên kết có thể chia sẻ</DialogTitle>
                        <DialogDescription>
                          Chia sẻ liên kết này với những người khác để mời họ tham gia phiên bầu cử:
                        </DialogDescription>
                      </DialogHeader>
                      <Input
                        readOnly
                        value={generateShareableLink()}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <Button
                        onClick={() => navigator.clipboard.writeText(generateShareableLink())}
                      >
                        Copy to Clipboard
                      </Button>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between bg-gray-50 p-6">
          <Button onClick={handleAddVoter} className="bg-blue-500 hover:bg-blue-600 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm Cử Tri
          </Button>
          <Button onClick={handleSubmit} className="bg-green-500 hover:bg-green-600 text-white">
            <Save className="mr-2 h-4 w-4" />
            Lưu Cử Tri
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
