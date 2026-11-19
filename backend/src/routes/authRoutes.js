const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/db');
const bcrypt = require('bcryptjs');

const BROKEN_SEED_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

router.post('/login', async (req, res, next) => {
  try {
    const account = (req.body.username || req.body.email || '').trim();
    const { password } = req.body;

    if (!account || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu' });
    }

    const query = `
      SELECT u.user_id, u.student_code, u.email, u.full_name, u.cohort, u.class_name, u.faculty_id, f.faculty_name, u.system_role, u.password
      FROM users u
      LEFT JOIN faculties f ON u.faculty_id = f.faculty_id
      WHERE u.email = @p0 OR u.student_code = @p0
    `;
    const users = await executeQuery(query, [account]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại' });
    }

    const user = users[0];
    const storedPassword = String(user.password || '');

    let isMatch = false;

    if (storedPassword === BROKEN_SEED_HASH && password === '123456') {
      isMatch = true;
      const realHash = await bcrypt.hash('123456', 10);
      await executeQuery('UPDATE users SET password = @p0 WHERE user_id = @p1', [realHash, user.user_id]);
    }

    else if (storedPassword.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, storedPassword);
    }

    else {
      isMatch = (password === storedPassword);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Sai mật khẩu' });
    }

    delete user.password;

    const fakeToken = `token-${user.user_id}-${Date.now()}`;

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token: fakeToken,
      user: user
    });
  } catch (err) {
    next(err);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { username, password, full_name, student_code, class_name, system_role = 'STUDENT' } = req.body;

    const checkQuery = `SELECT * FROM users WHERE student_code = @p0 OR email = @p1`;
    const existing = await executeQuery(checkQuery, [student_code, username]);

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Mã sinh viên hoặc Email đã tồn tại' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertQuery = `
      INSERT INTO users (student_code, email, password, full_name, class_name, system_role)
      OUTPUT INSERTED.user_id, INSERTED.full_name, INSERTED.system_role, INSERTED.student_code
      VALUES (@p0, @p1, @p2, @p3, @p4, @p5)
    `;
    const result = await executeQuery(insertQuery, [
      student_code, username, hashedPassword, full_name, class_name || null, system_role
    ]);

    res.status(201).json({ success: true, message: 'Đăng ký thành công', user: result[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;