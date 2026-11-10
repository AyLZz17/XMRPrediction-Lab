# Investigación de Código Abierto y Soluciones Existentes

## Descripción
Habilidad para investigar, evaluar y seleccionar soluciones de código abierto, librerías y frameworks para un proyecto.

## Cuándo usarla
- Antes de desarrollar una funcionalidad desde cero
- Para evaluar librerías y frameworks
- Para entender el ecosistema de una tecnología
- Para contribuir a proyectos de código abierto

## Herramientas
- **Repositorios**: GitHub, GitLab, Bitbucket
- **Paquetes**: npm, PyPI, Maven, Crates.io, Packagist
- **Métricas**: Stars, forks, issues, PRs, releases, contributors
- **Herramientas**: Snyk, Socket, FOSSA, Black Duck, license-checker

## Criterios de evaluación

### Actividad y mantenimiento
- **Frecuencia de commits**: ¿Cuándo fue el último commit?
- **Releases**: ¿Hay releases regulares y versionado semántico?
- **Issues**: ¿Se responden y resuelven issues?
- **PRs**: ¿Se aceptan contribuciones de la comunidad?
- **Contributors**: ¿Cuántos contribuidores activos hay?

### Calidad del código
- **Tests**: ¿Tiene tests? ¿Cuál es la cobertura?
- **Documentación**: ¿Es clara y completa?
- **Código limpio**: ¿Sigue buenas prácticas?
- **TypeScript/Types**: ¿Tiene tipos definidos?
- **Changelog**: ¿Documenta cambios entre versiones?

### Comunidad y soporte
- **Comunidad**: ¿Hay Discord, Slack, foro activo?
- **Stack Overflow**: ¿Hay preguntas respondidas?
- **Tutoriales**: ¿Hay contenido educativo disponible?
- **Empresas**: ¿Hay empresas que lo respalden?

### Seguridad
- **Vulnerabilidades**: ¿Tiene CVEs conocidos?
- **Dependencias**: ¿Están actualizadas?
- **Auditorías**: ¿Ha pasado auditorías de seguridad?
- **Respuesta a incidentes**: ¿Cómo maneja vulnerabilidades?

### Licencia
- **Tipo de licencia**: MIT, Apache 2.0, GPL, BSD, etc.
- **Compatibilidad**: ¿Es compatible con tu proyecto?
- **Uso comercial**: ¿Permite uso comercial?
- **Copyleft**: ¿Tiene requisitos de copyleft?

## Receta

### 1. Definir requisitos
- ¿Qué funcionalidad necesitas?
- ¿Qué restricciones técnicas hay?
- ¿Qué licencias son aceptables?
- ¿Qué nivel de madurez necesitas?

### 2. Buscar alternativas
- Buscar en GitHub, npm, PyPI, etc.
- Consultar recomendaciones de la comunidad
- Revisar "awesome lists" por tecnología
- Menciones en conferencias y blogs

### 3. Filtrar candidatos iniciales
- Descartar proyectos inactivos (sin commits en 6+ meses)
- Descartar proyectos sin documentación
- Descartar proyectos con licencias incompatibles
- Mantener 3-5 candidatos para evaluación profunda

### 4. Evaluar cada candidato
- **GitHub metrics**: Stars, forks, issues, PRs
- **Actividad**: Último commit, frecuencia de releases
- **Calidad**: Tests, documentación, código
- **Comunidad**: Actividad en foros y Discord
- **Seguridad**: Vulnerabilidades conocidas, dependencias
- **Licencia**: Compatibilidad con tu proyecto

### 5. Crear tabla comparativa
| Criterio | Opción A | Opción B | Opción C |
|----------|----------|----------|----------|
| Stars | | | |
| Último commit | | | |
| Tests | | | |
| Documentación | | | |
| Licencia | | | |
| Seguridad | | | |
| Curva de aprendizaje | | | |

### 6. Probar con Proof of Concept
- Implementar un prototipo mínimo con cada opción
- Evaluar facilidad de integración
- Medir rendimiento básico
- Verificar que cumple requisitos

### 7. Evaluar riesgo de vendor lock-in
- ¿Qué tan difícil es migrar a otra solución?
- ¿Hay estándares abiertos involucrados?
- ¿La API es estable y bien documentada?
- ¿Hay alternativas compatibles?

### 8. Tomar decisión
- Seleccionar la opción con mejor balance de criterios
- Documentar justificación de la decisión
- Planificar migración futura si es necesario
- Contribuir al proyecto si es posible

### 9. Mantenerse actualizado
- Suscribirse a releases del proyecto
- Monitoreo de seguridad (Snyk, Dependabot)
- Evaluar nuevas versiones periódicamente
- Considerar alternativas si el proyecto se estanca

## Errores típicos
- ❌ Elegir solo por número de stars (no indica calidad)
- ❌ No verificar la licencia (problemas legales)
- ❌ Ignorar la actividad del proyecto (abandono)
- ❌ No evaluar la seguridad (vulnerabilidades)
- ❌ No probar antes de adoptar (problemas de integración)
- ❌ Ignorar la comunidad (falta de soporte)
- ❌ No considerar el costo de migración futura
- ❌ Usar librerías abandonadas

## Checklist
- [ ] Requisitos definidos
- [ ] Múltiples alternativas identificadas
- [ ] Candidatos filtrados por actividad y licencia
- [ ] Evaluación profunda de 3-5 candidatos
- [ ] Tabla comparativa creada
- [ ] Proof of Concept implementado
- [ ] Riesgo de vendor lock-in evaluado
- [ ] Decisión documentada
- [ ] Monitoreo continuo establecido
