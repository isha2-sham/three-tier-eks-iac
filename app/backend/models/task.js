const mongoose = require("mongoose");

const CATEGORIES = ["Study", "Work", "Personal", "Shopping", "Health", "Travel"];

const taskSchema = new mongoose.Schema({
    task: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    category: { type: String, enum: CATEGORIES, default: "Personal" },
    dueDate: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Task", taskSchema);
