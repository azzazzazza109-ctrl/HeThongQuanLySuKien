const db = require('../config/db');

async function checkDuplicate(user, eventId) {
  const existing = await db.findOne(
    'tickets',
    t => t.event_id === Number(eventId) && t.student_id === Number(user.user_id)
  );
  if (existing && existing.checkin_status !== 'CANCELLED') {
    return {
      ok: false,
      message: `Sinh viên đã có vé (${existing.checkin_status}), mã vé: ${existing.ticket_code}`
    };
  }
  return { ok: true, existing };
}

async function checkOverbooking(eventId, seatCapacity) {
  const activeCount = await db.count(
    'tickets',
    t => t.event_id === Number(eventId) && t.checkin_status !== 'CANCELLED'
  );
  if (activeCount >= Number(seatCapacity)) {
    await db.update('events', Number(eventId), { status: 'FULL' });
    return { ok: false, message: `Sự kiện đã đầy chỗ (${activeCount}/${seatCapacity}).` };
  }
  return { ok: true, activeCount };
}

module.exports = { checkDuplicate, checkOverbooking };