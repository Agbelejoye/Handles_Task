/**
 * Daily Task Planner – app.js
 *
 * Features:
 *  - Add / edit / delete tasks
 *  - Mark tasks complete / incomplete
 *  - Due date + time with per-task alert lead-time
 *  - Auto-sync via localStorage (persists across reloads)
 *  - Live countdown timers on each card
 *  - Browser notification alerts (falls back to banner)
 *  - Overdue / "due soon" visual highlights
 *  - Search + filter by status and priority
 *  - Stats bar (total, pending, overdue, done)
 *  - Daily summary compiled in real-time
 */

/* ── Constants ───────────────────────────────────────────── */
const STORAGE_KEY      = 'planner_tasks_v1';
const FIRED_ALERTS_KEY = 'planner_fired_alerts_v1';
const TICK_INTERVAL_MS = 5_000;    //  5 s – countdown refresh
const ALERT_CHECK_MS   = 15_000;   // 15 s – alert polling

/* ── State ───────────────────────────────────────────────── */
let tasks       = [];               // array of task objects
let firedAlerts = new Set();        // ids of already-fired alert notifications

/* ── Helpers ─────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

/** Generate a short unique id */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Parse a task's deadline as a Date object (or null) */
function deadlineOf(task) {
  if (!task.date || !task.time) return null;
  return new Date(`${task.date}T${task.time}`);
}

/** Minutes until a deadline (negative = overdue) */
function minutesUntil(deadline) {
  return (deadline - Date.now()) / 60_000;
}

/** Human-friendly countdown string */
function formatCountdown(mins) {
  const absMins = Math.abs(mins);
  if (absMins < 1)   return mins < 0 ? 'Just overdue' : 'Due now!';
  if (absMins < 60)  return `${Math.round(absMins)}m`;
  const h = Math.floor(absMins / 60);
  const m = Math.round(absMins % 60);
  if (absMins < 1440) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(absMins / 1440);
  return `${d}d`;
}

/** Format a Date for display */
function formatDeadline(deadline) {
  return deadline.toLocaleString([], {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/** Today's date string (YYYY-MM-DD) */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/* ── LocalStorage ────────────────────────────────────────── */
function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  } catch {
    tasks = [];
  }
  try {
    const raw = localStorage.getItem(FIRED_ALERTS_KEY);
    firedAlerts = raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    firedAlerts = new Set();
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  localStorage.setItem(FIRED_ALERTS_KEY, JSON.stringify([...firedAlerts]));
}

/* ── Notification Permission ──────────────────────────────── */
function requestNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    showNotifBar();
  }
}

function showNotifBar() {
  if (Notification.permission !== 'default') return;
  let bar = document.querySelector('.notif-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'notif-bar';
    bar.innerHTML = `
      🔔 Enable browser notifications for task deadline alerts.
      <button class="btn btn-ghost" onclick="askNotifPermission(this)">Enable</button>
      <button class="btn-icon" onclick="this.parentElement.classList.add('hidden')" aria-label="Dismiss">✕</button>
    `;
    document.querySelector('.main').prepend(bar);
  } else {
    bar.classList.remove('hidden');
  }
}

window.askNotifPermission = async function(btn) {
  const perm = await Notification.requestPermission();
  if (perm === 'granted') {
    btn.closest('.notif-bar').classList.add('hidden');
  }
};

function sendBrowserNotif(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, { body });
    n.onclick = () => { window.focus(); n.close(); };
  } catch {
    /* silently ignore in restricted environments */
  }
}

/* ── Alert Banner (in-page fallback) ─────────────────────── */
function showAlertBanner(message) {
  const banner = $('alert-banner');
  $('alert-message').textContent = message;
  banner.classList.remove('hidden');
  // Auto-dismiss after 10 s
  clearTimeout(banner._timer);
  banner._timer = setTimeout(() => banner.classList.add('hidden'), 10_000);
}

window.dismissAlertBanner = function() {
  $('alert-banner').classList.add('hidden');
};

/* ── Alert Polling ────────────────────────────────────────── */
function checkAlerts() {
  const now = Date.now();

  tasks.forEach(task => {
    if (task.done) return;
    const deadline = deadlineOf(task);
    if (!deadline) return;

    const alertMs  = (task.alertMinutes ?? 15) * 60_000;
    const alertKey = `${task.id}_alert`;
    const overdueKey = `${task.id}_overdue`;

    const minsUntil = minutesUntil(deadline);

    // Fire lead-time alert
    if (
      !firedAlerts.has(alertKey) &&
      minsUntil <= task.alertMinutes &&
      minsUntil > 0
    ) {
      const msg = `⏰ "${task.title}" is due in ${formatCountdown(minsUntil)}!`;
      sendBrowserNotif('Task Due Soon – Daily Planner', msg);
      showAlertBanner(msg);
      firedAlerts.add(alertKey);
      saveTasks();
    }

    // Fire overdue alert (once)
    if (!firedAlerts.has(overdueKey) && minsUntil < 0) {
      const msg = `🚨 "${task.title}" is OVERDUE! (was due ${formatCountdown(minsUntil)} ago)`;
      sendBrowserNotif('Task Overdue – Daily Planner', msg);
      showAlertBanner(msg);
      firedAlerts.add(overdueKey);
      saveTasks();
    }
  });
}

/* ── Clock ───────────────────────────────────────────────── */
function updateClock() {
  const now = new Date();
  $('clock').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  $('date-display').textContent = now.toLocaleDateString([], {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

/* ── Stats ───────────────────────────────────────────────── */
function updateStats() {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.done).length;
  const pending = tasks.filter(t => !t.done).length;
  const overdue = tasks.filter(t => {
    if (t.done) return false;
    const d = deadlineOf(t);
    return d && d < new Date();
  }).length;

  $('stat-total').textContent   = total;
  $('stat-pending').textContent = pending;
  $('stat-overdue').textContent = overdue;
  $('stat-done').textContent    = done;
}

/* ── Render ──────────────────────────────────────────────── */
function getFilteredTasks() {
  const search   = $('search-input').value.toLowerCase().trim();
  const status   = $('filter-status').value;
  const priority = $('filter-priority').value;

  return tasks.filter(task => {
    // search
    if (search && !task.title.toLowerCase().includes(search) &&
        !(task.description || '').toLowerCase().includes(search)) return false;

    // status
    if (status === 'done'    && !task.done) return false;
    if (status === 'pending' && task.done)  return false;
    if (status === 'overdue') {
      const d = deadlineOf(task);
      if (task.done || !d || d >= new Date()) return false;
    }

    // priority
    if (priority !== 'all' && task.priority !== priority) return false;

    return true;
  });
}

function buildTaskCard(task) {
  const deadline = deadlineOf(task);
  const now      = new Date();
  const mins     = deadline ? minutesUntil(deadline) : null;

  const isOverdue  = deadline && !task.done && deadline < now;
  const isSoon     = deadline && !task.done && mins !== null && mins > 0 && mins <= task.alertMinutes;
  const isDone     = task.done;

  const cardClass = [
    'task-card',
    `priority-${task.priority}`,
    isDone    ? 'done-card'    : '',
    isOverdue ? 'overdue-card' : '',
    isSoon    ? 'alert-soon'   : ''
  ].filter(Boolean).join(' ');

  const timeLabel = deadline
    ? `📅 ${formatDeadline(deadline)}`
    : '';

  const timeClass = isOverdue ? 'overdue' : isSoon ? 'soon' : '';

  let countdownHtml = '';
  if (deadline && !isDone && mins !== null) {
    const cls = isOverdue ? 'overdue' : isSoon ? 'soon' : 'ok';
    const label = isOverdue
      ? `Overdue by ${formatCountdown(mins)}`
      : `Due in ${formatCountdown(mins)}`;
    countdownHtml = `<span class="countdown ${cls}" data-task-id="${task.id}">${label}</span>`;
  }

  const priorityLabel = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };
  const categoryLabel = { work: '💼 Work', personal: '🏠 Personal', health: '💪 Health', finance: '💰 Finance', other: '📌 Other' };

  return `
    <div class="${cardClass}" role="listitem" data-id="${task.id}">
      <input
        class="task-check"
        type="checkbox"
        ${isDone ? 'checked' : ''}
        onchange="toggleDone('${task.id}')"
        aria-label="Mark ${isDone ? 'incomplete' : 'complete'}"
      />
      <div class="task-body">
        <div class="task-title-row">
          <span class="task-title">${escHtml(task.title)}</span>
        </div>
        ${task.description ? `<p class="task-desc">${escHtml(task.description)}</p>` : ''}
        <div class="task-meta">
          <span class="tag priority-${task.priority}">${priorityLabel[task.priority] || task.priority}</span>
          <span class="tag cat-${task.category}">${categoryLabel[task.category] || task.category}</span>
          ${timeLabel ? `<span class="task-time ${timeClass}">${timeLabel}</span>` : ''}
          ${countdownHtml}
        </div>
      </div>
      <div class="task-actions">
        <button class="btn-icon" onclick="openEditModal('${task.id}')" aria-label="Edit task" title="Edit">✏️</button>
        <button class="btn-icon danger" onclick="deleteTask('${task.id}')" aria-label="Delete task" title="Delete">🗑</button>
      </div>
    </div>
  `;
}

function renderTasks() {
  const list     = $('task-list');
  const filtered = getFilteredTasks();

  // Sort: overdue first, then by deadline asc, done last
  filtered.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const da = deadlineOf(a), db = deadlineOf(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da - db;
  });

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-state" id="empty-state">No tasks match your filters. 🎉</p>';
    return;
  }

  list.innerHTML = filtered.map(buildTaskCard).join('');
  updateStats();
}

/* Escape HTML to prevent XSS */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Live countdown refresh ──────────────────────────────── */
function refreshCountdowns() {
  document.querySelectorAll('.countdown[data-task-id]').forEach(el => {
    const task = tasks.find(t => t.id === el.dataset.taskId);
    if (!task || task.done) return;
    const deadline = deadlineOf(task);
    if (!deadline) return;
    const mins = minutesUntil(deadline);
    const isOverdue = mins < 0;
    const isSoon    = !isOverdue && mins <= task.alertMinutes;
    el.className = `countdown ${isOverdue ? 'overdue' : isSoon ? 'soon' : 'ok'}`;
    el.textContent = isOverdue
      ? `Overdue by ${formatCountdown(mins)}`
      : `Due in ${formatCountdown(mins)}`;
  });
  updateStats();
}

/* ── Add Task ────────────────────────────────────────────── */
$('task-form').addEventListener('submit', e => {
  e.preventDefault();
  const title = $('task-title').value.trim();
  const date  = $('task-date').value;
  const time  = $('task-time').value;

  if (!title)       { alert('Please enter a task title.'); return; }
  if (!date || !time) { alert('Please set a due date and time.'); return; }

  const task = {
    id:           uid(),
    title,
    description:  $('task-description').value.trim(),
    date,
    time,
    priority:     $('task-priority').value,
    category:     $('task-category').value,
    alertMinutes: parseInt($('alert-minutes').value) || 15,
    done:         false,
    createdAt:    Date.now()
  };

  tasks.unshift(task);
  saveTasks();
  renderTasks();

  // Reset form
  $('task-form').reset();
  $('task-date').value = todayStr();
  $('alert-minutes').value = '15';
});

/* ── Toggle Done ─────────────────────────────────────────── */
window.toggleDone = function(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  task.doneAt = task.done ? Date.now() : null;
  saveTasks();
  renderTasks();
};

/* ── Delete Task ─────────────────────────────────────────── */
window.deleteTask = function(id) {
  if (!confirm('Delete this task?')) return;
  tasks = tasks.filter(t => t.id !== id);
  firedAlerts.delete(`${id}_alert`);
  firedAlerts.delete(`${id}_overdue`);
  saveTasks();
  renderTasks();
};

/* ── Clear Done ──────────────────────────────────────────── */
$('clear-done-btn').addEventListener('click', () => {
  const doneIds = tasks.filter(t => t.done).map(t => t.id);
  if (doneIds.length === 0) { alert('No completed tasks to clear.'); return; }
  if (!confirm(`Clear ${doneIds.length} completed task(s)?`)) return;
  tasks = tasks.filter(t => !t.done);
  doneIds.forEach(id => {
    firedAlerts.delete(`${id}_alert`);
    firedAlerts.delete(`${id}_overdue`);
  });
  saveTasks();
  renderTasks();
});

/* ── Edit Modal ──────────────────────────────────────────── */
window.openEditModal = function(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  $('edit-id').value           = task.id;
  $('edit-title').value        = task.title;
  $('edit-description').value  = task.description || '';
  $('edit-date').value         = task.date;
  $('edit-time').value         = task.time;
  $('edit-priority').value     = task.priority;
  $('edit-category').value     = task.category;
  $('edit-alert-minutes').value = task.alertMinutes ?? 15;
  $('edit-modal').classList.remove('hidden');
};

window.closeEditModal = function() {
  $('edit-modal').classList.add('hidden');
};

$('edit-form').addEventListener('submit', e => {
  e.preventDefault();
  const id    = $('edit-id').value;
  const title = $('edit-title').value.trim();
  const date  = $('edit-date').value;
  const time  = $('edit-time').value;

  if (!title)       { alert('Please enter a task title.'); return; }
  if (!date || !time) { alert('Please set a due date and time.'); return; }

  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.title        = title;
  task.description  = $('edit-description').value.trim();
  task.date         = date;
  task.time         = time;
  task.priority     = $('edit-priority').value;
  task.category     = $('edit-category').value;
  task.alertMinutes = parseInt($('edit-alert-minutes').value) || 15;

  // Reset fired alerts so re-edited deadlines can re-trigger
  firedAlerts.delete(`${id}_alert`);
  firedAlerts.delete(`${id}_overdue`);

  saveTasks();
  renderTasks();
  closeEditModal();
});

// Close modal on overlay click
$('edit-modal').addEventListener('click', e => {
  if (e.target === $('edit-modal')) closeEditModal();
});

/* ── Filters ─────────────────────────────────────────────── */
$('search-input').addEventListener('input', renderTasks);
$('filter-status').addEventListener('change', renderTasks);
$('filter-priority').addEventListener('change', renderTasks);

/* ── Init ────────────────────────────────────────────────── */
function init() {
  loadTasks();

  // Set today as default date in add form
  $('task-date').value = todayStr();

  // Clock
  updateClock();
  setInterval(updateClock, 1000);

  // Countdowns
  setInterval(refreshCountdowns, TICK_INTERVAL_MS);

  // Alert polling
  checkAlerts();
  setInterval(checkAlerts, ALERT_CHECK_MS);

  // Request notification permission
  requestNotifPermission();

  // Initial render
  renderTasks();
}

document.addEventListener('DOMContentLoaded', init);
