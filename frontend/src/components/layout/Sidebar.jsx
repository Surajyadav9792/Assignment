import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sun,
  Users2,
  KanbanSquare,
  FileText,
  Package,
  BarChart3,
  Settings,
  Boxes,
  Workflow,
  Tag,
  UsersRound,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useUiStore } from '../../store/uiStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { Logo } from './Logo.jsx';

const GROUPS = (role) =>
  [
    {
      label: 'Workspace',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/my-day', label: 'My Day', icon: Sun },
      ],
    },
    {
      label: 'Sales',
      items: [
        { to: '/leads', label: 'Leads', icon: Users2 },
        { to: '/pipeline', label: 'Pipeline', icon: KanbanSquare },
        { to: '/quotes', label: 'Quotes', icon: FileText },
        { to: '/samples', label: 'Samples', icon: Package },
      ],
    },
    role !== 'bda' && {
      label: 'Analytics',
      items: [{ to: '/analytics', label: 'Team Analytics', icon: BarChart3 }],
    },
    role === 'admin' && {
      label: 'Admin',
      items: [
        { to: '/settings/users', label: 'Users', icon: UsersRound },
        { to: '/settings/products', label: 'Products', icon: Boxes },
        { to: '/settings/pipeline', label: 'Pipeline Stages', icon: Workflow },
        { to: '/settings/sources', label: 'Lead Sources', icon: Tag },
      ],
    },
  ].filter(Boolean);

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const groups = GROUPS(user?.role || 'bda');

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border bg-bg ff-transition shrink-0',
        sidebarCollapsed ? 'w-[64px]' : 'w-[240px]'
      )}
      style={{ height: '100vh' }}
    >
      <div className="h-[52px] flex items-center px-4 border-b border-border gap-2.5">
        <Logo size={26} />
        {!sidebarCollapsed && (
          <div className="leading-tight">
            <div className="text-text font-semibold text-md tracking-tightish">ForgeFlow</div>
            <div className="text-xs text-subtle -mt-0.5">BDA Suite</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {groups.map((g) => (
          <div key={g.label} className="mb-4">
            {!sidebarCollapsed && (
              <div className="px-4 mb-1.5 text-[10px] uppercase tracking-wider text-subtle font-medium">
                {g.label}
              </div>
            )}
            <ul className="px-2 space-y-0.5">
              {g.items.map((item) => {
                const active = location.pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={cn(
                        'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm ff-transition',
                        active
                          ? 'bg-accent-soft text-accent'
                          : 'text-muted hover:bg-elev2 hover:text-text'
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon size={18} className="shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <button
        onClick={toggleSidebar}
        className="border-t border-border h-9 flex items-center justify-center text-muted hover:text-text hover:bg-elev2 ff-transition"
        aria-label="Toggle sidebar"
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
