import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import { Login } from './pages/auth/Login.jsx';
import { Dashboard } from './pages/dashboard/Dashboard.jsx';
import { MyDay } from './pages/tasks/MyDay.jsx';
import { LeadsList } from './pages/leads/LeadsList.jsx';
import { LeadCreate } from './pages/leads/LeadCreate.jsx';
import { LeadDetail } from './pages/leads/LeadDetail.jsx';
import { Pipeline } from './pages/pipeline/Pipeline.jsx';
import { QuotesList } from './pages/quotes/QuotesList.jsx';
import { QuoteCreate } from './pages/quotes/QuoteCreate.jsx';
import { QuoteDetail } from './pages/quotes/QuoteDetail.jsx';
import { SamplesList } from './pages/samples/SamplesList.jsx';
import { Analytics } from './pages/analytics/Analytics.jsx';
import { UsersSettings } from './pages/settings/UsersSettings.jsx';
import { ProductsSettings } from './pages/settings/ProductsSettings.jsx';
import { PipelineSettings } from './pages/settings/PipelineSettings.jsx';
import { SourcesSettings } from './pages/settings/SourcesSettings.jsx';
import { NotFound } from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-day" element={<MyDay />} />
        <Route path="/leads" element={<LeadsList />} />
        <Route path="/leads/new" element={<LeadCreate />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/quotes" element={<QuotesList />} />
        <Route path="/quotes/new" element={<QuoteCreate />} />
        <Route path="/quotes/:id" element={<QuoteDetail />} />
        <Route path="/samples" element={<SamplesList />} />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UsersSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/products"
          element={
            <ProtectedRoute roles={['admin']}>
              <ProductsSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/pipeline"
          element={
            <ProtectedRoute roles={['admin']}>
              <PipelineSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/sources"
          element={
            <ProtectedRoute roles={['admin']}>
              <SourcesSettings />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
