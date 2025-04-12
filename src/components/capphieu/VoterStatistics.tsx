import React from 'react';
import { BarChart3, Users, BadgeCheck, Ticket } from 'lucide-react';
import { CuTri } from './VoterContext';

interface VoterStatisticsProps {
  voters: CuTri[];
  totalVoters: number;
}

const VoterStatistics: React.FC<VoterStatisticsProps> = ({ voters, totalVoters }) => {
  // Tính toán các thống kê
  const verifiedVoters = voters.filter((v) => v.xacMinh).length;
  const votersWithBallot = voters.filter((v) => v.hasBlockchainWallet).length;

  // Tỷ lệ phần trăm
  const verificationRate = totalVoters ? Math.round((verifiedVoters / totalVoters) * 100) : 0;
  const ballotRate = totalVoters ? Math.round((votersWithBallot / totalVoters) * 100) : 0;

  return (
    <div className="rounded-lg p-4 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/10 dark:to-emerald-900/10 border border-teal-100 dark:border-teal-800/30 mb-4">
      <h3 className="text-sm font-medium text-teal-800 dark:text-teal-300 mb-3 flex items-center">
        <BarChart3 className="h-4 w-4 mr-2" />
        Thống kê cử tri
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
          <div className="flex justify-between items-center">
            <h4 className="text-sm text-gray-500 dark:text-gray-400">Tổng cử tri</h4>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold mt-1">{totalVoters}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
          <div className="flex justify-between items-center">
            <h4 className="text-sm text-gray-500 dark:text-gray-400">Đã xác minh</h4>
            <BadgeCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold mt-1">
            {verifiedVoters}
            <span className="text-sm ml-1 text-gray-500">({verificationRate}%)</span>
          </p>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-2">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${verificationRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
          <div className="flex justify-between items-center">
            <h4 className="text-sm text-gray-500 dark:text-gray-400">Đã cấp phiếu</h4>
            <Ticket className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-2xl font-bold mt-1">
            {votersWithBallot}
            <span className="text-sm ml-1 text-gray-500">({ballotRate}%)</span>
          </p>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-2">
            <div
              className="h-full bg-violet-500 rounded-full"
              style={{ width: `${ballotRate}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoterStatistics;
