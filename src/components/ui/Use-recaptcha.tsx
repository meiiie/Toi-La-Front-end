'use client';

import type React from 'react';
import { createContext, useContext } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

// Tạo context để cung cấp hook useReCaptcha
const ReCaptchaContext = createContext<{
  executeRecaptcha?: (action?: string) => Promise<string>;
}>({});

// Hook tùy chỉnh để sử dụng reCAPTCHA
export const useReCaptcha = () => {
  const context = useContext(ReCaptchaContext);
  if (context === undefined) {
    // Không throw error vì có thể component không được bọc trong provider
    console.warn('useReCaptcha should be used within a ReCaptchaProvider');
    return { executeRecaptcha: undefined };
  }
  return context;
};

// Provider component để bọc các component cần sử dụng reCAPTCHA
export const ReCaptchaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sử dụng hook từ thư viện react-google-recaptcha-v3
  const { executeRecaptcha: originalExecuteRecaptcha } = useGoogleReCaptcha();

  // Bọc executeRecaptcha để xử lý lỗi tốt hơn
  const executeRecaptcha = async (action?: string) => {
    if (!originalExecuteRecaptcha) {
      console.warn('reCAPTCHA not initialized yet');
      throw new Error('reCAPTCHA not initialized');
    }

    try {
      // Thêm timeout để đảm bảo reCAPTCHA có đủ thời gian để khởi tạo
      return await Promise.race([
        originalExecuteRecaptcha(action),
        new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error('reCAPTCHA timeout')), 10000);
        }),
      ]);
    } catch (error) {
      console.error('Error executing reCAPTCHA:', error);
      throw error;
    }
  };

  return (
    <ReCaptchaContext.Provider value={{ executeRecaptcha }}>{children}</ReCaptchaContext.Provider>
  );
};
