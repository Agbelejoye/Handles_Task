/**
 * app.test.js – Unit tests for Daily Task Planner logic
 * Run with: node app.test.js
 *
 * Tests the pure helper functions extracted from app.js.
 * No external dependencies required.
 */

/* ── Minimal test harness ─────────────────────────────────── */
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌  ${name}`);
    console.error(`       ${err.message}`);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function assertEqual(actual, expected, label) {
  if (actual !== expected)
    throw new Error(`${label || ''}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

/* ── Functions under test (extracted from app.js) ─────────── */

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function deadlineOf(task) {
  if (!task.date || !task.time) return null;
  return new Date(`${task.date}T${task.time}`);
}

function minutesUntil(deadline) {
  return (deadline - Date.now()) / 60_000;
}

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

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/** Simplified task-status classifier (mirrors app.js logic) */
function classifyTask(task, nowMs) {
  const deadline = deadlineOf(task);
  if (!deadline) return 'no-deadline';
  if (task.done)  return 'done';
  const now = new Date(nowMs);
  if (deadline < now) return 'overdue';
  const mins = (deadline - now) / 60_000;
  if (mins <= task.alertMinutes) return 'soon';
  return 'ok';
}

/** Build a fresh task object */
function makeTask(overrides) {
  const base = {
    id:           uid(),
    title:        'Test task',
    description:  '',
    date:         todayStr(),
    time:         '23:59',
    priority:     'medium',
    category:     'work',
    alertMinutes: 15,
    done:         false,
    createdAt:    Date.now()
  };
  return Object.assign({}, base, overrides);
}

/* ── Test suites ──────────────────────────────────────────── */

console.log('\n▶  uid()');
test('generates a non-empty string', () => {
  assert(typeof uid() === 'string' && uid().length > 0);
});
test('generates unique values', () => {
  const ids = new Set(Array.from({ length: 100 }, uid));
  assertEqual(ids.size, 100, 'unique count');
});

console.log('\n▶  deadlineOf()');
test('returns null when date or time missing', () => {
  assert(deadlineOf({ date: '', time: '10:00' }) === null);
  assert(deadlineOf({ date: '2025-01-01', time: '' }) === null);
  assert(deadlineOf({}) === null);
});
test('returns a Date for valid date+time', () => {
  const d = deadlineOf({ date: '2030-06-15', time: '14:30' });
  assert(d instanceof Date, 'should be a Date');
  assertEqual(d.getFullYear(), 2030);
  assertEqual(d.getMonth(), 5);   // June = 5
  assertEqual(d.getDate(), 15);
  assertEqual(d.getHours(), 14);
  assertEqual(d.getMinutes(), 30);
});

console.log('\n▶  minutesUntil()');
test('positive for future deadline', () => {
  const future = new Date(Date.now() + 30 * 60_000); // 30 min from now
  assert(minutesUntil(future) > 0, 'should be positive');
});
test('negative for past deadline', () => {
  const past = new Date(Date.now() - 5 * 60_000); // 5 min ago
  assert(minutesUntil(past) < 0, 'should be negative');
});

console.log('\n▶  formatCountdown()');
test('< 1 min future → "Due now!"', () => {
  assertEqual(formatCountdown(0.4), 'Due now!');
});
test('< 1 min past → "Just overdue"', () => {
  assertEqual(formatCountdown(-0.4), 'Just overdue');
});
test('rounds to minutes when < 60', () => {
  assertEqual(formatCountdown(45), '45m');
  assertEqual(formatCountdown(-30), '30m');
});
test('formats hours and minutes', () => {
  assertEqual(formatCountdown(90), '1h 30m');
  assertEqual(formatCountdown(120), '2h');
});
test('formats days for >= 1440 minutes', () => {
  assertEqual(formatCountdown(1440), '1d');
  assertEqual(formatCountdown(2880), '2d');
});

console.log('\n▶  escHtml()');
test('escapes < and >', () => {
  assertEqual(escHtml('<b>'), '&lt;b&gt;');
});
test('escapes &', () => {
  assertEqual(escHtml('a & b'), 'a &amp; b');
});
test('escapes quotes', () => {
  assertEqual(escHtml('"hello"'), '&quot;hello&quot;');
  assertEqual(escHtml("it's"), 'it&#39;s');
});
test('leaves safe strings unchanged', () => {
  assertEqual(escHtml('Hello World 123'), 'Hello World 123');
});
test('converts non-string to string', () => {
  assertEqual(escHtml(42), '42');
});

console.log('\n▶  classifyTask()');
test('classifies done task', () => {
  const t = makeTask({ done: true, date: '2020-01-01', time: '00:00' });
  assertEqual(classifyTask(t, Date.now()), 'done');
});
test('classifies overdue task', () => {
  const t = makeTask({ date: '2000-01-01', time: '00:00', done: false });
  assertEqual(classifyTask(t, Date.now()), 'overdue');
});
test('classifies soon task (within alertMinutes)', () => {
  const deadline = new Date(Date.now() + 10 * 60_000); // 10 min away
  const t = makeTask({
    date: deadline.toISOString().slice(0, 10),
    time: deadline.toTimeString().slice(0, 5),
    alertMinutes: 15,
    done: false
  });
  assertEqual(classifyTask(t, Date.now()), 'soon');
});
test('classifies ok task (beyond alertMinutes)', () => {
  const deadline = new Date(Date.now() + 60 * 60_000); // 1 hour away
  const t = makeTask({
    date: deadline.toISOString().slice(0, 10),
    time: deadline.toTimeString().slice(0, 5),
    alertMinutes: 15,
    done: false
  });
  assertEqual(classifyTask(t, Date.now()), 'ok');
});
test('no-deadline task', () => {
  const t = makeTask({ date: '', time: '' });
  assertEqual(classifyTask(t, Date.now()), 'no-deadline');
});

console.log('\n▶  todayStr()');
test('returns YYYY-MM-DD format', () => {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(todayStr()), 'format check');
});

/* ── Summary ─────────────────────────────────────────────── */
console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${passed} passed  |  ${failed} failed`);
console.log('─'.repeat(40));
if (failed > 0) process.exit(1);
