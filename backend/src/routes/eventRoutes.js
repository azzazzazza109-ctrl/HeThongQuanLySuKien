const express = require('express');
const router = express.Router();
const db = require('../config/db');
const sql = db.sql || require('mssql');

async function getPool() {
  if (db.poolPromise) return await db.poolPromise;
  if (typeof db.getPool === 'function') return await db.getPool();
  if (typeof db.connectDB === 'function') return await db.connectDB();
  if (db.pool) return await db.pool;
  if (typeof db === 'function') return await db();
  if (db && typeof db.request === 'function') return db;
  return await sql.connect();
}

router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        e.event_id,
        e.title,
        e.description,
        e.location,
        e.start_time,
        e.end_time,
        e.seat_capacity,
        e.cancel_deadline_hours,
        e.status,
        e.created_by,
        ISNULL((
          SELECT COUNT(*)
          FROM dbo.Tickets t
          WHERE t.event_id = e.event_id
            AND t.checkin_status != 'CANCELLED'
        ), 0) AS registered_count,
        ISNULL((
          SELECT COUNT(*)
          FROM dbo.Tickets t
          WHERE t.event_id = e.event_id
            AND t.checkin_status = 'CHECKED_IN'
        ), 0) AS checked_in_count
      FROM dbo.Events e
      ORDER BY e.start_time ASC
    `);

    const events = result.recordset.map((ev) => ({
      ...ev,
      id: ev.event_id,
      name: ev.title,
      startTime: ev.start_time,
      endTime: ev.end_time,
      seatCapacity: ev.seat_capacity,
      capacity: ev.seat_capacity
    }));

    return res.status(200).json({
      success: true,
      data: events
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách sự kiện:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi tải sự kiện',
      error: err.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('event_id', sql.Int, req.params.id)
      .query('SELECT * FROM dbo.Events WHERE event_id = @event_id');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sự kiện'
      });
    }

    const ev = result.recordset[0];
    return res.status(200).json({
      success: true,
      data: {
        ...ev,
        id: ev.event_id,
        name: ev.title,
        startTime: ev.start_time,
        endTime: ev.end_time,
        seatCapacity: ev.seat_capacity,
        capacity: ev.seat_capacity
      }
    });
  } catch (err) {
    console.error('Lỗi khi lấy chi tiết sự kiện:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: err.message
    });
  }
});

module.exports = router;