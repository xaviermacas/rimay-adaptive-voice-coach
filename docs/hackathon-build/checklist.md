# Checklist de construcción por incrementos

## Reglas de uso

- Esta lista comienza después de la fase documental actual.
- Ejecuta un solo incremento por autorización.
- Cada incremento debe terminar con árbol compilable, pruebas existentes en verde y evidencia de su aceptación.
- No crees anticipadamente archivos o dependencias de incrementos posteriores.
- Después de cada incremento, actualiza `build-notes.md`, ejecuta las verificaciones indicadas, revisa el diff completo y detente.
- Si un riesgo técnico invalida la arquitectura, actualiza primero `spec.md` y solicita autorización antes de ampliar alcance.

## Incremento 1 — Scaffold mínimo y prueba de grabación

**Estado: COMPLETADO — 2026-07-18**

**Objetivo**

Inicializar Git y una aplicación mínima React/Vite/TypeScript estricto que demuestre el riesgo principal: pedir permiso, grabar, detener y reproducir audio local en Chrome y Edge.

**Archivos previstos**

- `.gitignore`, `package.json`, lockfile, `tsconfig*.json`, configuración Vite/Vitest/Tailwind y `.env.example`.
- Shell mínimo en `src/app/`.
- Contratos iniciales en `src/domain/contracts/`.
- Captura aislada en `src/features/recording/` y pruebas asociadas.

**Aceptación**

- TypeScript usa `strict`, `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`.
- La UI explica el uso temporal del micrófono antes de solicitar permiso.
- El MIME se negocia en tiempo de ejecución.
- Una grabación puede iniciarse, detenerse y reproducirse; pistas y URL se liberan.
- Permiso rechazado y navegador no compatible tienen recuperación accesible.
- No existe transcripción, métrica, GPT, Supabase o persistencia todavía.

**Verificación**

```text
npm install
npm run typecheck
npm test
npm run build
```

Además, recorrido manual por teclado en Chrome y Edge, inspección de consola y confirmación de que no queda el micrófono activo.

**Evidencia de ejecución — 2026-07-18**

- [x] Git inicializado localmente en la rama `main`.
- [x] `npm install`: 251 paquetes instalados, 252 auditados y 0 vulnerabilidades.
- [x] `npm run lint`: 0 errores y 0 advertencias.
- [x] `npm run typecheck`: finalizó con código 0.
- [x] `npm test`: 3 archivos y 16 pruebas aprobadas.
- [x] `npm run build`: 20 módulos transformados y build de producción generado.
- [x] Auditoría de alcance: sin secretos, `.env` real, persistencia, red, métricas, transcripción, GPT o Supabase en el incremento.
- [x] Chrome: aplicación cargada, teclado y foco visibles, permiso aceptado y rechazado con recuperación, grabación, reproducción, liberación del micrófono, consola sin errores y favicon sin 404.
- [x] Chrome: Network confirmó que el audio no se envía; Storage no contiene audio, secretos ni datos sensibles.
- [x] Edge: permiso, grabación, reproducción y liberación del micrófono aprobados; consola sin errores.

**Cierre:** el responsable confirmó que la validación manual final del incremento 1 fue completada correctamente. Todos los criterios de aceptación y verificación del incremento están cubiertos. Cualquier trabajo del incremento 2 requiere una nueva autorización explícita.

## Incremento 2 — Procesamiento PCM y métricas deterministas

**Objetivo**

Decodificar una captura y producir `audio-metrics-v1` de forma pura, reproducible y probada antes de depender de servicios externos.

**Archivos previstos**

- `src/domain/audio/` para PCM, ventanas, segmentos y métricas.
- Fixtures sintéticos en `src/test/fixtures/audio/`.
- Pruebas unitarias de métricas y normalización.
- Presentación temporal de resultados en la prueba de grabación.

**Aceptación**

- Se implementan exactamente los umbrales y fórmulas de `spec.md`.
- Silencio, voz sintética, pausas, clipping, multicanal y audio corto producen resultados esperados.
- La misma entrada genera el mismo objeto, incluido `algorithmVersion`.
- Los valores basados en texto son `null` sin transcripción.
- Un fallo de decodificación no inventa métricas ni destruye el reproductor si sigue siendo utilizable.

**Verificación**

```text
npm run typecheck
npm test -- audio
npm test
npm run build
```

Comparar además una grabación real con los resultados visibles y confirmar que no se guardó PCM.

## Incremento 3 — Prueba live de transcripción

**Objetivo**

Probar de extremo a extremo la compatibilidad MediaRecorder → Supabase Edge Function → `gpt-4o-transcribe` con audio ficticio, antes de construir el flujo completo.

**Archivos previstos**

- `supabase/config.toml`.
- `supabase/functions/_shared/` para CORS, errores y validación.
- `supabase/functions/transcribe-attempt/`.
- `src/providers/live/transcriber` y su adaptación al contrato.
- Pruebas del handler y del proveedor.

**Aceptación**

- La clave OpenAI sólo existe en secretos de Supabase.
- La función acepta un único archivo permitido de hasta 10 MB y rechaza métodos, orígenes, MIME y tamaños inválidos.
- Audio WebM ficticio grabado en el navegador devuelve un `TranscriptionResult` válido.
- Timeout, upstream error y texto vacío producen códigos estables sin filtrar payloads.
- La función no persiste ni registra audio o transcripción.

**Verificación**

```text
npm run typecheck
npm test -- transcriber
npm test
npm run build
supabase --help
```

Descubrir con `supabase functions --help` el comando vigente, servir localmente, probar éxito y rechazo de payload, e inspeccionar logs sanitizados.

## Incremento 4 — GPT-5.6 estructurado y fallbacks

**Objetivo**

Validar el segundo riesgo externo: Responses API con `gpt-5.6`, JSON Schema estricto, reglas no clínicas y fallbacks deterministas, aún sin integrar toda la experiencia.

**Archivos previstos**

- Contratos y esquemas de coaching/resumen en `src/domain/contracts/`.
- Validación editorial, evidencia y fallbacks en `src/domain/`.
- `supabase/functions/coach-attempt/` y `summarize-session/`.
- Adaptadores live y fixtures demo.
- Pruebas de contrato y salidas adversariales.

**Aceptación**

- GPT recibe sólo ejercicio, transcripción opcional, métricas y candidatos; nunca audio.
- Structured Outputs usa `text.format` con esquema estricto.
- ID desconocido, evidencia inexistente, campos extra, números inventados y lenguaje clínico invalidan toda la respuesta.
- Timeout, rechazo o error aplican fallback sin bloquear el siguiente ejercicio.
- El resumen sólo referencia intentos y claves existentes.

**Verificación**

```text
npm run typecheck
npm test -- coach
npm test -- summary
npm test
npm run build
```

Ejecutar casos controlados de esquema válido e inválido contra handlers locales; revisar que logs y errores no contengan prompts o respuestas.

## Incremento 5 — Recorrido vertical de un intento

**Objetivo**

Unir instrucción, grabación, reproducción, métricas, transcripción, feedback y selección validada para un ejercicio de palabra, con modos demo y live explícitos.

**Archivos previstos**

- Máquina de estados en `src/features/practice/`.
- Composición de proveedores en `src/providers/`.
- Componentes mínimos del flujo paciente.
- Pruebas de integración con Testing Library.

**Aceptación**

- Demo completa el intento sin `fetch` y live usa las tres fronteras previstas según corresponda.
- El modo activo permanece visible y no hay fallback silencioso.
- El usuario controla reproducción, regrabación, análisis y avance.
- Un error recuperable conserva los datos temporales necesarios.
- Sólo una salida totalmente validada se renderiza y aplica.

**Verificación**

```text
npm run typecheck
npm test -- practice
npm test
npm run build
```

Recorrer demo sin red y live con audio ficticio; inspeccionar red, consola y almacenamiento.

## Incremento 6 — Tres ejercicios y voz accesible

**Objetivo**

Incorporar el catálogo ficticio, los tres tipos obligatorios, progreso de sesión e instrucciones mediante `SpeechSynthesis`.

**Archivos previstos**

- Catálogo en `src/domain/exercises/`.
- Componentes de instrucción y lectura guiada.
- Adaptador `SpeechOutput` del navegador y demo de error.
- Pruebas de catálogo, cobertura inicial y controles de voz.

**Aceptación**

- Los intentos 1, 2 y 3 son palabra, frase y lectura guiada respectivamente.
- Cada ejercicio tiene contenido ficticio, dificultad válida y duración máxima.
- Toda voz tiene texto visible y botones escuchar/detener/repetir.
- Falta de voz española no bloquea el flujo.
- No hay reproducción o avance automático.

**Verificación**

```text
npm run typecheck
npm test -- exercises
npm test -- speech
npm test
npm run build
```

Recorrido manual con voz disponible y simulada como ausente; verificar teclado y anuncios.

## Incremento 7 — Adaptación controlada

**Objetivo**

Implementar generación determinista de candidatos, dificultad acotada, recaptura única y aplicación segura de la sugerencia.

**Archivos previstos**

- Política pura en `src/domain/exercises/adaptation`.
- Integración con la máquina de sesión.
- Fixtures para límites y cinco intentos.
- Pruebas unitarias y de integración.

**Aceptación**

- La sesión termina con cinco intentos válidos y no queda atrapada en repeticiones.
- Calidad insuficiente permite una sola recaptura no contabilizada por posición.
- La similitud ajusta sólo dificultad 1–3 según `spec.md`.
- WPM, RMS, pausas y clipping no cambian dificultad.
- GPT nunca aplica un ID fuera de los candidatos; fallback usa el primero del orden estable.

**Verificación**

```text
npm run typecheck
npm test -- adaptation
npm test -- practice
npm test
npm run build
```

Ejecutar escenarios de baja, media, alta y nula similitud, además de sugerencia GPT inválida.

## Incremento 8 — Sesiones ficticias, almacenamiento local y roles

**Objetivo**

Persistir sólo datos derivados, recuperar sesiones en el mismo navegador y habilitar el selector local paciente/profesional.

**Archivos previstos**

- `LocalSessionRepository` y validación de `rimay.demo.v1`.
- Fixtures de sesiones en `src/providers/demo/`.
- `RoleSwitcher`, inicio/continuación/descarte y lista profesional mínima.
- Pruebas de serialización, cuota y corrupción.

**Aceptación**

- Recargar conserva sesiones y cambiar de rol no las borra.
- Almacenamiento contiene máximo 20 sesiones y ningún audio, blob, URL o PCM.
- Documento inválido no rompe la app; se informa y se inicia en memoria o con fixtures seguros.
- `QuotaExceededError` conserva la sesión actual en memoria.
- La UI explica que el selector no es autenticación.

**Verificación**

```text
npm run typecheck
npm test -- repository
npm test -- session
npm test
npm run build
```

Inspeccionar manualmente `localStorage`, recargar, cambiar de rol y descartar una sola sesión.

## Incremento 9 — Revisión y resumen profesional

**Objetivo**

Completar la vista profesional con intentos, métricas, banderas, evidencia y resumen estructurado.

**Archivos previstos**

- `src/features/professional-review/`.
- Integración de `ProfessionalSummary` y su fallback.
- Componentes de métricas, evidencia y limitaciones.
- Pruebas de estados completos, pendientes y fallidos.

**Aceptación**

- La sesión recién terminada aparece primero.
- Cada intento muestra prompt, transcripción, métricas, versión, flags, feedback y “Audio no conservado”.
- Métricas, IA y limitaciones están en secciones diferentes.
- Cada observación sólo enlaza evidencia existente.
- Sin resumen live, los datos deterministas siguen disponibles y existe fallback o reintento explícito.

**Verificación**

```text
npm run typecheck
npm test -- professional-review
npm test
npm run build
```

Recorrer sesión completa, cambiar a profesional y revisar estados vacío, pendiente, exitoso y fallido.

## Incremento 10 — Accesibilidad, errores y privacidad

**Objetivo**

Falsificar los flujos con errores y completar el endurecimiento WCAG 2.2 AA, privacidad y lenguaje no clínico.

**Archivos previstos**

- Componentes compartidos de estado y error.
- Matriz de copy en español y filtro editorial.
- Pruebas de teclado, foco, anuncios, límites y contenido prohibido.
- Ajustes de estilos accesibles sin nuevas funciones de producto.

**Aceptación**

- Todos los errores del PRD tienen mensaje, acción y foco predecible.
- La aplicación funciona por teclado, con zoom 200 %, reflow y contraste AA.
- Controles principales miden al menos 44 px y el foco no queda oculto.
- No hay contenido dependiente sólo de color o audio.
- Consola, red y almacenamiento no exponen claves, audio, transcripciones o payloads completos.
- Búsquedas de términos clínicos prohibidos no encuentran copy visible no justificado.

**Verificación**

```text
npm run typecheck
npm test
npm run build
```

Completar matriz manual de Chrome/Edge, teclado, lector de pantalla, zoom, red lenta/sin red, micrófono rechazado/ausente e inspección de privacidad.

## Incremento 11 — Documentación final, despliegue y ensayo

**Objetivo**

Cerrar la entrega reproducible: README, pruebas completas, build Vercel, funciones Supabase y guion de demostración.

**Archivos previstos**

- `README.md` y actualización de documentación de arquitectura/notas.
- Configuración final de Vercel y Supabase permitida por las plataformas.
- Fixtures y pruebas finales necesarias para criterios de aceptación.
- Guion de demo y checklist de reversión de live.

**Aceptación**

- Una persona nueva puede instalar y ejecutar demo siguiendo el README sin secretos.
- Live documenta variables, secretos, CORS, modelos y límites sin exponer valores.
- Preview Vercel completa demo y, en entorno controlado, live con datos ficticios.
- El guion principal dura aproximadamente 90 segundos y tiene una ruta de recuperación.
- Todas las historias y criterios del PRD están trazados a pruebas o verificación manual.
- No hay migraciones, Auth, Storage, audio persistido ni datos reales.

**Verificación**

```text
npm install
npm run typecheck
npm test
npm run build
```

Ejecutar también el build desplegado, las tres Edge Functions, el guion principal, la matriz de errores prioritaria y una revisión final del diff y de secretos.

## Condición de cierre global

La construcción termina cuando el incremento 11 cumple su aceptación y el responsable aprueba la demostración. Cualquier uso con personas o datos reales, persistencia remota, autenticación, audio histórico o afirmación clínica requiere un proyecto posterior con alcance, seguridad y revisión profesional propios.
