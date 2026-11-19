import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useOutletContext } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export const CMCU_UNITS = [
    {
        id: 'fit',
        name: 'Khoa CNTT & Truyền thông',
        shortName: 'Khoa CNTT & TT',
        badge: '💻',
        color: '#38bdf8',
        keywords: ['cntt', 'truyền thông', 'ai', 'lab', 'phần mềm', 'deepseek']
    },
    {
        id: 'fbm',
        name: 'Khoa Kinh doanh & Quản lý',
        shortName: 'Khoa KD & Quản lý',
        badge: '📊',
        color: '#f59e0b',
        keywords: ['kinh doanh', 'quản lý', 'kinh tế', 'marketing', 'tài chính', 'khởi nghiệp', 'doanh nghiệp']
    },
    {
        id: 'fad',
        name: 'Khoa Thiết kế Mỹ thuật',
        shortName: 'Khoa Thiết kế MT',
        badge: '🎨',
        color: '#f43f5e',
        keywords: ['thiết kế', 'mỹ thuật', 'đồ họa', 'triển lãm', 'nghệ thuật']
    },
    {
        id: 'flc',
        name: 'Khoa Ngôn ngữ & Văn hóa',
        shortName: 'Khoa Ngôn ngữ & VH',
        badge: '🌐',
        color: '#a855f7',
        keywords: ['ngôn ngữ', 'văn hóa', 'tiếng anh', 'tiếng nhật', 'tiếng hàn', 'thuyết trình']
    },
    {
        id: 'fmt',
        name: 'Khoa Vi điện tử & Viễn thông',
        shortName: 'Khoa Vi điện tử & VT',
        badge: '🔌',
        color: '#06b6d4',
        keywords: ['vi điện tử', 'viễn thông', 'bán dẫn', 'iot', 'kỹ thuật']
    },
    {
        id: 'ctsv',
        name: 'Phòng Công tác Sinh viên',
        shortName: 'Phòng CTSV',
        badge: '🎓',
        color: '#2dc275',
        keywords: ['công tác sinh viên', 'ctsv', 'toàn trường', '20-11', 'nhà giáo']
    },
    {
        id: 'youth',
        name: 'Đoàn Thanh niên – Hội SV',
        shortName: 'Đoàn Thanh niên – Hội SV',
        badge: '🔥',
        color: '#10b981',
        keywords: ['đoàn', 'hội sinh viên', 'clb', 'tình nguyện', 'chào tân', 'văn nghệ']
    }
];

function truncateText(str = '', max = 34) {
    const clean = String(str || '').trim();
    return clean.length > max ? clean.slice(0, max - 1).trim() + '…' : clean;
}

export function getEventUrgencyStatus(event) {
    const now = new Date();
    const start = new Date(event?.start_time);
    const end = new Date(event?.end_time);

    if (isNaN(start.getTime())) {
        return { label: 'Đang mở vé', tone: 'open', isUrgent: false };
    }
    if (!isNaN(end.getTime()) && now > end) {
        return { label: '⏹️ Đã kết thúc', tone: 'ended', isUrgent: false };
    }
    if (now >= start && (!isNaN(end.getTime()) ? now <= end : true)) {
        return { label: '🔴 Đang diễn ra', tone: 'live', isUrgent: true };
    }

    const diffHours = (start - now) / (1000 * 60 * 60);
    const isSameDay =
        start.getDate() === now.getDate() &&
        start.getMonth() === now.getMonth() &&
        start.getFullYear() === now.getFullYear();

    const remainingSeats = Math.max(0, (event?.seat_capacity || 0) - (event?.registered_count || 0));

    if (event?.status !== 'OPEN') {
        return { label: '🔒 Đã đóng ĐK', tone: 'closed', isUrgent: false };
    }
    if (isSameDay) {
        if (diffHours <= 3 || (event?.seat_capacity > 0 && remainingSeats <= 3)) {
            return { label: '⏳ Hôm nay • Sắp đóng ĐK', tone: 'urgent', isUrgent: true };
        }
        return { label: '🔥 Diễn ra hôm nay', tone: 'today', isUrgent: true };
    }
    if (diffHours <= 72) {
        return { label: '⚡ Sắp diễn ra', tone: 'soon', isUrgent: false };
    }
    return { label: '🟢 Đang mở vé', tone: 'open', isUrgent: false };
}

export function generatePosterSvgDataUrl({
    title,
    category,
    faculty,
    guest,
    location,
    startTime,
    themeIndex = 0
}) {
    const themes = [

        {
            bg1: '#140824',
            bg2: '#831843',
            bg3: '#be185d',
            accent: '#fda4af',
            neon: '#f43f5e',
            chipBg: '#ffe4e6',
            chipText: '#881337',
            artType: 'stage'
        },

        {
            bg1: '#050b18',
            bg2: '#0f294a',
            bg3: '#1d4ed8',
            accent: '#7dd3fc',
            neon: '#38bdf8',
            chipBg: '#e0f2fe',
            chipText: '#0c4a6e',
            artType: 'cyber'
        },

        {
            bg1: '#041f14',
            bg2: '#065f46',
            bg3: '#059669',
            accent: '#6ee7b7',
            neon: '#2dc275',
            chipBg: '#d1fae5',
            chipText: '#064e3b',
            artType: 'wave'
        },

        {
            bg1: '#180933',
            bg2: '#4c1d95',
            bg3: '#6d28d9',
            accent: '#fde047',
            neon: '#c084fc',
            chipBg: '#fef9c3',
            chipText: '#713f12',
            artType: 'bauhaus'
        },

        {
            bg1: '#170d06',
            bg2: '#78350f',
            bg3: '#b45309',
            accent: '#fcd34d',
            neon: '#f59e0b',
            chipBg: '#fef3c7',
            chipText: '#78350f',
            artType: 'rays'
        }
    ];

    const t = themes[Math.abs(themeIndex) % themes.length];

    let artworkLayer = '';
    if (t.artType === 'cyber') {
        artworkLayer = `
            <g opacity="0.6">

                <path d="M0 450 L800 450 M120 450 L340 320 M680 450 L460 320 M0 410 L800 410 M0 370 L800 370 M0 330 L800 330" stroke="${t.neon}" stroke-opacity="0.28" stroke-width="1.2" fill="none" />
                <circle cx="580" cy="180" r="140" stroke="${t.neon}" stroke-dasharray="10 8" stroke-width="2" fill="none" opacity="0.4" />
                <circle cx="580" cy="180" r="95" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.5" fill="none" />

                <polygon points="580,70 660,115 660,205 580,250 500,205 500,115" stroke="${t.accent}" stroke-width="2.5" fill="url(#glassFacet)" />
                <polygon points="580,70 660,115 580,160 500,115" fill="${t.neon}" fill-opacity="0.3" />
                <polygon points="500,115 580,160 580,250 500,205" fill="${t.accent}" fill-opacity="0.2" />
                <polygon points="580,160 660,115 660,205 580,250" fill="${t.neon}" fill-opacity="0.45" />

                <circle cx="580" cy="180" r="38" fill="url(#artSphere)" opacity="0.85" />

                <rect x="690" y="270" width="7" height="80" rx="3.5" fill="${t.neon}" opacity="0.6" />
                <rect x="704" y="240" width="7" height="110" rx="3.5" fill="${t.accent}" opacity="0.8" />
                <rect x="718" y="285" width="7" height="65" rx="3.5" fill="${t.neon}" opacity="0.5" />
                <rect x="732" y="225" width="7" height="125" rx="3.5" fill="#ffffff" opacity="0.75" />
                <rect x="746" y="260" width="7" height="90" rx="3.5" fill="${t.accent}" opacity="0.7" />

                <polygon points="420,90 424,102 436,106 424,110 420,122 416,110 404,106 416,102" fill="#ffffff" opacity="0.75" />
                <circle cx="340" cy="180" r="8" fill="${t.accent}" opacity="0.6" />
            </g>
        `;
    } else if (t.artType === 'stage') {
        artworkLayer = `
            <g opacity="0.6">

                <polygon points="620,-20 400,450 840,450" fill="url(#spotBeam)" opacity="0.85" />
                <polygon points="460,-20 240,450 680,450" fill="url(#spotBeam)" opacity="0.65" />

                <circle cx="590" cy="180" r="115" fill="url(#artSphere)" opacity="0.88" />
                <circle cx="590" cy="180" r="150" fill="none" stroke="${t.accent}" stroke-width="2.5" stroke-dasharray="12 10" opacity="0.5" />
                <circle cx="460" cy="280" r="55" fill="${t.accent}" fill-opacity="0.3" stroke="#ffffff" stroke-width="1.5" />
                <circle cx="690" cy="300" r="36" fill="${t.neon}" fill-opacity="0.4" />

                <path d="M120 340 Q 320 220, 520 340 T 800 340" fill="none" stroke="${t.accent}" stroke-width="3" stroke-dasharray="8 8" opacity="0.45" />

                <polygon points="660,70 665,85 680,90 665,95 660,110 655,95 640,90 655,85" fill="#ffffff" opacity="0.9" />
                <polygon points="360,130 363,140 373,143 363,146 360,156 357,146 347,143 357,140" fill="${t.accent}" opacity="0.8" />
            </g>
        `;
    } else if (t.artType === 'bauhaus') {
        artworkLayer = `
            <g opacity="0.58">

                <rect x="470" y="70" width="190" height="190" rx="40" transform="rotate(22 565 165)" fill="url(#glassFacet)" stroke="${t.accent}" stroke-width="2.8" />

                <circle cx="630" cy="230" r="92" fill="url(#artSphere)" opacity="0.88" />
                <circle cx="430" cy="280" r="46" fill="${t.neon}" fill-opacity="0.35" stroke="#ffffff" stroke-width="2" />
                <polygon points="420,310 500,180 580,310" fill="none" stroke="#ffffff" stroke-width="2.5" opacity="0.65" />
                <circle cx="310" cy="140" r="24" fill="${t.accent}" opacity="0.75" />
                <circle cx="680" cy="100" r="18" fill="${t.neon}" opacity="0.85" />
                <line x1="280" y1="360" x2="520" y2="360" stroke="${t.accent}" stroke-width="3" stroke-dasharray="6 6" opacity="0.5" />
            </g>
        `;
    } else if (t.artType === 'rays') {
        artworkLayer = `
            <g opacity="0.55" stroke="${t.accent}">

                <line x1="610" y1="190" x2="320" y2="30" stroke-width="2" opacity="0.4" />
                <line x1="610" y1="190" x2="290" y2="170" stroke-width="2" opacity="0.4" />
                <line x1="610" y1="190" x2="330" y2="330" stroke-width="2" opacity="0.4" />
                <line x1="610" y1="190" x2="460" y2="420" stroke-width="2" opacity="0.4" />

                <circle cx="610" cy="190" r="110" fill="url(#artSphere)" opacity="0.9" stroke="none" />
                <circle cx="610" cy="190" r="150" fill="none" stroke="#ffffff" stroke-dasharray="10 8" stroke-width="2" opacity="0.5" />
                <circle cx="610" cy="190" r="70" fill="none" stroke="${t.neon}" stroke-width="3" opacity="0.6" />

                <rect x="690" y="270" width="7" height="75" rx="3.5" fill="${t.neon}" stroke="none" opacity="0.65" />
                <rect x="704" y="245" width="7" height="100" rx="3.5" fill="${t.accent}" stroke="none" opacity="0.8" />
                <rect x="718" y="280" width="7" height="65" rx="3.5" fill="#ffffff" stroke="none" opacity="0.75" />
            </g>
        `;
    } else {
        artworkLayer = `
            <g opacity="0.58">

                <path d="M260 450 C 400 230, 560 190, 800 80 L 800 450 Z" fill="${t.neon}" fill-opacity="0.32" />
                <circle cx="590" cy="170" r="130" fill="none" stroke="${t.accent}" stroke-width="3" stroke-dasharray="14 10" opacity="0.6" />
                <circle cx="590" cy="170" r="95" fill="url(#artSphere)" opacity="0.88" />
                <circle cx="310" cy="270" r="50" fill="${t.accent}" fill-opacity="0.3" stroke="#ffffff" stroke-width="1.5" />

                <rect x="690" y="260" width="7" height="85" rx="3.5" fill="${t.neon}" opacity="0.65" />
                <rect x="704" y="235" width="7" height="110" rx="3.5" fill="${t.accent}" opacity="0.8" />
                <rect x="718" y="270" width="7" height="75" rx="3.5" fill="#ffffff" opacity="0.75" />
                <rect x="732" y="250" width="7" height="95" rx="3.5" fill="${t.neon}" opacity="0.65" />
            </g>
        `;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
        <defs>
            <linearGradient id="baseBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${t.bg1}" />
                <stop offset="45%" stop-color="${t.bg2}" />
                <stop offset="100%" stop-color="${t.bg3}" />
            </linearGradient>
            <linearGradient id="spotBeam" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.75" />
                <stop offset="100%" stop-color="${t.neon}" stop-opacity="0" />
            </linearGradient>
            <radialGradient id="artSphere" cx="32%" cy="32%" r="68%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
                <stop offset="35%" stop-color="${t.accent}" />
                <stop offset="75%" stop-color="${t.neon}" />
                <stop offset="100%" stop-color="${t.bg1}" />
            </radialGradient>
            <linearGradient id="glassFacet" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.32" />
                <stop offset="100%" stop-color="${t.neon}" stop-opacity="0.08" />
            </linearGradient>
            <pattern id="dotGrid" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="1.5" fill="#ffffff" fill-opacity="0.14" />
            </pattern>
        </defs>

        <rect width="800" height="450" fill="url(#baseBg)" />
        <rect width="800" height="450" fill="url(#dotGrid)" />
        ${artworkLayer}
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getEventEnrichedData(event, isAdminView = false) {
    let savedMap = {};
    try {
        savedMap = JSON.parse(localStorage.getItem('cmcu_event_custom_meta') || '{}');
    } catch {
        savedMap = {};
    }
    const custom = savedMap[event?.event_id] || {};

    const title = (event?.title || '').toLowerCase();
    let defaultCategory = 'Hội thảo & Công nghệ';
    let defaultFaculty = 'Phòng Công tác Sinh viên';
    let defaultGuest = 'Ban Chủ nhiệm Khoa & Diễn giả khách mời';
    let themeIndex = Math.abs((event?.event_id || 1) - 1) % 5;

    if (title.includes('20-11') || title.includes('nhà giáo')) {
        defaultCategory = 'Văn nghệ & Lễ kỷ niệm';
        defaultFaculty = 'Phòng Công tác Sinh viên';
        defaultGuest = 'Ban Giám hiệu & Đoàn Thanh niên CMCU';
        themeIndex = 0;
    } else if (title.includes('cntt') || title.includes('ai') || title.includes('sự kiện a')) {
        defaultCategory = 'Hội thảo & Công nghệ';
        defaultFaculty = 'Khoa CNTT & Truyền thông';
        defaultGuest = 'Giảng viên Khoa CNTT & Chuyên gia AI';
        themeIndex = 1;
    } else if (title.includes('lab') || title.includes('sự kiện c') || title.includes('workshop') || title.includes('thuyết trình')) {
        defaultCategory = 'Workshop & Trải nghiệm';
        defaultFaculty = 'Khoa Ngôn ngữ & Văn hóa';
        defaultGuest = 'Giảng viên hướng dẫn Kỹ năng mềm CMCU';
        themeIndex = 3;
    } else if (title.includes('toàn trường') || title.includes('sự kiện b')) {
        defaultCategory = 'Giao lưu Sinh viên';
        defaultFaculty = 'Đoàn Thanh niên – Hội SV';
        defaultGuest = 'Đoàn Thanh niên & Hội Sinh viên CMCU';
        themeIndex = 2;
    }

    const category = custom.category || event?.category || defaultCategory;
    const faculty = custom.faculty || event?.faculty || defaultFaculty;
    const guest = custom.guest || event?.speaker?.name || defaultGuest;

    const autoHorizontal = generatePosterSvgDataUrl({
        title: event?.title || 'Sự kiện CMCU',
        category,
        faculty,
        guest,
        location: event?.location || 'Đại học CMC',
        startTime: event?.start_time,
        themeIndex,
        isAdminView
    });

    const userBanner = custom.banner_url || event?.banner_url || '';

    return {
        category,
        faculty,
        guest,
        banner_url: userBanner || autoHorizontal,
        isAutoBanner: !userBanner,
        urgency: getEventUrgencyStatus(event)
    };
}

function EventList() {
    const { user } = useAuth();
    const outletContext = useOutletContext() || {};
    const isLight = outletContext.colorMode === 'light';

    const currentRole = (user?.system_role || user?.role || '').toString().toUpperCase();
    const isAdminOrStaff = currentRole === 'ADMIN' || currentRole === 'STAFF';

    const [searchParams, setSearchParams] = useSearchParams();
    const filterRef = useRef(null);
    const catalogSectionRef = useRef(null);

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [heroIndex, setHeroIndex] = useState(0);
    const [heroPaused, setHeroPaused] = useState(false);

    const [quickTab, setQuickTab] = useState('ALL');
    const [selectedUnitId, setSelectedUnitId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 9;

    const venuesRowRef = useRef(null);
    const [isVenueHovered, setIsVenueHovered] = useState(false);

    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [filterDate, setFilterDate] = useState('');
    const [filterTimeSlot, setFilterTimeSlot] = useState('ALL');
    const [filterCategory, setFilterCategory] = useState('ALL');

    const topKeyword = searchParams.get('q') || '';

    useEffect(() => {
        setCurrentPage(1);
    }, [quickTab, selectedUnitId, filterDate, filterTimeSlot, filterCategory, topKeyword]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await apiClient.get('/events');
                const payload = response.data;
                const eventList = Array.isArray(payload)
                    ? payload
                    : (payload?.data || payload?.events || []);
                setEvents(eventList);
            } catch (error) {
                console.error('Lỗi lấy sự kiện:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    useEffect(() => {
        if (events.length <= 2 || heroPaused) return;
        const timer = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % events.length);
        }, 5500);
        return () => clearInterval(timer);
    }, [events.length, heroPaused]);

    useEffect(() => {
        if (isVenueHovered) return;
        const interval = setInterval(() => {
            const el = venuesRowRef.current;
            if (!el) return;
            const maxScroll = el.scrollWidth - el.clientWidth;
            if (el.scrollLeft >= maxScroll - 15) {
                el.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                el.scrollBy({ left: 280, behavior: 'smooth' });
            }
        }, 3200);
        return () => clearInterval(interval);
    }, [isVenueHovered]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setShowFilterMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading) {
        return (
            <div
                style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    color: '#2dc275',
                    fontWeight: 700,
                    background: isLight ? '#ffffff' : '#121216',
                    borderRadius: '20px'
                }}
            >
                ⏳ Đang tải không gian sự kiện CMCU...
            </div>
        );
    }

    const enrichedEvents = events.map((ev) => ({
        ...ev,
        ...getEventEnrichedData(ev, isAdminOrStaff)
    }));

    const heroPair =
        enrichedEvents.length === 0
            ? []
            : enrichedEvents.length === 1
                ? [enrichedEvents[0]]
                : [
                    enrichedEvents[heroIndex % enrichedEvents.length],
                    enrichedEvents[(heroIndex + 1) % enrichedEvents.length]
                ];

    const nextHero = () => {
        if (enrichedEvents.length > 0) setHeroIndex((prev) => (prev + 1) % enrichedEvents.length);
    };
    const prevHero = () => {
        if (enrichedEvents.length > 0) setHeroIndex((prev) => (prev - 1 + enrichedEvents.length) % enrichedEvents.length);
    };

    const now = new Date();
    const isEventInThisWeek = (ev) => {
        const d = new Date(ev.start_time);
        if (isNaN(d.getTime())) return false;
        const diffDays = (d - now) / (1000 * 60 * 60 * 24);
        return diffDays >= -0.5 && diffDays <= 7;
    };

    const thisWeekEvents = enrichedEvents
        .filter((ev) => isEventInThisWeek(ev) && ev.status === 'OPEN')
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    const venueStatsMap = new Map();
    enrichedEvents.forEach((ev) => {
        const rawLoc = (ev.location || '').trim();
        if (!rawLoc) return;
        const key = rawLoc.toLowerCase();
        if (!venueStatsMap.has(key)) {
            venueStatsMap.set(key, { name: rawLoc, count: 1 });
        } else {
            venueStatsMap.get(key).count += 1;
        }
    });
    const dynamicVenues = Array.from(venueStatsMap.values());

    const categoryList = ['ALL', ...new Set(enrichedEvents.map((e) => e.category))];
    const selectedUnitObj = CMCU_UNITS.find((u) => u.id === selectedUnitId) || null;

    const matchUnitForEvent = (event, unit) => {
        const haystack = `${event.faculty || ''} ${event.title || ''} ${event.description || ''}`.toLowerCase();
        return event.faculty === unit.name || unit.keywords.some((kw) => haystack.includes(kw));
    };

    const filteredEvents = enrichedEvents.filter((event) => {
        const q = topKeyword.trim().toLowerCase();
        const matchKeyword =
            !q ||
            (event.title || '').toLowerCase().includes(q) ||
            (event.location || '').toLowerCase().includes(q) ||
            (event.guest || '').toLowerCase().includes(q) ||
            (event.category || '').toLowerCase().includes(q) ||
            (event.faculty || '').toLowerCase().includes(q);

        let matchQuickTab = true;
        if (quickTab === 'THIS_WEEK') matchQuickTab = isEventInThisWeek(event);
        if (quickTab === 'OPEN') matchQuickTab = event.status === 'OPEN';

        const matchSelectedUnit = !selectedUnitObj || matchUnitForEvent(event, selectedUnitObj);
        const matchCategory = filterCategory === 'ALL' || event.category === filterCategory;

        let matchDate = true;
        if (filterDate) {
            const d = new Date(event.start_time);
            if (!isNaN(d.getTime())) {
                const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                matchDate = dStr === filterDate;
            }
        }

        let matchTimeSlot = true;
        if (filterTimeSlot !== 'ALL') {
            const d = new Date(event.start_time);
            if (!isNaN(d.getTime())) {
                const hour = d.getHours();
                if (filterTimeSlot === 'MORNING') matchTimeSlot = hour >= 5 && hour < 12;
                if (filterTimeSlot === 'AFTERNOON') matchTimeSlot = hour >= 12 && hour < 18;
                if (filterTimeSlot === 'EVENING') matchTimeSlot = hour >= 18 || hour < 5;
            }
        }

        return matchKeyword && matchQuickTab && matchSelectedUnit && matchCategory && matchDate && matchTimeSlot;
    });

    const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE) || 1;
    const paginatedEvents = filteredEvents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const activeFilterCount =
        (filterDate ? 1 : 0) +
        (filterTimeSlot !== 'ALL' ? 1 : 0) +
        (filterCategory !== 'ALL' ? 1 : 0);

    const resetAllFilters = () => {
        setQuickTab('ALL');
        setSelectedUnitId(null);
        setFilterDate('');
        setFilterTimeSlot('ALL');
        setFilterCategory('ALL');
        if (topKeyword) {
            const next = new URLSearchParams(searchParams);
            next.delete('q');
            setSearchParams(next, { replace: true });
        }
    };

    const handleVenueFilter = (venueName) => {
        const next = new URLSearchParams(searchParams);
        if (topKeyword.toLowerCase() === venueName.toLowerCase()) {
            next.delete('q');
        } else {
            next.set('q', venueName);
        }
        setSearchParams(next, { replace: true });
        catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatShortDate = (dateStr) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Đang cập nhật';
        return `${String(d.getDate()).padStart(2, '0')} Th ${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const formatHeroTime = (dateStr) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Sắp diễn ra';
        const hours = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${hours}:${mins} • ${day} Th ${month}`;
    };

    const badgeToneStyles = {
        live: { background: '#ef4444', color: '#ffffff' },
        urgent: { background: 'linear-gradient(90deg, #f97316, #ef4444)', color: '#ffffff' },
        today: { background: '#f59e0b', color: '#090d16' },
        soon: { background: '#0284c7', color: '#ffffff' },
        open: { background: 'rgba(16, 185, 129, 0.94)', color: '#ffffff' },
        closed: { background: 'rgba(100, 116, 139, 0.92)', color: '#ffffff' },
        ended: { background: 'rgba(71, 85, 105, 0.92)', color: '#e2e8f0' }
    };

    const venueGradients = [
        { bg: 'radial-gradient(circle at 75% 22%, #2563eb 0%, #0f172a 78%)', overlay: 'linear-gradient(180deg, rgba(15,23,42,0.12) 0%, rgba(16,185,129,0.92) 100%)', icon: '🏛️' },
        { bg: 'radial-gradient(circle at 28% 28%, #7c3aed 0%, #0f172a 78%)', overlay: 'linear-gradient(180deg, rgba(15,23,42,0.12) 0%, rgba(5,150,105,0.94) 100%)', icon: '💻' },
        { bg: 'radial-gradient(circle at 75% 28%, #0d9488 0%, #0f172a 78%)', overlay: 'linear-gradient(180deg, rgba(15,23,42,0.12) 0%, rgba(16,185,129,0.92) 100%)', icon: '📍' },
        { bg: 'radial-gradient(circle at 32% 24%, #db2777 0%, #0f172a 78%)', overlay: 'linear-gradient(180deg, rgba(15,23,42,0.12) 0%, rgba(45,194,117,0.94) 100%)', icon: '🎪' }
    ];

    return (
        <div className={`cmcu-events-hub ${isLight ? 'hub-light' : 'hub-dark'}`}>
            <style>{`
                .cmcu-events-hub {
                    position: relative;
                    max-width: 1240px;
                    margin: 0 auto;
                    border-radius: 22px;
                    padding: 24px 26px 48px 26px;
                    transition: all 0.25s ease;
                    overflow: hidden;
                }
                .hub-dark {
                    background: #121216;
                    background-image:
                        radial-gradient(ellipse 60% 25% at 20% 4%, rgba(45, 194, 117, 0.16) 0%, transparent 70%),
                        radial-gradient(ellipse 50% 22% at 82% 10%, rgba(56, 189, 248, 0.12) 0%, transparent 70%);
                    color: #f8fafc;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }
                .hub-light {
                    background: #ffffff;
                    color: #0f172a;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 12px 32px -10px rgba(15, 23, 42, 0.08);
                }
                @media (max-width: 768px) {
                    .cmcu-events-hub { padding: 16px 14px 32px 14px; }
                }

                .cmcu-ambient-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(85px);
                    pointer-events: none;
                    z-index: 0;
                    opacity: 0.28;
                }
                .hub-dark .cmcu-ambient-orb.orb-1 {
                    width: 480px;
                    height: 480px;
                    top: -80px;
                    left: -100px;
                    background: radial-gradient(circle, #2dc275 0%, #0d9488 60%, transparent 80%);
                    animation: orbFloat1 16s ease-in-out infinite alternate;
                }
                .hub-dark .cmcu-ambient-orb.orb-2 {
                    width: 440px;
                    height: 440px;
                    top: 360px;
                    right: -90px;
                    background: radial-gradient(circle, #6366f1 0%, #a855f7 60%, transparent 80%);
                    animation: orbFloat2 20s ease-in-out infinite alternate;
                }
                .hub-dark .cmcu-ambient-orb.orb-3 {
                    width: 380px;
                    height: 380px;
                    bottom: 120px;
                    left: 25%;
                    background: radial-gradient(circle, #38bdf8 0%, #2563eb 60%, transparent 80%);
                    animation: orbFloat3 18s ease-in-out infinite alternate;
                }
                @keyframes orbFloat1 {
                    0% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(60px, 40px) scale(1.12); }
                    100% { transform: translate(-35px, 75px) scale(0.96); }
                }
                @keyframes orbFloat2 {
                    0% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-50px, -35px) scale(1.14); }
                    100% { transform: translate(35px, -65px) scale(0.92); }
                }
                @keyframes orbFloat3 {
                    0% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(45px, -30px) scale(1.08); }
                    100% { transform: translate(-30px, 45px) scale(0.94); }
                }
                @keyframes radarPulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.75); }
                    70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }

                .tbx-hero-stage {
                    position: relative;
                    margin-bottom: 24px;
                    z-index: 1;
                }
                .tbx-hero-pair {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 18px;
                }
                @media (max-width: 860px) {
                    .tbx-hero-pair {
                        grid-template-columns: 1fr;
                    }
                    .tbx-hero-pair .tbx-hero-banner-item:nth-child(n+2) {
                        display: none;
                    }
                    .tbx-hero-banner-item {
                        aspect-ratio: auto;
                        min-height: 260px;
                        border-radius: 16px;
                    }
                    .tbx-hero-top-badges {
                        top: 10px;
                        left: 10px;
                        gap: 5px;
                        max-width: calc(100% - 110px);
                    }
                    .hero-faculty-chip, .hero-category-chip {
                        font-size: 0.68rem;
                        padding: 3px 8px;
                    }
                    .hero-status-pulse {
                        top: 10px;
                        right: 10px;
                        font-size: 0.68rem;
                        padding: 3px 8px;
                    }
                    .tbx-hero-content {
                        padding: 12px 14px 12px 14px;
                        gap: 5px;
                    }
                    .tbx-hero-title {
                        font-size: 1.05rem;
                        line-height: 1.35;
                    }
                    .tbx-hero-meta-row {
                        gap: 8px;
                        font-size: 0.74rem;
                    }
                    .tbx-hero-footer {
                        gap: 8px;
                        margin-top: 4px;
                    }
                    .tbx-hero-price-tag {
                        font-size: 0.78rem;
                        white-space: nowrap;
                    }
                    .tbx-hero-see-btn {
                        font-size: 0.76rem;
                        padding: 6px 12px;
                        white-space: nowrap;
                        flex-shrink: 0;
                    }
                    .tbx-hero-nav {
                        width: 32px;
                        height: 32px;
                        font-size: 1.1rem;
                    }
                    .tbx-hero-nav.left { left: 6px; }
                    .tbx-hero-nav.right { right: 6px; }
                }
                .tbx-hero-banner-item {
                    position: relative;
                    display: block;
                    aspect-ratio: 16 / 9;
                    border-radius: 18px;
                    overflow: hidden;
                    border: 1.5px solid rgba(255, 255, 255, 0.14);
                    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.42);
                    text-decoration: none;
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease;
                }
                .tbx-hero-banner-item:hover {
                    transform: translateY(-5px) scale(1.008);
                    border-color: #2dc275;
                    box-shadow: 0 24px 48px -10px rgba(45, 194, 117, 0.32), 0 0 0 1px rgba(45, 194, 117, 0.45);
                }
                .tbx-hero-banner-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .tbx-hero-banner-item:hover img {
                    transform: scale(1.04);
                }

                .tbx-hero-scrim {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        180deg,
                        rgba(7, 10, 19, 0.22) 0%,
                        rgba(7, 10, 19, 0.48) 42%,
                        rgba(6, 9, 18, 0.94) 92%
                    );
                    pointer-events: none;
                    z-index: 1;
                    transition: background 0.3s ease;
                }
                .tbx-hero-banner-item:hover .tbx-hero-scrim {
                    background: linear-gradient(
                        180deg,
                        rgba(7, 10, 19, 0.12) 0%,
                        rgba(7, 10, 19, 0.42) 38%,
                        rgba(6, 9, 18, 0.97) 92%
                    );
                }

                .tbx-hero-top-badges {
                    position: absolute;
                    top: 14px;
                    left: 14px;
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    z-index: 2;
                    flex-wrap: wrap;
                    max-width: 65%;
                }
                .hero-faculty-chip, .hero-category-chip {
                    background: rgba(15, 23, 42, 0.78);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    color: #f1f5f9;
                    font-size: 0.73rem;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 999px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                }
                .hero-category-chip {
                    background: rgba(45, 194, 117, 0.22);
                    border-color: rgba(45, 194, 117, 0.45);
                    color: #4ade80;
                }

                .hero-status-pulse {
                    position: absolute;
                    top: 14px;
                    right: 14px;
                    z-index: 2;
                    animation: radarPulse 2.4s infinite cubic-bezier(0.4, 0, 0.6, 1);
                }

                .tbx-hero-content {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 16px 20px 15px 20px;
                    z-index: 2;
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                }
                .tbx-hero-title {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 900;
                    color: #ffffff;
                    line-height: 1.35;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.85);
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                @media (max-width: 640px) {
                    .cmcu-events-hub {
                        padding: 12px 8px 24px 8px;
                        border-radius: 14px;
                    }
                    .tbx-hero-title { font-size: 1.05rem; }
                    .events-main-grid {
                        grid-template-columns: 1fr;
                        gap: 14px;
                    }
                    .tbx-venue-card-horiz {
                        min-width: 210px;
                        max-width: 230px;
                        height: 125px;
                    }
                    .adv-filter-popover {
                        right: 0;
                        left: auto;
                        max-width: calc(100vw - 28px);
                        width: 290px;
                    }
                    .pagination-step-btn {
                        padding: 6px 10px;
                        font-size: 0.78rem;
                    }
                    .pagination-num-btn {
                        min-width: 30px;
                        height: 30px;
                        font-size: 0.78rem;
                    }
                }
                .tbx-hero-meta-row {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 12px;
                    font-size: 0.8rem;
                    color: #cbd5e1;
                }
                .tbx-hero-meta-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    text-shadow: 0 1px 4px rgba(0,0,0,0.7);
                }
                .tbx-seats-pill {
                    background: rgba(255, 255, 255, 0.14);
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-size: 0.74rem;
                    color: #f8fafc;
                }
                .tbx-hero-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: 3px;
                }
                .tbx-hero-price-tag {
                    font-size: 0.82rem;
                    font-weight: 800;
                    color: #2dc275;
                    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
                }
                .tbx-hero-see-btn {
                    background: #ffffff;
                    color: #0f172a;
                    font-weight: 800;
                    font-size: 0.82rem;
                    padding: 7px 16px;
                    border-radius: 8px;
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .tbx-hero-banner-item:hover .tbx-hero-see-btn {
                    background: #2dc275;
                    color: #052e16;
                    transform: translateX(3px);
                }

                .tbx-hero-dots-bar {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                    margin-top: 14px;
                }
                .tbx-hero-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.25);
                    border: none;
                    padding: 0;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .tbx-hero-dot.active {
                    width: 26px;
                    border-radius: 999px;
                    background: #2dc275;
                    box-shadow: 0 0 10px rgba(45, 194, 117, 0.6);
                }
                .tbx-hero-nav {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    background: rgba(15, 23, 42, 0.82);
                    color: #ffffff;
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 5;
                    font-size: 1.25rem;
                }
                .tbx-hero-nav:hover { background: #2dc275; color: #052e16; }
                .tbx-hero-nav.left { left: 10px; }
                .tbx-hero-nav.right { right: 10px; }

                .cmcu-units-wrap {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 9px;
                    margin-bottom: 24px;
                }
                .unit-filter-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    padding: 8px 14px;
                    border-radius: 999px;
                    font-size: 0.82rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .hub-dark .unit-filter-pill {
                    background: #1a1c23;
                    color: #e2e8f0;
                    border: 1px solid rgba(255, 255, 255, 0.13);
                }
                .hub-dark .unit-filter-pill:hover {
                    border-color: #2dc275;
                    transform: translateY(-1px);
                }
                .hub-light .unit-filter-pill {
                    background: #f8fafc;
                    color: #334155;
                    border: 1px solid #cbd5e1;
                }
                .hub-light .unit-filter-pill:hover {
                    border-color: #16a34a;
                    transform: translateY(-1px);
                }
                .unit-filter-pill.active {
                    background: #2dc275 !important;
                    color: #052e16 !important;
                    border-color: #2dc275 !important;
                    font-weight: 800;
                    box-shadow: 0 4px 14px rgba(45, 194, 117, 0.35);
                }
                .unit-count-dot {
                    font-size: 0.72rem;
                    padding: 1px 7px;
                    border-radius: 999px;
                    background: rgba(255, 255, 255, 0.12);
                }
                .hub-light .unit-count-dot {
                    background: rgba(15, 23, 42, 0.08);
                }

                .events-main-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(295px, 1fr));
                    gap: 22px;
                    margin-bottom: 36px;
                }
                .tbx-ticket-card {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    border-radius: 18px;
                    overflow: hidden;
                    transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease, border-color 0.25s ease;
                }
                .hub-dark .tbx-ticket-card {
                    background: #1a1b22;
                    border: 1px solid rgba(255, 255, 255, 0.11);
                    color: #f8fafc;
                }
                .hub-light .tbx-ticket-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    color: #0f172a;
                    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
                }
                .tbx-ticket-card:hover {
                    transform: translateY(-6px);
                    border-color: #2dc275;
                    box-shadow: 0 18px 36px rgba(45, 194, 117, 0.2);
                }

                .tbx-ticket-poster {
                    position: relative;
                    aspect-ratio: 16 / 9;
                    overflow: hidden;
                    background: #090d16;
                    display: block;
                }
                .tbx-ticket-poster img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    transition: transform 0.45s ease;
                }
                .tbx-ticket-card:hover .tbx-ticket-poster img {
                    transform: scale(1.04);
                }

                .tbx-perforation-line {
                    position: relative;
                    height: 1px;
                    border-top: 2px dashed rgba(148, 163, 184, 0.28);
                }
                .tbx-perforation-line::before,
                .tbx-perforation-line::after {
                    content: '';
                    position: absolute;
                    top: -9px;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    z-index: 3;
                }
                .hub-dark .tbx-perforation-line::before,
                .hub-dark .tbx-perforation-line::after {
                    background: #121216;
                }
                .hub-light .tbx-perforation-line::before,
                .hub-light .tbx-perforation-line::after {
                    background: #ffffff;
                }
                .tbx-perforation-line::before { left: -10px; }
                .tbx-perforation-line::after { right: -10px; }

                .poster-status-chip {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding: 4px 11px;
                    border-radius: 999px;
                    font-size: 0.72rem;
                    font-weight: 800;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                }

                .tbx-ticket-stub-body {
                    padding: 14px 16px 16px 16px;
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }
                .tbx-stub-title {
                    font-size: 0.98rem;
                    font-weight: 800;
                    line-height: 1.36;
                    margin: 0 0 8px 0;
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .tbx-stub-green-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.84rem;
                    font-weight: 800;
                    color: #2dc275;
                    margin-bottom: 6px;
                }
                .tbx-stub-sub-row {
                    font-size: 0.79rem;
                    opacity: 0.78;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .admin-card-quick-bar {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 6px;
                    margin-top: 12px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(148, 163, 184, 0.18);
                }
                .admin-q-btn {
                    padding: 6px 8px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-align: center;
                    text-decoration: none;
                    transition: all 0.18s ease;
                }
                .admin-q-btn.edit {
                    background: rgba(59, 130, 246, 0.16);
                    color: #60a5fa;
                    border: 1px solid rgba(59, 130, 246, 0.35);
                }
                .admin-q-btn.edit:hover { background: #2563eb; color: #ffffff; }
                .admin-q-btn.list {
                    background: rgba(168, 85, 247, 0.16);
                    color: #c084fc;
                    border: 1px solid rgba(168, 85, 247, 0.35);
                }
                .admin-q-btn.list:hover { background: #7c3aed; color: #ffffff; }
                .admin-q-btn.qr {
                    background: rgba(45, 194, 117, 0.18);
                    color: #34d399;
                    border: 1px solid rgba(45, 194, 117, 0.4);
                }
                .admin-q-btn.qr:hover { background: #2dc275; color: #052e16; }

                .tbx-venues-row {
                    display: flex;
                    gap: 16px;
                    overflow-x: auto;
                    scroll-behavior: smooth;
                    padding: 6px 4px 14px 4px;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(45, 194, 117, 0.4) transparent;
                    -webkit-overflow-scrolling: touch;
                }
                .tbx-venues-row::-webkit-scrollbar {
                    height: 6px;
                }
                .tbx-venues-row::-webkit-scrollbar-thumb {
                    background: rgba(45, 194, 117, 0.4);
                    border-radius: 99px;
                }
                .tbx-venue-card-horiz {
                    position: relative;
                    min-width: 255px;
                    max-width: 275px;
                    flex-shrink: 0;
                    height: 140px;
                    border-radius: 18px;
                    overflow: hidden;
                    cursor: pointer;
                    border: 1.5px solid rgba(255, 255, 255, 0.14);
                    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
                }
                .tbx-venue-card-horiz:hover {
                    transform: translateY(-4px) scale(1.02);
                    border-color: #2dc275;
                    box-shadow: 0 12px 28px rgba(45, 194, 117, 0.25);
                }
                .venue-nav-arrow {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    background: rgba(30, 41, 59, 0.85);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    color: #ffffff;
                    font-size: 1.15rem;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                .venue-nav-arrow:hover {
                    background: #2dc275;
                    color: #052e16;
                    border-color: #2dc275;
                    transform: scale(1.08);
                }
                .tbx-venue-overlay {
                    position: absolute;
                    inset: 0;
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .pagination-wrapper-glass {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                    margin-top: 10px;
                    margin-bottom: 36px;
                    padding: 12px;
                    background: rgba(26, 27, 34, 0.7);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    backdrop-filter: blur(12px);
                    flex-wrap: wrap;
                }
                .pagination-step-btn {
                    padding: 8px 16px;
                    border-radius: 10px;
                    font-size: 0.86rem;
                    font-weight: 700;
                    border: 1px solid rgba(255, 255, 255, 0.14);
                    background: rgba(255, 255, 255, 0.06);
                    color: #f8fafc;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .pagination-step-btn:hover:not(:disabled) {
                    background: rgba(45, 194, 117, 0.2);
                    border-color: #2dc275;
                    color: #2dc275;
                }
                .pagination-step-btn:disabled {
                    opacity: 0.35;
                    cursor: not-allowed;
                }
                .pagination-numbers {
                    display: flex;
                    gap: 6px;
                    align-items: center;
                }
                .pagination-num-btn {
                    min-width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    font-size: 0.88rem;
                    font-weight: 700;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    background: rgba(255, 255, 255, 0.04);
                    color: #cbd5e1;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                .pagination-num-btn:hover {
                    background: rgba(255, 255, 255, 0.12);
                    color: #ffffff;
                    border-color: rgba(255, 255, 255, 0.25);
                }
                .pagination-num-btn.active {
                    background: linear-gradient(135deg, #2dc275 0%, #16a34a 100%) !important;
                    color: #052e16 !important;
                    font-weight: 900 !important;
                    border-color: #2dc275 !important;
                    box-shadow: 0 4px 14px rgba(45, 194, 117, 0.4) !important;
                }

                .adv-filter-popover {
                    position: absolute;
                    top: calc(100% + 10px);
                    right: 0;
                    width: 310px;
                    border-radius: 16px;
                    padding: 16px;
                    z-index: 100;
                    box-shadow: 0 20px 44px rgba(0, 0, 0, 0.45);
                }
                .hub-dark .adv-filter-popover {
                    background: #1e1e26;
                    border: 1px solid rgba(255, 255, 255, 0.16);
                    color: #f8fafc;
                }
                .hub-light .adv-filter-popover {
                    background: #ffffff;
                    border: 1px solid #cbd5e1;
                    color: #0f172a;
                }
                .adv-filter-input {
                    width: 100%;
                    padding: 8px 10px;
                    border-radius: 9px;
                    font-size: 0.86rem;
                    margin-top: 4px;
                }
                .hub-dark .adv-filter-input {
                    background: #121216;
                    border: 1px solid #334155;
                    color: #ffffff;
                }
                .hub-light .adv-filter-input {
                    background: #f8fafc;
                    border: 1px solid #cbd5e1;
                    color: #0f172a;
                }
            `}</style>

            {!isLight && (
                <>
                    <div className="cmcu-ambient-orb orb-1" aria-hidden="true" />
                    <div className="cmcu-ambient-orb orb-2" aria-hidden="true" />
                    <div className="cmcu-ambient-orb orb-3" aria-hidden="true" />
                </>
            )}

            {heroPair.length > 0 && (
                <div
                    className="tbx-hero-stage"
                    onMouseEnter={() => setHeroPaused(true)}
                    onMouseLeave={() => setHeroPaused(false)}
                >
                    {enrichedEvents.length > 2 && (
                        <>
                            <button type="button" className="tbx-hero-nav left" onClick={prevHero} aria-label="Trước">
                                ‹
                            </button>
                            <button type="button" className="tbx-hero-nav right" onClick={nextHero} aria-label="Sau">
                                ›
                            </button>
                        </>
                    )}

                    <div className="tbx-hero-pair">
                        {heroPair.map((ev) => {
                            const chipStyle = badgeToneStyles[ev.urgency.tone] || badgeToneStyles.open;
                            return (
                                <Link
                                    to={`/events/${ev.event_id}`}
                                    key={`hero-${ev.event_id}`}
                                    className="tbx-hero-banner-item"
                                >
                                    <img src={ev.banner_url} alt={ev.title} />

                                    <div className="tbx-hero-scrim" />

                                    <div className="tbx-hero-top-badges">
                                        <span className="hero-faculty-chip">
                                            🏛️ {ev.faculty || 'CMCU'}
                                        </span>
                                        <span className="hero-category-chip">
                                            ✨ {ev.category || 'Sự kiện'}
                                        </span>
                                    </div>

                                    <span className="poster-status-chip hero-status-pulse" style={chipStyle}>
                                        {ev.urgency.label}
                                    </span>

                                    <div className="tbx-hero-content">
                                        <h3 className="tbx-hero-title" title={ev.title}>
                                            {ev.title}
                                        </h3>

                                        <div className="tbx-hero-meta-row">
                                            <span className="tbx-hero-meta-item">
                                                📅 {formatHeroTime(ev.start_time)}
                                            </span>
                                            <span className="tbx-hero-meta-item">
                                                📍 {ev.location || 'Hội trường CMCU'}
                                            </span>
                                            <span className="tbx-hero-meta-item tbx-seats-pill">
                                                👥 {ev.registered_count || 0}/{ev.seat_capacity || ev.max_seats || '∞'} chỗ
                                            </span>
                                        </div>

                                        <div className="tbx-hero-footer">
                                            <span className="tbx-hero-price-tag">
                                                {ev.is_free !== false ? '🎟️ Vé miễn phí' : '🎟️ Có phí tham dự'}
                                            </span>
                                            <span className="tbx-hero-see-btn">
                                                {isAdminOrStaff ? 'Quản trị sự kiện ▸' : 'Xem chi tiết ▸'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {enrichedEvents.length > 2 && (
                        <div className="tbx-hero-dots-bar">
                            {enrichedEvents.map((_, dotIdx) => (
                                <button
                                    key={`hdot-${dotIdx}`}
                                    type="button"
                                    className={`tbx-hero-dot ${dotIdx === heroIndex % enrichedEvents.length ? 'active' : ''}`}
                                    onClick={() => setHeroIndex(dotIdx)}
                                    aria-label={`Slide ${dotIdx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div
                id="cmcu-all-events-section"
                ref={catalogSectionRef}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '12px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.22rem', fontWeight: 900, margin: '0 8px 0 0' }}>
                        🎟️ Khám phá sự kiện CMCU ({filteredEvents.length})
                    </h2>

                    <button
                        type="button"
                        className={`unit-filter-pill ${quickTab === 'ALL' ? 'active' : ''}`}
                        onClick={() => setQuickTab('ALL')}
                    >
                        Tất cả
                    </button>
                    <button
                        type="button"
                        className={`unit-filter-pill ${quickTab === 'THIS_WEEK' ? 'active' : ''}`}
                        onClick={() => setQuickTab('THIS_WEEK')}
                    >
                        ⚡ Tuần này ({thisWeekEvents.length})
                    </button>
                    <button
                        type="button"
                        className={`unit-filter-pill ${quickTab === 'OPEN' ? 'active' : ''}`}
                        onClick={() => setQuickTab('OPEN')}
                    >
                        🟢 Đang mở vé
                    </button>
                </div>

                <div style={{ position: 'relative' }} ref={filterRef}>
                    <button
                        type="button"
                        className={`unit-filter-pill ${showFilterMenu || activeFilterCount > 0 ? 'active' : ''}`}
                        onClick={() => setShowFilterMenu((prev) => !prev)}
                    >
                        ⚙️ Lọc nâng cao {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
                    </button>

                    {showFilterMenu && (
                        <div className="adv-filter-popover">
                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ fontSize: '0.76rem', fontWeight: 700, opacity: 0.75 }}>
                                    📅 CHỌN NGÀY DIỄN RA
                                </label>
                                <input
                                    type="date"
                                    className="adv-filter-input"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                />
                            </div>

                            <div style={{ marginBottom: '10px' }}>
                                <label style={{ fontSize: '0.76rem', fontWeight: 700, opacity: 0.75 }}>
                                    🕒 KHUNG GIỜ
                                </label>
                                <select
                                    className="adv-filter-input"
                                    value={filterTimeSlot}
                                    onChange={(e) => setFilterTimeSlot(e.target.value)}
                                >
                                    <option value="ALL">Tất cả khung giờ</option>
                                    <option value="MORNING">Buổi sáng (05:00 - 12:00)</option>
                                    <option value="AFTERNOON">Buổi chiều (12:00 - 18:00)</option>
                                    <option value="EVENING">Buổi tối (18:00 - 24:00)</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ fontSize: '0.76rem', fontWeight: 700, opacity: 0.75 }}>
                                    🏷️ LOẠI SỰ KIỆN
                                </label>
                                <select
                                    className="adv-filter-input"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option value="ALL">Tất cả loại sự kiện</option>
                                    {categoryList
                                        .filter((c) => c !== 'ALL')
                                        .map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    type="button"
                                    onClick={resetAllFilters}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: '1px solid #64748b',
                                        background: 'transparent',
                                        color: 'inherit',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Đặt lại
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowFilterMenu(false)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: '#2dc275',
                                        color: '#052e16',
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Áp dụng
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="cmcu-units-wrap">
                {CMCU_UNITS.map((unit) => {
                    const unitEventCount = enrichedEvents.filter((ev) => matchUnitForEvent(ev, unit)).length;
                    return (
                        <button
                            key={unit.id}
                            type="button"
                            className={`unit-filter-pill ${selectedUnitId === unit.id ? 'active' : ''}`}
                            onClick={() => setSelectedUnitId((prev) => (prev === unit.id ? null : unit.id))}
                        >
                            <span>{unit.badge}</span>
                            <span>{unit.shortName}</span>
                            <span className="unit-count-dot">{unitEventCount}</span>
                        </button>
                    );
                })}
            </div>

            {filteredEvents.length === 0 ? (
                <div
                    style={{
                        padding: '36px 20px',
                        textAlign: 'center',
                        borderRadius: '16px',
                        border: '1px dashed rgba(148, 163, 184, 0.35)',
                        marginBottom: '32px'
                    }}
                >
                    <p style={{ marginBottom: '12px', opacity: 0.8 }}>
                        Không tìm thấy sự kiện nào khớp với từ khóa hoặc bộ lọc hiện tại.
                    </p>
                    <button
                        type="button"
                        onClick={resetAllFilters}
                        style={{
                            background: '#2dc275',
                            color: '#052e16',
                            border: 'none',
                            borderRadius: '999px',
                            padding: '8px 20px',
                            fontWeight: 800,
                            cursor: 'pointer'
                        }}
                    >
                        Hiển thị tất cả sự kiện
                    </button>
                </div>
            ) : (
                <>
                    <div className="events-main-grid">
                        {paginatedEvents.map((ev) => {
                            const chipStyle = badgeToneStyles[ev.urgency.tone] || badgeToneStyles.open;
                            const displayTitle = ev.title ? ev.title.charAt(0).toUpperCase() + ev.title.slice(1) : '';

                            return (
                                <div key={ev.event_id} className="tbx-ticket-card">
                                    <Link to={`/events/${ev.event_id}`} className="tbx-ticket-poster">
                                        <img src={ev.banner_url} alt={displayTitle} />
                                        <span className="poster-status-chip" style={chipStyle}>
                                            {ev.urgency.label}
                                        </span>
                                    </Link>

                                    <div className="tbx-perforation-line" />

                                    <div className="tbx-ticket-stub-body">
                                        <Link to={`/events/${ev.event_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <h3 className="tbx-stub-title">{displayTitle}</h3>
                                        </Link>

                                        <div className="tbx-stub-green-row">
                                            <span>
                                                {ev.status === 'OPEN'
                                                    ? `Miễn phí • ${ev.registered_count || 0}/${ev.seat_capacity} chỗ`
                                                    : 'Đã đóng đăng ký'}
                                            </span>
                                            <Link
                                                to={`/events/${ev.event_id}`}
                                                style={{ color: isLight ? '#2563eb' : '#38bdf8', textDecoration: 'none', fontSize: '0.8rem' }}
                                            >
                                                {isAdminOrStaff ? 'Quản trị →' : 'Chi tiết →'}
                                            </Link>
                                        </div>

                                        <div className="tbx-stub-sub-row">
                                            <span>📍 {ev.location}</span>
                                            <span>•</span>
                                            <span>{formatShortDate(ev.start_time)}</span>
                                        </div>

                                        {isAdminOrStaff && (
                                            <div className="admin-card-quick-bar">
                                                <Link to={`/events/${ev.event_id}?edit=true`} className="admin-q-btn edit">
                                                    ✏️ Sửa nhanh
                                                </Link>
                                                <Link
                                                    to={currentRole === 'ADMIN' ? '/admin/events' : `/events/${ev.event_id}`}
                                                    className="admin-q-btn list"
                                                >
                                                    👥 DS ĐK
                                                </Link>
                                                <Link to="/staff/checkin" className="admin-q-btn qr">
                                                    📷 Quét QR
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination-wrapper-glass">
                            <button
                                type="button"
                                className="pagination-step-btn"
                                disabled={currentPage === 1}
                                onClick={() => {
                                    setCurrentPage((p) => Math.max(1, p - 1));
                                    catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                ‹ Trước
                            </button>

                            <div className="pagination-numbers">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        className={`pagination-num-btn ${currentPage === num ? 'active' : ''}`}
                                        onClick={() => {
                                            setCurrentPage(num);
                                            catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="pagination-step-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => {
                                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                                    catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                Sau ›
                            </button>
                        </div>
                    )}
                </>
            )}

            {dynamicVenues.length > 0 && (
                <div style={{ marginTop: '36px', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                        <h3 style={{ fontSize: '1.18rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📍 Địa điểm tổ chức tại CMCU ({dynamicVenues.length} địa điểm)
                            <span style={{ fontSize: '0.74rem', background: 'rgba(45, 194, 117, 0.16)', color: '#2dc275', padding: '3px 8px', borderRadius: '8px', fontWeight: 700 }}>
                                Tự động cuộn sang phải ➔
                            </span>
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {topKeyword && (
                                <button
                                    type="button"
                                    onClick={resetAllFilters}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#2dc275',
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        marginRight: '6px'
                                    }}
                                >
                                    Hiện tất cả địa điểm ✕
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => venuesRowRef.current?.scrollBy({ left: -280, behavior: 'smooth' })}
                                className="venue-nav-arrow"
                                title="Cuộn sang trái"
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                onClick={() => venuesRowRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}
                                className="venue-nav-arrow"
                                title="Cuộn sang phải"
                            >
                                ›
                            </button>
                        </div>
                    </div>

                    <div
                        className="tbx-venues-row"
                        ref={venuesRowRef}
                        onMouseEnter={() => setIsVenueHovered(true)}
                        onMouseLeave={() => setIsVenueHovered(false)}
                    >
                        {dynamicVenues.map((venue, idx) => {
                            const palette = venueGradients[idx % venueGradients.length];
                            const isSelectedVenue = topKeyword.toLowerCase() === venue.name.toLowerCase();

                            return (
                                <div
                                    key={venue.name}
                                    className="tbx-venue-card-horiz"
                                    style={{
                                        background: palette.bg,
                                        borderColor: isSelectedVenue ? '#2dc275' : undefined
                                    }}
                                    onClick={() => handleVenueFilter(venue.name)}
                                >
                                    <div className="tbx-venue-overlay" style={{ background: palette.overlay }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '1.6rem' }}>{palette.icon}</span>
                                            <span
                                                style={{
                                                    background: 'rgba(9, 13, 22, 0.78)',
                                                    padding: '4px 10px',
                                                    borderRadius: '999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 800,
                                                    color: '#6ee7b7',
                                                    border: '1px solid rgba(255, 255, 255, 0.12)'
                                                }}
                                            >
                                                {venue.count} sự kiện
                                            </span>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '1.08rem', fontWeight: 900, color: '#ffffff', marginBottom: '2px' }}>
                                                {venue.name}
                                            </div>
                                            <div style={{ fontSize: '0.76rem', color: '#e5e7eb', opacity: 0.85 }}>
                                                Bấm để lọc sự kiện tại đây ➔
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventList;