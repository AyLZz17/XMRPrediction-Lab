# S-12 · Frontend (React + TypeScript + ECharts)

## Cuándo usarla
Al desarrollar la interfaz de usuario del sistema de predicción.

## Herramientas
- **React** + **TypeScript** (strict): UI tipada
- **Vite**: Build tool
- **Tailwind CSS**: Estilos utility-first
- **Apache ECharts**: Gráficos (velas OHLC, líneas, barras)
- **TanStack Query**: Data fetching y caché
- **React Router**: Enrutamiento

## Receta

### Cliente API tipado
```typescript
// api/client.ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor para JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Páginas por caso de uso
- Dashboard principal
- Gráfico de velas OHLC + volumen
- Real vs. predicho
- Curvas de aprendizaje
- Barras comparativas de métricas

### Aviso legal
- **Siempre visible** en todas las páginas
- No usar "predice el mercado", usar "capacidad predictiva evaluada"

### Estados
- Carga: Spinners o skeletons
- Error: Mensajes claros con opción de reintentar
- Vacío: Mensajes informativos

### Accesibilidad
- Contraste adecuado (WCAG AA)
- Etiquetas en controles
- Navegación por teclado

## Errores típicos
- ❌ No usar TypeScript strict
- ❌ No manejar estados de carga/error
- ❌ No incluir aviso legal visible
- ❌ Gráficos sin etiquetas ni tooltips
- ❌ No usar TanStack Query para caché
- ❌ Lógica de API en componentes (separar en servicios)

## Checklist
- [ ] TypeScript strict habilitado
- [ ] Cliente API tipado
- [ ] Gráficos ECharts: velas, líneas, barras
- [ ] Aviso legal siempre visible
- [ ] Estados de carga/error/vacío
- [ ] Accesibilidad básica (contraste, etiquetas)
- [ ] TanStack Query para data fetching
