/**
 * TaskFlow - Interactive To-Do List Application
 * Architecture:
 * 1. State Management: Single Source of Truth (`state.todos`, `state.filter`, `state.searchTerm`).
 * 2. Persistence: Synchronized with window.localStorage.
 * 3. Event Delegation: Efficient single listeners on containers instead of attaching to every element.
 * 4. DOM Manipulation: Dynamic element construction and state-driven rendering.
 */

// --- 1. STATE & STORAGE CONFIG ---
const STORAGE_KEY = 'taskflow_todos_v1';

const state = {
  todos: loadTodos(),
  filter: 'all', // 'all' | 'active' | 'completed'
  searchTerm: '',
  editingId: null,
};

/**
 * Read tasks from localStorage with safe fallback
 */
function loadTodos() {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    return serialized ? JSON.parse(serialized) : [];
  } catch (err) {
    console.error('Failed to load tasks from localStorage:', err);
    return [];
  }
}

/**
 * Persist tasks automatically to localStorage
 */
function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.todos));
  } catch (err) {
    console.error('Failed to save tasks to localStorage:', err);
  }
}

// --- 2. DOM ELEMENT REFERENCES ---
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const itemsLeftSpan = document.getElementById('items-left');
const clearCompletedBtn = document.getElementById('clear-completed');
const emptyState = document.getElementById('empty-state');

// --- 3. CRUD LOGIC ---

/**
 * CREATE: Add a new todo item to the state
 */
function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const newTodo = {
    id: 'todo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    text: trimmed,
    completed: false,
    createdAt: new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };

  state.todos.unshift(newTodo);
  saveTodos();
  render();
}

/**
 * UPDATE: Toggle complete status
 */
function toggleTodo(id) {
  state.todos = state.todos.map((todo) => {
    if (todo.id === id) {
      return { ...todo, completed: !todo.completed };
    }
    return todo;
  });
  saveTodos();
  render();
}

/**
 * UPDATE: Edit task title
 */
function updateTodoText(id, newText) {
  const trimmed = newText.trim();
  if (!trimmed) {
    // If text is emptied out, delete the task
    deleteTodo(id);
    return;
  }

  state.todos = state.todos.map((todo) => {
    if (todo.id === id) {
      return { ...todo, text: trimmed };
    }
    return todo;
  });
  state.editingId = null;
  saveTodos();
  render();
}

/**
 * DELETE: Remove a task by ID
 */
function deleteTodo(id) {
  state.todos = state.todos.filter((todo) => todo.id !== id);
  if (state.editingId === id) state.editingId = null;
  saveTodos();
  render();
}

/**
 * DELETE (BATCH): Remove all completed tasks
 */
function clearCompleted() {
  state.todos = state.todos.filter((todo) => !todo.completed);
  saveTodos();
  render();
}

// --- 4. FILTERING & SEARCHING HELPERS ---
function getFilteredTodos() {
  return state.todos.filter((todo) => {
    // Status filter
    if (state.filter === 'active' && todo.completed) return false;
    if (state.filter === 'completed' && !todo.completed) return false;

    // Search filter
    if (state.searchTerm) {
      return todo.text.toLowerCase().includes(state.searchTerm.toLowerCase());
    }
    return true;
  });
}

// --- 5. DOM RENDERING ---

/**
 * Main render function: creates DOM elements dynamically and updates counters
 */
function render() {
  const filteredTodos = getFilteredTodos();
  todoList.innerHTML = '';

  // Handle empty state
  if (filteredTodos.length === 0) {
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
  }

  // Construct dynamic DOM items
  filteredTodos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id;

    const isEditing = state.editingId === todo.id;

    if (isEditing) {
      // Inline edit mode input
      li.innerHTML = `
        <div class="todo-content" style="width: 100%;">
          <input 
            type="text" 
            class="edit-input" 
            value="${escapeHtml(todo.text)}" 
            aria-label="Edit task title"
          />
        </div>
      `;
    } else {
      // Normal display mode
      li.innerHTML = `
        <label class="checkbox-container">
          <input 
            type="checkbox" 
            class="todo-checkbox" 
            ${todo.completed ? 'checked' : ''} 
            aria-label="Mark task complete"
          />
        </label>
        <div class="todo-content">
          <span class="todo-text" title="Double click to edit">${escapeHtml(todo.text)}</span>
          <span class="todo-meta">Added: ${todo.createdAt}</span>
        </div>
        <div class="item-actions">
          <button class="action-btn edit-btn" title="Edit task" aria-label="Edit task">✏️</button>
          <button class="action-btn delete-btn" title="Delete task" aria-label="Delete task">🗑️</button>
        </div>
      `;
    }

    todoList.appendChild(li);
  });

  // Focus the edit input if currently editing
  if (state.editingId) {
    const editInput = todoList.querySelector('.edit-input');
    if (editInput) {
      editInput.focus();
      editInput.setSelectionRange(editInput.value.length, editInput.value.length);
    }
  }

  // Update stats counters
  const activeCount = state.todos.filter((t) => !t.completed).length;
  itemsLeftSpan.textContent = `${activeCount} ${activeCount === 1 ? 'item' : 'items'} left`;

  // Update Clear Completed button visibility
  const hasCompleted = state.todos.some((t) => t.completed);
  clearCompletedBtn.style.visibility = hasCompleted ? 'visible' : 'hidden';
}

/**
 * Prevent XSS attacks when rendering user inputs
 */
function escapeHtml(string) {
  const div = document.createElement('div');
  div.textContent = string;
  return div.innerHTML;
}

// --- 6. EVENT LISTENERS & EVENT DELEGATION ---

// CREATE: Form Submission
todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTodo(todoInput.value);
  todoInput.value = '';
});

// EVENT DELEGATION ON TODO LIST CONTAINER
// Handles: Checkbox toggle, Delete button, Edit button trigger, Double click edit, Save on Enter/Blur
todoList.addEventListener('click', (e) => {
  const item = e.target.closest('.todo-item');
  if (!item) return;
  const id = item.dataset.id;

  // 1. Checkbox click (Toggle Complete)
  if (e.target.classList.contains('todo-checkbox')) {
    toggleTodo(id);
    return;
  }

  // 2. Delete button click
  if (e.target.closest('.delete-btn')) {
    deleteTodo(id);
    return;
  }

  // 3. Edit button click
  if (e.target.closest('.edit-btn')) {
    state.editingId = id;
    render();
    return;
  }
});

// Inline Editing via Double-Click
todoList.addEventListener('dblclick', (e) => {
  const item = e.target.closest('.todo-item');
  if (!item) return;
  const id = item.dataset.id;

  if (e.target.classList.contains('todo-text')) {
    state.editingId = id;
    render();
  }
});

// Keydown handler for saving inline edits (Enter) or cancelling (Escape)
todoList.addEventListener('keydown', (e) => {
  if (e.target.classList.contains('edit-input')) {
    const item = e.target.closest('.todo-item');
    const id = item.dataset.id;

    if (e.key === 'Enter') {
      updateTodoText(id, e.target.value);
    } else if (e.key === 'Escape') {
      state.editingId = null;
      render();
    }
  }
});

// Focusout (blur) to save inline edit when clicking away
todoList.addEventListener('focusout', (e) => {
  if (e.target.classList.contains('edit-input')) {
    const item = e.target.closest('.todo-item');
    if (item && state.editingId === item.dataset.id) {
      updateTodoText(item.dataset.id, e.target.value);
    }
  }
});

// Filtering Controls
filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.filter = btn.dataset.filter;
    render();
  });
});

// Search Input Listener
searchInput.addEventListener('input', (e) => {
  state.searchTerm = e.target.value;
  render();
});

// Clear Completed Tasks
clearCompletedBtn.addEventListener('click', () => {
  clearCompleted();
});

// --- 7. INITIALIZATION ---
// Initial seed data if starting with an empty application
if (state.todos.length === 0) {
  state.todos = [
    {
      id: 'demo-1',
      text: 'Master DOM Manipulation & Event Delegation',
      completed: true,
      createdAt: 'Just now',
    },
    {
      id: 'demo-2',
      text: 'Persist state to window.localStorage',
      completed: false,
      createdAt: 'Just now',
    },
    {
      id: 'demo-3',
      text: 'Double click on any task to edit inline',
      completed: false,
      createdAt: 'Just now',
    },
  ];
  saveTodos();
}

// Initial render
render();

