'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { CuTri } from '../store/types';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Checkbox } from './ui/Checkbox';
import { Label } from './ui/Label';
import {
  Trash2,
  Phone,
  Mail,
  Shield,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Search,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem } from './ui/Accordion';
import { cn } from '../lib/utils';
import { Avatar } from './ui/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip';

interface VoterListProps {
  voters: CuTri[];
  onChange: (index: number, field: keyof CuTri, value: string | boolean | number) => void;
  onRemove: (index: number) => void;
  onSelect: (selectedVoters: Set<number>) => void;
  selectedVoters: Set<number>;
  onRemoveAll: () => void;
  searchInput: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentPage: number;
  itemsPerPage: number;
}

const VoterList: React.FC<VoterListProps> = ({
  voters,
  onChange,
  onRemove,
  onSelect,
  selectedVoters,
  onRemoveAll,
  searchInput,
  onSearchChange,
  currentPage,
  itemsPerPage,
}) => {
  const [selectAll, setSelectAll] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [avatarColors, setAvatarColors] = useState<{ [key: number]: string }>({});

  const getRandomColor = useCallback(() => {
    const colors = [
      '#FF5733',
      '#33FF57',
      '#3357FF',
      '#FF33A1',
      '#FF8C33',
      '#33FFF5',
      '#8C33FF',
      '#FF3333',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  useEffect(() => {
    const newAvatarColors: { [key: number]: string } = { ...avatarColors };
    voters.forEach((voter) => {
      if (!newAvatarColors[voter.id]) {
        newAvatarColors[voter.id] = getRandomColor();
      }
    });
    setAvatarColors(newAvatarColors);
  }, [voters, getRandomColor]);

  const handleSelectAll = useCallback(() => {
    const newSelectedVoters = new Set<number>();
    if (!selectAll) {
      voters.forEach((voter) => newSelectedVoters.add(voter.id));
    }
    setSelectAll(!selectAll);
    onSelect(newSelectedVoters);
    setShowCheckboxes(!selectAll);
  }, [selectAll, voters, onSelect]);

  const handleCheckboxChange = useCallback(
    (id: number) => {
      const newSelectedVoters = new Set(selectedVoters);
      if (newSelectedVoters.has(id)) {
        newSelectedVoters.delete(id);
      } else {
        newSelectedVoters.add(id);
      }
      onSelect(newSelectedVoters);
    },
    [selectedVoters, onSelect],
  );

  const filteredVoters = useMemo(() => {
    return voters.filter(
      (voter) =>
        ((voter.email?.toLowerCase().includes(searchInput.toLowerCase()) ?? false) ||
          (voter.sdt?.includes(searchInput) ?? false)) ??
        false,
    );
  }, [voters, searchInput]);

  const toggleAccordion = useCallback((itemId: string) => {
    setOpenItems((prevOpenItems) => {
      const newOpenItems = new Set(prevOpenItems);
      if (newOpenItems.has(itemId)) {
        newOpenItems.delete(itemId);
      } else {
        newOpenItems.add(itemId);
      }
      return newOpenItems;
    });
  }, []);

  const getInitials = useCallback((name: string) => {
    const initials = name
      .split(' ')
      .map((word) => word[0])
      .join('');
    return initials.toUpperCase();
  }, []);

  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-white z-10 p-4 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Danh sách cử tri</h2>
          <span className="text-sm text-gray-500">
            Hiển thị {filteredVoters.length}/{voters.length} cử tri
          </span>
        </div>
        <div className="flex space-x-2 mb-4">
          <Input
            type="text"
            placeholder="Tìm kiếm cử tri..."
            value={searchInput}
            onChange={onSearchChange}
            className="flex-grow"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={`transition-all ease-in-out duration-300 ${selectAll ? 'bg-blue-100' : ''}`}
                  onClick={handleSelectAll}
                >
                  {selectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedVoters.size} cử tri đã được chọn</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="destructive" onClick={onRemoveAll} disabled={selectedVoters.size === 0}>
            Xóa đã chọn
          </Button>
        </div>
      </div>

      {filteredVoters.length === 0 ? (
        <p className="text-center text-muted-foreground my-4">Không tìm thấy cử tri nào.</p>
      ) : (
        <Accordion
          type="multiple"
          value={Array.from(openItems)}
          onValueChange={(values) => setOpenItems(new Set(values))}
          className="w-full space-y-2"
        >
          {filteredVoters.map((voter, index) => {
            const hasError = !voter.email || !voter.sdt;
            const isSelected = selectedVoters.has(voter.id);
            const voterIndex = (currentPage - 1) * itemsPerPage + index + 1;
            const itemId = `voter-${voter.id}`;
            const isOpen = openItems.has(itemId);

            return (
              <AccordionItem value={itemId} key={voter.id} className="border rounded-lg">
                <div className="flex items-center px-4 py-2">
                  {showCheckboxes && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleCheckboxChange(voter.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mr-2"
                    />
                  )}
                  <div
                    className={cn(
                      'flex items-center justify-between w-full cursor-pointer',
                      isOpen && 'mb-2',
                    )}
                    onClick={() => toggleAccordion(itemId)}
                    role="button"
                    aria-expanded={isOpen}
                    aria-controls={`content-${itemId}`}
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <div
                          className="h-full w-full rounded-full flex items-center justify-center"
                          style={{ backgroundColor: avatarColors[voter.id] }}
                        >
                          <span className="text-white font-bold">
                            {getInitials(voter.email || `Cử tri ${voterIndex}`)}
                          </span>
                        </div>
                      </Avatar>
                      <div>
                        <p className="font-medium">{voter.email || `Cử tri ${voterIndex}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {voter.sdt || 'Chưa có số điện thoại'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasError ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertCircle className="h-5 w-5 text-destructive" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Thiếu thông tin: {!voter.email ? 'Email' : ''}{' '}
                                {!voter.sdt ? 'Số điện thoại' : ''}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isOpen && 'transform rotate-180',
                        )}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(index);
                    }}
                    className="ml-2"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <AccordionContent id={`content-${itemId}`}>
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`sdt-${voter.id}`} className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-primary" />
                            Số điện thoại
                          </Label>
                          <Input
                            id={`sdt-${voter.id}`}
                            placeholder="Nhập số điện thoại"
                            value={voter.sdt}
                            onChange={(e) => onChange(index, 'sdt', e.target.value)}
                            className={cn(!voter.sdt && 'border-destructive')}
                          />
                          {!voter.sdt && (
                            <p className="text-destructive text-sm">
                              Số điện thoại không được để trống
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`email-${voter.id}`} className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-primary" />
                            Email
                          </Label>
                          <Input
                            id={`email-${voter.id}`}
                            type="email"
                            placeholder="Nhập địa chỉ email"
                            value={voter.email}
                            onChange={(e) => onChange(index, 'email', e.target.value)}
                            className={cn(!voter.email && 'border-destructive')}
                          />
                          {!voter.email && (
                            <p className="text-destructive text-sm">Email không được để trống</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`xacMinh-${voter.id}`}
                          checked={voter.xacMinh}
                          onCheckedChange={(checked) =>
                            onChange(index, 'xacMinh', checked as boolean)
                          }
                        />
                        <Label htmlFor={`xacMinh-${voter.id}`} className="flex items-center">
                          <Shield className="w-4 h-4 mr-2 text-primary" />
                          Xác minh
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};

export default React.memo(VoterList);
