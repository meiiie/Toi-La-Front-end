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
//import PhienBauCuBlockchainPage from '../pages/PhienBauCuBlockchainPage';
import TaoPhienBauCu from './TaoPhienBauCu';
import PhienBauCuManager from './PhienBauCuManager';
import ElectionDetail from './ElectionDetail';
import BlockchainSyncTool from './BlockchainSyncTool';
import SimpleDeployBallotSession from './ThuPhienBauCu';
import SimpleDeployBallotSession2 from '../pages/PhienBauCuBlockchainDeploymentPage';
import ThemCuTri from './ThemCuTriPage';
import BlockchainDeploymentPage from './BlockchainDeploymentPage';
import ElectionSessionManager from '../pages/ElectionSessionManagerPage';
import BatDauPhienBauCu from './BatDauPhienBauCu';
import BlockchainInfo from './BlockchainInfo';
import CapPhieuBau from './CapPhieuBauComponent';
import ElectionDettail from './ElectionDetail';
import BatDauCuocBauCuPage from '../pages/BatDauCuocBauCuPage';
import ThamGiaBauCu from '../pages/ThamGiaBauCuPage';
import TienHanhBauCu from '../pages/TienHanhCuocBauCu';
import XemChiTietCuocBauCu from '../pages/XemChiTietCuocBauCuPage';
import BoPhieuPage from './TestPhieuBau';
import ElectionMonitor from './TrangKetQua';
const TestApi = () => {
  return (
    <div>
      <BlockchainSyncTool />
    </div>
  );
};

export default TestApi;
