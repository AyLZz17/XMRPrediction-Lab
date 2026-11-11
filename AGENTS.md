# AGENTS.md — Instrucciones del proyecto XMR-Forecast

> **Léelo completo antes de cualquier tarea.** Este archivo es la fuente de verdad de las reglas del proyecto.
> **Se actualiza al terminar CADA tarea.** Si algo aquí contradice a `MEMORY.md`, gana `AGENTS.md`.

Archivos de gobierno: `AGENTS.md` (reglas permanentes) · `.agents/skills/` (habilidades y recetas) · `MEMORY.md` (memoria corta, máx. 50 líneas).

---

## 1. Contexto del proyecto

- **Nombre de trabajo:** AyLZz Crypto Lab (XMR-Forecast).
- **Qué es:** portal de investigación para explorar precios diarios OHLCV de
  Monero (XMR-USD) y comparar predicciones del próximo cierre.
- **Componentes actuales:** `frontend/` (interfaz),
  `backend/services/ml-service/` (API, datos y modelos) y `docker-compose.yml`
  (integración local).
- **Estado:** integración preliminar; arquitectura objetivo aprobada en §2 y
  migración en fases.
- **Documentación fuente:** `backend/services/ml-service/README.md`,
  `backend/services/ml-service/ESTRUCTURA.md` e informes del estudio dentro
  del servicio.
- La validación Mermaid de CI usa `.github/puppeteer-config.json` para
  configurar Chromium headless en el runner.
- Mantener Trivy en CI en una versión cuya acción `setup-trivy` dependiente
  apunte a una referencia disponible.
- Corregir hallazgos HIGH/CRITICAL del escaneo Trivy actualizando las
  dependencias vulnerables a versiones corregidas cuando estén disponibles.
- Las predicciones son experimentales y no constituyen asesoría financiera.

## 2. Arquitectura objetivo aprobada

- Frontend: Next.js sobre React y adaptadores tipados en `frontend/`; estos
  adaptadores son parte integral del frontend, no un servicio desplegable
  independiente, y su ubicación objetivo es `frontend/services-frontend/`.
  Los microservicios backend viven bajo `backend/services/`: gateway y
  servicios Node.js/TypeScript, seguridad Java/Spring Boot y el servicio ML
  Python existente en `backend/services/ml-service/`.
- La app Next.js vive en `frontend/next-app/` para coexistir con las páginas
  HTML heredadas; estas siguen disponibles bajo `/legacy/` hasta validar y
  aprobar su retiro.
- Gateway de entrada único; identidad y seguridad en Java/Spring Boot con
  PostgreSQL en la base separada `${SECURITY_DB_NAME:-aylzz_identity}`.
  Conservar intacta la base heredada `aylzz_users`; mercado/predicciones usan
  MongoDB con propiedad de datos por servicio y Redis para rate limiting y
  estado temporal.
- `backend/services/ml-service/` es el servicio backend de datos y modelos
  existente. Mantener su implementación, datos, API y tareas programadas fuera
  de la reescritura; integrarlo por contratos/adaptadores.
- Migrar la UI de forma incremental: conservarla hasta validar equivalencia
  visual y funcional. Añadir antes de retirar; no sobrescribir páginas o assets
  sin pruebas.
- El contenedor Nginx del frontend debe poder servir la UI aunque los servicios
  backend estén detenidos; resolver el gateway al procesar `/api/`.
- No generar datos intradía a partir de velas diarias. Mostrar intervalos de
  1/5 minutos solo con fuente y marcas de tiempo verificadas.
- La fuente intradía es Kraken spot XMR/USD: 5m para las últimas 12 horas y 1m
  para los últimos 10 minutos. Excluir la vela en curso, persistir timestamps
  UTC y mostrar hora local del navegador; ante fallos, no sustituir por datos
  diarios.
- Servicios guardan timestamps UTC; la UI muestra la hora local del navegador.
  Idiomas y accesibilidad deben estar disponibles en el frontend.
- Cada servicio es dueño de su base de datos. Accesos entre servicios solo por
  contratos autenticados; secretos y destinatarios de correo son externos.
- Los respaldos de PostgreSQL y MongoDB usan cuentas de solo lectura y cifrado
  age; la identidad privada, SMTP y destinatario se configuran externamente.
  El perfil de backup permanece opt-in hasta configurar y probar el destino.
- Los servicios backend usan logs JSON y `X-Request-ID` validado; Prometheus se
  limita a la red privada de Compose. La auditoría de autenticación no persiste
  contraseñas, tokens, cuerpos, correos enviados en solicitudes ni direcciones
  IP. `backend/services/ml-service/` permanece sin cambios internos salvo
  autorización explícita.
- Cada fase se prueba antes de modificar, deja la aplicación ejecutable y se
  documenta y confirma en un commit sin incluir cambios previos del usuario.
- Al limpiar, eliminar solo caches y salidas de build verificadas como
  regenerables; conservar dependencias, secretos, datos persistentes y cambios
  del usuario.
