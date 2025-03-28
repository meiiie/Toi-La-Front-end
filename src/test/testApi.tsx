import React from 'react';
import { ToastProvider } from '../components/ui/Use-toast';
import { Web3Provider } from './components/web3-context';
import { Toaster } from '../components/ui/Toaster';
import AdminDashboard from './components/admin-dashboard';
import Home from './page';
import './globals.css';
import './globalsq.css';
import HluTokenBalance from './hlu-balance-component';
import HluTokenManager from './hlu-token-manager';
import BlockchainDeploymentTest from './testTaoServer';
import HoLiHuTokenPage from './MyModel';
//import App from './testNhe';
import DeployElectionPage from './DeployElectionPage';
import BlockchainDeployment from './ImprovedDeployment'; //quan trong
//import App from './testAC';
import SimpleUploadPage from './UploadAnh';
import PhienBauCuBlockchainPage from '../pages/PhienBauCuBlockchainPage';
const TestApi = () => {
  return (
    <div>
      <HluTokenBalance />
      <HluTokenManager />
    </div>
  );
};

export default TestApi;
