import { useAuthStore } from '../../store/authStore.js';
import { ManagerDashboard } from './ManagerDashboard.jsx';
import { BdaDashboard } from './BdaDashboard.jsx';

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'bda') return <BdaDashboard />;
  return <ManagerDashboard />;
}
