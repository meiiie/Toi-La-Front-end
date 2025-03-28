'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface Achievement {
  address: string;
  type: 'bronze' | 'silver' | 'gold' | 'diamond';
  date: string;
}

interface AchievementsShowcaseProps {
  achievements: Achievement[];
}

export default function AchievementsShowcase({ achievements }: AchievementsShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bronze':
        return 'border-[#8D6E63] bg-gradient-to-b from-[#D7CCC8] to-[#8D6E63]/20';
      case 'silver':
        return 'border-[#B0BEC5] bg-gradient-to-b from-[#ECEFF1] to-[#B0BEC5]/20';
      case 'gold':
        return 'border-[#FFB300] bg-gradient-to-b from-[#FFECB3] to-[#FFB300]/20';
      case 'diamond':
        return 'border-[#26C6DA] bg-gradient-to-b from-[#B2EBF2] to-[#26C6DA]/20';
      default:
        return 'border-gray-300';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'bronze':
        return 'Đồng';
      case 'silver':
        return 'Bạc';
      case 'gold':
        return 'Vàng';
      case 'diamond':
        return 'Kim Cương';
      default:
        return type;
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 3 >= achievements.length ? 0 : prevIndex + 3));
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex - 3 < 0 ? Math.max(0, achievements.length - 3) : prevIndex - 3,
    );
  };

  const visibleAchievements = achievements.slice(currentIndex, currentIndex + 3);

  return (
    <Card className="shadow-md border-[#E0E0E0] bg-white">
      <CardHeader className="bg-[#FAFAFA] border-b border-[#EEEEEE] pb-3">
        <CardTitle className="text-xl text-[#263238] flex items-center gap-2">
          <Award className="w-5 h-5 text-[#0288D1]" />
          Thành Tựu Gần Đây
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        {achievements.length === 0 ? (
          <div className="p-8 text-center text-[#78909C]">
            <div className="mb-2">Không có thành tựu nào</div>
            <div className="text-sm">Dữ liệu sẽ xuất hiện khi có cử tri đạt được thành tựu</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {visibleAchievements.map((achievement, index) => (
                <div
                  key={index}
                  className={`border-2 ${getTypeColor(achievement.type)} rounded-lg p-4 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="text-sm mb-2 truncate w-full text-center font-medium text-[#455A64]">
                    {formatAddress(achievement.address)}
                  </div>
                  <div className="w-[120px] h-[120px] mb-2 flex items-center justify-center">
                    {achievement.type === 'bronze' && (
                      <svg viewBox="0 0 24 24" fill="#8D6E63" className="w-full h-full">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z" />
                      </svg>
                    )}
                    {achievement.type === 'silver' && (
                      <svg viewBox="0 0 24 24" fill="#B0BEC5" className="w-full h-full">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-9h4v2h-4v2h4v2h2v-2h2v-2h-2v-2h2V9h-2V7h-2v2h-4z" />
                      </svg>
                    )}
                    {achievement.type === 'gold' && (
                      <svg viewBox="0 0 24 24" fill="#FFB300" className="w-full h-full">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                      </svg>
                    )}
                    {achievement.type === 'diamond' && (
                      <svg viewBox="0 0 24 24" fill="#26C6DA" className="w-full h-full">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14h2v8h-2zm0 10h2v2h-2z" />
                      </svg>
                    )}
                  </div>
                  <div className="text-sm font-medium text-[#455A64] bg-[#ECEFF1] px-3 py-1 rounded-full">
                    {getTypeText(achievement.type)} - {achievement.date}
                  </div>
                </div>
              ))}
            </div>

            {achievements.length > 3 && (
              <div className="flex justify-center mt-4 gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevSlide}
                  className="text-[#455A64] hover:text-[#0288D1] hover:bg-[#E3F2FD] border-[#CFD8DC]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Trước</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextSlide}
                  className="text-[#455A64] hover:text-[#0288D1] hover:bg-[#E3F2FD] border-[#CFD8DC]"
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Sau</span>
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
