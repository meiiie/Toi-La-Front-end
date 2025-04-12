'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import apiClient from '../api/apiClient';

interface SessionKeyInfo {
  sessionKey: string;
  expiresAt: number;
  scwAddress: string;
}

const useSessionKey = (userInfo: any, walletInfo: any, scwAddress: string, toast: any) => {
  const [sessionKey, setSessionKey] = useState<SessionKeyInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check session key from localStorage on mount
  useEffect(() => {
    if (!userInfo?.id || !walletInfo?.viId) return;

    try {
      const cachedKey = localStorage.getItem(`sessionKey_${userInfo.id}_${walletInfo.viId}`);
      if (cachedKey) {
        const parsedKey = JSON.parse(cachedKey) as SessionKeyInfo;

        // Check if key is still valid
        if (parsedKey.expiresAt * 1000 > Date.now()) {
          setSessionKey(parsedKey);
        } else {
          // Remove expired key
          localStorage.removeItem(`sessionKey_${userInfo.id}_${walletInfo.viId}`);
        }
      }
    } catch (error) {
      console.error('Error loading cached session key:', error);
    }
  }, [userInfo?.id, walletInfo?.viId]);

  // Get session key
  const getSessionKey = useCallback(async () => {
    if (!userInfo?.id || !walletInfo?.viId) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: 'Vui lòng đảm bảo đã đăng nhập và có thông tin tài khoản',
      });
      return null;
    }

    // Check if session key exists and is still valid
    if (sessionKey && sessionKey.expiresAt * 1000 > Date.now()) {
      toast({
        title: 'Khóa phiên hiện tại',
        description: `Khóa phiên còn hạn đến: ${new Date(sessionKey.expiresAt * 1000).toLocaleString()}`,
      });
      return sessionKey;
    }

    // Prevent multiple simultaneous requests
    if (isLoading) return null;

    try {
      setIsLoading(true);

      // Request a new session key - first try the new endpoint
      try {
        const response = await apiClient.post('/api/Blockchain/get-session-key', {
          TaiKhoanID: userInfo.id,
          ViID: walletInfo.viId,
        });

        if (response.data && response.data.success) {
          const newSessionKey = {
            sessionKey: response.data.sessionKey,
            expiresAt: response.data.expiresAt,
            scwAddress: response.data.scwAddress || scwAddress,
          };

          // Save to localStorage for persistence
          localStorage.setItem(
            `sessionKey_${userInfo.id}_${walletInfo.viId}`,
            JSON.stringify(newSessionKey),
          );

          setSessionKey(newSessionKey);

          toast({
            title: 'Thành công',
            description: 'Đã tạo khóa phiên mới thành công',
          });

          return newSessionKey;
        }
      } catch (newEndpointError) {
        console.warn(
          'Không thể lấy khóa phiên từ endpoint mới, thử endpoint cũ:',
          newEndpointError,
        );
      }

      // Fallback to old endpoint
      const response = await apiClient.post('/api/Blockchain/session-key', {
        taiKhoanId: userInfo.id,
        viId: walletInfo.viId,
      });

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Không thể tạo khóa phiên');
      }

      const newSessionKey = {
        sessionKey: response.data.sessionKey,
        expiresAt: response.data.expiresAt,
        scwAddress: response.data.scwAddress || scwAddress,
      };

      // Save to localStorage for persistence
      localStorage.setItem(
        `sessionKey_${userInfo.id}_${walletInfo.viId}`,
        JSON.stringify(newSessionKey),
      );

      setSessionKey(newSessionKey);

      toast({
        title: 'Thành công',
        description: 'Đã tạo khóa phiên mới thành công',
      });

      return newSessionKey;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: (error as Error).message,
      });

      // Nếu không lấy được, thử tạo mới
      try {
        toast({
          title: 'Đang tạo khóa phiên mới',
          description: 'Không thể lấy khóa phiên hiện có, đang tạo mới...',
        });

        const createResponse = await apiClient.post('/api/Blockchain/create-session', {
          TaiKhoanID: userInfo.id,
          ViID: walletInfo.viId,
        });

        if (createResponse.data && createResponse.data.success) {
          toast({
            title: 'Đã tạo khóa phiên mới',
            description: 'Khóa phiên mới đã được tạo thành công',
          });

          // Gọi lại API get-session-key để lấy key mới
          return await getSessionKey();
        }
      } catch (createError) {
        toast({
          variant: 'destructive',
          title: 'Lỗi',
          description: 'Không thể tạo khóa phiên mới: ' + (createError as Error).message,
        });
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userInfo, walletInfo, scwAddress, sessionKey, toast, isLoading]);

  // Memoize return values to prevent unnecessary re-renders
  return useMemo(
    () => ({
      sessionKey,
      isLoading,
      getSessionKey,
    }),
    [sessionKey, isLoading, getSessionKey],
  );
};

export default useSessionKey;
