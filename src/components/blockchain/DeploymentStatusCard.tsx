import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alter';
import { Badge } from '../ui/Badge';

import {
  Users,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Loader,
  Database,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export type StatusType = 'pending' | 'in_progress' | 'completed' | 'failed';

interface DeploymentStatusCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  deploymentStatus: StatusType;
  progress: number;
  count: number;
  total: number;
  message: string;
  onDeploy: () => void;
  isDisabled?: boolean;
}

const DeploymentStatusCard: React.FC<DeploymentStatusCardProps> = ({
  title,
  description,
  icon,
  deploymentStatus,
  progress,
  count,
  total,
  message,
  onDeploy,
  isDisabled = false,
}) => {
  // Get status badge
  const getStatusBadge = () => {
    switch (deploymentStatus) {
      case 'completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Hoàn thành
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Loader className="w-3 h-3 mr-1 animate-spin" /> Đang xử lý
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
            <XCircle className="w-3 h-3 mr-1" /> Thất bại
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
            <AlertCircle className="w-3 h-3 mr-1" /> Chưa triển khai
          </Badge>
        );
    }
  };

  return (
    <Card className="mb-6 border-t-4 border-cyan-500 dark:border-cyan-600 bg-gradient-to-br from-white to-cyan-50 dark:from-[#162A45]/90 dark:to-[#1A2942]/70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800/50">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg text-gray-800 dark:text-gray-100">{title}</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {description}
              </CardDescription>
            </div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress display */}
        {['in_progress', 'completed'].includes(deploymentStatus) && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Đã triển khai {count}/{total}
              </span>
              <span className="text-sm font-medium text-cyan-700 dark:text-cyan-400">
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-2 bg-gray-200 dark:bg-gray-800" />
          </div>
        )}

        {/* Status message */}
        {message && (
          <Alert
            className={`mb-4 ${
              deploymentStatus === 'failed'
                ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/30 text-rose-800 dark:text-rose-300'
                : deploymentStatus === 'completed'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800/50 text-cyan-800 dark:text-cyan-300'
            }`}
          >
            {deploymentStatus === 'failed' ? (
              <AlertCircle className="h-4 w-4" />
            ) : deploymentStatus === 'completed' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Action button */}
        <Button
          onClick={onDeploy}
          disabled={deploymentStatus === 'in_progress' || isDisabled}
          className={`w-full ${
            deploymentStatus === 'completed'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-cyan-600 hover:bg-cyan-700 text-white'
          }`}
        >
          {deploymentStatus === 'in_progress' ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Đang triển khai
            </>
          ) : deploymentStatus === 'completed' ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Đã triển khai
            </>
          ) : deploymentStatus === 'failed' ? (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              Thử lại
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Triển khai
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DeploymentStatusCard;
