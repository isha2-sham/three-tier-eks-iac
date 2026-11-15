const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema({
    task: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("Task", taskSchema);
