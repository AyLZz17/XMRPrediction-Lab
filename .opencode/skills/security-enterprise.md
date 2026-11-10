# Security Enterprise

## Descripción
Habilidad para la implementación de seguridad integral en aplicaciones y sistemas empresariales.

## Seguridad de aplicaciones (AppSec)

### OWASP Top 10
- Inyección (SQL, NoSQL, LDAP, OS command)
- Autenticación rota
- Exposición de datos sensibles
- XML External Entities (XXE)
- Control de acceso roto
- Mala configuración de seguridad
- Cross-Site Scripting (XSS)
- Deserialización insegura
- Componentes con vulnerabilidades conocidas
- Logging y monitoreo insuficientes

### Prácticas seguras
- Validación de inputs (whitelist)
- Parametrización de queries
- Output encoding
- Principio de mínimo privilegio
- Defense in depth
- Fail securely
- Seguridad por defecto

## Autenticación y autorización
- **MFA/2FA**: TOTP, WebAuthn, FIDO2
- **SSO**: SAML 2.0, OpenID Connect, CAS
- **OAuth 2.0**: Authorization Code, Client Credentials, PKCE
- **RBAC**: Role-Based Access Control
- **ABAC**: Attribute-Based Access Control
- **PBAC**: Policy-Based Access Control
- **JWT**: Firmas (RS256, ES256), expiración, refresh tokens

## Seguridad de infraestructura
- Network segmentation
- Firewalls y WAF
- VPN y Zero Trust
- DDoS protection
- Container security
- Kubernetes RBAC y Network Policies

## Criptografía
- Cifrado simétrico (AES-256-GCM)
- Cifrado asimétrico (RSA, ECC)
- Hashing (Argon2, bcrypt, PBKDF2)
- Firmas digitales
- TLS 1.3
- Key management (HSM, KMS)

## Cumplimiento y regulaciones
- **GDPR**: Protección de datos personales
- **PCI DSS**: Seguridad de tarjetas de pago
- **HIPAA**: Información de salud
- **SOC 2**: Controles de seguridad
- **ISO 27001**: Gestión de seguridad de la información

## Seguridad en el SDLC
- Threat modeling (STRIDE, PASTA)
- Secure code reviews
- SAST/DAST/IAST
- Dependency scanning
- Security champions program

## Respuesta a incidentes
- Plan de respuesta
- Forense digital
- Comunicación de brechas
- Post-mortem analysis
