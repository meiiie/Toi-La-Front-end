'use client';

import React, { useState, useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/Button';
import { AlertCircle, Home, ArrowLeft, RefreshCw } from 'lucide-react';

export default function ErrorPage() {
  const error = useRouteError();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkMode);
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const errorMessage = isError(error) ? error.statusText : 'An unexpected error occurred';

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <Header />
      <main className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        <div className="text-center p-8 max-w-2xl">
          <AlertCircle className="mx-auto h-24 w-24 text-red-500 dark:text-red-400 mb-8" />
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Oops! Có điều gì đó sai sai.
          </h1>
          <p className="text-xl mb-8 text-gray-700 dark:text-gray-300">{errorMessage}</p>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Chúng tôi xin lỗi về điều này, bạn vui lòng hãy thử lại:
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="flex items-center justify-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="secondary"
                className="flex items-center justify-center"
              >
                <Home className="mr-2 h-4 w-4" /> Về Home
              </Button>
            </div>
          </div>
          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            Nếu còn tiếp tục xảy ra lỗi, hãy liên hệ tới đội hỡ trợ của chúng tôi{' '}
            <a href="mailto:support@example.com" className="text-blue-500 hover:underline">
              support@example.com
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function isError(error: any): error is { statusText: string } {
  return 'statusText' in error;
}
