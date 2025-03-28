import type React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import { Footer } from './components/Footer';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

const AppBeforeLogin: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster position="top-right" />
    </ThemeProvider>
  );
};

export default AppBeforeLogin;
