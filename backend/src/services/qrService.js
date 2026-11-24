
const crypto = require('crypto');

const QR_SECRET = process.env.QR_SECRET || 'CMCU-INFO2011-QR-SECRET-KEY';

function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function generateTicketCode(eventId, studentCode) {
  return `TK-E${Number(eventId)}-${studentCode}`;
}

function generateQrToken(ticketCode) {
  const nonce = crypto.randomBytes(8).toString('hex');
  const payload = `${ticketCode}|${QR_SECRET}|${Date.now()}|${nonce}`;
  return sha256(payload);
}

function isValidQrFormat(qrToken) {
  return typeof qrToken === 'string' && /^[a-f0-9]{64}$/i.test(qrToken);
}

module.exports = {
  sha256,
  generateTicketCode,
  generateQrToken,
  isValidQrFormat,
  QR_SECRET,
};