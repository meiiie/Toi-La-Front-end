import type React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

import AppBeforeLogin from '../AppBeforeLogin';
import AppAfterLogin from '../AppAfterLogin';
import CacPhienBauCuPage from '../pages/CacCuocBauCuPage';
import XemChiTietCuocBauCuPage from '../pages/XemChiTietCuocBauCuPage';
import ErrorPage from '../pages/ErrorPage';
import HomePage from '../pages/HomePage';
import Main from '../Main';
import LoginPage from '../pages/LoginPage';
import RoleManagementPage from '../pages/QuanLyVaiTroAdminPage';
import RoleAssignmentPage from '../pages/PhanQuyenAdminPage';
import AccountInfoPage from '../pages/ThongTinTaiKhoanPage';
import WelcomePage from '../pages/ChaoMungPage';
import ThankYouPage from '../pages/CamOnPage';
import FindAccountPage from '../pages/TimTaiKhoanPage';
import AccountOptionsPage from '../pages/TuyChonTaiKhoanPage';
import RegisterPage from '../pages/DangKyTaiKhoanPage';
import SettingsPage from '../pages/CaiDatPage';
import UserElectionsPage from '../pages/CuocBauCuCuaNguoiDungPage';
import TaoPhienBauCuPage from '../pages/TaoCuocBauCuPage';
import EditElectionPage from '../pages/ChinhSuaCuocBauCuPage';
import UpcomingElectionsPage from '../pages/ThongBaoCuocBauCuPage';
import QuanLyPhienBauCuPage from '../pages/QuanLyPhienBauCuPage';
import QuanLyUngVienPage from '../pages/QuanLyUngVienPage';
import QuanLyCuTriPage from '../pages/QuanLyCuTriPage';
import withElectionId from '../components/withElectionId';
import ElectionTienHanh from '../pages/ThongTinChiTietCuocBauCu';
// import TienHanhBauCu from '../pages/TienHanhPhienBauCuPage';
import He from '../testWeb3/test1';
import ThongBaoKhongCoPhien from '../components/ThongBaoKhongCoCuocBauCu';
import ChinhSachBaoMat from '../pages/ChinhSachBaoMatPage';
import DieuKhoanSuDung from '../pages/DieuKhoanSuDungPage';
import LienHePage from '../pages/LienHe';
import UnauthorizedPage from '../pages/UnauthoriedPage';
import ProtectedRoute from '../routes/ProtectedRoute';
import TestApi from '../test/testApi';
import GuiOTPPage from '../pages/GuiOTPPage';
import DatLaiMatKhauPage from '../pages/DatLaiMatKhauPage';
import QuanLyCuocBauCuPage from '../pages/QuanLyCuocBauCuPage';
import withPhienBauCuId from '../components/withPhienBauCuId';
import QuanLyFilePage from '../pages/QuanLyFilePage'; // Import QuanLyFilePage
import PhieuMoiPhienBauCuPage from '../pages/PhieuMoiPhienBauCuPage'; // Import PhieuMoiPhienBauCuPage
import QuetMaQRPage from '../pages/QuetMaQRPage';
import QuanLyThanhTuuPage from '../pages/QuanLyThanhTuuPage'; // Import QuanLyThanhTuuPage
import TimKetQuaPhienBauCuPage from '../pages/TimKetQuaPhienBauCuPage'; // Import TimKetQuaPhienBauCuPage
import QuanLySmartContractPage from '../pages/QuanLySmartContractPage'; // Import QuanLySmartContractPage
//import ThongTinBlockchainRealTimePage from '../pages/ThongTinBlockchainRealTimePage'; // Import ThongTinBlockchainRealTimePage
import BatDauCuocBauCuPage from '../pages/BatDauCuocBauCuPage'; // Import ThongTinBlockchainRealTimePage
import CapPhieuBauPage from '../pages/CapPhieuBauPage'; // Import ThongTinBlockchainRealTimePage
import FAQ from '../pages/FaqPage';
import BlockchainSetupPage from '../pages/BlockchainSetupPage';
import BlockchainDeploymentPage from '../pages/blockchain-deployment';
import DieuLePage from '../pages/DieuLePage';
import ThamGiaBauCu from '../pages/ThamGiaBauCuPage';
import PhienBauCuBlockchainPage from '../pages/PhienBauCuBlockchainPage';

import { Web3Provider } from '../context/Web3Context';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../components/ui/Use-toast';
import { ReCaptchaProvider } from '../components/ui/Use-recaptcha';

const AdminPage = lazy(() => import('../pages/AdminPage'));

const QuanLyUngVienPageWithId = withPhienBauCuId(QuanLyUngVienPage);
const QuanLyCuTriPageWithId = withPhienBauCuId(QuanLyCuTriPage);
const PhienBauCuPageWithId = withElectionId(XemChiTietCuocBauCuPage);
const QuanLyPhienBauCuPageWithId = withPhienBauCuId(QuanLyPhienBauCuPage);
const EditElectionPageWithId = withElectionId(EditElectionPage);
const QuanLyCuocBauCuPageWithId = withElectionId(QuanLyCuocBauCuPage);

// Bọc toàn bộ ứng dụng trong các providers cần thiết
const AppWithProviders = ({
  children,
  useRecaptcha = false,
}: {
  children: React.ReactNode;
  useRecaptcha?: boolean;
}) => (
  <ThemeProvider>
    <ToastProvider>
      {useRecaptcha ? (
        <GoogleReCaptchaProvider
          reCaptchaKey="6LfL9PIqAAAAAFGQnjVFb4F7ep4FfvUAyNaz9bVJ"
          scriptProps={{
            async: false,
            defer: true,
            appendTo: 'body',
          }}
          container={{
            parameters: {
              badge: 'bottomright',
              theme: 'dark',
            },
          }}
        >
          <ReCaptchaProvider>
            <Web3Provider>{children}</Web3Provider>
          </ReCaptchaProvider>
        </GoogleReCaptchaProvider>
      ) : (
        <Web3Provider>{children}</Web3Provider>
      )}
    </ToastProvider>
  </ThemeProvider>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AppWithProviders>
        <AppBeforeLogin />
      </AppWithProviders>
    ),
    errorElement: (
      <AppWithProviders>
        <ErrorPage />
      </AppWithProviders>
    ),
    children: [
      {
        index: true,
        element: <WelcomePage />,
      },
      {
        path: 'test-api',
        element: <TestApi />,
      },
      {
        path: 'thong-bao-khong-co-phien',
        element: <ThongBaoKhongCoPhien />,
      },

      {
        path: 'test',
        element: <He />,
      },
      // {
      //   path: 'blockchain-realtime',
      //   element: <ThongTinBlockchainRealTimePage />,
      // },
      {
        path: 'elections',
        element: <CacPhienBauCuPage />,
      },
      {
        path: 'tim-tai-khoan',
        element: <FindAccountPage />,
      },
      {
        path: 'tim-tai-khoan/:username/:randomCode/tuy-chon',
        element: <AccountOptionsPage />,
      },
      {
        path: 'tim-tai-khoan/:username/:randomCode/tuy-chon/gui-otp',
        element: <GuiOTPPage />,
      },
      {
        path: 'tim-tai-khoan/:username/:randomCode/tuy-chon/gui-otp/dat-lai-mat-khau',
        element: <DatLaiMatKhauPage />,
      },
      {
        path: 'chua-xac-thuc',
        element: <UnauthorizedPage />,
      },
      {
        path: 'register',
        element: (
          <AppWithProviders useRecaptcha={true}>
            <RegisterPage />
          </AppWithProviders>
        ),
      },
    ],
  },
  {
    path: 'login',
    element: (
      <AppWithProviders useRecaptcha={true}>
        <LoginPage />
      </AppWithProviders>
    ),
    errorElement: (
      <AppWithProviders>
        <ErrorPage />
      </AppWithProviders>
    ),
  },
  {
    path: 'chinh-sach-bao-mat',
    element: (
      <AppWithProviders>
        <ChinhSachBaoMat />
      </AppWithProviders>
    ),
    errorElement: (
      <AppWithProviders>
        <ErrorPage />
      </AppWithProviders>
    ),
  },
  {
    path: 'dieu-khoan-su-dung',
    element: (
      <AppWithProviders>
        <DieuKhoanSuDung />
      </AppWithProviders>
    ),
    errorElement: (
      <AppWithProviders>
        <ErrorPage />
      </AppWithProviders>
    ),
  },
  {
    path: 'faq',
    element: (
      <AppWithProviders>
        <FAQ />
      </AppWithProviders>
    ),
    errorElement: (
      <AppWithProviders>
        <ErrorPage />
      </AppWithProviders>
    ),
  },
  {
    path: 'lien-he',
    element: (
      <AppWithProviders>
        <LienHePage />
      </AppWithProviders>
    ),
    errorElement: (
      <AppWithProviders>
        <ErrorPage />
      </AppWithProviders>
    ),
  },
  {
    path: 'blockchain-setup',
    element: (
      <AppWithProviders>
        <BlockchainSetupPage />
      </AppWithProviders>
    ),
    errorElement: (
      <AppWithProviders>
        <ErrorPage />
      </AppWithProviders>
    ),
  },
  {
    path: 'main',
    element: (
      <AppWithProviders>
        <Main />
      </AppWithProviders>
    ),
    errorElement: (
      <AppWithProviders>
        <ErrorPage />
      </AppWithProviders>
    ),
  },
  {
    path: 'thank-you',
    element: (
      <AppWithProviders>
        <ThankYouPage />
      </AppWithProviders>
    ),
    errorElement: (
      <AppWithProviders>
        <ErrorPage />
      </AppWithProviders>
    ),
  },
  {
    path: '/invite',
    element: (
      <AppWithProviders>
        <PhieuMoiPhienBauCuPage />
      </AppWithProviders>
    ),
  },
  {
    path: 'bat-dau-cuoc-bau-cu',
    element: (
      <AppWithProviders>
        <BatDauCuocBauCuPage />
      </AppWithProviders>
    ),
  },
  {
    path: 'cap-phieu-bau',
    element: (
      <AppWithProviders>
        <CapPhieuBauPage />
      </AppWithProviders>
    ),
  },
  {
    path: '/election/:electionId/blockchain',
    element: (
      <AppWithProviders>
        <PhienBauCuBlockchainPage />
      </AppWithProviders>
    ),
  },
  {
    path: '/election/:electionId/session/:sessionId',
    element: (
      <AppWithProviders>
        <PhienBauCuBlockchainPage />
      </AppWithProviders>
    ),
  },
  {
    path: '/app',
    element: (
      <AppWithProviders>
        <ProtectedRoute requiredPermissions={['Quan Tri Vien', 'Nguoi Dung']}>
          <AppAfterLogin />
        </ProtectedRoute>
      </AppWithProviders>
    ),
    errorElement: (
      <AppWithProviders>
        <ErrorPage />
      </AppWithProviders>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'test-api',
        element: <TestApi />,
      },
      {
        path: 'elections',
        element: <CacPhienBauCuPage />,
      },
      {
        path: 'elections/:id',
        element: <PhienBauCuPageWithId cuocBauCuId={':id'} />,
      },
      {
        path: 'tao-phien-bau-cu',
        element: <TaoPhienBauCuPage />,
      },
      {
        path: 'elections/:id/elections-tienhanh',
        element: <ElectionTienHanh />,
      },
      {
        path: 'account-info',
        element: <AccountInfoPage />,
      },
      {
        path: 'upcoming-elections',
        element: <UpcomingElectionsPage />,
      },
      {
        path: 'admin',
        element: (
          <Suspense
            fallback={<div className="text-center p-5 text-xl text-slate-900">Loading...</div>}
          >
            <AdminPage />
          </Suspense>
        ),
      },
      {
        path: 'role-management',
        element: (
          <ProtectedRoute requiredPermissions={['Quan Tri Vien', 'Quản Lý Vai Trò']}>
            <RoleManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'role-assignment',
        element: (
          <ProtectedRoute requiredPermissions={['Quan Tri Vien', 'Quản Lý Vai Trò']}>
            <RoleAssignmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'quan-ly-file',
        element: <QuanLyFilePage />,
      },
      {
        path: 'quet-ma-qr',
        element: <QuetMaQRPage />, // Thêm đường dẫn cho QuetMaQRPage
      },
      {
        path: 'user-elections',
        element: <UserElectionsPage />,
      },
      {
        path: 'user-elections/elections/:id/election-management',
        element: <QuanLyCuocBauCuPageWithId cuocBauCuId={':id'} />,
      },
      {
        path: 'user-elections/elections/:id/election-management/:idPhien/phien-bau-cu',
        element: <QuanLyPhienBauCuPageWithId />,
      },

      {
        path: 'user-elections/elections/:id/edit',
        element: <EditElectionPageWithId cuocBauCuId={':id'} />,
      },
      {
        path: 'user-elections/elections/:id/election-management/candidate-management',
        element: <QuanLyUngVienPageWithId />, // Route cho trang quản lý ứng viên
      },
      {
        path: 'user-elections/elections/:id/election-management/voter-management',
        element: <QuanLyCuTriPageWithId darkMode={false} phienBauCuId={':id'} />,
      },
      {
        path: 'invite',
        element: <PhieuMoiPhienBauCuPage />, // Route cho trang PhieuMoiPhienBauCuPage
      },
      {
        path: 'quan-ly-thanh-tuu',
        element: <QuanLyThanhTuuPage />,
      },
      {
        path: 'ket-qua-bau-cu',
        element: <TimKetQuaPhienBauCuPage />,
      },
      {
        path: 'quan-ly-smart-contract',
        element: <QuanLySmartContractPage />,
      },
      {
        path: 'user-elections/elections/:id/blockchain-deployment',
        element: <BlockchainDeploymentPage />,
      },
      {
        path: 'user-elections/elections/:id/rules',
        element: <DieuLePage />,
      },
      // Thêm route cho trang ThamGiaBauCu
      {
        path: 'user-elections/elections/:id/participate',
        element: <ThamGiaBauCu />,
      },
    ],
  },
  {
    path: '*',
    element: (
      <AppWithProviders>
        <ErrorPage />
      </AppWithProviders>
    ),
    errorElement: (
      <AppWithProviders>
        <ErrorPage />
      </AppWithProviders>
    ),
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
