'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, Loader, CheckCircle, Info } from 'lucide-react';
import SessionKeyAndTokenApproval from './SessionKeyAndTokenApproval';
import { Button } from '../ui/Button';
import apiClient from '../../api/apiClient';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alter';

interface TokenApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (
    approvalSuccessful: boolean,
    approvalData?: {
      hluBalance: string;
      allowanceForQuanLyPhieu: string;
      isApproved: boolean;
    },
  ) => void;
  contractAddress?: string;
  onSessionKeyGenerated?: (sessionKey: any) => void;
}

const TokenApprovalModal: React.FC<TokenApprovalModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  contractAddress,
  onSessionKeyGenerated,
}) => {
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [scwAddress, setScwAddress] = useState<string>('');
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState<boolean | null>(null);
  const [detailedStatus, setDetailedStatus] = useState<{
    hluBalance: string;
    paymasterAllowance: string;
    quanLyPhieuAllowance: string;
  } | null>(null);

  if (!isOpen) return null;

  // Verify approval meets all requirements with improved logging and data collection
  const verifyApprovalRequirements = async (address: string) => {
    if (!address || !contractAddress) {
      console.error('Cannot verify approval: Missing address or contract');
      return false;
    }

    try {
      setIsCheckingApproval(true);
      setVerificationMessage('Đang kiểm tra phê duyệt token...');

      // Add timestamp to prevent caching
      const timestamp = Date.now();

      // Check QuanLyPhieuBau allowance
      const quanLyPhieuResponse = await apiClient.get(
        `/api/Blockchain/check-contract-allowance?scwAddress=${address}&contractAddress=${contractAddress}&_t=${timestamp}`,
      );

      // Check paymaster allowance
      const paymasterResponse = await apiClient.get(
        `/api/Blockchain/check-allowance?scwAddress=${address}&spenderType=paymaster&_t=${timestamp}`,
      );

      // Also check balance
      const balanceResponse = await apiClient.get(
        `/api/Blockchain/token-balance?scwAddress=${address}&_t=${timestamp}`,
      );

      const quanLyPhieuAllowance = Number(quanLyPhieuResponse.data?.allowance || '0');
      const paymasterAllowance = Number(paymasterResponse.data?.allowance || '0');
      const hluBalance = Number(balanceResponse.data?.balance || '0');

      // Store detailed status
      setDetailedStatus({
        hluBalance: balanceResponse.data?.balance?.toString() || '0',
        paymasterAllowance: paymasterAllowance.toString(),
        quanLyPhieuAllowance: quanLyPhieuAllowance.toString(),
      });

      console.log(
        `Modal verification - QuanLyPhieu: ${quanLyPhieuAllowance}, Paymaster: ${paymasterAllowance}, Balance: ${hluBalance}`,
      );

      // Check if all requirements are met
      const quanLyPhieuRequirementMet = quanLyPhieuAllowance >= 3; // Requires 3 HLU
      const paymasterRequirementMet = paymasterAllowance >= 1; // Requires 1 HLU
      const hasEnoughBalance = hluBalance >= 1; // Need at least 1 HLU balance

      setVerificationMessage(
        `Kết quả kiểm tra - Số dư: ${hluBalance}/1 HLU, ` +
          `Paymaster: ${paymasterAllowance}/1 HLU, ` +
          `Quản lý phiếu bầu: ${quanLyPhieuAllowance}/3 HLU`,
      );

      const isApproved = quanLyPhieuRequirementMet && paymasterRequirementMet && hasEnoughBalance;
      console.log(`Modal approval check result: ${isApproved ? 'APPROVED' : 'NOT APPROVED'}`);

      setVerificationSuccess(isApproved);

      return isApproved;
    } catch (error) {
      console.error('Error verifying approval requirements:', error);
      setVerificationMessage('Lỗi khi kiểm tra phê duyệt: ' + (error as Error).message);
      setVerificationSuccess(false);
      return false;
    } finally {
      setIsCheckingApproval(false);
    }
  };

  // Save the scwAddress when session key is generated
  const handleSessionKeyGenerated = (sessionKey: any) => {
    if (sessionKey && sessionKey.scwAddress) {
      setScwAddress(sessionKey.scwAddress);
      console.log('Session key generated with SCW address:', sessionKey.scwAddress);
    }
    if (onSessionKeyGenerated) {
      onSessionKeyGenerated(sessionKey);
    }
  };

  // Handle approval complete with more robust verification
  const handleApprovalComplete = async () => {
    if (!scwAddress) {
      console.error('Cannot verify approval: No SCW address available');
      onComplete(false);
      return;
    }

    setVerificationInProgress(true);
    setVerificationMessage('Đang xác minh phê duyệt token...');
    setVerificationSuccess(null);

    try {
      // First small delay to allow blockchain state to update
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Gather detailed approval data
      let approvalData = {
        hluBalance: '0',
        allowanceForQuanLyPhieu: '0',
        isApproved: false,
      };

      // First check
      let isApproved = await verifyApprovalRequirements(scwAddress);

      // If we have detailed status, update approvalData
      if (detailedStatus) {
        approvalData = {
          hluBalance: detailedStatus.hluBalance,
          allowanceForQuanLyPhieu: detailedStatus.quanLyPhieuAllowance,
          isApproved: isApproved,
        };
      } else {
        // Fallback to explicit API calls if detailed status is missing
        try {
          const timestamp = Date.now();
          const quanLyPhieuResponse = await apiClient.get(
            `/api/Blockchain/check-contract-allowance?scwAddress=${scwAddress}&contractAddress=${contractAddress}&_t=${timestamp}`,
          );
          const balanceResponse = await apiClient.get(
            `/api/Blockchain/token-balance?scwAddress=${scwAddress}&_t=${timestamp}`,
          );

          approvalData = {
            hluBalance: balanceResponse.data?.balance?.toString() || '0',
            allowanceForQuanLyPhieu: quanLyPhieuResponse.data?.allowance?.toString() || '0',
            isApproved: isApproved,
          };
        } catch (error) {
          console.error('Error getting detailed approval data:', error);
        }
      }

      console.log('Initial approval data:', approvalData);

      // If not approved on first check, try again with increasing delays
      if (!isApproved) {
        for (let attempt = 1; attempt <= 3; attempt++) {
          setVerificationMessage(`Chờ xác nhận từ blockchain... (Lần thử ${attempt}/3)`);
          await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));

          isApproved = await verifyApprovalRequirements(scwAddress);

          // Update approval data with detailed status if available
          if (detailedStatus) {
            approvalData = {
              hluBalance: detailedStatus.hluBalance,
              allowanceForQuanLyPhieu: detailedStatus.quanLyPhieuAllowance,
              isApproved: isApproved,
            };
          }

          if (isApproved) break;
        }
      }

      if (isApproved) {
        setVerificationMessage('Phê duyệt thành công! Đang tiếp tục...');
        setVerificationSuccess(true);
      } else {
        setVerificationMessage('Chưa phê duyệt đủ token cần thiết. Vui lòng phê duyệt lại.');
        setVerificationSuccess(false);
      }

      console.log('Final approval data to pass back:', approvalData);

      // Wait a moment to show the message
      setTimeout(() => {
        setVerificationInProgress(false);
        onComplete(isApproved, approvalData);
      }, 1500);
    } catch (error) {
      console.error('Error during approval verification:', error);
      setVerificationMessage('Lỗi khi xác minh: ' + (error as Error).message);
      setVerificationSuccess(false);
      setVerificationInProgress(false);
      onComplete(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Phê duyệt Token HLU
            </h2>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              disabled={verificationInProgress}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/30 rounded-lg p-3 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-800 dark:text-amber-400 font-medium">Quan trọng</p>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                  Bạn cần phê duyệt token HLU trước khi có thể bỏ phiếu. Nếu bạn thoát khỏi quá
                  trình này mà không hoàn tất việc phê duyệt, bạn không thể tiếp tục quá trình bỏ
                  phiếu.
                </p>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mt-2">
                  Yêu cầu phê duyệt:
                </p>
                <ul className="list-disc ml-5 text-sm text-amber-700 dark:text-amber-500">
                  <li>Ít nhất 1 HLU cho Paymaster</li>
                  <li>Ít nhất 3 HLU cho Quản lý phiếu bầu</li>
                </ul>
              </div>
            </div>
          </div>

          {verificationInProgress ? (
            <div className="p-6 bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg mb-6">
              <div className="flex flex-col items-center justify-center">
                {verificationSuccess === null && (
                  <Loader className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin mb-3" />
                )}
                {verificationSuccess === true && (
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mb-3" />
                )}
                {verificationSuccess === false && (
                  <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400 mb-3" />
                )}
                <p className="text-blue-700 dark:text-blue-300 text-center mb-2">
                  {verificationMessage}
                </p>

                {/* Show detailed status if available */}
                {detailedStatus && (
                  <div className="w-full max-w-md mt-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-blue-800/30">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">Số dư HLU</p>
                        <p
                          className={`font-medium ${Number(detailedStatus.hluBalance) >= 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                        >
                          {detailedStatus.hluBalance}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">Paymaster</p>
                        <p
                          className={`font-medium ${Number(detailedStatus.paymasterAllowance) >= 1 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}
                        >
                          {detailedStatus.paymasterAllowance}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">QuanLyPhieu</p>
                        <p
                          className={`font-medium ${Number(detailedStatus.quanLyPhieuAllowance) >= 3 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}
                        >
                          {detailedStatus.quanLyPhieuAllowance}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Explanation */}
              <Alert className="mb-4 bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-800 dark:text-blue-300">
                  Về quy trình phê duyệt token
                </AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm">
                  <p>
                    Khi bạn phê duyệt token HLU, bạn đang cho phép hệ thống bầu cử sử dụng một phần
                    token của bạn để thực hiện giao dịch bỏ phiếu. Đây là quy trình bảo mật chuẩn
                    của blockchain và các token đã phê duyệt vẫn nằm trong ví của bạn.
                  </p>
                </AlertDescription>
              </Alert>

              <SessionKeyAndTokenApproval
                onSessionKeyGenerated={handleSessionKeyGenerated}
                onApprovalComplete={handleApprovalComplete}
                contractAddress={contractAddress}
                targetType="quanlyphieubau"
              />
            </>
          )}

          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={verificationInProgress}
              className="px-5 py-2"
            >
              Quay lại trang bỏ phiếu
            </Button>

            {/* Abort verification button */}
            {verificationInProgress && (
              <Button
                variant="destructive"
                onClick={() => {
                  setVerificationInProgress(false);
                  setVerificationMessage('Đã hủy quá trình xác minh');
                  setVerificationSuccess(false);
                }}
                className="px-5 py-2"
              >
                Hủy xác minh
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenApprovalModal;
