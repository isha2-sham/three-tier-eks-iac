import React, { useState, useEffect, useMemo } from "react";
import "./App.css";
import { getTasks, addTask, updateTask, deleteTask } from "./services/taskServices";

const PRIORITIES = ["High", "Medium", "Low"];
const CATEGORIES = ["Study", "Work", "Personal", "Shopping", "Health", "Travel"];
const PRIORITY_COLORS = { High: "#ef4444", Medium: "#f59e0b", Low: "#22c55e" };
const CATEGORY_COLORS = {
  Study: "#818cf8",
  Work: "#38bdf8",
  Personal: "#f472b6",
  Shopping: "#fb923c",
  Health: "#34d399",
  Travel: "#a78bfa",
};
const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

const catOf = (t) => t.category || "Personal";
const prioOf = (t) => t.priority || "Medium";
const pad = (n) => String(n).padStart(2, "0");
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const dueKey = (t) => (t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : null);
const dueStatus = (t) => {
  const k = dueKey(t);
  if (!k || t.completed) return null;
  const today = todayKey();
  if (k < today) return "overdue";
  if (k === today) return "today";
  return "upcoming";
};
const formatDue = (k) =>
  new Date(`${k}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function Donut({ done, total }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <svg viewBox="0 0 100 100" className="donut">
      <circle cx="50" cy="50" r={r} className="donut-bg" />
      {pct > 0 && (
        <circle
          cx="50"
          cy="50"
          r={r}
          className="donut-fg"
          strokeDasharray={`${pct * c} ${c}`}
          transform="rotate(-90 50 50)"
        />
      )}
      <text x="50" y="56" textAnchor="middle" className="donut-text">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

function BarRow({ label, count, max, color }) {
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${(count / max) * 100}%`, background: color }} />
      </div>
      <span className="bar-count">{count}</span>
    </div>
  );
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Personal");
  const [dueDate, setDueDate] = useState("");

  const [activeList, setActiveList] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await getTasks();
      setTasks(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not load tasks. Is the backend reachable?");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await addTask({
        task: text.trim(),
        priority,
        category,
        dueDate: dueDate || null,
      });
      setTasks((prev) => [...prev, res.data]);
      setText("");
      setDueDate("");
      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not add the task.");
    }
  };

  const patchTask = async (id, changes) => {
    try {
      await updateTask(id, changes);
      setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, ...changes } : t)));
      setError("");
      return true;
    } catch (err) {
      console.error(err);
      setError("Could not update the task.");
      return false;
    }
  };

  const toggle = (t) => patchTask(t._id, { completed: !t.completed });

  const remove = async (id) => {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t._id !== id));
      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not delete the task.");
    }
  };

  const startEdit = (t) => {
    setEditingId(t._id);
    setDraft({
      task: t.task,
      priority: prioOf(t),
      category: catOf(t),
      dueDate: dueKey(t) || "",
    });
  };

  const saveEdit = async () => {
    if (!draft.task.trim()) return;
    const ok = await patchTask(editingId, {
      task: draft.task.trim(),
      priority: draft.priority,
      category: draft.category,
      dueDate: draft.dueDate || null,
    });
    if (ok) setEditingId(null);
  };

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter((t) => dueStatus(t) === "overdue").length;
  const dueToday = tasks.filter((t) => dueStatus(t) === "today").length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  const perCategory = CATEGORIES.map((c) => ({
    name: c,
    count: tasks.filter((t) => catOf(t) === c).length,
  }));
  const maxCat = Math.max(1, ...perCategory.map((c) => c.count));
  const perPriority = PRIORITIES.map((p) => ({
    name: p,
    count: tasks.filter((t) => prioOf(t) === p).length,
  }));
  const maxPrio = Math.max(1, ...perPriority.map((p) => p.count));

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = tasks.filter((t) => {
      if (activeList !== "All" && catOf(t) !== activeList) return false;
      if (statusFilter === "Active" && t.completed) return false;
      if (statusFilter === "Completed" && !t.completed) return false;
      if (statusFilter === "Overdue" && dueStatus(t) !== "overdue") return false;
      if (priorityFilter !== "All" && prioOf(t) !== priorityFilter) return false;
      if (q && !t.task.toLowerCase().includes(q)) return false;
      return true;
    });
    list.sort((a, b) => {
      if (!!a.completed !== !!b.completed) return a.completed ? 1 : -1;
      if (sortBy === "Due date") {
        const ka = dueKey(a);
        const kb = dueKey(b);
        if (ka && kb) return ka < kb ? -1 : ka > kb ? 1 : 0;
        if (ka) return -1;
        if (kb) return 1;
        return 0;
      }
      if (sortBy === "Priority") return PRIORITY_RANK[prioOf(a)] - PRIORITY_RANK[prioOf(b)];
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    return list;
  }, [tasks, activeList, statusFilter, priorityFilter, sortBy, search]);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">✦</span>
          <span className="brand-name">TaskFlow</span>
        </div>

        <div className="stats">
          <div className="stat-card">
            <span className="stat-number">{total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card stat-card--green">
            <span className="stat-number">{completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-card stat-card--amber">
            <span className="stat-number">{pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card stat-card--red">
            <span className="stat-number">{overdue}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-header">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <nav className="lists">
          <p className="legend-title">Lists</p>
          <button
            className={`list-btn ${activeList === "All" ? "list-btn--active" : ""}`}
            onClick={() => setActiveList("All")}
          >
            <span className="list-name">All tasks</span>
            <span className="legend-count">{total}</span>
          </button>
          {perCategory.map((c) => (
            <button
              key={c.name}
              className={`list-btn ${activeList === c.name ? "list-btn--active" : ""}`}
              onClick={() => setActiveList(c.name)}
            >
              <span className="legend-dot" style={{ background: CATEGORY_COLORS[c.name] }} />
              <span className="list-name">{c.name}</span>
              <span className="legend-count">{c.count}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        <header className="header">
          <h1 className="page-title">
            {activeList === "All" ? "All Tasks" : `${activeList} List`}
          </h1>
          <p className="page-sub">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <section className="overview">
          <div className="card">
            <p className="card-title">Completion</p>
            <div className="donut-wrap">
              <Donut done={completed} total={total} />
              <div className="donut-legend">
                <div>
                  <b>{completed}</b> of <b>{total}</b> done
                </div>
                <div>
                  <b>{overdue}</b> overdue
                </div>
                <div>
                  <b>{dueToday}</b> due today
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <p className="card-title">By list</p>
            {perCategory.map((c) => (
              <BarRow
                key={c.name}
                label={c.name}
                count={c.count}
                max={maxCat}
                color={CATEGORY_COLORS[c.name]}
              />
            ))}
          </div>
          <div className="card">
            <p className="card-title">By priority</p>
            {perPriority.map((p) => (
              <BarRow
                key={p.name}
                label={p.name}
                count={p.count}
                max={maxPrio}
                color={PRIORITY_COLORS[p.name]}
              />
            ))}
          </div>
        </section>

        <form className="add-form" onSubmit={handleAdd}>
          <input
            className="add-input"
            type="text"
            placeholder="What needs to be done?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <select
            className="priority-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="priority-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="date-input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <button className="add-btn" type="submit">
            Add Task
          </button>
        </form>

        <div className="toolbar">
          <div className="filters">
            {["All", "Active", "Completed", "Overdue"].map((f) => (
              <button
                key={f}
                className={`filter-btn ${statusFilter === f ? "filter-btn--active" : ""}`}
                onClick={() => setStatusFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <input
              className="search-input"
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="small-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <select
              className="small-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="Newest">Sort: Newest</option>
              <option value="Due date">Sort: Due date</option>
              <option value="Priority">Sort: Priority</option>
            </select>
          </div>
        </div>

        <div className="task-list">
          {loading ? (
            <div className="empty">Loading tasks...</div>
          ) : visible.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">📋</span>
              <p>{total === 0 ? "No tasks yet. Add one above!" : "No tasks match your filters."}</p>
            </div>
          ) : (
            visible.map((t) => {
              if (t._id === editingId) {
                return (
                  <div key={t._id} className="task-card task-card--edit">
                    <div
                      className="task-priority-bar"
                      style={{ background: PRIORITY_COLORS[draft.priority] }}
                    />
                    <div className="edit-grid">
                      <input
                        className="add-input"
                        value={draft.task}
                        onChange={(e) => setDraft({ ...draft, task: e.target.value })}
                      />
                      <select
                        className="priority-select"
                        value={draft.category}
                        onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <select
                        className="priority-select"
                        value={draft.priority}
                        onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        className="date-input"
                        value={draft.dueDate}
                        onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                      />
                      <button className="btn-save" onClick={saveEdit}>
                        Save
                      </button>
                      <button className="btn-cancel" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              const status = dueStatus(t);
              const dk = dueKey(t);
              let dueLabel = null;
              if (dk) {
                if (status === "overdue") dueLabel = `Overdue · ${formatDue(dk)}`;
                else if (status === "today") dueLabel = "Due today";
                else dueLabel = `Due ${formatDue(dk)}`;
              }
              const pc = PRIORITY_COLORS[prioOf(t)];
              const cc = CATEGORY_COLORS[catOf(t)];

              return (
                <div
                  key={t._id}
                  className={`task-card ${t.completed ? "task-card--done" : ""}`}
                >
                  <div className="task-priority-bar" style={{ background: pc }} />
                  <input
                    type="checkbox"
                    className="task-check"
                    checked={!!t.completed}
                    onChange={() => toggle(t)}
                  />
                  <div className="task-content">
                    <p className="task-text">{t.task}</p>
                    <div className="task-meta">
                      <span className="task-badge" style={{ background: `${pc}20`, color: pc }}>
                        {prioOf(t)}
                      </span>
                      <span className="task-badge" style={{ background: `${cc}20`, color: cc }}>
                        {catOf(t)}
                      </span>
                      {dueLabel && <span className={`due due--${status || "plain"}`}>{dueLabel}</span>}
                    </div>
                  </div>
                  <button className="icon-btn" title="Edit" onClick={() => startEdit(t)}>
                    ✎
                  </button>
                  <button className="delete-btn" title="Delete" onClick={() => remove(t._id)}>
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
