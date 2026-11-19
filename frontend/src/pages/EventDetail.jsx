import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useOutletContext, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getEventEnrichedData, generatePosterSvgDataUrl, CMCU_UNITS, getEventUrgencyStatus } from './EventList';

const MOCK_FALLBACK_EVENTS = [
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

function toLocalDatetimeInput(dateValue) {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const outletContext = useOutletContext() || {};
    const isLight = outletContext.colorMode === 'light';

    const currentRole = (user?.system_role || user?.role || '').toString().toUpperCase();
    const isAdminOrStaff = currentRole === 'ADMIN' || currentRole === 'STAFF';

    const [event, setEvent] = useState(null);
    const [userTicket, setUserTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [introCollapsed, setIntroCollapsed] = useState(true);
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!event?.start_time) return;
        const updateCountdown = () => {
            const diff = new Date(event.start_time).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft(null);
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            setTimeLeft({ days, hours, minutes, seconds });
        };
        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, [event?.start_time]);

    const [isEditing, setIsEditing] = useState(() => searchParams.get('edit') === 'true');
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        location: '',
        start_time: '',
        end_time: '',
        seat_capacity: 100,
        cancel_deadline_hours: 24,
        status: 'OPEN',
        category: 'Hội thảo & Công nghệ',
        faculty: CMCU_UNITS[0]?.name || 'Khoa CNTT & Truyền thông',
        guest: '',
        banner_url: ''
    });

    const fetchEvent = async () => {
        try {
            let found = null;

            try {
                const res = await apiClient.get(`/events/${id}`);
                found = res.data?.data || res.data;
            } catch (singleErr) {

                console.warn('GET /events/:id failed, falling back to /events list:', singleErr);
            }

            if (!found || (!found.event_id && !found.id)) {
                try {
                    const listRes = await apiClient.get('/events');
                    const eventList = Array.isArray(listRes.data)
                        ? listRes.data
                        : (listRes.data?.data || listRes.data?.events || []);
                    found = eventList.find((e) => Number(e.event_id || e.id) === Number(id));
                } catch (listErr) {
                    console.warn('GET /events list also failed:', listErr);
                }
            }

            if (!found || (!found.event_id && !found.id)) {
                found = MOCK_FALLBACK_EVENTS.find((e) => Number(e.event_id) === Number(id));
            }

            if (found && (found.event_id || found.id)) {
                const enriched = { ...found, ...getEventEnrichedData(found, isAdminOrStaff) };
                setEvent(enriched);

                if (user?.student_code) {
                    try {
                        const ticketRes = await apiClient.get('/tickets/my-tickets', {
                            params: { student_code: user.student_code }
                        });
                        const tickets = ticketRes.data?.data || [];
                        const activeTicket = tickets.find(
                            (t) => Number(t.event_id) === Number(id) && (t.status === 'REGISTERED' || t.status === 'CHECKED_IN' || t.checkin_status === 'REGISTERED' || t.checkin_status === 'CHECKED_IN')
                        );
                        setUserTicket(activeTicket || null);
                    } catch (tErr) {
                        console.warn('Could not check student ticket status:', tErr);
                    }
                }

                setEditForm({
                    title: enriched.title || '',
                    description: enriched.description || '',
                    location: enriched.location || '',
                    start_time: toLocalDatetimeInput(enriched.start_time),
                    end_time: toLocalDatetimeInput(enriched.end_time),
                    seat_capacity: enriched.seat_capacity || 100,
                    cancel_deadline_hours: enriched.cancel_deadline_hours || 24,
                    status: enriched.status || 'OPEN',
                    category: enriched.category || 'Hội thảo & Công nghệ',
                    faculty: enriched.faculty || CMCU_UNITS[0]?.name || 'Khoa CNTT & Truyền thông',
                    guest: enriched.guest || '',
                    banner_url: enriched.isAutoBanner ? '' : enriched.banner_url
                });
            } else {
                setEvent(null);
            }
        } catch (error) {
            console.error('Lỗi fetchEvent:', error);
            setEvent(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvent();
    }, [id]);

    const closeEditModal = () => {
        setIsEditing(false);
        if (searchParams.get('edit')) {
            const next = new URLSearchParams(searchParams);
            next.delete('edit');
            setSearchParams(next, { replace: true });
        }
    };

    const handleRegister = async () => {
        if (!user?.student_code) {
            return setMsg('❌ Tài khoản của bạn chưa có mã sinh viên. Vui lòng liên hệ Phòng CTSV (osa@cmcu.edu.vn) để cập nhật.');
        }
        setMsg('⏳ Đang xử lý đăng ký vé...');
        try {
            const res = await apiClient.post('/tickets/register', {
                event_id: Number(id),
                student_code: user.student_code
            });
            setMsg('✅ ' + res.data.message);
            setTimeout(() => navigate('/my-tickets'), 1500);
        } catch (error) {
            setMsg('❌ ' + (error.response?.data?.message || error.message));
        }
    };

    const handleImageFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 800;
                const scale = img.width > maxWidth ? maxWidth / img.width : 1;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setEditForm((prev) => ({ ...prev, banner_url: canvas.toDataURL('image/jpeg', 0.78) }));
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };

    const handleGenerateAutoBanner = () => {
        const autoUrl = generatePosterSvgDataUrl({
            title: editForm.title || 'Sự kiện CMCU',
            category: editForm.category,
            faculty: editForm.faculty,
            guest: editForm.guest || 'Ban Chủ nhiệm Khoa & Diễn giả CMCU',
            location: editForm.location,
            startTime: editForm.start_time,
            themeIndex: Math.floor(Math.random() * 5),
            isAdminView: isAdminOrStaff
        });
        setEditForm((prev) => ({ ...prev, banner_url: autoUrl }));
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();

        const cleanTitle = editForm.title.trim();
        const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
        const cleanLocation = editForm.location.trim();
        const startHour = new Date(editForm.start_time).getHours();

        if (startHour < 6 || startHour >= 22) {
            const proceed = window.confirm(
                `⚠️ Giờ bắt đầu (${startHour}:00) đang nằm ngoài khung giờ hoạt động thông thường của trường (06:30 - 22:00). Bạn vẫn muốn lưu chứ?`
            );
            if (!proceed) return;
        }

        try {
            const savedMap = JSON.parse(localStorage.getItem('cmcu_event_custom_meta') || '{}');
            savedMap[event.event_id] = {
                category: editForm.category,
                faculty: editForm.faculty,
                guest: editForm.guest,
                banner_url: editForm.banner_url
            };
            localStorage.setItem('cmcu_event_custom_meta', JSON.stringify(savedMap));
        } catch (storageErr) {
            console.warn('Bộ nhớ trình duyệt đầy:', storageErr);
        }

        try {
            await apiClient.put(`/admin/events/${id}`, {
                admin_user_id: user.user_id,
                title: formattedTitle,
                description: editForm.description,
                location: cleanLocation,
                start_time: editForm.start_time,
                end_time: editForm.end_time,
                seat_capacity: Number(editForm.seat_capacity),
                cancel_deadline_hours: Number(editForm.cancel_deadline_hours),
                status: editForm.status,
                eligibility: []
            });
            alert('✅ Đã cập nhật thông tin & Banner sự kiện!');
        } catch (err) {
            console.warn('Cập nhật banner giao diện:', err);
        } finally {
            closeEditModal();
            fetchEvent();
        }
    };

    const handleExportCsv = async () => {
        try {
            const res = await apiClient.get(`/admin/events/${id}/export?admin_user_id=${user.user_id}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `diemdanh_event_${id}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            alert('❌ Không thể xuất file CSV');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Bạn có chắc muốn xóa sự kiện này?')) return;
        try {
            const res = await apiClient.delete(`/admin/events/${id}?admin_user_id=${user.user_id}`);
            alert('✅ ' + res.data.message);
            navigate('/');
        } catch (err) {
            alert('❌ ' + (err.response?.data?.message || 'Lỗi xóa sự kiện'));
        }
    };

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#2dc275', fontWeight: 700 }}>⏳ Đang tải chi tiết sự kiện...</div>;
    }
    if (!event) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: isLight ? '#0f172a' : '#fff' }}>
                <p>Không tìm thấy sự kiện.</p>
                <Link to="/" style={{ color: '#2dc275', fontWeight: 700 }}>← Quay lại danh sách sự kiện</Link>
            </div>
        );
    }

    const isFull = (event.registered_count || 0) >= event.seat_capacity;
    const urgency = getEventUrgencyStatus(event);
    const displayTitle = event.title ? event.title.charAt(0).toUpperCase() + event.title.slice(1) : '';

    const urgencyPillTheme = {
        live: { bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: 'rgba(239, 68, 68, 0.45)' },
        urgent: { bg: 'rgba(249, 115, 22, 0.22)', color: '#fb923c', border: 'rgba(249, 115, 22, 0.45)' },
        today: { bg: 'rgba(245, 158, 11, 0.22)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.45)' },
        soon: { bg: 'rgba(14, 165, 233, 0.2)', color: '#38bdf8', border: 'rgba(14, 165, 233, 0.45)' },
        open: { bg: 'rgba(45, 194, 117, 0.18)', color: '#2dc275', border: 'rgba(45, 194, 117, 0.4)' },
        closed: { bg: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)' },
        ended: { bg: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)' }
    }[urgency.tone] || { bg: 'rgba(45, 194, 117, 0.18)', color: '#2dc275', border: 'rgba(45, 194, 117, 0.4)' };

    const eventDate = new Date(event.start_time);
    const isValidDate = !isNaN(eventDate.getTime());
    const eventYear = isValidDate ? eventDate.getFullYear() : 2026;
    const eventMonth = isValidDate ? eventDate.getMonth() : 10;
    const eventDayNum = isValidDate ? eventDate.getDate() : 1;

    const firstDayOfMonth = new Date(eventYear, eventMonth, 1).getDay();
    const offsetMonday = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysInMonth = new Date(eventYear, eventMonth + 1, 0).getDate();
    const calendarCells = [
        ...Array(offsetMonday).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];

    const supportMailHref = `mailto:osa@cmcu.edu.vn?subject=${encodeURIComponent(
        `[Hỗ trợ vé sự kiện] ${displayTitle} - MSSV: ${user?.student_code || ''}`
    )}`;

    return (
        <div className={`tb-detail-page ${isLight ? 'detail-light' : 'detail-dark'}`}>
            <style>{`
                .tb-detail-page {
                    max-width: 1160px;
                    margin: 0 auto;
                    padding-bottom: 48px;
                    transition: color 0.25s ease;
                }
                .detail-dark { color: #f8fafc; }
                .detail-light { color: #0f172a; }

                .tb-back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    text-decoration: none;
                    font-size: 0.88rem;
                    font-weight: 700;
                    margin-bottom: 14px;
                    transition: color 0.2s ease;
                }
                .detail-dark .tb-back-link { color: #94a3b8; }
                .detail-light .tb-back-link { color: #475569; }
                .tb-back-link:hover { color: #2dc275; }

                .tb-hero-ticket {
                    display: grid;
                    grid-template-columns: 365px minmax(0, 1fr);
                    border-radius: 22px;
                    overflow: hidden;
                    margin-bottom: 24px;
                    position: relative;
                }
                .detail-dark .tb-hero-ticket {
                    background: #1e1e24;
                    box-shadow: 0 22px 50px rgba(0, 0, 0, 0.55);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                }
                .detail-light .tb-hero-ticket {
                    background: #ffffff;
                    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.1);
                    border: 1px solid #e2e8f0;
                }

                .tb-ticket-left {
                    padding: 24px 22px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    position: relative;
                    z-index: 2;
                }
                .detail-dark .tb-ticket-left {
                    background: #23232b;
                    border-right: 2px dashed rgba(255, 255, 255, 0.22);
                }
                .detail-light .tb-ticket-left {
                    background: #f8fafc;
                    border-right: 2px dashed #cbd5e1;
                }
                .tb-ticket-left::before,
                .tb-ticket-left::after {
                    content: '';
                    position: absolute;
                    right: -14px;
                    width: 26px;
                    height: 26px;
                    border-radius: 50%;
                    z-index: 5;
                }
                .detail-dark .tb-ticket-left::before,
                .detail-dark .tb-ticket-left::after { background: #0b0e14; }
                .detail-light .tb-ticket-left::before,
                .detail-light .tb-ticket-left::after { background: #f1f5f9; }
                .tb-ticket-left::before { top: -13px; }
                .tb-ticket-left::after { bottom: -13px; }

                @media (max-width: 900px) {
                    .tb-hero-ticket { grid-template-columns: 1fr; }
                    .detail-dark .tb-ticket-left {
                        border-right: none;
                        border-bottom: 2px dashed rgba(255, 255, 255, 0.22);
                    }
                    .detail-light .tb-ticket-left {
                        border-right: none;
                        border-bottom: 2px dashed #cbd5e1;
                    }
                    .tb-ticket-left::before {
                        top: auto;
                        bottom: -13px;
                        left: -13px;
                        right: auto;
                    }
                    .tb-ticket-left::after {
                        top: auto;
                        bottom: -13px;
                        right: -13px;
                    }
                }
                @media (max-width: 640px) {
                    .tb-hero-ticket { border-radius: 16px; }
                    .tb-ticket-left { padding: 16px 14px; }
                    .tb-ticket-title { font-size: 1.12rem; }
                    .tb-poster-frame { min-height: 200px !important; }
                }

                .tb-ticket-title {
                    font-size: 1.32rem;
                    font-weight: 800;
                    line-height: 1.35;
                    margin: 0 0 10px 0;
                }
                .tb-urgency-pill {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 999px;
                    font-size: 0.78rem;
                    font-weight: 800;
                    margin-bottom: 14px;
                }
                .tb-meta-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    font-size: 0.88rem;
                    margin-bottom: 11px;
                }
                .detail-dark .tb-meta-item { color: #cbd5e1; }
                .detail-light .tb-meta-item { color: #334155; }

                .tb-meta-green { color: #16a34a; font-weight: 700; }
                .detail-dark .tb-meta-green { color: #2dc275; }

                .tb-extra-tag {
                    display: inline-block;
                    margin-top: 6px;
                    padding: 3px 10px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    border-radius: 6px;
                }
                .detail-dark .tb-extra-tag { color: #f8fafc; border: 1px solid rgba(255, 255, 255, 0.35); }
                .detail-light .tb-extra-tag { color: #0f172a; background: #e2e8f0; border: 1px solid #cbd5e1; }

                .tb-ticket-divider-h { height: 1px; margin: 14px 0; }
                .detail-dark .tb-ticket-divider-h { background: rgba(255, 255, 255, 0.14); }
                .detail-light .tb-ticket-divider-h { background: #e2e8f0; }

                .tb-price-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 14px;
                    font-size: 1rem;
                    font-weight: 800;
                }
                .tb-price-val { color: #2dc275; font-size: 1.12rem; }
                .tb-cta-green-btn {
                    width: 100%;
                    padding: 12px 16px;
                    border-radius: 10px;
                    border: none;
                    background: #2dc275;
                    color: #052e16;
                    font-size: 0.95rem;
                    font-weight: 900;
                    cursor: pointer;
                }
                .tb-cta-green-btn:disabled { background: #64748b; color: #f1f5f9; cursor: not-allowed; }

                .tb-ticket-right {
                    position: relative;
                    background: #090d16;
                    min-height: 320px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .tb-ticket-right-blur {
                    position: absolute;
                    inset: -20px;
                    width: calc(100% + 40px);
                    height: calc(100% + 40px);
                    object-fit: cover;
                    filter: blur(22px) brightness(0.45);
                    pointer-events: none;
                    z-index: 0;
                }
                .tb-ticket-right-main {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    height: 100%;
                    max-height: 460px;
                    object-fit: contain;
                    display: block;
                }

                .tb-section-card {
                    border-radius: 16px;
                    padding: 22px 24px;
                    margin-bottom: 20px;
                }
                .detail-dark .tb-section-card {
                    background: #1e1e24;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                }
                .detail-light .tb-section-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
                }

                .tb-section-header {
                    font-size: 1.08rem;
                    font-weight: 800;
                    margin: 0 0 16px 0;
                    padding-bottom: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .detail-dark .tb-section-header { color: #ffffff; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
                .detail-light .tb-section-header { color: #0f172a; border-bottom: 1px solid #e2e8f0; }

                .tb-intro-body { font-size: 0.95rem; line-height: 1.7; overflow: hidden; }
                .tb-intro-body.collapsed { max-height: 165px; }
                .tb-intro-pink-strip {
                    height: 36px;
                    background: linear-gradient(90deg, #e11d48 0%, #db2777 100%);
                    border-radius: 6px;
                    margin-top: 14px;
                    display: flex;
                    align-items: center;
                    padding: 0 16px;
                    font-weight: 700;
                    font-size: 0.86rem;
                    color: #ffffff;
                }
                .tb-collapse-arrow-btn {
                    width: 100%;
                    background: transparent;
                    border: none;
                    padding: 10px 0 0 0;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: inherit;
                }

                .tb-month-tabs {
                    display: flex;
                    gap: 28px;
                    padding-bottom: 12px;
                    margin-bottom: 16px;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
                }
                .tb-month-tab {
                    text-align: center;
                    padding-bottom: 8px;
                    font-size: 0.9rem;
                    color: #94a3b8;
                    border-bottom: 3px solid transparent;
                }
                .tb-month-tab.active { color: #2dc275; font-weight: 800; border-bottom-color: #2dc275; }
                .tb-weekdays-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    text-align: center;
                    font-size: 0.84rem;
                    font-weight: 700;
                    padding-bottom: 12px;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
                }
                .tb-days-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 8px;
                    margin-top: 12px;
                }
                .tb-day-cell {
                    height: 52px;
                    border-radius: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.88rem;
                    color: #64748b;
                }
                .tb-day-cell.active-event-day {
                    border: 1.8px solid #2dc275;
                    background: rgba(45, 194, 117, 0.16);
                    font-weight: 800;
                    color: inherit;
                }
                .tb-day-dot-bar {
                    width: 20px;
                    height: 4px;
                    border-radius: 99px;
                    background: #2dc275;
                    margin-top: 5px;
                }
            `}</style>

            <Link to="/" className="tb-back-link">
                ← Quay lại danh sách sự kiện
            </Link>

            <div className="tb-hero-ticket">
                <div className="tb-ticket-left">
                    <div>
                        <h1 className="tb-ticket-title">{displayTitle}</h1>

                        <span
                            className="tb-urgency-pill"
                            style={{
                                background: urgencyPillTheme.bg,
                                color: urgencyPillTheme.color,
                                border: `1px solid ${urgencyPillTheme.border}`
                            }}
                        >
                            {urgency.label}
                        </span>

                        {timeLeft && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                background: 'rgba(45, 194, 117, 0.12)',
                                border: '1px solid rgba(45, 194, 117, 0.35)',
                                borderRadius: '10px',
                                marginBottom: '14px',
                                fontSize: '0.82rem',
                                color: '#2dc275'
                            }}>
                                <span>⏳ <strong>Đếm ngược giờ G:</strong></span>
                                <div style={{ display: 'flex', gap: '4px', fontWeight: 800, color: '#f8fafc' }}>
                                    {timeLeft.days > 0 && <span>{timeLeft.days} ngày</span>}
                                    <span style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '4px' }}>{String(timeLeft.hours).padStart(2, '0')}h</span> :
                                    <span style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '4px' }}>{String(timeLeft.minutes).padStart(2, '0')}m</span> :
                                    <span style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: '4px', color: '#2dc275' }}>{String(timeLeft.seconds).padStart(2, '0')}s</span>
                                </div>
                            </div>
                        )}

                        <div className="tb-meta-item">
                            <span>📅</span>
                            <div>
                                <div className="tb-meta-green">
                                    {new Date(event.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })},{' '}
                                    {new Date(event.start_time).toLocaleDateString('vi-VN')} -{' '}
                                    {new Date(event.end_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })},{' '}
                                    {new Date(event.end_time).toLocaleDateString('vi-VN')}
                                </div>
                                <span className="tb-extra-tag">{event.category}</span>
                            </div>
                        </div>

                        <div className="tb-meta-item">
                            <span>📍</span>
                            <div>
                                <div className="tb-meta-green">{event.location}</div>
                                <div style={{ fontSize: '0.82rem', opacity: 0.78, marginTop: '2px' }}>
                                    Trường Đại học CMC • Đơn vị: {event.faculty}
                                </div>
                            </div>
                        </div>

                        <div className="tb-meta-item">
                            <span>🎤</span>
                            <div>
                                <strong>Khách mời:</strong> {event.guest}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="tb-ticket-divider-h"></div>
                        <div className="tb-price-row">
                            <span>Vé tham dự</span>
                            <span className="tb-price-val">
                                Miễn phí ({event.registered_count || 0}/{event.seat_capacity} chỗ) &gt;
                            </span>
                        </div>

                        {currentRole === 'STUDENT' ? (
                            userTicket ? (
                                <Link
                                    to="/my-tickets"
                                    className="tb-cta-green-btn"
                                    style={{
                                        display: 'block',
                                        textAlign: 'center',
                                        textDecoration: 'none',
                                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                                    }}
                                >
                                    🎟️ Bạn đã có vé ({userTicket.ticket_code}) — Xem vé của tôi
                                </Link>
                            ) : (
                                <button
                                    onClick={handleRegister}
                                    disabled={isFull || event.status !== 'OPEN' || urgency.tone === 'ended'}
                                    className="tb-cta-green-btn"
                                >
                                    {urgency.tone === 'ended'
                                        ? 'Sự kiện đã kết thúc'
                                        : isFull
                                            ? 'Đã hết chỗ'
                                            : event.status === 'OPEN'
                                                ? 'Đăng ký lấy vé QR ngay'
                                                : 'Đã đóng đăng ký'}
                                </button>
                            )
                        ) : (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button onClick={() => setIsEditing(true)} className="tb-cta-green-btn" style={{ flex: 1 }}>
                                    ✏️ Sửa &amp; Đổi Banner
                                </button>
                                {isAdminOrStaff && (
                                    <>
                                        <button
                                            onClick={handleExportCsv}
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: '10px',
                                                border: '1px solid #0284c7',
                                                background: 'transparent',
                                                color: '#0284c7',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            📥 CSV
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: '10px',
                                                border: '1px solid #ef4444',
                                                background: 'transparent',
                                                color: '#ef4444',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🗑️ Xóa
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {msg && (
                            <div
                                style={{
                                    marginTop: '12px',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    background: isLight ? '#f1f5f9' : 'rgba(15,23,42,0.85)',
                                    fontSize: '0.85rem',
                                    fontWeight: 600
                                }}
                            >
                                {msg}
                            </div>
                        )}

                        <div style={{ marginTop: '12px', fontSize: '0.78rem', opacity: 0.82, lineHeight: 1.4 }}>
                            Gặp lỗi vé QR hoặc sai MSSV?{' '}
                            <a href={supportMailHref} style={{ color: '#2dc275', fontWeight: 700, textDecoration: 'underline' }}>
                                Gửi yêu cầu tới Phòng CTSV
                            </a>{' '}
                            hoặc gọi <a href="tel:0976373596" style={{ color: '#2dc275', fontWeight: 700 }}>0976.373.596</a>.
                        </div>
                    </div>
                </div>

                <div className="tb-ticket-right">
                    <img src={event.banner_url} alt="" aria-hidden="true" className="tb-ticket-right-blur" />
                    <img src={event.banner_url} alt={displayTitle} className="tb-ticket-right-main" />
                </div>
            </div>

            <div className="tb-section-card">
                <div className="tb-section-header">
                    <span>Giới thiệu</span>
                    <span style={{ fontSize: '0.8rem', color: '#2dc275' }}>#{event.category}</span>
                </div>

                <div className="tb-intro-body">
                    <p style={{ fontWeight: 800, marginTop: 0 }}>{displayTitle}</p>
                    <p>{event.description || 'Sự kiện học thuật và trải nghiệm thực tế dành cho sinh viên Trường Đại học CMC.'}</p>

                    {!introCollapsed && (
                        <div className="tb-intro-expanded-details" style={{ animation: 'fadeIn 0.25s ease', borderTop: '1px dashed rgba(255,255,255,0.12)', paddingTop: '10px', marginTop: '10px' }}>
                            <p>
                                <strong>🎤 Khách mời / Diễn giả:</strong> {event.guest || 'Ban Chủ nhiệm Khoa & Diễn giả CMCU'}
                            </p>
                            <p>
                                <strong>🏛️ Khoa / Đơn vị tổ chức:</strong> {event.faculty || 'Trường Đại học CMC'}
                            </p>
                            <p>
                                <strong>⏳ Quy định hủy vé:</strong> Sinh viên có thể hủy vé trước giờ bắt đầu tối thiểu {event.cancel_deadline_hours || 24} giờ.
                            </p>
                        </div>
                    )}
                </div>

                <div className="tb-intro-pink-strip">
                    ✨ Sự kiện chính thức thuộc Hệ thống Quản trị Sự kiện &amp; Điểm danh QR CMCU
                </div>

                <button
                    type="button"
                    className="tb-collapse-arrow-btn"
                    onClick={() => setIntroCollapsed((prev) => !prev)}
                >
                    {introCollapsed ? '▼ Xem đầy đủ thông tin sự kiện & khách mời' : '▲ Thu gọn nội dung'}
                </button>
            </div>

            <div className="tb-section-card">
                <div className="tb-section-header">
                    <span>Lịch diễn</span>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                        🕒 Suất chính: {new Date(event.start_time).toLocaleString('vi-VN')}
                    </span>
                </div>

                <div className="tb-month-tabs">
                    <div className="tb-month-tab active">
                        <div>Tháng {eventMonth + 1}, {eventYear}</div>
                        <small>1 suất diễn</small>
                    </div>
                    <div className="tb-month-tab">
                        <div>Th {((eventMonth + 1) % 12) + 1}</div>
                        <small>0 suất diễn</small>
                    </div>
                    <div className="tb-month-tab">
                        <div>Th {((eventMonth + 2) % 12) + 1}</div>
                        <small>0 suất diễn</small>
                    </div>
                </div>

                <div className="tb-weekdays-grid">
                    <span>Thứ 2</span>
                    <span>Thứ 3</span>
                    <span>Thứ 4</span>
                    <span>Thứ 5</span>
                    <span>Thứ 6</span>
                    <span>Thứ 7</span>
                    <span>Chủ nhật</span>
                </div>

                <div className="tb-days-grid">
                    {calendarCells.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} className="tb-day-cell" />;
                        const isEventDay = day === eventDayNum;
                        return (
                            <div
                                key={day}
                                className={`tb-day-cell ${isEventDay ? 'active-event-day' : ''}`}
                                title={isEventDay ? `${displayTitle} (${new Date(event.start_time).toLocaleTimeString('vi-VN')})` : ''}
                            >
                                <span>{String(day).padStart(2, '0')}</span>
                                {isEventDay && <div className="tb-day-dot-bar"></div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="tb-section-card">
                <div className="tb-section-header">
                    <span>Ban tổ chức</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                        style={{
                            width: '68px',
                            height: '68px',
                            borderRadius: '14px',
                            background: isLight ? '#0f172a' : '#ffffff',
                            color: isLight ? '#ffffff' : '#0f172a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '1.12rem',
                            flexShrink: 0
                        }}
                    >
                        CMCU
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem' }}>
                            {event.organizer || 'BAN TỔ CHỨC SỰ KIỆN TRƯỜNG ĐẠI HỌC CMC'}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.78 }}>
                            Đơn vị phụ trách: {event.faculty} • Khách mời: {event.guest}
                        </p>
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="modal-overlay">
                    <div className="modal-content-premium" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '18px', color: 'var(--primary)', textAlign: 'center', fontSize: '1.45rem', fontWeight: '800' }}>
                            Chỉnh sửa Sự kiện &amp; Banner
                        </h2>

                        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="form-group">
                                <label className="form-label">Tên sự kiện</label>
                                <input
                                    className="form-input"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label className="form-label">Loại sự kiện</label>
                                    <select
                                        className="form-input"
                                        value={editForm.category}
                                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    >
                                        <option value="Hội thảo & Công nghệ">Hội thảo &amp; Công nghệ</option>
                                        <option value="Workshop & Trải nghiệm">Workshop &amp; Trải nghiệm</option>
                                        <option value="Văn nghệ & Lễ kỷ niệm">Văn nghệ &amp; Lễ kỷ niệm</option>
                                        <option value="Giao lưu Sinh viên">Giao lưu Sinh viên</option>
                                        <option value="Cuộc thi Học thuật">Cuộc thi Học thuật</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Khoa / Đơn vị CMCU</label>
                                    <select
                                        className="form-input"
                                        value={editForm.faculty}
                                        onChange={(e) => setEditForm({ ...editForm, faculty: e.target.value })}
                                    >
                                        {CMCU_UNITS.map((unit) => (
                                            <option key={unit.id} value={unit.name}>
                                                {unit.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Khách mời / Diễn giả</label>
                                <input
                                    className="form-input"
                                    value={editForm.guest}
                                    onChange={(e) => setEditForm({ ...editForm, guest: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Mô tả sự kiện</label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                />
                            </div>

                            <div className="form-group" style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px dashed #94a3b8' }}>
                                <label className="form-label" style={{ color: '#0f172a' }}>🖼️ Hình ảnh Banner sự kiện</label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                    <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ fontSize: '0.85rem' }} />
                                    <button
                                        type="button"
                                        onClick={handleGenerateAutoBanner}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: '#2563eb',
                                            color: '#fff',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            fontSize: '0.82rem'
                                        }}
                                    >
                                        🎨 Tự tạo ảnh theo tên sự kiện
                                    </button>
                                </div>
                                <input
                                    className="form-input"
                                    placeholder="Hoặc dán trực tiếp link ảnh (https://...)"
                                    value={editForm.banner_url}
                                    onChange={(e) => setEditForm({ ...editForm, banner_url: e.target.value })}
                                />
                                {editForm.banner_url && (
                                    <img
                                        src={editForm.banner_url}
                                        alt="Preview"
                                        style={{ width: '100%', height: '145px', objectFit: 'contain', background: '#090d16', borderRadius: '10px', marginTop: '8px' }}
                                    />
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Địa điểm</label>
                                <input
                                    className="form-input"
                                    value={editForm.location}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label className="form-label">Bắt đầu</label>
                                    <input
                                        className="form-input"
                                        type="datetime-local"
                                        value={editForm.start_time}
                                        onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Kết thúc</label>
                                    <input
                                        className="form-input"
                                        type="datetime-local"
                                        value={editForm.end_time}
                                        onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label className="form-label">Sức chứa</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        min="1"
                                        value={editForm.seat_capacity}
                                        onChange={(e) => setEditForm({ ...editForm, seat_capacity: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Trạng thái</label>
                                    <select
                                        className="form-input"
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    >
                                        <option value="OPEN">OPEN (Đang mở)</option>
                                        <option value="CLOSED">CLOSED (Đã đóng)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={closeEditModal} className="btn-modal-cancel">
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="btn-modal-save">
                                    💾 Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}