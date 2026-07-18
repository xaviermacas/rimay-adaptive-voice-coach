# Checklist de construcción por incrementos

## Reglas de uso

- Ejecuta un solo incremento por autorización.
- Cada incremento debe terminar con árbol compilable, pruebas existentes en verde y evidencia de su aceptación.
- No crees anticipadamente archivos o dependencias de incrementos posteriores.
- Después de cada incremento, actualiza `build-notes.md`, ejecuta las verificaciones indicadas, revisa el diff completo y detente.
- Si un riesgo técnico invalida la arquitectura, actualiza primero `spec.md` y solicita autorización antes de ampliar alcance.
- Ningún incremento puede introducir facturación, tarjeta, prueba temporal, OpenAI, Supabase, Edge Functions, APIs comerciales o recursos pagos de Vercel.
- El runtime, las pruebas y el despliegue deben conservar costo USD 0.

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

**Cierre:** el responsable confirmó que la validación manual final del incremento 1 fue completada correctamente.

## Incremento 2 — Procesamiento PCM y métricas deterministas

**Estado: COMPLETADO — 2026-07-18**

**Objetivo**

Decodificar una captura y producir `audio-metrics-v1` de forma pura, reproducible y probada en el navegador.

**Archivos previstos**

- `src/domain/audio/` para PCM, ventanas, segmentos y métricas.
- Fixtures sintéticos en `src/test/fixtures/audio/`.
- Pruebas unitarias de métricas.
- Presentación temporal de resultados en la prueba de grabación.

**Aceptación**

- Se implementan exactamente los umbrales y fórmulas de `spec.md` vigentes para `audio-metrics-v1`.
- Silencio, voz sintética, pausas, clipping, multicanal y audio corto producen resultados esperados.
- La misma entrada genera el mismo objeto, incluido `algorithmVersion`.
- Los valores basados en texto son `null` porque todavía no existe texto utilizable.
- Un fallo de decodificación no inventa métricas ni destruye el reproductor si sigue siendo utilizable.

**Verificación**

```text
npm run typecheck
npm test -- audio
npm test
npm run build
```

Comparar además una grabación real con los resultados visibles y confirmar que no se guardó PCM.

**Evidencia de implementación — 2026-07-18**

- [x] `audio-metrics-v1` implementado en módulos puros sin dependencias de React.
- [x] Fixtures sintéticos cubren silencio, seno continuo, pausas, límites, transitorios, clipping, captura corta, estéreo y frecuencias de 8/48 kHz.
- [x] Entradas vacías, no finitas, multicanal inconsistente y configuración inválida devuelven errores tipados sin métricas fabricadas.
- [x] `AudioContext.decodeAudioData` se prueba con éxito, fallo, Web Audio ausente y cierre del contexto.
- [x] La interfaz presenta progreso, resultado técnico, versión del algoritmo y aviso no clínico.
- [x] `npm.cmd run lint`: código 0, sin errores ni advertencias.
- [x] `npm.cmd run typecheck`: código 0.
- [x] `npm.cmd test -- audio`: 3 archivos y 37 pruebas aprobadas.
- [x] `npm.cmd test`: 5 archivos y 41 pruebas aprobadas.
- [x] `npm.cmd run build`: 28 módulos transformados y build de producción generado.
- [x] Validación manual en Chrome y Edge con grabaciones reales, Network, Storage y consola.

**Cierre:** el responsable confirmó la validación manual final del incremento 2.

## Pausa documental de costo USD 0

**Estado: COMPLETADA — 2026-07-18**

Antes del incremento 3 se reemplazó el plan anterior de Supabase/OpenAI por Web Speech opcional, entrada manual, procesamiento local, reglas deterministas, `localStorage` y Vercel Hobby. Esta pausa sólo modifica documentación. No autoriza el incremento 3.

## Incremento 3 — Reconocimiento del navegador, demo, entrada manual y métricas textuales

**Estado: PENDIENTE — REQUIERE AUTORIZACIÓN EXPRESA**

La resolución documental de contratos y fórmulas de `text-metrics-v1` está completada. Esta resolución no inicia ni autoriza la implementación del incremento.

**Objetivo**

Resolver el principal riesgo restante sin servicios contratados: ejecutar `BrowserSpeechRecognizer` en paralelo con `MediaRecorder`, proporcionar `DemoSpeechRecognizer` y entrada manual, y producir `text-metrics-v1` local y determinista.

**Archivos previstos**

- Contratos de procedencia, estados, errores, `SpeechTextResult` y `TextMetrics` en `src/domain/contracts/`.
- Normalización, tokenización y comparación en `src/domain/text/`.
- `src/features/speech-recognition/` para la máquina de estados y el aviso de privacidad.
- `src/recognizers/browser/` para `SpeechRecognition` y `webkitSpeechRecognition`.
- `src/recognizers/demo/` para fixtures deterministas que no reciben audio.
- Entrada manual mínima integrada en la prueba de grabación existente.
- Pruebas unitarias, de adaptadores y de integración asociadas.

**Aceptación**

- Antes de iniciar reconocimiento, la UI declara que el `Blob` permanece en memoria, Rimay no lo envía ni lo almacena y el navegador puede usar un servicio remoto propio.
- El usuario puede elegir entrada manual desde el inicio o después de cualquier error.
- El adaptador detecta constructor estándar, prefijado y soporte ausente.
- El idioma usa un tag español, los resultados provisionales y finales se distinguen y `MediaRecorder` inicia en paralelo desde la misma acción.
- `BrowserSpeechRecognizer` no recibe el `Blob`, no implementa `fetch` y no promete funcionamiento local u offline.
- Permiso, captura, red, silencio, cancelación, idioma no compatible, servicio bloqueado y error desconocido tienen códigos y recuperación verificables.
- `DemoSpeechRecognizer` produce la misma secuencia por fixture, no usa red, no inspecciona audio y muestra que el texto es predefinido.
- La edición de un resultado automático cambia su procedencia a `manual`.
- `SpeechTextResult` conserva `originalText`, `normalizedText` y `comparisonText`, además de procedencia, idioma solicitado, finalidad, advertencias y fecha ISO 8601.
- `normalizedText` usa NFC y conserva tildes, diéresis y `ñ`; `comparisonText` elimina tildes y diéresis sin convertir `ñ` en `n`.
- `text-metrics-v1` alinea palabras por programación dinámica con `match`, `substitution`, `omission` y `addition`; los empates siguen ese mismo orden.
- `wordErrorRate` divide sustituciones, omisiones y adiciones por las palabras objetivo; `textSimilarity = max(0, 1 - wordErrorRate)`.
- Un objetivo vacío produce el error tipado `empty_target` y no fabrica métricas.
- WPM usa `transcribedWordCount / (totalDurationMs / 60_000)` únicamente con una grabación real y duración válida. Entrada manual sin captura y demo sin audio real producen `null`.
- Las métricas indican fuente y no se presentan como evaluación clínica.
- No se implementan todavía coaching, adaptación, sesión persistida, panel profesional, OpenAI, Supabase o despliegue.

**Verificación automatizada**

```text
npm run lint
npm run typecheck
npm test -- speech-recognition
npm test -- text
npm test
npm run build
```

**Verificación manual**

- Chrome y Edge: aviso antes del reconocimiento, elección manual y reconocimiento cuando exista soporte.
- Secuencia provisional/final visible, grabación y reconocimiento paralelos, detener y cancelar.
- Permiso rechazado, silencio y red desactivada con recuperación manual.
- Demo ejecutada sin red después de cargar la app y rotulada como fixture.
- Network confirma que la aplicación no envía el `Blob`, texto o métricas.
- Storage confirma que este incremento no persiste audio ni resultados temporales.

**Condición de parada**

Al cumplir la aceptación, registrar evidencia en `build-notes.md` y detenerse. No iniciar el incremento 4 sin autorización.

## Incremento 4 — Motor determinista de retroalimentación y adaptación

**Objetivo**

Implementar `coach-rules-v1` como función pura con plantillas curadas, razones verificables y selección limitada al catálogo permitido.

**Archivos previstos**

- Contratos y configuración de versión en `src/domain/coaching/`.
- Catálogo versionado de plantillas no clínicas.
- Política de candidatos en `src/domain/exercises/`.
- Pruebas de reglas, umbrales, órdenes y contenido editorial.

**Aceptación**

- Entradas: calidad de audio, similitud, pausas, duración, proporción de silencio, dificultad e intentos.
- La misma entrada produce el mismo `CoachDecision` completo.
- Cada salida declara `rulesVersion`, `ruleId`, `templateId`, acción, explicación y evidencia.
- Mensajes provienen sólo de plantillas curadas y no contienen afirmaciones diagnósticas.
- Sólo se seleccionan IDs de `allowedExercises`; lista vacía produce error de configuración.
- Repetición manual y avance requieren acción del usuario.
- No existe GPT, red, aleatoriedad no controlada o fallback remoto.

**Verificación**

```text
npm run lint
npm run typecheck
npm test -- coaching
npm test -- adaptation
npm test
npm run build
```

Ejecutar fixtures de cada rama, límites exactos y catálogo adversarial; repetir entradas para comparar igualdad profunda.

## Incremento 5 — Recorrido vertical de un intento

**Objetivo**

Unir instrucción, elección de privacidad, grabación, reconocimiento o entrada manual, reproducción, métricas, feedback y selección determinista para un ejercicio de palabra.

**Archivos previstos**

- Máquina de estados en `src/features/practice/`.
- Composición de captura, reconocedores y motor local.
- Componentes mínimos del flujo paciente.
- Pruebas de integración con Testing Library.

**Aceptación**

- El recorrido demo no usa `fetch` y muestra el fixture como predefinido.
- El recorrido browser conserva procedencia y la ruta manual siempre está disponible.
- El usuario controla reproducción, regrabación, análisis, repetición y avance.
- Un error recuperable conserva sólo los datos temporales necesarios.
- La decisión renderizada coincide con `coach-rules-v1` y usa un ejercicio permitido.
- El `Blob` se libera al reemplazar, descartar o desmontar.

**Verificación**

```text
npm run lint
npm run typecheck
npm test -- practice
npm test
npm run build
```

Recorrer demo sin red, browser y manual; inspeccionar red, consola y almacenamiento.

## Incremento 6 — Tres ejercicios y voz accesible

**Objetivo**

Incorporar el catálogo ficticio, los tres tipos obligatorios, progreso inicial e instrucciones mediante `SpeechSynthesis`.

**Archivos previstos**

- Catálogo en `src/domain/exercises/`.
- Componentes de instrucción y lectura guiada.
- Adaptador `SpeechOutput` del navegador.
- Pruebas de catálogo, cobertura inicial y controles de voz.

**Aceptación**

- Los intentos 1, 2 y 3 son palabra, frase y lectura guiada respectivamente.
- Cada ejercicio tiene contenido ficticio, dificultad válida y duración esperada.
- Toda voz tiene texto visible y botones escuchar, detener y repetir.
- Falta de voz española no bloquea el flujo.
- No hay reproducción, reconocimiento o avance automático.

**Verificación**

```text
npm run lint
npm run typecheck
npm test -- exercises
npm test -- speech
npm test
npm run build
```

Recorrido manual con voz disponible y simulada como ausente; verificar teclado y anuncios.

## Incremento 7 — Sesión de cinco intentos y adaptación completa

**Objetivo**

Integrar cobertura, dificultad acotada, repetición manual y finalización determinista de una sesión ficticia.

**Archivos previstos**

- Máquina de sesión y política de cobertura.
- Integración de `coach-rules-v1` con el catálogo.
- Fixtures de cinco intentos y límites.
- Pruebas unitarias y de integración.

**Aceptación**

- La sesión termina con cinco intentos válidos aceptados.
- Los tres primeros cubren los tipos obligatorios.
- La similitud ajusta dificultad sólo dentro de 1–3.
- Calidad, pausas, duración y silencio seleccionan plantillas según el orden versionado.
- La acción del usuario controla repetición y avance; no existen bucles automáticos.
- Ningún ejercicio fuera de la lista permitida se aplica.

**Verificación**

```text
npm run lint
npm run typecheck
npm test -- session
npm test -- adaptation
npm test -- practice
npm test
npm run build
```

Ejecutar escenarios de baja, media, alta y nula similitud, calidad deficiente, pausas, duración, silencio y quinto intento.

## Incremento 8 — Persistencia local, roles y eliminación total

**Objetivo**

Persistir sólo sesiones ficticias y datos derivados, recuperar sesiones en el mismo navegador, habilitar roles y eliminar completamente los datos locales de Rimay.

**Archivos previstos**

- `LocalSessionRepository` y validación de `rimay.demo.v1`.
- Fixtures de sesiones locales.
- `RoleSwitcher`, inicio/continuación/descarte y lista profesional mínima.
- `DeleteLocalData` y registro explícito de claves propias.
- Pruebas de serialización, cuota, corrupción y eliminación.

**Aceptación**

- Recargar conserva sesiones ficticias y cambiar de rol no las borra.
- Almacenamiento contiene máximo 20 sesiones y ningún audio, `Blob`, URL, PCM, stream o texto provisional.
- Documento inválido no rompe la app; `QuotaExceededError` conserva la sesión actual en memoria.
- Eliminar todo detiene recursos activos, quita todas las claves de Rimay, limpia memoria y verifica ausencia antes de confirmar.
- La implementación no usa `localStorage.clear()`.
- La UI explica que el selector no es autenticación y que el navegador puede conservar datos propios fuera del control de Rimay.

**Verificación**

```text
npm run lint
npm run typecheck
npm test -- repository
npm test -- session
npm test -- delete-local-data
npm test
npm run build
```

Inspeccionar `localStorage`, recargar, cambiar de rol, descartar una sesión y eliminar todas las sesiones.

## Incremento 9 — Revisión y resumen profesional determinista

**Objetivo**

Completar la vista profesional con intentos, procedencia, métricas, decisiones, evidencia y `summary-rules-v1`.

**Archivos previstos**

- `src/features/professional-review/`.
- Motor puro de resumen y plantillas curadas.
- Componentes de métricas, evidencia y limitaciones.
- Pruebas de estados completos y vacíos.

**Aceptación**

- La sesión recién terminada aparece primero.
- Cada intento muestra prompt, texto/procedencia, versiones, métricas, flags, decisión, explicación y “Audio no conservado”.
- Métricas, decisiones del motor, limitaciones e interpretación profesional están separadas.
- Cada observación sólo enlaza evidencia existente.
- El resumen es idéntico para el mismo `SessionBundle` y no contiene lenguaje clínico.

**Verificación**

```text
npm run lint
npm run typecheck
npm test -- summary
npm test -- professional-review
npm test
npm run build
```

Recorrer una sesión completa, cambiar a profesional y revisar estados vacío y finalizado.

## Incremento 10 — Accesibilidad, errores, privacidad y auditoría de costo

**Objetivo**

Falsificar los flujos, completar el endurecimiento WCAG 2.2 AA y demostrar ausencia de servicios cobrables.

**Archivos previstos**

- Componentes compartidos de estado y error.
- Matriz de copy en español y filtro editorial.
- Pruebas de teclado, foco, anuncios, límites, procedencia y contenido prohibido.
- Documentación de auditoría de privacidad y costo.

**Aceptación**

- Todos los errores del PRD tienen mensaje, acción y foco predecible.
- La aplicación funciona por teclado, con zoom 200 %, reflow y contraste AA.
- Controles principales miden al menos 44 px y el foco no queda oculto.
- No hay contenido dependiente sólo de color, audio o reconocimiento.
- Consola, red, almacenamiento y build no exponen claves, audio, textos o documentos completos.
- Búsquedas no encuentran SDKs/endpoints de OpenAI, Supabase, APIs comerciales ni recursos Vercel facturables.
- Demo funciona sin red después de cargar assets.

**Verificación**

```text
npm run lint
npm run typecheck
npm test
npm run build
```

Completar matriz manual de Chrome/Edge, teclado, lector de pantalla, zoom, micrófono, Web Speech, red, Storage y eliminación local.

## Incremento 11 — Documentación final, Vercel Hobby y ensayo

**Objetivo**

Cerrar la entrega reproducible con README, build estático, despliegue Vercel Hobby, guion y declaraciones públicas exactas.

**Archivos previstos**

- `README.md` y actualización final de arquitectura/notas.
- Configuración mínima de Vercel sólo si es necesaria para la SPA.
- Fixtures y pruebas finales necesarias para criterios de aceptación.
- Guion de demo, auditoría de costo y texto de Devpost.

**Aceptación**

- Una persona nueva puede instalar, probar y ejecutar Rimay sin secretos, cuentas de API o tarjeta.
- El build desplegado contiene sólo archivos estáticos y usa el subdominio gratuito de Vercel.
- El proyecto permanece en Hobby sin prueba Pro, Functions, add-ons, Storage, analytics pagos o dominio comprado.
- Preview y producción completan demo sin red después de cargar assets; browser/manual funcionan con su aviso.
- El guion principal dura aproximadamente 90 segundos y tiene ruta manual de recuperación.
- README enumera límites de `SpeechRecognition`, privacidad, eliminación local, límites médicos y límites de Hobby.
- Devpost dice que Rimay fue construido con Codex y asistencia de GPT-5.6, y que el motor runtime es local, determinista y gratuito.
- Devpost no atribuye feedback, resumen o transcripción runtime a GPT-5.6 u OpenAI.
- Todas las historias y criterios del PRD están trazados a pruebas o verificación manual.

**Verificación**

```text
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

Ejecutar el build local y desplegado, el guion, la matriz de errores, eliminación local, inspección de Network/Storage y revisión del panel Hobby. Si una acción solicita tarjeta o plan pago, detenerla y registrar que queda fuera de alcance.

## Condición de cierre global

La construcción termina cuando el incremento 11 cumple su aceptación y el responsable aprueba la demostración. Cualquier uso con personas o datos reales, persistencia remota, autenticación, audio histórico, servicio cobrable o afirmación clínica requiere un proyecto posterior con alcance, seguridad, presupuesto y revisión profesional propios.
