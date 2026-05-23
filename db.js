import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "db.json");

export const seedDomains = [
  {
    id: "auth",
    title: "Autenticacion y credenciales",
    description: "Evalua el manejo de contrasenas, sesiones, tokens y secretos dentro del ciclo de desarrollo.",
    low: "Prioriza eliminar secretos del codigo, aplicar hash seguro de contrasenas y proteger tokens o sesiones con controles basicos.",
    medium: "Fortalece la gestion de credenciales con politicas mas consistentes, rotacion de secretos y revision de sesiones.",
    high: "Mantiene buenas practicas de autenticacion. Continua revisando secretos, tokens y politicas de acceso de forma periodica."
  },
  {
    id: "input",
    title: "Validacion de entradas",
    description: "Revisa si los datos enviados por usuarios, formularios o APIs se validan antes de procesarse.",
    low: "Implementa validacion de entradas en servidor y controles contra inyeccion antes de procesar datos no confiables.",
    medium: "Mejora la consistencia entre validaciones de frontend y backend, sanitizacion y manejo de entradas inesperadas.",
    high: "Presenta buenas practicas de validacion. Mantiene controles preventivos contra inyeccion y datos mal formados."
  },
  {
    id: "access",
    title: "Control de acceso",
    description: "Evalua roles, permisos y proteccion de rutas, vistas y endpoints sensibles.",
    low: "Define roles claros y valida permisos en el servidor para evitar accesos no autorizados a funciones o datos.",
    medium: "Refuerza la proteccion de rutas y revisa que cada accion sensible valide permisos del usuario autenticado.",
    high: "Gestiona adecuadamente roles y permisos. Conviene mantener revisiones periodicas de privilegios y accesos."
  },
  {
    id: "errors",
    title: "Manejo de errores y registros",
    description: "Analiza la forma en que se gestionan errores, registros y datos sensibles en logs.",
    low: "Evita exponer detalles tecnicos al usuario y establece registros seguros para eventos relevantes.",
    medium: "Mejora la calidad de logs, la trazabilidad de eventos y la exclusion de contrasenas, tokens o datos sensibles.",
    high: "Maneja errores y registros de forma madura. Mantiene monitoreo y revision segura de eventos importantes."
  },
  {
    id: "quality",
    title: "Calidad de codigo",
    description: "Evalua legibilidad, organizacion, mantenimiento, revision y reutilizacion del codigo.",
    low: "Mejora nombres, organizacion y separacion de responsabilidades para reducir errores y facilitar mantenimiento.",
    medium: "Tiene bases aceptables; conviene reducir duplicacion, revisar codigo y documentar decisiones relevantes.",
    high: "Presenta buenas practicas de calidad. Mantiene revision de codigo y mejora continua del diseno."
  },
  {
    id: "dependencies",
    title: "Componentes y dependencias",
    description: "Evalua el uso responsable de librerias, paquetes externos y componentes reutilizados.",
    low: "Revisa dependencias instaladas, elimina paquetes innecesarios y atiende vulnerabilidades conocidas.",
    medium: "Mejora el control de versiones, licencias, mantenimiento y alertas de seguridad de tus dependencias.",
    high: "Gestiona bien componentes externos. Continua actualizando paquetes y evaluando riesgos de terceros."
  }
];

export const seedQuestions = [
  {
    id: "q1",
    domain: "auth",
    text: "Evito guardar contrasenas, claves API o secretos directamente dentro del codigo fuente.",
    reference: "NIST SSDF / ISO 27001 / OWASP",
    control: "Proteccion de credenciales y secretos",
    active: true
  },
  {
    id: "q2",
    domain: "auth",
    text: "Uso mecanismos seguros para almacenar contrasenas, como hash con sal y algoritmos recomendados.",
    reference: "NIST SSDF / ISO 27001 / OWASP ASVS",
    control: "Almacenamiento seguro de contrasenas",
    active: true
  },
  {
    id: "q3",
    domain: "auth",
    text: "Protejo tokens, cookies de sesion y credenciales para evitar exposicion, robo o reutilizacion indebida.",
    reference: "NIST SSDF / ISO 27001 / OWASP",
    control: "Proteccion de tokens y sesiones",
    active: true
  },
  {
    id: "q4",
    domain: "input",
    text: "Valido los datos que ingresan los usuarios antes de procesarlos o almacenarlos.",
    reference: "NIST SSDF / ISO 27001 / OWASP Top 10",
    control: "Validacion de entradas no confiables",
    active: true
  },
  {
    id: "q5",
    domain: "input",
    text: "No confio unicamente en las validaciones del frontend; tambien valido reglas criticas en el backend.",
    reference: "NIST SSDF / OWASP ASVS",
    control: "Validacion del lado del servidor",
    active: true
  },
  {
    id: "q6",
    domain: "input",
    text: "Aplico controles para prevenir inyeccion SQL, scripts maliciosos y entradas inesperadas.",
    reference: "OWASP Top 10 / NIST SSDF",
    control: "Prevencion de inyeccion",
    active: true
  },
  {
    id: "q7",
    domain: "access",
    text: "Defino roles o permisos para evitar que un usuario acceda a funciones no autorizadas.",
    reference: "ISO 27001 / OWASP ASVS",
    control: "Gestion de roles y permisos",
    active: true
  },
  {
    id: "q8",
    domain: "access",
    text: "Protejo rutas, vistas y endpoints que solo deben ser usados por usuarios autenticados o autorizados.",
    reference: "NIST SSDF / ISO 27001 / OWASP",
    control: "Proteccion de rutas y endpoints",
    active: true
  },
  {
    id: "q9",
    domain: "access",
    text: "Valido los permisos en el servidor y no solo oculto opciones en la interfaz de usuario.",
    reference: "OWASP ASVS / ISO 27001",
    control: "Autorizacion en servidor",
    active: true
  },
  {
    id: "q10",
    domain: "errors",
    text: "Evito mostrar al usuario mensajes de error con informacion tecnica, rutas internas o datos sensibles.",
    reference: "OWASP Top 10 / ISO 27001",
    control: "Manejo seguro de errores",
    active: true
  },
  {
    id: "q11",
    domain: "errors",
    text: "Registro eventos importantes para revisar fallas, accesos sospechosos o comportamientos anormales.",
    reference: "NIST SSDF / ISO 27001",
    control: "Registro de eventos relevantes",
    active: true
  },
  {
    id: "q12",
    domain: "errors",
    text: "Procuro que los logs no almacenen contrasenas, tokens, claves API u otra informacion sensible.",
    reference: "ISO 27001 / OWASP",
    control: "Proteccion de datos sensibles en logs",
    active: true
  },
  {
    id: "q13",
    domain: "quality",
    text: "Uso nombres claros para variables, funciones, clases y archivos dentro de mis proyectos.",
    reference: "NIST SSDF / Buenas practicas de calidad",
    control: "Legibilidad y nombres claros",
    active: true
  },
  {
    id: "q14",
    domain: "quality",
    text: "Evito duplicar codigo y organizo la logica en funciones, modulos o componentes reutilizables.",
    reference: "NIST SSDF / Buenas practicas de calidad",
    control: "Reduccion de duplicacion",
    active: true
  },
  {
    id: "q15",
    domain: "quality",
    text: "Reviso mi codigo antes de entregarlo para encontrar errores, riesgos o partes dificiles de mantener.",
    reference: "NIST SSDF / ISO 27001",
    control: "Revision de codigo",
    active: true
  },
  {
    id: "q16",
    domain: "dependencies",
    text: "Reviso si las librerias y paquetes que uso estan actualizados, mantenidos y provienen de fuentes confiables.",
    reference: "NIST SSDF / OWASP Top 10",
    control: "Gestion de librerias actualizadas",
    active: true
  },
  {
    id: "q17",
    domain: "dependencies",
    text: "Evito instalar dependencias innecesarias o paquetes que no aportan valor claro al proyecto.",
    reference: "NIST SSDF / ISO 27001",
    control: "Uso minimo de dependencias",
    active: true
  },
  {
    id: "q18",
    domain: "dependencies",
    text: "Tengo en cuenta que una libreria vulnerable puede afectar la seguridad de toda la aplicacion.",
    reference: "OWASP Top 10 / NIST SSDF",
    control: "Riesgo de componentes vulnerables",
    active: true
  }
];

const initialData = {
  users: [],
  sessions: [],
  domains: seedDomains,
  questions: seedQuestions,
  assessments: []
};

function mergeById(currentItems, seedItems) {
  const current = Array.isArray(currentItems) ? currentItems : [];
  const currentIds = new Set(current.map((item) => item.id));
  const missing = seedItems.filter((item) => !currentIds.has(item.id));
  return [...current, ...missing];
}

function migrateDb(data) {
  const migrated = {
    users: Array.isArray(data?.users) ? data.users : [],
    sessions: Array.isArray(data?.sessions) ? data.sessions : [],
    domains: mergeById(data?.domains, seedDomains),
    questions: mergeById(data?.questions, seedQuestions),
    assessments: Array.isArray(data?.assessments) ? data.assessments : []
  };

  migrated.users = migrated.users.map((user, index) => ({
    ...user,
    role: user.role || (index === 0 ? "admin" : "user")
  }));

  migrated.questions = migrated.questions.map((question) => ({
    ...question,
    active: typeof question.active === "boolean" ? question.active : true
  }));

  return migrated;
}

export function ensureDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), "utf-8");
    return;
  }

  const db = readDb(false);
  writeDb(migrateDb(db));
}

export function readDb(shouldEnsure = true) {
  if (shouldEnsure) {
    ensureDb();
  }

  try {
    const content = fs.readFileSync(dbPath, "utf-8");
    return migrateDb(JSON.parse(content));
  } catch (error) {
    console.error("Error leyendo la base de datos:", error);
    return { ...initialData };
  }
}

export function writeDb(data) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(dbPath, JSON.stringify(migrateDb(data), null, 2), "utf-8");
}

export function removeOldSessions(db) {
  const now = Date.now();
  const maxAge = 1000 * 60 * 60 * 24;
  db.sessions = db.sessions.filter((session) => now - new Date(session.createdAt).getTime() < maxAge);
  return db;
}
