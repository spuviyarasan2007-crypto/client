# TaskFlow - Interactive To-Do List Application

A responsive, client-side To-Do List application focused on clean JavaScript architecture, state-driven rendering, event delegation, and automatic local data persistence.

## Key Features & Learning Outcomes

1. **Full CRUD Operations**:
   - **Create**: Add new tasks through the input form (press Enter or click Add).
   - **Read**: Dynamic rendering of tasks with timestamps and completion indicators.
   - **Update**: 
     - Toggle completion status via custom checkboxes.
     - Inline text editing by clicking the pencil icon (✏️) or double-clicking the task title. Press **Enter** or click outside to save, **Escape** to cancel.
   - **Delete**: Remove individual tasks with the delete icon (🗑️) or batch clear completed items with "Clear Completed".

2. **Automatic Local Persistence (`window.localStorage`)**:
   - State is automatically saved on every mutation (add, toggle, edit, delete).
   - Re-opening or refreshing the page retains all user tasks.

3. **Advanced Filtering & Search**:
   - **All / Active / Completed** tab filtering.
   - Real-time search query matching.
   - Counter tracking remaining active items.

4. **DOM Manipulation & Event Delegation**:
   - Single event listener on the parent container (`#todo-list`) using `e.target.closest()` to avoid attaching listeners to every list item.
   - XSS sanitization helper (`escapeHtml`) when rendering user text into HTML.

## Getting Started

Simply open `index.html` in any web browser:
- Double-click [index.html](file:///c:/Users/vishn/Desktop/puvi/index.html) or open it directly in Chrome, Firefox, Edge, etc.

