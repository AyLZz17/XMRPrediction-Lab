# Architecture Enterprise

## Descripción
Habilidad para el diseño de arquitecturas de software empresariales escalables, resilientes y mantenibles.

## Estilos arquitectónicos

### Monolitos
- Monolito modular
- Monolito con capas (Layered Architecture)
- Monolito con puertos y adaptadores (Hexagonal)

### Microservicios
- Service decomposition
- API Gateway
- Service discovery
- Distributed tracing
- Event-driven architecture

### Serverless
- Functions as a Service (FaaS)
- Backend as a Service (BaaS)
- Event-driven serverless
- Cold start optimization

### Event-Driven Architecture (EDA)
- Event sourcing
- CQRS
- Pub/Sub
- Message brokers (Kafka, RabbitMQ)
- Event storming

## Patrones de diseño

### Creacionales
- Factory, Abstract Factory, Builder, Singleton, Prototype

### Estructurales
- Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy

### Comportamiento
- Chain of Responsibility, Command, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor

### Patrones empresariales
- Repository, Unit of Work, Specification, CQRS, Saga, Circuit Breaker, Bulkhead, Retry, Timeout

## Calidad de arquitectura

### Atributos de calidad
- **Escalabilidad**: Horizontal y vertical
- **Disponibilidad**: 99.9%, 99.99%, 99.999%
- **Rendimiento**: Latencia, throughput
- **Mantenibilidad**: Acoplamiento, cohesión
- **Seguridad**: Defense in depth
- **Observabilidad**: Logs, métricas, traces

### Decisiones arquitectónicas
- ADRs (Architecture Decision Records)
- Trade-off analysis
- Proof of Concepts (PoC)
- Technical debt management

## Integración
- ESB (Enterprise Service Bus)
- iPaaS (Integration Platform as a Service)
- ETL/ELT pipelines
- API Management
- Webhooks

## Arquitectura de datos
- Data Mesh
- Data Fabric
- Lambda Architecture
- Kappa Architecture
- Lakehouse

## Herramientas
- C4 Model para documentación
- ArchiMate
- UML
- Diagrams as Code (Mermaid, PlantUML, Structurizr)
