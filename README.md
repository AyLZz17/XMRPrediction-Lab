# AyLZz Crypto Lab

## Iniciar con Docker Compose

Si aún no tienes `.env`, créalo desde la plantilla y configura las contraseñas requeridas:

```powershell
Copy-Item .env.example .env
notepad .env
```

Desde la raíz del proyecto, construye las imágenes e inicia los servicios:

```powershell
docker compose up --build
```

Abre <http://localhost:8081>. Para detener los servicios, presiona `Ctrl+C`.

## Crear una cuenta de prueba desde PowerShell (no necesario en la ultima version)

Con los servicios en ejecución, ejecuta cada línea en orden en PowerShell. Cuando aparezca cada prompt, escribe el valor y presiona Enter para continuar. El texto entre comillas de `Read-Host` es solo la etiqueta del prompt; no pongas allí el correo ni la contraseña. Usa una contraseña nueva de al menos 12 caracteres; no se mostrará al escribirla.

```powershell
$email = Read-Host "Correo de prueba"
$securePassword = Read-Host "Escribe una contraseña nueva" -AsSecureString
$password = [System.Net.NetworkCredential]::new("", $securePassword).Password
$body = @{ email = $email; password = $password } | ConvertTo-Json
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8081/api/auth/register" `
  -ContentType "application/json" `
  -Body $body
Remove-Variable password, securePassword, body
```

La cuenta se guarda con contraseña protegida mediante BCrypt y luego puedes iniciar sesión en <http://localhost:8081/login/>. Es una cuenta normal: el proyecto todavía no implementa roles ni permisos de administrador.
