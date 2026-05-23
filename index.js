import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ensureDb, readDb, writeDb, removeOldSessions } from "./db.js";

ensureDb();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "user",
    createdAt: user.createdAt
  };
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getLevelLabel(score) {
  if (score < 50) return "Bajo";
  if (score < 80) return "Medio";
  return "Alto";
}

function getQuestionId(req) {
  return String(req.params.id || "").trim();
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "No se envio token de acceso." });
  }

  let db = readDb();
  db = removeOldSessions(db);
  writeDb(db);

  const session = db.sessions.find((item) => item.token === token);
  if (!session) {
    return res.status(401).json({ message: "Sesion invalida o vencida." });
  }

  const user = db.users.find((item) => item.id === session.userId);
  if (!user) {
    return res.status(401).json({ message: "Usuario no encontrado." });
  }

  req.user = user;
  req.token = token;
  next();
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Acceso reservado para administradores." });
  }

  next();
}

function validateQuestionPayload(body) {
  const domain = String(body.domain || "").trim();
  const text = String(body.text || "").trim();
  const reference = String(body.reference || "").trim();
  const control = String(body.control || "").trim();
  const active = typeof body.active === "boolean" ? body.active : true;

  if (!domain || !text || !reference || !control) {
    return { error: "Dominio, pregunta, referencia y control son obligatorios." };
  }

  return { question: { domain, text, reference, control, active } };
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Backend funcionando correctamente.",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/domains", (req, res) => {
  const db = readDb();
  res.json({ domains: db.domains });
});

app.get("/api/questions", (req, res) => {
  const db = readDb();
  const all = String(req.query.all || "").toLowerCase() === "true";
  const questions = all ? db.questions : db.questions.filter((question) => question.active);
  res.json({ questions });
});

app.post("/api/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "El correo no tiene un formato valido." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "La contrasena debe tener minimo 6 caracteres." });
    }

    const db = readDb();
    const exists = db.users.some((user) => user.email === email);

    if (exists) {
      return res.status(409).json({ message: "Este correo ya esta registrado." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const role = db.users.length === 0 ? "admin" : "user";

    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      role,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    const token = crypto.randomUUID();

    db.users.push(user);
    db.sessions.push({
      token,
      userId: user.id,
      createdAt: new Date().toISOString()
    });

    writeDb(db);

    res.status(201).json({
      message: "Registro exitoso.",
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno al registrar usuario." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Correo y contrasena son obligatorios." });
    }

    const db = readDb();
    const user = db.users.find((item) => item.email === email);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Correo o contrasena incorrectos." });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ message: "Correo o contrasena incorrectos." });
    }

    const token = crypto.randomUUID();

    db.sessions.push({
      token,
      userId: user.id,
      createdAt: new Date().toISOString()
    });

    writeDb(db);

    res.json({
      message: "Inicio de sesion exitoso.",
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno al iniciar sesion." });
  }
});

app.get("/api/me", authMiddleware, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

app.post("/api/logout", authMiddleware, (req, res) => {
  const db = readDb();
  db.sessions = db.sessions.filter((session) => session.token !== req.token);
  writeDb(db);
  res.json({ message: "Sesion cerrada correctamente." });
});

app.post("/api/assessments", authMiddleware, (req, res) => {
  try {
    const { answers, results, questionsUsed } = req.body;

    if (!answers || !results || !Array.isArray(questionsUsed)) {
      return res.status(400).json({ message: "Faltan respuestas, resultados o preguntas usadas." });
    }

    const db = readDb();
    const assessment = {
      id: crypto.randomUUID(),
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      date: new Date().toISOString(),
      answers,
      results,
      questionsUsed
    };

    db.assessments.push(assessment);
    writeDb(db);

    res.status(201).json({
      message: "Assessment guardado correctamente.",
      assessment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno al guardar el assessment." });
  }
});

app.get("/api/assessments/history", authMiddleware, (req, res) => {
  const db = readDb();
  const history = db.assessments
    .filter((assessment) => assessment.userId === req.user.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((assessment) => ({
      id: assessment.id,
      date: assessment.date,
      totalScore: assessment.results?.totalScore ?? 0,
      totalLevel: assessment.results?.totalLevel?.label || assessment.results?.totalLevel || "Sin nivel"
    }));

  res.json({ history });
});

app.get("/api/admin/assessments", authMiddleware, adminMiddleware, (req, res) => {
  const db = readDb();
  const assessments = db.assessments
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((assessment) => {
      const score = assessment.results?.totalScore ?? 0;
      const level = assessment.results?.totalLevel?.label || assessment.results?.totalLevel || getLevelLabel(score);

      return {
        id: assessment.id,
        nombre: assessment.userName,
        correo: assessment.userEmail,
        fecha: assessment.date,
        puntaje: score,
        nivel: level
      };
    });

  res.json({ assessments });
});

app.post("/api/admin/questions", authMiddleware, adminMiddleware, (req, res) => {
  const validation = validateQuestionPayload(req.body);
  if (validation.error) {
    return res.status(400).json({ message: validation.error });
  }

  const db = readDb();
  const domainExists = db.domains.some((domain) => domain.id === validation.question.domain);
  if (!domainExists) {
    return res.status(400).json({ message: "El dominio seleccionado no existe." });
  }

  const question = {
    id: `q${Date.now()}`,
    ...validation.question
  };

  db.questions.push(question);
  writeDb(db);

  res.status(201).json({ message: "Pregunta creada correctamente.", question });
});

app.put("/api/admin/questions/:id", authMiddleware, adminMiddleware, (req, res) => {
  const questionId = getQuestionId(req);
  const validation = validateQuestionPayload(req.body);
  if (validation.error) {
    return res.status(400).json({ message: validation.error });
  }

  const db = readDb();
  const questionIndex = db.questions.findIndex((question) => question.id === questionId);
  if (questionIndex === -1) {
    return res.status(404).json({ message: "Pregunta no encontrada." });
  }

  const domainExists = db.domains.some((domain) => domain.id === validation.question.domain);
  if (!domainExists) {
    return res.status(400).json({ message: "El dominio seleccionado no existe." });
  }

  const question = {
    ...db.questions[questionIndex],
    ...validation.question,
    id: questionId
  };

  db.questions[questionIndex] = question;
  writeDb(db);

  res.json({ message: "Pregunta actualizada correctamente.", question });
});

app.delete("/api/admin/questions/:id", authMiddleware, adminMiddleware, (req, res) => {
  const questionId = getQuestionId(req);
  const db = readDb();
  const initialLength = db.questions.length;
  db.questions = db.questions.filter((question) => question.id !== questionId);

  if (db.questions.length === initialLength) {
    return res.status(404).json({ message: "Pregunta no encontrada." });
  }

  writeDb(db);
  res.json({ message: "Pregunta eliminada correctamente." });
});

app.listen(PORT, () => {
  console.log(`Servidor backend activo en http://localhost:${PORT}`);
});
