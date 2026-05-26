import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, leadsApi } from '../../api/endpoints.js';
import { useAuthStore } from '../../store/authStore.js';
import { Avatar } from '../primitives/Avatar.jsx';
import { formatRelative } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';

export function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [q, setQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const menuRef = useRef(null);
  const qc = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.list,
    refetchInterval: 30_000,
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await leadsApi.list({ q, limit: 6 });
        setSearchResults(res.items || []);
      } catch {
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const unread = notifications?.unread || 0;

  return (
    <header className="h-[52px] border-b border-border flex items-center px-4 gap-3 bg-bg shrink-0">
      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle pointer-events-none"
        />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search companies, contacts, deals…"
          className="w-full h-8 pl-8 pr-3 text-sm bg-elev border border-border rounded-md text-text placeholder:text-subtle focus:outline-none focus:border-accent ff-transition"
        />
        {searchOpen && q.length >= 2 && (
          <div className="absolute top-full mt-1.5 left-0 right-0 ff-card shadow-elev overflow-hidden z-30">
            {searchResults.length === 0 ? (
              <div className="p-4 text-sm text-muted">No results for "{q}"</div>
            ) : (
              <ul>
                {searchResults.map((l) => (
                  <li key={l._id}>
                    <button
                      onClick={() => {
                        navigate(`/leads/${l._id}`);
                        setSearchOpen(false);
                        setQ('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-elev2 ff-transition"
                    >
                      <div className="text-sm text-text">{l.companyName}</div>
                      <div className="text-xs text-muted">
                        {l.contactName} · {l.stage?.name}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="flex-1" />

      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setNotifOpen((v) => !v)}
          className="relative w-8 h-8 inline-flex items-center justify-center rounded-md text-muted hover:bg-elev2 hover:text-text ff-transition"
          aria-label="Notifications"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--ff-danger)] text-white text-[10px] font-medium flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-80 ff-card shadow-elev z-30">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium">Notifications</span>
              {unread > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs text-accent hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {(notifications?.items || []).slice(0, 10).map((n) => (
                <li
                  key={n._id}
                  className={cn(
                    'px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-elev2 ff-transition cursor-pointer',
                    !n.isRead && 'bg-accent-soft/30'
                  )}
                  onClick={() => {
                    if (n.link) navigate(n.link);
                    setNotifOpen(false);
                  }}
                >
                  <div className="text-sm text-text">{n.title}</div>
                  <div className="text-xs text-muted mt-0.5">{n.body}</div>
                  <div className="text-[10px] text-subtle mt-1">{formatRelative(n.createdAt)}</div>
                </li>
              ))}
              {(!notifications?.items || notifications.items.length === 0) && (
                <li className="px-4 py-6 text-sm text-muted text-center">No notifications</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-elev2 ff-transition"
        >
          <Avatar name={user?.name} size={26} />
          <div className="text-left leading-tight pr-1">
            <div className="text-xs text-text font-medium">{user?.name}</div>
            <div className="text-[10px] text-muted capitalize">{user?.role}</div>
          </div>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-48 ff-card shadow-elev z-30">
            <div className="px-3 py-2 border-b border-border">
              <div className="text-sm text-text">{user?.name}</div>
              <div className="text-xs text-muted">{user?.email}</div>
            </div>
            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  navigate('/settings/users');
                  setMenuOpen(false);
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-elev2 ff-transition"
              >
                <Settings size={14} /> Settings
              </button>
            )}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-elev2 ff-transition"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
