'use client';

import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Search, RefreshCw } from 'lucide-react';
import { useVoting } from './voting-context';
import { RadioGroup, RadioGroupItem } from '../../components/ui/Radio-Group';
import { Label } from '../../components/ui/Label';

export default function CandidatesGallery() {
  const [searchTerm, setSearchTerm] = useState('');
  const { candidates, selectedCandidate, setSelectedCandidate, refreshCandidates, isLoading } =
    useVoting();

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.address.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Danh Sách Ứng Viên</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative max-w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Tìm kiếm ứng viên..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={refreshCandidates} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {candidates.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-slate-500">
            Không có ứng viên. Vui lòng tải phiên bầu cử.
          </div>
        ) : isLoading ? (
          <div className="text-center py-8 text-slate-500">Đang tải danh sách ứng viên...</div>
        ) : (
          <RadioGroup
            value={selectedCandidate?.address || ''}
            onValueChange={(value) => {
              const candidate = candidates.find((c) => c.address === value);
              setSelectedCandidate(candidate || null);
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredCandidates.map((candidate) => (
              <div
                key={candidate.address}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col items-center">
                  <img
                    src={
                      candidate.imageUrl ||
                      `/placeholder.svg?height=200&width=200&text=${candidate.name}`
                    }
                    alt={candidate.name}
                    className="w-[200px] h-[200px] object-cover rounded-md border border-slate-200 mb-3"
                  />
                  <h3 className="font-medium text-slate-800 text-center">{candidate.name}</h3>
                  <p className="text-sm text-slate-500 mb-3">
                    {candidate.address.substring(0, 6)}...
                    {candidate.address.substring(candidate.address.length - 4)}
                  </p>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={candidate.address} id={candidate.address} />
                    <Label htmlFor={candidate.address}>Chọn</Label>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}
