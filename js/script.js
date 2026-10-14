/* ============================================================
   LIFE DASHBOARD — script.js
   Fitur:
   1. Greeting + Tanggal (dengan Custom Name)
   2. Focus Timer (Start / Pause / Reset) + Ring SVG
   3. To-Do List (tambah, edit, hapus, selesai, prioritas, sort)
   4. Quick Links (tambah, hapus, validasi URL, favicon)
   5. localStorage untuk semua data
   ============================================================ */

/* ============================================================
   UTILITY
   ============================================================ */

/**
 * Tampilkan pesan pada elemen dengan kelas warna.
 * @param {HTMLElement} el
 * @param {string} msg
 * @param {'error'|'success'|'info'} type
 */
function showMessage(el, msg, type = 'error') {
    el.textContent = msg;
    el.className = 'form-message ' + (
        type === 'success' ? 'success' :
        type === 'info'    ? 'info'    : ''
    );
}

/** Hilangkan pesan setelah beberapa milidetik. */
function clearMessageAfter(el, ms = 3500) {
    setTimeout(() => {
        el.textContent = '';
        el.className   = 'form-message';
    }, ms);
}

/* ============================================================
   INJECT SVG GRADIENT untuk timer ring
   (harus ada di DOM sebelum SVG dipakai)
   ============================================================ */
(function injectSvgDefs() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'timer-gradient-defs');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `
        <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stop-color="#3b82f6"/>
                <stop offset="100%" stop-color="#10b981"/>
            </linearGradient>
        </defs>`;
    document.body.prepend(svg);
})();

/* ============================================================
   1. GREETING & TANGGAL
   ============================================================ */

const NAME_KEY = 'lifeDashboardUserName';

const greetingEl    = document.getElementById('greeting');
const currentDateEl = document.getElementById('currentDate');
const nameInput     = document.getElementById('nameInput');
const saveNameBtn   = document.getElementById('saveNameButton');
const clearNameBtn  = document.getElementById('clearNameButton');

/** Sapaan berdasarkan jam lokal. */
function getGreetingWord() {
    const h = new Date().getHours();
    if (h >= 5  && h < 11) return 'Selamat pagi';
    if (h >= 11 && h < 15) return 'Selamat siang';
    if (h >= 15 && h < 18) return 'Selamat sore';
    return 'Selamat malam';
}

/** Perbarui teks greeting dan tanggal. */
function updateGreeting() {
    const saved = localStorage.getItem(NAME_KEY);
    const name  = (saved && saved.trim()) ? saved.trim() : null;

    greetingEl.textContent = name
        ? `${getGreetingWord()}, ${name}! 👋`
        : `${getGreetingWord()}! 👋`;

    currentDateEl.textContent = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

function loadSavedName() {
    const saved = localStorage.getItem(NAME_KEY);
    if (saved) nameInput.value = saved;
}

saveNameBtn.addEventListener('click', function () {
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    localStorage.setItem(NAME_KEY, name);
    updateGreeting();
});

clearNameBtn.addEventListener('click', function () {
    localStorage.removeItem(NAME_KEY);
    nameInput.value = '';
    updateGreeting();
});

nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); saveNameBtn.click(); }
});

loadSavedName();
updateGreeting();

/* ============================================================
   2. FOCUS TIMER
   ============================================================ */

const FOCUS_DURATION  = 25 * 60; // 1500 detik
const CIRCUMFERENCE   = 2 * Math.PI * 85; // ≈ 533.8

const timerDisplayEl  = document.getElementById('timerDisplay');
const timerMessageEl  = document.getElementById('timerMessage');
const timerLabelEl    = document.getElementById('timerLabel');
const startTimerBtn   = document.getElementById('startTimer');
const pauseTimerBtn   = document.getElementById('pauseTimer');
const resetTimerBtn   = document.getElementById('resetTimer');
const timerRingEl     = document.getElementById('timerRingProgress');

let remainingSeconds  = FOCUS_DURATION;
let timerInterval     = null;
let timerRunning      = false;

/** Update tampilan angka MM:SS. */
function renderTimer() {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    timerDisplayEl.textContent =
        `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Update ring SVG — sisa waktu → stroke-dashoffset. */
function updateRing() {
    const ratio  = remainingSeconds / FOCUS_DURATION; // 1.0 = penuh, 0 = habis
    const offset = CIRCUMFERENCE * (1 - ratio);
    timerRingEl.style.strokeDashoffset = offset;
    timerRingEl.style.strokeDasharray  = CIRCUMFERENCE;
}

/** Mulai / lanjutkan timer. */
startTimerBtn.addEventListener('click', function () {
    if (timerRunning) return;

    if (remainingSeconds <= 0) {
        timerMessageEl.textContent = 'Tekan Reset untuk memulai sesi baru.';
        return;
    }

    timerRunning = true;
    timerLabelEl.textContent = 'Sedang fokus';
    timerMessageEl.textContent = 'Tetap fokus! Kamu pasti bisa. 💪';
    timerDisplayEl.classList.remove('finished');

    timerInterval = setInterval(function () {
        remainingSeconds--;
        renderTimer();
        updateRing();

        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            timerRunning  = false;
            timerDisplayEl.classList.add('finished');
            timerLabelEl.textContent = 'Selesai! 🎉';
            timerMessageEl.textContent = '🎉 Sesi fokus selesai! Saatnya istirahat sebentar.';
        }
    }, 1000);
});

/** Jeda timer tanpa menghapus sisa waktu. */
pauseTimerBtn.addEventListener('click', function () {
    if (!timerRunning) return;
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning  = false;
    timerLabelEl.textContent = 'Dijeda';
    timerMessageEl.textContent = '⏸ Timer dijeda. Klik Start untuk lanjut.';
});

/** Reset timer ke 25:00. */
resetTimerBtn.addEventListener('click', function () {
    clearInterval(timerInterval);
    timerInterval    = null;
    timerRunning     = false;
    remainingSeconds = FOCUS_DURATION;
    renderTimer();
    updateRing();
    timerDisplayEl.classList.remove('finished');
    timerLabelEl.textContent = 'Siap fokus';
    timerMessageEl.textContent = 'Timer direset. Siap untuk sesi baru!';
});

// Inisialisasi ring & angka
renderTimer();
updateRing();

/* ============================================================
   3. TO-DO LIST
   ============================================================ */

const TASK_KEY = 'lifeDashboardTasks';

const taskForm        = document.getElementById('taskForm');
const taskInput       = document.getElementById('taskInput');
const taskPriority    = document.getElementById('taskPriority');
const addTaskBtn      = document.getElementById('addTaskButton');
const taskListEl      = document.getElementById('taskList');
const taskSortEl      = document.getElementById('taskSort');        // hidden select
const taskSummaryEl   = document.getElementById('taskSummary');
const taskMessageEl   = document.getElementById('taskMessage');
const taskBadgeEl     = document.getElementById('taskSummaryBadge');
const progressFillEl  = document.getElementById('progressBarFill');
const progressLabelEl = document.getElementById('progressLabel');

let tasks         = [];
let editingTaskId = null;

// --- Sort Pill buttons ---
const sortPills = document.querySelectorAll('.sort-pill');

sortPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
        // Update UI
        sortPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        // Sync hidden select sehingga getSortedTasks() tetap bekerja
        taskSortEl.value = pill.dataset.sort;

        renderTasks();
    });
});

// ---- Persistence ----

function loadTasks() {
    try {
        const raw = localStorage.getItem(TASK_KEY);
        tasks = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(tasks)) tasks = [];
    } catch { tasks = []; }
}

function saveTasks() {
    localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
}

// ---- Sorting ----

function getSortedTasks() {
    const copy = [...tasks];
    const v    = taskSortEl.value;

    if (v === 'priority') {
        const order = { High: 1, Medium: 2, Low: 3 };
        copy.sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (v === 'alphabetical') {
        copy.sort((a, b) => a.text.localeCompare(b.text, 'id'));
    } else {
        copy.sort((a, b) => b.createdAt - a.createdAt);
    }
    return copy;
}

// ---- Render ----

/** Update progress bar dan badge. */
function updateProgress() {
    const total = tasks.length;
    const done  = tasks.filter(t => t.completed).length;
    const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

    progressFillEl.style.width = pct + '%';
    progressLabelEl.textContent = pct + '%';
    taskBadgeEl.textContent = `${done} / ${total}`;

    taskSummaryEl.textContent = total === 0
        ? 'Belum ada tugas.'
        : `${done} dari ${total} tugas selesai.`;
}

/** Buat satu elemen <li> untuk sebuah task. */
function createTaskElement(task) {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type    = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Tandai "${task.text}" selesai`);
    checkbox.addEventListener('change', function () {
        task.completed = checkbox.checked;
        saveTasks();
        renderTasks();
    });

    // Teks
    const span = document.createElement('span');
    span.className   = 'task-text';
    span.textContent = task.text;

    // Badge prioritas
    const badge = document.createElement('span');
    badge.classList.add('priority');
    const pMap = {
        High:   { cls: 'priority-high',   label: '🔴 Tinggi'  },
        Medium: { cls: 'priority-medium',  label: '🟡 Sedang'  },
        Low:    { cls: 'priority-low',     label: '🟢 Rendah'  }
    };
    const pInfo = pMap[task.priority] || pMap.Low;
    badge.classList.add(pInfo.cls);
    badge.textContent = pInfo.label;

    // Edit
    const editBtn = document.createElement('button');
    editBtn.type      = 'button';
    editBtn.textContent = '✏️ Edit';
    editBtn.className = 'edit-button';
    editBtn.setAttribute('aria-label', `Edit tugas: ${task.text}`);
    editBtn.addEventListener('click', function () {
        taskInput.value        = task.text;
        taskPriority.value     = task.priority;
        editingTaskId          = task.id;
        addTaskBtn.textContent = '💾 Simpan';
        taskInput.focus();
        showMessage(taskMessageEl, 'Sedang mengedit tugas. Simpan atau batalkan.', 'info');
    });

    // Hapus
    const deleteBtn = document.createElement('button');
    deleteBtn.type      = 'button';
    deleteBtn.textContent = '🗑️ Hapus';
    deleteBtn.className = 'delete-button';
    deleteBtn.setAttribute('aria-label', `Hapus tugas: ${task.text}`);
    deleteBtn.addEventListener('click', function () {
        tasks = tasks.filter(t => t.id !== task.id);
        if (editingTaskId === task.id) resetTaskForm();
        saveTasks();
        renderTasks();
        showMessage(taskMessageEl, 'Tugas berhasil dihapus.', 'success');
        clearMessageAfter(taskMessageEl);
    });

    const actions = document.createElement('div');
    actions.className = 'task-actions';
    actions.append(editBtn, deleteBtn);

    li.append(checkbox, span, badge, actions);
    return li;
}

/** Render ulang seluruh daftar tugas. */
function renderTasks() {
    taskListEl.innerHTML = '';

    const sorted = getSortedTasks();

    if (sorted.length === 0) {
        const empty = document.createElement('p');
        empty.className   = 'empty-message';
        empty.textContent = '✨ Belum ada tugas. Tambahkan tugasmu di atas!';
        taskListEl.appendChild(empty);
    } else {
        sorted.forEach(task => taskListEl.appendChild(createTaskElement(task)));
    }

    updateProgress();
}

function resetTaskForm() {
    editingTaskId          = null;
    addTaskBtn.textContent = '+ Tambah';
    taskForm.reset();
}

// Submit form
taskForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const text     = taskInput.value.trim();
    const priority = taskPriority.value;

    if (!text) {
        showMessage(taskMessageEl, 'Nama tugas tidak boleh kosong.');
        taskInput.focus();
        return;
    }

    // Challenge: cegah duplikat
    const isDuplicate = tasks.some(t =>
        t.text.toLowerCase() === text.toLowerCase() &&
        t.id !== editingTaskId
    );
    if (isDuplicate) {
        showMessage(taskMessageEl, 'Tugas ini sudah ada di daftar. Gunakan nama berbeda.');
        taskInput.focus();
        return;
    }

    if (editingTaskId !== null) {
        const target = tasks.find(t => t.id === editingTaskId);
        if (target) { target.text = text; target.priority = priority; }
        showMessage(taskMessageEl, 'Tugas berhasil diperbarui. ✅', 'success');
    } else {
        tasks.push({
            id:        Date.now().toString() + Math.random().toString(36).slice(2),
            text,
            priority,
            completed: false,
            createdAt: Date.now()
        });
        showMessage(taskMessageEl, 'Tugas berhasil ditambahkan! ✅', 'success');
    }

    saveTasks();
    resetTaskForm();
    renderTasks();
    clearMessageAfter(taskMessageEl);
});

// Inisialisasi
loadTasks();
renderTasks();

/* ============================================================
   4. QUICK LINKS
   ============================================================ */

const LINK_KEY = 'lifeDashboardLinks';

const linkForm       = document.getElementById('linkForm');
const linkNameInput  = document.getElementById('linkName');
const linkUrlInput   = document.getElementById('linkUrl');
const linkMessageEl  = document.getElementById('linkMessage');
const quickLinksEl   = document.getElementById('quickLinksList');

let links = [];

function loadLinks() {
    try {
        const raw = localStorage.getItem(LINK_KEY);
        links = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(links)) links = [];
    } catch { links = []; }
}

function saveLinks() {
    localStorage.setItem(LINK_KEY, JSON.stringify(links));
}

/**
 * Validasi URL: hanya http:// atau https://.
 * Mencegah javascript:, data:, dll.
 */
function isValidUrl(url) {
    try {
        const p = new URL(url);
        return p.protocol === 'http:' || p.protocol === 'https:';
    } catch { return false; }
}

/**
 * Ambil URL favicon dari Google Favicon API.
 * Fallback ke inisial jika gambar gagal dimuat.
 */
function getFaviconUrl(url) {
    try {
        const origin = new URL(url).origin;
        return `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(origin)}`;
    } catch { return null; }
}

/** Buat elemen favicon (img) atau fallback (div inisial). */
function createFaviconEl(link) {
    const faviconUrl = getFaviconUrl(link.url);

    if (faviconUrl) {
        const img = document.createElement('img');
        img.src       = faviconUrl;
        img.alt       = '';
        img.className = 'link-favicon';
        img.width     = 20;
        img.height    = 20;

        // Jika gagal load, ganti dengan fallback inisial
        img.onerror = function () {
            const fallback = createInitialFallback(link.name);
            img.replaceWith(fallback);
        };
        return img;
    }

    return createInitialFallback(link.name);
}

function createInitialFallback(name) {
    const div = document.createElement('div');
    div.className   = 'link-favicon-fallback';
    div.textContent = name.charAt(0).toUpperCase();
    div.setAttribute('aria-hidden', 'true');
    return div;
}

/** Render ulang daftar quick links. */
function renderLinks() {
    quickLinksEl.innerHTML = '';

    if (links.length === 0) {
        const empty = document.createElement('p');
        empty.className   = 'empty-message';
        empty.textContent = '🔗 Belum ada link tersimpan. Tambahkan di atas!';
        quickLinksEl.appendChild(empty);
        return;
    }

    links.forEach(function (link) {
        const li = document.createElement('li');

        // Favicon
        const favicon = createFaviconEl(link);

        // Anchor
        const anchor = document.createElement('a');
        anchor.href        = link.url;
        anchor.textContent = link.name;   // textContent = aman dari XSS
        anchor.target      = '_blank';
        anchor.rel         = 'noopener noreferrer';
        anchor.title       = link.url;

        const linkContent = document.createElement('div');
        linkContent.className = 'link-content';
        linkContent.append(favicon, anchor);

        // Tombol hapus
        const deleteBtn = document.createElement('button');
        deleteBtn.type        = 'button';
        deleteBtn.textContent = '🗑️ Hapus';
        deleteBtn.className   = 'link-delete-button';
        deleteBtn.setAttribute('aria-label', `Hapus link: ${link.name}`);
        deleteBtn.addEventListener('click', function () {
            links = links.filter(l => l.id !== link.id);
            saveLinks();
            renderLinks();
            showMessage(linkMessageEl, 'Link berhasil dihapus.', 'success');
            clearMessageAfter(linkMessageEl);
        });

        const actions = document.createElement('div');
        actions.className = 'link-actions';
        actions.appendChild(deleteBtn);

        li.append(linkContent, actions);
        quickLinksEl.appendChild(li);
    });
}

// Submit form Quick Links
linkForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = linkNameInput.value.trim();
    const url  = linkUrlInput.value.trim();

    if (!name) {
        showMessage(linkMessageEl, 'Nama website tidak boleh kosong.');
        linkNameInput.focus();
        return;
    }

    if (!isValidUrl(url)) {
        showMessage(linkMessageEl, 'URL tidak valid. Gunakan format https://example.com');
        linkUrlInput.focus();
        return;
    }

    // Cegah duplikat URL
    if (links.some(l => l.url.toLowerCase() === url.toLowerCase())) {
        showMessage(linkMessageEl, 'URL ini sudah ada di daftar link.');
        linkUrlInput.focus();
        return;
    }

    links.push({
        id:        Date.now().toString() + Math.random().toString(36).slice(2),
        name,
        url,
        createdAt: Date.now()
    });

    saveLinks();
    linkForm.reset();
    renderLinks();
    showMessage(linkMessageEl, 'Link berhasil ditambahkan! ✅', 'success');
    clearMessageAfter(linkMessageEl);
});

// Inisialisasi
loadLinks();
renderLinks();
