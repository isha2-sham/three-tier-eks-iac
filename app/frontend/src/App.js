import React, { useState, useEffect } from "react";
import "./App.css";
import { getTasks, addTask, updateTask, deleteTask } from "./services/taskServices";

const PRIORITIES = ["High", "Medium", "Low"];
const PRIORITY_COLORS = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#22c55e",
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await getTasks();
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      const res = await addTask({ task: input, priority });
      setTasks([...tasks, res.data]);
      setInput("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (id, completed) => {
    try {
      const res = await updateTask(id, { completed: !completed });
      setTasks(tasks.map((t) => (t._id === id ? res.data : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = tasks.filter((t) => {
    if (filter === "Active") return !t.completed;
    if (filter === "Completed") return t.completed;
    return true;
  });

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

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
            <span className="stat-label">Total Tasks</span>
          </div>
          <div className="stat-card stat-card--green">
            <span className="stat-number">{completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-card stat-card--amber">
            <span className="stat-number">{pending}</span>
            <span className="stat-label">Pending</span>
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
        <div className="priority-legend">
          <p className="legend-title">Priority</p>
          {PRIORITIES.map((p) => (
            <div key={p} className="legend-item">
              <span className="legend-dot" style={{ background: PRIORITY_COLORS[p] }} />
              <span>{p}</span>
              <span className="legend-count">
                {tasks.filter((t) => t.priority === p).length}
              </span>
            </div>
          ))}
        </div>
      </aside>
      <main className="main">
        <header className="header">
          <div>
            <h1 className="page-title">My Tasks (v2)</h1>
            <p className="page-sub">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric",
              })}
            </p>
          </div>
        </header>
        <form className="add-form" onSubmit={handleAdd}>
          <input
            className="add-input"
            type="text"
            placeholder="What needs to be done?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <select
            className="priority-select"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button className="add-btn" type="submit">Add Task</button>
        </form>
        <div className="filters">
          {["All", "Active", "Completed"].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "filter-btn--active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="task-list">
          {loading ? (
            <div className="empty">Loading tasks...</div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">📋</span>
              <p>No tasks here. Add one above!</p>
            </div>
          ) : (
            filtered.map((task) => (
              <div key={task._id} className={`task-card ${task.completed ? "task-card--done" : ""}`}>
                <div className="task-priority-bar" style={{ background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium }} />
                <input
                  type="checkbox"
                  className="task-check"
                  checked={task.completed}
                  onChange={() => handleComplete(task._id, task.completed)}
                />
                <div className="task-content">
                  <p className="task-text">{task.task}</p>
                  <span
                    className="task-badge"
                    style={{
                      background: `${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium}20`,
                      color: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.Medium,
                    }}
                  >
                    {task.priority || "Medium"}
                  </span>
                </div>
                <button className="delete-btn" onClick={() => handleDelete(task._id)}>✕</button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
