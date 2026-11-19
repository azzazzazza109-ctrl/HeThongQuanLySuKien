import { useEffect, useState, useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const AUDIT_LOG_STORAGE_KEY = 'cmcu_approval_audit_logs_v1';

const FALLBACK_PENDING_EVENTS = [
    {
        event_id: 901,
        title: 'Hội thảo AI & Tương lai',
        description: 'Chia sẻ xu hướng ứng dụng trí tuệ nhân tạo trong phát triển phần mềm doanh nghiệp.',
        location: 'Hội trường A - CS1 Vạn Phúc',
        start_time: '2026-11-15T08:30:00',
        end_time: '2026-11-15T11:30:00',
        seat_capacity: 150,
        registered_count: 0,
        status: 'PENDING',
        creator_name: 'Trần Duy Long',
        faculty: 'Khoa CNTT & Truyền thông',
        isMock: true
    },
    {
        event_id: 902,
        title: 'Workshop Kỹ năng mềm & Thuyết trình',
        description: 'Rèn luyện tư duy phản biện, kỹ năng thuyết trình trước đám đông dành cho sinh viên năm nhất.',
        location: 'Hội trường lớn - Tòa nhà CMC',
        start_time: '2026-11-20T14:00:00',
        end_time: '2026-11-20T17:00:00',
        seat_capacity: 120,
        registered_count: 0,
        status: 'PENDING',
        creator_name: 'Nguyễn Văn A',
        faculty: 'Khoa Ngôn ngữ & Văn hóa',
        isMock: true
    },
    {
        event_id: 903,
        title: 'Cuộc thi CodeFest 2026',
        description: 'Đấu trường lập trình thuật toán và phát triển sản phẩm công nghệ cấp trường.',
        location: 'Phòng Lab 302 - CS1',
        start_time: '2026-12-01T08:00:00',
        end_time: '2026-12-01T17:00:00',
        seat_capacity: 80,
        registered_count: 0,
        status: 'PENDING',
        creator_name: 'Lê Thị B',
        faculty: 'Khoa CNTT & Truyền thông',
        isMock: true
    },
    {
        event_id: 904,
        title: 'Ngày hội hiến máu nhân đạo CMCU',
        description: 'Chương trình hiến máu tình nguyện phối hợp cùng Viện Huyết học - Truyền máu Trung ương.',
        location: 'Hội trường lớn - Tòa nhà CMC',
        start_time: '2026-11-20T13:30:00',
        end_time: '2026-11-20T16:30:00',
        seat_capacity: 200,
        registered_count: 0,
        status: 'PENDING',
        creator_name: 'Phạm Văn C',
        faculty: 'Đoàn Thanh niên – Hội SV',
        isMock: true
    }
];

const QUICK_REJECT_REASONS = [
    'Thời gian tổ chức đã qua (quá khứ), đề nghị Staff cập nhật lại lịch.',
    'Trùng khung giờ và địa điểm với sự kiện khác đã đăng ký trước.',
    'Sức chứa ghế không phù hợp với quy mô phòng/hội trường.',
    'Thiếu thông tin mô tả chi tiết chương trình và khách mời.',
    'Khung giờ tổ chức nằm ngoài giờ hoạt động quy định (06:00 – 22:00).'
];

export default function AdminApprovals() {
    const { user } = useAuth();
    const outletContext = useOutletContext() || {};
    const isLight = outletContext.colorMode === 'light';

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toastMsg, setToastMsg] = useState('');

    const [activeFilter, setActiveFilter] = useState('PENDING');
    const [searchQuery, setSearchQuery] = useState('');

    const [inspectEvent, setInspectEvent] = useState(null);

    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const [auditLogs, setAuditLogs] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(AUDIT_LOG_STORAGE_KEY) || '[]');
            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    });
    const [showAuditDrawer, setShowAuditDrawer] = useState(false);

    const notify = (text) => {
        setToastMsg(text);
        setTimeout(() => setToastMsg(''), 4000);
    };

    const appendAuditLog = (eventItem, action, reason = '') => {
        const entry = {
            id: `${Date.now()}`,
            event_id: eventItem.event_id,
            event_title: eventItem.title,
            action,
            actor: user?.full_name || 'Admin CMCU',
            reason,
            timestamp: new Date().toLocaleString('vi-VN')
        };
        setAuditLogs((prev) => {
            const next = [entry, ...prev].slice(0, 30);
            try {
                localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(next));
            } catch {

            }
            return next;
        });
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/events');
            const realList = Array.isArray(res.data)
                ? res.data
                : (res.data?.data || res.data?.events || []);

            const hasRealPending = realList.some((e) => (e.status || '').toUpperCase() === 'PENDING');
            if (hasRealPending) {
                setEvents(realList);
            } else {

                setEvents([...FALLBACK_PENDING_EVENTS, ...realList]);
            }
        } catch (err) {
            console.error('Lỗi tải danh sách kiểm duyệt:', err);
            setEvents(FALLBACK_PENDING_EVENTS);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const evaluatedEvents = useMemo(() => {
        const now = new Date();

        return events.map((ev) => {
            const issues = [];
            const start = new Date(ev.start_time);
            const end = new Date(ev.end_time);
            const isValidTime = !isNaN(start.getTime()) && !isNaN(end.getTime());

            const isExpired = isValidTime && start < now;
            if (isExpired) {
                issues.push({
                    level: 'CRITICAL',
                    code: 'EXPIRED_TIME',
                    text: 'Ngày tổ chức đã nằm ở quá khứ — Không thể phê duyệt!'
                });
            }

            if (isValidTime && (start.getHours() < 6 || start.getHours() >= 22)) {
                issues.push({
                    level: 'WARNING',
                    code: 'ODD_HOUR',
                    text: `Giờ bắt đầu (${start.getHours()}:00) ngoài khung giờ hoạt động (06:00 - 22:00).`
                });
            }

            const conflicts = events.filter((other) => {
                if (other.event_id === ev.event_id) return false;
                if ((other.status || '').toUpperCase() === 'REJECTED') return false;
                const sameLoc =
                    (other.location || '').trim().toLowerCase() ===
                    (ev.location || '').trim().toLowerCase();
                if (!sameLoc || !isValidTime) return false;

                const oStart = new Date(other.start_time);
                const oEnd = new Date(other.end_time);
                if (isNaN(oStart.getTime()) || isNaN(oEnd.getTime())) return false;

                return start < oEnd && end > oStart;
            });

            if (conflicts.length > 0) {
                issues.push({
                    level: 'WARNING',
                    code: 'VENUE_CONFLICT',
                    text: `Trùng địa điểm "${ev.location}" với: ${conflicts.map((c) => c.title).join(', ')}`
                });
            }

            const cap = Number(ev.seat_capacity) || 0;
            if ((ev.location || '').toLowerCase().includes('hội trường') && cap < 20) {
                issues.push({
                    level: 'WARNING',
                    code: 'LOW_CAPACITY',
                    text: `Sức chứa (${cap} chỗ) quá nhỏ so với quy mô Hội trường.`
                });
            }
            if (!(ev.description || '').trim()) {
                issues.push({
                    level: 'WARNING',
                    code: 'MISSING_DESC',
                    text: 'Thiếu nội dung mô tả chi tiết sự kiện.'
                });
            }

            const hasCritical = issues.some((i) => i.level === 'CRITICAL');
            const hasWarning = issues.some((i) => i.level === 'WARNING');

            return {
                ...ev,
                issues,
                hasCritical,
                hasWarning,
                isExpired
            };
        });
    }, [events]);

    const handleApprove = async (ev) => {
        if (ev.hasCritical) {
            notify('❌ Không thể duyệt sự kiện vi phạm điều kiện bắt buộc (Đã quá ngày diễn ra).');
            return;
        }

        if (ev.hasWarning) {
            const ok = window.confirm(
                `⚠️ Sự kiện "${ev.title}" đang có cảnh báo:\n- ${ev.issues.map((i) => i.text).join('\n- ')}\n\nBạn vẫn xác nhận phê duyệt chứ?`
            );
            if (!ok) return;
        }

        try {
            if (!ev.isMock) {
                await apiClient.put(`/admin/events/${ev.event_id}`, {
                    admin_user_id: user?.user_id,
                    title: ev.title,
                    description: ev.description,
                    location: ev.location,
                    start_time: ev.start_time,
                    end_time: ev.end_time,
                    seat_capacity: Number(ev.seat_capacity),
                    cancel_deadline_hours: Number(ev.cancel_deadline_hours || 24),
                    status: 'OPEN',
                    eligibility: []
                });
            }

            setEvents((prev) =>
                prev.map((item) => (item.event_id === ev.event_id ? { ...item, status: 'OPEN' } : item))
            );
            appendAuditLog(ev, 'APPROVED');
            setInspectEvent(null);
            notify(`✅ Đã phê duyệt và mở cổng đăng ký cho "${ev.title}"!`);
        } catch (err) {
            notify('❌ Lỗi phê duyệt: ' + (err.response?.data?.message || err.message));
        }
    };

    const openRejectModal = (ev) => {
        setRejectTarget(ev);
        setRejectReason(ev.isExpired ? QUICK_REJECT_REASONS[0] : '');
    };

    const handleConfirmReject = async (e) => {
        e.preventDefault();
        if (!rejectTarget) return;
        if (!rejectReason.trim()) {
            notify('❌ Bắt buộc phải nhập lý do từ chối để Staff nắm được thông tin chỉnh sửa.');
            return;
        }

        try {
            if (!rejectTarget.isMock) {
                await apiClient.put(`/admin/events/${rejectTarget.event_id}`, {
                    admin_user_id: user?.user_id,
                    title: rejectTarget.title,
                    description: rejectTarget.description,
                    location: rejectTarget.location,
                    start_time: rejectTarget.start_time,
                    end_time: rejectTarget.end_time,
                    seat_capacity: Number(rejectTarget.seat_capacity),
                    cancel_deadline_hours: Number(rejectTarget.cancel_deadline_hours || 24),
                    status: 'REJECTED',
                    eligibility: []
                });
            }

            setEvents((prev) =>
                prev.map((item) =>
                    item.event_id === rejectTarget.event_id
                        ? { ...item, status: 'REJECTED', rejection_reason: rejectReason.trim() }
                        : item
                )
            );
            appendAuditLog(rejectTarget, 'REJECTED', rejectReason.trim());
            notify(`🚫 Đã từ chối sự kiện "${rejectTarget.title}" và gửi phản hồi cho Staff.`);
            setRejectTarget(null);
            setInspectEvent(null);
            setRejectReason('');
        } catch (err) {
            notify('❌ Lỗi khi từ chối sự kiện: ' + (err.response?.data?.message || err.message));
        }
    };

    const pendingList = evaluatedEvents.filter((e) => (e.status || '').toUpperCase() === 'PENDING');
    const flaggedList = pendingList.filter((e) => e.hasCritical || e.hasWarning);
    const approvedList = evaluatedEvents.filter((e) => (e.status || '').toUpperCase() === 'OPEN');
    const rejectedList = evaluatedEvents.filter((e) => (e.status || '').toUpperCase() === 'REJECTED');

    const displayedEvents = evaluatedEvents.filter((ev) => {
        const st = (ev.status || '').toUpperCase();
        if (activeFilter === 'PENDING' && st !== 'PENDING') return false;
        if (activeFilter === 'FLAGGED' && !(st === 'PENDING' && (ev.hasCritical || ev.hasWarning))) return false;
        if (activeFilter === 'APPROVED' && st !== 'OPEN') return false;
        if (activeFilter === 'REJECTED' && st !== 'REJECTED') return false;

        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
            (ev.title || '').toLowerCase().includes(q) ||
            (ev.location || '').toLowerCase().includes(q) ||
            (ev.creator_name || '').toLowerCase().includes(q) ||
            (ev.faculty || '').toLowerCase().includes(q)
        );
    });

    if (loading) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', color: '#2dc275', fontWeight: 700 }}>
                ⏳ Đang tải hàng đợi kiểm duyệt sự kiện...
            </div>
        );
    }

    return (
        <div className={`cmcu-approval-root ${isLight ? 'apv-light' : 'apv-dark'}`}>
            <style>{`
                .cmcu-approval-root {
                    max-width: 1240px;
                    margin: 0 auto;
                    border-radius: 22px;
                    padding: 24px 26px 48px 26px;
                    transition: all 0.25s ease;
                }
                .apv-dark {
                    background: #121216;
                    color: #f8fafc;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .apv-light {
                    background: #ffffff;
                    color: #0f172a;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 12px 32px -10px rgba(15, 23, 42, 0.08);
                }
                @media (max-width: 768px) {
                    .cmcu-approval-root { padding: 16px 14px 32px 14px; }
                }

                .apv-top-banner {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin-bottom: 22px;
                    padding-bottom: 18px;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
                }
                .apv-kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 14px;
                    margin-bottom: 22px;
                }
                @media (max-width: 900px) {
                    .apv-kpi-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 520px) {
                    .apv-kpi-grid { grid-template-columns: 1fr; }
                }
                .apv-kpi-card {
                    padding: 16px 18px;
                    border-radius: 16px;
                    cursor: pointer;
                    transition: transform 0.2s ease, border-color 0.2s ease;
                }
                .apv-dark .apv-kpi-card {
                    background: #1a1b23;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .apv-light .apv-kpi-card {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                }
                .apv-kpi-card:hover {
                    transform: translateY(-3px);
                    border-color: #2dc275;
                }
                .apv-kpi-card.active-kpi {
                    border-color: #2dc275 !important;
                    box-shadow: 0 8px 22px rgba(45, 194, 117, 0.18);
                }

                .apv-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 18px;
                }
                .apv-tab-group {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .apv-tab-pill {
                    padding: 7px 15px;
                    border-radius: 999px;
                    font-size: 0.83rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .apv-dark .apv-tab-pill {
                    background: #1e1f28;
                    color: #cbd5e1;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                }
                .apv-light .apv-tab-pill {
                    background: #f1f5f9;
                    color: #475569;
                    border: 1px solid #cbd5e1;
                }
                .apv-tab-pill.active {
                    background: #2dc275 !important;
                    color: #052e16 !important;
                    border-color: #2dc275 !important;
                    font-weight: 800;
                }
                .apv-search-input {
                    padding: 8px 14px;
                    border-radius: 999px;
                    font-size: 0.86rem;
                    min-width: 260px;
                    outline: none;
                }
                .apv-dark .apv-search-input {
                    background: #1a1b23;
                    border: 1px solid rgba(255, 255, 255, 0.16);
                    color: #ffffff;
                }
                .apv-light .apv-search-input {
                    background: #f8fafc;
                    border: 1px solid #cbd5e1;
                    color: #0f172a;
                }

                .apv-queue-list {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .apv-item-card {
                    border-radius: 16px;
                    padding: 18px 20px;
                    display: grid;
                    grid-template-columns: 1.5fr 1fr auto;
                    gap: 18px;
                    align-items: center;
                    transition: all 0.2s ease;
                }
                .apv-dark .apv-item-card {
                    background: #191a22;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .apv-light .apv-item-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
                }
                .apv-item-card.card-critical {
                    border-left: 4px solid #ef4444 !important;
                }
                .apv-item-card.card-warning {
                    border-left: 4px solid #f59e0b !important;
                }
                .apv-item-card.card-clean {
                    border-left: 4px solid #2dc275 !important;
                }
                @media (max-width: 960px) {
                    .apv-item-card {
                        grid-template-columns: 1fr;
                        gap: 14px;
                    }
                }

                .apv-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 10px;
                    border-radius: 999px;
                    font-size: 0.74rem;
                    font-weight: 800;
                }
                .apv-badge.pending { background: rgba(245, 158, 11, 0.18); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); }
                .apv-badge.open { background: rgba(16, 185, 129, 0.18); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }
                .apv-badge.rejected { background: rgba(239, 68, 68, 0.18); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
                .apv-badge.critical { background: #ef4444; color: #ffffff; }
                .apv-badge.warning { background: rgba(245, 158, 11, 0.22); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.45); }
                .apv-badge.clean { background: rgba(45, 194, 117, 0.16); color: #2dc275; border: 1px solid rgba(45, 194, 117, 0.35); }

                .apv-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .apv-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 9px 14px;
                    border-radius: 10px;
                    font-size: 0.84rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.18s ease;
                }
                .apv-btn.inspect {
                    background: rgba(59, 130, 246, 0.15);
                    color: #60a5fa;
                    border: 1px solid rgba(59, 130, 246, 0.38);
                }
                .apv-btn.inspect:hover {
                    background: #2563eb;
                    color: #ffffff;
                }
                .apv-btn.approve {
                    background: linear-gradient(135deg, #2dc275 0%, #10b981 100%);
                    color: #052e16;
                    border: none;
                    box-shadow: 0 4px 12px rgba(45, 194, 117, 0.32);
                }
                .apv-btn.approve:hover:not(:disabled) {
                    transform: translateY(-1px);
                    filter: brightness(1.06);
                }
                .apv-btn.approve:disabled {
                    background: #475569;
                    color: #cbd5e1;
                    box-shadow: none;
                    cursor: not-allowed;
                    opacity: 0.65;
                }
                .apv-btn.reject {
                    background: rgba(239, 68, 68, 0.14);
                    color: #f87171;
                    border: 1px solid rgba(239, 68, 68, 0.45);
                }
                .apv-btn.reject:hover {
                    background: #ef4444;
                    color: #ffffff;
                }
            `}</style>

            <div className="apv-top-banner">
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>🛡️ Trung tâm Kiểm duyệt Sự kiện CMCU</span>
                    </h1>
                    <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.78 }}>
                        Kiểm tra tự động tính hợp lệ thời gian, xung đột địa điểm và quy chuẩn tổ chức trước khi công bố vé QR.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        type="button"
                        className="apv-tab-pill"
                        onClick={() => setShowAuditDrawer((prev) => !prev)}
                    >
                        📜 Nhật ký kiểm duyệt ({auditLogs.length})
                    </button>
                </div>
            </div>

            {toastMsg && (
                <div
                    className={`custom-toast ${toastMsg.includes('❌') || toastMsg.includes('🚫') ? 'toast-error' : 'toast-success'}`}
                    style={{ marginBottom: '18px' }}
                >
                    {toastMsg}
                </div>
            )}

            <div className="apv-kpi-grid">
                <div
                    className={`apv-kpi-card ${activeFilter === 'PENDING' ? 'active-kpi' : ''}`}
                    onClick={() => setActiveFilter('PENDING')}
                >
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, opacity: 0.72, textTransform: 'uppercase' }}>
                        ⏳ Đang chờ duyệt
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24', marginTop: '4px' }}>
                        {pendingList.length}
                    </div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>Hàng đợi cần Admin xử lý</div>
                </div>

                <div
                    className={`apv-kpi-card ${activeFilter === 'FLAGGED' ? 'active-kpi' : ''}`}
                    onClick={() => setActiveFilter('FLAGGED')}
                >
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, opacity: 0.72, textTransform: 'uppercase' }}>
                        ⚠️ Vi phạm / Trùng lịch
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f87171', marginTop: '4px' }}>
                        {flaggedList.length}
                    </div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>Quá hạn hoặc trùng hội trường</div>
                </div>

                <div
                    className={`apv-kpi-card ${activeFilter === 'APPROVED' ? 'active-kpi' : ''}`}
                    onClick={() => setActiveFilter('APPROVED')}
                >
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, opacity: 0.72, textTransform: 'uppercase' }}>
                        ✅ Đã phê duyệt (OPEN)
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2dc275', marginTop: '4px' }}>
                        {approvedList.length}
                    </div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>Đang hiển thị trên cổng đăng ký</div>
                </div>

                <div
                    className={`apv-kpi-card ${activeFilter === 'REJECTED' ? 'active-kpi' : ''}`}
                    onClick={() => setActiveFilter('REJECTED')}
                >
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, opacity: 0.72, textTransform: 'uppercase' }}>
                        🚫 Đã từ chối
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#94a3b8', marginTop: '4px' }}>
                        {rejectedList.length}
                    </div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>Đã trả về kèm lý do</div>
                </div>
            </div>

            {showAuditDrawer && (
                <div
                    style={{
                        marginBottom: '20px',
                        padding: '16px 18px',
                        borderRadius: '16px',
                        background: isLight ? '#f8fafc' : '#181920',
                        border: '1px solid rgba(148, 163, 184, 0.25)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <strong style={{ fontSize: '0.95rem' }}>📜 Nhật ký thao tác phê duyệt (Audit Trail)</strong>
                        <button
                            type="button"
                            onClick={() => setShowAuditDrawer(false)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 700 }}
                        >
                            Đóng ✕
                        </button>
                    </div>
                    {auditLogs.length === 0 ? (
                        <p style={{ margin: 0, fontSize: '0.84rem', opacity: 0.75 }}>
                            Chưa có thao tác phê duyệt nào được ghi nhận trong phiên này.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                            {auditLogs.map((log) => (
                                <div
                                    key={log.id}
                                    style={{
                                        fontSize: '0.83rem',
                                        padding: '8px 12px',
                                        borderRadius: '10px',
                                        background: isLight ? '#ffffff' : 'rgba(255,255,255,0.04)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '8px'
                                    }}
                                >
                                    <span>
                                        <strong style={{ color: log.action === 'APPROVED' ? '#2dc275' : '#f87171' }}>
                                            [{log.action === 'APPROVED' ? 'ĐÃ DUYỆT' : 'TỪ CHỐI'}]
                                        </strong>{' '}
                                        <strong>{log.event_title}</strong> — bởi <em>{log.actor}</em>
                                        {log.reason ? ` (Lý do: ${log.reason})` : ''}
                                    </span>
                                    <span style={{ opacity: 0.7 }}>{log.timestamp}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="apv-toolbar">
                <div className="apv-tab-group">
                    <button
                        type="button"
                        className={`apv-tab-pill ${activeFilter === 'PENDING' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('PENDING')}
                    >
                        Chờ duyệt ({pendingList.length})
                    </button>
                    <button
                        type="button"
                        className={`apv-tab-pill ${activeFilter === 'FLAGGED' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('FLAGGED')}
                    >
                        Cần lưu ý ({flaggedList.length})
                    </button>
                    <button
                        type="button"
                        className={`apv-tab-pill ${activeFilter === 'APPROVED' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('APPROVED')}
                    >
                        Đã duyệt ({approvedList.length})
                    </button>
                    <button
                        type="button"
                        className={`apv-tab-pill ${activeFilter === 'REJECTED' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('REJECTED')}
                    >
                        Từ chối ({rejectedList.length})
                    </button>
                    <button
                        type="button"
                        className={`apv-tab-pill ${activeFilter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('ALL')}
                    >
                        Tất cả ({evaluatedEvents.length})
                    </button>
                </div>

                <input
                    type="text"
                    className="apv-search-input"
                    placeholder="🔍 Tìm tên sự kiện, Staff tạo, địa điểm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {displayedEvents.length === 0 ? (
                <div
                    style={{
                        padding: '44px 20px',
                        textAlign: 'center',
                        borderRadius: '16px',
                        border: '1px dashed rgba(148, 163, 184, 0.35)'
                    }}
                >
                    <p style={{ margin: 0, opacity: 0.78 }}>Không có sự kiện nào trong mục này.</p>
                </div>
            ) : (
                <div className="apv-queue-list">
                    {displayedEvents.map((ev) => {
                        const st = (ev.status || '').toUpperCase();
                        const cardBorderClass = ev.hasCritical
                            ? 'card-critical'
                            : ev.hasWarning
                                ? 'card-warning'
                                : 'card-clean';

                        return (
                            <div key={ev.event_id} className={`apv-item-card ${cardBorderClass}`}>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#38bdf8' }}>
                                            #{ev.event_id}
                                        </span>
                                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                                            {ev.title}
                                        </h3>
                                        {ev.isMock && (
                                            <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '6px', background: 'rgba(148,163,184,0.2)', color: '#94a3b8' }}>
                                                Dữ liệu kiểm thử
                                            </span>
                                        )}
                                    </div>

                                    <div style={{ fontSize: '0.84rem', opacity: 0.82, display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '8px' }}>
                                        <span>👤 Staff: <strong>{ev.creator_name || `User #${ev.created_by || 1}`}</strong></span>
                                        <span>📍 {ev.location}</span>
                                        <span>🪑 {ev.seat_capacity} chỗ</span>
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {ev.issues.length === 0 ? (
                                            <span className="apv-badge clean">✅ Đạt chuẩn quy định kiểm duyệt</span>
                                        ) : (
                                            ev.issues.map((iss, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`apv-badge ${iss.level === 'CRITICAL' ? 'critical' : 'warning'}`}
                                                >
                                                    {iss.level === 'CRITICAL' ? '⛔' : '⚠️'} {iss.text}
                                                </span>
                                            ))
                                        )}
                                    </div>

                                    {ev.rejection_reason && (
                                        <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#f87171', fontWeight: 600 }}>
                                            💬 Lý do từ chối: {ev.rejection_reason}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>
                                        🕒 {new Date(ev.start_time).toLocaleString('vi-VN')}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', opacity: 0.75 }}>
                                        Kết thúc: {new Date(ev.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div>
                                        {st === 'PENDING' && <span className="apv-badge pending">● Chờ duyệt</span>}
                                        {st === 'OPEN' && <span className="apv-badge open">● Đã duyệt (OPEN)</span>}
                                        {st === 'REJECTED' && <span className="apv-badge rejected">● Đã từ chối</span>}
                                        {st === 'CLOSED' && <span className="apv-badge rejected">● Đã đóng</span>}
                                    </div>
                                </div>

                                <div className="apv-actions">
                                    <button
                                        type="button"
                                        className="apv-btn inspect"
                                        onClick={() => setInspectEvent(ev)}
                                    >
                                        🔍 Soi chi tiết
                                    </button>

                                    {st === 'PENDING' && (
                                        <>
                                            <button
                                                type="button"
                                                className="apv-btn approve"
                                                disabled={ev.hasCritical}
                                                title={
                                                    ev.hasCritical
                                                        ? 'Không thể duyệt sự kiện đã quá ngày tổ chức'
                                                        : 'Phê duyệt và mở cổng đăng ký'
                                                }
                                                onClick={() => handleApprove(ev)}
                                            >
                                                ✓ Duyệt
                                            </button>

                                            <button
                                                type="button"
                                                className="apv-btn reject"
                                                onClick={() => openRejectModal(ev)}
                                            >
                                                ✕ Từ chối
                                            </button>
                                        </>
                                    )}

                                    {!ev.isMock && (
                                        <Link
                                            to={`/events/${ev.event_id}`}
                                            style={{
                                                fontSize: '0.8rem',
                                                color: '#38bdf8',
                                                fontWeight: 700,
                                                marginLeft: '4px',
                                                textDecoration: 'underline'
                                            }}
                                        >
                                            Trang SK ↗
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {inspectEvent && (
                <div className="modal-overlay" onClick={() => setInspectEvent(null)}>
                    <div
                        className="modal-content-premium"
                        style={{
                            maxWidth: '620px',
                            background: isLight ? '#ffffff' : '#181922',
                            color: isLight ? '#0f172a' : '#f8fafc',
                            border: '1px solid rgba(148, 163, 184, 0.25)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: 900 }}>
                            🔍 Hồ sơ Kiểm duyệt Sự kiện #{inspectEvent.event_id}
                        </h2>
                        <p style={{ margin: '0 0 18px 0', fontSize: '0.85rem', opacity: 0.75 }}>
                            Đề xuất bởi: <strong>{inspectEvent.creator_name || `User #${inspectEvent.created_by || 1}`}</strong> • Đơn vị: {inspectEvent.faculty || 'Đại học CMC'}
                        </p>

                        <div
                            style={{
                                padding: '16px',
                                borderRadius: '14px',
                                background: isLight ? '#f8fafc' : '#121216',
                                marginBottom: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                fontSize: '0.9rem'
                            }}
                        >
                            <div><strong>Tên sự kiện:</strong> {inspectEvent.title}</div>
                            <div><strong>Địa điểm:</strong> {inspectEvent.location}</div>
                            <div>
                                <strong>Thời gian:</strong>{' '}
                                {new Date(inspectEvent.start_time).toLocaleString('vi-VN')} →{' '}
                                {new Date(inspectEvent.end_time).toLocaleString('vi-VN')}
                            </div>
                            <div><strong>Sức chứa tối đa:</strong> {inspectEvent.seat_capacity} sinh viên</div>
                            <div>
                                <strong>Mô tả nội dung:</strong>{' '}
                                {inspectEvent.description || <em style={{ color: '#f59e0b' }}>(Chưa có mô tả chi tiết)</em>}
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <strong style={{ display: 'block', fontSize: '0.86rem', marginBottom: '8px', textTransform: 'uppercase', opacity: 0.8 }}>
                                Kết quả rà soát hệ thống:
                            </strong>
                            {inspectEvent.issues.length === 0 ? (
                                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(45, 194, 117, 0.15)', color: '#2dc275', fontWeight: 700, fontSize: '0.86rem' }}>
                                    ✅ Tất cả tiêu chí thời gian, địa điểm và sức chứa đều hợp lệ.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {inspectEvent.issues.map((iss, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                padding: '9px 12px',
                                                borderRadius: '10px',
                                                background: iss.level === 'CRITICAL' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.16)',
                                                color: iss.level === 'CRITICAL' ? '#f87171' : '#fbbf24',
                                                fontWeight: 700,
                                                fontSize: '0.84rem'
                                            }}
                                        >
                                            {iss.level === 'CRITICAL' ? '⛔ LỖI NGHIÊM TRỌNG: ' : '⚠️ CẢNH BÁO: '}
                                            {iss.text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setInspectEvent(null)}
                                className="apv-btn"
                                style={{ background: 'transparent', border: '1px solid #64748b', color: 'inherit' }}
                            >
                                Đóng
                            </button>

                            {(inspectEvent.status || '').toUpperCase() === 'PENDING' && (
                                <>
                                    <button
                                        type="button"
                                        className="apv-btn reject"
                                        onClick={() => openRejectModal(inspectEvent)}
                                    >
                                        ✕ Từ chối &amp; Ghi lý do
                                    </button>
                                    <button
                                        type="button"
                                        className="apv-btn approve"
                                        disabled={inspectEvent.hasCritical}
                                        onClick={() => handleApprove(inspectEvent)}
                                    >
                                        ✓ Phê duyệt ngay
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {rejectTarget && (
                <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
                    <div
                        className="modal-content-premium"
                        style={{
                            maxWidth: '520px',
                            background: isLight ? '#ffffff' : '#181922',
                            color: isLight ? '#0f172a' : '#f8fafc',
                            border: '1px solid rgba(239, 68, 68, 0.4)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 6px 0', color: '#f87171', fontSize: '1.25rem', fontWeight: 900 }}>
                            🚫 Từ chối phê duyệt sự kiện
                        </h3>
                        <p style={{ margin: '0 0 14px 0', fontSize: '0.86rem', opacity: 0.8 }}>
                            Sự kiện: <strong>{rejectTarget.title}</strong>. Vui lòng chọn hoặc nhập rõ lý do để Staff chỉnh sửa:
                        </p>

                        <form onSubmit={handleConfirmReject}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                                {QUICK_REJECT_REASONS.map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRejectReason(r)}
                                        style={{
                                            textAlign: 'left',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            background: rejectReason === r ? 'rgba(239, 68, 68, 0.22)' : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)'),
                                            color: 'inherit',
                                            border: rejectReason === r ? '1px solid #ef4444' : '1px solid transparent'
                                        }}
                                    >
                                        • {r}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                rows="3"
                                required
                                placeholder="Nhập chi tiết lý do từ chối..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    fontSize: '0.9rem',
                                    background: isLight ? '#f8fafc' : '#121216',
                                    color: 'inherit',
                                    border: '1px solid #475569',
                                    marginBottom: '16px'
                                }}
                            />

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setRejectTarget(null)}
                                    className="apv-btn"
                                    style={{ background: 'transparent', border: '1px solid #64748b', color: 'inherit' }}
                                >
                                    Hủy
                                </button>
                                <button type="submit" className="apv-btn reject" style={{ background: '#ef4444', color: '#ffffff' }}>
                                    Xác nhận Từ chối
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}