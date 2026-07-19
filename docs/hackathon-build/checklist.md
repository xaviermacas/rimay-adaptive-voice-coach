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

**Estado: COMPLETADO — 2026-07-18**

La autorización expresa para implementar exclusivamente este incremento se recibió el 2026-07-18. La primera validación manual reveló una ambigüedad de procedencia y motivó guardas adicionales de calidad para WPM. La corrección, la verificación automatizada y la revalidación manual final fueron completadas correctamente; la evidencia observada quedó registrada en `build-notes.md`.

**Objetivo**

Resolver el principal riesgo restante sin servicios contratados: ejecutar `BrowserSpeechRecognizer` en paralelo con `MediaRecorder`, proporcionar `DemoSpeechRecognizer` y entrada manual, y producir `text-metrics-v1` local y determinista.

**Áreas implementadas**

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
- WPM usa `transcribedWordCount / (totalDurationMs / 60_000)` únicamente con una grabación real, duración válida y actividad de voz suficiente. Entrada manual sin captura, demo sin audio real, `no_speech_detected`, `too_quiet` y voz estimada bajo el umbral configurado producen `null`; `estimatedSpeechDurationMs` nunca es el denominador.
- Las métricas indican fuente y no se presentan como evaluación clínica. La ruta manual declara que compara texto escrito por el usuario y que no verificó su correspondencia con el audio.
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

Resultado observado el 2026-07-18:

- [x] `npm.cmd run lint`: código 0, sin errores ni advertencias.
- [x] `npm.cmd run typecheck`: código 0.
- [x] Pruebas específicas de normalización, métricas, reconocedores, hook e integración: aprobadas durante el desarrollo.
- [x] `npm.cmd test`: 12 archivos y 117 pruebas aprobadas después de la corrección de validación manual.
- [x] `npm.cmd run build`: código 0, 39 módulos transformados.
- [x] `git diff --check`: sin errores.
- [x] Sin cambios en `package.json` o `package-lock.json`; no se añadieron dependencias.
- [x] Búsqueda en `src/`: sin `fetch`, persistencia, SDKs comerciales, contratos heredados de transcripción ni servicios runtime nuevos.

**Corrección posterior a la validación manual**

- [x] La ayuda de entrada manual pide declarar exactamente las palabras pronunciadas, incluidas omisiones y adiciones, y desaconseja copiar automáticamente la frase objetivo.
- [x] El resumen muestra la fuente y usa etiquetas distintas para texto manual, reconocido y simulado; la ruta manual advierte que Rimay no verificó el contenido contra la grabación.
- [x] WPM manual queda no disponible con `no_speech_detected`, `too_quiet` o voz estimada bajo el umbral vigente; con audio elegible conserva la duración total como denominador y explica que el conteo procede del texto declarado.
- [x] La investigación automatizada cubre un final de diez palabras, más de diez palabras en dos segmentos, provisional seguido de final, varios eventos finales, palabras adicionales, final dentro de 500 ms y resultado posterior al cierre.
- [x] No existe recorte a siete palabras, límite de caracteres o ajuste al objetivo en la ruta browser. Se conserva `continuous: false` para el ejercicio corto; el comportamiento observado se atribuye probablemente al cierre de sesión del navegador.
- [x] Verificación final: lint sin errores ni advertencias; typecheck código 0; 12 archivos y 117 pruebas aprobadas; build con 39 módulos transformados; `git diff --check` sin errores.
- [x] La revalidación manual confirmó procedencia, advertencia y métricas manuales; una captura silenciosa mostró ambas alertas de calidad y WPM no disponible.
- [x] La revalidación conservó frases de más de siete palabras sin pausa extensa, confirmó que una pausa extensa puede cerrar la sesión única del navegador y no encontró truncación propia de Rimay.

**Verificación manual**

- [x] El aviso de privacidad apareció y requirió aceptación explícita; la frase objetivo fue reconocida y se detectaron omisiones y adiciones.
- [x] Frases de más de siete palabras se conservaron sin pausa extensa; una pausa extensa pudo finalizar la sesión no continua y no se observó truncación propia de Rimay.
- [x] La entrada manual mostró fuente, advertencia y comparación correctas sin atribuir verificación al audio.
- [x] Una captura silenciosa mostró actividad insuficiente, nivel demasiado bajo y WPM no disponible.
- [x] Un reconocimiento fallido o finalizado conservó la grabación y la entrada manual; demo permaneció rotulado como simulación.
- [x] Network, Storage y consola no mostraron envíos propios, persistencia temporal ni errores; descartar eliminó grabación, texto y métricas.

**Condición de parada**

**Cierre:** el responsable confirmó la revalidación manual final del incremento 3. La evidencia se registró en `build-notes.md`; no se autoriza ni se inicia el incremento 4 mediante este cierre.

## Incremento 4 — Motor determinista de retroalimentación y adaptación

**Estado: COMPLETADO — 2026-07-18**

**Objetivo**

Implementar `coach-rules-v1` como función pura con plantillas curadas, razones verificables y selección limitada al catálogo permitido.

**Archivos previstos**

- Contratos y configuración de versión en `src/domain/coaching/`.
- Catálogo versionado de plantillas no clínicas.
- Función pura y exportada de selección de candidatos en `src/domain/exercises/`.
- Pruebas de reglas, umbrales, órdenes y contenido editorial.

**Aceptación**

- `CoachInput` contiene `currentExercise`, métricas de audio y texto, procedencia, dificultad actual, `validAttemptCountBeforeCurrent`, `coveredExerciseTypesBeforeCurrent` y `allowedExercises: readonly Exercise[]`.
- Cuando existen métricas textuales, `textMetrics.targetText` coincide exactamente con `currentExercise.targetText`; cualquier diferencia, incluida puntuación, devuelve `inconsistent_text_metrics` antes de usar esas métricas.
- `validAttemptCountBeforeCurrent` es un entero entre `0` y `4` que cuenta sólo intentos válidos terminados antes del actual. Calidad bloqueante no lo incrementa; el intento actual válido completa la sesión cuando el contador anterior más uno es `5`.
- La cobertura anterior contiene tipos únicos de intentos válidos previos en orden canónico. Para contadores `0`, `1` y `2` es respectivamente `[]`, `['word_repetition']` y `['word_repetition', 'phrase_repetition']`; con contador `3` o `4` contiene los tres tipos. Mientras el contador sea menor que `3`, `currentExercise.type` es el siguiente tipo obligatorio; una incoherencia produce `invalid_attempt_state`.
- El motor añade conceptualmente `currentExercise.type` sólo para un intento válido y garantiza `word_repetition`, `phrase_repetition`, `guided_reading` en ese orden.
- Si falta un tipo obligatorio y `allowedExercises` no contiene uno de ese tipo, `CoachResult` devuelve `missing_required_exercise_type`; no existe fallback.
- La misma entrada produce el mismo `CoachResult` completo.
- Cada salida declara `rulesVersion`, `ruleId`, `templateId`, acción, explicación y evidencia.
- Los errores esperables usan la rama tipada `ok: false` con, como mínimo, `invalid_input`, `invalid_attempt_state`, `incompatible_algorithm_version`, `empty_allowed_exercises`, `duplicate_exercise_id`, `invalid_exercise`, `missing_required_exercise_type`, `inconsistent_audio_metrics` e `inconsistent_text_metrics`.
- `qualityFlags` es la fuente canónica y usa exactamente `no_speech_detected`, `too_quiet`, `possible_clipping`, `audio_too_short` y `transcription_missing`. Los cuatro primeros o `silenceRatio >= 0.85` producen `repeat_current`; `transcription_missing`, ausencia de texto o similitud `null` no son mala captura.
- Una contradicción entre un booleano acústico derivado y su flag produce `inconsistent_audio_metrics`.
- Mensajes provienen sólo de plantillas curadas y no contienen afirmaciones diagnósticas.
- Las plantillas dicen “texto reconocido” para `browser`, “texto introducido” para `manual` y “texto simulado” para `demo`; no atribuyen texto manual o demo al análisis de pronunciación y separan evidencia acústica de evidencia textual.
- La regla `continue_follow_pause_cues` exige lectura guiada, `pauseCues.length > 0` y `pauseCount === 0`; sin marcas de pausa continúa con la siguiente prioridad.
- Cada plantilla declara sólo evidencia que respalda su mensaje o explicación. `pauseCues` y `expectedMaxDurationMs` son claves válidas; las plantillas textuales usan sólo `textSimilarity` y la plantilla sin texto no declara evidencia textual.
- La evaluación sigue este orden: validación, calidad acústica, contabilización conceptual del intento válido, finalización, cobertura, dificultad, foco, ordenamiento, selección y plantilla.
- Sólo se seleccionan IDs de `allowedExercises`; lista vacía produce `empty_allowed_exercises` e IDs duplicados producen `duplicate_exercise_id`.
- La política ordena copias sin mutar la entrada: tipo obligatorio pendiente, distancia a dificultad objetivo, evitar el ID actual, tipo en orden canónico, dificultad e ID mediante comparación ordinal con `<` y `>`, nunca `localeCompare`.
- Si sólo existe el ejercicio actual y no falta un tipo obligatorio, puede seleccionarse nuevamente.
- `repeat_current` contiene `selectedExerciseId: null`, es sólo una recomendación y nunca inicia repetición. Repetición y avance requieren acción del usuario.
- No existe GPT, red, aleatoriedad no controlada o fallback remoto.

**Verificación**

```text
npm run lint
npm run typecheck
npm test -- coaching
npm test -- adaptation
npm test -- candidatePolicy
npm test
npm run build
```

Ejecutar fixtures de cada rama, límites exactos, frontera del quinto intento, contador y cobertura, todos los errores tipados y catálogo adversarial; repetir entradas para comparar igualdad profunda y comprobar que `allowedExercises` no se muta.

**División interna del incremento**

- Tramo A: contratos, validación, configuración y plantillas.
- Tramo B: reglas, adaptación, selección y matriz adversarial.
- Ambos tramos pertenecen al mismo incremento 4. No se crean commits parciales salvo autorización posterior y el incremento no se considera aceptado hasta completar ambos.

**Evidencia de implementación automática — 2026-07-18**

- [x] Los contratos preliminares incompatibles se sustituyeron por `ExerciseType`, `Difficulty`, `Exercise`, `CoachInput`, `CoachDecision`, `CoachError` y `CoachResult` canónicos; el motor usa el nombre real `DeterministicMetrics` para `audio-metrics-v1`.
- [x] El tramo A implementó validación runtime sin mutación, configuración versionada, 11 plantillas estáticas `coach-templates-v1` y filtro editorial explícito. Su puerta intermedia terminó con `npm.cmd run typecheck` en código 0 y 39 pruebas dirigidas aprobadas.
- [x] El tramo B implementó `coach-rules-v1`, dificultad 1–3, prioridad de focos, cobertura conceptual, quinto intento válido y política pura exportada de candidatos desde `src/domain/exercises/`.
- [x] La matriz automática cubre umbrales exactos, flags individuales y combinados, errores tipados, cobertura, catálogo adversarial, procedencias, evidencia, determinismo, ausencia de fecha/aleatoriedad e inmutabilidad.
- [x] Verificación final del código: lint y typecheck en código 0; coaching 84/84; adaptación 13/13; candidatos 10/10; suite completa 17 archivos y 211/211 pruebas; build de producción correcto.
- [x] Revisión manual/editorial técnica realizada por el desarrollador sobre plantillas, ejemplos de decisión, evidencia y tono. Los hallazgos detectados se corrigieron antes de la revalidación final; no se realizó revisión clínica o profesional externa.

**Corrección de hallazgos de validación manual/editorial — 2026-07-18**

- [x] Se añadió `inconsistent_text_metrics` y la igualdad exacta de `targetText`, sin normalización silenciosa ni uso posterior de métricas incoherentes.
- [x] La regla de pausas exige marcas no vacías y sus evidencias quedan limitadas a `pauseCount` y `pauseCues`.
- [x] Las plantillas de similitud baja, ritmo, finalización, continuación con texto y continuación sin texto usan el copy y la evidencia editorial corregidos.
- [x] El catálogo valida automáticamente la política exacta de evidencia, incluidas `pauseCues` y `expectedMaxDurationMs`.
- [x] La matriz parametrizada de determinismo cubre cinco ramas con misma referencia, copia profunda, catálogo invertido e inmutabilidad.
- [x] Verificación posterior a la corrección: lint y typecheck en código 0; coaching 104/104; adaptación 15/15; candidatos 10/10; suite completa 17 archivos y 231/231 pruebas; build de producción con 39 módulos transformados.
- [x] La revalidación manual/editorial técnica final produjo el dictamen `APTO PARA CERRAR`; las 11 plantillas fueron aprobadas y no quedaron observaciones ni defectos materiales pendientes.

**Evidencia de revalidación manual/editorial final y cierre — 2026-07-18**

- [x] Las 11 plantillas fueron aprobadas. Browser usa “texto reconocido”, manual “texto introducido” y demo “texto simulado”; no aparece “Continúa y repite” ni lenguaje diagnóstico, de severidad, pronóstico, tratamiento, prescripción o clasificación clínica.
- [x] Cuando existen métricas textuales, `textMetrics.targetText` debe ser idéntico a `currentExercise.targetText`, incluida la puntuación. Cualquier diferencia devuelve `inconsistent_text_metrics` antes de dificultad, foco, plantilla, evidencia o selección; `textMetrics: null` no activa esta validación.
- [x] `continue_follow_pause_cues` exige conjuntamente `currentExercise.type === 'guided_reading'`, `currentExercise.pauseCues.length > 0` y `audioMetrics.pauseCount === 0`; ante pausas, duración extensa y similitud baja prevalece el foco de pausas.
- [x] Explicaciones y evidencias quedaron alineadas: pausas usa sólo `pauseCount` y `pauseCues`; ritmo, `totalDurationMs` y `expectedMaxDurationMs`; finalización, `validAttemptCountBeforeCurrent`, `qualityFlags` y `silenceRatio`; las plantillas textuales, sólo `textSimilarity`; la variante sin texto no declara evidencia textual.
- [x] La matriz reforzada confirmó en cinco ramas dos evaluaciones de la misma referencia, copia profunda, catálogo invertido, igualdad profunda y ausencia de mutación del input y sus arrays.
- [x] La auditoría de pureza no encontró en producción red, persistencia, reloj, aleatoriedad, APIs del navegador, React, Supabase, OpenAI ni `localeCompare`. Las referencias a fecha y aleatoriedad permanecen sólo como guardas negativas en pruebas.
- [x] Verificación final: lint y typecheck en código 0; coaching 4 archivos y 104/104 pruebas; adaptación 1 archivo y 15/15; candidatos 1 archivo y 10/10; suite completa 17 archivos y 231/231; build de producción con 39 módulos transformados; `git diff --check` en código 0 sin errores de whitespace.
- [x] La revisión fue técnica y editorial y la realizó el desarrollador. No hubo revisión clínica o profesional externa; el filtro léxico no sustituye una revisión profesional y los umbrales son reglas de interacción no clínicamente validadas.

**Cierre:** el incremento 4 queda completado con dictamen `APTO PARA CERRAR`. El incremento 5 no se inició ni se autoriza mediante este cierre.

## Incremento 5 — Recorrido vertical de un intento

**Estado: COMPLETADO — 2026-07-19**

**Objetivo**

Integrar un solo intento actual de palabra mediante este recorrido:

```text
instrucción
→ elección de procedencia
→ captura real o fixture demo
→ audio-metrics-v1
→ texto final opcional
→ text-metrics-v1 o null
→ CoachInput
→ coach-rules-v1
→ CoachResult
→ feedback escrito
→ acción explícita
```

Browser requiere grabación real local e inicia `SpeechRecognition` en paralelo cuando está disponible y autorizado. Manual requiere grabación real para construir `CoachInput`; su texto es declarado y no verificado contra el audio. Demo conserva la garantía de no solicitar micrófono y usa un fixture local determinista de `DeterministicMetrics`, un `SpeechTextResult` predefinido con `source: 'demo'` y métricas textuales locales, sin `Blob` de usuario, red o WPM.

El incremento no incluye una segunda captura después de continuar, sesión de cinco intentos, historial, biblioteca final, `SpeechSynthesis`, persistencia, vista profesional, `summary-rules-v1`, backend, Supabase u OpenAI API.

**Archivos previstos**

- Máquina de estados en `src/features/practice/`.
- Composición de captura, reconocedores y motor local.
- Componentes mínimos del flujo paciente.
- Fixture temporal definido fuera de React con una palabra actual y al menos una frase permitida.
- Pruebas de integración con Testing Library.

**Contratos y orquestación**

- Se permiten `PracticeAttemptState`, `PracticeAttemptError` y `CoachEvidenceViewItem` como contratos efímeros de aplicación.
- No se añaden `Attempt`, `Session`, historial, repositorios, resúmenes, contratos persistidos ni contratos de síntesis de voz.
- La fase principal es una unión discriminada equivalente a `instruction`, `privacy_choice`, `requesting_permission`, `recording`, `recorded`, `awaiting_text`, `ready_to_analyze`, `analyzing`, `decision_ready`, `recoverable_error` y `selection_preview`.
- `attemptId` usa un contador monotónico local, permanece estable durante el intento y se renueva al repetir, descartar o iniciar uno nuevo. No usa fecha, UUID o aleatoriedad.
- Un token de generación invalida resultados tardíos. Repetir, descartar y continuar invalidan todo trabajo pendiente.
- `evaluateCoach` se ejecuta una sola vez desde “Analizar intento”, nunca desde un efecto reactivo; un doble clic durante análisis se ignora.
- El `CoachInput` y la decisión se conservan como snapshot hasta una acción explícita.
- El catálogo temporal usa `Exercise`, está etiquetado como fixture y permite seleccionar una frase después de la palabra. No sustituye la biblioteca del incremento 6.

**Acciones**

- `repeat_current` muestra “Repetir este intento”, limpia recursos y resultado, conserva el ejercicio actual, vuelve al inicio y espera una nueva acción. No inicia captura o reconocimiento.
- “Continuar de todas formas” después de `repeat_current` pertenece al incremento 7.
- `continue` valida el ID seleccionado, limpia los recursos y termina en una vista previa. No inicia otra grabación, no activa sesión, no incrementa contadores y no vuelve a ejecutar el motor.
- Con contador anterior `0`, `complete_session` es inalcanzable. Si aparece, produce `unexpected_coach_action` en un estado recuperable y no muestra sesión, resumen o ejercicio seleccionado.
- Un candidato ausente del catálogo produce un error de aplicación tipado; nunca se aplica silenciosamente.

**Aceptación**

- Un intento browser completo usa grabación local y métricas acústicas reales.
- Un intento manual completo usa audio real y texto declarado; la UI dice que no fue verificado contra el audio.
- Manual sin captura puede conservar la comparación textual técnica existente, pero no construye `CoachInput` ni ejecuta coaching.
- Demo funciona sin micrófono, `Blob` de usuario, WPM, red o `fetch`; muestra “Este recorrido utiliza datos simulados.”, “No se grabó ni analizó su voz.” y “El texto simulado no procede de audio.”
- El fixture demo de `DeterministicMetrics` declara `audio-metrics-v1`, se presenta como simulado y no como medición real.
- Un provisional nunca se usa para métricas o coaching.
- Cuando no existe final y el usuario elige continuar sin texto, `textSource` y `textMetrics` son `null`.
- El motor se ejecuta exactamente una vez por activación de “Analizar intento”.
- `repeat_current` espera una acción humana, limpia el intento y no inicia automáticamente captura o reconocimiento.
- `continue` valida que `selectedExerciseId` pertenezca al fixture temporal, limpia recursos y termina en `selection_preview`.
- No se inicia una segunda grabación ni se ejecuta otra vez el motor después de continuar.
- Un error de coaching no produce feedback parcial ni un ejercicio inventado.
- Un `complete_session` inesperado falla con `unexpected_coach_action` sin afirmar que existe una sesión completada.
- La decisión renderizada coincide con `coach-rules-v1`; mensaje, explicación, foco, acción, versión, procedencia y evidencia proceden del snapshot real.
- Cada evidencia visible tiene etiqueta, valor y unidad; no se muestran claves internas sin traducción.
- La UI no presenta similitud como precisión clínica, manual como transcripción, demo como audio reconocido ni calidad bloqueante como evaluación de la persona.
- Limpiar revoca `Blob` y URL cuando correspondan, libera recursos e ignora resultados tardíos.
- La reproducción no cambia de fase por sí sola y un fallo acústico conserva el reproductor cuando siga siendo utilizable.
- No existe persistencia, red propia, sesión, resumen, voz de salida ni cambios en el dominio cerrado de los incrementos 1–4.
- El límite vigente de 10 MB no cambia; si descarta la captura, la UI permite comenzar nuevamente sin culpar al usuario. La revisión de esa política queda para el incremento 10.

**Verificación**

```text
npm run lint
npm run typecheck
npm test -- practice
npm test
npm run build
```

Recorrer demo sin red, browser y manual; inspeccionar red, consola y almacenamiento.

**División interna del incremento**

- Tramo A: fixture temporal, contratos de aplicación, máquina de estados, construcción de `CoachInput`, evaluación única, errores y pruebas del controlador.
- Tramo B: composición React, feedback, evidencia, acciones explícitas, limpieza, pruebas de integración y validación Chrome/Edge.
- Ambos tramos pertenecen al mismo incremento formal. No se crean commits parciales salvo autorización posterior y el incremento no se considera aceptado hasta completar ambos.

**Resultado automático observado**

- [x] Tramo A: fixture temporal, contratos de aplicación, unión discriminada, identidad monotónica, generación, errores, construcción de `CoachInput`, resolución exhaustiva de evidencia y controlador implementados.
- [x] Corte obligatorio del tramo A: `npm.cmd run typecheck` terminó con código 0 y `npm.cmd test -- practice` aprobó inicialmente 4 archivos y 11 pruebas antes de iniciar React.
- [x] Tramo B: `PracticeAttemptFlow` es el único recorrido principal de `App`; integra browser, manual y demo, feedback escrito, evidencia traducida, reproducción local, acciones explícitas, preview, foco y errores recuperables.
- [x] Demo carga `DeterministicMetrics` y `SpeechTextResult` locales sin llamar micrófono, `MediaRecorder`, `SpeechRecognition`, analizador Web Audio o red; WPM permanece `null`.
- [x] Browser exige consentimiento, no usa provisionales para métricas y conserva la captura ante ausencia de texto final; manual exige captura y texto confirmado para coaching.
- [x] `evaluateCoach` se invoca únicamente desde el manejador de “Analizar intento”; doble activación, resultados tardíos y resoluciones tras desmontar quedan invalidados.
- [x] `repeat_current` y `continue` esperan clic; repetir crea otro ID sin iniciar captura y continuar valida el catálogo, limpia recursos y termina en preview sin segundo intento.
- [x] `complete_session` inesperado y selección inválida producen errores recuperables sin feedback parcial.
- [x] La limpieza central revoca URL, libera `Blob`, pistas y reconocimiento, borra estado temporal e invalida trabajos pendientes al repetir, descartar, continuar o desmontar.
- [x] Verificación automática preliminar: lint y typecheck con código 0; suite completa con 22 archivos y 251/251 pruebas; build estático con 54 módulos transformados.
- [x] Verificación automática final posterior a documentación: lint y typecheck con código 0; práctica 5 archivos y 20/20 pruebas; regresiones dirigidas de App, grabación y reconocimiento 5 archivos y 39/39 pruebas; suite completa 22 archivos y 251/251; build con 54 módulos transformados; `git diff --check` sin errores.
- [x] `package.json` y `package-lock.json` permanecen sin cambios; no se añadieron dependencias, persistencia, Supabase, OpenAI, backend ni voz de salida.
- [x] Validación manual técnica y funcional completada correctamente en Chrome y Edge: rutas browser/manual/demo, captura silenciosa, reproducción, limpieza, Console, Network, Storage, teclado, foco, zoom 200 % y reflow; no se observaron errores.

**Evidencia de validación manual final — 2026-07-19**

- [x] Chrome y Edge aprobaron el recorrido browser completo con consentimiento obligatorio, grabación y reproducción locales, métricas acústicas, resultado final y métricas textuales. El provisional permaneció sólo visible y nunca se evaluó como final.
- [x] Browser sin texto produjo `textSource: null` y `textMetrics: null`. Un fallo de reconocimiento conservó la captura y permitió cambiar a entrada manual.
- [x] Se mantuvo visible que `SpeechRecognition` puede utilizar servicios remotos propios del navegador. La inspección de Network confirmó que Rimay no realizó solicitudes propias para enviar audio, texto, métricas o decisiones.
- [x] Manual con audio real produjo coaching y mostró que el texto fue introducido por el usuario y no se verificó contra la grabación. Manual sin captura no construyó `CoachInput` ni ejecutó coaching.
- [x] Demo utilizó únicamente fixtures locales simulados: no solicitó micrófono ni usó `MediaRecorder`, `SpeechRecognition`, `Blob` del usuario o red; los tres avisos de simulación aparecieron correctamente.
- [x] Una captura silenciosa produjo `repeat_current`. “Repetir este intento” exigió clic, limpió el estado y no inició automáticamente otra grabación.
- [x] `continue` exigió clic, limpió los recursos y terminó en `selection_preview` para “Camino con calma.” sin segunda captura, sesión o nueva evaluación.
- [x] Feedback, explicación, foco, procedencia y evidencia coincidieron con el snapshot original; no se observaron decisiones duplicadas.
- [x] El micrófono se liberó al detener, descartar, repetir y continuar. Consola quedó sin errores y Local Storage, Session Storage e IndexedDB permanecieron sin datos nuevos.
- [x] Navegación por teclado, foco dirigido, zoom al 200 % y reflow fueron aprobados en ambos navegadores.
- [x] La validación fue técnica y funcional. No hubo revisión clínica externa; el recorrido, las métricas y las reglas son una demostración técnica no clínicamente validada.

**Condición de cierre**

**Cierre:** el responsable confirmó la validación manual técnica y funcional final. El incremento 5 queda completado sin defectos materiales pendientes. No hubo revisión clínica externa y el incremento 6 no se inició.

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
- Integración de `coach-rules-v1`, su función pura de candidatos y el catálogo.
- Fixtures de cinco intentos y límites.
- Pruebas unitarias y de integración.

**Aceptación**

- La sesión termina con cinco intentos válidos aceptados.
- Los tres primeros cubren los tipos obligatorios.
- La similitud ajusta dificultad sólo dentro de 1–3.
- Calidad, pausas, duración y silencio seleccionan plantillas según el orden versionado.
- La acción del usuario controla repetición y avance; no existen bucles automáticos.
- Si el usuario continúa pese a `repeat_current`, la sesión usa la función pura de candidatos del incremento 4; el intento con calidad bloqueante no cuenta como válido ni aporta cobertura.
- `repeat_current` no contiene un ejercicio alternativo y nunca inicia por sí mismo una repetición o continuación.
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
