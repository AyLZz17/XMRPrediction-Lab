# S-16 · Comunicación responsable de resultados financieros

## Cuándo usarla
Al presentar resultados, métricas o predicciones del sistema a usuarios o stakeholders.

## Receta

### Lenguaje apropiado
- ✅ "Capacidad predictiva evaluada"
- ❌ "Predice el mercado"
- ✅ "El modelo obtuvo un MAE de X USD en el conjunto de prueba"
- ❌ "El modelo es preciso"

### Incertidumbre
- Informar siempre la incertidumbre
- Mostrar media ± desviación entre semillas
- Incluir intervalos de confianza cuando sea posible

### Contexto
- Mostrar siempre los baselines junto al modelo
- Incluir limitaciones (cambios bruscos, factores externos)
- Sin simulaciones de inversión

### Aviso legal
```
⚠️ AVISO LEGAL: Este sistema tiene fines educativos y de investigación.
No constituye asesoramiento financiero. Las predicciones son estimaciones
estadísticas basadas en datos históricos y no garantizan resultados futuros.
Invierta bajo su propio riesgo.
```

## Errores típicos
- ❌ Usar lenguaje que garantice resultados ("predice", "asegura")
- ❌ No mostrar la incertidumbre de las predicciones
- ❌ Ocultar los baselines o comparaciones
- ❌ No incluir limitaciones del modelo
- ❌ Sugerir decisiones de inversión

## Checklist
- [ ] Lenguaje responsable en toda la documentación
- [ ] Incertidumbre informada (media ± desviación)
- [ ] Baselines mostrados junto al modelo
- [ ] Limitaciones documentadas
- [ ] Aviso legal visible en la interfaz
- [ ] Sin simulaciones de inversión
