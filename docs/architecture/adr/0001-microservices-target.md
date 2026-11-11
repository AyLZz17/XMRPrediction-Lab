# ADR-0001: Arquitectura objetivo de microservicios

- **Estado:** Aceptado como dirección de migración
- **Fecha:** 2026-11-10
- **Ámbito:** evolución de AyLZz Crypto Lab; `Monero/` queda fuera de la reescritura

## Contexto

La solución actual integra una UI estática con una API de investigación diaria
de Monero y sus tareas de datos/modelos. Se requiere registro e inicio de sesión
persistentes, separación de responsabilidades y datos, controles de tráfico,
gráficos más útiles y operación observable. La interfaz existente y el servicio
de investigación deben seguir disponibles durante la migración.

La API actual ofrece OHLCV diario. No hay evidencia en el repositorio de una
fuente que provea velas intradía de 1 y 5 minutos; esos datos no pueden derivarse
de forma legítima de la serie diaria.

## Decisión

Adoptar los siguientes límites:

1. Next.js/React como frontend, servido al usuario y conectado únicamente al
   API Gateway.
2. API Gateway y servicios generales en Node.js/TypeScript.
3. Servicio de identidad y seguridad en Java/Spring Boot, con PostgreSQL
   exclusivo para identidad y auditoría.
4. Servicios de mercado y predicciones en Node.js/TypeScript, cada uno con su
   propia base MongoDB.
5. Redis para caché, rate limiting y estado temporal, con claves namespaced;
   no usarlo como registro de datos de negocio.
6. Mantener `Monero/` y consumirlo desde predicciones mediante un adaptador
   aislado y autenticado.
7. Integrar servicios por API privada autenticada, no por acceso cruzado a
   bases de datos.

El gateway aplica límites que devuelven `429`, timeouts y reintentos acotados.
Los reintentos solo se habilitan para operaciones idempotentes o con clave de
idempotencia. Cada servicio conserva errores y códigos HTTP explícitos.

## Alternativas consideradas

- **Ampliar la aplicación actual como monolito:** menor costo inicial, pero no
  cumple la separación tecnológica, de despliegue y de persistencia solicitada.
- **Reemplazar frontend y API de una sola vez:** descartado porque impide validar
  equivalencia y eleva el riesgo de perder comportamiento existente.
- **Leer directamente la base de otro servicio:** descartado porque acopla los
  esquemas y evita la aplicación de políticas de autorización.
- **Crear velas intradía a partir de velas diarias:** descartado porque produce
  series falsas y una precisión visual engañosa.

## Consecuencias

- Se mantiene el despliegue actual mientras se agrega la nueva plataforma por
  etapas; la migración requiere contratos versionados y adaptadores temporales.
- PostgreSQL y MongoDB pueden administrarse con DBeaver y MongoDB Compass,
  respectivamente, usando credenciales locales y acceso solo desde localhost.
- Deben definirse en una fase posterior el proveedor intradía y sus términos,
  el mecanismo de identidad entre servicios, el SMTP y la política de retención
  de respaldos. Sus secretos no se versionan.
- Cada fase requiere pruebas de integración y una comprobación de arranque
  Docker antes de retirar la implementación equivalente anterior.

## Referencias

- [Arquitectura objetivo y plan de migración](../README.md)
- [Contexto y metodología Monero](../../../Monero/README.md)
