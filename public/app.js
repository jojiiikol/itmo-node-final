const $ = (selector) => document.querySelector(selector);
const TOKEN_STORAGE_KEY = 'itmo-node-final.jwt';

const elements = {
  authorInfo: $('#author-info'),
  authorLogin: $('#author-login'),
  authorName: $('#author-name'),
  createDialog: $('#create-dialog'),
  createForm: $('#create-form'),
  createMessage: $('#create-message'),
  createRunId: $('#create-run-id'),
  createTitle: $('#create-title'),
  deleteTask: $('#delete-task'),
  detailCreated: $('#detail-created'),
  detailDone: $('#detail-done'),
  detailId: $('#detail-id'),
  detailOwner: $('#detail-owner'),
  detailRunId: $('#detail-run-id'),
  detailTitle: $('#detail-title'),
  emptyState: $('#empty-state'),
  filterForm: $('#filter-form'),
  filterRunId: $('#filter-run-id'),
  loading: $('#loading'),
  loginForm: $('#login-form'),
  loginMessage: $('#login-message'),
  loginPanel: $('#login-panel'),
  logout: $('#logout'),
  message: $('#message'),
  openCreate: $('#open-create'),
  projectDialog: $('#project-dialog'),
  projectInfo: $('#project-info'),
  resultSummary: $('#result-summary'),
  taskDialog: $('#task-dialog'),
  taskForm: $('#task-form'),
  taskGrid: $('#task-grid'),
  taskMessage: $('#task-message'),
  token: $('#token'),
  tokenExpiry: $('#token-expiry'),
  tokenInfo: $('#token-info'),
  tokenRole: $('#token-role'),
  workspace: $('#workspace'),
};

const state = { token: '', session: null, tasks: [], selectedTask: null };

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${state.token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Не удалось связаться с сервером.');
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: response.statusText }));
    if (response.status === 401) logout();
    throw new Error(payload.error || 'Не удалось выполнить запрос.');
  }
  return response.status === 204 ? null : response.json();
}

function formatDate(value, withTime = true) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(value));
}

function setMessage(text = '', success = false) {
  elements.message.textContent = text;
  elements.message.classList.toggle('success', success);
}

function setBusy(button, busy) {
  if (button) button.disabled = busy;
  elements.loading.hidden = !busy;
}

function renderIdentity() {
  const { role, author, expiresAt } = state.session;
  elements.tokenRole.textContent = role === 'reviewer' ? 'Преподаватель' : 'Создатель';
  elements.tokenExpiry.textContent = `Токен действует до ${formatDate(expiresAt)}`;
  elements.authorName.textContent = author.fullName;
  elements.authorLogin.textContent = author.login;
  elements.tokenInfo.hidden = false;
  elements.authorInfo.hidden = false;
  elements.logout.hidden = false;
}

function renderTasks() {
  elements.taskGrid.replaceChildren();
  elements.emptyState.hidden = state.tasks.length !== 0;
  const filter = elements.filterRunId.value.trim();
  elements.resultSummary.textContent = `${filter ? `runId: ${filter}` : 'Все runId'} · найдено: ${state.tasks.length}`;

  for (const task of state.tasks) {
    const article = document.createElement('article');
    article.className = `task-card${task.done ? ' done' : ''}`;

    const open = document.createElement('button');
    open.type = 'button';
    open.setAttribute('aria-label', `Открыть задачу: ${task.title}`);

    const top = document.createElement('div');
    top.className = 'card-top';
    const status = document.createElement('span');
    status.className = `status${task.done ? ' done' : ''}`;
    status.textContent = task.done ? 'Выполнена' : 'В работе';
    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    top.append(status, arrow);

    const title = document.createElement('h3');
    title.className = 'task-title';
    title.textContent = task.title;

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const date = document.createElement('span');
    date.textContent = formatDate(task.createdAt, false);
    const runId = document.createElement('span');
    runId.textContent = task.runId;
    meta.append(date, runId);

    open.append(top, title, meta);
    open.addEventListener('click', () => openTask(task));
    article.append(open);
    elements.taskGrid.append(article);
  }
}

async function loadTasks() {
  setMessage();
  const button = elements.filterForm.querySelector('button');
  setBusy(button, true);
  try {
    const runId = elements.filterRunId.value.trim();
    state.tasks = await api(runId
      ? `/api/tasks/?runId=${encodeURIComponent(runId)}`
      : '/api/tasks/all/');
    renderTasks();
  } catch (error) {
    setMessage(error.message);
  } finally {
    setBusy(button, false);
  }
}

function openTask(task) {
  state.selectedTask = task;
  elements.taskMessage.textContent = '';
  elements.detailTitle.value = task.title;
  elements.detailDone.value = String(task.done);
  elements.detailRunId.textContent = task.runId;
  elements.detailOwner.textContent = task.ownerLogin;
  elements.detailCreated.textContent = formatDate(task.createdAt);
  elements.detailId.textContent = task.id;
  elements.taskDialog.showModal();
}

function logout() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  state.token = '';
  state.session = null;
  state.tasks = [];
  state.selectedTask = null;
  elements.token.value = '';
  elements.tokenInfo.hidden = true;
  elements.authorInfo.hidden = true;
  elements.logout.hidden = true;
  elements.workspace.hidden = true;
  elements.loginPanel.hidden = false;
  elements.taskGrid.replaceChildren();
  for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
}

async function enterWorkspace(token) {
  state.token = token;
  state.session = await api('/api/session/');
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  renderIdentity();
  elements.loginPanel.hidden = true;
  elements.workspace.hidden = false;
  await loadTasks();
}

elements.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  elements.loginMessage.textContent = '';
  try {
    await enterWorkspace(elements.token.value.trim());
  } catch (error) {
    elements.loginMessage.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

elements.filterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadTasks();
});

elements.openCreate.addEventListener('click', () => {
  elements.createRunId.value = elements.filterRunId.value || 'manual';
  elements.createTitle.value = '';
  elements.createMessage.textContent = '';
  elements.createDialog.showModal();
  elements.createTitle.focus();
});

elements.createForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  try {
    await api('/api/tasks/', {
      method: 'POST',
      body: JSON.stringify({ title: elements.createTitle.value, runId: elements.createRunId.value }),
    });
    elements.filterRunId.value = elements.createRunId.value;
    elements.createDialog.close();
    await loadTasks();
    setMessage('Задача создана.', true);
  } catch (error) {
    elements.createMessage.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

elements.taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.submitter;
  button.disabled = true;
  try {
    await api(`/api/tasks/${state.selectedTask.id}/`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: elements.detailTitle.value,
        done: elements.detailDone.value === 'true',
      }),
    });
    elements.taskDialog.close();
    await loadTasks();
    setMessage('Изменения сохранены.', true);
  } catch (error) {
    elements.taskMessage.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

elements.deleteTask.addEventListener('click', async () => {
  if (!state.selectedTask || !window.confirm(`Удалить задачу «${state.selectedTask.title}»?`)) return;
  elements.deleteTask.disabled = true;
  try {
    await api(`/api/tasks/${state.selectedTask.id}/`, { method: 'DELETE' });
    elements.taskDialog.close();
    await loadTasks();
    setMessage('Задача удалена.', true);
  } catch (error) {
    elements.taskMessage.textContent = error.message;
  } finally {
    elements.deleteTask.disabled = false;
  }
});

elements.projectInfo.addEventListener('click', () => elements.projectDialog.showModal());
elements.logout.addEventListener('click', logout);

document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => document.getElementById(button.dataset.close).close());
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
});

async function restoreSession() {
  const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!savedToken) return;

  try {
    await enterWorkspace(savedToken);
  } catch {
    const tokenWasRejected = !localStorage.getItem(TOKEN_STORAGE_KEY);
    state.token = '';
    elements.loginMessage.textContent = tokenWasRejected
      ? 'Сохранённый токен недействителен или истёк. Войдите снова.'
      : 'Не удалось проверить сохранённый токен. Обновите страницу позже.';
  }
}

restoreSession();
