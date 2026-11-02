import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Landing } from '@/pages/Landing';
import { Dashboard } from '@/pages/Dashboard';
import { Sources } from '@/pages/Sources';
import { Reconstruction } from '@/pages/Reconstruction';
import { Claims } from '@/pages/Claims';
import { ClaimDetail } from '@/pages/ClaimDetail';
import { Handover } from '@/pages/Handover';
import { Audit } from '@/pages/Audit';
import { DEMO_PROJECT, DEMO_PROJECT_ID } from '@/data/demo';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        element={
          <AppLayout
            projectId={DEMO_PROJECT_ID}
            projectName={DEMO_PROJECT.name}
          />
        }
      >
        <Route
          path="/projects/:projectId"
          element={<Dashboard />}
        />
        <Route
          path="/projects/:projectId/sources"
          element={<Sources />}
        />
        <Route
          path="/projects/:projectId/reconstruction"
          element={<Reconstruction />}
        />
        <Route
          path="/projects/:projectId/claims"
          element={<Claims />}
        />
        <Route
          path="/projects/:projectId/claims/:claimId"
          element={<ClaimDetail />}
        />
        <Route
          path="/projects/:projectId/handover"
          element={<Handover />}
        />
        <Route
          path="/projects/:projectId/audit"
          element={<Audit />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}