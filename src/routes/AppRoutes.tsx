// src/routes/AppRoutes.tsx
import React from 'react';
import { createBrowserRouter, RouterProvider, defer } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ToastProvider } from '../components/ui/Use-toast';

import AppBeforeLogin from '../AppBeforeLogin';
import AppAfterLogin from '../AppAfterLogin';
import CacPhienBauCuPage from '../pages/CacPhienBauCuPage';
import PhienBauCuPage from '../pages/PhienBauCuPage';
import ErrorPage from '../pages/ErrorPage';
import HomePage from '../pages/HomePage';
import Main from '../Main';
import LoginPage from '../pages/LoginPage';
import RoleManagementPage from '../pages/RoleManagementPage';
import RoleAssignmentPage from '../pages/RoleAssignmentPage';
import AccountInfoPage from '../pages/AccountInfoPage';
import WelcomePage from '../pages/WelcomePage';
import { getElections } from '../posts/getElections';
import ThankYouPage from '../pages/ThankYouPage';
import FindAccountPage from '../pages/FindAccountPage';
import AccountOptionsPage from '../pages/AccountOptionsPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import RegisterPage from '../pages/RegisterPage';
import SettingsPage from '../pages/SettingsPage';
import UserElectionsPage from '../pages/UserElectionsPage';
import CreateElectionPage from '../pages/CreateElectionPage';
import EditElectionPage from '../pages/EditElectionPage';
import UpcomingElectionsPage from '../pages/UpcomingElectionsPage';
import ElectionManagementPage from '../pages/ElectionManagementPage';
import CandidateManagement from '../pages/CandidateManagement';
import VoterManagement from '../pages/VoterManagement';
import withElectionId from '../components/withElectionId';
import ElectionTienHanh from '../pages/ElectionTienHanh';
import TienHanhBauCu from '../pages/TienHanhBauCu';

const AdminPage = lazy(() => import('../pages/AdminPage'));

const CandidateManagementWithId = withElectionId(CandidateManagement);
const VoterManagementWithId = withElectionId(VoterManagement);
const PhienBauCuPageWithId = withElectionId(PhienBauCuPage);
const ElectionManagementPageWithId = withElectionId(ElectionManagementPage);
const EditElectionPageWithId = withElectionId(EditElectionPage);

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppBeforeLogin />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <WelcomePage />,
      },
      {
        path: 'elections',
        element: <CacPhienBauCuPage />,
      },
      {
        path: 'find-account',
        element: <FindAccountPage />,
      },
      {
        path: 'account-options',
        element: <AccountOptionsPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
    ],
  },
  {
    path: 'login',
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: 'register',
    element: <RegisterPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: 'main',
    element: <Main />,
    errorElement: <ErrorPage />,
  },
  {
    path: 'thank-you',
    element: <ThankYouPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/app',
    element: <AppAfterLogin />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'elections',
        element: <CacPhienBauCuPage />,
      },
      {
        path: 'elections/:id',
        element: <PhienBauCuPageWithId />,
      },
      {
        path: 'create-election',
        element: <CreateElectionPage />,
      },
      {
        path: 'elections/:id/elections-tienhanh',
        element: <ElectionTienHanh />,
      },
      {
        path: 'elections/:id/elections-tienhanh/tien-hanh-bau-cu',
        element: <TienHanhBauCu />,
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
        element: <RoleManagementPage />,
      },
      {
        path: 'role-assignment',
        element: <RoleAssignmentPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'user-elections',
        element: <UserElectionsPage />,
      },
      {
        path: 'user-elections/elections/:id/election-management',
        element: <ElectionManagementPageWithId />,
      },
      {
        path: 'user-elections/elections/:id/edit',
        element: <EditElectionPageWithId />,
      },
      {
        path: 'user-elections/elections/:id/election-management/candidate-management',
        element: <CandidateManagementWithId />, // Route cho trang quản lý ứng viên
      },
      {
        path: 'user-elections/elections/:id/election-management/voter-management',
        element: <VoterManagementWithId darkMode={false} />,
      },
    ],
  },
]);

export function AppRoutes() {
  return <RouterProvider router={router} />;
}
