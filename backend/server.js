require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./src/config/db');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/meta', async (req, res, next) => {
  try {
    const faculties = await db.getAll('faculties');
    const users = await db.getAll('users');
    const staffList = users
      .filter(u => ['ADMIN', 'STAFF'].includes(u.system_role))
      .map(u => ({ user_id: u.user_id, full_name: u.full_name, system_role: u.system_role }));
    res.json({ success: true, data: { faculties, staffList } });
  } catch (err) {
    next(err);
  }
});

app.get('/api/events', async (req, res, next) => {
  try {
    const eventsData = await db.getAll('events');

    const events = await Promise.all(eventsData.map(async (ev) => {
      const creator = await db.findById('users', ev.created_by);
      const eligibilities = await db.findWhere('event_eligibility', el => el.event_id === ev.event_id);

      const eligibility = await Promise.all(eligibilities.map(async (el) => {
        const fac = el.faculty_id ? await db.findById('faculties', el.faculty_id) : null;
        return {
          cohort: el.cohort,
          faculty_id: el.faculty_id,
          faculty_name: fac?.faculty_name ?? 'Tất cả khoa',
        };
      }));

      const registeredCount = await db.count(
        'tickets',
        t => t.event_id === ev.event_id && t.checkin_status !== 'CANCELLED'
      );

      return {
        ...ev,
        created_by_name: creator?.full_name ?? null,
        eligibility,
        registered_count: registeredCount,
        seats_left: Math.max(0, ev.seat_capacity - registeredCount),
      };
    }));

    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    next(err);
  }
});

app.get('/api/events/:id', async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    const ev = await db.findById('events', eventId);
    if (!ev) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });
    }

    const creator = await db.findById('users', ev.created_by);
    const eligibilities = await db.findWhere('event_eligibility', el => el.event_id === ev.event_id);

    const eligibility = await Promise.all(eligibilities.map(async (el) => {
      const fac = el.faculty_id ? await db.findById('faculties', el.faculty_id) : null;
      return {
        cohort: el.cohort,
        faculty_id: el.faculty_id,
        faculty_name: fac?.faculty_name ?? 'Tất cả khoa',
      };
    }));

    const registeredCount = await db.count(
      'tickets',
      t => t.event_id === ev.event_id && t.checkin_status !== 'CANCELLED'
    );

    const checkedInCount = await db.count(
      'tickets',
      t => t.event_id === ev.event_id && t.checkin_status === 'CHECKED_IN'
    );

    const fullEvent = {
      ...ev,
      id: ev.event_id,
      name: ev.title,
      created_by_name: creator?.full_name ?? null,
      eligibility,
      registered_count: registeredCount,
      checked_in_count: checkedInCount,
      seats_left: Math.max(0, ev.seat_capacity - registeredCount),
    };

    res.json({ success: true, data: fullEvent });
  } catch (err) {
    next(err);
  }
});

const adminRoutes = require('./src/routes/adminRoutes.js');
const ticketRoutes = require('./src/routes/ticketRoutes.js');
const authRoutes = require('./src/routes/authRoutes.js');

app.use('/api/admin', adminRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, service: 'CMCU Backend', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('❌ Lỗi:', err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    code: err.code || 'ERROR',
    message: err.message || 'Lỗi máy chủ nội bộ',
    data: err.data || null,
  });
});

(async () => {
  try {
    await db.initSQLServer();
    app.listen(PORT, () => {
      console.log(`\n🚀 CMCU Backend: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Khởi động thất bại:', err.message);
    process.exit(1);
  }
})();