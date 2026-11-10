# S-07 · Análisis de fallos

## Cuándo usarla
Después de la evaluación final del modelo para entender dónde y por qué falla.

## Receta

### 1. Identificar los peores casos
- Listar los k días de mayor error absoluto
- Analizar si coinciden con eventos de alta volatilidad

### 2. Segmentar por régimen de volatilidad
- Calcular desviación estándar móvil de retornos
- Dividir en regimes: por encima/debajo del percentil 75
- Comparar error por régimen

### 3. Medir el suavizado de picos
- Correlación de cambios reales vs. predichos
- Amplitud relativa de las predicciones vs. realidad

### 4. Contextualizar con eventos de mercado
- Contrastar con eventos conocidos **solo como contexto**
- **Sin afirmar causalidad**

### 5. Redactar limitaciones
- Documentar claramente las limitaciones del modelo
- Incluir en la documentación técnica

## Errores típicos
- ❌ Afirmar causalidad entre eventos de mercado y errores del modelo
- ❌ No segmentar por régimen de volatilidad
- ❌ Ignorar los peores casos sin analizarlos
- ❌ No documentar las limitaciones del modelo

## Checklist
- [ ] Top-k días de mayor error identificados
- [ ] Error segmentado por régimen de volatilidad
- [ ] Correlación de cambios calculada
- [ ] Eventos de mercado mencionados como contexto (sin causalidad)
- [ ] Limitaciones documentadas
