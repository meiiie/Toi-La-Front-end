import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  Users,
  User,
  Award,
  ArrowRight,
  Loader2,
} from 'lucide-react';

// Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Progress } from '../../components/ui/Progress';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/Alter';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/Accordion';

interface BlockchainDeploymentProps {
  phienBauCu: any;
  onNavigateToBlockchain: () => void;
}

const BlockchainDeployment: React.FC<BlockchainDeploymentProps> = ({
  phienBauCu,
  onNavigateToBlockchain,
}) => {
  const [deploymentStatus, setDeploymentStatus] = useState({
    inProgress: false,
    currentStep: 0,
    completed: false,
    error: false,
  });

  // Mock data for demonstration
  const statsData = {
    voters: 45,
    verifiedVoters: 42,
    candidates: 12,
    positions: 5,
    readiness: 93,
  };

  const deploymentSteps = [
    {
      id: 1,
      name: 'Kiểm tra dữ liệu',
      description: 'Kiểm tra tính toàn vẹn của dữ liệu cử tri và ứng viên',
    },
    { id: 2, name: 'Khởi tạo hợp đồng', description: 'Khởi tạo smart contract cho phiên bầu cử' },
    { id: 3, name: 'Đăng ký cử tri', description: 'Đăng ký danh sách cử tri lên blockchain' },
    { id: 4, name: 'Đăng ký ứng viên', description: 'Đăng ký danh sách ứng viên lên blockchain' },
    { id: 5, name: 'Xác nhận triển khai', description: 'Xác nhận hoàn tất quá trình triển khai' },
  ];

  const startDeployment = () => {
    setDeploymentStatus({
      inProgress: true,
      currentStep: 1,
      completed: false,
      error: false,
    });

    // Simulate deployment process
    let step = 1;
    const interval = setInterval(() => {
      if (step >= deploymentSteps.length) {
        clearInterval(interval);
        setDeploymentStatus({
          inProgress: false,
          currentStep: deploymentSteps.length,
          completed: true,
          error: false,
        });
      } else {
        step++;
        setDeploymentStatus((prev) => ({
          ...prev,
          currentStep: step,
        }));
      }
    }, 2000);
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Blockchain logo from IPFS
  const blockchainLogo =
    'https://gateway.pinata.cloud/ipfs/bafkreif6omfzsnwhnw72mp3ronvze523g6wlw2jfw4hsnb2mz7djn4lbku';

  return (
    <div className="space-y-4">
      <motion.div initial="initial" animate="animate" variants={fadeInUp}>
        <Card className="bg-white dark:bg-[#162A45]/90 border border-gray-200 dark:border-[#2A3A5A]">
          <CardHeader className="flex flex-row items-center gap-4">
            <img
              src={blockchainLogo}
              alt="Blockchain Logo"
              className="w-12 h-12 object-contain"
              onError={(e) => {
                e.currentTarget.src = ''; // Fallback if IPFS image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <CardTitle className="text-xl font-bold flex items-center">
                <Database className="mr-2 h-5 w-5 text-blue-500 dark:text-blue-400" />
                Triển khai lên Blockchain
              </CardTitle>
              <CardDescription>
                Kiểm tra và triển khai dữ liệu phiên bầu cử lên blockchain
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Readiness Check */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
              <h3 className="text-lg font-medium mb-4">Mức độ sẵn sàng triển khai</h3>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Độ sẵn sàng tổng thể</span>
                  <span className="font-medium">{statsData.readiness}%</span>
                </div>
                <Progress value={statsData.readiness} className="h-2" />
              </div>

              {statsData.readiness < 100 && (
                <Alert className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <AlertTitle className="text-yellow-800 dark:text-yellow-400">
                    Chuẩn bị gần hoàn tất
                  </AlertTitle>
                  <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                    Có một số cử tri chưa được xác thực. Bạn vẫn có thể tiếp tục triển khai, nhưng
                    các cử tri chưa xác thực sẽ không được thêm vào blockchain.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-400">Tổng cử tri</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                      {statsData.voters}
                    </p>
                  </div>
                  <Users className="h-10 w-10 text-blue-500 dark:text-blue-400 opacity-70" />
                </CardContent>
              </Card>

              <Card className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-400">Cử tri đã xác thực</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                      {statsData.verifiedVoters}
                    </p>
                  </div>
                  <Shield className="h-10 w-10 text-green-500 dark:text-green-400 opacity-70" />
                </CardContent>
              </Card>

              <Card className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700 dark:text-purple-400">Ứng viên</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                      {statsData.candidates}
                    </p>
                  </div>
                  <User className="h-10 w-10 text-purple-500 dark:text-purple-400 opacity-70" />
                </CardContent>
              </Card>

              <Card className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700 dark:text-amber-400">Vị trí ứng cử</p>
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">
                      {statsData.positions}
                    </p>
                  </div>
                  <Award className="h-10 w-10 text-amber-500 dark:text-amber-400 opacity-70" />
                </CardContent>
              </Card>
            </div>

            {/* Deployment Process */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
              <h3 className="text-lg font-medium mb-4">Quá trình triển khai</h3>

              {deploymentStatus.completed ? (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-800 dark:text-green-300">
                    Triển khai thành công
                  </AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-300">
                    Phiên bầu cử đã được triển khai thành công lên blockchain. Bạn có thể bắt đầu
                    phiên bầu cử ngay bây giờ.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  {deploymentSteps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-start p-3 rounded-lg border ${
                        deploymentStatus.currentStep === step.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50'
                          : deploymentStatus.currentStep > step.id
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50'
                            : 'bg-gray-100 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700/50'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center h-8 w-8 rounded-full mr-3 ${
                          deploymentStatus.currentStep === step.id
                            ? 'bg-blue-500 text-white'
                            : deploymentStatus.currentStep > step.id
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {deploymentStatus.currentStep > step.id ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <span>{step.id}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <h4
                          className={`font-medium ${
                            deploymentStatus.currentStep === step.id
                              ? 'text-blue-800 dark:text-blue-300'
                              : deploymentStatus.currentStep > step.id
                                ? 'text-green-800 dark:text-green-300'
                                : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {step.name}
                        </h4>
                        <p
                          className={`text-sm ${
                            deploymentStatus.currentStep === step.id
                              ? 'text-blue-700 dark:text-blue-400'
                              : deploymentStatus.currentStep > step.id
                                ? 'text-green-700 dark:text-green-400'
                                : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {step.description}
                        </p>
                      </div>

                      {deploymentStatus.currentStep === step.id && (
                        <div className="ml-2 h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details Accordion */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="details">
                <AccordionTrigger className="text-sm font-medium">
                  Chi tiết kỹ thuật và lưu ý quan trọng
                </AccordionTrigger>
                <AccordionContent className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
                  <p>
                    <strong>1. Tính bất biến của dữ liệu:</strong> Sau khi triển khai lên
                    blockchain, dữ liệu phiên bầu cử không thể thay đổi. Hãy đảm bảo rằng mọi thông
                    tin đều chính xác.
                  </p>
                  <p>
                    <strong>2. Liên kết cử tri và ứng viên:</strong> Mỗi ứng viên phải là một cử tri
                    đã xác thực trong hệ thống. Điều này đảm bảo tính toàn vẹn của dữ liệu.
                  </p>
                  <p>
                    <strong>3. Chi phí triển khai:</strong> Quá trình triển khai lên blockchain sẽ
                    phát sinh chi phí gas. Hãy đảm bảo bạn có đủ ETH trong ví để hoàn tất quá trình.
                  </p>
                  <p>
                    <strong>4. Bảo mật khóa:</strong> Hợp đồng bầu cử sẽ được triển khai từ ví của
                    quản trị viên. Hãy giữ an toàn khóa riêng tư của bạn.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-gray-200 dark:border-gray-700/50 p-6">
            <Button variant="outline">Quay lại</Button>

            {deploymentStatus.completed ? (
              <Button className="bg-green-600 hover:bg-green-700 dark:bg-gradient-to-r dark:from-green-600 dark:to-teal-600 text-white">
                <Clock className="mr-2 h-4 w-4" />
                Bắt đầu phiên bầu cử
              </Button>
            ) : (
              <Button
                className="bg-blue-600 hover:bg-blue-700 dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 text-white"
                onClick={startDeployment}
                disabled={deploymentStatus.inProgress}
              >
                {deploymentStatus.inProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang triển khai...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Triển khai lên Blockchain
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              className="ml-2 bg-white hover:bg-gray-100 dark:bg-[#1A2942]/50 dark:hover:bg-[#243656] border-gray-200 dark:border-[#2A3A5A] text-gray-700 dark:text-white"
              onClick={onNavigateToBlockchain}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Xem chi tiết triển khai
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default BlockchainDeployment;
