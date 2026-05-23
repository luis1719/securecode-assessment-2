# SecureCode Assessment

SecureCode Assessment es una aplicacion web academica para apoyar un trabajo de grado. Permite que desarrolladores novatos realicen una autoevaluacion sobre buenas practicas de seguridad y calidad de codigo, con trazabilidad hacia controles seleccionados de NIST SSDF, ISO/IEC 27001 y OWASP.

## Tecnologias usadas

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Autenticacion: tokens de sesion generados en backend
- Seguridad de contrasenas: bcryptjs
- Persistencia del prototipo: archivo JSON en `server/data/db.json`

## Instalacion

Desde la raiz del proyecto:

```bash
npm install
```

El script `postinstall` instala tambien las dependencias de `client` y `server`.

## Ejecucion

Desde la raiz del proyecto:

```bash
npm run dev
```

Servicios esperados:

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health check: http://localhost:3001/api/health

## Primer usuario administrador

El primer usuario registrado queda automaticamente con `role: "admin"`. Los usuarios registrados despues quedan con `role: "user"`. El usuario administrador puede acceder al boton `Admin` en el header para gestionar preguntas y exportar resultados.

Si ya existe un `db.json` anterior, el backend migra la estructura al iniciar, conserva usuarios y assessments existentes, agrega `domains`, `questions` y asigna rol `admin` al primer usuario si faltaba el campo `role`.

## Endpoints principales

- `GET /api/health`: verifica que el backend este funcionando.
- `GET /api/domains`: devuelve los dominios del assessment.
- `GET /api/questions`: devuelve preguntas activas.
- `GET /api/questions?all=true`: devuelve todas las preguntas para administracion.
- `POST /api/register`: registra usuario y crea sesion.
- `POST /api/login`: inicia sesion y devuelve token + usuario.
- `GET /api/me`: devuelve el usuario autenticado.
- `POST /api/logout`: cierra la sesion activa.
- `POST /api/assessments`: guarda respuestas, resultados y preguntas usadas.
- `GET /api/assessments/history`: devuelve historial del usuario autenticado.
- `GET /api/admin/assessments`: devuelve resultados de todos los usuarios. Requiere admin.
- `POST /api/admin/questions`: crea pregunta. Requiere admin.
- `PUT /api/admin/questions/:id`: actualiza pregunta. Requiere admin.
- `DELETE /api/admin/questions/:id`: elimina pregunta. Requiere admin.

Para endpoints protegidos se debe enviar:

```http
Authorization: Bearer <token>
```

## Reporte y evidencia

El reporte final incluye usuario, fecha de generacion, puntaje general, nivel general, puntaje por dominio, nivel por dominio, recomendacion por dominio, conclusion general y matriz de trazabilidad con dominio, pregunta, referencia, control y respuesta seleccionada.

El boton `Imprimir / Guardar como PDF` usa `window.print()` y estilos de impresion definidos en CSS para ocultar header y botones.

## Nota academica

Este proyecto es un prototipo academico. Para un entorno de produccion se recomienda reemplazar el archivo JSON por una base de datos real como PostgreSQL, MySQL, SQLite o MongoDB, ademas de aplicar controles adicionales de seguridad, auditoria, gestion de errores y despliegue.
