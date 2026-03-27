import express from "express";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 3000;
const db = new Database("database.sqlite");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    daily_xp INTEGER DEFAULT 0,
    last_xp_update TEXT,
    is_banned INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    status TEXT DEFAULT 'pending',
    type TEXT,
    validation_data TEXT,
    created_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    target_value INTEGER,
    current_value INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS routines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    tasks TEXT,
    created_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS admin_config (
    id INTEGER PRIMARY KEY,
    features TEXT,
    xp_settings TEXT,
    content TEXT
  );
`);

// Default Admin Config
const defaultAdminConfig = {
  features: [
    { id: 'ai_suggestions', name: 'AI Suggestions', isEnabled: true, isBeta: true, requiredLevel: 1 },
    { id: 'goals_system', name: 'Goals System', isEnabled: true, isBeta: false, requiredLevel: 2 },
    { id: 'stats_dashboard', name: 'Stats Dashboard', isEnabled: true, isBeta: false, requiredLevel: 1 },
    { id: 'routines', name: 'Daily Routines', isEnabled: true, isBeta: false, requiredLevel: 3 }
  ],
  xpSettings: {
    taskXP: 10,
    routineXP: 50,
    dailyCap: 500
  },
  content: {
    tos: "Terms of Service content...",
    privacy: "Privacy Policy content...",
    version: "1.0.0",
    updateMessage: "Initial release!",
    lastUpdated: new Date().toISOString()
  }
};

const existingConfig = db.prepare("SELECT * FROM admin_config WHERE id = 1").get();
if (!existingConfig) {
  db.prepare("INSERT INTO admin_config (id, features, xp_settings, content) VALUES (1, ?, ?, ?)")
    .run(JSON.stringify(defaultAdminConfig.features), JSON.stringify(defaultAdminConfig.xpSettings), JSON.stringify(defaultAdminConfig.content));
}

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key', (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const result = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").run(email, hashedPassword);
    const token = jwt.sign({ id: result.lastInsertRowid, email }, process.env.JWT_SECRET || 'your_super_secret_jwt_key');
    res.json({ token, user: { id: result.lastInsertRowid, email, level: 1, xp: 0 } });
  } catch (e) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  if (user.is_banned) return res.status(403).json({ error: "Account banned" });

  const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET || 'your_super_secret_jwt_key');
  res.json({ token, user: { id: user.id, email, level: user.level, xp: user.xp } });
});

// --- ADMIN ROUTES ---
app.get("/api/admin/config", authenticateToken, (req: any, res) => {
  if (req.user.email !== (process.env.ADMIN_EMAIL || 'saifahmed123az@gmail.com')) return res.sendStatus(403);
  const config: any = db.prepare("SELECT * FROM admin_config WHERE id = 1").get();
  res.json({
    features: JSON.parse(config.features),
    xpSettings: JSON.parse(config.xp_settings),
    content: JSON.parse(config.content)
  });
});

app.post("/api/admin/config", authenticateToken, (req: any, res) => {
  if (req.user.email !== (process.env.ADMIN_EMAIL || 'saifahmed123az@gmail.com')) return res.sendStatus(403);
  const { features, xpSettings, content } = req.body;
  db.prepare("UPDATE admin_config SET features = ?, xp_settings = ?, content = ? WHERE id = 1")
    .run(JSON.stringify(features), JSON.stringify(xpSettings), JSON.stringify(content));
  res.json({ success: true });
});

app.get("/api/admin/users", authenticateToken, (req: any, res) => {
  if (req.user.email !== (process.env.ADMIN_EMAIL || 'saifahmed123az@gmail.com')) return res.sendStatus(403);
  const users = db.prepare("SELECT id, email, level, xp, is_banned FROM users").all();
  res.json(users);
});

app.post("/api/admin/users/:id", authenticateToken, (req: any, res) => {
  if (req.user.email !== (process.env.ADMIN_EMAIL || 'saifahmed123az@gmail.com')) return res.sendStatus(403);
  const { level, xp, is_banned } = req.body;
  db.prepare("UPDATE users SET level = ?, xp = ?, is_banned = ? WHERE id = ?")
    .run(level, xp, is_banned ? 1 : 0, req.params.id);
  res.json({ success: true });
});

// --- TASK ROUTES ---
app.get("/api/tasks", authenticateToken, (req: any, res) => {
  const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ?").all(req.user.id);
  res.json(tasks);
});

app.post("/api/tasks", authenticateToken, (req: any, res) => {
  const { title, type } = req.body;
  const result = db.prepare("INSERT INTO tasks (user_id, title, type, created_at) VALUES (?, ?, ?, ?)")
    .run(req.user.id, title, type, new Date().toISOString());
  res.json({ id: result.lastInsertRowid });
});

app.post("/api/tasks/:id/complete", authenticateToken, (req: any, res) => {
  const { validationData } = req.body;
  const task: any = db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!task) return res.sendStatus(404);
  if (task.status === 'completed') return res.status(400).json({ error: "Already completed" });

  // REAL VALIDATION: Check time spent or input
  if (!validationData || validationData.timeSpent < 60) {
    return res.status(400).json({ error: "Insufficient effort detected (min 60s)" });
  }

  const config: any = db.prepare("SELECT * FROM admin_config WHERE id = 1").get();
  const xpSettings = JSON.parse(config.xp_settings);
  const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);

  // Anti-Farm Logic
  const today = new Date().toISOString().split('T')[0];
  let dailyXp = user.daily_xp;
  if (user.last_xp_update !== today) {
    dailyXp = 0;
  }

  if (dailyXp >= xpSettings.dailyCap) {
    return res.status(400).json({ error: "Daily XP cap reached" });
  }

  const xpGain = xpSettings.taskXP;
  const newXp = user.xp + xpGain;
  const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;

  db.prepare("UPDATE users SET xp = ?, level = ?, daily_xp = ?, last_xp_update = ? WHERE id = ?")
    .run(newXp, newLevel, dailyXp + xpGain, today, req.user.id);
  db.prepare("UPDATE tasks SET status = 'completed', validation_data = ? WHERE id = ?")
    .run(JSON.stringify(validationData), req.params.id);

  res.json({ success: true, xpGain, newLevel, newXp });
});

// --- GOAL ROUTES ---
app.get("/api/goals", authenticateToken, (req: any, res) => {
  const goals = db.prepare("SELECT * FROM goals WHERE user_id = ?").all(req.user.id);
  res.json(goals);
});

app.post("/api/goals", authenticateToken, (req: any, res) => {
  const { title, target_value } = req.body;
  const result = db.prepare("INSERT INTO goals (user_id, title, target_value, created_at) VALUES (?, ?, ?, ?)")
    .run(req.user.id, title, target_value, new Date().toISOString());
  res.json({ id: result.lastInsertRowid });
});

// --- OFFLINE AI (Simulated in Backend for Demo) ---
app.get("/api/ai/suggestions", authenticateToken, (req: any, res) => {
  const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ?").all(req.user.id);
  const completedCount = tasks.filter((t: any) => t.status === 'completed').length;
  
  // Rule-based AI logic
  let suggestions = [];
  if (completedCount === 0) {
    suggestions.push("Start with a small 5-minute task to build momentum.");
  } else if (completedCount > 5) {
    suggestions.push("You're on a roll! Consider a deep work session for a major goal.");
  }
  
  const types = tasks.map((t: any) => t.type);
  if (!types.includes('health')) suggestions.push("Add a physical activity task to boost energy.");
  if (!types.includes('learning')) suggestions.push("Schedule 15 minutes for reading or learning a new skill.");

  res.json({ suggestions });
});

// --- VITE MIDDLEWARE ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
