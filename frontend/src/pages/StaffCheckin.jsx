import { useState, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function StaffCheckin() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('QR');
    const [events, setEvents] = useState([]);
    const [eventId, setEventId] = useState('');

    const [eventSearch, setEventSearch] = useState('');
    const [showEventDropdown, setShowEventDropdown] = useState(false);

    const [msg, setMsg] = useState({ type: '', text: '' });
    const [cameraError, setCameraError] = useState(false);

    const [searchCode, setSearchCode] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        apiClient.get('/events').then(res => {
            if (res.data.success) {
                setEvents(res.data.data);
                if (res.data.data.length > 0) {
                    setEventId(String(res.data.data[0].event_id));
                    setEventSearch(res.data.data[0].title);
                }
            }
        }).catch(err => console.error("Lỗi lấy danh sách sự kiện:", err));
    }, []);

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(eventSearch.toLowerCase())
    );

    useEffect(() => {
        let html5QrCode = null;
        let isMounted = true;

        if (activeTab === 'QR' && !cameraError) {
            const startScanner = async () => {
                try {
                    await new Promise(resolve => setTimeout(resolve, 150));
                    if (!isMounted) return;

                    html5QrCode = new Html5Qrcode("reader");
                    const config = { fps: 10, qrbox: { width: 220, height: 220 } };

                    await html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        (decodedText) => {
                            if (html5QrCode) {
                                html5QrCode.stop().then(() => {
                                    if (isMounted) handleCheckinQR(decodedText);
                                }).catch(err => console.error("Lỗi dừng camera:", err));
                            }
                        },
                        () => {}
                    );
                } catch (err) {
                    console.error("Lỗi khởi động camera:", err);
                    if (isMounted) setCameraError(true);
                }
            };
            startScanner();
        }

        return () => {
            isMounted = false;
            if (html5QrCode) {
                try {
                    if (html5QrCode.isScanning) {
                        html5QrCode.stop().then(() => html5QrCode.clear()).catch(e => console.log(e));
                    } else {
                        html5QrCode.clear();
                    }
                } catch (e) { console.log(e); }
            }
        };
    }, [activeTab, cameraError]);

    const handleCheckinQR = async (qrToken) => {
        try {
            setMsg({ type: 'loading', text: 'Đang giải mã và kiểm tra vé...' });
            const res = await apiClient.post('/tickets/checkin', {
                qr_token: qrToken,
                staff_user_id: user?.user_id
            });
            const student = res.data.data?.student;
            setMsg({
                type: 'success',
                text: `✅ Điểm danh thành công: ${student?.full_name || ''} (${student?.student_code || ''})`
            });

            setTimeout(() => {
                setMsg({ type: '', text: '' });
            }, 4000);
        } catch (error) {
            setMsg({ type: 'error', text: error.response?.data?.message || error.message });
            setTimeout(() => {
                setMsg({ type: '', text: '' });
            }, 4000);
        }
    };

    const doSearchWithCode = async (rawCode) => {
        const code = (rawCode || searchCode).trim();
        if (!code) {
            setMsg({ type: 'error', text: 'Vui lòng nhập Mã sinh viên hoặc Email cần tra cứu.' });
            return;
        }

        setMsg({ type: '', text: '' });
        setSearchResult(null);
        setIsSearching(true);

        try {
            const res = await apiClient.get(`/tickets/my-tickets?student_code=${encodeURIComponent(code)}`);
            if (res.data.success && res.data.data?.length > 0) {

                let ticket = res.data.data.find(t => String(t.event_id) === String(eventId));

                if (!ticket) {
                    ticket = res.data.data[0];
                    setEventId(String(ticket.event_id));
                    setEventSearch(ticket.event_title);
                }

                setSearchResult({
                    ticket_id: ticket.ticket_id,
                    ticket_code: ticket.ticket_code,
                    student_code: ticket.student_code || code,
                    full_name: ticket.full_name || res.data.data[0]?.full_name || code,
                    class_name: ticket.class_name || 'Lớp CNTT',
                    event_id: ticket.event_id,
                    event_title: ticket.event_title,
                    status: ticket.checkin_status,
                    checkin_time: ticket.checkin_time || null
                });
            } else {
                setMsg({
                    type: 'error',
                    text: `Không tìm thấy vé nào cho mã "${code}". Thử các mã có sẵn: BIT250001, BIT250221, SV0001`
                });
            }
        } catch (error) {
            setMsg({ type: 'error', text: error.response?.data?.message || error.message });
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        doSearchWithCode(searchCode);
    };

    const handleConfirmCheckin = async () => {
        if (!searchResult) return;
        try {
            setMsg({ type: 'loading', text: 'Đang xác nhận điểm danh...' });
            const res = await apiClient.post('/tickets/checkin', {
                student_code: searchResult.student_code,
                event_id: searchResult.event_id || eventId,
                staff_user_id: user?.user_id
            });
            setMsg({ type: 'success', text: res.data.message || 'Điểm danh thành công!' });

            setSearchResult({
                ...searchResult,
                status: 'CHECKED_IN',
                checkin_time: new Date().toISOString()
            });
        } catch (error) {
            setMsg({ type: 'error', text: error.response?.data?.message || error.message });
        }
    };

    const renderIcon = () => {
        if (msg.type === 'success') return '✅';
        if (msg.type === 'error') return '🚫';
        if (msg.type === 'loading') return '⏳';
        return null;
    };

    return (
        <div className="admin-dashboard-container staff-checkin-page">
            <style>{`
                .staff-checkin-page {
                    position: relative;
                    min-height: 80vh;
                }
                .checkin-wrapper {
                    max-width: 680px;
                    margin: 0 auto;
                    position: relative;
                    z-index: 5;
                }
                .checkin-tabs {
                    display: flex;
                    background: rgba(15, 23, 42, 0.75);
                    backdrop-filter: blur(16px);
                    border-radius: 16px;
                    padding: 6px;
                    margin-bottom: 22px;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
                }
                .checkin-tab {
                    flex: 1;
                    padding: 12px 18px;
                    border-radius: 12px;
                    border: none;
                    background: transparent;
                    color: #94a3b8;
                    font-weight: 700;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                }
                .checkin-tab:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.06);
                }
                .checkin-tab.active {
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    color: #ffffff;
                    box-shadow: 0 4px 18px rgba(79, 70, 229, 0.45);
                }
                .checkin-card {
                    position: relative;
                    background: linear-gradient(135deg, rgba(17, 24, 39, 0.92) 0%, rgba(15, 23, 42, 0.96) 100%) !important;
                    backdrop-filter: blur(24px);
                    border: 1px solid rgba(99, 102, 241, 0.25) !important;
                    border-radius: 24px;
                    padding: 34px 28px;
                    box-shadow: 0 24px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    text-align: center;
                }

                .hud-terminal-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    padding: 4px 12px;
                    background: rgba(16, 185, 129, 0.12);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    border-radius: 999px;
                    font-size: 0.74rem;
                    font-weight: 800;
                    letter-spacing: 0.6px;
                    color: #34d399;
                    margin-bottom: 20px;
                    text-transform: uppercase;
                }
                .hud-corner {
                    position: absolute;
                    width: 14px;
                    height: 14px;
                    border-color: #6366f1;
                    border-style: solid;
                    pointer-events: none;
                }
                .hud-tl { top: 10px; left: 10px; border-width: 2px 0 0 2px; }
                .hud-tr { top: 10px; right: 10px; border-width: 2px 2px 0 0; }
                .hud-bl { bottom: 10px; left: 10px; border-width: 0 0 2px 2px; }
                .hud-br { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; }

                .input-group {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    width: 100%;
                }
                .input-label-styled {
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.6px;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .input-field-wrapper {
                    position: relative;
                    width: 100%;
                }
                .styled-input {
                    width: 100%;
                    padding: 14px 16px 14px 46px;
                    background: rgba(15, 23, 42, 0.82);
                    border: 1.5px solid rgba(255, 255, 255, 0.14);
                    border-radius: 12px;
                    color: #ffffff;
                    font-size: 0.96rem;
                    font-weight: 600;
                    transition: all 0.25s ease;
                    box-sizing: border-box;
                }
                .styled-input:focus {
                    outline: none;
                    border-color: #818cf8;
                    background: rgba(15, 23, 42, 0.98);
                    box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.25);
                }
                .styled-input::placeholder {
                    color: #475569;
                    font-weight: 500;
                }
                .input-icon-svg {
                    position: absolute;
                    left: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    display: flex;
                    align-items: center;
                    pointer-events: none;
                    z-index: 2;
                }

                .manual-search-row {
                    display: flex;
                    gap: 10px;
                    width: 100%;
                }
                .btn-hud-search {
                    padding: 0 26px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    color: #ffffff;
                    font-weight: 800;
                    font-size: 0.92rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 110px;
                    white-space: nowrap;
                }
                .btn-hud-search:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 22px rgba(124, 58, 237, 0.5);
                }
                .btn-hud-search:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .quick-tags-container {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 8px;
                    margin-top: 10px;
                    width: 100%;
                }
                .quick-tags-label {
                    font-size: 0.76rem;
                    font-weight: 700;
                    color: #64748b;
                }
                .quick-code-pill {
                    background: rgba(30, 41, 59, 0.85);
                    border: 1px solid rgba(148, 163, 184, 0.25);
                    color: #cbd5e1;
                    padding: 4px 11px;
                    border-radius: 999px;
                    font-size: 0.76rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .quick-code-pill:hover {
                    background: rgba(99, 102, 241, 0.25);
                    border-color: #818cf8;
                    color: #ffffff;
                    transform: translateY(-1px);
                }

                .search-result-hud-card {
                    margin-top: 24px;
                    background: rgba(15, 23, 42, 0.9);
                    border: 1.5px solid rgba(45, 194, 117, 0.35);
                    border-radius: 18px;
                    padding: 22px;
                    text-align: left;
                    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
                    position: relative;
                    overflow: hidden;
                }
                .hud-result-top {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 16px;
                    padding-bottom: 14px;
                    border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
                }
                .hud-avatar {
                    width: 52px;
                    height: 52px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, #2dc275 0%, #0d9488 100%);
                    color: #052e16;
                    font-size: 1.5rem;
                    font-weight: 900;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 6px 16px rgba(45, 194, 117, 0.35);
                }
                .hud-student-info h3 {
                    margin: 0 0 3px 0;
                    font-size: 1.15rem;
                    color: #ffffff;
                    font-weight: 800;
                }
                .hud-student-info p {
                    margin: 0;
                    font-size: 0.82rem;
                    color: #94a3b8;
                }
                .hud-info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-bottom: 16px;
                }
                @media (max-width: 560px) {
                    .hud-info-grid { grid-template-columns: 1fr; }
                }
                .hud-info-item {
                    background: rgba(30, 41, 59, 0.5);
                    padding: 9px 12px;
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .hud-info-item .label {
                    font-size: 0.72rem;
                    color: #64748b;
                    text-transform: uppercase;
                    font-weight: 700;
                    display: block;
                    margin-bottom: 3px;
                }
                .hud-info-item .val {
                    font-size: 0.86rem;
                    color: #f1f5f9;
                    font-weight: 700;
                }
                .btn-action-checkin {
                    width: 100%;
                    padding: 13px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: #ffffff;
                    font-size: 0.96rem;
                    font-weight: 800;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 6px 18px rgba(16, 185, 129, 0.35);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }
                .btn-action-checkin:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 24px rgba(16, 185, 129, 0.5);
                }

                .hud-toast-banner {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 18px;
                    border-radius: 14px;
                    margin-bottom: 20px;
                    font-size: 0.9rem;
                    font-weight: 700;
                    animation: slideDownToast 0.25s ease;
                }
                .hud-toast-banner.error {
                    background: rgba(239, 68, 68, 0.15);
                    border: 1.5px solid rgba(239, 68, 68, 0.4);
                    color: #fca5a5;
                }
                .hud-toast-banner.success {
                    background: rgba(16, 185, 129, 0.15);
                    border: 1.5px solid rgba(16, 185, 129, 0.4);
                    color: #6ee7b7;
                }
                .hud-toast-banner.loading {
                    background: rgba(99, 102, 241, 0.15);
                    border: 1.5px solid rgba(99, 102, 241, 0.4);
                    color: #a5b4fc;
                }
                .toast-close-btn {
                    background: transparent;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    font-size: 1.1rem;
                    opacity: 0.7;
                    padding: 0 4px;
                }
                .toast-close-btn:hover { opacity: 1; }
            `}</style>

            <div className="bg-orb orb-1"></div>
            <div className="bg-orb orb-2"></div>

            <div className="page-header-glass" style={{ marginBottom: '24px' }}>
                <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}>
                    <span>📷</span>
                </div>
                <div className="page-header-text">
                    <h1 className="page-header-title">Trạm Soát Vé Trực Tuyến</h1>
                    <p className="page-header-subtitle">Hệ thống quét QR camera & tra cứu mã sinh viên điểm danh sự kiện.</p>
                </div>
            </div>

            <div className="checkin-wrapper">

                <div className="checkin-tabs">
                    <button
                        onClick={() => { setActiveTab('QR'); setMsg({ type: '', text: '' }); }}
                        className={`checkin-tab ${activeTab === 'QR' ? 'active' : ''}`}
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                        </svg>
                        Quét mã QR
                    </button>
                    <button
                        onClick={() => { setActiveTab('MANUAL'); setSearchResult(null); setMsg({ type: '', text: '' }); }}
                        className={`checkin-tab ${activeTab === 'MANUAL' ? 'active' : ''}`}
                    >
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                        Tra cứu Mã SV
                    </button>
                </div>

                {msg.text && (
                    <div className={`hud-toast-banner ${msg.type}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{renderIcon()}</span>
                            <span>{msg.text}</span>
                        </div>
                        <button type="button" className="toast-close-btn" onClick={() => setMsg({ type: '', text: '' })} title="Đóng">
                            ✕
                        </button>
                    </div>
                )}

                <div className="checkin-card">

                    <div className="hud-corner hud-tl" />
                    <div className="hud-corner hud-tr" />
                    <div className="hud-corner hud-bl" />
                    <div className="hud-corner hud-br" />

                    <div className="hud-terminal-badge">
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
                        CMCU CHECK-IN TERMINAL v2.5
                    </div>

                    {activeTab === 'QR' && (
                        <div className="fade-in-tab">
                            {!cameraError ? (
                                <>
                                    <div className="scanner-frame">
                                        <div className="corner top-left"></div>
                                        <div className="corner top-right"></div>
                                        <div className="corner bottom-left"></div>
                                        <div className="corner bottom-right"></div>
                                        <div className="scan-line"></div>
                                        <div id="reader" style={{ width: '100%', height: '100%' }}></div>
                                    </div>
                                    <p className="scanner-hint">Căn chỉnh mã QR vé trên điện thoại của sinh viên vào giữa khung hình</p>
                                </>
                            ) : (
                                <div className="camera-error-state">
                                    <div className="camera-error-icon">📷</div>
                                    <h3 style={{ color: '#ffffff', marginBottom: '8px' }}>Không thể mở Camera</h3>
                                    <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Vui lòng kiểm tra quyền truy cập thiết bị hoặc chuyển sang tab Tra cứu Mã SV.</p>
                                    <button className="btn-retry-camera" onClick={() => setCameraError(false)}>
                                        🔄 Thử Lại Camera
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'MANUAL' && (
                        <div className="fade-in-tab">
                            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '16px' }}>

                                <div className="input-group" style={{ position: 'relative' }}>
                                    <label className="input-label-styled">
                                        <span>🎉</span> Sự kiện đang tổ chức:
                                    </label>
                                    <div className="input-field-wrapper">
                                        <span className="input-icon-svg">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                        </span>
                                        <input
                                            type="text"
                                            className="styled-input"
                                            placeholder="Gõ để tìm nhanh sự kiện..."
                                            value={eventSearch}
                                            onChange={(e) => {
                                                setEventSearch(e.target.value);
                                                setShowEventDropdown(true);
                                            }}
                                            onFocus={() => setShowEventDropdown(true)}
                                        />
                                    </div>
                                    {showEventDropdown && (
                                        <>
                                            <div className="dropdown-backdrop" onClick={() => setShowEventDropdown(false)}></div>
                                            <div className="custom-dropdown" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' }}>
                                                {filteredEvents.length > 0 ? (
                                                    filteredEvents.map(ev => (
                                                        <div
                                                            key={ev.event_id}
                                                            className={`dropdown-item ${String(ev.event_id) === eventId ? 'selected' : ''}`}
                                                            style={{ color: '#f8fafc' }}
                                                            onClick={() => {
                                                                setEventId(String(ev.event_id));
                                                                setEventSearch(ev.title);
                                                                setShowEventDropdown(false);
                                                                setSearchResult(null);
                                                            }}
                                                        >
                                                            {ev.title}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="dropdown-item" style={{ color: '#94a3b8', cursor: 'default' }}>Không tìm thấy sự kiện khớp</div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="input-group">
                                    <label className="input-label-styled">
                                        <span>🆔</span> Mã Sinh Viên hoặc Email:
                                    </label>
                                    <div className="manual-search-row">
                                        <div className="input-field-wrapper" style={{ flex: 1 }}>
                                            <span className="input-icon-svg">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="4" width="18" height="16" rx="3" />
                                                    <circle cx="9" cy="10" r="2" />
                                                    <line x1="15" y1="8" x2="17" y2="8" />
                                                    <line x1="15" y1="12" x2="17" y2="12" />
                                                    <line x1="7" y1="16" x2="17" y2="16" />
                                                </svg>
                                            </span>
                                            <input
                                                type="text"
                                                value={searchCode}
                                                onChange={e => setSearchCode(e.target.value)}
                                                placeholder="VD: BIT250001 hoặc BIT250221"
                                                required
                                                className="styled-input"
                                            />
                                        </div>
                                        <button type="submit" className="btn-hud-search" disabled={isSearching}>
                                            {isSearching ? <span className="spinner"></span> : '🔍 Tra cứu'}
                                        </button>
                                    </div>

                                    <div className="quick-tags-container">
                                        <span className="quick-tags-label">💡 Mã có vé sẵn:</span>
                                        <button
                                            type="button"
                                            className="quick-code-pill"
                                            onClick={() => {
                                                setSearchCode('BIT250001');
                                                doSearchWithCode('BIT250001');
                                            }}
                                        >
                                            ⚡ BIT250001
                                        </button>
                                        <button
                                            type="button"
                                            className="quick-code-pill"
                                            onClick={() => {
                                                setSearchCode('BIT250221');
                                                doSearchWithCode('BIT250221');
                                            }}
                                        >
                                            ⚡ BIT250221 (Trần Duy Long)
                                        </button>
                                        <button
                                            type="button"
                                            className="quick-code-pill"
                                            onClick={() => {
                                                setSearchCode('SV0001');
                                                doSearchWithCode('SV0001');
                                            }}
                                        >
                                            ⚡ SV0001
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {searchResult && (
                                <div className="search-result-hud-card slide-up">
                                    <div className="hud-result-top">
                                        <div className="hud-avatar">
                                            {searchResult.full_name ? searchResult.full_name.charAt(0).toUpperCase() : 'S'}
                                        </div>
                                        <div className="hud-student-info">
                                            <h3>{searchResult.full_name}</h3>
                                            <p>Mã SV: <strong style={{ color: '#38bdf8' }}>{searchResult.student_code}</strong> • {searchResult.class_name}</p>
                                        </div>
                                    </div>

                                    <div className="hud-info-grid">
                                        <div className="hud-info-item">
                                            <span className="label">Sự kiện áp dụng:</span>
                                            <span className="val" style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {searchResult.event_title}
                                            </span>
                                        </div>
                                        <div className="hud-info-item">
                                            <span className="label">Mã số vé:</span>
                                            <span className="val" style={{ color: '#2dc275' }}>{searchResult.ticket_code}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', background: 'rgba(30,41,59,0.6)', padding: '10px 14px', borderRadius: '10px' }}>
                                        <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700 }}>Trạng thái soát vé:</span>
                                        <span className={`status-pill ${searchResult.status}`} style={{ fontWeight: 800 }}>
                                            {searchResult.status === 'REGISTERED' ? '🟡 Chưa điểm danh' : (searchResult.status === 'CHECKED_IN' ? '🟢 Đã điểm danh' : '🔴 Đã hủy vé')}
                                        </span>
                                    </div>

                                    {searchResult.status === 'REGISTERED' ? (
                                        <button onClick={handleConfirmCheckin} className="btn-action-checkin">
                                            ✅ XÁC NHẬN ĐIỂM DANH SINH VIÊN
                                        </button>
                                    ) : searchResult.status === 'CHECKED_IN' ? (
                                        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '10px', padding: '12px', color: '#34d399', fontWeight: 700, fontSize: '0.9rem', textAlign: 'center' }}>
                                            ✅ Sinh viên đã điểm danh lúc: {searchResult.checkin_time ? new Date(searchResult.checkin_time).toLocaleString('vi-VN') : 'Trước đó'}
                                        </div>
                                    ) : (
                                        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '10px', padding: '12px', color: '#f87171', fontWeight: 700, fontSize: '0.9rem', textAlign: 'center' }}>
                                            🚫 Vé của sinh viên này đã bị hủy.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
