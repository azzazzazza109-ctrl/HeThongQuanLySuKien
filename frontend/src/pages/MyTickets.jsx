import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';

export default function MyTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState('');
    const [msg, setMsg] = useState('');
    const [activeTab, setActiveTab] = useState('CURRENT');
    const { user } = useAuth();

    const fetchTickets = async () => {
        if (!user) return;
        setLoading(true);
        setApiError('');

        try {

            const res = await apiClient.get('/tickets/my-tickets', {
                params: {
                    user_id: user?.user_id,
                    student_code: user?.student_code
                }
            });

            const rawData = res.data;
            let list = [];
            if (Array.isArray(rawData)) list = rawData;
            else if (rawData && Array.isArray(rawData.data)) list = rawData.data;
            else if (rawData && rawData.data && Array.isArray(rawData.data.tickets)) list = rawData.data.tickets;

            const mappedList = list.map(t => ({
                ...t,
                title: t.title || t.event_title || 'Sự kiện không xác định',
                location: t.location || t.event_location || 'Chưa cập nhật',
                start_time: t.start_time || t.event_start_time || t.event_start,
                end_time: t.end_time || t.event_end_time,
                status: t.status || t.checkin_status || 'REGISTERED',
                cancel_deadline_hours: t.cancel_deadline_hours ?? 24
            }));

            setTickets(mappedList);
        } catch (err) {
            console.error("Lỗi API /tickets/my-tickets:", err.response || err);
            setApiError(err.response?.data?.message || 'Không thể kết nối đến máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [user]);

    const handleCancel = async (ticketId) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy vé? Suất này sẽ được nhường cho bạn khác.")) return;
        try {

            const res = await apiClient.post(`/tickets/cancel`, { ticket_id: ticketId });
            setMsg(res.data.message || 'Hủy vé thành công');
            fetchTickets();
        } catch (error) {
            setMsg('❌ ' + (error.response?.data?.message || error.message));
        }
    };

    const now = new Date();

    const currentTickets = tickets.filter(t => {
        const isRegistered = t.status === 'REGISTERED';
        const endTime = t.end_time ? new Date(t.end_time) : (t.start_time ? new Date(t.start_time) : new Date(8640000000000000));
        return isRegistered && endTime >= now;
    });

    const historyTickets = tickets.filter(t => {
        const isCheckedIn = t.status === 'CHECKED_IN';
        const isCancelled = t.status === 'CANCELLED' || t.status === 'EXPIRED';
        const endTime = t.end_time ? new Date(t.end_time) : (t.start_time ? new Date(t.start_time) : new Date(0));
        const isPast = endTime < now;
        return isCheckedIn || isCancelled || isPast;
    });

    const displayTickets = activeTab === 'CURRENT' ? currentTickets : historyTickets;

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#fff' }}>Đang tải ví vé...</div>;

    return (
        <div className="ticket-page-wrapper">
            <h1 className="ticket-page-title">🎟️ Vé Của Tôi</h1>

            {msg && <div className={`custom-toast ${msg.includes('❌') ? 'toast-error' : 'toast-success'}`} style={{ marginBottom: '24px' }}>{msg}</div>}

            {apiError && (
                <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '20px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center', border: '1px solid #ef4444' }}>
                    <h3 style={{ margin: '0 0 10px 0' }}>❌ Lỗi tải dữ liệu</h3>
                    <p style={{ margin: '0 0 16px 0' }}>{apiError}</p>
                    <button onClick={fetchTickets} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Thử tải lại</button>
                </div>
            )}

            {!apiError && (
                <>
                    <div className="ticket-tabs">
                        <button onClick={() => setActiveTab('CURRENT')} className={`ticket-tab ${activeTab === 'CURRENT' ? 'active' : ''}`}>
                            Vé hiện tại ({currentTickets.length})
                        </button>
                        <button onClick={() => setActiveTab('HISTORY')} className={`ticket-tab ${activeTab === 'HISTORY' ? 'active' : ''}`}>
                            Lịch sử ({historyTickets.length})
                        </button>
                    </div>

                    {displayTickets.length === 0 ? (
                        <div className="empty-state-premium">
                            <div className="empty-icon-wrapper"><span className="empty-icon-float">🎫</span></div>
                            <h3 className="empty-title">Không có dữ liệu vé nào</h3>
                            <p className="empty-desc">
                                {activeTab === 'CURRENT' ? 'Bạn chưa đăng ký sự kiện nào.' : 'Bạn chưa có vé nào trong lịch sử.'}
                            </p>
                            {activeTab === 'CURRENT' && (
                                <Link to="/" className="btn-discover">🚀 Khám phá sự kiện ngay</Link>
                            )}
                        </div>
                    ) : (
                        <div className="ticket-list">
                            {displayTickets.map((ticket, index) => {
                                const hoursUntilStart = (new Date(ticket.start_time) - new Date()) / (1000 * 60 * 60);
                                const canCancel = hoursUntilStart > (ticket.cancel_deadline_hours || 24);

                                return (
                                    <div key={ticket.ticket_id} className={`e-ticket-horizontal ${ticket.status === 'CANCELLED' ? 'cancelled' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
                                        <div className="ticket-left">
                                            <div className="ticket-header">
                                                <span
                                                    className="ticket-status-badge"
                                                    style={
                                                        ticket.status === 'CHECKED_IN'
                                                            ? { background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: '#ffffff', fontWeight: 800 }
                                                            : ticket.status === 'CANCELLED'
                                                            ? { background: '#EF4444', color: '#ffffff' }
                                                            : {}
                                                    }
                                                >
                                                    {ticket.status === 'REGISTERED'
                                                        ? '🎟️ Đã đăng ký (Chờ vào)'
                                                        : ticket.status === 'CHECKED_IN'
                                                        ? '✅ Đã vào cửa (Đã tham dự)'
                                                        : '🚫 Đã hủy'}
                                                </span>
                                                <h2 className="ticket-event-name">{ticket.title}</h2>
                                            </div>
                                            <div className="ticket-body">
                                                <div className="ticket-info-grid">
                                                    <div className="info-item"><span className="info-label">Người tham dự</span><span className="info-value">{user?.full_name || 'User'}</span></div>
                                                    <div className="info-item">
                                                        <span className="info-label">Mã vé</span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span className="info-value code-highlight">{ticket.ticket_code}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    navigator.clipboard?.writeText(ticket.ticket_code);
                                                                    setMsg(`📋 Đã sao chép mã vé: ${ticket.ticket_code}`);
                                                                    setTimeout(() => setMsg(''), 3000);
                                                                }}
                                                                style={{
                                                                    background: 'rgba(255,255,255,0.1)',
                                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                                    borderRadius: '6px',
                                                                    padding: '2px 8px',
                                                                    color: '#38bdf8',
                                                                    fontSize: '0.72rem',
                                                                    cursor: 'pointer',
                                                                    fontWeight: 600
                                                                }}
                                                                title="Sao chép mã vé"
                                                            >
                                                                📋 Copy
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="info-item"><span className="info-label">Thời gian</span><span className="info-value">{ticket.start_time ? new Date(ticket.start_time).toLocaleString('vi-VN') : 'N/A'}</span></div>
                                                    <div className="info-item"><span className="info-label">Địa điểm</span><span className="info-value">{ticket.location}</span></div>
                                                </div>
                                                {ticket.status === 'REGISTERED' && (
                                                    <div style={{ marginTop: '20px' }}>
                                                        {canCancel ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                                <button onClick={() => handleCancel(ticket.ticket_id)} className="btn-cancel-ticket" style={{ padding: '8px 16px', borderRadius: '8px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', fontWeight: 'bold', cursor: 'pointer' }}>Hủy vé</button>
                                                                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>(Còn {Math.max(0, hoursUntilStart - (ticket.cancel_deadline_hours || 24)).toFixed(1)} giờ để hủy)</span>
                                                            </div>
                                                        ) : (
                                                            <div className="ticket-warning" style={{ marginTop: 0 }}>
                                                                <span className="warning-icon">🔒</span>
                                                                <div><strong style={{ display: 'block', marginBottom: '2px' }}>Đã hết hạn hủy vé</strong></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ticket-divider"></div>
                                        <div className="ticket-right">
                                            {ticket.status === 'REGISTERED' ? (
                                                <>
                                                    <p className="vertical-text">QUÉT MÃ TẠI CỬA</p>
                                                    <div className="qr-pulse-wrapper"><QRCodeSVG value={ticket.qr_token} size={100} level="H" /></div>
                                                </>
                                            ) : ticket.status === 'CHECKED_IN' ? (
                                                <div style={{ textAlign: 'center', color: '#10B981', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '8px' }}>✅</span> ĐÃ VÀO
                                                </div>
                                            ) : (
                                                <div className="qr-used-stamp" style={{ fontSize: '1rem', padding: '8px 12px' }}>ĐÃ HỦY</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
