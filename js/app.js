/* ============================================================
   TaskFlow — Shared JavaScript (js/app.js)
   ============================================================
   This file handles:
   - Local state management (tasks stored in localStorage)
   - Toast notifications
   - Modal helpers
   - Auth mock (replace with Supabase calls in Phase 2)
   ============================================================ */

'use strict';

/* ── Storage helpers ──────────────────────────────────────── */
const Storage = {
  get(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn('Storage write failed:', e); }
  }
};

/* ── Task Model ───────────────────────────────────────────── */
const TaskStore = {
  _key: 'tf_tasks',

  getAll() { return Storage.get(this._key, []); },

  save(tasks) { Storage.set(this._key, tasks); },

  add({ title, priority = 'medium', dueDate = null, notes = '' }) {
    const tasks = this.getAll();
    const newTask = {
      id: crypto.randomUUID(),
      title: title.trim(),
      priority,
      dueDate,
      notes,
      done: false,
      createdAt: new Date().toISOString()
    };
    tasks.unshift(newTask);
    this.save(tasks);
    return newTask;
  },

  toggle(id) {
    const tasks = this.getAll().map(t =>
      t.id === id ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : null } : t
    );
    this.save(tasks);
    return tasks.find(t => t.id === id);
  },

  remove(id) {
    const tasks = this.getAll().filter(t => t.id !== id);
    this.save(tasks);
  },

  update(id, changes) {
    const tasks = this.getAll().map(t => t.id === id ? { ...t, ...changes } : t);
    this.save(tasks);
  },

  getStats() {
    const tasks = this.getAll();
    const total   = tasks.length;
    const done    = tasks.filter(t => t.done).length;
    const pending = total - done;
    const high    = tasks.filter(t => t.priority === 'high' && !t.done).length;
    return { total, done, pending, high };
  }
};

/* ── Auth (localStorage mock — swap with Supabase later) ──── */
const Auth = {
  _key: 'tf_user',

  getUser() { return Storage.get(this._key); },

  isLoggedIn() { return !!this.getUser(); },

  login(email, password) {
    // TODO: Replace with Supabase auth call
    const users = Storage.get('tf_users', []);
    const user = users.find(u => u.email === email && u.password === btoa(password));
    if (!user) return { error: 'Invalid email or password.' };
    Storage.set(this._key, { id: user.id, email: user.email, name: user.name });
    return { user };
  },

  signup(name, email, password) {
    // TODO: Replace with Supabase auth call
    const users = Storage.get('tf_users', []);
    if (users.find(u => u.email === email)) return { error: 'Email already in use.' };
    const user = { id: crypto.randomUUID(), name, email, password: btoa(password) };
    users.push(user);
    Storage.set('tf_users', users);
    Storage.set(this._key, { id: user.id, email: user.email, name: user.name });
    return { user };
  },

  logout() {
    localStorage.removeItem(this._key);
    window.location.href = 'login.html';
  },

  requireAuth() {
    if (!this.isLoggedIn()) window.location.href = 'login.html';
  },

  requireGuest() {
    if (this.isLoggedIn()) window.location.href = 'app.html';
  }
};

/* ── Toast notifications ──────────────────────────────────── */
const Toast = {
  _container: null,

  _getContainer() {
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.className = 'toast-container';
      document.body.appendChild(this._container);
    }
    return this._container;
  },

  show(message, type = '', duration = 2800) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', '': 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span> ${message}`;
    this._getContainer().appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg)   { this.show(msg, 'error'); }
};

/* ── Modal helpers ────────────────────────────────────────── */
const Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  },
  closeOnOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', e => { if (e.target === el) this.close(id); });
  }
};

/* ── Date helpers ─────────────────────────────────────────── */
const DateUtil = {
  today()     { return new Date().toISOString().split('T')[0]; },
  isToday(d)  { return d === this.today(); },
  isPast(d)   { return d && d < this.today(); },
  format(d)   { if (!d) return ''; const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); },
  relative(d) {
    if (!d) return '';
    if (this.isToday(d)) return 'Today';
    if (d === new Date(Date.now() + 86400000).toISOString().split('T')[0]) return 'Tomorrow';
    if (this.isPast(d)) return '⚠ Overdue';
    return this.format(d);
  }
};

/* ── Priority helpers ─────────────────────────────────────── */
const Priority = {
  label(p) { return p.charAt(0).toUpperCase() + p.slice(1); },
  class(p) { return { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }[p] || 'badge-low'; }
};
