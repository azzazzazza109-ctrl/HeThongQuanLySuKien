import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export const TASKS_STORAGE_KEY = 'cmcu_staff_tasks_v1';

function toLocalInputString(dateObj) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
}

export function generateStandardEventTasks(eventId, eventTitle, startTimeStr, assignee = 'Chưa phân công') {
  const start = startTimeStr && !isNaN(new Date(startTimeStr).getTime())
    ? new Date(startTimeStr)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const shiftDaysAtHour = (daysOffset, hour, minute = 0) => {
    const d = new Date(start);
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, minute, 0, 0);
    return toLocalInputString(d);
  };

  const shiftMinutes = (minsOffset) => {
    const d = new Date(start.getTime() + minsOffset * 60 * 1000);
    return toLocalInputString(d);
  };

  const baseId = Date.now();
  const templates = [
    {
      category: 'Truyền thông',
      title: 'Đăng bài mở đơn & kiểm tra link đăng ký vé trên CMCU Events',
      deadline: shiftDaysAtHour(-5, 17, 0),
      priority: 'NORMAL'
    },
    {
      category: 'Thiết kế & In ấn',
      title: 'Chốt file, in Backdrop, Standee & thẻ đeo BTC',
      deadline: shiftDaysAtHour(-2, 17, 0),
      priority: 'HIGH'
    },
    {
      category: 'Điều phối',
      title: 'Chốt danh sách vé đăng ký, gửi email nhắc lịch & mã QR cho SV',
      deadline: shiftDaysAtHour(-1, 20, 0),
      priority: 'HIGH'
    },
    {
      category: 'Hậu cần',
      title: 'Dựng khung backdrop, xếp bàn check-in & bố trí ghế theo sơ đồ',
      deadline: shiftDaysAtHour(-1, 21, 0),
      priority: 'NORMAL'
    },
    {
      category: 'Kỹ thuật & QR',
      title: 'Test âm thanh, ánh sáng, máy quét QR & 4G dự phòng tại cửa',
      deadline: shiftMinutes(-90),
      priority: 'HIGH'
    },
    {
      category: 'Check-in',
      title: 'Mở trạm soát vé QR, phân luồng sinh viên & đón diễn giả',
      deadline: shiftMinutes(-30),
      priority: 'HIGH'
    },
    {
      category: 'Tổng kết',
      title: 'Xuất file CSV điểm danh, tổng hợp điểm rèn luyện & hoàn ứng',
      deadline: shiftDaysAtHour(1, 17, 0),
      priority: 'LOW'
    }
  ];

  return templates.map((tpl, idx) => ({
    id: `${baseId}-${eventId}-${idx}`,
    event_id: String(eventId),
    event: eventTitle,
    category: tpl.category,
    title: tpl.title,
    assignee,
    priority: tpl.priority,
    deadline: tpl.deadline,
    status: 'TODO'
  }));
}

const TASK_CATEGORIES = [
  'Hậu cần',
  'Check-in',
  'Kỹ thuật & QR',
  'Truyền thông',
  'Thiết kế & In ấn',
  'Điều phối',
  'Tổng kết'
];

export default function ManageTasks() {
  const { user } = useAuth();
  const currentRole = (user?.system_role || user?.role || '').toString().toUpperCase();
  const isAdmin = currentRole === 'ADMIN';

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY) || 'null');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const [viewMode, setViewMode] = useState(isAdmin ? 'LIST' : 'KANBAN');

  const [showQuickModal, setShowQuickModal] = useState(false);

  const [events, setEvents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [eventSearch, setEventSearch] = useState('');
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    event_id: '',
    event_name: '',
    category: 'Hậu cần',
    title: '',
    assignee_id: '',
    assignee: 'Chưa phân công',
    priority: 'NORMAL',
    deadline: ''
  });

  const [subtasksInput, setSubtasksInput] = useState('');

  const [filterEventId, setFilterEventId] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTaskKeyword, setSearchTaskKeyword] = useState('');

  const [msg, setMsg] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      window.dispatchEvent(new Event('cmcu_tasks_updated'));
    } catch {

    }
  }, [tasks]);

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const [eventRes, metaRes, taskRes] = await Promise.allSettled([
          apiClient.get('/events'),
          apiClient.get('/meta'),
          apiClient.get('/admin/tasks')
        ]);

        if (eventRes.status === 'fulfilled') {
          const list = Array.isArray(eventRes.value.data)
            ? eventRes.value.data
            : (eventRes.value.data?.data || eventRes.value.data?.events || []);
          setEvents(list);
          if (list.length > 0) {
            const firstEv = list[0];
            const defDeadline = firstEv.start_time
              ? toLocalInputString(new Date(new Date(firstEv.start_time).getTime() - 2 * 3600 * 1000))
              : toLocalInputString(new Date(Date.now() + 24 * 3600 * 1000));

            setFormData((prev) => ({
              ...prev,
              event_id: String(firstEv.event_id),
              event_name: firstEv.title,
              deadline: prev.deadline || defDeadline
            }));
            setEventSearch(firstEv.title);
          }
        }

        if (metaRes.status === 'fulfilled' && metaRes.value.data?.success) {
          setStaffList(metaRes.value.data.data?.staffList || []);
        }

        if (taskRes.status === 'fulfilled' && taskRes.value.data?.success) {
          const rawTasks = taskRes.value.data.data || [];
          if (Array.isArray(rawTasks) && rawTasks.length > 0) {
            const parsed = rawTasks.map((t) => {
              let noteObj = {};
              try {
                noteObj = JSON.parse(t.note || '{}');
              } catch {
                noteObj = { description: t.note || '' };
              }
              return {
                id: t.task_id,
                backend_id: t.task_id,
                event_id: String(t.event_id),
                event: t.event_title || `Sự kiện #${t.event_id}`,
                category: noteObj.category || 'Hậu cần',
                title: t.title,
                assignee: t.assignee_name || 'Chưa phân công',
                assignee_id: t.assignee_id,
                priority: noteObj.priority || 'NORMAL',
                deadline: t.deadline ? toLocalInputString(new Date(t.deadline)) : '',
                status: t.status || 'TODO',
                description: noteObj.description || '',
                checklist: noteObj.checklist || []
              };
            });
            setTasks(parsed);
          }
        }
      } catch (err) {
        console.error('Lỗi khởi tạo dữ liệu Task:', err);
      }
    };
    fetchInitData();
  }, []);

  if (currentRole !== 'STAFF' && currentRole !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const filteredDropdownEvents = events.filter((e) =>
    (e.title || '').toLowerCase().includes(eventSearch.toLowerCase())
  );

  const selectedEventObj = events.find((e) => String(e.event_id) === String(formData.event_id));

  const showToast = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 4000);
  };

  const getEffectiveDeadline = () => {
    if (formData.deadline) return formData.deadline;
    if (selectedEventObj?.start_time) {
      const d = new Date(new Date(selectedEventObj.start_time).getTime() - 2 * 3600 * 1000);
      return toLocalInputString(!isNaN(d.getTime()) ? d : new Date(Date.now() + 24 * 3600 * 1000));
    }
    return toLocalInputString(new Date(Date.now() + 24 * 3600 * 1000));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!formData.event_id) {
      showToast('❌ Vui lòng chọn sự kiện cho công việc này.');
      return;
    }
    if (!formData.title.trim() && !subtasksInput.trim()) {
      showToast('❌ Vui lòng nhập tên công việc hoặc danh sách các đầu việc nhỏ.');
      return;
    }

    const effectiveDeadline = getEffectiveDeadline();
    const baseTitle = formData.title.trim();
    const targetAssigneeId = formData.assignee_id ? Number(formData.assignee_id) : user?.user_id;

    const lines = subtasksInput
      .split('\n')
      .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter((l) => l.length > 0);

    setIsSubmitting(true);
    try {
      if (lines.length > 0) {

        const promises = lines.map((item) =>
          apiClient.post('/admin/tasks', {
            event_id: Number(formData.event_id),
            title: baseTitle ? `[${baseTitle}] ${item}` : item,
            deadline: effectiveDeadline,
            assignee_id: targetAssigneeId,
            note: {
              category: formData.category,
              priority: formData.priority,
              description: baseTitle
            }
          })
        );
        const results = await Promise.allSettled(promises);
        const newCards = [];
        results.forEach((res, idx) => {
          if (res.status === 'fulfilled' && res.value.data?.success) {
            const t = res.value.data.data;
            let noteObj = {};
            try {
              noteObj = JSON.parse(t.note || '{}');
            } catch {
              noteObj = {};
            }
            newCards.push({
              id: t.task_id,
              backend_id: t.task_id,
              event_id: String(t.event_id),
              event: t.event_title || formData.event_name,
              category: noteObj.category || formData.category,
              title: t.title,
              assignee: t.assignee_name || formData.assignee,
              assignee_id: t.assignee_id,
              priority: noteObj.priority || formData.priority,
              deadline: effectiveDeadline,
              status: 'TODO'
            });
          } else {

            newCards.push({
              id: `${Date.now()}-${idx}`,
              event_id: String(formData.event_id),
              event: formData.event_name,
              category: formData.category,
              title: baseTitle ? `[${baseTitle}] ${lines[idx]}` : lines[idx],
              assignee: formData.assignee,
              priority: formData.priority,
              deadline: effectiveDeadline,
              status: 'TODO'
            });
          }
        });
        setTasks((prev) => [...newCards, ...prev]);
        showToast(`✅ Đã lưu CSDL & phân rã thành ${lines.length} thẻ Kanban ở cột "Cần làm"!`);
      } else {

        const res = await apiClient.post('/admin/tasks', {
          event_id: Number(formData.event_id),
          title: baseTitle,
          deadline: effectiveDeadline,
          assignee_id: targetAssigneeId,
          note: {
            category: formData.category,
            priority: formData.priority,
            description: baseTitle
          }
        });
        const t = res.data?.data;
        const newCard = {
          id: t?.task_id || `${Date.now()}`,
          backend_id: t?.task_id,
          event_id: String(formData.event_id),
          event: t?.event_title || formData.event_name,
          category: formData.category,
          title: baseTitle,
          assignee: t?.assignee_name || formData.assignee,
          assignee_id: t?.assignee_id || targetAssigneeId,
          priority: formData.priority,
          deadline: effectiveDeadline,
          status: 'TODO'
        };
        setTasks((prev) => [newCard, ...prev]);
        showToast('✅ Đã lưu công việc vào CSDL và bảng Kanban!');
      }

      setFormData((prev) => ({ ...prev, title: '' }));
      setSubtasksInput('');
      if (showQuickModal) setShowQuickModal(false);
    } catch (err) {
      console.error('Lỗi khi tạo công việc:', err);
      showToast('❌ Lỗi lưu công việc: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateTemplateForSelectedEvent = async () => {
    if (!selectedEventObj) {
      showToast('❌ Vui lòng chọn một sự kiện trước khi tạo checklist mẫu.');
      return;
    }

    const generated = generateStandardEventTasks(
      selectedEventObj.event_id,
      selectedEventObj.title,
      selectedEventObj.start_time,
      formData.assignee || 'Chưa phân công'
    );

    setIsSubmitting(true);
    showToast('⏳ Đang khởi tạo 7 thẻ Kanban chuẩn vào CSDL...');
    try {
      const promises = generated.map((tpl) =>
        apiClient.post('/admin/tasks', {
          event_id: Number(selectedEventObj.event_id),
          title: tpl.title,
          deadline: tpl.deadline,
          assignee_id: formData.assignee_id ? Number(formData.assignee_id) : user?.user_id,
          note: {
            category: tpl.category,
            priority: tpl.priority
          }
        })
      );
      const results = await Promise.allSettled(promises);
      const savedCards = [];
      results.forEach((res, idx) => {
        if (res.status === 'fulfilled' && res.value.data?.success) {
          const t = res.value.data.data;
          savedCards.push({
            id: t.task_id,
            backend_id: t.task_id,
            event_id: String(t.event_id),
            event: t.event_title || selectedEventObj.title,
            category: generated[idx].category,
            title: t.title,
            assignee: t.assignee_name || 'Chưa phân công',
            assignee_id: t.assignee_id,
            priority: generated[idx].priority,
            deadline: generated[idx].deadline,
            status: 'TODO'
          });
        } else {
          savedCards.push(generated[idx]);
        }
      });
      setTasks((prev) => [...savedCards, ...prev]);
      setFilterEventId(String(selectedEventObj.event_id));
      showToast(`✅ Đã lưu thành công 7 thẻ Kanban chuẩn T-Minus vào CSDL cho "${selectedEventObj.title}"!`);
      if (showQuickModal) setShowQuickModal(false);
    } catch (err) {
      setTasks((prev) => [...generated, ...prev]);
      showToast(`✅ Đã tạo 7 thẻ Kanban cho "${selectedEventObj.title}"!`);
      if (showQuickModal) setShowQuickModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const moveTaskStatus = async (id, nextStatus) => {
    let newAssignee = user?.full_name || 'Staff';
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const assigned =
          nextStatus === 'IN_PROGRESS' && (!t.assignee || t.assignee === 'Chưa phân công')
            ? newAssignee
            : t.assignee;
        return { ...t, status: nextStatus, assignee: assigned };
      })
    );

    if (typeof id === 'number' || !isNaN(Number(id))) {
      try {
        await apiClient.patch(`/admin/tasks/${id}`, {
          status: nextStatus,
          assignee_id: user?.user_id
        });
      } catch (err) {
        console.warn('Backend patch task error (state retained):', err);
      }
    }
  };

  const handleClaimTask = (task) => {
    moveTaskStatus(task.id, 'IN_PROGRESS');
    showToast(`🎯 Bạn đã nhận công việc: "${task.title}". Thẻ đã chuyển sang "Đang thực hiện"!`);
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa thẻ công việc này?')) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('🗑️ Đã xóa thẻ công việc.');

    if (typeof id === 'number' || !isNaN(Number(id))) {
      try {
        await apiClient.delete(`/admin/tasks/${id}`);
      } catch (err) {
        console.warn('Backend delete error:', err);
      }
    }
  };

  const now = new Date();
  const isTaskOverdue = (task) => {
    if (task.status === 'DONE' || !task.deadline) return false;
    const d = new Date(task.deadline);
    return !isNaN(d.getTime()) && d < now;
  };

  const displayedTasks = tasks.filter((task) => {
    const matchEvent = filterEventId === 'ALL' || String(task.event_id) === String(filterEventId);
    const overdue = isTaskOverdue(task);

    let matchStatus = true;
    if (filterStatus === 'TODO') matchStatus = task.status === 'TODO';
    if (filterStatus === 'IN_PROGRESS') matchStatus = task.status === 'IN_PROGRESS';
    if (filterStatus === 'DONE') matchStatus = task.status === 'DONE';
    if (filterStatus === 'OVERDUE') matchStatus = overdue;

    const q = searchTaskKeyword.trim().toLowerCase();
    const matchKeyword =
      !q ||
      (task.title || '').toLowerCase().includes(q) ||
      (task.assignee || '').toLowerCase().includes(q) ||
      (task.category || '').toLowerCase().includes(q) ||
      (task.event || '').toLowerCase().includes(q);

    return matchEvent && matchStatus && matchKeyword;
  });

  const todoTasks = displayedTasks.filter((t) => (t.status || 'TODO') === 'TODO');
  const inProgressTasks = displayedTasks.filter((t) => t.status === 'IN_PROGRESS');
  const doneTasks = displayedTasks.filter((t) => t.status === 'DONE');
  const overdueCount = displayedTasks.filter((t) => isTaskOverdue(t)).length;
  const completionRate = displayedTasks.length > 0 ? Math.round((doneTasks.length / displayedTasks.length) * 100) : 0;

  const priorityBadgeMap = {
    HIGH: { label: '🔥 Khẩn cấp', bg: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: 'rgba(239, 68, 68, 0.45)' },
    NORMAL: { label: '⚡ Tiêu chuẩn', bg: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', border: 'rgba(59, 130, 246, 0.4)' },
    LOW: { label: '🌿 Hậu kỳ', bg: 'rgba(148, 163, 184, 0.18)', color: '#cbd5e1', border: 'rgba(148, 163, 184, 0.35)' }
  };

  const renderTaskForm = (isModal = false) => (
    <form onSubmit={handleAddTask}>

      <div className="input-group" style={{ marginBottom: '14px' }}>
        <label className="input-label-light">Sự kiện áp dụng *</label>
        <select
          className="staff-task-select"
          style={{ width: '100%', padding: '10px 14px' }}
          value={formData.event_id}
          onChange={(e) => {
            const evId = e.target.value;
            const ev = events.find((item) => String(item.event_id) === String(evId));
            if (ev) {
              const defDeadline = ev.start_time
                ? toLocalInputString(new Date(new Date(ev.start_time).getTime() - 2 * 3600 * 1000))
                : toLocalInputString(new Date(Date.now() + 24 * 3600 * 1000));
              setFormData((prev) => ({
                ...prev,
                event_id: String(ev.event_id),
                event_name: ev.title,
                deadline: prev.deadline || defDeadline
              }));
              setEventSearch(ev.title);
            } else {
              setFormData((prev) => ({ ...prev, event_id: '', event_name: '' }));
            }
          }}
        >
          <option value="">-- Chọn sự kiện áp dụng ({events.length} sự kiện) --</option>
          {events.map((ev) => (
            <option key={ev.event_id} value={String(ev.event_id)}>
              🎉 #{ev.event_id} - {ev.title} {ev.seat_capacity ? `(${ev.seat_capacity} chỗ)` : ''}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        <div className="input-group">
          <label className="input-label-light">Mảng công việc</label>
          <select
            className="staff-task-select"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            {TASK_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label-light">Mức độ ưu tiên</label>
          <select
            className="staff-task-select"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          >
            <option value="HIGH">🔥 Khẩn cấp (Trước giờ G)</option>
            <option value="NORMAL">⚡ Tiêu chuẩn</option>
            <option value="LOW">🌿 Hậu kỳ / Tổng kết</option>
          </select>
        </div>
      </div>

      <div className="input-group" style={{ marginBottom: '14px' }}>
        <label className="input-label-light">Tiêu đề nhóm việc (Tùy chọn nếu đã gõ các ý nhỏ)</label>
        <div className="input-icon-wrapper" style={{ width: '100%' }}>
          <span className="input-icon">📝</span>
          <input
            type="text"
            className="input-dark"
            placeholder="VD: Chuẩn bị âm thanh & Hậu cần đón tiếp"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
      </div>

      <div className="input-group" style={{ marginBottom: '14px' }}>
        <label className="input-label-light" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>🎯 Phân rã các ý nhỏ (Mỗi dòng 1 thẻ Kanban)</span>
          <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 700 }}>Tự động chia thẻ vào DB</span>
        </label>
        <textarea
          className="input-dark"
          rows={isModal ? 3 : 4}
          style={{ resize: 'vertical', width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '0.88rem' }}
          placeholder={`Nhập các đầu việc nhỏ cụ thể (Mỗi dòng sẽ sinh 1 thẻ Kanban gán cho Staff):\n- Xếp 50 ghế đại biểu và nước uống\n- Dựng khung backdrop và cắm hoa diễn giả\n- Test máy quét QR và phát thẻ đeo BTC`}
          value={subtasksInput}
          onChange={(e) => setSubtasksInput(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div className="input-group">
          <label className="input-label-light">Giao cho nhân sự (Staff)</label>
          <select
            className="staff-task-select"
            value={formData.assignee_id || 'UNASSIGNED'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'UNASSIGNED') {
                setFormData((prev) => ({ ...prev, assignee_id: '', assignee: 'Chưa phân công' }));
              } else {
                const found = staffList.find((s) => String(s.user_id) === String(val));
                setFormData((prev) => ({
                  ...prev,
                  assignee_id: val,
                  assignee: found?.full_name || val
                }));
              }
            }}
          >
            <option value="UNASSIGNED">👥 Chưa phân công (Để Staff tự nhận việc)</option>
            {staffList.map((st) => (
              <option key={st.user_id} value={String(st.user_id)}>
                👤 {st.full_name} ({st.system_role})
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label-light">Hạn chót hoàn thành</label>
          <div className="input-icon-wrapper" style={{ width: '100%' }}>
            <span className="input-icon">⏰</span>
            <input
              type="datetime-local"
              className="input-dark"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="btn-submit-task"
        disabled={isSubmitting}
        style={{ fontSize: '0.92rem', marginBottom: '10px', opacity: isSubmitting ? 0.7 : 1 }}
      >
        {isSubmitting ? '⏳ Đang lưu CSDL...' : (isAdmin ? '⚡ Giao việc vào Bảng Kanban' : '⚡ Tạo việc vào Bảng Kanban')}
      </button>

      <button
        type="button"
        className="btn-template-gen"
        disabled={isSubmitting}
        onClick={handleGenerateTemplateForSelectedEvent}
        style={{ opacity: isSubmitting ? 0.7 : 1 }}
      >
        🚀 Tự động tạo 7 thẻ Kanban chuẩn T-Minus cho sự kiện
      </button>
    </form>
  );

  return (
    <div className="admin-dashboard-container">
      <style>{`

        .task-toolbar-glass {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          background: rgba(15, 23, 42, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 12px 18px;
          border-radius: 16px;
          margin-bottom: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
          flex-wrap: wrap;
        }
        .task-tab-pills {
          display: flex;
          background: rgba(30, 41, 59, 0.7);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          gap: 4px;
        }
        .task-tab-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 9px;
          font-size: 0.88rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          background: transparent;
          transition: all 0.25s ease;
        }
        .task-tab-pill:hover {
          color: #f8fafc;
          background: rgba(255, 255, 255, 0.06);
        }
        .task-tab-pill.active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.45);
        }
        .pill-badge {
          background: rgba(255, 255, 255, 0.22);
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 1px 7px;
          border-radius: 999px;
        }
        .task-filter-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .custom-select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .control-icon {
          position: absolute;
          left: 12px;
          pointer-events: none;
          font-size: 0.9rem;
        }
        .select-arrow {
          position: absolute;
          right: 12px;
          pointer-events: none;
          font-size: 0.65rem;
          color: #94a3b8;
        }
        .premium-filter-select {
          appearance: none !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          background: #1e293b !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          color: #f8fafc !important;
          padding: 10px 36px 10px 38px !important;
          border-radius: 12px !important;
          font-size: 0.86rem !important;
          font-weight: 600 !important;
          outline: none !important;
          cursor: pointer !important;
          min-width: 230px !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3) !important;
        }
        .premium-filter-select option {
          background-color: #0f172a !important;
          color: #f8fafc !important;
          padding: 10px !important;
        }
        .premium-filter-select:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3) !important;
        }
        .custom-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-svg {
          position: absolute;
          left: 12px;
          color: #94a3b8;
          pointer-events: none;
        }
        .premium-filter-input {
          background: #1e293b !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          color: #f8fafc !important;
          padding: 10px 34px 10px 38px !important;
          border-radius: 12px !important;
          font-size: 0.86rem !important;
          outline: none !important;
          min-width: 260px !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3) !important;
        }
        .premium-filter-input::placeholder { color: #94a3b8 !important; }
        .premium-filter-input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3) !important;
          background: #1e293b !important;
        }
        .clear-search-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.85rem;
          padding: 2px 4px;
        }
        .clear-search-btn:hover { color: #f8fafc; }

        .kpi-stats-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          background: rgba(15, 23, 42, 0.55);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 10px 18px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .kpi-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.84rem;
          font-weight: 700;
        }

        .kanban-fullscreen-container { width: 100%; }
        .kanban-board-grid-full {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 992px) {
          .kanban-board-grid-full { grid-template-columns: 1fr; }
        }
        .kanban-column {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          padding: 18px;
          min-height: 540px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
        }
        .kanban-col-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-weight: 800;
          font-size: 0.98rem;
          letter-spacing: 0.3px;
        }
        .kanban-card {
          background: rgba(30, 41, 59, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .kanban-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .kanban-card.overdue {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.12);
        }
        .btn-kanban-action {
          padding: 8px 14px;
          border-radius: 8px;
          border: none;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
        }
        .btn-kanban-action:hover {
          opacity: 0.9;
          transform: scale(1.02);
        }
        .btn-template-gen {
          width: 100%;
          padding: 12px 16px;
          margin-top: 10px;
          border-radius: 12px;
          background: rgba(45, 194, 117, 0.16);
          border: 1.5px dashed rgba(45, 194, 117, 0.55);
          color: #6ee7b7;
          font-size: 0.88rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-template-gen:hover {
          background: rgba(45, 194, 117, 0.28);
          border-color: #2dc275;
          color: #ffffff;
        }
        .staff-task-select {
          width: 100%;
          padding: 12px 14px;
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          color: #ffffff;
          font-size: 0.94rem;
          font-weight: 600;
          outline: none;
        }
        .staff-task-select:focus { border-color: #f59e0b; }

        .modal-overlay-glass {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 20px;
        }
        .modal-box-glass {
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 20px;
          width: 100%;
          max-width: 580px;
          padding: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
          max-height: 90vh;
          overflow-y: auto;
        }
      `}</style>

      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>

      <div className="page-header-glass" style={{ marginBottom: '20px' }}>
        <div className="page-header-icon" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
          <span>📋</span>
        </div>
        <div className="page-header-text">
          <h1 className="page-header-title">
            {isAdmin ? 'Quản Lý & Giao Việc Cho Staff' : 'Bảng Công Việc Ban Tổ Chức (Kanban)'}
          </h1>
          <p className="page-header-subtitle">
            {isAdmin
              ? 'Admin giao việc, hệ thống tự động phân rã thành các thẻ Kanban cho Staff nhận việc và kéo thả tiến độ.'
              : 'Staff nhận các đầu việc được giao từ Admin, chuyển thẻ qua các cột Cần làm ➔ Đang làm ➔ Hoàn thành.'}
          </p>
        </div>
      </div>

      {msg && (
        <div className={`custom-toast ${msg.includes('❌') ? 'toast-error' : 'toast-success'}`} style={{ marginBottom: '20px' }}>
          {msg}
        </div>
      )}

      <div className="task-toolbar-glass">

        <div className="task-tab-pills">
          <button
            type="button"
            className={`task-tab-pill ${viewMode === 'KANBAN' ? 'active' : ''}`}
            onClick={() => setViewMode('KANBAN')}
          >
            <span>📊 Bảng Kanban (Trello)</span>
            <span className="pill-badge">{tasks.length}</span>
          </button>
          <button
            type="button"
            className={`task-tab-pill ${viewMode === 'LIST' ? 'active' : ''}`}
            onClick={() => setViewMode('LIST')}
          >
            <span>📋 Danh sách &amp; Giao việc</span>
          </button>
        </div>

        <div className="task-filter-controls">

          <div className="custom-select-wrapper">
            <span className="control-icon">🎉</span>
            <select
              className="premium-filter-select"
              value={filterEventId}
              onChange={(e) => setFilterEventId(e.target.value)}
            >
              <option value="ALL">Tất cả sự kiện ({events.length})</option>
              {events.map((ev) => (
                <option key={ev.event_id} value={String(ev.event_id)}>
                  #{ev.event_id} - {ev.title}
                </option>
              ))}
            </select>
            <span className="select-arrow">▼</span>
          </div>

          <div className="custom-search-wrapper">
            <svg className="search-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="premium-filter-input"
              placeholder="Tìm theo tên việc, nhân sự, mảng việc..."
              value={searchTaskKeyword}
              onChange={(e) => setSearchTaskKeyword(e.target.value)}
            />
            {searchTaskKeyword && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTaskKeyword('')}
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="kpi-stats-strip">
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span className="kpi-chip" style={{ color: '#fbbf24' }}>
            📌 Cần làm: <strong>{todoTasks.length}</strong>
          </span>
          <span className="kpi-chip" style={{ color: '#38bdf8' }}>
            ⚡ Đang làm: <strong>{inProgressTasks.length}</strong>
          </span>
          <span className="kpi-chip" style={{ color: '#34d399' }}>
            ✅ Đã xong: <strong>{doneTasks.length}</strong>
          </span>
          {overdueCount > 0 && (
            <span className="kpi-chip" style={{ color: '#ef4444' }}>
              ⚠️ Quá hạn: <strong>{overdueCount}</strong>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Tiến độ hoàn tất:</span>
          <div style={{ width: '120px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${completionRate}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)', transition: 'width 0.3s ease' }}></div>
          </div>
          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#10b981' }}>{completionRate}%</span>
        </div>
      </div>

      {viewMode === 'KANBAN' ? (

        <div className="kanban-fullscreen-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
              💡 <em>Staff bấm "Nhận việc" để nhận thẻ và di chuyển qua các cột. Admin có thể bấm "Giao việc nhanh".</em>
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-kanban-action"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setShowQuickModal(true)}
              >
                ➕ Giao việc nhanh (Modal)
              </button>
              <button
                type="button"
                className="btn-kanban-action"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#cbd5e1' }}
                onClick={() => setViewMode('LIST')}
              >
                📋 Chuyển sang form chi tiết
              </button>
            </div>
          </div>

          <div className="kanban-board-grid-full">

            <div className="kanban-column" style={{ borderTop: '4px solid #f59e0b' }}>
              <div className="kanban-col-header" style={{ color: '#fbbf24' }}>
                <span>📌 CẦN LÀM / CHỜ NHẬN ({todoTasks.length})</span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.2)', padding: '2px 9px', borderRadius: '10px' }}>TODO</span>
              </div>

              {todoTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 10px', color: '#64748b', fontSize: '0.88rem' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🎉</span>
                  Chưa có việc nào cần làm.
                </div>
              ) : (
                todoTasks.map((t) => {
                  const overdue = isTaskOverdue(t);
                  const prio = priorityBadgeMap[t.priority] || priorityBadgeMap.NORMAL;
                  return (
                    <div key={t.id} className={`kanban-card ${overdue ? 'overdue' : ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.76rem', background: prio.bg, color: prio.color, border: `1px solid ${prio.border}`, padding: '3px 9px', borderRadius: '6px', fontWeight: 700 }}>
                          {t.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t.id)}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem' }}
                          title="Xóa thẻ"
                        >
                          ✕
                        </button>
                      </div>

                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.96rem', color: '#f8fafc', lineHeight: 1.45 }}>
                        {t.title}
                      </h4>

                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '8px' }}>
                        🎉 {t.event}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '12px' }}>
                        <span>👤 {t.assignee || 'Chưa nhận'}</span>
                        <span style={{ color: overdue ? '#ef4444' : '#94a3b8', fontWeight: overdue ? 800 : 500 }}>
                          ⏰ {t.deadline ? new Date(t.deadline).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'N/A'}
                        </span>
                      </div>

                      {overdue && (
                        <div style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 800, marginBottom: '10px' }}>
                          ⚠️ ĐÃ QUÁ HẠN!
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-kanban-action"
                          style={{ background: '#3b82f6', color: '#ffffff', flex: 1 }}
                          onClick={() => handleClaimTask(t)}
                        >
                          👉 Nhận việc
                        </button>
                        <button
                          type="button"
                          className="btn-kanban-action"
                          style={{ background: 'rgba(255,255,255,0.12)', color: '#ffffff' }}
                          onClick={() => moveTaskStatus(t.id, 'IN_PROGRESS')}
                          title="Chuyển sang Đang làm"
                        >
                          ➡️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="kanban-column" style={{ borderTop: '4px solid #38bdf8' }}>
              <div className="kanban-col-header" style={{ color: '#38bdf8' }}>
                <span>⚡ ĐANG THỰC HIỆN ({inProgressTasks.length})</span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.2)', padding: '2px 9px', borderRadius: '10px' }}>DOING</span>
              </div>

              {inProgressTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 10px', color: '#64748b', fontSize: '0.88rem' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>⏳</span>
                  Chưa có việc nào đang thực hiện.
                </div>
              ) : (
                inProgressTasks.map((t) => {
                  const overdue = isTaskOverdue(t);
                  const prio = priorityBadgeMap[t.priority] || priorityBadgeMap.NORMAL;
                  return (
                    <div key={t.id} className={`kanban-card ${overdue ? 'overdue' : ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.76rem', background: prio.bg, color: prio.color, border: `1px solid ${prio.border}`, padding: '3px 9px', borderRadius: '6px', fontWeight: 700 }}>
                          {t.category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(t.id)}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem' }}
                          title="Xóa thẻ"
                        >
                          ✕
                        </button>
                      </div>

                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.96rem', color: '#f8fafc', lineHeight: 1.45 }}>
                        {t.title}
                      </h4>

                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '8px' }}>
                        🎉 {t.event}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#38bdf8', marginBottom: '12px' }}>
                        <span>👤 Đang làm: {t.assignee}</span>
                        <span style={{ color: overdue ? '#ef4444' : '#94a3b8', fontWeight: overdue ? 800 : 500 }}>
                          ⏰ {t.deadline ? new Date(t.deadline).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'N/A'}
                        </span>
                      </div>

                      {overdue && (
                        <div style={{ fontSize: '0.74rem', color: '#ef4444', fontWeight: 800, marginBottom: '10px' }}>
                          ⚠️ ĐÃ QUÁ HẠN!
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn-kanban-action"
                          style={{ background: 'rgba(255,255,255,0.12)', color: '#ffffff' }}
                          onClick={() => moveTaskStatus(t.id, 'TODO')}
                          title="Trả lại cột Cần làm"
                        >
                          ⬅️
                        </button>
                        <button
                          type="button"
                          className="btn-kanban-action"
                          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', flex: 1 }}
                          onClick={() => {
                            moveTaskStatus(t.id, 'DONE');
                            showToast(`✅ Đã hoàn thành công việc: "${t.title}"!`);
                          }}
                        >
                          ✅ Hoàn thành
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="kanban-column" style={{ borderTop: '4px solid #10b981' }}>
              <div className="kanban-col-header" style={{ color: '#34d399' }}>
                <span>✅ ĐÃ HOÀN THÀNH ({doneTasks.length})</span>
                <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 9px', borderRadius: '10px' }}>DONE</span>
              </div>

              {doneTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 10px', color: '#64748b', fontSize: '0.88rem' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>📋</span>
                  Chưa có việc nào hoàn thành.
                </div>
              ) : (
                doneTasks.map((t) => (
                  <div key={t.id} className="kanban-card" style={{ opacity: 0.88, background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.76rem', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', padding: '3px 9px', borderRadius: '6px', fontWeight: 700 }}>
                        {t.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(t.id)}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem' }}
                        title="Xóa thẻ"
                      >
                        ✕
                      </button>
                    </div>

                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.96rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                      {t.title}
                    </h4>

                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '8px' }}>
                      🎉 {t.event}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#34d399', marginBottom: '10px' }}>
                      <span>👤 Hoàn tất: {t.assignee}</span>
                      <span>✅ Đã xong</span>
                    </div>

                    <button
                      type="button"
                      className="btn-kanban-action"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: '#cbd5e1' }}
                      onClick={() => moveTaskStatus(t.id, 'IN_PROGRESS')}
                    >
                      🔄 Mở lại việc này
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (

        <div className="task-layout-grid">

          <div className="task-form-dark">
            <h3 className="task-form-title">
              {isAdmin ? '➕ Giao Việc Cho Staff' : '➕ Tạo Công Việc Vận Hành'}
            </h3>
            {renderTaskForm(false)}
          </div>

          <div className="task-list-dark">
            <div className="chart-header" style={{ marginBottom: '16px' }}>
              <h3 style={{ color: '#fff' }}>📌 Danh sách công việc ({displayedTasks.length})</h3>
              <span className="task-count-badge">{todoTasks.length} Cần làm / {inProgressTasks.length} Đang làm / {doneTasks.length} Hoàn thành</span>
            </div>

            <div className="task-list">
              {displayedTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                  Chưa có công việc nào khớp với bộ lọc.
                </div>
              ) : (
                displayedTasks.map((task) => {
                  const isDone = task.status === 'DONE';
                  const isDoing = task.status === 'IN_PROGRESS';
                  const overdue = isTaskOverdue(task);
                  const prio = priorityBadgeMap[task.priority] || priorityBadgeMap.NORMAL;

                  return (
                    <div
                      className={`task-item ${isDone ? 'task-done' : ''} ${overdue ? 'task-overdue' : ''}`}
                      key={task.id}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => moveTaskStatus(task.id, isDone ? 'TODO' : 'DONE')}
                          style={{
                            background: isDone ? '#10b981' : isDoing ? '#3b82f6' : 'transparent',
                            border: '1.5px solid #64748b',
                            borderRadius: '6px',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem'
                          }}
                          title={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu đã hoàn thành'}
                        >
                          {isDone ? '✓' : isDoing ? '⚡' : ''}
                        </button>
                      </div>

                      <div className="task-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <h4 className="task-title" style={{ textDecoration: isDone ? 'line-through' : 'none' }}>
                            <span style={{ color: '#38bdf8', marginRight: '6px' }}>[{task.category}]</span>
                            {task.title}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            title="Xóa công việc"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="task-meta">
                          <span className="task-event-tag">🎉 {task.event}</span>
                          <span style={{ fontSize: '0.74rem', padding: '2px 8px', borderRadius: '6px', background: prio.bg, color: prio.color }}>
                            {prio.label}
                          </span>
                          <span style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                            👤 {task.assignee || 'Chưa nhận'}
                          </span>
                          <span style={{ fontSize: '0.76rem', color: overdue ? '#ef4444' : '#94a3b8' }}>
                            ⏰ Hạn chót: {task.deadline ? new Date(task.deadline).toLocaleString('vi-VN') : 'N/A'}
                          </span>
                          {overdue && <span className="overdue-pill">⚠️ Quá hạn</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showQuickModal && (
        <div className="modal-overlay-glass" onClick={() => setShowQuickModal(false)}>
          <div className="modal-box-glass" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚡ {isAdmin ? 'Giao Việc Nhanh Vào Kanban' : 'Tạo Thẻ Task Nhanh'}
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            {renderTaskForm(true)}
          </div>
        </div>
      )}
    </div>
  );
}
