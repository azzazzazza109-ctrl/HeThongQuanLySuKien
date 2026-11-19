import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

const TASKS_STORAGE_KEY = 'cmcu_staff_tasks_v1';

function NavIcon({ name, size = 16 }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2.1',
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };

  switch (name) {
    case 'events':
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'create':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'tasks':
      return (
        <svg {...props}>
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case 'approvals':
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case 'manage':
      return (
        <svg {...props}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case 'tickets':
      return (
        <svg {...props}>
          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
          <path d="M13 5v2" />
          <path d="M13 17v2" />
          <path d="M13 11v2" />
        </svg>
      );
    case 'qr':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3h-3z" />
          <path d="M20 14v3h1" />
          <path d="M14 20h3" />
          <path d="M20 20h1v1" />
        </svg>
      );
    case 'user':
      return (
        <svg {...props}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...props}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...props}>
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      );
    case 'search':
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'login':
      return (
        <svg {...props}>
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      );
    default:
      return null;
  }
}

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();

  const [colorMode, setColorMode] = useState(() => {
    try {
      return localStorage.getItem('cmcu_color_mode') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [topSearch, setTopSearch] = useState(() => searchParams.get('q') || '');

  const [openMenu, setOpenMenu] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cmcu_read_notif_ids') || '[]');
    } catch {
      return [];
    }
  });

  const [floatingTaskOpen, setFloatingTaskOpen] = useState(false);
  const [staffTasks, setStaffTasks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskEventId, setQuickTaskEventId] = useState('');
  const [quickEventsList, setQuickEventsList] = useState([]);

  const rightActionsRef = useRef(null);

  const currentRole = (user?.system_role || user?.role || '').toString().toUpperCase();
  const isStaff = currentRole === 'STAFF';
  const isLight = colorMode === 'light';

  const toggleColorMode = () => {
    setColorMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('cmcu_color_mode', next);
      } catch {

      }
      return next;
    });
  };

  useEffect(() => {
    const roleTheme =
      currentRole === 'ADMIN' ? 'theme-admin' : currentRole === 'STAFF' ? 'theme-staff' : 'theme-user';
    document.documentElement.setAttribute('data-color-mode', colorMode);
    document.body.className = `${roleTheme} mode-${colorMode}`;
    return () => {
      document.body.className = '';
    };
  }, [colorMode, currentRole]);

  useEffect(() => {
    setTopSearch(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    const syncTasks = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY) || '[]');
        if (Array.isArray(saved)) setStaffTasks(saved);
      } catch {

      }
    };
    window.addEventListener('storage', syncTasks);
    window.addEventListener('cmcu_tasks_updated', syncTasks);
    return () => {
      window.removeEventListener('storage', syncTasks);
      window.removeEventListener('cmcu_tasks_updated', syncTasks);
    };
  }, []);

  const persistStaffTasks = (updated) => {
    setStaffTasks(updated);
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('cmcu_tasks_updated'));
    } catch {

    }
  };

  const handleToggleFloatingTask = (taskId) => {
    const updated = staffTasks.map((t) =>
      t.id === taskId ? { ...t, status: t.status === 'TODO' ? 'DONE' : 'TODO' } : t
    );
    persistStaffTasks(updated);
  };

  const handleQuickAddFloatingTask = (e) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    const chosenEv =
      quickEventsList.find((ev) => String(ev.event_id) === String(quickTaskEventId)) ||
      quickEventsList[0];

    const defaultDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const deadlineStr = `${defaultDeadline.getFullYear()}-${pad(defaultDeadline.getMonth() + 1)}-${pad(defaultDeadline.getDate())}T17:00`;

    const newTask = {
      id: `${Date.now()}`,
      event_id: chosenEv ? String(chosenEv.event_id) : '0',
      event: chosenEv ? chosenEv.title : 'Sự kiện chung CMCU',
      category: 'Vận hành nhanh',
      title: quickTaskTitle.trim(),
      assignee: user?.full_name || 'Staff Test',
      priority: 'HIGH',
      deadline: deadlineStr,
      status: 'TODO'
    };

    persistStaffTasks([newTask, ...staffTasks]);
    setQuickTaskTitle('');
  };

  const handleTopSearchChange = (e) => {
    const val = e.target.value;
    setTopSearch(val);
    if (location.pathname === '/') {
      const nextParams = new URLSearchParams(searchParams);
      if (val.trim()) nextParams.set('q', val);
      else nextParams.delete('q');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleTopSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = topSearch.trim();
    if (location.pathname !== '/') {
      navigate(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : '/');
    } else {
      document.getElementById('cmcu-all-events-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clearTopSearch = () => {
    setTopSearch('');
    if (location.pathname === '/') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('q');
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleLogout = () => {
    setOpenMenu(null);
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rightActionsRef.current && !rightActionsRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setShowProfileModal(false);
        setFloatingTaskOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadHeaderData = async () => {
      const baseNotifs = [];
      if (currentRole === 'ADMIN' || currentRole === 'STAFF') {
        baseNotifs.push({
          id: 'sys-staff-checkin',
          title: 'Trạm soát vé QR đã sẵn sàng',
          desc: 'Mở menu tài khoản góc trên bên phải để truy cập nhanh trạm quét QR.',
          link: '/staff/checkin',
          iconType: 'qr'
        });
      } else {
        baseNotifs.push({
          id: 'sys-student-ticket',
          title: 'Nhắc nhở vé tham dự sự kiện',
          desc: 'Mở Ví vé của tôi để xuất trình mã QR khi check-in tại hội trường.',
          link: '/my-tickets',
          iconType: 'tickets'
        });
      }

      try {
        const res = await apiClient.get('/events');
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.data || res.data?.events || [];

        setQuickEventsList(list);
        if (list.length > 0 && !quickTaskEventId) {
          setQuickTaskEventId(String(list[0].event_id));
        }

        const openEvents = list.filter((ev) => ev.status === 'OPEN').slice(0, 4);
        openEvents.forEach((ev) => {
          const dateLabel = ev.start_time
            ? new Date(ev.start_time).toLocaleDateString('vi-VN')
            : 'Sắp diễn ra';
          baseNotifs.push({
            id: `ev-${ev.event_id}`,
            title: `Sự kiện đang mở: ${ev.title}`,
            desc: `${ev.location || 'Đại học CMC'} • Ngày ${dateLabel}`,
            link: `/events/${ev.event_id}`,
            iconType: 'events'
          });
        });
      } catch {

      }
      setNotifications(baseNotifs);
    };
    loadHeaderData();
  }, [user, currentRole]);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      try {
        localStorage.setItem('cmcu_read_notif_ids', JSON.stringify(updated));
      } catch {

      }
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    try {
      localStorage.setItem('cmcu_read_notif_ids', JSON.stringify(allIds));
    } catch {

    }
  };

  const handleNotificationClick = (item) => {
    markAsRead(item.id);
    setOpenMenu(null);
    if (item.link) navigate(item.link);
  };

  const menuItems = [{ path: '/', icon: 'events', label: 'Sự kiện', mobileLabel: 'Sự kiện' }];

  if (currentRole === 'ADMIN') {
    menuItems.push(
      { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard', mobileLabel: 'Tổng quan' },
      { path: '/admin/approvals', icon: 'approvals', label: 'Duyệt SK', mobileLabel: 'Duyệt SK' },
      { path: '/admin/events', icon: 'manage', label: 'Quản lý SK', mobileLabel: 'Quản lý' },
      { path: '/admin/create', icon: 'create', label: 'Tạo SK', mobileLabel: 'Tạo SK' },
      { path: '/admin/tasks', icon: 'tasks', label: 'Giao việc', mobileLabel: 'Giao việc' }
    );
  } else if (currentRole === 'STAFF') {
    menuItems.push(
      { path: '/admin/create', icon: 'create', label: 'Tạo sự kiện', mobileLabel: 'Tạo sự kiện' },
      { path: '/admin/tasks', icon: 'tasks', label: 'Bảng Task Kanban', mobileLabel: 'Kanban' }
    );
  } else if (user) {
    menuItems.push({ path: '/my-tickets', icon: 'tickets', label: 'Ví vé của tôi', mobileLabel: 'Ví vé' });
  } else {
    menuItems.push({ path: '/login', icon: 'login', label: 'Đăng nhập', mobileLabel: 'Đăng nhập' });
  }

  const handleCopyId = () => {
    const textToCopy = user?.student_code || String(user?.user_id || '');
    if (!textToCopy) return;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const pendingStaffTasks = staffTasks.filter((t) => t.status === 'TODO');
  const overdueStaffTasks = pendingStaffTasks.filter(
    (t) => t.deadline && !isNaN(new Date(t.deadline).getTime()) && new Date(t.deadline) < new Date()
  );

  return (
    <div
      className={`cmcu-app-shell ${isLight ? 'cmcu-theme-light' : 'cmcu-theme-dark'}`}
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
    >
      <style>{`
        body.mode-light {
          background: #f1f5f9 !important;
          background-image: none !important;
          color: #0f172a !important;
        }
        body.mode-dark {
          background: #0b0e14 !important;
          background-image: none !important;
          color: #f8fafc !important;
        }

        .cmcu-top-navbar {
          position: sticky;
          top: 10px;
          z-index: 1000;
          margin: 10px 24px 0 24px;
          padding: 8px 16px;
          height: 62px;
          border-radius: 18px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .cmcu-theme-dark .cmcu-top-navbar {
          background: rgba(18, 22, 33, 0.94);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.6);
        }
        .cmcu-theme-light .cmcu-top-navbar {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 28px -8px rgba(15, 23, 42, 0.1);
        }

        .cmcu-brand-link {
          display: flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .cmcu-brand-text {
          font-weight: 900;
          font-size: 1.02rem;
          letter-spacing: -0.4px;
          white-space: nowrap;
        }
        .cmcu-theme-dark .cmcu-brand-text { color: #ffffff; }
        .cmcu-theme-light .cmcu-brand-text { color: #0f172a; }

        .cmcu-global-search {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          max-width: 280px;
          min-width: 140px;
          height: 36px;
          border-radius: 999px;
          padding: 0 12px;
          transition: all 0.2s ease;
        }
        .cmcu-theme-dark .cmcu-global-search {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #f8fafc;
        }
        .cmcu-theme-dark .cmcu-global-search:focus-within {
          border-color: #2dc275;
          box-shadow: 0 0 0 3px rgba(45, 194, 117, 0.2);
        }
        .cmcu-theme-light .cmcu-global-search {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #0f172a;
        }
        .cmcu-theme-light .cmcu-global-search:focus-within {
          background: #ffffff;
          border-color: #16a34a;
        }
        .cmcu-global-search input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.84rem;
          padding: 0 7px;
          color: inherit;
          min-width: 0;
        }

        .cmcu-desktop-nav {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 3px;
          border-radius: 999px;
          flex-shrink: 0;
        }
        .cmcu-theme-dark .cmcu-desktop-nav {
          background: rgba(9, 12, 20, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.09);
        }
        .cmcu-theme-light .cmcu-desktop-nav {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
        }

        .cmcu-top-nav-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 600;
          white-space: nowrap;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .cmcu-theme-dark .cmcu-top-nav-item { color: #cbd5e1; }
        .cmcu-theme-dark .cmcu-top-nav-item:hover { color: #ffffff; background: rgba(255, 255, 255, 0.08); }
        .cmcu-theme-light .cmcu-top-nav-item { color: #475569; }
        .cmcu-theme-light .cmcu-top-nav-item:hover { color: #0f172a; background: rgba(15, 23, 42, 0.06); }
        .cmcu-top-nav-item.active {
          color: #052e16 !important;
          background: linear-gradient(135deg, #34d399 0%, #2dc275 100%) !important;
          font-weight: 800;
        }

        .cmcu-nav-right {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .cmcu-icon-circle-btn {
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .cmcu-theme-dark .cmcu-icon-circle-btn {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.06);
          color: #e2e8f0;
        }
        .cmcu-theme-dark .cmcu-icon-circle-btn:hover,
        .cmcu-theme-dark .cmcu-icon-circle-btn.active {
          background: rgba(255, 255, 255, 0.16);
          color: #ffffff;
        }
        .cmcu-theme-light .cmcu-icon-circle-btn {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #334155;
        }
        .cmcu-theme-light .cmcu-icon-circle-btn:hover,
        .cmcu-theme-light .cmcu-icon-circle-btn.active {
          background: #e2e8f0;
          color: #0f172a;
        }
        .cmcu-bell-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          border-radius: 999px;
          background: #ef4444;
          color: #ffffff;
          font-size: 0.66rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #0f172a;
        }

        .cmcu-profile-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 3px 10px 3px 4px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cmcu-theme-dark .cmcu-profile-pill {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .cmcu-theme-light .cmcu-profile-pill {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
        }
        .cmcu-mini-avatar-wrap {
          position: relative;
          width: 31px;
          height: 31px;
          flex-shrink: 0;
        }
        .cmcu-mini-avatar {
          width: 31px;
          height: 31px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #9333ea 100%);
          color: #ffffff;
          font-weight: 800;
          font-size: 0.88rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cmcu-online-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #2dc275;
          border: 2px solid #0f172a;
        }
        .cmcu-profile-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.15;
        }
        .cmcu-profile-name {
          font-size: 0.82rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          max-width: 112px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cmcu-theme-dark .cmcu-profile-name { color: #ffffff; }
        .cmcu-theme-light .cmcu-profile-name { color: #0f172a; }
        .cmcu-profile-role {
          font-size: 0.58rem;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 6px;
          background: #eef2ff;
          color: #4338ca;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .cmcu-profile-role.admin { background: #fce7f3; color: #be185d; }

        .cmcu-mobile-bottom-bar { display: none; }
        .cmcu-main-content {
          flex: 1;
          padding: 18px 24px 32px 24px;
          min-height: calc(100vh - 120px);
          max-width: 100%;
          box-sizing: border-box;
        }

        @media (max-width: 1140px) {
          .cmcu-brand-text { display: none; }
          .cmcu-global-search { max-width: 210px; }
        }

        @media (max-width: 920px) {
          .cmcu-main-content {
            padding: 12px 10px 88px 10px;
          }
          .cmcu-top-navbar {
            top: 8px;
            margin: 8px 12px 0 12px;
            padding: 6px 10px;
            height: 54px;
            border-radius: 15px;
          }
          .cmcu-desktop-nav { display: none; }
          .cmcu-global-search { max-width: none; min-width: 110px; height: 35px; }
          .cmcu-profile-meta { display: none; }
          .cmcu-profile-pill { padding: 3px; }

          .cmcu-mobile-bottom-bar {
            position: fixed;
            bottom: 10px;
            left: 12px;
            right: 12px;
            z-index: 1050;
            height: 60px;
            padding: 5px 8px;
            border-radius: 18px;
            backdrop-filter: blur(20px);
            display: flex;
            align-items: center;
            justify-content: space-around;
            gap: 4px;
          }
          .cmcu-theme-dark .cmcu-mobile-bottom-bar {
            background: rgba(15, 22, 46, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.16);
            box-shadow: 0 14px 34px rgba(0, 0, 0, 0.65);
          }
          .cmcu-theme-light .cmcu-mobile-bottom-bar {
            background: rgba(255, 255, 255, 0.96);
            border: 1px solid #cbd5e1;
            box-shadow: 0 10px 28px rgba(15, 23, 42, 0.14);
          }
          .cmcu-mobile-tab-item {
            flex: 1;
            min-width: 54px;
            height: 100%;
            border-radius: 13px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            text-decoration: none;
            font-size: 0.68rem;
            font-weight: 600;
            white-space: nowrap;
          }
          .cmcu-theme-dark .cmcu-mobile-tab-item { color: #94a3b8; }
          .cmcu-theme-light .cmcu-mobile-tab-item { color: #64748b; }
          .cmcu-mobile-tab-item.active {
            background: rgba(45, 194, 117, 0.18);
            color: #16a34a !important;
            font-weight: 800;
            border: 1px solid rgba(45, 194, 117, 0.45);
          }
          .cmcu-layout-body { padding-bottom: 78px; }
        }

        @media (max-width: 640px) {
          .cmcu-main-content {
            padding: 8px 6px 88px 6px;
          }
          .cmcu-top-navbar {
            margin: 6px 8px 0 8px;
            padding: 5px 8px;
          }
          .cmcu-mobile-bottom-bar {
            left: 8px;
            right: 8px;
            bottom: 8px;
          }
        }

        .cmcu-dropdown-card {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: min(345px, calc(100vw - 24px));
          background: rgba(22, 24, 33, 0.98);
          backdrop-filter: blur(20px);
          color: #f8fafc;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 18px;
          box-shadow: 0 24px 54px rgba(0, 0, 0, 0.72);
          overflow: hidden;
          z-index: 1200;
        }
        .cmcu-dropdown-header {
          padding: 14px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cmcu-notif-list { max-height: 310px; overflow-y: auto; }
        .cmcu-notif-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
        }
        .cmcu-notif-item:hover { background: rgba(255, 255, 255, 0.07); }
        .cmcu-notif-item.unread { background: rgba(45, 194, 117, 0.09); }
        .cmcu-notif-icon-box {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.08);
          color: #34d399;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cmcu-profile-card-head {
          padding: 16px;
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.22) 0%, rgba(45, 194, 117, 0.14) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cmcu-qr-spotlight-btn {
          width: calc(100% - 20px);
          margin: 10px 10px 6px 10px;
          padding: 11px 13px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(45, 194, 117, 0.22) 0%, rgba(16, 185, 129, 0.12) 100%);
          border: 1px solid rgba(45, 194, 117, 0.45);
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 11px;
          text-align: left;
          cursor: pointer;
        }
        .cmcu-qr-spotlight-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #2dc275;
          color: #052e16;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cmcu-menu-row-btn {
          width: calc(100% - 16px);
          margin: 2px 8px;
          padding: 10px 12px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: #e2e8f0;
          font-size: 0.88rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 11px;
          text-align: left;
          cursor: pointer;
        }
        .cmcu-menu-row-btn:hover { background: rgba(255, 255, 255, 0.08); color: #ffffff; }
        .cmcu-row-icon-badge {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cmcu-menu-row-btn.danger {
          width: 100%;
          margin: 6px 0 0 0;
          padding: 12px 20px;
          border-radius: 0;
          color: #fca5a5;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .cmcu-menu-row-btn.danger:hover { background: rgba(239, 68, 68, 0.16); color: #f87171; }

        .staff-fab-wrapper {
          position: fixed;
          right: 22px;
          bottom: 24px;
          z-index: 1150;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        @media (max-width: 920px) {
          .staff-fab-wrapper {
            right: 14px;
            bottom: 80px;
          }
        }
        .staff-fab-btn {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 12px 18px;
          border-radius: 999px;
          border: 1.5px solid rgba(251, 191, 36, 0.65);
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: #ffffff;
          font-weight: 800;
          font-size: 0.88rem;
          cursor: pointer;
          box-shadow: 0 12px 28px rgba(217, 119, 6, 0.45);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .staff-fab-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 16px 34px rgba(217, 119, 6, 0.6);
        }
        .staff-fab-count {
          background: #0f172a;
          color: #fcd34d;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 0.76rem;
          font-weight: 900;
        }
        .staff-floating-panel {
          width: min(370px, calc(100vw - 28px));
          margin-bottom: 12px;
          border-radius: 18px;
          background: rgba(18, 22, 34, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(251, 191, 36, 0.35);
          box-shadow: 0 24px 54px rgba(0, 0, 0, 0.75);
          color: #f8fafc;
          overflow: hidden;
        }
        .staff-floating-head {
          padding: 13px 16px;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.24) 0%, rgba(30, 41, 59, 0.6) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .staff-floating-list {
          max-height: 250px;
          overflow-y: auto;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .staff-floating-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 9px 11px;
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.83rem;
        }

        .cmcu-official-footer {
          margin-top: 40px;
          padding: 36px 32px 24px 32px;
          transition: all 0.25s ease;
        }
        .cmcu-theme-dark .cmcu-official-footer {
          background: #0d111a;
          color: #cbd5e1;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .cmcu-theme-light .cmcu-official-footer {
          background: #ffffff;
          color: #334155;
          border-top: 1px solid #e2e8f0;
        }
        .cmcu-footer-grid {
          max-width: 1240px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.2fr 1.3fr 1fr;
          gap: 28px;
        }
        @media (max-width: 900px) {
          .cmcu-footer-grid { grid-template-columns: 1fr; }
        }
        .cmcu-footer-heading {
          font-size: 0.94rem;
          font-weight: 800;
          margin: 0 0 12px 0;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .cmcu-theme-dark .cmcu-footer-heading { color: #ffffff; }
        .cmcu-theme-light .cmcu-footer-heading { color: #0f172a; }
        .cmcu-footer-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.84rem;
          line-height: 1.5;
        }
        .cmcu-footer-link {
          color: #2dc275;
          font-weight: 700;
          text-decoration: none;
        }
        .cmcu-footer-link:hover { text-decoration: underline; }
        .cmcu-social-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .cmcu-social-pill-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .cmcu-theme-dark .cmcu-social-pill-link {
          background: rgba(255, 255, 255, 0.07);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.14);
        }
        .cmcu-theme-dark .cmcu-social-pill-link:hover {
          background: #2dc275;
          color: #052e16;
          border-color: #2dc275;
        }
        .cmcu-theme-light .cmcu-social-pill-link {
          background: #f1f5f9;
          color: #1e293b;
          border: 1px solid #cbd5e1;
        }
        .cmcu-theme-light .cmcu-social-pill-link:hover {
          background: #16a34a;
          color: #ffffff;
          border-color: #16a34a;
        }
      `}</style>

      <header className="cmcu-top-navbar">
        <Link to="/" className="cmcu-brand-link" onClick={() => setOpenMenu(null)}>
          <img
            src={logo}
            alt="CMCU Logo"
            style={{
              height: '28px',
              width: 'auto',
              objectFit: 'contain',
              filter: isLight ? 'none' : 'brightness(0) invert(1)'
            }}
          />
          <span className="cmcu-brand-text">CMCU Events</span>
        </Link>

        <form className="cmcu-global-search" onSubmit={handleTopSearchSubmit}>
          <NavIcon name="search" size={15} />
          <input
            type="text"
            placeholder="Tìm sự kiện, khoa, địa điểm..."
            value={topSearch}
            onChange={handleTopSearchChange}
            aria-label="Tìm kiếm sự kiện"
          />
          {topSearch && (
            <button
              type="button"
              onClick={clearTopSearch}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              ✕
            </button>
          )}
        </form>

        <nav className="cmcu-desktop-nav">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === '/' && location.pathname.startsWith('/events'));

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`cmcu-top-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setOpenMenu(null)}
              >
                <NavIcon name={item.icon} size={14} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="cmcu-nav-right" ref={rightActionsRef}>
          <button
            type="button"
            className="cmcu-icon-circle-btn"
            onClick={toggleColorMode}
            title={isLight ? 'Chuyển sang nền tối (Dark Mode)' : 'Chuyển sang nền sáng (Light Mode)'}
          >
            <NavIcon name={isLight ? 'moon' : 'sun'} size={17} />
          </button>

          {user ? (
            <>
              <button
                type="button"
                className={`cmcu-icon-circle-btn ${openMenu === 'NOTIF' ? 'active' : ''}`}
                title="Thông báo sự kiện"
                onClick={() => setOpenMenu((prev) => (prev === 'NOTIF' ? null : 'NOTIF'))}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && <span className="cmcu-bell-badge">{unreadCount}</span>}
              </button>

              <button
                type="button"
                className={`cmcu-profile-pill ${openMenu === 'PROFILE' ? 'active' : ''}`}
                onClick={() => setOpenMenu((prev) => (prev === 'PROFILE' ? null : 'PROFILE'))}
              >
                <div className="cmcu-mini-avatar-wrap">
                  <div className="cmcu-mini-avatar">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="cmcu-online-dot" />
                </div>
                <div className="cmcu-profile-meta">
                  <span className="cmcu-profile-name">
                    {user.full_name || 'Người dùng'}
                    <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>▾</span>
                  </span>
                  <span className={`cmcu-profile-role ${currentRole === 'ADMIN' ? 'admin' : ''}`}>
                    {currentRole || 'USER'}
                  </span>
                </div>
              </button>

              {openMenu === 'NOTIF' && (
                <div className="cmcu-dropdown-card">
                  <div className="cmcu-dropdown-header">
                    <strong style={{ fontSize: '0.92rem' }}>Thông báo ({unreadCount} mới)</strong>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2dc275',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>

                  <div className="cmcu-notif-list">
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.86rem' }}>
                        Chưa có thông báo mới.
                      </div>
                    ) : (
                      notifications.map((item) => {
                        const isUnread = !readIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`cmcu-notif-item ${isUnread ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(item)}
                          >
                            <div className="cmcu-notif-icon-box">
                              <NavIcon name={item.iconType} size={17} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.84rem',
                                  fontWeight: isUnread ? 700 : 500,
                                  color: '#ffffff',
                                  marginBottom: '3px'
                                }}
                              >
                                {item.title}
                              </div>
                              <div style={{ fontSize: '0.77rem', color: '#94a3b8', lineHeight: 1.35 }}>
                                {item.desc}
                              </div>
                            </div>
                            {isUnread && (
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: '#2dc275',
                                  marginTop: '6px',
                                  flexShrink: 0
                                }}
                              />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {openMenu === 'PROFILE' && (
                <div className="cmcu-dropdown-card" style={{ width: 'min(295px, calc(100vw - 24px))' }}>
                  <div className="cmcu-profile-card-head">
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1 0%, #2dc275 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        color: '#fff',
                        flexShrink: 0
                      }}
                    >
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {user.full_name || 'Người dùng'}
                      </div>
                      <div style={{ fontSize: '0.77rem', color: '#94a3b8', marginTop: '2px' }}>
                        @{user.username || 'cmcu_member'} • <strong style={{ color: '#34d399' }}>{currentRole}</strong>
                      </div>
                    </div>
                  </div>

                  {(currentRole === 'STAFF' || currentRole === 'ADMIN') && (
                    <button
                      type="button"
                      className="cmcu-qr-spotlight-btn"
                      onClick={() => {
                        setOpenMenu(null);
                        navigate('/staff/checkin');
                      }}
                    >
                      <div className="cmcu-qr-spotlight-icon">
                        <NavIcon name="qr" size={19} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>
                          Mở trạm soát vé QR
                        </div>
                        <div style={{ fontSize: '0.73rem', color: '#a7f3d0', marginTop: '1px' }}>
                          Quét QR &amp; check-in sinh viên
                        </div>
                      </div>
                      <span style={{ fontSize: '1rem', color: '#34d399', fontWeight: 800 }}>→</span>
                    </button>
                  )}

                  <div style={{ padding: '4px 0' }}>
                    <button
                      type="button"
                      className="cmcu-menu-row-btn"
                      onClick={() => {
                        setOpenMenu(null);
                        setShowProfileModal(true);
                      }}
                    >
                      <span className="cmcu-row-icon-badge">
                        <NavIcon name="user" size={16} />
                      </span>
                      <span>Thông tin tài khoản</span>
                    </button>

                    {currentRole === 'STUDENT' && (
                      <button
                        type="button"
                        className="cmcu-menu-row-btn"
                        onClick={() => {
                          setOpenMenu(null);
                          navigate('/my-tickets');
                        }}
                      >
                        <span className="cmcu-row-icon-badge">
                          <NavIcon name="tickets" size={16} />
                        </span>
                        <span>Ví vé &amp; Mã QR của tôi</span>
                      </button>
                    )}

                    {(currentRole === 'STAFF' || currentRole === 'ADMIN') && (
                      <button
                        type="button"
                        className="cmcu-menu-row-btn"
                        onClick={() => {
                          setOpenMenu(null);
                          navigate('/admin/create');
                        }}
                      >
                        <span className="cmcu-row-icon-badge">
                          <NavIcon name="create" size={16} />
                        </span>
                        <span>Tạo sự kiện mới</span>
                      </button>
                    )}
                  </div>

                  <button type="button" className="cmcu-menu-row-btn danger" onClick={handleLogout}>
                    <span className="cmcu-row-icon-badge">
                      <NavIcon name="logout" size={16} />
                    </span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '10px',
                background: '#2dc275',
                color: '#052e16',
                fontWeight: 700,
                fontSize: '0.82rem',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(45, 194, 117, 0.3)'
              }}
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </header>

      <nav className="cmcu-mobile-bottom-bar" aria-label="Menu di động">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === '/' && location.pathname.startsWith('/events'));

          return (
            <Link
              key={`mob-${item.path}`}
              to={item.path}
              className={`cmcu-mobile-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => setOpenMenu(null)}
            >
              <NavIcon name={item.icon} size={19} />
              <span>{item.mobileLabel}</span>
            </Link>
          );
        })}
      </nav>

      {isStaff && (
        <div className="staff-fab-wrapper">
          {floatingTaskOpen && (
            <div className="staff-floating-panel">
              <div className="staff-floating-head">
                <div>
                  <strong style={{ fontSize: '0.94rem', color: '#fcd34d' }}>
                    📋 Checklist Task nhanh (Staff)
                  </strong>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    {pendingStaffTasks.length} việc cần làm
                    {overdueStaffTasks.length > 0 ? ` • ⚠️ ${overdueStaffTasks.length} quá hạn` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Link
                    to="/admin/tasks"
                    onClick={() => setFloatingTaskOpen(false)}
                    style={{ fontSize: '0.76rem', color: '#38bdf8', fontWeight: 700, textDecoration: 'underline' }}
                  >
                    Mở đầy đủ
                  </Link>
                  <button
                    type="button"
                    onClick={() => setFloatingTaskOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: '1rem' }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <form
                onSubmit={handleQuickAddFloatingTask}
                style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <select
                  value={quickTaskEventId}
                  onChange={(e) => setQuickTaskEventId(e.target.value)}
                  style={{
                    padding: '6px 9px',
                    borderRadius: '8px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    fontSize: '0.78rem'
                  }}
                >
                  {quickEventsList.map((ev) => (
                    <option key={ev.event_id} value={String(ev.event_id)}>
                      🎉 {ev.title}
                    </option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Nhập nhanh việc cần làm..."
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#f59e0b',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    + Thêm
                  </button>
                </div>
              </form>

              <div className="staff-floating-list">
                {staffTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '18px 10px', color: '#94a3b8', fontSize: '0.82rem' }}>
                    Chưa có task nào. Bấm "Mở đầy đủ" để tạo bộ 7 task chuẩn T-Minus.
                  </div>
                ) : (
                  staffTasks.slice(0, 8).map((t) => {
                    const isDone = t.status === 'DONE';
                    const isOverdue =
                      !isDone &&
                      t.deadline &&
                      !isNaN(new Date(t.deadline).getTime()) &&
                      new Date(t.deadline) < new Date();

                    return (
                      <div
                        key={t.id}
                        className="staff-floating-item"
                        style={{
                          borderColor: isOverdue ? 'rgba(239, 68, 68, 0.55)' : undefined,
                          opacity: isDone ? 0.65 : 1
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => handleToggleFloatingTask(t.id)}
                          style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#2dc275' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              textDecoration: isDone ? 'line-through' : 'none',
                              color: isOverdue ? '#fca5a5' : '#f8fafc'
                            }}
                          >
                            {t.title}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                            🎉 {t.event} {isOverdue ? '• ⚠️ Quá hạn' : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            className="staff-fab-btn"
            onClick={() => setFloatingTaskOpen((prev) => !prev)}
            title="Mở nhanh danh sách công việc của Staff"
          >
            <span>📋 Task của tôi</span>
            <span className="staff-fab-count">{pendingStaffTasks.length}</span>
          </button>
        </div>
      )}

      {showProfileModal && user && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div
            className="modal-content-premium"
            style={{ maxWidth: '460px', background: '#18181f', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4f46e5, #2dc275)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: '#fff'
                }}
              >
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff' }}>{user.full_name}</h3>
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '4px',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    background: 'rgba(45, 194, 117, 0.18)',
                    color: '#2dc275'
                  }}
                >
                  {currentRole}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#121216', padding: '16px', borderRadius: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: '#94a3b8' }}>Tên đăng nhập:</span>
                <strong>{user.username || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ color: '#94a3b8' }}>Mã định danh / MSSV:</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: '#38bdf8' }}>{user.student_code || `ID-${user.user_id}`}</strong>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: '1px solid #334155',
                      background: '#1e293b',
                      color: '#e2e8f0',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedCode ? '✓ Đã chép' : 'Chép'}
                  </button>
                </span>
              </div>
              {user.class_name && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#94a3b8' }}>Lớp / Đơn vị:</span>
                  <strong>{user.class_name}</strong>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#e2e8f0',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="cmcu-layout-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <main className="cmcu-main-content">
          <Outlet context={{ colorMode, toggleColorMode }} />
        </main>

        <footer className="cmcu-official-footer">
          <div className="cmcu-footer-grid">
            <div>
              <h4 className="cmcu-footer-heading">🛠️ Hỗ trợ Sinh viên &amp; Sự cố Vé QR</h4>
              <ul className="cmcu-footer-list">
                <li>
                  <strong>Phòng Công tác Sinh viên (OSA):</strong> Hỗ trợ lỗi vé QR, sai thông tin MSSV, cập nhật điểm rèn luyện sự kiện.
                </li>
                <li>
                  📧 Email hỗ trợ:{' '}
                  <a href="mailto:osa@cmcu.edu.vn" className="cmcu-footer-link">
                    osa@cmcu.edu.vn
                  </a>
                </li>
                <li>
                  📞 Hotline Hà Nội (CS1 Vạn Phúc):{' '}
                  <a href="tel:0976373596" className="cmcu-footer-link">
                    0976.373.596
                  </a>{' '}
                  • CS2 / Zalo:{' '}
                  <a href="tel:0976497490" className="cmcu-footer-link">
                    0976.497.490
                  </a>
                </li>
                <li>
                  📞 Hotline TP.HCM (Tân Thuận):{' '}
                  <a href="tel:02471019999" className="cmcu-footer-link">
                    024 7101 9999 (Nhánh 7)
                  </a>
                </li>
                <li>
                  🏢 Văn phòng CTSV: Phòng 102, Tầng 1, Số 84C Nguyễn Thanh Bình, Hà Đông, Hà Nội.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="cmcu-footer-heading">🏫 Hệ thống Cơ sở Trường Đại học CMC</h4>
              <ul className="cmcu-footer-list">
                <li>
                  <strong>Trụ sở chính:</strong> Tòa nhà CMC Tower, Số 11 Duy Tân, Cầu Giấy, Hà Nội.
                </li>
                <li>
                  <strong>Cơ sở Hà Nội 1:</strong> Số 84C, Đường Nguyễn Thanh Bình, Hà Đông, Hà Nội.
                </li>
                <li>
                  <strong>Cơ sở Hà Nội 2:</strong> Tòa nhà Vạn Phúc Building, Đường Tố Hữu, Hà Đông, Hà Nội.
                </li>
                <li>
                  <strong>Cơ sở Hà Nội 3:</strong> Tây Mỗ, Xuân Phương, Nam Từ Liêm, Hà Nội.
                </li>
                <li>
                  <strong>Cơ sở TP. Hồ Chí Minh:</strong> Tòa nhà CMC Creative Space, Đường số 19, KCX Tân Thuận, Phường Tân Thuận, TP.HCM.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="cmcu-footer-heading">🌐 Kênh chính thức CMCU &amp; Đoàn – Hội</h4>
              <p style={{ fontSize: '0.84rem', margin: '0 0 10px 0', lineHeight: 1.5 }}>
                Theo dõi lịch sự kiện mới nhất của Đoàn Thanh niên – Hội Sinh viên và Nhà trường tại các kênh chính thức:
              </p>
              <div className="cmcu-social-pills">
                <a href="https://cmcu.edu.vn/" target="_blank" rel="noopener noreferrer" className="cmcu-social-pill-link">
                  🌐 Website CMCU
                </a>
                <a href="https://www.facebook.com/TruongDaiHocCMC" target="_blank" rel="noopener noreferrer" className="cmcu-social-pill-link">
                  📘 Fanpage Trường ĐH CMC
                </a>
                <a href="https://www.facebook.com/groups/sinhvientruongdaihoccmc" target="_blank" rel="noopener noreferrer" className="cmcu-social-pill-link">
                  👥 Cộng đồng SV CMCU
                </a>
                <a href="https://www.youtube.com/@cmcuniversity" target="_blank" rel="noopener noreferrer" className="cmcu-social-pill-link">
                  ▶️ YouTube Official
                </a>
                <a href="https://www.tiktok.com/@cmcuniversity" target="_blank" rel="noopener noreferrer" className="cmcu-social-pill-link">
                  🎵 TikTok @cmcuniversity
                </a>
              </div>
              <div style={{ marginTop: '14px', fontSize: '0.8rem', opacity: 0.8 }}>
                Tổng đài Văn phòng Nhà trường:{' '}
                <a href="tel:02471019999" className="cmcu-footer-link">
                  024 7101 9999
                </a>{' '}
                • Email:{' '}
                <a href="mailto:oga@cmcu.edu.vn" className="cmcu-footer-link">
                  oga@cmcu.edu.vn
                </a>
              </div>
            </div>
          </div>

          <div
            style={{
              maxWidth: '1240px',
              margin: '24px auto 0 auto',
              paddingTop: '16px',
              borderTop: '1px solid rgba(148, 163, 184, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              fontSize: '0.8rem',
              opacity: 0.78
            }}
          >
            <span>© 2026 Trường Đại học CMC (CMC University) — Hệ thống Quản trị Sự kiện &amp; Điểm danh QR.</span>
            <span>Phát triển bởi CMCU Student Dev Team</span>
          </div>
        </footer>
      </div>
    </div>
  );
}