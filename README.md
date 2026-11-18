# AyLZz Crypto Lab

Portal experimental para consultar el mercado de Monero (XMR-USD) y comparar estimaciones del próximo cierre diario. Regístrate o inicia sesión para explorar el histórico OHLCV, métricas y cinco modelos: Persistencia, Media móvil, ARIMA, LSTM y GRU.

El servicio actualiza los datos diarios y conserva datos, modelos e historial en volúmenes de Docker. También ofrece velas intradía verificadas de Kraken: 5 minutos para las últimas 12 horas y 1 minuto para los últimos 10 minutos; excluye la vela abierta y muestra la hora local del navegador. Las predicciones son experimentales y no constituyen asesoría financiera.

## Créditos

El componente de machine learning se extrajo del repositorio [Monero de Feirt00](https://github.com/Feirt00/Monero.git). Créditos al autor por el trabajo original.

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

Abre [http://localhost:8081](http://localhost:8081). Para detener los servicios, presiona `Ctrl+C`.

## Crear una cuenta de prueba

Con los servicios en ejecución, ejecuta las líneas en orden en PowerShell. Cuando aparezca cada prompt, escribe el valor y presiona Enter. Usa una contraseña nueva de al menos 12 caracteres; no se mostrará al escribirla.

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

Después, inicia sesión en [http://localhost:8081/login/](http://localhost:8081/login/). Las cuentas son normales; el proyecto aún no tiene roles ni permisos de administrador.
