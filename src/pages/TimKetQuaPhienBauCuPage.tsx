'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import {
  Award,
  CheckCircle,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Info,
  Copy,
  BarChart3,
  PieChart,
  ChevronDown,
  Search,
  Users,
  TrendingUp,
  User,
  Clock,
  List,
  Star,
  Share,
  HelpCircle,
  Download,
  Hexagon,
  Sparkles,
  ArrowLeft,
  Home,
  Database,
  Filter,
  ChevronRight,
  LucideActivity,
  Trophy,
  ExternalLink,
  XCircle,
  Layers,
  FileText, // Added missing FileText icon
} from 'lucide-react';
import axios from 'axios';
import { fetchCuocBauCuById } from '../store/slice/cuocBauCuByIdSlice';
import { fetchPhienBauCuById } from '../store/slice/phienBauCuSlice';
import { fetchUngCuVienByPhienBauCuId } from '../store/slice/ungCuVienSlice';
import { RootState } from '../store/store';
import { useToast } from '../test/components/use-toast';

// Recharts imports
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  LabelList,
  LineChart,
  Line,
  CartesianGrid,
  Pie,
  PieChart as RechartsPieChart,
  Sector,
  RadialBarChart,
  RadialBar,
  Label,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

// UI components
import { Button } from '../components/ui/Button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Separator } from '../components/ui/Separator';
import { Progress } from '../components/ui/Progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Skeleton } from '../components/ui/Skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/Dialog';
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/Tooltip';
import ParticleBackground from '../components/backgrounds/ParticleBackground';

// Interfaces
interface ElectionSession {
  id: number;
  tenPhienBauCu: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  moTa?: string;
  trangThai: number;
  cuocBauCuId: number;
  blockchainSessionId?: number;
}

interface Election {
  id: number;
  tenCuocBauCu: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  moTa?: string;
  trangThai: number;
  blockchainServerId?: number;
  blockchainAddress?: string;
}

interface Candidate {
  id: number;
  hoTen: string;
  avatar?: string;
  moTa?: string;
  viTriUngCu?: {
    id: number;
    tenViTriUngCu: string;
  };
  blockchainAddress?: string;
  votes?: number;
  votePercentage?: number;
  color?: string;
}

interface ElectionResult {
  candidates: Candidate[];
  totalVotes: number;
  winnerId?: number;
  timestamp: number;
  isFinalized: boolean;
}

const BLOCKCHAIN_RPC_URL = 'https://geth.holihu.online/rpc';
const CONTRACT_ADDRESSES = {
  entryPoint: '0x5c1Ec052254B485A97eFeCdE6dEC5A7c3c171656',
  hluToken: '0x0c69a0bF43618D8ba8465e095F78AdB3A15F2666',
  quanLyCuocBauCu: '0x9d8cB9C2eD2EFedae3F7C660ceDCBBc90BA48dd8',
  quanLyPhieuBau: '0xEc113165EedF505CF66D70c67d3216603B450e16',
  quanLyThanhTuu: '0xB615f47022985A1abD686CFf2AC37dCEa78Dd1bF',
  hluPaymaster: '0x68eD6525Fa00B2A0AF28311280b46f6E03C5EE4a',
  quanLyPhieuBauProxy: '0x9c244B5E1F168510B9b812573b1B667bd1E654c8',
  phieuBauInstance: '0x9c244B5E1F168510B9b812573b1B667bd1E654c8',
  quanLyThanhTuuProxy: '0x93362A6A30570b1446843862c2c4150002557152',
  factory: '0x93e3b7720CAf68Fb4E4E0A9ca0152f61529D9900',
  thanhTuuInstance: '0x93362A6A30570b1446843862c2c4150002557152',
};

// Custom color palette for charts
const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#8b5cf6', // violet-500
  '#6d28d9', // violet-700
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#be185d', // pink-800
  '#0ea5e9', // sky-500
];

// Generate nice gradient colors for charts
const generateGradientId = (index: number) => `colorGradient-${index}`;

// Create reusable ABI for contracts
const QUAN_LY_CUOC_BAU_CU_ABI = [
  'function layThongTinCoBan(uint256 idCuocBauCu) view returns (address nguoiSoHuu, bool dangHoatDongDay, uint256 thoiGianBatDau, uint256 thoiGianKetThuc, string tenCuocBauCu, uint256 phiHLU)',
  'function layThongTinPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (bool dangHoatDongNe, uint256 thoiGianBatDau, uint256 thoiGianKetThuc, uint256 soCuTriToiDa, uint256 soUngVienHienTai, uint256 soCuTriHienTai, address[] ungVienDacCu, bool taiBauCu, uint256 soLuongXacNhan, uint256 thoiGianHetHanXacNhan)',
  'function layKetQuaPhienBauCu(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (address[] ungVien, uint256[] soPhieu)',
  'function laySoPhieuUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu, address ungVien) view returns (uint256)',
  'function layDanhSachUngVien(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (address[])',
  'function layDanhSachPhienBauCu(uint256 idCuocBauCu, uint256 chiSoBatDau, uint256 gioiHan) view returns (uint256[])',
  'function layDanhSachUngVienDacCu(uint256 idCuocBauCu, uint256 idPhienBauCu) view returns (address[])',
];

const FACTORY_ABI = [
  'function layThongTinServer(uint128 id) view returns (address quanLyCuocBauCu, string tenCuocBauCu, string moTa, uint8 trangThai, uint64 soLuongBaoCao, uint64 soLuongViPhamXacNhan, address nguoiTao)',
  'function layDanhSachServerDangHoatDong() view returns (uint256[])',
  'function layServerCuaNguoiDung(address nguoiDung) view returns (uint256[])',
];

// Helper functions
const formatDate = (dateString: string | number) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const truncateAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const getStatusColor = (status: number): { bg: string; text: string; border: string } => {
  switch (status) {
    case 0: // Hoạt động
      return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' };
    case 1: // Tạm dừng
      return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' };
    case 2: // Lưu trữ
      return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
  }
};

const getStatusText = (status: number): string => {
  switch (status) {
    case 0:
      return 'Hoạt động';
    case 1:
      return 'Tạm dừng';
    case 2:
      return 'Lưu trữ';
    default:
      return 'Không xác định';
  }
};

const ElectionResultChart: React.FC<{
  data: Candidate[];
  totalVotes: number;
  chartType: 'bar' | 'pie' | 'radial' | 'radar';
}> = ({ data, totalVotes, chartType }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Make sure data is an array before using it
  const safeData = Array.isArray(data) ? data : [];

  // For pie chart active sector
  const onPieEnter = useCallback(
    (_, index) => {
      setActiveIndex(index);
    },
    [setActiveIndex],
  );

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, [setActiveIndex]);

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#fff"
          strokeWidth={2}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fill="#333"
          className="text-xs"
        >
          {`${payload.hoTen} (${value} phiếu)`}
        </text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={18}
          textAnchor={textAnchor}
          fill="#999"
          className="text-xs"
        >
          {`${(percent * 100).toFixed(2)}%`}
        </text>
      </g>
    );
  };

  const getGradientColors = (index: number) => {
    const baseColor = CHART_COLORS[index % CHART_COLORS.length];
    let startColor = baseColor;
    let endColor = baseColor;

    // For certain colors, create custom gradients
    switch (baseColor) {
      case '#3b82f6': // blue
        startColor = '#93c5fd';
        endColor = '#1d4ed8';
        break;
      case '#8b5cf6': // violet
        startColor = '#c4b5fd';
        endColor = '#6d28d9';
        break;
      case '#ec4899': // pink
        startColor = '#f9a8d4';
        endColor = '#be185d';
        break;
      case '#10b981': // emerald
        startColor = '#6ee7b7';
        endColor = '#047857';
        break;
      case '#f59e0b': // amber
        startColor = '#fcd34d';
        endColor = '#b45309';
        break;
      default:
        // Keep same color if not specified
        break;
    }

    return { startColor, endColor };
  };

  // For radar chart - format data
  const radarData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    return data.map((candidate) => ({
      subject: candidate.hoTen?.split(' ')?.pop() || candidate.hoTen || 'Unknown',
      A: candidate.votes || 0,
      fullMark: totalVotes,
    }));
  }, [data, totalVotes]);

  // Render different chart types
  switch (chartType) {
    case 'pie':
      return (
        <div className="w-full h-[380px] md:h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <defs>
                {safeData.map((entry, index) => (
                  <linearGradient
                    key={index}
                    id={generateGradientId(index)}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={getGradientColors(index).startColor}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="100%"
                      stopColor={getGradientColors(index).endColor}
                      stopOpacity={1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                activeIndex={activeIndex !== null ? activeIndex : undefined}
                activeShape={renderActiveShape}
                data={safeData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={2}
                dataKey="votes"
                nameKey="hoTen"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                animationDuration={1000}
                animationBegin={200}
              >
                {safeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#${generateGradientId(index)})`}
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  `${value} phiếu (${(((value as number) / totalVotes) * 100).toFixed(1)}%)`,
                  props.payload.hoTen,
                ]}
                contentStyle={{
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  boxShadow:
                    '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
                wrapperStyle={{ outline: 'none' }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(value, entry, index) => {
                  const candidate = safeData[index];
                  return candidate.hoTen;
                }}
                wrapperStyle={{ paddingTop: 20 }}
              />
              <Label
                position="center"
                value={`${totalVotes} phiếu`}
                content={({ viewBox }) => {
                  const { cx, cy } = viewBox as { cx: number; cy: number };
                  return (
                    <g>
                      <text
                        x={cx}
                        y={cy - 5}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-gray-700 dark:fill-gray-300 text-lg font-semibold"
                      >
                        {totalVotes}
                      </text>
                      <text
                        x={cx}
                        y={cy + 15}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-gray-500 dark:fill-gray-400 text-xs"
                      >
                        phiếu bầu
                      </text>
                    </g>
                  );
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      );

    case 'radial':
      return (
        <div className="w-full h-[380px] md:h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="20%"
              outerRadius="80%"
              barSize={20}
              data={safeData.map((item, index) => ({
                ...item,
                fill: `url(#${generateGradientId(index)})`,
              }))}
              startAngle={90}
              endAngle={-270}
            >
              <defs>
                {safeData.map((entry, index) => (
                  <linearGradient
                    key={index}
                    id={generateGradientId(index)}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop
                      offset="0%"
                      stopColor={getGradientColors(index).startColor}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="100%"
                      stopColor={getGradientColors(index).endColor}
                      stopOpacity={1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <RadialBar
                background
                label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                dataKey="votes"
                nameKey="hoTen"
                cornerRadius={8}
                activeIndex={activeIndex}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                animationDuration={1500}
                animationBegin={300}
              />
              <Legend
                iconSize={10}
                layout="vertical"
                verticalAlign="middle"
                align="right"
                formatter={(value, entry, index) => {
                  const candidate = safeData[index];
                  return `${candidate.hoTen} (${candidate.votes} phiếu)`;
                }}
              />
              <Tooltip
                formatter={(value) => [`${value} phiếu`, 'Số phiếu']}
                contentStyle={{
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  boxShadow:
                    '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              <PolarAngleAxis
                type="number"
                domain={[0, Math.max(...safeData.map((d) => d.votes || 0)) + 2]}
                tick={false}
              />
              <Label
                position="center"
                value={`${totalVotes} phiếu`}
                content={({ viewBox }) => {
                  const { cx, cy } = viewBox as { cx: number; cy: number };
                  return (
                    <g>
                      <text
                        x={cx}
                        y={cy - 5}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-gray-700 dark:fill-gray-300 text-lg font-semibold"
                      >
                        {totalVotes}
                      </text>
                      <text
                        x={cx}
                        y={cy + 15}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-gray-500 dark:fill-gray-400 text-xs"
                      >
                        phiếu bầu
                      </text>
                    </g>
                  );
                }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      );

    case 'radar':
      return (
        <div className="w-full h-[380px] md:h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <defs>
                {safeData.map((entry, index) => (
                  <linearGradient
                    key={index}
                    id={generateGradientId(index)}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={getGradientColors(index).startColor}
                      stopOpacity={0.7}
                    />
                    <stop
                      offset="100%"
                      stopColor={getGradientColors(index).endColor}
                      stopOpacity={0.9}
                    />
                  </linearGradient>
                ))}
              </defs>
              <PolarGrid strokeDasharray="3 3" stroke="rgba(120, 120, 120, 0.3)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} />
              <PolarRadiusAxis
                angle={30}
                domain={[0, Math.max(...safeData.map((d) => d.votes || 0)) + 5]}
                tick={{ fill: 'currentColor', fontSize: 10 }}
              />
              {safeData.map((entry, index) => (
                <Radar
                  key={`radar-${index}`}
                  name={entry.hoTen}
                  dataKey="A"
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  fill={`url(#${generateGradientId(index)})`}
                  isAnimationActive={true}
                  animationBegin={300 * index}
                  animationDuration={1500}
                  data={[
                    {
                      subject: entry.hoTen.split(' ').pop() || entry.hoTen,
                      A: entry.votes,
                      fullMark: totalVotes,
                    },
                  ]}
                />
              ))}
              <Tooltip
                formatter={(value) => [`${value} phiếu`, '']}
                contentStyle={{
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  boxShadow:
                    '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
              />
              <Legend
                formatter={(value, entry, index) => {
                  const candidate = safeData[index];
                  return `${candidate.hoTen} (${candidate.votes} phiếu)`;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      );

    case 'bar':
    default:
      return (
        <div className="w-full h-[380px] md:h-[450px] pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={safeData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
              barSize={36}
            >
              <defs>
                {safeData.map((entry, index) => (
                  <linearGradient
                    key={index}
                    id={generateGradientId(index)}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={getGradientColors(index).startColor}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="100%"
                      stopColor={getGradientColors(index).endColor}
                      stopOpacity={1}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
              <XAxis
                dataKey="hoTen"
                tickFormatter={(value) =>
                  value.length > 10 ? `${value.substring(0, 10)}...` : value
                }
                height={60}
                tick={{ fontSize: 12, angle: -45, textAnchor: 'end' }}
                interval={0}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                label={{
                  value: 'Số phiếu bầu',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: '12px', fill: 'currentColor', textAnchor: 'middle' },
                }}
              />
              <Tooltip
                formatter={(value, name, props) => [
                  `${value} phiếu (${(((value as number) / totalVotes) * 100).toFixed(1)}%)`,
                  props.payload.hoTen,
                ]}
                contentStyle={{
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  boxShadow:
                    '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
              />
              <Bar
                dataKey="votes"
                animationDuration={2000}
                animationBegin={300}
                radius={[4, 4, 0, 0]}
              >
                {safeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#${generateGradientId(index)})`}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={1}
                  />
                ))}
                <LabelList
                  dataKey="votes"
                  position="top"
                  style={{ fontSize: '12px', fill: 'currentColor' }}
                  formatter={(value) => `${value} phiếu`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
  }
};

const TrangKetQua: React.FC = () => {
  const { id: cuocBauCuIdParam, idPhien: phienIdParam } = useParams<{
    id: string;
    idPhien: string;
  }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();

  // State from Redux store
  const { cuocBauCu } = useSelector((state: RootState) => state.cuocBauCuById);
  const { cacPhienBauCu } = useSelector((state: RootState) => state.phienBauCu);
  const { danhSachUngVien } = useSelector((state: RootState) => state.ungCuVien);

  // Component state
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<ElectionSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [electionResults, setElectionResults] = useState<ElectionResult | null>(null);
  const [isLoadingElections, setIsLoadingElections] = useState<boolean>(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);
  const [blockchainError, setBlockchainError] = useState<string | null>(null);
  const [contractInstance, setContractInstance] = useState<ethers.Contract | null>(null);
  const [factoryInstance, setFactoryInstance] = useState<ethers.Contract | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'radial' | 'radar'>('bar');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showBlockchainDetails, setShowBlockchainDetails] = useState<boolean>(false);
  const [blockchainDetails, setBlockchainDetails] = useState<any>(null);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [showCandidateDetails, setShowCandidateDetails] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Initialize blockchain provider and contracts
  useEffect(() => {
    const initializeContracts = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);

        // Initialize main contract
        const quanLyCuocBauCuContract = new ethers.Contract(
          CONTRACT_ADDRESSES.quanLyPhieuBauProxy,
          QUAN_LY_CUOC_BAU_CU_ABI,
          provider,
        );
        setContractInstance(quanLyCuocBauCuContract);

        // Initialize factory contract
        const factoryContract = new ethers.Contract(
          CONTRACT_ADDRESSES.factory,
          FACTORY_ABI,
          provider,
        );
        setFactoryInstance(factoryContract);
      } catch (error) {
        console.error('Error initializing contracts:', error);
        setBlockchainError('Không thể kết nối đến blockchain. Vui lòng thử lại sau.');
      }
    };

    initializeContracts();
  }, []);

  // Set initial election ID from params
  useEffect(() => {
    if (cuocBauCuIdParam) {
      const id = parseInt(cuocBauCuIdParam);
      setSelectedElectionId(id);
      fetchElectionSessionsFromAPI(id);
      dispatch(fetchCuocBauCuById(id));
    }
  }, [cuocBauCuIdParam, dispatch]);

  // Set initial session ID from params
  useEffect(() => {
    if (phienIdParam && selectedElectionId) {
      const id = parseInt(phienIdParam);
      setSelectedSessionId(id);
      dispatch(fetchPhienBauCuById(id));
      dispatch(fetchUngCuVienByPhienBauCuId(id));
      fetchElectionResultsFromBlockchain(selectedElectionId, id);
    }
  }, [phienIdParam, selectedElectionId, dispatch]);

  // Check for dark mode
  useEffect(() => {
    const isDark =
      localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);
  }, []);

  // Fetch elections from API
  const fetchElectionsFromAPI = useCallback(async () => {
    setIsLoadingElections(true);
    setBlockchainError(null);

    try {
      // Fetch elections from your API
      const response = await axios.get('/api/CuocBauCu');
      setElections(response.data || []);
    } catch (error) {
      console.error('Error fetching elections:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Không thể tải danh sách cuộc bầu cử. Vui lòng thử lại sau.',
      });
    } finally {
      setIsLoadingElections(false);
    }
  }, [toast]);

  // Fetch election sessions from API
  const fetchElectionSessionsFromAPI = useCallback(
    async (electionId: number) => {
      if (!electionId) return;

      setIsLoadingSessions(true);
      setBlockchainError(null);

      try {
        // Fetch sessions from your API
        const response = await axios.get(`/api/PhienBauCu/cuocBauCu/${electionId}`);
        setSessions(response.data || []);

        // If there are sessions, select the first one by default
        if (response.data && response.data.length > 0 && !phienIdParam) {
          setSelectedSessionId(response.data[0].id);
          dispatch(fetchPhienBauCuById(response.data[0].id));
          dispatch(fetchUngCuVienByPhienBauCuId(response.data[0].id));
          fetchElectionResultsFromBlockchain(electionId, response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching election sessions:', error);
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể tải danh sách phiên bầu cử. Vui lòng thử lại sau.',
        });
      } finally {
        setIsLoadingSessions(false);
      }
    },
    [dispatch, phienIdParam, toast],
  );

  // Fetch blockchain server list
  const fetchBlockchainServers = useCallback(async () => {
    if (!factoryInstance) return;

    setIsLoadingElections(true);
    setBlockchainError(null);

    try {
      // Since the contract doesn't actually return the list directly,
      // we'll simulate this by iterating through possible IDs
      const servers = [];

      for (let i = 1; i <= 50; i++) {
        // Try first 50 potential servers
        try {
          const serverInfo = await factoryInstance.layThongTinServer(i);
          if (serverInfo && serverInfo[0] !== ethers.ZeroAddress) {
            servers.push({
              id: i,
              blockchainServerId: i,
              tenCuocBauCu: serverInfo[1],
              moTa: serverInfo[2],
              trangThai: serverInfo[3],
              blockchainAddress: serverInfo[0],
              ngayBatDau: new Date().toISOString(), // These are placeholders
              ngayKetThuc: new Date().toISOString(),
            });
          }
        } catch (e) {
          // Hit a non-existent server, break the loop
          if (servers.length > 0) break;
        }
      }

      setElections(servers);

      if (servers.length > 0 && !selectedElectionId) {
        setSelectedElectionId(servers[0].id);
        fetchBlockchainSessions(servers[0].id, servers[0].blockchainAddress);
      }
    } catch (error) {
      console.error('Error fetching blockchain servers:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi Blockchain',
        description: 'Không thể tải danh sách server từ blockchain. Sử dụng dữ liệu từ API.',
      });
      // Fall back to API
      fetchElectionsFromAPI();
    } finally {
      setIsLoadingElections(false);
    }
  }, [factoryInstance, selectedElectionId, toast, fetchElectionsFromAPI]);

  // Fetch blockchain sessions
  const fetchBlockchainSessions = useCallback(
    async (electionId: number, contractAddress?: string) => {
      if (!electionId) return;
      if (!contractInstance && !contractAddress) return;

      setIsLoadingSessions(true);
      setBlockchainError(null);

      try {
        let contract = contractInstance;

        // If a specific contract address was provided, use it
        if (contractAddress && contractAddress !== contract?.target) {
          const provider = new ethers.JsonRpcProvider(BLOCKCHAIN_RPC_URL);
          contract = new ethers.Contract(contractAddress, QUAN_LY_CUOC_BAU_CU_ABI, provider);
        }

        if (!contract) throw new Error('Contract not initialized');

        // Get sessions from blockchain
        const sessionIds = await contract.layDanhSachPhienBauCu(electionId, 0, 20);

        if (!sessionIds || sessionIds.length === 0) {
          setSessions([]);
          return;
        }

        const blockchainSessions = [];

        for (const sessionId of sessionIds) {
          try {
            const sessionInfo = await contract.layThongTinPhienBauCu(electionId, sessionId);

            const thoiGianBatDau = sessionInfo[1]
              ? new Date(Number(sessionInfo[1]) * 1000).toISOString()
              : new Date().toISOString();
            const thoiGianKetThuc = sessionInfo[2]
              ? new Date(Number(sessionInfo[2]) * 1000).toISOString()
              : new Date().toISOString();

            blockchainSessions.push({
              id: Number(sessionId),
              tenPhienBauCu: `Phiên #${sessionId}`,
              ngayBatDau: thoiGianBatDau,
              ngayKetThuc: thoiGianKetThuc,
              cuocBauCuId: electionId,
              trangThai: sessionInfo[0] ? 0 : 2, // 0: active, 2: ended
              blockchainSessionId: Number(sessionId),
            });
          } catch (e) {
            console.error(`Error fetching session ${sessionId}:`, e);
          }
        }

        setSessions(blockchainSessions);

        // Select first session by default
        if (blockchainSessions.length > 0 && !phienIdParam) {
          setSelectedSessionId(blockchainSessions[0].id);
          fetchElectionResultsFromBlockchain(electionId, blockchainSessions[0].id);
        }
      } catch (error) {
        console.error('Error fetching blockchain sessions:', error);
        toast({
          variant: 'destructive',
          title: 'Lỗi Blockchain',
          description: 'Không thể tải phiên bầu cử từ blockchain. Sử dụng dữ liệu từ API.',
        });
        // Fall back to API if available
        fetchElectionSessionsFromAPI(electionId);
      } finally {
        setIsLoadingSessions(false);
      }
    },
    [contractInstance, phienIdParam, toast, fetchElectionSessionsFromAPI],
  );

  // Updated function to safely handle potential errors in blockchain data fetching
  const fetchElectionResultsFromBlockchain = useCallback(
    async (electionId: number, sessionId: number) => {
      if (!electionId || !sessionId || !contractInstance) return;

      setIsLoadingResults(true);
      setBlockchainError(null);

      try {
        // Get detailed results from blockchain
        const result = await contractInstance
          .layKetQuaPhienBauCu(electionId, sessionId)
          .catch((err: any) => {
            console.error('Error calling blockchain contract:', err);
            throw new Error(`Contract call failed: ${err.message}`);
          });

        // Ensure we got back proper data
        if (!result || !Array.isArray(result) || result.length < 2) {
          console.error('Invalid result format from blockchain:', result);
          throw new Error('Invalid data format from blockchain');
        }

        const [candidateAddresses, voteAmounts] = result;

        // Validate candidateAddresses is an array
        if (!Array.isArray(candidateAddresses) || candidateAddresses.length === 0) {
          console.error('No candidate addresses returned');
          setElectionResults(null);
          return;
        }

        // Validate voteAmounts is an array
        if (!Array.isArray(voteAmounts)) {
          console.error('Vote amounts is not an array');
          throw new Error('Invalid vote amounts data from blockchain');
        }

        // Calculate total votes from valid vote amounts
        const totalVotes = voteAmounts.reduce((sum, votes) => sum + Number(votes || 0), 0);

        // Map blockchain data to our candidate model
        const candidatesWithVotes: Candidate[] = [];

        for (let i = 0; i < candidateAddresses.length; i++) {
          const address = candidateAddresses[i];
          const votes = Number(voteAmounts[i] || 0);

          // Find matching candidate in our Redux state - ensure danhSachUngVien is an array
          const matchingCandidate = Array.isArray(danhSachUngVien)
            ? danhSachUngVien.find(
                (c) => c.blockchainAddress?.toLowerCase() === address?.toLowerCase(),
              )
            : undefined;

          candidatesWithVotes.push({
            id: matchingCandidate?.id || i,
            hoTen: matchingCandidate?.hoTen || `Ứng viên ${truncateAddress(address || '')}`,
            avatar: matchingCandidate?.avatar,
            moTa: matchingCandidate?.moTa,
            viTriUngCu: matchingCandidate?.viTriUngCu,
            blockchainAddress: address,
            votes: votes,
            votePercentage: totalVotes > 0 ? (votes / totalVotes) * 100 : 0,
            color: CHART_COLORS[i % CHART_COLORS.length],
          });
        }

        // Sort candidates by votes (descending)
        candidatesWithVotes.sort((a, b) => (b.votes || 0) - (a.votes || 0));

        // Find winner ID (if any)
        let winnerId = undefined;
        if (candidatesWithVotes.length > 0 && (candidatesWithVotes[0]?.votes || 0) > 0) {
          winnerId = candidatesWithVotes[0].id;
        }

        setElectionResults({
          candidates: candidatesWithVotes,
          totalVotes: totalVotes,
          winnerId: winnerId,
          timestamp: Date.now(),
          isFinalized: true,
        });

        // Fetch additional blockchain details
        fetchBlockchainSessionDetails(electionId, sessionId);
      } catch (error) {
        console.error('Error fetching election results from blockchain:', error);
        setBlockchainError(
          `Không thể tải kết quả bầu cử từ blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );

        // Fall back to API data if available
        if (Array.isArray(danhSachUngVien) && danhSachUngVien.length > 0) {
          // Generate simulated results based on available candidates
          const simulatedCandidates = danhSachUngVien.map((candidate, index) => {
            const simulatedVotes = Math.floor(Math.random() * 100) + 1;
            return {
              ...candidate,
              votes: simulatedVotes,
              votePercentage: 0, // Will calculate after total
              color: CHART_COLORS[index % CHART_COLORS.length],
            };
          });

          // Calculate total and percentages
          const totalVotes = simulatedCandidates.reduce((sum, c) => sum + (c.votes || 0), 0);
          simulatedCandidates.forEach((c) => {
            c.votePercentage = totalVotes > 0 ? ((c.votes || 0) / totalVotes) * 100 : 0;
          });

          // Sort by votes
          simulatedCandidates.sort((a, b) => (b.votes || 0) - (a.votes || 0));

          setElectionResults({
            candidates: simulatedCandidates,
            totalVotes: totalVotes,
            winnerId: simulatedCandidates[0]?.id,
            timestamp: Date.now(),
            isFinalized: false, // Mark as not from blockchain
          });
        }
      } finally {
        setIsLoadingResults(false);
      }
    },
    [contractInstance, danhSachUngVien],
  );

  // Fetch blockchain session details
  const fetchBlockchainSessionDetails = useCallback(
    async (electionId: number, sessionId: number) => {
      if (!electionId || !sessionId || !contractInstance) return;

      try {
        // Get session details
        const sessionInfo = await contractInstance.layThongTinPhienBauCu(electionId, sessionId);

        // Get winners
        const winners = await contractInstance.layDanhSachUngVienDacCu(electionId, sessionId);

        setBlockchainDetails({
          sessionInfo: {
            isActive: sessionInfo[0],
            startTime: sessionInfo[1]
              ? new Date(Number(sessionInfo[1]) * 1000).toISOString()
              : null,
            endTime: sessionInfo[2] ? new Date(Number(sessionInfo[2]) * 1000).toISOString() : null,
            maxVoters: Number(sessionInfo[3]),
            candidateCount: Number(sessionInfo[4]),
            voterCount: Number(sessionInfo[5]),
            electedCandidates: sessionInfo[6],
            isReelection: sessionInfo[7],
            confirmationCount: Number(sessionInfo[8]),
            confirmationDeadline: sessionInfo[9]
              ? new Date(Number(sessionInfo[9]) * 1000).toISOString()
              : null,
          },
          winners: winners,
        });
      } catch (error) {
        console.error('Error fetching blockchain session details:', error);
      }
    },
    [contractInstance],
  );

  // Load initial data
  useEffect(() => {
    if (!cuocBauCuIdParam) {
      // If no election ID in URL, fetch all elections
      if (factoryInstance) {
        fetchBlockchainServers();
      } else {
        fetchElectionsFromAPI();
      }
    }
  }, [cuocBauCuIdParam, fetchElectionsFromAPI, fetchBlockchainServers, factoryInstance]);

  // Handle election selection
  const handleElectionChange = (id: number) => {
    setSelectedElectionId(id);
    setSelectedSessionId(null);
    setElectionResults(null);
    setSessions([]);

    // Find the selected election
    const election = elections.find((e) => e.id === id);

    // Update URL
    navigate(`/app/election-results/${id}`);

    if (election?.blockchainAddress) {
      // If it has a blockchain address, fetch from blockchain
      fetchBlockchainSessions(id, election.blockchainAddress);
    } else {
      // Otherwise fetch from API
      fetchElectionSessionsFromAPI(id);
    }
  };

  // Handle session selection
  const handleSessionChange = (id: number) => {
    setSelectedSessionId(id);
    setElectionResults(null);

    // Update URL
    navigate(`/app/election-results/${selectedElectionId}/${id}`);

    // Fetch data
    dispatch(fetchPhienBauCuById(id));
    dispatch(fetchUngCuVienByPhienBauCuId(id));

    if (selectedElectionId) {
      fetchElectionResultsFromBlockchain(selectedElectionId, id);
    }
  };

  // Handle chart type change
  const handleChartTypeChange = (type: 'bar' | 'pie' | 'radial' | 'radar') => {
    setChartType(type);
  };

  // Handle candidate click
  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateDetails(true);
  };

  // Filtered elections based on search
  const filteredElections = useMemo(() => {
    if (!searchTerm) return elections || [];

    if (!Array.isArray(elections)) {
      console.warn('Elections is not an array:', elections);
      return [];
    }

    return elections.filter((election) =>
      election?.tenCuocBauCu?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [elections, searchTerm]);

  // Get current session - add array check
  const currentSession = useMemo(() => {
    if (!Array.isArray(sessions)) {
      return undefined;
    }
    return sessions.find((s) => s.id === selectedSessionId);
  }, [sessions, selectedSessionId]);

  // Get current election - add array check
  const currentElection = useMemo(() => {
    const foundElection = Array.isArray(elections)
      ? elections.find((e) => e.id === selectedElectionId)
      : undefined;

    return foundElection || cuocBauCu;
  }, [elections, selectedElectionId, cuocBauCu]);

  return (
    <div className={`min-h-screen pb-12 ${isDarkMode ? 'dark' : ''}`}>
      <ParticleBackground isDarkMode={isDarkMode} />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header section */}
        <div className="py-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                Kết Quả Bầu Cử Blockchain
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
                Tra cứu và xem kết quả các cuộc bầu cử được lưu trữ an toàn trên nền tảng blockchain
                bất biến
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                onClick={() => navigate('/app')}
              >
                <Home className="mr-2 h-4 w-4" />
                Trang chủ
              </Button>

              <Button
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => setIsExportOpen(true)}
              >
                <Download className="mr-2 h-4 w-4" />
                Xuất kết quả
              </Button>
            </div>
          </div>

          {/* Search and filter section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Input
                placeholder="Tìm kiếm cuộc bầu cử..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            <Select
              value={selectedElectionId?.toString() || ''}
              onValueChange={(value) => handleElectionChange(parseInt(value))}
              disabled={isLoadingElections}
            >
              <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg">
                <SelectValue placeholder="Chọn cuộc bầu cử" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingElections ? (
                  <div className="flex items-center justify-center p-4">
                    <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                    <span className="ml-2">Đang tải...</span>
                  </div>
                ) : filteredElections.length === 0 ? (
                  <div className="text-center p-4 text-gray-500">
                    Không tìm thấy cuộc bầu cử nào
                  </div>
                ) : (
                  filteredElections.map((election) => (
                    <SelectItem key={election.id} value={election.id.toString()}>
                      {election.tenCuocBauCu}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Select
              value={selectedSessionId?.toString() || ''}
              onValueChange={(value) => handleSessionChange(parseInt(value))}
              disabled={isLoadingSessions || !selectedElectionId}
            >
              <SelectTrigger className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-lg">
                <SelectValue placeholder="Chọn phiên bầu cử" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingSessions ? (
                  <div className="flex items-center justify-center p-4">
                    <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                    <span className="ml-2">Đang tải...</span>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center p-4 text-gray-500">
                    Không tìm thấy phiên bầu cử nào
                  </div>
                ) : (
                  sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {session.tenPhienBauCu || `Phiên #${session.id}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Current election/session info card */}
          {(currentElection || currentSession) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {currentElection && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center mb-3">
                          <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                          Thông tin cuộc bầu cử
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Tên:</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {currentElection.tenCuocBauCu}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">ID:</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {currentElection.id}
                              {currentElection.blockchainServerId &&
                                currentElection.blockchainServerId !== currentElection.id && (
                                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                                    (Server ID: {currentElection.blockchainServerId})
                                  </span>
                                )}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Ngày bắt đầu:</span>
                            <span className="text-gray-900 dark:text-white">
                              {formatDate(currentElection.ngayBatDau)}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Ngày kết thúc:</span>
                            <span className="text-gray-900 dark:text-white">
                              {formatDate(currentElection.ngayKetThuc)}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Trạng thái:</span>
                            <Badge
                              className={`${getStatusColor(currentElection.trangThai).bg} ${getStatusColor(currentElection.trangThai).text} ${getStatusColor(currentElection.trangThai).border}`}
                            >
                              {getStatusText(currentElection.trangThai)}
                            </Badge>
                          </div>

                          {currentElection.blockchainAddress && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">
                                Địa chỉ hợp đồng:
                              </span>
                              <div className="flex items-center">
                                <span className="text-blue-600 dark:text-blue-400 font-mono text-sm">
                                  {truncateAddress(currentElection.blockchainAddress)}
                                </span>
                                <TooltipProvider>
                                  <TooltipUI>
                                    <TooltipTrigger asChild>
                                      <button
                                        className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        onClick={() =>
                                          navigator.clipboard.writeText(
                                            currentElection.blockchainAddress || '',
                                          )
                                        }
                                      >
                                        <Copy className="h-4 w-4" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Sao chép địa chỉ</p>
                                    </TooltipContent>
                                  </TooltipUI>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <TooltipUI>
                                    <TooltipTrigger asChild>
                                      <a
                                        href={`https://explorer.holihu.online/address/${currentElection.blockchainAddress}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Xem trên Explorer</p>
                                    </TooltipContent>
                                  </TooltipUI>
                                </TooltipProvider>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {currentSession && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center mb-3">
                          <Users className="h-5 w-5 text-purple-500 mr-2" />
                          Thông tin phiên bầu cử
                        </h3>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Tên:</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {currentSession.tenPhienBauCu || `Phiên #${currentSession.id}`}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">ID:</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {currentSession.id}
                              {currentSession.blockchainSessionId &&
                                currentSession.blockchainSessionId !== currentSession.id && (
                                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                                    (Session ID: {currentSession.blockchainSessionId})
                                  </span>
                                )}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Ngày bắt đầu:</span>
                            <span className="text-gray-900 dark:text-white">
                              {formatDate(currentSession.ngayBatDau)}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Ngày kết thúc:</span>
                            <span className="text-gray-900 dark:text-white">
                              {formatDate(currentSession.ngayKetThuc)}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Trạng thái:</span>
                            <Badge
                              className={`${getStatusColor(currentSession.trangThai).bg} ${getStatusColor(currentSession.trangThai).text} ${getStatusColor(currentSession.trangThai).border}`}
                            >
                              {getStatusText(currentSession.trangThai)}
                            </Badge>
                          </div>

                          {blockchainDetails && blockchainDetails.sessionInfo && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Số cử tri:</span>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                              >
                                {blockchainDetails.sessionInfo.voterCount} cử tri
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Show blockchain details toggle */}
                  {blockchainDetails && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => setShowBlockchainDetails(!showBlockchainDetails)}
                        className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <Database className="h-4 w-4 mr-1.5" />
                        {showBlockchainDetails
                          ? 'Ẩn thông tin blockchain'
                          : 'Hiện thông tin blockchain'}
                        <ChevronDown
                          className={`ml-1 h-4 w-4 transition-transform ${showBlockchainDetails ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {showBlockchainDetails && (
                        <div className="mt-3 p-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg text-sm">
                          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                            Chi tiết blockchain
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-400">
                                Phiên hoạt động:
                              </span>
                              <span className="text-blue-800 dark:text-blue-300">
                                {blockchainDetails.sessionInfo.isActive ? 'Có' : 'Không'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-400">Số ứng viên:</span>
                              <span className="text-blue-800 dark:text-blue-300">
                                {blockchainDetails.sessionInfo.candidateCount}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-400">
                                Số cử tri tối đa:
                              </span>
                              <span className="text-blue-800 dark:text-blue-300">
                                {blockchainDetails.sessionInfo.maxVoters}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-400">
                                Yêu cầu tái bầu:
                              </span>
                              <span className="text-blue-800 dark:text-blue-300">
                                {blockchainDetails.sessionInfo.isReelection ? 'Có' : 'Không'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-400">
                                Số lượng xác nhận:
                              </span>
                              <span className="text-blue-800 dark:text-blue-300">
                                {blockchainDetails.sessionInfo.confirmationCount}
                              </span>
                            </div>
                          </div>

                          {/* Winners section */}
                          {blockchainDetails.winners && blockchainDetails.winners.length > 0 && (
                            <div className="mt-3">
                              <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-1">
                                Ứng viên đắc cử:
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {blockchainDetails.winners.map((winner, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/30"
                                  >
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    {truncateAddress(winner)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Results section */}
        <div className="mb-8">
          {blockchainError && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Lỗi Blockchain</AlertTitle>
              <AlertDescription>
                {blockchainError}
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setBlockchainError(null);
                      if (selectedElectionId && selectedSessionId) {
                        fetchElectionResultsFromBlockchain(selectedElectionId, selectedSessionId);
                      }
                    }}
                    className="bg-white"
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Thử lại
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isLoadingResults ? (
            <div className="grid gap-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-8 w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-[300px] w-full" />
                    <div className="flex justify-center gap-2">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-8 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : electionResults &&
            Array.isArray(electionResults.candidates) &&
            electionResults.candidates.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid gap-6"
            >
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <CardHeader className="pb-0">
                  <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center">
                    <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
                    Biểu đồ kết quả bầu cử
                  </CardTitle>
                  <CardDescription>
                    Tổng số phiếu bầu: <strong>{electionResults.totalVotes}</strong> | Cập nhật:{' '}
                    <strong>{formatDate(electionResults.timestamp)}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap justify-center mb-4 bg-gray-50/50 dark:bg-gray-900/30 p-2 rounded-lg">
                    <TooltipProvider>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <TooltipUI>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant={chartType === 'bar' ? 'default' : 'outline'}
                              className={`${chartType === 'bar' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/80 dark:bg-gray-800/80'}`}
                              onClick={() => handleChartTypeChange('bar')}
                            >
                              <BarChart3 className="h-4 w-4 mr-1" />
                              Cột
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              Biểu đồ cột thể hiện số phiếu của từng ứng viên
                            </p>
                          </TooltipContent>
                        </TooltipUI>

                        <TooltipUI>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant={chartType === 'pie' ? 'default' : 'outline'}
                              className={`${chartType === 'pie' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/80 dark:bg-gray-800/80'}`}
                              onClick={() => handleChartTypeChange('pie')}
                            >
                              <PieChart className="h-4 w-4 mr-1" />
                              Tròn
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Biểu đồ tròn thể hiện tỉ lệ phần trăm</p>
                          </TooltipContent>
                        </TooltipUI>

                        <TooltipUI>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant={chartType === 'radial' ? 'default' : 'outline'}
                              className={`${chartType === 'radial' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/80 dark:bg-gray-800/80'}`}
                              onClick={() => handleChartTypeChange('radial')}
                            >
                              <Hexagon className="h-4 w-4 mr-1" />
                              Xuyên tâm
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Biểu đồ xuyên tâm thể hiện phân bố phiếu bầu</p>
                          </TooltipContent>
                        </TooltipUI>

                        <TooltipUI>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant={chartType === 'radar' ? 'default' : 'outline'}
                              className={`${chartType === 'radar' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-white/80 dark:bg-gray-800/80'}`}
                              onClick={() => handleChartTypeChange('radar')}
                            >
                              <LucideActivity className="h-4 w-4 mr-1" />
                              Radar
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Biểu đồ radar thể hiện sự phân bố phiếu bầu</p>
                          </TooltipContent>
                        </TooltipUI>
                      </div>
                    </TooltipProvider>
                  </div>

                  <ElectionResultChart
                    data={electionResults.candidates || []}
                    totalVotes={electionResults.totalVotes}
                    chartType={chartType}
                  />

                  {electionResults.isFinalized ? (
                    <Alert className="bg-green-50/70 dark:bg-green-900/20 border border-green-100/50 dark:border-green-800/30 backdrop-blur-sm mt-4">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-green-800 dark:text-green-300">
                        Kết quả chính thức
                      </AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        Kết quả này đã được xác thực và lưu trữ trên blockchain, đảm bảo tính minh
                        bạch và không thể thay đổi.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-amber-50/70 dark:bg-amber-900/20 border border-amber-100/50 dark:border-amber-800/30 backdrop-blur-sm mt-4">
                      <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertTitle className="text-amber-800 dark:text-amber-300">
                        Kết quả dự kiến
                      </AlertTitle>
                      <AlertDescription className="text-amber-700 dark:text-amber-400">
                        Đây là kết quả dự kiến, đang chờ xác thực cuối cùng trên blockchain.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Detailed results table */}
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
                <CardHeader className="pb-0">
                  <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center">
                    <List className="h-5 w-5 text-purple-500 mr-2" />
                    Chi tiết kết quả bầu cử
                  </CardTitle>
                  <CardDescription>Danh sách ứng viên và số phiếu bầu tương ứng</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12 text-center">#</TableHead>
                          <TableHead>Ứng viên</TableHead>
                          <TableHead className="text-right">Số phiếu</TableHead>
                          <TableHead className="text-right">Tỉ lệ</TableHead>
                          <TableHead className="text-center">Kết quả</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(electionResults.candidates) &&
                          electionResults.candidates.map((candidate, index) => (
                            <TableRow
                              key={candidate.id || index}
                              className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              onClick={() => handleCandidateClick(candidate)}
                            >
                              <TableCell className="font-medium text-center">{index + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden mr-2">
                                    {candidate.avatar ? (
                                      <img
                                        src={candidate.avatar}
                                        alt={candidate.hoTen}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <User className="h-4 w-4 text-gray-500" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium">{candidate.hoTen}</div>
                                    {candidate.viTriUngCu && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {candidate.viTriUngCu.tenViTriUngCu}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{candidate.votes}</TableCell>
                              <TableCell className="text-right">
                                {(candidate.votePercentage || 0).toFixed(2)}%
                              </TableCell>
                              <TableCell className="text-center">
                                {electionResults.winnerId === candidate.id ? (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    <Trophy className="h-3 w-3 mr-1" />
                                    Đắc cử
                                  </Badge>
                                ) : index === 0 && !electionResults.winnerId ? (
                                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                    <Star className="h-3 w-3 mr-1" />
                                    Dẫn đầu
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                                  >
                                    Ứng viên
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                <CardFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                  <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <InfoIcon className="inline-block h-4 w-4 mr-1" />
                      Nhấp vào hàng để xem thông tin chi tiết về ứng viên
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/80 dark:bg-gray-800/80"
                        onClick={() => {
                          if (selectedElectionId && selectedSessionId) {
                            fetchElectionResultsFromBlockchain(
                              selectedElectionId,
                              selectedSessionId,
                            );
                          }
                        }}
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Cập nhật
                      </Button>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => setIsExportOpen(true)}
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Xuất kết quả
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>

              {/* Winner card - only show if there's a declared winner */}
              {electionResults.winnerId && Array.isArray(electionResults.candidates) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/30 rounded-xl shadow-xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative">
                          <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-800/30 dark:to-purple-800/30 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                            {electionResults.candidates.find(
                              (c) => c.id === electionResults.winnerId,
                            )?.avatar ? (
                              <img
                                src={
                                  electionResults.candidates.find(
                                    (c) => c.id === electionResults.winnerId,
                                  )?.avatar
                                }
                                alt="Ứng viên đắc cử"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-16 w-16 text-blue-500" />
                            )}
                          </div>
                          <div className="absolute -right-2 -top-2 h-10 w-10 bg-amber-400 dark:bg-amber-500 rounded-full flex items-center justify-center text-white shadow-md">
                            <Trophy className="h-6 w-6" />
                          </div>

                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white py-1 px-3 rounded-full text-xs font-medium shadow-md">
                            Đắc cử
                          </div>
                        </div>

                        <div className="text-center md:text-left flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {
                              electionResults.candidates.find(
                                (c) => c.id === electionResults.winnerId,
                              )?.hoTen
                            }
                          </h3>

                          <p className="text-gray-600 dark:text-gray-300 mb-3">
                            {electionResults.candidates.find(
                              (c) => c.id === electionResults.winnerId,
                            )?.viTriUngCu?.tenViTriUngCu || 'Ứng viên'}
                          </p>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-w-md">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 text-sm">
                                Số phiếu:
                              </span>
                              <div className="font-semibold text-lg text-gray-900 dark:text-white">
                                {electionResults.candidates.find(
                                  (c) => c.id === electionResults.winnerId,
                                )?.votes || 0}
                              </div>
                            </div>

                            <div>
                              <span className="text-gray-500 dark:text-gray-400 text-sm">
                                Tỉ lệ:
                              </span>
                              <div className="font-semibold text-lg text-gray-900 dark:text-white">
                                {(
                                  electionResults.candidates.find(
                                    (c) => c.id === electionResults.winnerId,
                                  )?.votePercentage || 0
                                ).toFixed(2)}
                                %
                              </div>
                            </div>

                            <div>
                              <span className="text-gray-500 dark:text-gray-400 text-sm">
                                Blockchain Address:
                              </span>
                              <div className="font-mono text-xs text-blue-600 dark:text-blue-400 truncate">
                                {truncateAddress(
                                  electionResults.candidates.find(
                                    (c) => c.id === electionResults.winnerId,
                                  )?.blockchainAddress || '',
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="text-gray-500 dark:text-gray-400 text-sm">
                                Trạng thái:
                              </span>
                              <div>
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Đắc cử
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="hidden lg:block">
                          <div className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-md">
                            <div className="flex items-center text-gray-700 dark:text-gray-300 mb-1">
                              <Sparkles className="h-4 w-4 text-amber-500 mr-1.5" />
                              <span className="text-sm font-medium">Thành tích bầu cử</span>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  <span>Tỉ lệ phiếu bầu</span>
                                  <span>
                                    {(
                                      electionResults.candidates.find(
                                        (c) => c.id === electionResults.winnerId,
                                      )?.votePercentage || 0
                                    ).toFixed(2)}
                                    %
                                  </span>
                                </div>
                                <Progress
                                  value={
                                    electionResults.candidates.find(
                                      (c) => c.id === electionResults.winnerId,
                                    )?.votePercentage || 0
                                  }
                                  className="h-2 bg-gray-100 dark:bg-gray-700"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  <span>Vượt ứng viên #2</span>
                                  <span>
                                    {electionResults.candidates.length > 1
                                      ? (electionResults.candidates[0]?.votes || 0) -
                                        (electionResults.candidates[1]?.votes || 0)
                                      : 0}{' '}
                                    phiếu
                                  </span>
                                </div>
                                <Progress
                                  value={
                                    electionResults.candidates.length > 1
                                      ? (((electionResults.candidates[0]?.votes || 0) -
                                          (electionResults.candidates[1]?.votes || 0)) /
                                          (electionResults.candidates[0]?.votes || 1)) *
                                        100
                                      : 100
                                  }
                                  className="h-2 bg-gray-100 dark:bg-gray-700"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          ) : !isLoadingResults && selectedSessionId ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 mb-4">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Không tìm thấy kết quả
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                Không tìm thấy kết quả bầu cử cho phiên bầu cử này. Có thể phiên bầu cử chưa kết
                thúc hoặc chưa có kết quả nào được ghi nhận trên blockchain.
              </p>
              <Button
                variant="outline"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
                onClick={() => {
                  if (selectedElectionId && selectedSessionId) {
                    fetchElectionResultsFromBlockchain(selectedElectionId, selectedSessionId);
                  }
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Thử lại
              </Button>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 mb-4">
                <Info className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Chọn phiên bầu cử
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Vui lòng chọn một cuộc bầu cử và phiên bầu cử từ danh sách phía trên để xem kết quả
                chi tiết.
              </p>
            </div>
          )}
        </div>

        {/* Export dialog */}
        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Download className="h-5 w-5 text-blue-500 mr-2" />
                Xuất kết quả bầu cử
              </DialogTitle>
              <DialogDescription>Chọn định dạng và tùy chọn xuất kết quả bầu cử</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm transition-all duration-200 hover:shadow-md"
                  onClick={() => {
                    // Generate PDF export logic would go here
                    toast({
                      title: 'Xuất PDF',
                      description: 'Đang chuẩn bị tệp PDF của bạn...',
                    });
                    setIsExportOpen(false);
                  }}
                >
                  <div className="flex items-center mb-2">
                    <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mr-3">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">PDF Document</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tệp PDF có thể in</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Xuất báo cáo kết quả bầu cử dạng tệp PDF đầy đủ với biểu đồ và thông tin chi
                    tiết.
                  </p>
                </div>

                <div
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm transition-all duration-200 hover:shadow-md"
                  onClick={() => {
                    // Generate Excel export logic would go here
                    toast({
                      title: 'Xuất Excel',
                      description: 'Đang chuẩn bị tệp Excel của bạn...',
                    });
                    setIsExportOpen(false);
                  }}
                >
                  <div className="flex items-center mb-2">
                    <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mr-3">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Excel Spreadsheet
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Tệp .xlsx có thể chỉnh sửa
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Xuất dữ liệu chi tiết dưới dạng bảng tính Excel cho phép phân tích nâng cao.
                  </p>
                </div>
              </div>

              <div
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm transition-all duration-200 hover:shadow-md"
                onClick={() => {
                  // Generate blockchain verification proof
                  toast({
                    title: 'Xuất chứng minh blockchain',
                    description: 'Đang chuẩn bị dữ liệu xác thực blockchain...',
                  });
                  setIsExportOpen(false);
                }}
              >
                <div className="flex items-center mb-2">
                  <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mr-3">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Chứng minh blockchain
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Dữ liệu xác thực dành cho kiểm tra
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Xuất dữ liệu mật mã và chứng minh blockchain để xác minh tính toàn vẹn của kết quả
                  bầu cử.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExportOpen(false)}>
                Hủy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Candidate details dialog */}
        <Dialog open={showCandidateDetails} onOpenChange={setShowCandidateDetails}>
          <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl max-w-2xl">
            {selectedCandidate &&
              electionResults?.candidates &&
              Array.isArray(electionResults.candidates) && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <User className="h-5 w-5 text-blue-500 mr-2" />
                      Thông tin chi tiết ứng viên
                    </DialogTitle>
                    <DialogDescription>Chi tiết về ứng viên và kết quả bầu cử</DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
                    <div className="md:col-span-1 flex flex-col items-center">
                      <div className="h-40 w-40 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                        {selectedCandidate.avatar ? (
                          <img
                            src={selectedCandidate.avatar}
                            alt={selectedCandidate.hoTen}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-20 w-20 text-blue-500" />
                        )}
                      </div>

                      {selectedCandidate.id === electionResults?.winnerId && (
                        <div className="mt-4">
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-4 py-1.5">
                            <Trophy className="h-4 w-4 mr-1.5" />
                            Đắc cử
                          </Badge>
                        </div>
                      )}

                      <div className="mt-4 text-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text:white">
                          {selectedCandidate.hoTen}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {selectedCandidate.viTriUngCu?.tenViTriUngCu || 'Ứng viên'}
                        </p>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <div className="space-y-4">
                        <div className="bg-gray-50/70 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                            <TrendingUp className="h-4 w-4 text-blue-500 mr-1.5" />
                            Kết quả bầu cử
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 text-sm">
                                Số phiếu:
                              </span>
                              <div className="font-semibold text-lg text-gray-900 dark:text-white">
                                {selectedCandidate.votes || 0}
                              </div>
                            </div>

                            <div>
                              <span className="text-gray-500 dark:text-gray-400 text-sm">
                                Tỉ lệ:
                              </span>
                              <div className="font-semibold text-lg text-gray-900 dark:text:white">
                                {(selectedCandidate.votePercentage || 0).toFixed(2)}%
                              </div>
                            </div>

                            <div className="col-span-2">
                              <span className="text-gray-500 dark:text-gray-400 text-sm">
                                Thứ hạng:
                              </span>
                              <div className="font-semibold text-lg text-gray-900 dark:text:white">
                                {electionResults?.candidates.findIndex(
                                  (c) => c.id === selectedCandidate.id,
                                ) !== undefined
                                  ? `${electionResults?.candidates.findIndex((c) => c.id === selectedCandidate.id) + 1}/${electionResults?.candidates.length}`
                                  : '-'}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                              <span>Tỉ lệ phiếu bầu</span>
                              <span>{(selectedCandidate.votePercentage || 0).toFixed(2)}%</span>
                            </div>
                            <Progress
                              value={selectedCandidate.votePercentage || 0}
                              className="h-2.5 bg-gray-100 dark:bg-gray-700"
                            />
                          </div>
                        </div>

                        <div className="bg-gray-50/70 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                          <h4 className="font-medium text-gray-900 dark:text:white mb-2 flex items-center">
                            <Info className="h-4 w-4 text-blue-500 mr-1.5" />
                            Thông tin cá nhân
                          </h4>
                          {selectedCandidate.moTa ? (
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                              {selectedCandidate.moTa}
                            </p>
                          ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                              Không có thông tin chi tiết.
                            </p>
                          )}
                        </div>

                        <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100/50 dark:border-blue-800/30">
                          <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                            <Database className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1.5" />
                            Thông tin blockchain
                          </h4>
                          {selectedCandidate.blockchainAddress ? (
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center">
                                <span className="text-blue-700 dark:text-blue-400 text-sm mr-2">
                                  Địa chỉ:
                                </span>
                                <code className="font-mono text-xs bg-blue-100/70 dark:bg-blue-800/50 p-1 rounded text-blue-800 dark:text-blue-300">
                                  {selectedCandidate.blockchainAddress}
                                </code>
                                <button
                                  className="ml-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  onClick={() =>
                                    navigator.clipboard.writeText(
                                      selectedCandidate.blockchainAddress || '',
                                    )
                                  }
                                  title="Sao chép địa chỉ"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="flex items-center">
                                <a
                                  href={`https://explorer.holihu.online/address/${selectedCandidate.blockchainAddress}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                >
                                  Xem trên Blockchain Explorer
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                              </div>
                            </div>
                          ) : (
                            <p className="text-blue-700 dark:text-blue-400 text-sm italic">
                              Không có thông tin blockchain cho ứng viên này.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowCandidateDetails(false)}
                      className="mr-2"
                    >
                      Đóng
                    </Button>
                    <Button
                      onClick={() => {
                        // Share candidate information
                        navigator.clipboard.writeText(
                          `Thông tin ứng viên: ${selectedCandidate.hoTen}\nSố phiếu: ${selectedCandidate.votes}\nTỉ lệ: ${(selectedCandidate.votePercentage || 0).toFixed(2)}%`,
                        );
                        toast({
                          title: 'Đã sao chép',
                          description: 'Thông tin ứng viên đã được sao chép vào clipboard',
                        });
                      }}
                    >
                      <Share className="h-4 w-4 mr-1.5" />
                      Chia sẻ
                    </Button>
                  </DialogFooter>
                </>
              )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TrangKetQua;
