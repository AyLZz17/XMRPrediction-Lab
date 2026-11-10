# S-18 · Seguridad integral (API, infraestructura, cadena de suministro y ML)

## Cuándo usarla
Al diseñar, implementar, revisar o desplegar cualquier componente de la API, SPA, infraestructura, CI/CD, datos o ML.

## Referencias
- `05_seguridad.md` (documentación del proyecto)
- OWASP ASVS / API Top 10
- NIST CSF / SSDF / 800-63B-4 / 800-61 Rev. 3
- NIST AI RMF
- MITRE ATLAS

## Receta

### 1. Actualizar activos y threat model
- Inventario de activos (datos, modelos, APIs, infraestructura)
- Threat model actualizado (STRIDE, PASTA)

### 2. Asignar controles `SEC-*`
- Controles de seguridad específicos para cada componente
- Trazabilidad entre amenazas y controles

### 3. Implementar
- **Mínimo privilegio**: Solo los permisos necesarios
- **Validación**: Entradas validadas estrictamente
- **Límites**: Rate limiting, timeouts, tamaños máximos
- **Trazabilidad**: Logs de auditoría completos
- **Procedencia**: Origen y transformación de datos documentados

### 4. Ejecutar pruebas de seguridad
- SAST (Static Application Security Testing)
- DAST (Dynamic Application Security Testing)
- Escaneo de dependencias (Snyk, Dependabot)
- Escaneo de imágenes Docker (Trivy)
- Tests de seguridad en CI/staging

### 5. Registrar evidencia
- Evidencia de controles implementados
- Excepciones documentadas con justificación
- Incidentes registrados y analizados

### 6. Revisar periódicamente
- Accesos (cuentas, roles, API keys)
- Dependencias (vulnerabilidades conocidas)
- Backups (integridad y restauración)
- Alertas (configuración y umbrales)

## Errores típicos
- ❌ Confiar en el rol del frontend (siempre verificar en backend)
- ❌ Guardar JWT en `localStorage` (vulnerable a XSS)
- ❌ Aceptar URLs externas sin allowlist (SSRF)
- ❌ Usar `pickle` para serialización (ejecución de código arbitrario)
- ❌ Exponer Redis/MLflow sin autenticación
- ❌ Cargar modelos no confiables (model poisoning)
- ❌ Registrar secretos en logs
- ❌ Promover código solo por pasar tests (sin revisión de seguridad)
- ❌ Tratar un checksum como sustituto de la autorización

## Checklist
- [ ] Threat model actualizado
- [ ] Controles `SEC-*` asignados
- [ ] Mínimo privilegio implementado
- [ ] Validación estricta de entradas
- [ ] Rate limiting y timeouts configurados
- [ ] Logs de auditoría completos
- [ ] Pruebas SAST/DAST en CI
- [ ] Dependencias escaneadas
- [ ] Imágenes Docker escaneadas
- [ ] Secretos en variables de entorno
- [ ] Backups verificados
- [ ] Accesos revisados periódicamente
