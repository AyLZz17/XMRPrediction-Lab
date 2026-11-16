# Entrega: Detalles extensos del análisis

En el dashboard se añadió la sección **Detalles extensos del análisis**. La
entrega académica reproducible está organizada por las cuatro preguntas vistas
en clase:

| Etapa | Pregunta | Carpeta |
|---|---|---|
| Descriptiva | ¿Qué ocurrió? | `analisis_descriptivo/` |
| Diagnóstica | ¿Qué podría explicarlo? | `analisis_diagnostico/` |
| Predictiva | ¿Qué anticipa una validación temporal? | `analisis_predictivo/` |
| Prescriptiva | ¿Qué acciones prudentes se desprenden? | `analisis_prescriptivo/` |

Los datos de trabajo y dependencias compartidas están en `analisis_datos/`.
Inicie por `analisis_datos/README.md`. Cada carpeta tiene su `INFORME.md` y un
`ejecutar.py`; las tablas y figuras generadas quedan en `resultados/`.

Los archivos de las clases 22–26 fueron consultados para seguir la secuencia
descriptiva → diagnóstica → predictiva → prescriptiva y su énfasis en series de
tiempo, tendencias, estacionalidad y métricas de regresión. Para reproducirlos
no hace falta instalar librerías dentro de `backend/services/ml-service/`.

La copia del dataset está congelada a 2026-10-31 y no se sincroniza sola con el
servicio. Para analizar una actualización, copie el CSV nuevo a
`analisis_datos/xmr_usd_diario.csv` y vuelva a ejecutar cada etapa. Las
predicciones son experimentales; no constituyen asesoría financiera.
