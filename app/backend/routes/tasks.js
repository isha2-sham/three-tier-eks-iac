const Task = require("../models/task");
const express = require("express");
const router = express.Router();

// Only these fields may be set from a request
const FIELDS = ["task", "completed", "priority", "category", "dueDate"];
const pick = (body) =>
    FIELDS.reduce(
        (out, key) => (body && body[key] !== undefined ? { ...out, [key]: body[key] } : out),
        {}
    );

const fail = (res, error) => {
    if (error.name === "ValidationError" || error.name === "CastError") {
        return res.status(400).send({ message: error.message });
    }
    console.error(error);
    return res.status(500).send({ message: "Server error" });
};

router.post("/", async (req, res) => {
    try {
        const task = await new Task(pick(req.body)).save();
        res.status(201).send(task);
    } catch (error) {
        fail(res, error);
    }
});

router.get("/", async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: 1 });
        res.send(tasks);
    } catch (error) {
        fail(res, error);
    }
});

router.put("/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, pick(req.body), {
            new: true,
            runValidators: true,
        });
        if (!task) return res.status(404).send({ message: "Task not found" });
        res.send(task);
    } catch (error) {
        fail(res, error);
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).send({ message: "Task not found" });
        res.send(task);
    } catch (error) {
        fail(res, error);
    }
});

module.exports = router;
