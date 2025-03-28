import React from 'react';
import { ToastProvider } from '../components/ui/Use-toast';
import { Web3Provider } from '../test/components/web3-context';
import { Toaster } from '../components/ui/Toaster';
import AdminDashboard from '../test/components/admin-dashboard';

export default function BatDauCuocBauCuPage() {
  return (
    <ToastProvider>
      <Web3Provider>
        <div>
          <AdminDashboard />
        </div>
        <Toaster />
      </Web3Provider>
    </ToastProvider>
  );
}
