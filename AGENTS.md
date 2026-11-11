# AGENTS.md — Instrucciones del proyecto XMR-Forecast

> **Léelo completo antes de cualquier tarea.** Este archivo es la fuente de verdad de las reglas del proyecto.
> **Se actualiza al terminar CADA tarea** (ver §7 y §10). Si algo aquí contradice a `MEMORY.md`, gana `AGENTS.md`.

Archivos de gobierno: `AGENTS.md` (reglas permanentes) · `SKILLS.md` (habilidades y recetas) · `MEMORY.md` (memoria corta, máx. 50 líneas).

---

## 1. Contexto del proyecto

- **Nombre de trabajo:** AyLZz Crypto Lab (XMR-Forecast).
- **Qué es:** portal de investigación para explorar precios diarios OHLCV de
  Monero (XMR-USD) y comparar predicciones del próximo cierre.
- **Componentes actuales:** `frontend/` (interfaz), `Monero/` (datos y modelos)
  y `docker-compose.yml` (integración local).
- **Estado:** integración preliminar; la arquitectura objetivo está definida en
  la sección 2 y su migración aún está pendiente.
- **Documentación fuente:** `Monero/README.md`, `Monero/ESTRUCTURA.md` e informes
  del estudio dentro de `Monero/`.
- Las predicciones son experimentales y no constituyen asesoría financiera.

## 2. Arquitectura objetivo y reglas de migración

- Frontend objetivo: Next.js sobre React; conservar la UI actual hasta validar
  equivalencia funcional y visual antes de retirar cualquier ruta existente.
- Gateway y servicios generales: Node.js con TypeScript. Identidad y seguridad:
  Java con Spring Boot y PostgreSQL.
- Cada servicio de backend es dueño de sus datos: gateway en su almacén Redis
  aislado para rate limiting/estado temporal, identidad en PostgreSQL y mercado
  y predicciones en bases MongoDB separadas. Ningún servicio consulta
  directamente la base de otro.
- `Monero/` queda fuera de la reescritura. Integrarlo mediante un adaptador y
  mantener intactos sus datos, modelos, API y tareas programadas.
- Mantener la app actual ejecutable durante la migración. Cada fase debe sumar
  capacidad, tener pruebas apropiadas y terminar en un commit independiente.
- No generar velas intradía a partir de datos diarios. Mostrar intervalos de
  1/5 minutos solo cuando una fuente los provea con cobertura y marcas de tiempo
  verificables.
- El navegador presenta horas locales; los servicios almacenan y transportan
  marcas de tiempo en UTC. Mantener idioma seleccionable y accesibilidad.
- Los servicios internos se comunican por contratos autenticados y red privada;
  las credenciales y destinos de correo se configuran fuera del repositorio.
