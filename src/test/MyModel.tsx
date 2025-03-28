'use client';

import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  useGLTF,
  Environment,
  Float,
  PerspectiveCamera,
  Sparkles,
  MeshReflectorMaterial,
  Text,
  Html,
  useProgress,
  Stars,
} from '@react-three/drei';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  ExternalLink,
  BarChart3,
  Shield,
  Users,
  Lock,
  Wallet,
  ArrowUpRight,
  Menu,
  X,
  Twitter,
  Github,
  Linkedin,
  Globe,
  Info,
} from 'lucide-react';
import * as THREE from 'three';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import { Progress } from '../components/ui/Progress';
import { Badge } from '../components/ui/Badge';
import { Separator } from '../components/ui/Separator';
import { useToast } from './components/use-toast';
import { useMobile } from './components/use-mobile';
// Thêm import cho OrbitControls type
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// Component hiển thị trạng thái tải
function LoadingIndicator() {
  const { progress, active } = useProgress();

  if (!active) return null;

  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 bg-[#0A0F18]/80 p-6 rounded-xl backdrop-blur-sm border border-[#2A3A5A]/50">
        <Loader2 className="h-10 w-10 animate-spin text-[#4F8BFF]" />
        <p className="text-[#E1F5FE] text-lg font-medium">Đang tải mô hình 3D...</p>
        <div className="w-56">
          <Progress value={progress} className="h-2 bg-[#162A45]" />
          <p className="text-[#B0BEC5] text-sm mt-1 text-center">{Math.round(progress)}%</p>
        </div>
      </div>
    </Html>
  );
}

// Hiệu ứng blockchain nodes
const BlockchainNodes = () => {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<
    Array<{
      position: THREE.Vector3;
      speed: number;
      direction: THREE.Vector3;
    }>
  >([]);
  const linesRef = useRef<Array<[number, number]>>([]);
  const nodeCount = 12;
  const radius = 4;

  // Tạo vị trí ngẫu nhiên cho các nodes
  useEffect(() => {
    nodesRef.current = Array(nodeCount)
      .fill(null)
      .map(() => {
        return {
          position: new THREE.Vector3(
            (Math.random() - 0.5) * radius * 2,
            (Math.random() - 0.5) * radius * 2,
            (Math.random() - 0.5) * radius * 2,
          ),
          speed: Math.random() * 0.01 + 0.005,
          direction: new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5,
          ).normalize(),
        };
      });

    // Tạo các đường kết nối giữa các nodes
    linesRef.current = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (Math.random() > 0.7) {
          // Chỉ kết nối một số nodes
          linesRef.current.push([i, j]);
        }
      }
    }
  }, []);

  // Animation cho các nodes
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;

      // Di chuyển các nodes
      nodesRef.current.forEach((node, i) => {
        const mesh = groupRef.current?.children[i] as THREE.Mesh | undefined;
        if (mesh) {
          // Di chuyển node theo hướng của nó
          mesh.position.x += node.direction.x * node.speed;
          mesh.position.y += node.direction.y * node.speed;
          mesh.position.z += node.direction.z * node.speed;

          // Đổi hướng khi node đi quá xa
          const distance = mesh.position.length();
          if (distance > radius) {
            node.direction.negate();
          }
        }
      });

      // Cập nhật các đường kết nối
      linesRef.current.forEach((line, i) => {
        const [nodeA, nodeB] = line;
        const lineObj = groupRef.current?.children[nodeCount + i] as THREE.Line | undefined;

        if (lineObj && lineObj.geometry) {
          const posA = (groupRef.current?.children[nodeA] as THREE.Mesh).position;
          const posB = (groupRef.current?.children[nodeB] as THREE.Mesh).position;

          // Cập nhật vị trí của đường
          const positions = lineObj.geometry.attributes.position.array;
          positions[0] = posA.x;
          positions[1] = posA.y;
          positions[2] = posA.z;
          positions[3] = posB.x;
          positions[4] = posB.y;
          positions[5] = posB.z;

          lineObj.geometry.attributes.position.needsUpdate = true;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Nodes */}
      {Array(nodeCount)
        .fill(null)
        .map((_, i) => (
          <mesh key={`node-${i}`} position={[0, 0, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#4F8BFF' : '#6A1B9A'}
              emissive={i % 2 === 0 ? '#4F8BFF' : '#6A1B9A'}
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}

      {/* Lines connecting nodes */}
      {linesRef.current.map((line, i) => (
        <line key={`line-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array(6)}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#4F8BFF" transparent opacity={0.3} />
        </line>
      ))}
    </group>
  );
};

// Component hiển thị mô hình coin với hiệu ứng xoay
type CoinModelProps = {
  position?: [number, number, number];
  scale?: number;
  showInfo?: boolean;
};

const CoinModel = ({ position = [0, 0, 0], scale = 1, showInfo = false }: CoinModelProps) => {
  const modelRef = useRef<THREE.Group>(null);
  const [modelError, setModelError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  // Sử dụng useGLTF với xử lý lỗi
  const { scene } = useGLTF('/models/coin4.glb');
  useEffect(() => {
    if (!scene) {
      console.error('Error loading model');
      setModelError(true);
    }
  }, [scene]);

  // Sửa kiểu dữ liệu cho hotspots
  type Hotspot = {
    id: string;
    position: [number, number, number];
    title: string;
    content: string;
  };

  // Hotspots thông tin
  const hotspots: Hotspot[] = [
    {
      id: 'supply',
      position: [0.8, 0.5, 0.5],
      title: 'Tổng Cung',
      content: '1,000,000 HLH tokens được phát hành với cơ chế deflationary',
    },
    {
      id: 'security',
      position: [-0.8, 0.5, 0.5],
      title: 'Bảo Mật',
      content: 'Smart contract đã được audit bởi CertiK với độ an toàn cao',
    },
    {
      id: 'utility',
      position: [0, -0.8, 0.5],
      title: 'Ứng Dụng',
      content: 'Sử dụng trong hệ thống bầu cử blockchain và quản trị DAO',
    },
  ];

  // Tạo một hình khối đơn giản thay thế khi không thể tải mô hình
  const createFallbackMesh = () => {
    return (
      <group ref={modelRef} position={position} scale={scale}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[1, 1, 0.2, 32]} />
          <meshStandardMaterial
            color="#FFD700"
            metalness={0.9}
            roughness={0.1}
            emissive="#FF6700"
            emissiveIntensity={0.2}
          />
        </mesh>
        <mesh position={[0, 0.11, 0]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.05, 32]} />
          <meshStandardMaterial color="#FFC107" metalness={0.9} roughness={0.1} />
        </mesh>
        <Text
          position={[0, 0.15, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.2}
          color="#0A0F18"
          font="/fonts/Inter_Bold.json"
          anchorX="center"
          anchorY="middle"
        >
          HoLiHu
        </Text>
      </group>
    );
  };

  // Clone và chuẩn bị scene nếu tải thành công
  useEffect(() => {
    if (!modelError && scene) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material instanceof THREE.MeshStandardMaterial) {
            mesh.material.roughness = 0.2;
            mesh.material.metalness = 0.9;
            mesh.material.envMapIntensity = 1.5;
          }
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
    }
  }, [scene, modelError]);

  // Animation xoay nhẹ nhàng
  useFrame((state) => {
    if (modelRef.current) {
      // Xoay chậm hơn khi hover
      modelRef.current.rotation.y += hovered ? 0.002 : 0.005;

      // Hiệu ứng hover
      const hoverEffect = Math.sin(state.clock.elapsedTime) * 0.1;
      modelRef.current.position.y = position[1] + hoverEffect;

      // Hiệu ứng phát sáng khi hover
      if (modelRef.current.children && modelRef.current.children.length > 0) {
        modelRef.current.children.forEach((child: THREE.Object3D) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh && mesh.material) {
            const material = mesh.material as THREE.MeshStandardMaterial;
            if (material.emissiveIntensity !== undefined) {
              material.emissiveIntensity = hovered ? 0.5 : 0.2;
            }
          }
        });
      }
    }
  });

  // Hiển thị mô hình thật hoặc mô hình thay thế
  return modelError ? (
    createFallbackMesh()
  ) : (
    <group
      ref={modelRef}
      position={position}
      scale={scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <primitive object={scene} />

      {/* Hiển thị tên token khi hover */}
      {hovered && !showInfo && (
        <Html position={[0, 1.5, 0]} center>
          <div className="bg-[#0A0F18]/80 text-white px-3 py-1.5 rounded-lg text-sm backdrop-blur-sm border border-[#4F8BFF]/30 whitespace-nowrap">
            HoLiHu Token (ERC-20)
          </div>
        </Html>
      )}

      {/* Hiển thị các hotspots thông tin */}
      {showInfo &&
        hotspots.map((hotspot) => (
          <group key={hotspot.id} position={hotspot.position}>
            {/* Điểm nhấn */}
            <mesh
              onPointerOver={() => setActiveHotspot(hotspot.id)}
              onPointerOut={() => setActiveHotspot(null)}
              onClick={() => setActiveHotspot(activeHotspot === hotspot.id ? null : hotspot.id)}
            >
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial
                color={activeHotspot === hotspot.id ? '#6A1B9A' : '#4F8BFF'}
                emissive={activeHotspot === hotspot.id ? '#6A1B9A' : '#4F8BFF'}
                emissiveIntensity={0.8}
                transparent
                opacity={0.8}
              />
            </mesh>

            {/* Thông tin khi hover/click vào hotspot */}
            {activeHotspot === hotspot.id && (
              <Html position={[0, 0.2, 0]} center>
                <div className="bg-[#0A0F18]/90 text-white p-3 rounded-lg text-sm backdrop-blur-sm border border-[#4F8BFF]/50 w-48">
                  <h4 className="font-medium text-[#4F8BFF] mb-1">{hotspot.title}</h4>
                  <p className="text-xs text-[#E1F5FE]">{hotspot.content}</p>
                </div>
              </Html>
            )}
          </group>
        ))}
    </group>
  );
};

// Nền phản chiếu futuristic
const ReflectiveFloor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={40}
        roughness={0.8}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#050505"
        metalness={0.5}
        mirror={0.5}
      />
    </mesh>
  );
};

// Component hiển thị chính
type ModelSceneProps = {
  quality?: 'high' | 'medium' | 'low';
  showGrid?: boolean;
  showInfo?: boolean;
};

const ModelScene = ({ quality = 'high', showGrid = true, showInfo = false }: ModelSceneProps) => {
  // Sửa kiểu dữ liệu cho controlsRef
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Sửa hàm resetCamera để xử lý null
  const resetCamera = (): void => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  return (
    <Canvas shadows camera={{ position: [0, 0, 10], fov: 45 }}>
      {/* Lighting setup */}
      <color attach="background" args={['#050510']} />
      <fog attach="fog" args={['#070710', 10, 30]} />

      {/* Main lighting */}
      <ambientLight intensity={0.2} />
      <spotLight
        position={[5, 10, 5]}
        angle={0.3}
        penumbra={0.8}
        intensity={1.5}
        castShadow
        color="#00ffff"
      />
      <pointLight position={[-5, 5, -5]} intensity={1} color="#5900ff" />
      <pointLight position={[5, 0, -10]} intensity={0.5} color="#00ff9f" />

      {/* Nền phản chiếu */}
      <ReflectiveFloor />

      {/* Hiệu ứng không gian */}
      <Sparkles
        count={quality === 'high' ? 150 : 50}
        scale={20}
        size={2}
        speed={0.3}
        color="#ffffff"
      />

      {/* Hiệu ứng stars */}
      <Stars
        radius={100}
        depth={50}
        count={quality === 'high' ? 5000 : 2000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Hiệu ứng blockchain nodes */}
      {showGrid && <BlockchainNodes />}

      {/* Model với hiệu ứng Float */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <CoinModel position={[0, 0, 0]} scale={quality === 'high' ? 1 : 0.8} showInfo={showInfo} />
      </Float>

      {/* Tên token ở giữa */}
      <Text
        position={[0, -2.5, 0]}
        fontSize={0.5}
        color="#ffffff"
        font="/fonts/Inter_Bold.json"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#6A1B9A"
      >
        HoLiHu Token
      </Text>

      {/* Environment */}
      <Environment preset="night" />

      {/* Loading indicator */}
      <LoadingIndicator />

      {/* Camera control */}
      <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={40} />
      <OrbitControls
        ref={controlsRef}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
        enableZoom={true}
        enablePan={true}
        dampingFactor={0.05}
        autoRotate={false}
        rotateSpeed={0.5}
      />
    </Canvas>
  );
};

// Biểu đồ giá đơn giản
// Sửa kiểu dữ liệu cho PriceChart
const PriceChart = (): JSX.Element => {
  // Dữ liệu giả lập cho biểu đồ
  const chartData: number[] = [25, 30, 22, 28, 33, 38, 35, 40, 45, 42, 48, 50, 47, 55, 60, 58, 65];
  const maxValue: number = Math.max(...chartData);

  return (
    <div className="h-32 flex items-end gap-1">
      {chartData.map((value, index) => (
        <div key={index} className="w-full h-full flex items-end">
          <div
            className={`w-full ${index < chartData.length - 1 && value < chartData[index + 1] ? 'bg-green-500/50' : 'bg-red-500/50'}`}
            style={{ height: `${(value / maxValue) * 100}%` }}
          ></div>
        </div>
      ))}
    </div>
  );
};

// Component chính
interface TokenData {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  contractAddress: string;
  network: string;
  currentPrice: string;
  marketCap: string;
  holders: string;
  transactions: string;
}

export default function HoLiHuTokenPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>(
    'high' as 'high' | 'medium' | 'low',
  );
  const [showGrid, setShowGrid] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useMobile();

  // Dữ liệu token
  const tokenData: TokenData = {
    name: 'HoLiHu Token',
    symbol: 'HLH',
    decimals: 18,
    totalSupply: '1,000,000 HLH',
    contractAddress: '0x1234...5678',
    network: 'Ethereum',
    currentPrice: '$0.052',
    marketCap: '$52,000',
    holders: '245',
    transactions: '1,245',
  };

  // Giả lập thời gian tải và kiểm tra mô hình
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);

      // Kiểm tra xem có lỗi tải mô hình không
      fetch('/models/coin4.glb')
        .then((response) => {
          if (!response.ok) {
            setModelError(true);
            throw new Error('Network response was not ok');
          }
          return response;
        })
        .catch((error) => {
          console.error('Error checking model:', error);
          setModelError(true);
        });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Xử lý chế độ toàn màn hình
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(`Lỗi khi chuyển sang chế độ toàn màn hình: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Đã sao chép!',
      description: 'Địa chỉ contract đã được sao chép vào clipboard.',
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0A0F18] via-[#121A29] to-[#0D1321] text-white">
      {/* Header */}
      <header className="border-b border-[#2A3A5A]/30 backdrop-blur-sm bg-[#0A0F18]/80 sticky top-0 z-50">
        <div className="container mx-auto max-w-7xl px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] flex items-center justify-center">
              <span className="font-bold text-white">H</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] bg-clip-text text-transparent hidden md:block">
              HoLiHu Token
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#overview" className="text-[#E1F5FE] hover:text-white transition-colors">
              Tổng Quan
            </a>
            <a href="#features" className="text-[#E1F5FE] hover:text-white transition-colors">
              Tính Năng
            </a>
            <a href="#tokenomics" className="text-[#E1F5FE] hover:text-white transition-colors">
              Tokenomics
            </a>
            <a href="#roadmap" className="text-[#E1F5FE] hover:text-white transition-colors">
              Lộ Trình
            </a>
            <a href="#community" className="text-[#E1F5FE] hover:text-white transition-colors">
              Cộng Đồng
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button className="bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] hover:opacity-90 transition-opacity hidden md:flex">
              Mua Token
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden border-[#4F8BFF]/30"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0A0F18] border-t border-[#2A3A5A]/30 py-4">
            <nav className="container mx-auto px-4 flex flex-col gap-4">
              <a
                href="#overview"
                className="text-[#E1F5FE] hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tổng Quan
              </a>
              <a
                href="#features"
                className="text-[#E1F5FE] hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tính Năng
              </a>
              <a
                href="#tokenomics"
                className="text-[#E1F5FE] hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tokenomics
              </a>
              <a
                href="#roadmap"
                className="text-[#E1F5FE] hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Lộ Trình
              </a>
              <a
                href="#community"
                className="text-[#E1F5FE] hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cộng Đồng
              </a>
              <Button className="bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] hover:opacity-90 transition-opacity w-full mt-2">
                Mua Token
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 relative overflow-hidden" id="overview">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div className="order-2 lg:order-1">
              <Badge className="bg-[#162A45] text-[#4F8BFF] border-[#4F8BFF]/30 mb-4">
                ERC-20 Token
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] bg-clip-text text-transparent">
                HoLiHu Token
              </h1>
              <p className="text-lg text-[#E1F5FE] mb-8">
                Token ERC-20 đại diện cho nền kinh tế của hệ thống Web3 bầu cử blockchain, mang đến
                tính minh bạch, bảo mật và hiệu quả cho quá trình bầu cử.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button className="bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] hover:opacity-90 transition-opacity text-lg px-6 py-6">
                  Mua Token
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-[#4F8BFF]/30 text-[#E1F5FE] hover:bg-[#4F8BFF]/20 text-lg px-6 py-6"
                >
                  Whitepaper
                  <ExternalLink className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                <div className="bg-[#162A45]/50 rounded-lg p-4 border border-[#2A3A5A]/50">
                  <p className="text-[#4F8BFF] text-sm">Tổng Cung</p>
                  <p className="text-xl font-medium">{tokenData.totalSupply}</p>
                </div>
                <div className="bg-[#162A45]/50 rounded-lg p-4 border border-[#2A3A5A]/50">
                  <p className="text-[#4F8BFF] text-sm">Giá Hiện Tại</p>
                  <p className="text-xl font-medium">{tokenData.currentPrice}</p>
                </div>
                <div className="bg-[#162A45]/50 rounded-lg p-4 border border-[#2A3A5A]/50">
                  <p className="text-[#4F8BFF] text-sm">Người Nắm Giữ</p>
                  <p className="text-xl font-medium">{tokenData.holders}</p>
                </div>
                <div className="bg-[#162A45]/50 rounded-lg p-4 border border-[#2A3A5A]/50">
                  <p className="text-[#4F8BFF] text-sm">Giao Dịch</p>
                  <p className="text-xl font-medium">{tokenData.transactions}</p>
                </div>
              </div>
            </div>

            {/* Right Column - 3D Model */}
            <div className="order-1 lg:order-2">
              <Card className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl overflow-hidden backdrop-blur-sm shadow-[0_0_50px_rgba(79,139,255,0.3)] h-[500px] md:h-[600px]">
                <div className="relative h-full">
                  {/* Loading overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0A0F18]/80 z-10">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-[#4F8BFF]" />
                        <p className="text-[#E1F5FE] text-lg">Đang tải mô hình 3D...</p>
                        <div className="w-56">
                          <Progress value={45} className="h-2 bg-[#162A45]" />
                          <p className="text-[#B0BEC5] text-sm mt-1 text-center">45%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  <TooltipProvider>
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-[#162A45]/50 border-[#4F8BFF]/30 text-[#E1F5FE] hover:bg-[#4F8BFF]/20"
                            onClick={toggleFullscreen}
                          >
                            <Maximize2 className="h-5 w-5" />
                            <span className="sr-only">Toàn màn hình</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Xem toàn màn hình</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-[#162A45]/50 border-[#4F8BFF]/30 text-[#E1F5FE] hover:bg-[#4F8BFF]/20"
                            onClick={() => setShowGrid(!showGrid)}
                          >
                            <BarChart3 className="h-5 w-5" />
                            <span className="sr-only">Hiển thị lưới</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{showGrid ? 'Ẩn' : 'Hiện'} blockchain nodes</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-[#162A45]/50 border-[#4F8BFF]/30 text-[#E1F5FE] hover:bg-[#4F8BFF]/20"
                            onClick={() => setShowInfo(!showInfo)}
                          >
                            <Info className="h-5 w-5" />
                            <span className="sr-only">Thông tin</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{showInfo ? 'Ẩn' : 'Hiện'} thông tin token</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>

                  {/* 3D Model */}
                  <ModelScene quality={quality} showGrid={showGrid} showInfo={showInfo} />

                  {/* Instructions */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-center z-10">
                    <div className="bg-[#162A45]/70 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-[#E1F5FE] flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span>Kéo:</span>
                        <span className="text-[#4F8BFF]">Xoay</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ZoomIn className="h-4 w-4" />
                        <span className="text-[#4F8BFF]">Phóng to</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ZoomOut className="h-4 w-4" />
                        <span className="text-[#4F8BFF]">Thu nhỏ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Floating blockchain elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#4F8BFF]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#6A1B9A]/5 rounded-full blur-3xl"></div>
      </section>

      {/* Contract Info Section */}
      <section className="py-12 bg-[#0A0F18]/80">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-medium text-[#E1F5FE] mb-2">Smart Contract</h2>
                <div className="flex items-center gap-2">
                  <p className="text-[#B0BEC5] font-mono">{tokenData.contractAddress}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#4F8BFF]"
                    onClick={() => copyToClipboard(tokenData.contractAddress)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-[#4F8BFF]/30 text-[#E1F5FE] hover:bg-[#4F8BFF]/20"
                >
                  Xem trên Etherscan
                  <ExternalLink className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-[#4F8BFF]/30 text-[#E1F5FE] hover:bg-[#4F8BFF]/20"
                >
                  Thêm vào MetaMask
                  <Wallet className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24" id="features">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <Badge className="bg-[#162A45] text-[#4F8BFF] border-[#4F8BFF]/30 mb-4">
              Tính Năng
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] bg-clip-text text-transparent">
              Tại Sao Chọn HoLiHu Token?
            </h2>
            <p className="text-lg text-[#E1F5FE] max-w-3xl mx-auto">
              HoLiHu Token được thiết kế với các tính năng tiên tiến, đảm bảo tính bảo mật, minh
              bạch và hiệu quả cho hệ thống bầu cử blockchain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl p-6 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(79,139,255,0.2)] transition-shadow">
              <div className="w-12 h-12 rounded-full bg-[#4F8BFF]/10 flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-[#4F8BFF]" />
              </div>
              <h3 className="text-xl font-medium text-[#E1F5FE] mb-3">Bảo Mật Cao</h3>
              <p className="text-[#B0BEC5]">
                Smart contract được audit bởi các đơn vị uy tín, đảm bảo an toàn tuyệt đối cho người
                dùng và hệ thống bầu cử.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl p-6 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(79,139,255,0.2)] transition-shadow">
              <div className="w-12 h-12 rounded-full bg-[#4F8BFF]/10 flex items-center justify-center mb-6">
                <Lock className="h-6 w-6 text-[#4F8BFF]" />
              </div>
              <h3 className="text-xl font-medium text-[#E1F5FE] mb-3">Minh Bạch & Bất Biến</h3>
              <p className="text-[#B0BEC5]">
                Mọi giao dịch đều được ghi lại trên blockchain, đảm bảo tính minh bạch và không thể
                thay đổi sau khi đã xác nhận.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl p-6 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(79,139,255,0.2)] transition-shadow">
              <div className="w-12 h-12 rounded-full bg-[#4F8BFF]/10 flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-[#4F8BFF]" />
              </div>
              <h3 className="text-xl font-medium text-[#E1F5FE] mb-3">Quản Trị DAO</h3>
              <p className="text-[#B0BEC5]">
                Người nắm giữ token có quyền tham gia vào quá trình quản trị và ra quyết định trong
                hệ thống bầu cử blockchain.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Tokenomics Section */}
      <section className="py-16 md:py-24 bg-[#0A0F18]/80" id="tokenomics">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <Badge className="bg-[#162A45] text-[#4F8BFF] border-[#4F8BFF]/30 mb-4">
              Tokenomics
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] bg-clip-text text-transparent">
              Phân Phối Token
            </h2>
            <p className="text-lg text-[#E1F5FE] max-w-3xl mx-auto">
              HoLiHu Token được phân phối một cách công bằng và minh bạch, đảm bảo sự phát triển bền
              vững của hệ sinh thái.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Token Distribution */}
            <Card className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-medium text-[#E1F5FE] mb-6">Phân Phối Token</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#B0BEC5]">Bán Public</span>
                    <span className="text-[#E1F5FE]">40%</span>
                  </div>
                  <div className="w-full bg-[#0A0F18] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] h-2 rounded-full"
                      style={{ width: '40%' }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#B0BEC5]">Đội Ngũ & Cố Vấn</span>
                    <span className="text-[#E1F5FE]">20%</span>
                  </div>
                  <div className="w-full bg-[#0A0F18] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] h-2 rounded-full"
                      style={{ width: '20%' }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#B0BEC5]">Marketing & Phát Triển</span>
                    <span className="text-[#E1F5FE]">15%</span>
                  </div>
                  <div className="w-full bg-[#0A0F18] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] h-2 rounded-full"
                      style={{ width: '15%' }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#B0BEC5]">Quỹ Dự Trữ</span>
                    <span className="text-[#E1F5FE]">15%</span>
                  </div>
                  <div className="w-full bg-[#0A0F18] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] h-2 rounded-full"
                      style={{ width: '15%' }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#B0BEC5]">Staking & Rewards</span>
                    <span className="text-[#E1F5FE]">10%</span>
                  </div>
                  <div className="w-full bg-[#0A0F18] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] h-2 rounded-full"
                      style={{ width: '10%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Token Price */}
            <Card className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-medium text-[#E1F5FE] mb-6">Biểu Đồ Giá</h3>

              <div className="mb-6">
                <PriceChart />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0A0F18]/50 rounded-lg p-4">
                  <p className="text-[#4F8BFF] text-sm mb-1">Giá Hiện Tại</p>
                  <p className="text-2xl font-medium">{tokenData.currentPrice}</p>
                </div>
                <div className="bg-[#0A0F18]/50 rounded-lg p-4">
                  <p className="text-[#4F8BFF] text-sm mb-1">Market Cap</p>
                  <p className="text-2xl font-medium">{tokenData.marketCap}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-16 md:py-24" id="roadmap">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <Badge className="bg-[#162A45] text-[#4F8BFF] border-[#4F8BFF]/30 mb-4">Lộ Trình</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] bg-clip-text text-transparent">
              Lộ Trình Phát Triển
            </h2>
            <p className="text-lg text-[#E1F5FE] max-w-3xl mx-auto">
              Kế hoạch phát triển của HoLiHu Token trong tương lai, với các mốc quan trọng và tính
              năng mới.
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-[#2A3A5A] transform md:translate-x-[-0.5px]"></div>

            {/* Timeline items */}
            <div className="space-y-12">
              {/* Q1 2023 */}
              <div className="relative flex flex-col md:flex-row">
                <div className="md:w-1/2 md:pr-12 md:text-right mb-8 md:mb-0">
                  <Badge className="bg-[#162A45] text-[#4F8BFF] border-[#4F8BFF]/30 mb-2">
                    Q1 2023
                  </Badge>
                  <h3 className="text-xl font-medium text-[#E1F5FE] mb-3">Khởi Động Dự Án</h3>
                  <ul className="text-[#B0BEC5] space-y-2">
                    <li>Phát triển smart contract ERC-20</li>
                    <li>Audit bảo mật bởi CertiK</li>
                    <li>Thiết kế tokenomics</li>
                    <li>Xây dựng website và whitepaper</li>
                  </ul>
                </div>

                <div className="absolute left-0 md:left-1/2 top-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] transform -translate-x-1/2 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                </div>

                <div className="md:w-1/2 md:pl-12 md:text-left"></div>
              </div>

              {/* Q2 2023 */}
              <div className="relative flex flex-col md:flex-row">
                <div className="md:w-1/2 md:pr-12 md:text-right"></div>

                <div className="absolute left-0 md:left-1/2 top-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] transform -translate-x-1/2 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                </div>

                <div className="md:w-1/2 md:pl-12 md:text-left mb-8 md:mb-0">
                  <Badge className="bg-[#162A45] text-[#4F8BFF] border-[#4F8BFF]/30 mb-2">
                    Q2 2023
                  </Badge>
                  <h3 className="text-xl font-medium text-[#E1F5FE] mb-3">Phát Hành Token</h3>
                  <ul className="text-[#B0BEC5] space-y-2">
                    <li>Private sale cho các nhà đầu tư</li>
                    <li>Public sale trên các nền tảng IDO</li>
                    <li>Niêm yết trên DEX (Uniswap)</li>
                    <li>Tích hợp với hệ thống bầu cử blockchain</li>
                  </ul>
                </div>
              </div>

              {/* Q3 2023 */}
              <div className="relative flex flex-col md:flex-row">
                <div className="md:w-1/2 md:pr-12 md:text-right mb-8 md:mb-0">
                  <Badge className="bg-[#162A45] text-[#4F8BFF] border-[#4F8BFF]/30 mb-2">
                    Q3 2023
                  </Badge>
                  <h3 className="text-xl font-medium text-[#E1F5FE] mb-3">Mở Rộng Hệ Sinh Thái</h3>
                  <ul className="text-[#B0BEC5] space-y-2">
                    <li>Ra mắt staking platform</li>
                    <li>Tích hợp với các ví Web3 phổ biến</li>
                    <li>Phát triển DAO governance</li>
                    <li>Mở rộng đội ngũ phát triển</li>
                  </ul>
                </div>

                <div className="absolute left-0 md:left-1/2 top-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] transform -translate-x-1/2 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                </div>

                <div className="md:w-1/2 md:pl-12 md:text-left"></div>
              </div>

              {/* Q4 2023 */}
              <div className="relative flex flex-col md:flex-row">
                <div className="md:w-1/2 md:pr-12 md:text-right"></div>

                <div className="absolute left-0 md:left-1/2 top-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] transform -translate-x-1/2 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                </div>

                <div className="md:w-1/2 md:pl-12 md:text-left mb-8 md:mb-0">
                  <Badge className="bg-[#162A45] text-[#4F8BFF] border-[#4F8BFF]/30 mb-2">
                    Q4 2023
                  </Badge>
                  <h3 className="text-xl font-medium text-[#E1F5FE] mb-3">Tích Hợp & Đối Tác</h3>
                  <ul className="text-[#B0BEC5] space-y-2">
                    <li>Niêm yết trên các CEX lớn</li>
                    <li>Hợp tác với các dự án blockchain khác</li>
                    <li>Mở rộng sang các blockchain khác (Polygon, BSC)</li>
                    <li>Phát triển các use case mới</li>
                  </ul>
                </div>
              </div>

              {/* Q1 2024 */}
              <div className="relative flex flex-col md:flex-row">
                <div className="md:w-1/2 md:pr-12 md:text-right mb-8 md:mb-0">
                  <Badge className="bg-[#162A45] text-[#4F8BFF] border-[#4F8BFF]/30 mb-2">
                    Q1 2024
                  </Badge>
                  <h3 className="text-xl font-medium text-[#E1F5FE] mb-3">Tương Lai</h3>
                  <ul className="text-[#B0BEC5] space-y-2">
                    <li>Phát triển HoLiHu 2.0</li>
                    <li>Mở rộng sang các thị trường mới</li>
                    <li>Tích hợp với các hệ thống bầu cử quốc tế</li>
                    <li>Nghiên cứu và phát triển các công nghệ mới</li>
                  </ul>
                </div>

                <div className="absolute left-0 md:left-1/2 top-0 w-8 h-8 rounded-full bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] transform -translate-x-1/2 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                </div>

                <div className="md:w-1/2 md:pl-12 md:text-left"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#0A0F18]/80">
        <div className="container mx-auto max-w-7xl px-4">
          <Card className="bg-gradient-to-r from-[#0A0F18] to-[#162A45] border border-[#2A3A5A] rounded-2xl overflow-hidden backdrop-blur-sm p-8 md:p-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] bg-clip-text text-transparent">
                  Tham Gia Ngay Hôm Nay
                </h2>
                <p className="text-lg text-[#E1F5FE]">
                  Trở thành một phần của cộng đồng HoLiHu Token và tham gia vào tương lai của hệ
                  thống bầu cử blockchain.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] hover:opacity-90 transition-opacity text-lg px-6 py-6">
                  Mua Token
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-[#4F8BFF]/30 text-[#E1F5FE] hover:bg-[#4F8BFF]/20 text-lg px-6 py-6"
                >
                  Tham Gia Cộng Đồng
                  <Users className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-16 md:py-24" id="community">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <Badge className="bg-[#162A45] text-[#4F8BFF] border-[#4F8BFF]/30 mb-4">
              Cộng Đồng
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] bg-clip-text text-transparent">
              Tham Gia Cộng Đồng
            </h2>
            <p className="text-lg text-[#E1F5FE] max-w-3xl mx-auto">
              Kết nối với cộng đồng HoLiHu Token trên các nền tảng xã hội và tham gia vào các cuộc
              thảo luận.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Twitter */}
            <Card className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl p-6 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(79,139,255,0.2)] transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#4F8BFF]/10 flex items-center justify-center">
                  <Twitter className="h-5 w-5 text-[#4F8BFF]" />
                </div>
                <h3 className="text-lg font-medium text-[#E1F5FE]">Twitter</h3>
              </div>
              <p className="text-[#B0BEC5] mb-4">
                Theo dõi chúng tôi trên Twitter để cập nhật tin tức và thông báo mới nhất.
              </p>
              <Button
                variant="outline"
                className="w-full border-[#4F8BFF]/30 text-[#E1F5FE] hover:bg-[#4F8BFF]/20"
              >
                Theo Dõi
                <ExternalLink className="ml-1 h-4 w-4" />
              </Button>
            </Card>

            {/* Telegram */}
            <Card className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl p-6 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(79,139,255,0.2)] transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#4F8BFF]/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-[#4F8BFF]" />
                </div>
                <h3 className="text-lg font-medium text-[#E1F5FE]">Telegram</h3>
              </div>
              <p className="text-[#B0BEC5] mb-4">
                Tham gia nhóm Telegram để thảo luận và kết nối với cộng đồng.
              </p>
              <Button
                variant="outline"
                className="w-full border-[#4F8BFF]/30 text-[#E1F5FE] hover:bg-[#4F8BFF]/20"
              >
                Tham Gia
                <ExternalLink className="ml-1 h-4 w-4" />
              </Button>
            </Card>

            {/* Discord */}
            <Card className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl p-6 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(79,139,255,0.2)] transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#4F8BFF]/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-[#4F8BFF]" />
                </div>
                <h3 className="text-lg font-medium text-[#E1F5FE]">Discord</h3>
              </div>
              <p className="text-[#B0BEC5] mb-4">
                Tham gia server Discord để nhận hỗ trợ và tham gia các sự kiện.
              </p>
              <Button
                variant="outline"
                className="w-full border-[#4F8BFF]/30 text-[#E1F5FE] hover:bg-[#4F8BFF]/20"
              >
                Tham Gia
                <ExternalLink className="ml-1 h-4 w-4" />
              </Button>
            </Card>

            {/* GitHub */}
            <Card className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl p-6 backdrop-blur-sm hover:shadow-[0_0_30px_rgba(79,139,255,0.2)] transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#4F8BFF]/10 flex items-center justify-center">
                  <Github className="h-5 w-5 text-[#4F8BFF]" />
                </div>
                <h3 className="text-lg font-medium text-[#E1F5FE]">GitHub</h3>
              </div>
              <p className="text-[#B0BEC5] mb-4">
                Xem mã nguồn và đóng góp vào sự phát triển của dự án.
              </p>
              <Button
                variant="outline"
                className="w-full border-[#4F8BFF]/30 text-[#E1F5FE] hover:bg-[#4F8BFF]/20"
              >
                Xem Repository
                <ExternalLink className="ml-1 h-4 w-4" />
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-[#0A0F18]/80">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <Badge className="bg-[#162A45] text-[#4F8BFF] border-[#4F8BFF]/30 mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] bg-clip-text text-transparent">
              Câu Hỏi Thường Gặp
            </h2>
            <p className="text-lg text-[#E1F5FE] max-w-3xl mx-auto">
              Những câu hỏi thường gặp về HoLiHu Token và hệ thống bầu cử blockchain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* FAQ 1 */}
            <Card className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-medium text-[#E1F5FE] mb-3">HoLiHu Token là gì?</h3>
              <p className="text-[#B0BEC5]">
                HoLiHu Token là một token ERC-20 trên mạng Ethereum, được sử dụng trong hệ thống bầu
                cử blockchain. Token này đại diện cho nền kinh tế của hệ thống và cho phép người
                dùng tham gia vào quá trình quản trị và bầu cử.
              </p>
            </Card>

            {/* FAQ 2 */}
            <Card className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-medium text-[#E1F5FE] mb-3">
                Làm thế nào để mua HoLiHu Token?
              </h3>
              <p className="text-[#B0BEC5]">
                Bạn có thể mua HoLiHu Token trên các sàn giao dịch phi tập trung như Uniswap, hoặc
                tham gia vào các đợt bán token của dự án. Hãy theo dõi các kênh chính thức của chúng
                tôi để cập nhật thông tin.
              </p>
            </Card>

            {/* FAQ 3 */}
            <Card className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-medium text-[#E1F5FE] mb-3">
                Token có những ứng dụng gì?
              </h3>
              <p className="text-[#B0BEC5]">
                HoLiHu Token có nhiều ứng dụng trong hệ thống bầu cử blockchain, bao gồm: xác thực
                danh tính, tham gia quản trị DAO, nhận phần thưởng khi tham gia xác thực, và thanh
                toán phí giao dịch trong hệ thống.
              </p>
            </Card>

            {/* FAQ 4 */}
            <Card className="bg-[#162A45]/30 border border-[#2A3A5A] rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-medium text-[#E1F5FE] mb-3">
                Làm thế nào để tham gia vào quản trị DAO?
              </h3>
              <p className="text-[#B0BEC5]">
                Người nắm giữ HoLiHu Token có thể tham gia vào quản trị DAO bằng cách stake token
                của họ và tham gia bỏ phiếu cho các đề xuất. Quyền bỏ phiếu tỷ lệ thuận với số lượng
                token được stake.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#2A3A5A]/30">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] flex items-center justify-center">
                  <span className="font-bold text-white">H</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-[#0288D1] to-[#6A1B9A] bg-clip-text text-transparent">
                  HoLiHu
                </h3>
              </div>
              <p className="text-[#B0BEC5] mb-4">
                Token ERC-20 đại diện cho nền kinh tế của hệ thống Web3 bầu cử blockchain.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="text-[#4F8BFF] hover:text-white transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-[#4F8BFF] hover:text-white transition-colors">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="text-[#4F8BFF] hover:text-white transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="text-[#4F8BFF] hover:text-white transition-colors">
                  <Globe className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-[#E1F5FE] font-medium mb-4">Liên Kết</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#overview" className="text-[#B0BEC5] hover:text-white transition-colors">
                    Tổng Quan
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-[#B0BEC5] hover:text-white transition-colors">
                    Tính Năng
                  </a>
                </li>
                <li>
                  <a
                    href="#tokenomics"
                    className="text-[#B0BEC5] hover:text-white transition-colors"
                  >
                    Tokenomics
                  </a>
                </li>
                <li>
                  <a href="#roadmap" className="text-[#B0BEC5] hover:text-white transition-colors">
                    Lộ Trình
                  </a>
                </li>
                <li>
                  <a
                    href="#community"
                    className="text-[#B0BEC5] hover:text-white transition-colors"
                  >
                    Cộng Đồng
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[#E1F5FE] font-medium mb-4">Tài Liệu</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-[#B0BEC5] hover:text-white transition-colors">
                    Whitepaper
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#B0BEC5] hover:text-white transition-colors">
                    Smart Contract
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#B0BEC5] hover:text-white transition-colors">
                    API Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#B0BEC5] hover:text-white transition-colors">
                    Hướng Dẫn Sử Dụng
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#B0BEC5] hover:text-white transition-colors">
                    Audit Report
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[#E1F5FE] font-medium mb-4">Liên Hệ</h4>
              <ul className="space-y-2">
                <li className="text-[#B0BEC5]">Email: contact@holihu.io</li>
                <li className="text-[#B0BEC5]">Telegram: @HoLiHuToken</li>
                <li className="text-[#B0BEC5]">Discord: HoLiHu Community</li>
              </ul>
            </div>
          </div>

          <Separator className="bg-[#2A3A5A]/30 mb-6" />

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-[#B0BEC5] text-sm">
              © 2023 HoLiHu Token. Bản quyền thuộc về Blockchain Voting Team.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-[#B0BEC5] text-sm hover:text-white transition-colors">
                Điều Khoản Sử Dụng
              </a>
              <a href="#" className="text-[#B0BEC5] text-sm hover:text-white transition-colors">
                Chính Sách Bảo Mật
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Preload model để tránh lỗi
useGLTF.preload('/models/coin4.glb');
