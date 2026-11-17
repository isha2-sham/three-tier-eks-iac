// Usage: node scripts/seed.js <tasks-api-url> [--clear]
// --clear deletes ALL existing tasks first. Running twice without it adds duplicates.
const api = process.argv[2];
const clear = process.argv.includes("--clear");
if (!api) {
    console.error("Usage: node scripts/seed.js <tasks-api-url> [--clear]");
    process.exit(1);
}

const pad = (n) => String(n).padStart(2, "0");
const day = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// [category, task, priority, due-in-days, completed]
const SEED = [
    ["Study", "Submit DBMS assignment", "High", 1],
    ["Study", "Revise Computer Networks unit 3", "High", 3],
    ["Study", "Prepare synopsis presentation", "High", 2],
    ["Study", "Clear Maths backlog", "Medium", 10],
    ["Study", "Return library book", "Low", -1],
    ["Work", "Fix login bug in API", "High", 0],
    ["Work", "Review pull request", "Medium", 1],
    ["Work", "Write project report, chapter 3", "Medium", 4],
    ["Work", "Update README with screenshots", "Low", 6],
    ["Work", "Rehearse demo for professor", "High", 7],
    ["Personal", "Pay electricity bill", "High", 2],
    ["Personal", "Recharge phone", "Medium", 4],
    ["Personal", "Call grandparents", "Low", 3],
    ["Personal", "Clean room", "Low", 0, true],
    ["Shopping", "Groceries: milk, bread, eggs", "Medium", 0],
    ["Shopping", "Buy notebook and pens", "Low", 2],
    ["Shopping", "Order laptop sleeve", "Low", 8, true],
    ["Health", "Book dental checkup", "Medium", 6],
    ["Health", "30-minute walk", "Medium", 0, true],
    ["Health", "Drink 8 glasses of water", "Low", 0, true],
    ["Travel", "Book train tickets", "High", 5],
    ["Travel", "Pack bag", "Medium", 9],
    ["Travel", "Plan friend's birthday surprise", "Medium", 12],
];

(async () => {
    if (clear) {
        const existing = await (await fetch(api)).json();
        if (Array.isArray(existing)) {
            for (const t of existing) await fetch(`${api}/${t._id}`, { method: "DELETE" });
            console.log(`Removed ${existing.length} existing tasks`);
        }
    }
    let ok = 0;
    for (const [category, task, priority, offset, completed] of SEED) {
        const res = await fetch(api, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task, category, priority, dueDate: day(offset), completed: !!completed }),
        });
        if (res.ok) ok++;
        else console.error("Failed:", task, res.status, await res.text());
    }
    console.log(`Added ${ok} of ${SEED.length} tasks`);
})();
