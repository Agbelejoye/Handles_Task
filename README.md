# Daily Task Planner

A lightweight, browser-based daily planner that compiles your tasks in real-time, tracks deadlines, and fires alerts when time-sensitive work needs your attention — no server or install required.

## Features

| Feature | Details |
|---|---|
| **Add / edit / delete tasks** | Title, description, due date & time, priority, category |
| **Mark done** | One-click checkbox; done tasks are visually separated |
| **Auto-sync** | All tasks persist to `localStorage` automatically |
| **Live countdown** | Every card shows a live "Due in Xh Xm" or "Overdue by …" counter |
| **Deadline alerts** | Configurable lead-time per task (default 15 min); fires a browser notification **and** an in-page banner |
| **Overdue alerts** | Fires once when a task crosses its deadline |
| **Daily summary stats** | Total / Pending / Overdue / Done shown at the top |
| **Search & filter** | By keyword, status (all / pending / overdue / done), and priority |
| **Priority levels** | 🔴 High · 🟡 Medium · 🟢 Low with colour-coded cards |
| **Categories** | 💼 Work · 🏠 Personal · 💪 Health · 💰 Finance · 📌 Other |
| **Clear done** | Remove all completed tasks in one click |

## Quick Start

```bash
# No install needed – just open the file
open index.html        # macOS
xdg-open index.html    # Linux
# or double-click index.html in your file manager
```

The app runs entirely in the browser.  
For browser notifications, click **Enable** in the info bar that appears the first time you open the app.

## Files

```
index.html   – Page structure & markup
style.css    – All styles (responsive, mobile-friendly)
app.js       – All logic: task CRUD, localStorage sync, alert engine, countdown timers
app.test.js  – Unit tests (run with Node.js, no extra dependencies)
```

## Running the Tests

```bash
node app.test.js
```

All tests run without any external test framework.

## How Alerts Work

1. When you add a task you set **"Alert Before (minutes)"** (default 15).  
2. The app polls every 15 seconds and fires a browser notification + on-screen banner when the deadline is within that window.  
3. A second alert fires the moment a task becomes overdue.  
4. Alerts fire **once** per task per session (stored in localStorage so they don't repeat on reload).  
5. Editing a task resets its alert so it can fire again with the new deadline.
