# Investigación de Accesibilidad

## Descripción
Habilidad para investigar, evaluar y mejorar la accesibilidad de productos digitales para personas con diversas discapacidades.

## Cuándo usarla
- Al diseñar o rediseñar un producto digital
- Para cumplir con estándares de accesibilidad (WCAG)
- Para evaluar la accesibilidad de un producto existente
- Para entender las necesidades de usuarios con discapacidades

## Herramientas
- **Evaluación automática**: axe, Lighthouse, WAVE, Pa11y
- **Lectores de pantalla**: NVDA, JAWS, VoiceOver, TalkBack
- **Pruebas manuales**: Navegación por teclado, zoom, contraste
- **Usuarios reales**: Tests con personas con discapacidades
- **Herramientas de color**: Color Contrast Analyzer, Stark, Sim Daltonism

## Tipos de discapacidades a considerar

### Discapacidades visuales
- Ceguera total
- Baja visión
- Daltonismo (deuteranopia, protanopia, tritanopia)
- Sensibilidad a la luz

### Discapacidades auditivas
- Sordera total
- Hipoacusia
- Sensibilidad a sonidos

### Discapacidades motoras
- Incapacidad para usar ratón
- Movilidad limitada
- Temblores
- Parálisis

### Discapacidades cognitivas
- Dislexia
- TDAH
- Autismo
- Discapacidades de aprendizaje
- Discapacidades de memoria

## Estándares y guías

### WCAG 2.1 (Web Content Accessibility Guidelines)
- **Nivel A**: Requisitos mínimos
- **Nivel AA**: Recomendado (objetivo común)
- **Nivel AAA**: Accesibilidad óptima

### Principios POUR
- **Perceptible**: La información debe ser presentable de formas que los usuarios puedan percibir
- **Operable**: Los componentes de la interfaz deben ser operables
- **Comprensible**: La información y operación deben ser comprensibles
- **Robusto**: El contenido debe ser robusto para ser interpretado por diversas tecnologías asistivas

## Receta

### 1. Definir alcance de la evaluación
- ¿Qué páginas/funcionalidades evaluar?
- ¿Qué nivel de WCAG es el objetivo? (A, AA, AAA)
- ¿Qué tecnologías asistivas probar?

### 2. Evaluación automática
- Ejecutar herramientas automáticas (axe, Lighthouse)
- Identificar problemas de contraste, estructura, labels
- Corregir errores automáticos primero
- Documentar hallazgos

### 3. Evaluación manual
- Navegación solo por teclado
- Prueba con lectores de pantalla (NVDA, VoiceOver)
- Verificar orden de tabulación
- Comprobar anuncios dinámicos (ARIA live regions)

### 4. Pruebas con usuarios con discapacidades
- Reclutar participantes con diversas discapacidades
- Observar cómo usan el producto
- Identificar barreras reales
- Recopilar feedback cualitativo

### 5. Evaluar contenido
- **Texto**: Legibilidad, lenguaje claro
- **Imágenes**: Texto alternativo descriptivo
- **Videos**: Subtítulos, transcripciones, audiodescripción
- **Formularios**: Labels claros, mensajes de error accesibles
- **Documentos**: PDFs accesibles, documentos estructurados

### 6. Verificar responsive y zoom
- Funcionalidad con zoom al 200%
- Diseño responsive accesible
- No pérdida de contenido al hacer zoom
- Soporte para modo oscuro

### 7. Documentar hallazgos
- Lista de problemas por severidad
- Capturas de pantalla como evidencia
- Recomendaciones de corrección
- Priorización por impacto

### 8. Implementar correcciones
- Corregir problemas de código (HTML, CSS, JS)
- Mejorar contraste y tamaños de fuente
- Añadir ARIA labels donde sea necesario
- Asegurar navegación por teclado

### 9. Verificar correcciones
- Re-ejecutar evaluación automática
- Pruebas manuales de verificación
- Tests con usuarios (si es posible)
- Documentar cumplimiento

## Errores típicos
- ❌ Evaluar solo con herramientas automáticas (no detectan todo)
- ❌ No probar con lectores de pantalla reales
- ❌ Ignorar la navegación por teclado
- ❌ Texto alternativo genérico ("imagen1.jpg")
- ❌ Depender solo del color para transmitir información
- ❌ No considerar discapacidades cognitivas
- ❌ No involucrar a personas con discapacidades en las pruebas
- ❌ Tratar accesibilidad como algo opcional o posterior

## Checklist
- [ ] Alcance de evaluación definido
- [ ] Evaluación automática ejecutada
- [ ] Evaluación manual realizada
- [ ] Pruebas con usuarios con discapacidades realizadas
- [ ] Contenido evaluado (texto, imágenes, videos)
- [ ] Responsive y zoom verificados
- [ ] Hallazgos documentados
- [ ] Correcciones implementadas
- [ ] Verificación de correcciones realizada
- [ ] Cumplimiento WCAG documentado
