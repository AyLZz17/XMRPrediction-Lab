# S-17 · Seguridad básica de aplicaciones web

## Cuándo usarla
Al implementar autenticación, autorización y protección básica de la aplicación web.

## Receta

### Autenticación
- JWT con expiración corta (15-30 minutos)
- Hash de contraseñas con Argon2 o bcrypt
- Refresh tokens con rotación

### Autorización
- Roles: `viewer`, `analyst`, `admin`
- Verificar permisos en cada endpoint
- Principio de mínimo privilegio

### Protección
- CORS restringido (solo orígenes permitidos)
- *Rate limiting* en login y endpoints sensibles
- Validación estricta de entradas (Pydantic)
- Secretos por entorno (variables de entorno, no en código)

### Auditoría
- Registro de acciones sensibles en `audit_log`
- Intentos de login fallidos
- Acciones de administración

### Configuración
```python
# Seguridad en FastAPI
from fastapi.security import HTTPBearer
from slowapi import Limiter

security = HTTPBearer()
limiter = Limiter(key_func=get_remote_addr)

@app.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginSchema):
    # Verificar credenciales
    # Generar JWT con expiración corta
    pass
```

## Errores típicos
- ❌ JWT con expiración larga o sin expiración
- ❌ Guardar contraseñas en texto plano o con hash débil (MD5, SHA1)
- ❌ CORS abierto a todos los orígenes (`*`)
- ❌ No rate limiting en endpoints sensibles
- ❌ Secretos hardcodeados en el código
- ❌ No registrar acciones de auditoría

## Checklist
- [ ] JWT con expiración corta
- [ ] Contraseñas con Argon2/bcrypt
- [ ] Roles y permisos implementados
- [ ] CORS restringido
- [ ] Rate limiting en login y endpoints sensibles
- [ ] Validación estricta de entradas
- [ ] Secretos por entorno
- [ ] Auditoría de acciones sensibles
