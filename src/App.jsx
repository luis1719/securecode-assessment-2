import React, { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:3001/api";

const OPTIONS = [
  { value: 0, label: "Nunca" },
  { value: 1, label: "Rara vez" },
  { value: 2, label: "A veces" },
  { value: 3, label: "Casi siempre" },
  { value: 4, label: "Siempre" }
];

const emptyQuestion = {
  domain: "",
  text: "",
  reference: "NIST SSDF / ISO 27001 / OWASP",
  control: "",
  active: true
};

function getLevel(score) {
  if (score < 50) return { label: "Bajo", badge: "border-red-200 bg-red-50 text-red-700" };
  if (score < 80) return { label: "Medio", badge: "border-amber-200 bg-amber-50 text-amber-700" };
  return { label: "Alto", badge: "border-emerald-200 bg-emerald-50 text-emerald-700" };
}

function getRecommendation(domain, score) {
  if (score < 50) return domain.low;
  if (score < 80) return domain.medium;
  return domain.high;
}

function formatDate(date) {
  return new Date(date).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("securecode_token");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Ocurrio un error en la solicitud.");
  }

  return data;
}

export default function App() {
  const [view, setView] = useState("welcome");
  const [session, setSession] = useState(null);
  const [domains, setDomains] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [adminQuestions, setAdminQuestions] = useState([]);
  const [adminAssessments, setAdminAssessments] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [login, setLogin] = useState({ email: "", password: "" });
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportDate, setReportDate] = useState(null);

  useEffect(() => {
    loadCatalog();

    const savedUser = localStorage.getItem("securecode_user");
    const token = localStorage.getItem("securecode_token");

    if (savedUser && token) {
      const user = JSON.parse(savedUser);
      setSession(user);
      setView("dashboard");
      refreshMe();
      loadHistory();
    }
  }, []);

  const questionsByDomain = useMemo(() => {
    return domains.map((domain) => ({
      ...domain,
      questions: questions.filter((question) => question.domain === domain.id)
    }));
  }, [domains, questions]);

  const progress = useMemo(() => {
    return questions.length ? Math.round((Object.keys(answers).length / questions.length) * 100) : 0;
  }, [answers, questions.length]);

  const results = useMemo(() => {
    const byDomain = domains.map((domain) => {
      const domainQuestions = questions.filter((question) => question.domain === domain.id);
      const points = domainQuestions.reduce((sum, question) => sum + Number(answers[question.id] ?? 0), 0);
      const max = domainQuestions.length * 4;
      const score = max > 0 ? Math.round((points / max) * 100) : 0;

      return {
        id: domain.id,
        title: domain.title,
        description: domain.description,
        score,
        level: getLevel(score),
        recommendation: getRecommendation(domain, score)
      };
    });

    const domainsWithQuestions = byDomain.filter((domain) =>
      questions.some((question) => question.domain === domain.id)
    );
    const totalScore = domainsWithQuestions.length
      ? Math.round(domainsWithQuestions.reduce((sum, item) => sum + item.score, 0) / domainsWithQuestions.length)
      : 0;

    return {
      totalScore,
      totalLevel: getLevel(totalScore),
      byDomain
    };
  }, [answers, domains, questions]);

  async function loadCatalog() {
    try {
      const [domainsData, questionsData] = await Promise.all([
        apiRequest("/domains"),
        apiRequest("/questions")
      ]);
      setDomains(domainsData.domains || []);
      setQuestions(questionsData.questions || []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function refreshMe() {
    try {
      const data = await apiRequest("/me");
      localStorage.setItem("securecode_user", JSON.stringify(data.user));
      setSession(data.user);
    } catch {
      localStorage.removeItem("securecode_token");
      localStorage.removeItem("securecode_user");
      setSession(null);
      setView("welcome");
    }
  }

  async function loadHistory() {
    try {
      const data = await apiRequest("/assessments/history");
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    }
  }

  async function loadAdminData() {
    try {
      const [questionsData, assessmentsData] = await Promise.all([
        apiRequest("/questions?all=true"),
        apiRequest("/admin/assessments")
      ]);
      setAdminQuestions(questionsData.questions || []);
      setAdminAssessments(assessmentsData.assessments || []);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const data = await apiRequest("/register", {
        method: "POST",
        body: JSON.stringify(form)
      });

      localStorage.setItem("securecode_token", data.token);
      localStorage.setItem("securecode_user", JSON.stringify(data.user));
      setSession(data.user);
      setForm({ name: "", email: "", password: "" });
      setView("dashboard");
      await loadHistory();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const data = await apiRequest("/login", {
        method: "POST",
        body: JSON.stringify(login)
      });

      localStorage.setItem("securecode_token", data.token);
      localStorage.setItem("securecode_user", JSON.stringify(data.user));
      setSession(data.user);
      setLogin({ email: "", password: "" });
      setView("dashboard");
      await loadHistory();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await apiRequest("/logout", { method: "POST" });
    } catch {
      // La sesion local se limpia aunque el backend no responda.
    }

    localStorage.removeItem("securecode_token");
    localStorage.removeItem("securecode_user");
    setSession(null);
    setAnswers({});
    setHistory([]);
    setView("welcome");
  }

  async function finishAssessment() {
    if (Object.keys(answers).length < questions.length) {
      setMessage("Responde todas las preguntas antes de generar el reporte.");
      return;
    }

    setMessage("");
    setLoading(true);
    const generatedAt = new Date().toISOString();

    try {
      await apiRequest("/assessments", {
        method: "POST",
        body: JSON.stringify({
          answers,
          results,
          questionsUsed: questions.map((question) => ({ ...question }))
        })
      });

      setReportDate(generatedAt);
      await loadHistory();
      setView("report");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function resetAssessment() {
    setAnswers({});
    setMessage("");
    setView("assessment");
  }

  function openAdmin() {
    setMessage("");
    setView("admin");
    loadAdminData();
  }

  function editQuestion(question) {
    setEditingQuestionId(question.id);
    setQuestionForm({
      domain: question.domain,
      text: question.text,
      reference: question.reference,
      control: question.control,
      active: question.active
    });
  }

  function resetQuestionForm() {
    setEditingQuestionId(null);
    setQuestionForm({ ...emptyQuestion, domain: domains[0]?.id || "" });
  }

  async function saveQuestion(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const path = editingQuestionId ? `/admin/questions/${editingQuestionId}` : "/admin/questions";
      const method = editingQuestionId ? "PUT" : "POST";

      await apiRequest(path, {
        method,
        body: JSON.stringify(questionForm)
      });

      resetQuestionForm();
      await loadCatalog();
      await loadAdminData();
      setMessage(editingQuestionId ? "Pregunta actualizada." : "Pregunta creada.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteQuestion(questionId) {
    setMessage("");
    setLoading(true);

    try {
      await apiRequest(`/admin/questions/${questionId}`, { method: "DELETE" });
      await loadCatalog();
      await loadAdminData();
      setMessage("Pregunta eliminada.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleQuestion(question) {
    setMessage("");

    try {
      await apiRequest(`/admin/questions/${question.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...question, active: !question.active })
      });
      await loadCatalog();
      await loadAdminData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function exportCsv() {
    const header = ["Nombre", "Correo", "Fecha", "Puntaje", "Nivel"];
    const rows = adminAssessments.map((item) => [
      item.nombre,
      item.correo,
      formatDate(item.fecha),
      `${item.puntaje}%`,
      item.nivel
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell || "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "securecode-resultados.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="no-print border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <button className="text-left" onClick={() => setView(session ? "dashboard" : "welcome")}>
            <h1 className="text-xl font-bold tracking-tight text-slate-950">SecureCode Assessment</h1>
            <p className="text-sm text-slate-500">Prototipo academico basado en NIST, ISO/IEC 27001 y OWASP</p>
          </button>

          {session && (
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setView("dashboard")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100">
                Panel
              </button>
              {session.role === "admin" && (
                <button onClick={openAdmin} className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                  Admin
                </button>
              )}
              <div className="hidden min-w-44 text-right sm:block">
                <p className="text-sm font-semibold">{session.name}</p>
                <p className="text-xs text-slate-500">{session.email} - {session.role}</p>
              </div>
              <button onClick={handleLogout} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100">
                Salir
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8">
        {view === "welcome" && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-lg bg-slate-950 p-8 text-white shadow-lg">
              <p className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm">Version academica fullstack</p>
              <h2 className="mb-4 text-3xl font-bold leading-tight md:text-5xl">
                Assessment de seguridad y calidad de codigo para desarrolladores novatos
              </h2>
              <p className="max-w-3xl text-base leading-7 text-slate-200">
                Prototipo para trabajo de grado que evalua buenas practicas seleccionadas de NIST SSDF,
                ISO/IEC 27001 y OWASP. Los resultados generan recomendaciones, trazabilidad y evidencia imprimible.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <InfoCard title="NIST" text="Secure Software Development Framework" />
                <InfoCard title="ISO/IEC 27001" text="Controles de seguridad de la informacion" />
                <InfoCard title="OWASP" text="Riesgos y controles para aplicaciones web" />
              </div>
            </div>

            <AuthCard
              mode="register"
              form={form}
              setForm={setForm}
              login={login}
              setLogin={setLogin}
              loading={loading}
              message={message}
              onRegister={handleRegister}
              onLogin={handleLogin}
              onMode={() => {
                setMessage("");
                setView("login");
              }}
            />
          </div>
        )}

        {view === "login" && (
          <div className="mx-auto max-w-md">
            <AuthCard
              mode="login"
              form={form}
              setForm={setForm}
              login={login}
              setLogin={setLogin}
              loading={loading}
              message={message}
              onRegister={handleRegister}
              onLogin={handleLogin}
              onMode={() => {
                setMessage("");
                setView("welcome");
              }}
            />
          </div>
        )}

        {view === "dashboard" && session && (
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-6">
              <PanelCard>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Panel del usuario</p>
                <h2 className="mb-3 text-3xl font-bold">Hola, {session.name.split(" ")[0]}</h2>
                <p className="mb-6 leading-7 text-slate-600">
                  Responde el assessment para obtener un reporte con puntaje general, niveles por dominio,
                  recomendaciones y matriz de trazabilidad.
                </p>
                <button onClick={() => setView("assessment")} className="w-full rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white shadow-sm hover:bg-slate-700">
                  Iniciar assessment
                </button>
              </PanelCard>

              <PanelCard>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold">Historial de assessments</h3>
                  <button onClick={loadHistory} className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                    Actualizar
                  </button>
                </div>
                {history.length === 0 ? (
                  <p className="text-sm leading-6 text-slate-500">Todavia no tienes assessments guardados.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">Puntaje: {item.totalScore}%</p>
                            <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
                          </div>
                          <Badge label={item.totalLevel} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </PanelCard>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {domains.map((domain) => (
                <PanelCard key={domain.id}>
                  <h3 className="mb-2 text-lg font-bold">{domain.title}</h3>
                  <p className="text-sm leading-6 text-slate-600">{domain.description}</p>
                </PanelCard>
              ))}
            </div>
          </div>
        )}

        {view === "assessment" && session && (
          <div className="space-y-6">
            <PanelCard>
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Assessment</p>
                  <h2 className="text-2xl font-bold">Buenas practicas de seguridad y calidad</h2>
                </div>
                <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold">Avance: {progress}%</div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </PanelCard>

            {questionsByDomain.map((domain) => (
              <PanelCard key={domain.id}>
                <div className="mb-5">
                  <h3 className="text-xl font-bold">{domain.title}</h3>
                  <p className="text-sm text-slate-500">{domain.description}</p>
                </div>
                <div className="space-y-5">
                  {domain.questions.map((question) => (
                    <div key={question.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-2 font-medium leading-6">{question.text}</p>
                      <p className="text-sm text-slate-600"><strong>Referencia:</strong> {question.reference}</p>
                      <p className="mb-4 text-sm text-slate-600"><strong>Control:</strong> {question.control}</p>
                      <div className="grid gap-2 sm:grid-cols-5">
                        {OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium transition ${
                              Number(answers[question.id]) === option.value
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white hover:border-slate-400"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option.value}
                              checked={Number(answers[question.id]) === option.value}
                              onChange={() => setAnswers({ ...answers, [question.id]: option.value })}
                              className="sr-only"
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </PanelCard>
            ))}

            {message && <Alert text={message} />}

            <div className="no-print flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setView("dashboard")} className="rounded-lg border border-slate-200 bg-white px-5 py-3 font-semibold shadow-sm hover:bg-slate-100">
                Volver
              </button>
              <button onClick={finishAssessment} disabled={loading || questions.length === 0} className="flex-1 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white shadow-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Guardando..." : "Generar reporte"}
              </button>
            </div>
          </div>
        )}

        {view === "report" && session && (
          <Report
            session={session}
            domains={domains}
            questions={questions}
            answers={answers}
            results={results}
            reportDate={reportDate}
            onReset={resetAssessment}
            onDashboard={() => setView("dashboard")}
          />
        )}

        {view === "admin" && session?.role === "admin" && (
          <AdminPanel
            domains={domains}
            questions={adminQuestions}
            assessments={adminAssessments}
            form={questionForm}
            setForm={setQuestionForm}
            editingQuestionId={editingQuestionId}
            onSave={saveQuestion}
            onEdit={editQuestion}
            onCancel={resetQuestionForm}
            onDelete={deleteQuestion}
            onToggle={toggleQuestion}
            onExport={exportCsv}
            loading={loading}
            message={message}
          />
        )}
      </section>
    </main>
  );
}

function Report({ session, domains, questions, answers, results, reportDate, onReset, onDashboard }) {
  const generatedAt = reportDate || new Date().toISOString();
  const answerLabel = (questionId) => OPTIONS.find((option) => option.value === Number(answers[questionId]))?.label || "Sin respuesta";

  return (
    <div className="report space-y-6">
      <PanelCard>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Reporte de resultados</p>
            <h2 className="text-3xl font-bold">SecureCode Assessment</h2>
            <p className="mt-2 text-slate-600">Usuario evaluado: {session.name}</p>
            <p className="text-slate-600">Correo: {session.email}</p>
            <p className="text-slate-600">Fecha de generacion: {formatDate(generatedAt)}</p>
          </div>
          <div className="rounded-lg bg-slate-900 p-6 text-center text-white shadow-sm">
            <p className="text-sm text-slate-300">Puntaje general</p>
            <p className="text-5xl font-bold">{results.totalScore}%</p>
            <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-bold ${results.totalLevel.badge}`}>
              Nivel {results.totalLevel.label}
            </span>
          </div>
        </div>
      </PanelCard>

      <div className="grid gap-4 md:grid-cols-2">
        {results.byDomain.map((domain) => (
          <PanelCard key={domain.id}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">{domain.title}</h3>
                <p className="text-sm text-slate-500">{domain.description}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-sm font-bold ${domain.level.badge}`}>{domain.level.label}</span>
            </div>
            <div className="mb-4">
              <div className="mb-2 flex justify-between text-sm font-medium">
                <span>Puntaje</span>
                <span>{domain.score}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-900" style={{ width: `${domain.score}%` }} />
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              <strong>Recomendacion: </strong>
              {domain.recommendation}
            </div>
          </PanelCard>
        ))}
      </div>

      <PanelCard>
        <h3 className="mb-3 text-xl font-bold">Conclusion general</h3>
        <p className="leading-7 text-slate-700">
          El resultado evidencia el nivel actual de aplicacion de buenas practicas de desarrollo seguro y calidad de codigo.
          Un nivel bajo requiere acciones prioritarias; un nivel medio indica controles parciales que deben fortalecerse; y
          un nivel alto muestra una base adecuada que debe sostenerse con revision continua.
        </p>
      </PanelCard>

      <PanelCard>
        <h3 className="mb-4 text-xl font-bold">Matriz de trazabilidad</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-100">
                <Th>Dominio</Th>
                <Th>Pregunta</Th>
                <Th>Referencia</Th>
                <Th>Control</Th>
                <Th>Respuesta seleccionada</Th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id} className="border-b border-slate-100 align-top">
                  <Td>{domains.find((domain) => domain.id === question.domain)?.title || question.domain}</Td>
                  <Td>{question.text}</Td>
                  <Td>{question.reference}</Td>
                  <Td>{question.control}</Td>
                  <Td>{answerLabel(question.id)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>

      <div className="no-print flex flex-col gap-3 sm:flex-row">
        <button onClick={() => window.print()} className="flex-1 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white shadow-sm hover:bg-slate-700">
          Imprimir / Guardar como PDF
        </button>
        <button onClick={onReset} className="rounded-lg border border-slate-200 bg-white px-5 py-3 font-semibold shadow-sm hover:bg-slate-100">
          Realizar nuevamente
        </button>
        <button onClick={onDashboard} className="rounded-lg border border-slate-200 bg-white px-5 py-3 font-semibold shadow-sm hover:bg-slate-100">
          Volver al panel
        </button>
      </div>
    </div>
  );
}

function AdminPanel({ domains, questions, assessments, form, setForm, editingQuestionId, onSave, onEdit, onCancel, onDelete, onToggle, onExport, loading, message }) {
  return (
    <div className="space-y-6">
      <PanelCard>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Panel administrador</p>
        <h2 className="text-3xl font-bold">Gestion academica del assessment</h2>
        <p className="mt-2 text-slate-600">Administra preguntas, controla su estado y exporta resultados guardados.</p>
      </PanelCard>

      {message && <Alert text={message} />}

      <PanelCard>
        <h3 className="mb-4 text-xl font-bold">{editingQuestionId ? "Editar pregunta" : "Crear pregunta"}</h3>
        <form onSubmit={onSave} className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Dominio</span>
            <select value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} className="input">
              <option value="">Selecciona un dominio</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>{domain.title}</option>
              ))}
            </select>
          </label>
          <Input label="Control evaluado" value={form.control} onChange={(value) => setForm({ ...form, control: value })} placeholder="Ejemplo: Proteccion de credenciales" />
          <Input label="Referencia" value={form.reference} onChange={(value) => setForm({ ...form, reference: value })} placeholder="NIST SSDF / ISO 27001 / OWASP" />
          <label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <span className="text-sm font-semibold">Pregunta activa</span>
          </label>
          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Texto de la pregunta</span>
            <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="input min-h-28" placeholder="Escribe la pregunta del assessment" />
          </label>
          <div className="flex gap-3 lg:col-span-2">
            <button disabled={loading} className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white shadow-sm hover:bg-slate-700 disabled:opacity-60">
              {editingQuestionId ? "Actualizar pregunta" : "Crear pregunta"}
            </button>
            {editingQuestionId && (
              <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 bg-white px-5 py-3 font-semibold hover:bg-slate-100">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </PanelCard>

      <PanelCard>
        <h3 className="mb-4 text-xl font-bold">Preguntas del assessment</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-100">
                <Th>Estado</Th>
                <Th>Dominio</Th>
                <Th>Pregunta</Th>
                <Th>Referencia</Th>
                <Th>Control</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.id} className="border-b border-slate-100 align-top">
                  <Td>{question.active ? "Activa" : "Inactiva"}</Td>
                  <Td>{domains.find((domain) => domain.id === question.domain)?.title || question.domain}</Td>
                  <Td>{question.text}</Td>
                  <Td>{question.reference}</Td>
                  <Td>{question.control}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => onEdit(question)} className="rounded-md border border-slate-200 px-3 py-1 font-semibold hover:bg-slate-100">Editar</button>
                      <button onClick={() => onToggle(question)} className="rounded-md border border-slate-200 px-3 py-1 font-semibold hover:bg-slate-100">
                        {question.active ? "Desactivar" : "Activar"}
                      </button>
                      <button onClick={() => onDelete(question.id)} className="rounded-md border border-red-200 px-3 py-1 font-semibold text-red-700 hover:bg-red-50">Eliminar</button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelCard>

      <PanelCard>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h3 className="text-xl font-bold">Resultados guardados</h3>
          <button onClick={onExport} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Exportar CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-100">
                <Th>Nombre</Th>
                <Th>Correo</Th>
                <Th>Fecha</Th>
                <Th>Puntaje</Th>
                <Th>Nivel</Th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <Td>{item.nombre}</Td>
                  <Td>{item.correo}</Td>
                  <Td>{formatDate(item.fecha)}</Td>
                  <Td>{item.puntaje}%</Td>
                  <Td>{item.nivel}</Td>
                </tr>
              ))}
              {assessments.length === 0 && (
                <tr>
                  <Td colSpan={5}>No hay resultados guardados.</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </PanelCard>
    </div>
  );
}

function AuthCard({ mode, form, setForm, login, setLogin, loading, message, onRegister, onLogin, onMode }) {
  const isLogin = mode === "login";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <button onClick={onMode} className="mb-5 text-sm font-semibold text-slate-500 hover:text-slate-900">
        {isLogin ? "Volver al registro" : "Ya tengo cuenta"}
      </button>
      <h3 className="mb-1 text-2xl font-bold">{isLogin ? "Iniciar sesion" : "Crear cuenta"}</h3>
      <p className="mb-5 text-sm text-slate-500">
        {isLogin ? "Ingresa con una cuenta creada." : "El primer usuario registrado queda con rol administrador."}
      </p>
      <form onSubmit={isLogin ? onLogin : onRegister} className="space-y-4">
        {!isLogin && (
          <Input label="Nombre completo" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="Ejemplo: Juan Perez" />
        )}
        <Input
          label="Correo"
          type="email"
          value={isLogin ? login.email : form.email}
          onChange={(value) => isLogin ? setLogin({ ...login, email: value }) : setForm({ ...form, email: value })}
          placeholder="correo@ejemplo.com"
        />
        <Input
          label="Contrasena"
          type="password"
          value={isLogin ? login.password : form.password}
          onChange={(value) => isLogin ? setLogin({ ...login, password: value }) : setForm({ ...form, password: value })}
          placeholder={isLogin ? "Tu contrasena" : "Minimo 6 caracteres"}
        />
        {message && <Alert text={message} />}
        <button disabled={loading} className="w-full rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white shadow-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Procesando..." : isLogin ? "Entrar" : "Registrarme y comenzar"}
        </button>
      </form>
    </div>
  );
}

function InfoCard({ title, text }) {
  return (
    <div className="rounded-lg bg-white/10 p-4">
      <p className="text-lg font-bold">{title}</p>
      <p className="text-sm text-slate-300">{text}</p>
    </div>
  );
}

function PanelCard({ children }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">{children}</div>;
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input" />
    </label>
  );
}

function Alert({ text }) {
  return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{text}</div>;
}

function Badge({ label }) {
  const score = label === "Alto" ? 90 : label === "Medio" ? 60 : 30;
  return <span className={`rounded-full border px-3 py-1 text-sm font-bold ${getLevel(score).badge}`}>{label}</span>;
}

function Th({ children }) {
  return <th className="px-3 py-3 font-bold text-slate-700">{children}</th>;
}

function Td({ children, colSpan }) {
  return <td colSpan={colSpan} className="px-3 py-3 text-slate-700">{children}</td>;
}
