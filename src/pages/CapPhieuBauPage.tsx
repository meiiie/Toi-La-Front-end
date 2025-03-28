import React from 'react';
import { ToastProvider } from '../components/ui/Use-toast';
import { Web3Provider } from '../test/components/web3-context';
import { Toaster } from '../components/ui/Toaster';
import Home from '../test/CapPhieuBauComponent';

const TestApi = () => {
  return (
    <ToastProvider>
      <Web3Provider>
        <Home />
        <Toaster />
      </Web3Provider>
    </ToastProvider>
  );
};

export default TestApi;
