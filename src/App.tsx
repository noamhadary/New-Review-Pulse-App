import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Reviews from './pages/Reviews';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/reviews"    element={<Reviews />} />
          <Route path="/analytics"  element={<Analytics />} />
          <Route path="/reports"    element={<Reports />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/settings"   element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
