import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const STATUS_LABEL = {
  OPEN: 'Đang mở',
  FULL: 'Hết chỗ',
  CLOSED: 'Đã đóng',
  REJECTED: 'Bị từ chối',
  PENDING: 'Chờ duyệt',
};

const STATUS_BADGE_STYLE = {
  OPEN: { bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' },
  FULL: { bg: 'rgba(245, 158, 11, 0.18)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' },
  CLOSED: { bg: 'rgba(239, 68, 68, 0.18)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)' },
  REJECTED: { bg: 'rgba(239, 68, 68, 0.18)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)' },
  PENDING: { bg: 'rgba(59, 130, 246, 0.18)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.4)' },
};

export default function AdminEvents() {
  const { user } = useAuth();
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/events');
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data?.data || res.data?.events || []);
        setAllEvents(list);
      } catch (err) {
        console.error('Lỗi tải danh sách sự kiện:', err);
        setError('Không thể tải danh sách sự kiện. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword, statusFilter]);

  const stats = useMemo(() => {
    const total = allEvents.length;
    const openCount = allEvents.filter((e) => (e.status || 'OPEN').toUpperCase() === 'OPEN').length;
    const closedCount = allEvents.filter((e) => (e.status || 'OPEN').toUpperCase() !== 'OPEN').length;
    const totalRegistered = allEvents.reduce((acc, e) => acc + (e.registered_count || 0), 0);
    const totalCapacity = allEvents.reduce((acc, e) => acc + (e.seat_capacity || e.capacity || 0), 0);
    const fillRate = totalCapacity > 0 ? Math.round((totalRegistered / totalCapacity) * 100) : 0;
    return { total, openCount, closedCount, totalRegistered, totalCapacity, fillRate };
  }, [allEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      const q = searchKeyword.trim().toLowerCase();
      const matchKeyword =
        !q ||
        (event.title || '').toLowerCase().includes(q) ||
        (event.location || '').toLowerCase().includes(q) ||
        String(event.event_id || event.id || '').includes(q);

      const status = (event.status || 'OPEN').toUpperCase();
      let matchStatus = true;
      if (statusFilter === 'OPEN') matchStatus = status === 'OPEN';
      if (statusFilter === 'CLOSED') matchStatus = status === 'CLOSED' || status === 'REJECTED';
      if (statusFilter === 'FULL') {
        const reg = event.registered_count || 0;
        const cap = event.seat_capacity || event.capacity || 0;
        matchStatus = status === 'FULL' || (cap > 0 && reg >= cap);
      }

      return matchKeyword && matchStatus;
    });
  }, [allEvents, searchKeyword, statusFilter]);

  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE) || 1;
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="admin-dashboard-container">
      <style>{`

        .page-header-glass {
          background: rgba(18, 22, 33, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
        }
        .page-header-icon {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          background: linear-gradient(135deg, #2dc275 0%, #16a34a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          box-shadow: 0 8px 24px rgba(45, 194, 117, 0.35);
          flex-shrink: 0;
        }
        .page-header-title {
          font-size: 1.6rem;
          font-weight: 900;
          color: #ffffff;
          margin: 0 0 6px 0;
          letter-spacing: -0.5px;
        }
        .page-header-subtitle {
          font-size: 0.92rem;
          color: #94a3b8;
          margin: 0;
        }

        .kpi-metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .kpi-metric-card {
          background: rgba(18, 22, 33, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 18px 20px;
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .kpi-metric-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 255, 255, 0.22);
        }
        .kpi-metric-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.45rem;
          flex-shrink: 0;
        }
        .kpi-metric-val {
          font-size: 1.55rem;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.1;
          margin: 0 0 4px 0;
        }
        .kpi-metric-lbl {
          font-size: 0.78rem;
          color: #94a3b8;
          font-weight: 600;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .admin-events-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          background: rgba(18, 22, 33, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 14px 20px;
          margin-bottom: 20px;
          backdrop-filter: blur(16px);
        }
        .filter-status-pills {
          display: flex;
          gap: 6px;
          background: rgba(30, 41, 59, 0.6);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          flex-wrap: wrap;
        }
        .filter-pill-btn {
          border: none;
          background: transparent;
          color: #94a3b8;
          padding: 7px 16px;
          border-radius: 9px;
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-pill-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.08);
        }
        .filter-pill-btn.active {
          background: #2dc275;
          color: #052e16;
          box-shadow: 0 4px 12px rgba(45, 194, 117, 0.35);
        }
        .search-input-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-input-box input {
          background: #1e293b !important;
          border: 1px solid rgba(255, 255, 255, 0.16) !important;
          color: #f8fafc !important;
          padding: 9px 34px 9px 36px;
          border-radius: 12px;
          font-size: 0.86rem;
          outline: none;
          min-width: 260px;
          transition: all 0.2s ease;
        }
        .search-input-box input:focus {
          border-color: #2dc275 !important;
          box-shadow: 0 0 0 3px rgba(45, 194, 117, 0.25) !important;
        }
        .search-icon-svg {
          position: absolute;
          left: 12px;
          color: #94a3b8;
          pointer-events: none;
        }

        .glass-table-card {
          background: rgba(18, 22, 33, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
        }
        .glass-table-header {
          padding: 18px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        .glass-table-title {
          font-size: 1.12rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .admin-table-custom {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .admin-table-custom thead th {
          background: rgba(30, 41, 59, 0.85);
          color: #94a3b8;
          font-size: 0.76rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }
        .admin-table-custom tbody tr {
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          transition: background 0.18s ease;
        }
        .admin-table-custom tbody tr:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        .admin-table-custom tbody td {
          padding: 16px 20px;
          font-size: 0.88rem;
          color: #e2e8f0;
          vertical-align: middle;
        }

        .row-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .row-action-btn.view {
          background: rgba(59, 130, 246, 0.16);
          color: #60a5fa;
          border-color: rgba(59, 130, 246, 0.35);
        }
        .row-action-btn.view:hover {
          background: #2563eb;
          color: #ffffff;
        }
        .row-action-btn.edit {
          background: rgba(245, 158, 11, 0.16);
          color: #fbbf24;
          border-color: rgba(245, 158, 11, 0.35);
        }
        .row-action-btn.edit:hover {
          background: #d97706;
          color: #ffffff;
        }
        .row-action-btn.qr {
          background: rgba(45, 194, 117, 0.16);
          color: #34d399;
          border-color: rgba(45, 194, 117, 0.35);
        }
        .row-action-btn.qr:hover {
          background: #2dc275;
          color: #052e16;
        }

        .admin-pagination-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(15, 23, 42, 0.5);
          flex-wrap: wrap;
          gap: 12px;
        }
      `}</style>

      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>

      <div className="page-header-glass">
        <div className="page-header-icon">
          <span>🏛️</span>
        </div>
        <div className="page-header-text">
          <h1 className="page-header-title">Quản Lý &amp; Kiểm Soát Sự Kiện CMCU</h1>
          <p className="page-header-subtitle">
            Hệ thống quản trị danh mục sự kiện, kiểm soát sức chứa, theo dõi tiến độ đăng ký và soát vé tự động.
          </p>
        </div>
      </div>

      <div className="kpi-metric-grid">
        <div className="kpi-metric-card">
          <div className="kpi-metric-icon-box" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
            <span>📋</span>
          </div>
          <div>
            <div className="kpi-metric-val">{stats.total}</div>
            <div className="kpi-metric-lbl">Tổng số sự kiện</div>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-metric-icon-box" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
            <span>🟢</span>
          </div>
          <div>
            <div className="kpi-metric-val">{stats.openCount}</div>
            <div className="kpi-metric-lbl">Đang mở đăng ký</div>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-metric-icon-box" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
            <span>👥</span>
          </div>
          <div>
            <div className="kpi-metric-val">{stats.totalRegistered}</div>
            <div className="kpi-metric-lbl">Tổng vé sinh viên</div>
          </div>
        </div>

        <div className="kpi-metric-card">
          <div className="kpi-metric-icon-box" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
            <span>⚡</span>
          </div>
          <div>
            <div className="kpi-metric-val">{stats.fillRate}%</div>
            <div className="kpi-metric-lbl">Tỷ lệ lấp đầy chỗ</div>
          </div>
        </div>
      </div>

      <div className="admin-events-toolbar">

        <div className="filter-status-pills">
          <button
            type="button"
            className={`filter-pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Tất cả ({allEvents.length})
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${statusFilter === 'OPEN' ? 'active' : ''}`}
            onClick={() => setStatusFilter('OPEN')}
          >
            🟢 Đang mở ({stats.openCount})
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${statusFilter === 'FULL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('FULL')}
          >
            🔥 Sắp đầy / Hết chỗ
          </button>
          <button
            type="button"
            className={`filter-pill-btn ${statusFilter === 'CLOSED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('CLOSED')}
          >
            🔒 Đã đóng ({stats.closedCount})
          </button>
        </div>

        <div className="search-input-box">
          <svg className="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên sự kiện, địa điểm, mã #ID..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword('')}
              style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="glass-table-card">
        <div className="glass-table-header">
          <h3 className="glass-table-title">
            <span>📋 Danh Sách Sự Kiện</span>
            <span style={{ fontSize: '0.78rem', background: 'rgba(45, 194, 117, 0.18)', color: '#2dc275', padding: '3px 10px', borderRadius: '999px', fontWeight: 800 }}>
              {filteredEvents.length} sự kiện
            </span>
          </h3>

          <Link
            to="/admin/create"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2dc275 0%, #16a34a 100%)',
              color: '#052e16',
              fontWeight: 800,
              fontSize: '0.84rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(45, 194, 117, 0.35)'
            }}
          >
            ➕ Tạo sự kiện mới
          </Link>
        </div>

        {loading && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#2dc275', fontWeight: 700 }}>
            ⏳ Đang đồng bộ danh mục sự kiện từ SQL Server...
          </div>
        )}

        {error && (
          <div style={{ padding: '30px', color: '#EF4444', fontWeight: 600, textAlign: 'center' }}>
            ❌ {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table-custom">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Sự kiện</th>
                  <th style={{ width: '18%' }}>Thời gian bắt đầu</th>
                  <th style={{ width: '16%' }}>Địa điểm</th>
                  <th style={{ width: '15%' }}>Lấp đầy / Sức chứa</th>
                  <th style={{ width: '10%' }}>Trạng thái</th>
                  <th style={{ width: '9%', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#64748B', padding: '50px 20px' }}>
                      <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🔍</span>
                      Không tìm thấy sự kiện nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  paginatedEvents.map((event) => {
                    const eventId = event.event_id ?? event.id;
                    const registered = event.registered_count ?? 0;
                    const capacity = event.seat_capacity ?? event.capacity ?? 0;
                    const percent = capacity > 0 ? Math.min(100, Math.round((registered / capacity) * 100)) : 0;
                    const isHigh = percent >= 85;
                    const status = (event.status || 'OPEN').toUpperCase();
                    const badgeStyle = STATUS_BADGE_STYLE[status] || STATUS_BADGE_STYLE.OPEN;

                    const startDate = event.start_time
                      ? new Date(event.start_time).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })
                      : '—';

                    return (
                      <tr key={eventId}>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>🎉</span>
                            <div>
                              <Link
                                to={`/events/${eventId}`}
                                style={{
                                  fontWeight: 800,
                                  color: '#f8fafc',
                                  textDecoration: 'none',
                                  fontSize: '0.94rem',
                                  lineHeight: 1.4,
                                  display: 'block',
                                  marginBottom: '4px'
                                }}
                              >
                                {event.title}
                              </Link>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', color: '#94a3b8', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                  #{eventId}
                                </span>
                                {event.category && (
                                  <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                                    • {event.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div style={{ color: '#cbd5e1', fontWeight: 600 }}>
                            📅 {startDate}
                          </div>
                        </td>

                        <td>
                          <div style={{ color: '#cbd5e1' }}>
                            📍 {event.location || 'Chưa xác định'}
                          </div>
                        </td>

                        <td>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                              <span style={{ fontWeight: 800, color: isHigh ? '#f87171' : '#34d399' }}>
                                {registered} / {capacity} chỗ
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>
                                {percent}%
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${percent}%`,
                                  height: '100%',
                                  background: isHigh
                                    ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                                    : 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              background: badgeStyle.bg,
                              color: badgeStyle.color,
                              border: badgeStyle.border
                            }}
                          >
                            {STATUS_LABEL[status] || status}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <Link
                              to={`/events/${eventId}`}
                              className="row-action-btn view"
                              title="Xem chi tiết sự kiện"
                            >
                              Chi tiết
                            </Link>
                            <Link
                              to={`/events/${eventId}?edit=true`}
                              className="row-action-btn edit"
                              title="Chỉnh sửa thông tin"
                            >
                              Sửa
                            </Link>
                            <Link
                              to="/staff/checkin"
                              className="row-action-btn qr"
                              title="Trạm quét QR soát vé"
                            >
                              Quét
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="admin-pagination-strip">
            <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
              Hiển thị <strong>{paginatedEvents.length}</strong> / <strong>{filteredEvents.length}</strong> sự kiện (Trang {currentPage} / {totalPages})
            </span>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.4 : 1
                }}
              >
                ‹ Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCurrentPage(num)}
                  style={{
                    minWidth: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: currentPage === num ? '#2dc275' : 'rgba(255,255,255,0.12)',
                    background: currentPage === num ? '#2dc275' : 'rgba(255,255,255,0.06)',
                    color: currentPage === num ? '#052e16' : '#cbd5e1',
                    fontSize: '0.82rem',
                    fontWeight: currentPage === num ? 900 : 600,
                    cursor: 'pointer'
                  }}
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.4 : 1
                }}
              >
                Sau ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
