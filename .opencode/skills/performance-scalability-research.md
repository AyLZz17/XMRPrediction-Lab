# Investigación de Rendimiento y Escalabilidad

## Descripción
Habilidad para investigar, analizar y evaluar el rendimiento y la escalabilidad de sistemas, aplicaciones e infraestructura.

## Cuándo usarla
- Antes de lanzar un producto al mercado
- Para identificar cuellos de botella existentes
- Para planificar la escalabilidad futura
- Para optimizar costos de infraestructura

## Herramientas
- **Monitoreo**: Datadog, New Relic, Prometheus + Grafana, APM tools
- **Profiling**: Chrome DevTools, Py-Spy, VisualVM, perf
- **Load testing**: k6, JMeter, Gatling, Locust, Artillery
- **Análisis**: APM, distributed tracing (Jaeger, Zipkin), log analysis

## Áreas de investigación

### Rendimiento de aplicación
- **Latencia**: Tiempo de respuesta por endpoint
- **Throughput**: Requests por segundo (RPS)
- **Uso de recursos**: CPU, memoria, I/O
- **Tiempo de carga**: LCP, FID, CLS (Core Web Vitals)

### Rendimiento de base de datos
- **Query performance**: Tiempo de ejecución de queries
- **Índices**: Uso y efectividad de índices
- **Conexiones**: Pool de conexiones, conexiones activas
- **Bloqueos**: Deadlocks, contención de recursos

### Rendimiento de red
- **Latencia de red**: Tiempo de respuesta entre servicios
- **Bandwidth**: Uso de ancho de banda
- **DNS**: Tiempo de resolución DNS
- **CDN**: Efectividad de caché

### Escalabilidad
- **Horizontal**: Capacidad de añadir más instancias
- **Vertical**: Capacidad de aumentar recursos por instancia
- **Límites**: Cuellos de botella identificados
- **Costo**: Costo por usuario/transaction a escala

## Receta

### 1. Definir objetivos de rendimiento
- ¿Cuáles son los SLAs/SLOs?
- ¿Cuál es el tiempo de respuesta objetivo?
- ¿Cuál es el throughput esperado?
- ¿Cuál es el crecimiento esperado de usuarios?

### 2. Establecer línea base (baseline)
- Medir rendimiento actual sin optimización
- Identificar métricas clave por componente
- Documentar configuración actual
- Establecer punto de comparación

### 3. Identificar cuellos de botella
- **CPU-bound**: Alto uso de CPU, procesos lentos
- **Memory-bound**: Alto uso de memoria, swapping
- **I/O-bound**: Alto uso de disco o red
- **Database-bound**: Queries lentas, bloqueos
- **Network-bound**: Latencia de red, bandwidth

### 4. Análisis de código y arquitectura
- **Profiling**: Identificar funciones/methods lentos
- **Análisis de complejidad**: Algoritmos ineficientes
- **N+1 queries**: Problemas de consultas a BD
- **Memory leaks**: Fugas de memoria
- **Blocking operations**: Operaciones bloqueantes

### 5. Pruebas de carga y estrés
- **Load testing**: Rendimiento bajo carga normal
- **Stress testing**: Comportamiento bajo carga extrema
- **Spike testing**: Respuesta a picos de tráfico
- **Soak testing**: Estabilidad bajo carga prolongada

### 6. Análisis de escalabilidad
- **Pruebas de escala horizontal**: Añadir instancias
- **Pruebas de escala vertical**: Aumentar recursos
- **Identificar límites**: Dónde falla el sistema
- **Costo de escalado**: Costo por unidad adicional

### 7. Optimización
- **Caché**: Implementar caché en múltiples niveles
- **CDN**: Distribución de contenido estático
- **Optimización de queries**: Índices, refactorización
- **Async processing**: Colas de mensajes, background jobs
- **Compresión**: Gzip, Brotli, optimización de imágenes

### 8. Monitoreo continuo
- **Alertas**: Umbrales de rendimiento
- **Dashboards**: Visualización de métricas en tiempo real
- **Distributed tracing**: Seguimiento de requests entre servicios
- **Log analysis**: Identificación de patrones de error

### 9. Documentar y planear
- **Reporte de rendimiento**: Hallazgos y métricas
- **Plan de optimización**: Acciones priorizadas
- **Plan de escalabilidad**: Estrategia de crecimiento
- **Costo-beneficio**: Análisis de inversiones necesarias

## Errores típicos
- ❌ No establecer línea base antes de optimizar
- ❌ Optimizar sin medir (optimizaciones prematuras)
- ❌ Ignorar el rendimiento de base de datos
- ❌ No probar bajo carga real
- ❌ Escalar verticalmente cuando horizontal es mejor
- [ ] No monitorear en producción
- ❌ Ignorar el impacto del rendimiento en UX
- ❌ No considerar el costo de la escalabilidad

## Checklist
- [ ] Objetivos de rendimiento definidos
- [ ] Línea base establecida
- [ ] Cuellos de botella identificados
- [ ] Análisis de código realizado
- [ ] Pruebas de carga ejecutadas
- [ ] Análisis de escalabilidad completado
- [ ] Optimizaciones implementadas
- [ ] Monitoreo continuo configurado
- [ ] Reporte documentado
- [ ] Plan de escalabilidad creado
