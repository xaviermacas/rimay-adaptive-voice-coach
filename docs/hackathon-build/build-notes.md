# Notas de construcción

## Registro de la fase inicial

- Fecha: 2026-07-18.
- Estado inicial observado: carpeta vacía, cero archivos y sin repositorio Git.
- Alcance ejecutado en esta fase: documentación únicamente.
- Cierre de la fase: se recibió autorización expresa posterior para ejecutar únicamente el incremento 1.

## Registro del incremento 1

- Fecha de ejecución: 2026-07-18.
- Estado: incremento 1 completado y validado manualmente por el responsable.
- Git: repositorio local inicializado en la rama `main`; el cierre se versiona con el mensaje `chore: initialize Rimay application scaffold`.
- Runtime observado: Node.js `24.15.0`; npm se ejecutó mediante `npm.cmd` porque la política de PowerShell bloquea el shim `npm.ps1`.
- Dependencias directas principales: React `19.2.7`, Vite `8.1.5`, TypeScript `6.0.3`, Tailwind CSS `4.3.3`, Vitest `4.1.10` y ESLint `10.7.0`, fijadas con versiones exactas en el lockfile.
- Compatibilidad de herramientas: no se adoptó TypeScript `7.0.2` porque `typescript-eslint 8.64.0` declara TypeScript `>=4.8.4 <6.1.0`.
- UI entregada: shell mínima en español neutro, modo `demo` visible y predeterminado, explicación previa al permiso y descargo educativo no clínico.
- Grabación entregada: `MediaRecorder`, negociación MIME, una captura simultánea, límites de 60 segundos/10 MB, errores accesibles, reproducción mediante URL temporal, audio sólo en memoria y limpieza de pistas/URL.
- Contratos entregados: tipos iniciales de dominio e interfaces preliminares para proveedores, coaching, repositorio y salida de voz; no existen implementaciones live. Los nombres orientados a un proveedor de transcripción quedaron retirados posteriormente del contrato canónico.
- Instalación: 251 paquetes añadidos, 252 auditados y 0 vulnerabilidades reportadas por npm.
- Verificación automatizada final: `npm run lint` sin errores ni advertencias; `npm run typecheck` con código 0; `npm test` con 3 archivos y 16 pruebas aprobadas; `npm run build` con 20 módulos transformados.
- Auditoría de alcance: sólo existe `.env.example`; el código y la configuración no contienen secretos, Supabase, OpenAI/GPT, `fetch`, persistencia web, Web Audio, transcripción o métricas.
- Servidor local: `http://127.0.0.1:4173` respondió HTTP 200 durante la verificación.
- Limitación observada: la automatización de Chrome rechazó el acceso a `127.0.0.1` por política empresarial y prohibió repetirlo mediante otra superficie. Por ello no se afirma validación manual en Chrome ni Edge.
- Próximo paso permitido: ninguno. El incremento 1 está cerrado y el incremento 2 requiere una nueva autorización explícita.

### Corrección del defecto de captura con permiso concedido

- Fecha: 2026-07-18.
- Defecto observado: en `http://localhost:5173`, con el permiso del micrófono ya concedido, al activar “Iniciar prueba” la interfaz permanecía en solicitud y “Detener grabación” seguía deshabilitado.
- Causa raíz: el ciclo de efectos de React `StrictMode` ejecutaba una limpieza de desarrollo que fijaba `mountedRef.current` en `false`; el montaje siguiente no lo restauraba. Cuando `getUserMedia` resolvía, el hook trataba el componente activo como desmontado, detenía el stream y retornaba sin abandonar el estado de solicitud.
- Corrección: cada montaje del efecto restaura `mountedRef.current` a `true`; el flujo usa ahora la transición `idle` → `requestingPermission` → `recording`, llama `MediaRecorder.start()` antes de habilitar la detención y presenta un mensaje inicial que no presupone un diálogo de permisos.
- Timeout defensivo: una solicitud de micrófono pendiente durante 10 segundos cambia a un error recuperable. Si esa solicitud resuelve tarde, todos sus tracks se detienen y no se crea un `MediaRecorder`.
- Limpieza: fallos de soporte, `getUserMedia`, construcción o inicio de `MediaRecorder` abandonan el estado de solicitud y liberan timers, streams y tracks disponibles.
- Concurrencia: un guard síncrono y el botón deshabilitado impiden solicitudes simultáneas ante un doble clic.
- Prueba de regresión: el caso con `StrictMode` falló antes de la corrección porque “Detener grabación” permanecía deshabilitado; pasa después de restaurar el estado de montaje.
- Verificación automatizada de la corrección: `npm.cmd run lint` y `npm.cmd run typecheck` finalizaron con código 0; `npm.cmd test` aprobó 3 archivos y 16 pruebas; `npm.cmd run build` transformó 20 módulos y finalizó con código 0.
- Estado del defecto: corregido y aprobado durante la validación manual final.

### Corrección del favicon durante la validación manual

- Fecha: 2026-07-18.
- Defecto observado: la consola mostraba `GET http://localhost:5173/favicon.ico 404 (Not Found)`; la grabación y la reproducción funcionaban correctamente.
- Causa: el proyecto no tenía un favicon declarado ni una carpeta `public`, por lo que el navegador solicitaba el recurso convencional `/favicon.ico`.
- Corrección: se añadió `public/favicon.svg`, un icono vectorial local y sin dependencias externas, y se declaró `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` dentro de `<head>`.
- Alcance: no se modificaron la grabación, los componentes React, las dependencias ni ninguna funcionalidad.
- Estado del defecto: corregido; la validación manual confirmó que el favicon carga y la consola queda sin errores.

### Validación manual final confirmada

El responsable confirmó los siguientes resultados sin observaciones pendientes:

**Chrome**

- Aplicación cargada correctamente.
- Navegación por teclado y foco visibles: aprobado.
- Permiso de micrófono aceptado: aprobado.
- Grabación y reproducción: aprobado.
- Liberación del micrófono al detener, descartar y recargar: aprobado.
- Permiso rechazado y recuperación: aprobado.
- Consola: sin errores.
- Favicon: carga correctamente, sin 404.
- Network: el audio no se envía a ningún servidor.
- Storage: sin audio, secretos ni datos sensibles.

**Edge**

- Permiso de micrófono: aprobado.
- Grabación y reproducción: aprobado.
- Liberación del micrófono: aprobado.
- Consola: sin errores.

**Cierre:** la validación manual final fue completada correctamente y el incremento 1 queda cerrado. No se autoriza trabajo del incremento 2 mediante este cierre.

## Registro del incremento 2

- Fecha de ejecución: 2026-07-18.
- Estado: incremento 2 completado y validado manualmente por el responsable.
- Autorización aplicada: exclusivamente decodificación PCM y métricas deterministas locales. No se implementaron transcripción, WPM, similitud, proveedores live, Supabase, OpenAI, adaptación, sesiones ni panel profesional.
- Dependencias: no se agregaron ni actualizaron paquetes.
- Diseño: captura, decodificación, PCM, cálculo y presentación permanecen separados. La matemática vive en `src/domain/audio/`, la configuración en `src/config/audioAnalysis.ts` y Web Audio/estado de interfaz en `src/features/audio-analysis/`.
- Versión inicial: `audio-metrics-v1`. La misma entrada PCM, frecuencia y configuración producen el mismo objeto; cualquier cambio de significado requiere una nueva versión.
- Contrato de fallo: `unsupported_audio`, `decode_failed`, `insufficient_samples`, `invalid_audio_data` e `invalid_configuration` son errores tipados y no banderas. Sin PCM válido no se crea un objeto de métricas.
- Recursos: cada análisis de Blob crea un `AudioContext` y lo cierra en `finally`, tanto en éxito como en fallo. Un resultado tardío se ignora tras reset o desmontaje; el Blob y su URL siguen bajo el ciclo de vida temporal de la grabación.
- Privacidad: no existe `fetch`, persistencia, serialización de PCM ni logs de audio. El análisis ocurre completamente en el navegador.

### Fórmulas y método de `audio-metrics-v1`

1. Se valida que la frecuencia sea un entero positivo, que exista al menos un canal y una muestra, que todos los canales tengan la misma longitud y que cada muestra sea finita dentro de `[-1, 1]`.
2. La señal mono es el promedio aritmético por posición de todos los canales: `mono[i] = sum(channel[i]) / channelCount`.
3. `sampleRateHz` y `channelCount` describen el buffer de origen. `totalDurationMs = round(sampleCount / sampleRateHz × 1000)` y `analyzedDurationMs` coincide con esa duración porque v1 analiza todas las muestras.
4. El tamaño de ventana discreto es `max(1, round(sampleRateHz × 20 / 1000))` muestras; las ventanas son consecutivas y la última puede ser menor.
5. RMS por ventana y RMS global usan `sqrt(sum(sample²) / sampleCount)`. El contrato expone el RMS global como `rms`, redondeado a seis decimales.
6. `peak = max(abs(sample))`, redondeado a seis decimales.
7. El piso estimado de ruido ordena los RMS de ventana y toma el índice `floor(0.20 × (n - 1))`. `adaptiveVoiceThresholdRms = max(0.015, estimatedNoiseFloorRms × 3)`.
8. Una ventana es actividad cuando `windowRms >= adaptiveVoiceThresholdRms`. Ventanas contiguas forman segmentos; segmentos separados por menos de 200 ms se unen y el intervalo unido forma parte de la duración estimada. Después se descartan segmentos menores de 120 ms.
9. `estimatedSpeechDurationMs` es la suma redondeada de las muestras de los segmentos finales. `silenceDurationMs` usa las muestras restantes y `silenceRatio = silenceSampleCount / totalSampleCount`, redondeado a seis decimales.
10. Una pausa es un intervalo interno entre segmentos finales de al menos 300 ms. `pauseCount` cuenta esos intervalos, `averagePauseDurationMs` redondea su media y `maximumPauseDurationMs` redondea el máximo; ambos son `null` cuando no hay pausas.
11. Una muestra cuenta como clipped si `abs(sample) >= 0.99`. `clippedSampleRatio = clippedSampleCount / totalSampleCount`, redondeado a seis decimales, y `possibleClipping` se activa cuando el ratio es mayor o igual a `0.001`.
12. Los campos textuales heredados de `audio-metrics-v1` permanecen en `null` porque este incremento no implementa reconocimiento ni métricas textuales. `text-metrics-v1` tendrá su propio contrato canónico.

### Parámetros experimentales

Estos valores son heurísticas de calidad de captura para la demostración, no están clínicamente validados y no clasifican a una persona.

| Parámetro | Valor v1 | Unidad o regla |
| --- | ---: | --- |
| Ventana | 20 | ms |
| Percentil de piso de ruido | 20 | % de RMS de ventanas |
| Umbral mínimo de voz | 0.015 | amplitud RMS relativa |
| Multiplicador de ruido | 3 | factor |
| Unión de silencio | menor de 200 | ms |
| Segmento mínimo de voz | 120 | ms |
| Pausa interna mínima | 300 | ms |
| Muestra cercana a clipping | `abs(sample) >= 0.99` | amplitud relativa |
| Ratio para posible clipping | `>= 0.001` | proporción de muestras |
| Captura demasiado corta | menor de 500 | ms |
| Voz insuficiente | menor de 300 | ms estimados |
| Captura demasiado silenciosa | RMS global menor de 0.01 | amplitud RMS relativa |

Las banderas de calidad se emiten en orden estable: `audio_too_short`, `no_speech_detected`, `too_quiet`, `possible_clipping` y `transcription_missing`. Los fallos de decodificación y las muestras insuficientes se mantienen fuera del objeto de métricas, como exige `spec.md`.

### Presentación y redondeo

- El dominio conserva duraciones en milisegundos enteros y amplitudes/ratios con seis decimales.
- La interfaz muestra duraciones con una cifra decimal en segundos, RMS y pico con tres decimales, ratios con una cifra decimal porcentual y muestreo con una cifra decimal en kHz.
- Cero pausas se presenta como `0` y duración promedio `No aplica`.
- El resultado muestra siempre `algorithmVersion` y la nota: “Estas métricas son técnicas y experimentales. No representan una evaluación clínica.”

### Pruebas y verificación automática

- Fixtures generados en memoria: silencio, seno continuo, actividad con dos pausas, brecha de 180 ms que se une, frontera exacta de 200 ms que no se une, transitorio de 100 ms, clipping total y ratio exacto, captura corta, captura silenciosa, estéreo y señales equivalentes a 8/48 kHz.
- Casos adversos: Blob vacío, decodificación rechazada, Web Audio ausente, buffer inconsistente, muestra no finita, canales de distinta longitud y configuración inválida.
- Integración: Blob de `MediaRecorder` simulado, `decodeAudioData` simulado, estado de procesamiento, resumen visible, reproductor conservado y `AudioContext.close()` observado.
- Ciclo de vida: resultado tardío ignorado y URL temporal revocada al desmontar durante el análisis.
- `npm.cmd run lint`: código 0, sin errores ni advertencias.
- `npm.cmd run typecheck`: código 0.
- `npm.cmd test -- audio`: 3 archivos y 37 pruebas aprobadas.
- `npm.cmd test`: 5 archivos y 41 pruebas aprobadas.
- `npm.cmd run build`: 28 módulos transformados; build Vite completado.

### Limitaciones y riesgos pendientes

- El percentil 20 se calcula sobre todas las ventanas, exactamente como define v1. Una señal continua y uniforme sin tramos de menor nivel puede elevar el piso estimado y quedar bajo `no_speech_detected`; cambiar la estimación requeriría `audio-metrics-v2` y nuevos fixtures.
- `excessive_silence` no se emite porque v1 no define un umbral para esa clasificación. Se exponen `silenceDurationMs`, `silenceRatio` y `no_speech_detected` sin inventar otro límite.
- La compatibilidad real de codecs depende de Chrome/Edge y debe confirmarse con grabaciones reales; las pruebas automatizadas simulan la decodificación.
- La duración capturada mediante reloj y la duración PCM decodificada pueden diferir ligeramente por el contenedor y la decodificación del navegador. La diferencia observada durante la validación manual se considera una limitación técnica esperada, no un defecto.
- `decodeAudioData` no ofrece cancelación portable. Al descartar o desmontar, Rimay ignora el resultado tardío y espera el cierre seguro del contexto.
- No existe interpretación clínica, transcripción, WPM, reconocimiento de palabras ni análisis fonético.

### Validación manual final confirmada

El responsable confirmó los siguientes resultados reales:

**Chrome — grabación con voz**

- Duración capturada: 14.3 s.
- Duración analizada: 13.9 s.
- RMS global: 0.045.
- Pico máximo: 0.493.
- Tiempo estimado de voz: 8.3 s.
- Se detectó una pausa interna.
- Duración promedio de pausa: 1.3 s.
- Proporción de silencio: 40.7 %.
- Sin alertas técnicas.
- La reproducción local fue audible.
- “Analizar nuevamente” funcionó.
- “Descartar y grabar de nuevo” funcionó.

**Chrome — grabación en silencio**

- Duración capturada: 5.6 s.
- Duración analizada: 5.2 s.
- RMS global: 0.000.
- Pico máximo: 0.002.
- Tiempo estimado de voz: 0.0 s.
- Pausas detectadas: 0.
- Proporción de silencio: 100 %.
- Se mostró correctamente que no se detectó suficiente actividad de voz.
- Se mostró correctamente que el nivel de captura fue demasiado bajo.

**Validación adicional**

- Una grabación con una pausa deliberada detectó correctamente la pausa.
- La consola permaneció sin errores.
- El análisis no generó solicitudes de red.
- No apareció audio, PCM ni métricas persistidas en Storage.
- El audio permaneció únicamente en memoria.
- El flujo fue comprobado también en Edge.
- No se observaron errores de codec durante la prueba.

La diferencia pequeña entre duración capturada y duración decodificada se considera esperable por el contenedor y la decodificación del navegador. Se registra como limitación técnica conocida, no como un defecto.

**Cierre:** la validación manual final fue completada correctamente y el incremento 2 queda cerrado. No se autoriza trabajo del incremento 3 mediante este cierre.

## Registro de la pausa documental antes del incremento 3

- Fecha: 2026-07-18.
- Estado: revisión documental de costo USD 0 completada; implementación del incremento 3 no iniciada y no autorizada mediante esta revisión.
- Alcance ejecutado: únicamente `AGENTS.md` y los cinco documentos normativos bajo `docs/hackathon-build/`.
- Motivo: decisión confirmada de no usar servicios de pago, facturación, pruebas temporales, créditos promocionales ni proveedores que exijan tarjeta.
- Arquitectura retirada del plan: OpenAI API, `gpt-4o-transcribe`, GPT-5.6 API, Responses API, Supabase y las Edge Functions `transcribe-attempt`, `coach-attempt` y `summarize-session`.
- Arquitectura de reconocimiento nueva: `BrowserSpeechRecognizer` sobre `SpeechRecognition` o `webkitSpeechRecognition`, `DemoSpeechRecognizer` determinista sin audio/red y entrada manual siempre disponible.
- Privacidad: el `Blob` de `MediaRecorder` permanece exclusivamente en memoria; Rimay no lo envía ni almacena. La UI debe advertir que el navegador podría usar un servicio remoto propio para reconocimiento.
- Procesamiento nuevo: `text-metrics-v1` calcula normalización, tokens, WPM, similitud, coincidencias, omisiones y adiciones localmente.
- Coaching nuevo: `coach-rules-v1` y `summary-rules-v1` usan reglas versionadas, plantillas curadas, evidencia y catálogo permitido; no existe IA runtime.
- Infraestructura nueva: SPA estática en Vercel Hobby, sin Functions, add-ons, dominios comprados, backend o almacenamiento remoto.
- Persistencia: `rimay.demo.v1` conserva sólo sesiones ficticias y datos derivados permitidos; se añadió eliminación completa de datos locales.
- Herramientas de construcción: Codex y GPT-5.6 se documentan únicamente como asistencia durante diseño, implementación, revisión, pruebas y documentación.
- Devpost: queda prohibido afirmar que GPT-5.6 genera feedback o resúmenes en runtime; debe describirse el motor local, determinista y gratuito.
- Verificación documental ejecutada: los seis archivos requeridos existen; las referencias a servicios retirados aparecen sólo como historial, exclusión o prueba negativa; los bloques de código están balanceados; `git diff --check` no reportó errores; el diff contiene exclusivamente `AGENTS.md` y los cinco documentos solicitados.
- Comandos de producto: no se ejecutaron `npm run lint`, `npm run typecheck`, `npm test` ni `npm run build` porque esta pausa no modificó código y el flujo documental ordena sustituirlos por comprobaciones de cobertura y consistencia.
- Git: no se creó commit y el incremento 3 permanece sin iniciar.

## Resolución canónica de texto previa al incremento 3

- Fecha: 2026-07-18.
- Alcance: corrección exclusivamente documental de `spec.md`, `checklist.md` y `build-notes.md`; no se escribió código, no se modificaron dependencias y no se inició el incremento 3.
- Contrato: `SpeechTextResult` es el resultado multifuente canónico para `browser`, `manual` y `demo`. Conserva `originalText`, `normalizedText`, `comparisonText`, `source`, `languageRequested`, `isFinal`, `warnings` y `createdAt`.
- Estados y errores: soporte ausente, cancelación y fallos permanecen fuera del resultado textual y se modelan mediante estado y código tipados. Sólo un resultado final no vacío puede convertirse en texto estable.
- Contratos retirados: los nombres heredados orientados a un proveedor de transcripción dejan de formar parte de la arquitectura canónica.
- Normalización: `originalText` no cambia; `normalizedText` usa NFC, minúsculas, puntuación reemplazada por espacios y espacios colapsados, conservando tildes, diéresis y `ñ`; `comparisonText` elimina tildes y diéresis únicamente para comparar y protege `ñ` para mantenerla distinta de `n`.
- Alineamiento: `text-metrics-v1` usa programación dinámica por palabras con `match`, `substitution`, `omission` y `addition`, todas de costo uno salvo la coincidencia de costo cero. El backtracking desempata en ese mismo orden.
- Fórmulas: `wordErrorCount = substitutions + omissions + additions`, `wordErrorRate = wordErrorCount / targetWordCount` y `textSimilarity = max(0, 1 - wordErrorRate)`. WER puede superar `1`; la similitud queda entre `0` y `1`; un objetivo vacío produce `empty_target` sin métricas fabricadas.
- WPM: `wordsPerMinute = transcribedWordCount / (totalDurationMs / 60_000)`. Requiere grabación real y duración positiva; demo sin audio real y entrada manual sin captura producen `null`. El tiempo estimado de voz no interviene en esta fórmula.
- Git: los cambios permanecen sin commit. El incremento 3 continúa pendiente de autorización expresa.

## Registro de implementación del incremento 3

- Fecha de ejecución: 2026-07-18.
- Estado: incremento 3 completado; la implementación, la verificación automatizada y la revalidación manual final fueron aprobadas por el responsable.
- Autorización aplicada: exclusivamente reconocimiento opcional del navegador, fixture demo, entrada manual, coordinación con la captura existente y `text-metrics-v1`. No se inició el incremento 4.
- Dependencias: no se agregaron ni actualizaron paquetes; `package.json` y `package-lock.json` permanecen sin cambios.
- Contratos: `SpeechTextResult` es el resultado canónico multifuente. Se retiraron del código los contratos preliminares orientados a proveedores y se añadieron procedencia, estados, errores, callbacks y ciclo de vida de reconocimiento.
- Reconocimiento browser: `BrowserSpeechRecognizer` detecta primero `SpeechRecognition` y después `webkitSpeechRecognition`, solicita `es-EC`, habilita provisionales, limita alternativas a una y usa una sesión no continua. Traduce soporte ausente, permiso, captura, red, silencio, cancelación, idioma, política de servicio y error desconocido a códigos internos.
- Ciclo de vida browser: se impide el doble inicio, se acumulan segmentos finales por índice, `stop()` permite recibir el final, `dispose()` aborta sin callbacks tardíos y un error de silencio posterior no destruye un resultado final ya recibido. No existe reinicio automático.
- Coordinación: en modo browser, la llamada a `getUserMedia` se inicia antes del reconocedor dentro de la misma acción explícita. El reconocedor no recibe el `Blob`; un fallo de reconocimiento no elimina una captura válida y un fallo de captura cancela la escucha activa.
- Privacidad: antes de habilitar browser se exige consentimiento tras informar que Rimay no envía ni almacena el `Blob` y que el navegador puede usar un servicio remoto propio. No se promete funcionamiento local u offline.
- Demo: `DemoSpeechRecognizer` usa un fixture y reloj inyectable, emite una secuencia provisional/final estable y no recibe grabación, stream, PCM o métricas. La UI declara que el texto es predefinido y no analizó audio.
- Manual: está disponible desde el inicio y después de errores. Puede usarse sin captura o junto a una grabación real; editar un resultado browser o demo cambia la procedencia efectiva a `manual`.
- Normalización: `originalText` conserva la entrada; `normalizedText` usa NFC, minúsculas, puntuación sustituida por espacios y espacios colapsados, conservando tildes, diéresis y `ñ`; `comparisonText` elimina tildes y diéresis sin convertir `ñ` en `n`.
- Métricas: `text-metrics-v1` alinea palabras por programación dinámica con `match`, `substitution`, `omission` y `addition`, y desempata en ese orden. Un objetivo vacío devuelve `empty_target`.
- Fórmulas: `wordErrorCount = substitutions + omissions + additions`, `wordErrorRate = wordErrorCount / targetWordCount` y `textSimilarity = max(0, 1 - wordErrorRate)`. WER puede superar `1` y la similitud queda limitada a `[0, 1]`.
- WPM: usa `transcribedWordCount / (totalDurationMs / 60_000)` sólo cuando existe una grabación real decodificada con duración válida. Demo, texto manual sin captura, ausencia de análisis y duración inválida producen `null`; `estimatedSpeechDurationMs` no interviene.
- Presentación: la interfaz muestra procedencia, provisionales, texto final editable, coincidencias, sustituciones, omisiones, adiciones, WER, similitud y WPM con aviso explícito de que no son puntuaciones clínicas.
- Recursos y datos: no se implementaron `fetch`, backend, Supabase, OpenAI, servicios comerciales, persistencia, logs de texto/audio ni almacenamiento del `Blob`. Descartar limpia captura, URL temporal, análisis, reconocimiento, texto y métricas del intento.
- Verificación automatizada final: `npm.cmd run lint` finalizó sin errores ni advertencias; `npm.cmd run typecheck` terminó con código 0; `npm.cmd test` aprobó 11 archivos y 101 pruebas; `npm.cmd run build` transformó 39 módulos y terminó con código 0; `git diff --check` no reportó errores.
- Cobertura relevante: normalización Unicode y protección de `ñ`; alineamiento y desempate; WER mayor que uno; WPM con y sin audio; detección estándar, prefijada y ausente; errores Web Speech; finales múltiples; doble inicio; desmontaje; espera del final; demo determinista; orden captura/reconocimiento; recuperación manual; procedencia editada y regresiones del grabador/análisis de audio.
- Revalidación manual: completada correctamente; los resultados observados y la limitación de sesión no continua se registran en la sección de cierre siguiente.
- Git: el cierre se versiona localmente con el mensaje `feat: add browser speech recognition and text metrics`; no se hace push ni se configuran remotos.

## Corrección posterior a la validación manual del incremento 3

- Fecha: 2026-07-18.
- Alcance: corrección exclusiva de procedencia manual, elegibilidad de WPM e investigación de la aparente finalización del reconocimiento alrededor de siete palabras. No se inició el incremento 4.
- Diagnóstico manual: el 100 % al copiar la frase objetivo no era un defecto matemático. `text-metrics-v1` comparaba correctamente frase objetivo y texto declarado; la ambigüedad estaba en una interfaz que no explicaba con suficiente énfasis que la entrada manual no valida el contenido acústico.
- Presentación manual: antes del campo se pide escribir exactamente lo pronunciado, incluidas omisiones y palabras adicionales. El resumen muestra `Comparación de texto introducido manualmente`, la fuente `manual`, el aviso de que Rimay no verificó la correspondencia con la grabación y una etiqueta de coincidencia específica.
- Presentación multifuente: browser usa `Coincidencia del texto reconocido con la frase objetivo` y demo usa `Coincidencia del texto simulado con la frase objetivo`; ninguna de estas comparaciones se atribuye a una fuente distinta de la declarada por `SpeechTextResult.source`.
- Elegibilidad WPM: la fórmula continúa siendo `transcribedWordCount / (totalDurationMs / 60_000)`. El resultado es `null` sin grabación real, con duración total cero, inválida o no finita, para demo sin audio, para manual sin captura, con `no_speech_detected`, con `too_quiet` o cuando `estimatedSpeechDurationMs` no alcanza `audio-metrics-v1.minimumSpeechDurationMs`.
- Frontera acústica: `estimatedSpeechDurationMs` sólo actúa como guarda de calidad; nunca sustituye a `totalDurationMs` en el denominador. Cuando una entrada manual sí produce WPM, la UI explica que el conteo de palabras fue declarado por el usuario y se combinó con la duración total de la captura.
- Investigación browser: `BrowserSpeechRecognizer` recorre desde `event.resultIndex` hasta `event.results.length`, conserva cada segmento final por índice, concatena finales en orden, mantiene separados provisionales y finales y no recorta el texto según la frase objetivo. No se encontraron `slice`, `substring`, límites de palabras, uso exclusivo del primer resultado ni sobrescritura de finales anteriores en esa ruta.
- Cierre browser: un final recibido dentro de la espera de 500 ms se conserva; después del cierre y disposición, los eventos tardíos se ignoran según el contrato. Se mantiene `continuous: false`, porque las pruebas no evidencian truncación propia y el ejercicio actual es corto.
- Causa probable del corte observado: comportamiento de sesión única del motor `SpeechRecognition` del navegador, cuya finalización puede depender de silencio o límites internos. Para lecturas largas queda registrado como trabajo futuro evaluar reconocimiento continuo o segmentación, sin autorizar su implementación en este incremento.
- Pruebas de regresión: se añadieron casos de final único de diez palabras; dos segmentos con más de diez; provisional seguido de final; varios eventos finales; palabras adicionales; final dentro de 500 ms; evento posterior al cierre; procedencia y advertencia manual; etiquetas manual, browser y demo; WPM manual con `no_speech_detected`, `too_quiet`, voz estimada insuficiente y audio válido.
- Verificación final: `npm.cmd run lint` terminó sin errores ni advertencias; `npm.cmd run typecheck` terminó con código 0; `npm.cmd test` aprobó 12 archivos y 117 pruebas; `npm.cmd run build` transformó 39 módulos y terminó con código 0; `git diff --check` no reportó errores.
- Dependencias y Git durante la corrección: no se agregaron dependencias, no se hizo push y no se configuraron remotos.

### Revalidación manual final y cierre

- Fecha: 2026-07-18.
- Estado: revalidación manual final completada correctamente por el responsable; no quedaron defectos bloqueantes del incremento 3.

**Reconocimiento del navegador**

- El aviso de privacidad apareció y exigió aceptación explícita.
- La frase objetivo se reconoció correctamente; las omisiones y adiciones se detectaron respecto de esa frase.
- El reconocimiento conservó frases de más de siete palabras mientras no hubo una pausa extensa.
- Ante una pausa extensa, el navegador pudo finalizar la sesión única no continua.
- No se observó truncación propia de Rimay ni aparecieron errores en la consola.

**Entrada manual**

- El resumen mostró `Comparación de texto introducido manualmente` y la fuente `Entrada manual`.
- Se mostró: `Este texto fue proporcionado por el usuario. Rimay no verificó que corresponda al contenido de la grabación.`
- Omisiones, adiciones y sustituciones se calcularon a partir del texto introducido manualmente.
- La interfaz dejó claro que ese texto no fue transcrito ni verificado contra el audio.

**Entrada manual con captura silenciosa**

- Duración analizada: 5.6 s; RMS: 0.004; pico máximo: 0.026.
- Tiempo estimado de voz: 0.0 s; proporción de silencio: 100 %.
- Se mostraron las alertas de actividad de voz insuficiente y nivel de captura demasiado bajo.
- WPM mostró: `WPM no disponible: no se detectó actividad de voz suficiente.`

**Comportamiento general**

- El análisis acústico continuó funcionando correctamente.
- Un reconocimiento fallido o finalizado no eliminó la grabación y la entrada manual permaneció disponible.
- El modo demo continuó claramente identificado como simulación.
- No se observaron solicitudes propias de Rimay para enviar audio, texto o métricas; tampoco se persistieron esos datos.
- La consola permaneció sin errores.
- Descartar eliminó grabación, texto y métricas antes del siguiente intento.

**Limitación conocida**

`BrowserSpeechRecognizer` conserva `continuous: false` para el ejercicio corto actual. La capacidad `SpeechRecognition` del navegador puede finalizar la sesión única después de una pausa extensa o por criterios internos del agente de usuario. La revalidación confirmó que este cierre pertenece al comportamiento del navegador y que Rimay no introduce una truncación propia.

**Cierre:** el incremento 3 queda completado. Este cierre no inicia ni autoriza coaching, adaptación, persistencia o el incremento 4.

## Resolución contractual previa al incremento 4

- Fecha: 2026-07-18.
- Estado: ambigüedades contractuales del incremento 4 resueltas exclusivamente en documentación; no se escribió código, no se añadieron dependencias y no se inició el incremento 4.
- Archivos autorizados y actualizados: `prd.md`, `spec.md`, `checklist.md` y `build-notes.md`.
- Contador: `CoachInput` usa `validAttemptCountBeforeCurrent`, entero entre `0` y `4`, para contar sólo intentos válidos terminados antes del actual. Calidad bloqueante no lo incrementa; un intento actual válido completa el quinto cuando el contador anterior más uno es `5`.
- Cobertura: `coveredExerciseTypesBeforeCurrent` conserva tipos únicos de intentos válidos previos en orden canónico. Con contadores `0`, `1` y `2` corresponde al prefijo vacío, palabra, y palabra más frase; con `3` o `4` contiene los tres tipos. Mientras el contador sea menor que `3`, `currentExercise.type` es el siguiente tipo obligatorio. El motor lo añade sólo cuando el intento actual es válido.
- Tipo obligatorio ausente: si falta cobertura y `allowedExercises` no ofrece un ejercicio del tipo requerido, se devuelve `missing_required_exercise_type` sin fallback.
- Resultado: `coach-rules-v1` devuelve `CoachResult`, una unión tipada de decisión o `CoachError`. Los códigos mínimos son `invalid_input`, `invalid_attempt_state`, `incompatible_algorithm_version`, `empty_allowed_exercises`, `duplicate_exercise_id`, `invalid_exercise`, `missing_required_exercise_type` e `inconsistent_audio_metrics`.
- Ejercicio: los contratos canónicos usan `ExerciseType` con `word_repetition`, `phrase_repetition`, `guided_reading`; dificultad `1 | 2 | 3`; y `Exercise` con `id`, `type`, `difficulty`, `instruction`, `targetText`, `pauseCues` y `expectedMaxDurationMs`.
- Catálogo permitido: el contrato principal es `allowedExercises: readonly Exercise[]`. IDs duplicados son error; la selección ordena copias y nunca muta la entrada.
- Calidad: `qualityFlags` conserva los IDs exactos de `AudioQualityFlag`. Son bloqueantes ausencia de voz, nivel demasiado bajo, posible clipping, captura demasiado corta y `silenceRatio >= 0.85`. `transcription_missing` y similitud `null` no son fallos de captura.
- Consistencia acústica: un booleano derivado que contradice su flag correspondiente devuelve `inconsistent_audio_metrics`.
- Orden de reglas: validación, calidad acústica, contabilización conceptual del intento válido, finalización, cobertura, dificultad, foco, ordenamiento de candidatos, selección y plantilla.
- Orden de candidatos: tipo obligatorio pendiente, distancia a dificultad objetivo, evitar el ID actual, tipo en orden canónico, dificultad e ID ordinal mediante `<` y `>`; no se usa `localeCompare`.
- Repetición: `repeat_current` mantiene `selectedExerciseId: null` y no inicia acciones. Si en el incremento 7 el usuario decide continuar, se usa la función pura de candidatos del incremento 4; el intento defectuoso no cuenta ni aporta cobertura.
- Procedencia: las plantillas distinguen “texto reconocido”, “texto introducido” y “texto simulado”; nunca atribuyen texto manual o demo al análisis de pronunciación y mantienen separadas la evidencia acústica y textual.
- División: el incremento 4 permanece como un único incremento formal, con tramo A de contratos, validación, configuración y plantillas, y tramo B de reglas, adaptación, selección y matriz adversarial. No se autorizan commits parciales mediante esta resolución.

## Registro de implementación automática del incremento 4

- Fecha de ejecución: 2026-07-18.
- Estado: ambos tramos fueron implementados y verificados automáticamente; la aceptación manual/editorial del responsable permanece pendiente. No se inició el incremento 5 y no se creó commit.
- Alcance aplicado: dominio TypeScript puro para contratos, validación, plantillas, filtro editorial, reglas, adaptación y candidatos. No se modificaron React, `App.tsx`, captura, reconocimiento, interfaz, persistencia, resumen ni servicios runtime.
- Dependencias: no se agregaron ni actualizaron paquetes; `package.json` y `package-lock.json` permanecen sin cambios.
- Migración contractual: `ExerciseType` usa `word_repetition`, `phrase_repetition` y `guided_reading`; `Difficulty` queda limitada a `1 | 2 | 3`; `Exercise` incorpora `instruction`, `pauseCues` y `expectedMaxDurationMs`. Se retiraron `CoachRequest`, `CoachResponse`, el proveedor asíncrono `Coach` y los contratos preliminares de sesión/resumen que no correspondían a este incremento.
- Contrato acústico real: `CoachInput.audioMetrics` usa directamente `DeterministicMetrics`; no se creó un alias `AudioMetrics`. Las versiones compatibles son exactamente `audio-metrics-v1`, `text-metrics-v1`, `coach-rules-v1` y `coach-templates-v1`.
- Validación: la frontera acepta `unknown`, rechaza números no finitos, ejercicios y pausas inválidos, contador/cobertura incoherentes, fuentes textuales contradictorias, versiones incompatibles, flags desconocidos o repetidos, catálogo vacío, IDs duplicados y contradicción entre `possibleClipping` y `possible_clipping`. Cuando hay métricas textuales, exige igualdad exacta entre su `targetText` y el del ejercicio actual; una diferencia devuelve `inconsistent_text_metrics` antes de usar esas métricas. No muta la entrada.
- Calidad y prioridad: `audio_too_short`, `no_speech_detected`, `too_quiet`, `possible_clipping` o `silenceRatio >= 0.85` devuelven `repeat_current` antes de evaluar el quinto intento. `transcription_missing` y ausencia de texto no bloquean.
- Adaptación: similitud menor de `0.65` reduce una dificultad, `0.65`–`0.85` inclusive mantiene, mayor de `0.85` aumenta una y `null` mantiene; el resultado se acota a 1–3. El foco prioriza lectura guiada con `pauseCues.length > 0` y cero pausas, duración superior, similitud baja y continuación, en ese orden.
- Cobertura y finalización: el intento válido actual se suma conceptualmente al prefijo canónico; si completa el quinto devuelve `complete_session`. Si aún falta un tipo obligatorio, sólo se consideran candidatos de ese tipo y su ausencia devuelve `missing_required_exercise_type`.
- Candidatos: `orderExerciseCandidates` y `selectExerciseCandidate` están exportadas desde `src/domain/exercises/`. Ordenan una copia por tipo obligatorio pendiente, distancia a dificultad, preferencia por ID distinto al actual, tipo canónico, dificultad e ID ordinal con `<` y `>`.
- Plantillas: el catálogo contiene `capture-clear-v1`, `session-complete-v1`, `pause-cues-v1`, `steady-pace-v1`, tres variantes `repeat-text-*-v1`, tres variantes `continue-text-*-v1` y `continue-no-text-v1`. Browser dice “texto reconocido”, manual “texto introducido”, demo “texto simulado” y la variante sin texto no declara coincidencia ni evidencia textual. La política automática exige evidencia exacta por plantilla; `pauseCues` y `expectedMaxDurationMs` son claves válidas, y las plantillas textuales sólo declaran `textSimilarity`.
- Filtro editorial: los patrones explícitos detectan diagnóstico, severidad, pronóstico, recuperación o cambio clínico, tratamiento, prescripción, clasificación de la persona, aprobación/desaprobación, medición clínica y adherencia. Todas las plantillas pasan y un fixture deliberadamente prohibido se rechaza. Este filtro no sustituye revisión profesional.
- Determinismo: el motor no consulta fecha, aleatoriedad, navegador, red o estado global mutable; no usa `localeCompare`; la misma entrada y catálogos equivalentes en distinto orden producen igualdad profunda sin mutar entrada o catálogo.

### Matriz para validación manual/editorial

| Fixture | Regla esperada | Acción y plantilla | Evidencia declarada |
| --- | --- | --- | --- |
| Cualquier flag bloqueante o `silenceRatio` igual a `0.85` | `capture_quality_blocking` | `repeat_current`, `capture-clear-v1`, sin siguiente ID | `qualityFlags`, `silenceRatio` |
| Cuatro intentos previos y captura válida | `complete_fifth_valid_attempt` | `complete_session`, `session-complete-v1`, sin siguiente ID | `validAttemptCountBeforeCurrent`, `qualityFlags`, `silenceRatio` |
| Lectura guiada con `pauseCues.length > 0` y `pauseCount === 0` | `continue_follow_pause_cues` | `continue`, `pause-cues-v1` | `pauseCount`, `pauseCues` |
| Duración mayor que `expectedMaxDurationMs` | `continue_steady_pace` | `continue`, `steady-pace-v1` | `totalDurationMs`, `expectedMaxDurationMs` |
| Similitud menor de `0.65` | `continue_repeat_calmly` | `continue`, plantilla de siguiente actividad según procedencia | `textSimilarity` |
| Resto con texto coherente | `continue_default` | `continue`, plantilla de procedencia | `textSimilarity` |
| Resto sin texto | `continue_default` | `continue`, `continue-no-text-v1` | `qualityFlags`, `silenceRatio`, `currentDifficulty` |

La revisión pendiente debe inspeccionar las 11 frases y explicaciones, confirmar la procedencia browser/manual/demo/sin texto, comparar las evidencias de la tabla con los resultados de fixtures, revisar los ejemplos de quinto intento y prioridades combinadas, y examinar los catálogos adversariales con orden alterado, tipo obligatorio ausente, único candidato actual e IDs numéricos/mayúsculos/minúsculos. También debe revisar el diff completo y las búsquedas negativas de red, persistencia, aleatoriedad y lenguaje clínico. No se afirma revisión profesional externa hasta que ocurra.

### Verificación automática

- Puerta del tramo A: `npm.cmd run typecheck`, código 0; validación y plantillas, 2 archivos y 39/39 pruebas.
- `npm.cmd run lint`: código 0, sin errores ni advertencias.
- `npm.cmd run typecheck`: código 0.
- `npm.cmd test -- coaching`: 4 archivos y 84/84 pruebas.
- `npm.cmd test -- adaptation`: 1 archivo y 13/13 pruebas.
- `npm.cmd test -- candidatePolicy`: 1 archivo y 10/10 pruebas.
- `npm.cmd test`: 17 archivos y 211/211 pruebas.
- `npm.cmd run build`: código 0; 39 módulos transformados y build estático generado correctamente.
- Búsqueda estática de producción: sin `fetch`, almacenamiento web, red, Supabase, OpenAI, `Math.random`, `Date.now`, UUID runtime ni `localeCompare` en los módulos nuevos.
- `git diff --check`: código 0, sin errores de whitespace; Git sólo informó la conversión futura de LF a CRLF en archivos ya modificados.

## Corrección de hallazgos manuales/editoriales del incremento 4

- Fecha de ejecución: 2026-07-18.
- Estado: los hallazgos se corrigieron en el dominio puro y sus pruebas; la revalidación manual/editorial final del responsable sigue pendiente. El incremento 4 no se cierra y el incremento 5 no se inició.
- Correspondencia textual: la causa era la ausencia de una guarda entre el objetivo usado por `text-metrics-v1` y el ejercicio actual. `CoachErrorCode` incorpora `inconsistent_text_metrics`; una comparación exacta de `targetText`, incluida puntuación, detiene la evaluación antes de dificultad, foco, evidencia o candidatos.
- Pausas: la causa era que el foco sólo comprobaba lectura guiada y cero pausas. `continue_follow_pause_cues` exige además `pauseCues.length > 0`; su mensaje habla de pausas indicadas y declara exactamente `pauseCount` y `pauseCues`.
- Similitud baja: se retiró la orden ambigua anterior. Las tres procedencias indican que la acción corresponde a la siguiente actividad, conservan su etiqueta textual y declaran sólo `textSimilarity`.
- Ritmo: la explicación compara duración total y máximo esperado; la evidencia queda limitada a `totalDurationMs` y `expectedMaxDurationMs`.
- Finalización: la explicación declara captura sin alertas bloqueantes y quinto intento válido; la evidencia queda en `validAttemptCountBeforeCurrent`, `qualityFlags` y `silenceRatio`.
- Sin texto y continuación textual: la variante sin texto declara captura válida y dificultad mantenida con `qualityFlags`, `silenceRatio` y `currentDifficulty`; las variantes textuales de continuación declaran únicamente `textSimilarity`.
- Política editorial: el validador del catálogo comprueba la lista exacta de evidencias por `templateId`, además de claves desconocidas, y mantiene el filtro de lenguaje clínico y las etiquetas browser/manual/demo.
- Determinismo reforzado: una matriz parametrizada cubre `continue_default` browser, `continue_repeat_calmly` manual, `continue_follow_pause_cues`, `capture_quality_blocking` y `missing_required_exercise_type`; en cada rama compara dos evaluaciones de la misma referencia, una copia profunda y el catálogo invertido, y verifica inmutabilidad.
- Verificación posterior a la corrección: `npm.cmd run lint` y `npm.cmd run typecheck` terminaron con código 0; `npm.cmd test -- coaching` aprobó 4 archivos y 104/104 pruebas; `npm.cmd test -- adaptation`, 1 archivo y 15/15; `npm.cmd test -- candidatePolicy`, 1 archivo y 10/10; `npm.cmd test`, 17 archivos y 231/231; `npm.cmd run build`, 39 módulos transformados y build estático correcto.
- Dependencias y alcance: no se modificaron paquetes, React, captura, reconocimiento, red, persistencia, resumen ni componentes; no se creó commit, no se hizo push y no se configuraron remotos.

## Revalidación manual/editorial final y cierre del incremento 4

- Fecha: 2026-07-18.
- Dictamen: `APTO PARA CERRAR`.
- Estado: el incremento 4 queda completado. No quedaron plantillas observadas ni defectos materiales pendientes y no se inició el incremento 5.
- Alcance de la revisión: revisión técnica y editorial realizada por el desarrollador sobre contratos, 11 plantillas, ejemplos de decisión, evidencia, prioridades, candidatos, determinismo y pureza. No se realizó revisión clínica o profesional externa.
- Plantillas: las 11 plantillas fueron aprobadas. Browser usa “texto reconocido”, manual “texto introducido” y demo “texto simulado”; la variante sin texto no declara evidencia textual. No aparece “Continúa y repite” ni lenguaje de diagnóstico, severidad, pronóstico, tratamiento, prescripción o clasificación clínica.
- Correspondencia textual: `textMetrics.targetText` idéntico a `currentExercise.targetText` se acepta. Un objetivo de otro ejercicio, una palabra distinta o una diferencia de puntuación devuelve `inconsistent_text_metrics`. La evaluación termina antes de dificultad, foco, plantilla, evidencia o candidato; `textMetrics: null` queda fuera de esta guarda.
- Pausas: `continue_follow_pause_cues` exige conjuntamente `currentExercise.type === 'guided_reading'`, `currentExercise.pauseCues.length > 0` y `audioMetrics.pauseCount === 0`. Si coinciden pausas, duración extensa y similitud baja, prevalece el foco de pausas.
- Evidencia: `pause-cues-v1` usa sólo `pauseCount` y `pauseCues`; `steady-pace-v1`, `totalDurationMs` y `expectedMaxDurationMs`; `session-complete-v1`, `validAttemptCountBeforeCurrent`, `qualityFlags` y `silenceRatio`; las seis plantillas textuales, sólo `textSimilarity`; `continue-no-text-v1` no declara evidencia textual. Cada explicación formula la observación respaldada por esas claves.
- Prioridades y candidatos: calidad bloqueante prevalece sobre el quinto intento; el quinto intento válido produce `complete_session`; un tipo obligatorio ausente devuelve `missing_required_exercise_type` sin fallback. Todo ID seleccionado pertenece a `allowedExercises`; catálogos desordenados o invertidos mantienen la decisión; el candidato actual puede reutilizarse cuando la cobertura está completa; IDs duplicados devuelven `duplicate_exercise_id`; el orden de IDs es ordinal e independiente del locale.
- Determinismo reforzado: `continue_default`, `continue_repeat_calmly`, `continue_follow_pause_cues`, `capture_quality_blocking` y `missing_required_exercise_type` produjeron igualdad profunda con dos evaluaciones de la misma referencia, copia profunda completa y catálogo invertido. El input, `allowedExercises`, `pauseCues`, `qualityFlags` y las copias permanecieron sin mutación.
- Pureza: los módulos de producción del incremento 4 no contienen red, persistencia, reloj, aleatoriedad, APIs del navegador, React, Supabase, OpenAI ni `localeCompare`. `Date.now` y `Math.random` aparecen únicamente en pruebas como guardas negativas que fallarían si el motor intentara consultarlos.
- Verificación automática final: `npm.cmd run lint`, código 0; `npm.cmd run typecheck`, código 0; `npm.cmd test -- coaching`, 4 archivos y 104/104 pruebas; `npm.cmd test -- adaptation`, 1 archivo y 15/15; `npm.cmd test -- candidatePolicy`, 1 archivo y 10/10; `npm.cmd test`, 17 archivos y 231/231; `npm.cmd run build`, código 0 y 39 módulos transformados; `git diff --check`, código 0 sin errores de whitespace y sólo avisos informativos de futura conversión LF a CRLF.
- Dependencias: `package.json` y `package-lock.json` permanecen sin cambios; no se agregaron ni actualizaron paquetes.
- Limitaciones: el filtro léxico automatizado reduce el riesgo editorial, pero no sustituye revisión profesional. Los umbrales acústicos, textuales y adaptativos son reglas deterministas de interacción para la demostración y no están clínicamente validados; no diagnostican, clasifican severidad, pronostican ni prescriben tratamiento.
- Cierre de alcance: no se modificaron plantillas, contratos, reglas, prioridades, fórmulas o umbrales durante el cierre. No se añadieron React, recorrido de práctica, `SpeechSynthesis`, persistencia, backend, Supabase u OpenAI. No se hizo push ni se configuraron remotos.

## Resolución documental previa al incremento 5

- Fecha: 2026-07-18.
- Estado: bloqueos documentales previos al incremento 5 resueltos. La tarea fue exclusivamente documental; no se escribió código, no se modificaron dependencias, no se creó commit y el incremento 5 permanece sin iniciar.
- Estado base: incrementos 1–4 completados; rama `main`; último commit confirmado `b8a78fb feat: add deterministic coaching and adaptation rules`.
- Corte funcional: el incremento 5 integra exactamente un intento actual de palabra hasta feedback escrito y acción explícita. No inicia una segunda captura después de continuar ni implementa sesión, historial, biblioteca final, voz, persistencia, vista profesional o resumen.
- Browser: requiere una grabación real local; `SpeechRecognition` puede ejecutarse en paralelo tras aviso y autorización. Un provisional nunca se evalúa. Si falta un final, el usuario puede aportar texto manual o continuar explícitamente sin texto, con ambos campos textuales de `CoachInput` en `null`.
- Manual: requiere grabación real y `audio-metrics-v1` satisfactorio para ejecutar coaching. El texto se declara por el usuario y no se verifica contra el audio. La comparación manual sin captura puede continuar como capacidad técnica, pero no construye `CoachInput`.
- Demo: conserva la garantía de no solicitar micrófono. Usa un fixture local determinista de `DeterministicMetrics` con versión `audio-metrics-v1`, texto demo predefinido y `text-metrics-v1` local; no usa audio del usuario, `Blob` de usuario, red o WPM. La UI declara que el recorrido y el texto son simulados y que no grabó ni analizó la voz.
- Catálogo: el fixture temporal contiene una palabra actual y al menos una frase permitida, usa `Exercise`, vive fuera de React y no representa la biblioteca final. Permite que el primer intento válido seleccione una frase autorizada.
- Continuación: `continue` exige clic, valida el ID seleccionado, limpia recursos y termina en preview. No inicia grabación, no activa sesión, no incrementa contadores y no vuelve a ejecutar el motor.
- Repetición: `repeat_current` exige clic, limpia audio, URL, texto, métricas, errores y decisión, conserva el ejercicio y vuelve al inicio sin acción automática. Continuar pese a la recomendación permanece en el incremento 7.
- Finalización inesperada: con contador anterior `0`, `complete_session` es inalcanzable. Si aparece, la aplicación devuelve `unexpected_coach_action`, mantiene recuperación y no fabrica sesión, resumen o selección.
- Identidad: `attemptId` usa contador monotónico local sin fecha, UUID o aleatoriedad. Permanece estable durante el intento y se renueva al repetir, descartar o iniciar uno nuevo.
- Concurrencia: un token de generación invalida resultados tardíos; un doble clic en análisis se ignora; `evaluateCoach` se llama una sola vez desde “Analizar intento” y no desde efectos. Input y decisión permanecen como snapshot hasta repetir o continuar.
- Estados: la fase principal se representa mediante una unión discriminada con `instruction`, `privacy_choice`, `requesting_permission`, `recording`, `recorded`, `awaiting_text`, `ready_to_analyze`, `analyzing`, `decision_ready`, `recoverable_error` y `selection_preview`.
- Contratos permitidos: `PracticeAttemptState`, `PracticeAttemptError` y `CoachEvidenceViewItem`. No se autorizan todavía contratos de intento persistido, sesión, historial, repositorio, resumen o síntesis de voz.
- Evidencia: cada clave se resuelve contra el snapshot real y se presenta con etiqueta, valor y unidad, junto con mensaje, explicación, foco, acción, versión, procedencia y advertencia no clínica. No se muestran claves internas crudas ni se atribuye manual/demo al audio.
- Límite de 10 MB: no cambia en el incremento 5. Una captura descartada debe conducir a una recuperación clara y respetuosa. Revisar conservación de reproducción o política del límite queda registrado para el incremento 10.
- División: un solo incremento formal con tramo A de fixture, contratos, estado, input, evaluación, errores y pruebas del controlador; y tramo B de React, feedback, evidencia, acciones, limpieza, integración y validación Chrome/Edge. No se autorizan commits parciales mediante esta resolución.

## Implementación automática del incremento 5

- Fecha: 2026-07-19.
- Estado: tramos A y B implementados y verificados automáticamente; la validación manual técnica y funcional posterior se completó correctamente en Chrome y Edge. El cierre final se registra a continuación y no se inició el incremento 6.
- Arquitectura: `src/features/practice/` separa fixture y contratos efímeros, transición pura de estados, errores seguros, resolución pura de evidencia, controlador de aplicación y presentación React. `PracticeAttemptFlow` sustituyó a `AudioRecorderCard` como único recorrido principal de `App`; la tarjeta técnica anterior y sus pruebas se conservan como arnés de regresión no accesible desde la aplicación principal.
- Compatibilidad de nombres: el componente visual usa `CoachEvidenceView.tsx` porque Windows no permite coexistir `coachEvidence.ts` y `CoachEvidence.tsx` en el mismo directorio sin colisión de mayúsculas; la función pura permanece en `coachEvidence.ts`.
- Máquina de estados: la fase principal es la unión discriminada documentada con `instruction`, `privacy_choice`, `requesting_permission`, `recording`, `recorded`, `awaiting_text`, `ready_to_analyze`, `analyzing`, `decision_ready`, `recoverable_error` y `selection_preview`. Los eventos inválidos conservan el estado existente.
- Fixture temporal: la palabra actual es “casa”, tipo `word_repetition`, dificultad 1; el catálogo añade la frase “Camino con calma.”, tipo `phrase_repetition`, dificultad 2. Ambos usan IDs constantes, contratos `Exercise` completos y ninguna fecha, UUID o aleatoriedad. El fixture demo usa `audio-metrics-v1`, texto final `source: 'demo'`, `text-metrics-v1` local y WPM no disponible.
- Identidad y concurrencia: los IDs `practice-attempt-N` proceden de un contador monotónico local y la generación invalida análisis y eventos tardíos al descartar, repetir, continuar o desmontar. Un guard síncrono bloquea doble análisis.
- Construcción del dominio: browser y manual requieren `DeterministicMetrics` reales del `Blob`; demo usa el fixture acústico simulado. `buildPracticeCoachInput` fija contador anterior `0`, cobertura anterior `[]`, dificultad del ejercicio y catálogo temporal. Browser sin final explícitamente aceptado produce `textSource: null` y `textMetrics: null`.
- Evaluación única y snapshot: `evaluateCoach` sólo aparece en el manejador explícito `analyzeAttempt`, después de métricas acústicas y textuales; no se ejecuta en render o efectos. `decision_ready` conserva `CoachInput`, `CoachResult`, ejercicio, procedencia y catálogo sin recalcular la decisión.
- Browser: el aviso previo exige consentimiento, `MediaRecorder` y el reconocedor se inician desde la misma acción, el provisional sólo se muestra y un final es el único texto automático elegible. Un fallo del reconocedor conserva audio y ofrece entrada manual o continuación explícita sin texto.
- Manual: requiere grabación real y confirmación de texto no vacío antes de habilitar análisis. La UI conserva `source: 'manual'`, permite editar antes de analizar y declara que Rimay no verificó el texto contra el audio. Sin captura no se construye `CoachInput` ni se ejecuta coaching.
- Demo: “Cargar datos simulados” no llama `getUserMedia`, `MediaRecorder`, `SpeechRecognition` ni Web Audio. La UI muestra literalmente los tres avisos de simulación, identifica el fixture acústico y evita atribuirlo a la voz del usuario.
- Feedback y evidencia: la vista presenta mensaje, explicación, foco traducido, acción, versión, procedencia, aviso no clínico y sólo las evidencias declaradas por la decisión. El resolvedor cubre `qualityFlags`, `silenceRatio`, `validAttemptCountBeforeCurrent`, `pauseCount`, `pauseCues`, `totalDurationMs`, `expectedMaxDurationMs`, `textSimilarity` y `currentDifficulty`; una clave no compatible falla explícitamente.
- Acciones y errores: `repeat_current` sólo ofrece “Repetir este intento”; `continue` valida que el ID pertenezca al catálogo y termina en preview. `complete_session` produce `unexpected_coach_action`; un ID ausente produce `selected_exercise_not_found`; ningún error muestra feedback parcial. Los `CoachErrorCode` se mapean exhaustivamente mediante un `Record` tipado.
- Limpieza: `useAudioRecorder.reset` ahora invalida solicitudes anteriores, desactiva callbacks, detiene grabador y pistas, borra chunks y revoca la URL una vez. El controlador reinicia reconocimiento, texto, reproducción, análisis, snapshot y decisión; pruebas con promesas controladas confirman que un resultado tardío o posterior al desmontaje no ejecuta coaching.
- Accesibilidad: todos los controles son nativos y operables por teclado, tienen foco visible y altura mínima; el estado principal usa `aria-live` sin incluir provisionales. Tras analizar, fallar o continuar, el foco se dirige respectivamente a devolución, error o preview. No existe inicio o avance automático y `prefers-reduced-motion` permanece activo.
- Pruebas del tramo A: el corte previo a React terminó con `npm.cmd run typecheck` en código 0 y 4 archivos/11 pruebas de práctica aprobadas.
- Pruebas del tramo B: las pruebas de integración cubren demo sin APIs de captura, manual con audio y texto, WPM elegible, consentimiento browser, provisional/final, fallo browser sin texto, acciones explícitas, foco, errores, descarte durante análisis, URL revocada y desmontaje seguro. Las regresiones dirigidas de grabación y reconocimiento aprobaron 4 archivos/38 pruebas.
- Verificación automática preliminar: `npm.cmd run lint`, código 0; `npm.cmd run typecheck`, código 0; `npm.cmd test`, 22 archivos y 251/251 pruebas; `npm.cmd run build`, código 0 y 54 módulos transformados. La verificación final se repetirá después de esta actualización documental.
- Verificación automática final posterior a documentación: `npm.cmd run lint`, código 0; `npm.cmd run typecheck`, código 0; `npm.cmd test -- practice`, 5 archivos y 20/20 pruebas; regresiones dirigidas de App, grabación y reconocimiento, 5 archivos y 39/39 pruebas; `npm.cmd test`, 22 archivos y 251/251; `npm.cmd run build`, 54 módulos transformados; `git diff --check`, código 0 sin errores de whitespace.
- Dependencias y exclusiones: `package.json` y `package-lock.json` no cambiaron. No se añadieron dependencias, persistencia, sesión, historial, `SpeechSynthesis`, resumen, vista profesional, backend, Supabase, OpenAI ni red propia.
- Limitaciones: sólo existe un intento actual de palabra; continuar muestra una vista previa y no activa otro ejercicio. `SpeechRecognition` depende de la capacidad del navegador y puede utilizar servicios remotos propios fuera del control de Rimay. Las métricas y reglas son técnicas, no clínicamente validadas y no constituyen diagnóstico ni recomendación terapéutica.

## Validación manual final y cierre del incremento 5

- Fecha: 2026-07-19.
- Dictamen: `APTO PARA CERRAR`.
- Estado: validación técnica y funcional completada correctamente por el responsable en Chrome y Edge, sin errores observados ni defectos materiales pendientes. El incremento 5 queda completado; no se inició el incremento 6.
- Alcance de la revisión: recorridos browser, manual y demo; consentimiento y procedencia; grabación, reproducción y métricas; decisiones y snapshot; repetición, continuación y limpieza; Console, Network y Storage; teclado, foco, zoom al 200 % y reflow. No se realizó revisión clínica externa.

**Browser**

- El recorrido completo fue aprobado con consentimiento de privacidad obligatorio, captura local, reproducción y métricas acústicas.
- El texto provisional permaneció sólo como información visible y no se utilizó como resultado final. El reconocimiento final y las métricas textuales fueron aprobados.
- El análisis sin texto fue aprobado con ausencia explícita de métricas textuales. Un fallo de reconocimiento conservó la captura y permitió cambiar a entrada manual.
- La interfaz mantuvo el aviso de que `SpeechRecognition` puede utilizar servicios remotos propios del navegador. Rimay no promete reconocimiento local u offline y no envía el `Blob` a ese servicio.

**Manual y demo**

- Manual con audio real fue aprobado y mostró la advertencia de que el texto fue introducido por el usuario y no se verificó contra la grabación. Sin captura no se construyó `CoachInput` ni se ejecutó coaching.
- Demo utilizó exclusivamente fixtures locales simulados. No solicitó micrófono, no creó una captura con `MediaRecorder`, no inició `SpeechRecognition`, no usó `Blob` del usuario y no realizó solicitudes de red.
- Los avisos “Este recorrido utiliza datos simulados.”, “No se grabó ni analizó su voz.” y “El texto simulado no procede de audio.” aparecieron correctamente.

**Decisiones, acciones y recursos**

- Una captura silenciosa produjo `repeat_current`. “Repetir este intento” requirió clic explícito, limpió el estado y no inició automáticamente otra grabación.
- `continue` requirió clic explícito, limpió los recursos y terminó en `selection_preview` para “Camino con calma.”. No inició una segunda captura, otra evaluación, una sesión o historial.
- Feedback, explicación, foco, procedencia y evidencia se mostraron correctamente. No se observaron decisiones duplicadas y cada decisión permaneció asociada al snapshot original del intento.
- El micrófono se liberó al detener, descartar, repetir y continuar.

**Privacidad, accesibilidad y límites**

- Console permaneció sin errores. Network confirmó que Rimay no realizó solicitudes propias para enviar audio, texto, métricas o decisiones.
- Local Storage, Session Storage e IndexedDB no recibieron datos nuevos durante el recorrido.
- Navegación por teclado, foco, zoom al 200 % y reflow fueron aprobados en Chrome y Edge.
- La validación fue técnica y funcional, no clínica. No hubo revisión clínica o profesional externa. El flujo es una demostración técnica no clínicamente validada y no diagnostica ni recomienda tratamiento.
- Dependencias y alcance: `package.json` y `package-lock.json` permanecieron intactos. No se añadieron `SpeechSynthesis`, sesión, historial, persistencia, vista profesional, backend, Supabase, OpenAI o código del incremento 6.
- Git: el cierre se versiona localmente con el mensaje `feat: add single-attempt practice flow`; no se hace push ni se configuran remotos.

**Cierre:** el incremento 5 queda completado con dictamen `APTO PARA CERRAR`. No se inició el incremento 6.

## Resolución documental previa al incremento 6

- Fecha: 2026-07-19.
- Estado: bloqueos documentales previos al incremento 6 resueltos exclusivamente en documentación. Los incrementos 1–5 están completados; la rama confirmada es `main`, el último commit es `7f373d3 feat: add single-attempt practice flow` y el incremento 6 no se inició.
- Archivos autorizados: `AGENTS.md`, `spec.md`, `checklist.md` y `build-notes.md`. No se modificaron `scope.md`, `prd.md`, código, pruebas, configuración, dependencias o servicios; no se creó commit.
- Alcance formal: Incremento 6 — Tres ejercicios y voz accesible. Sustituye el fixture temporal de ejercicios, incorpora progreso presentacional y salida hablada de instrucciones y feedback. Conserva `selection_preview` como terminal y no implementa una segunda captura, sesión de cinco intentos, historial, adaptación completa, persistencia, selector visible de voces, pausa/reanudación, vista profesional, backend, Supabase u OpenAI.
- Catálogo exacto: `practice-word-casa`, palabra de dificultad 1 con “casa”, sin pausas y `3_000 ms`; `practice-phrase-calm`, frase de dificultad 2 con “Camino con calma.”, sin pausas y `6_000 ms`; `practice-guided-calm`, lectura de dificultad 3 con “La mañana está tranquila, camino con calma.”, `pauseCues: [25]` y `12_000 ms`. Las instrucciones canónicas son respectivamente “Pronuncia la palabra visible cuando estés listo.”, “Pronuncia la frase visible cuando estés listo.” y “Lee el texto visible y haz una pausa donde aparece la indicación.”
- Matriz: el catálogo final del MVP inicial tiene exactamente tres entradas y una por tipo. La distribución 1–2–3 pertenece a estas entradas y no exige una matriz tipo × dificultad de nueve ejercicios para bibliotecas futuras.
- Secuencia: los IDs readonly siguen palabra → frase → lectura guiada. Puede mostrarse “Ejercicio 1 de 3”, “Ejercicio 2 de 3” y su equivalente para lectura; ese progreso no es un contador de intentos válidos ni una sesión.
- `pauseCues`: offsets UTF-16 de frontera, base cero, sobre el `targetText` exacto en NFC y compatibles con `String.prototype.slice`. Cada offset es posterior a la puntuación, único, estrictamente creciente, mayor que cero, menor que la longitud y no divide un par sustituto. Palabra/frase usan lista vacía y lectura al menos una marca. “Pausa” puede insertarse sólo en presentación, sin alterar el objetivo ni asignar duración clínica.
- Validación del catálogo: función pura sobre `unknown` que devuelve éxito tipado o lista estructurada de hallazgos. Comprueba tamaño exacto, contrato `Exercise`, tipos, IDs, dificultades, texto NFC, duraciones enteras/finitas/positivas/`<= 60_000`, pausas, secuencia, orden, seguridad editorial e inmutabilidad. No usa excepciones sin contrato como flujo normal.
- Orden: palabra, frase, lectura guiada, dificultad e ID ordinal mediante `<` y `>`; sin `localeCompare`, fecha, UUID o aleatoriedad. Catálogo, ejercicios, marcas y secuencia permanecen readonly.
- Coaching: el primer ID sustituye el ejercicio temporal y el catálogo completo se entrega como `allowedExercises`. `validAttemptCountBeforeCurrent` continúa `0` y la cobertura anterior `[]`. Palabra válida selecciona frase; una prueba de dominio con frase válida y palabra cubierta debe seleccionar lectura. `coach-rules-v1` no cambia; se conservan `missing_required_exercise_type` y `selected_exercise_not_found`.
- Demo: los fixtures acústicos y textuales se separan del catálogo de ejercicios y conservan su rotulado. Demo permanece sin micrófono, grabación, reconocimiento o audio del usuario; una voz sintetizada opcional no convierte el fixture en una medición.
- `SpeechOutput`: contrato canónico `speak(text: string): Promise<void>`, `stop(): void`, `isAvailable(): boolean`. Idioma y voz pertenecen al adaptador. No existe contrato paralelo `speak(text, language)` o `isSupported()` para salida y no se exponen objetos Web Speech al dominio.
- Contenido hablado: sólo el valor visible exacto de `Exercise.instruction` y la concatenación visible `shortFeedback + " " + explanation`. No se habla texto reconocido, manual o simulado, `targetText` por separado, métricas, evidencia, IDs, versiones o avisos completos.
- Controles y parámetros: un único control contextual muestra escuchar cuando no habla y detener mientras habla. El mismo botón escuchar permite una nueva reproducción explícita; no existen botones separados para repetir instrucción/devolución y “Repetir este intento” conserva su semántica propia. Sin autoplay, pausa/reanudación, selector visible o configuración. `rate = 1`, `pitch = 1`, `volume = 1`; idioma preferido `es-EC`.
- Selección de voz: voz local `es-EC`, cualquier `es-EC`, voz local `es-*`, cualquier `es-*`; dentro de grupo, `default`, `voiceURI`, `lang` y `name` ordinales. La identidad combina `voiceURI`, `lang` y `name`; no se persiste. Sin voz española, no se usa otro idioma silenciosamente y el recorrido textual continúa.
- Ciclo de vida: `getVoices()` puede iniciar vacío; se escucha `voiceschanged`, se recarga la lista y no se retienen objetos obsoletos. Una sola locución activa, cancelación antes de hablar, generación contra eventos tardíos, última solicitud ante clics rápidos en escuchar, cancelaciones esperadas no visibles y errores reales no bloqueantes. Listeners y voz se limpian al desmontar.
- Integración de recursos: cancelar voz antes de micrófono, reconocimiento, repetir intento, descartar, continuar, cambiar ejercicio, entrar en error o desmontar. Volver a escuchar no cambia el estado; continuar cancela voz y termina en preview; cambiar voces no recalcula snapshots.
- Privacidad: sólo llegan al agente de síntesis instrucciones y feedback ficticio ya visibles; no se sintetizan textos del usuario, métricas o IDs y no existe `fetch`, telemetría o almacenamiento. Se prefiere `localService`, sin prometer que toda voz sea local u offline; algunas voces pueden ser gestionadas remotamente por el navegador.
- Accesibilidad: texto equivalente, botones nativos por teclado, foco visible, controles adecuados, región de estado breve, detener mientras habla, pausas textuales, sin autoplay o autoavance, zoom 200 %, reflow, reduced motion, errores recuperables y lector de pantalla. Los eventos internos de síntesis no se anuncian individualmente ni mueven foco.
- División interna futura: tramo A de catálogo y contratos; tramo B de núcleo de voz; tramo C de integración accesible. Los tres forman un único incremento y no autorizan commits parciales.
- Revisión: el catálogo sólo puede declararse revisado técnica/editorialmente por el desarrollador durante el incremento. No se afirma revisión clínica externa; el filtro automático no sustituye revisión profesional y pausas/duraciones son reglas de interacción no clínicamente validadas.
- Autorización: esta resolución no autoriza implementación. El código del incremento 6 requiere una solicitud expresa posterior.

## Implementación automática del incremento 6

- Fecha: 2026-07-19.
- Estado: los tramos A, B y C fueron implementados y verificados automáticamente como un único incremento formal. La revalidación manual final en Chrome y Edge se completó correctamente; el cierre se registra a continuación y no se inició el incremento 7.
- Dependencias: no se añadieron ni actualizaron paquetes. `package.json` y `package-lock.json` permanecen intactos.
- Catálogo: `src/domain/exercises/` contiene exactamente `practice-word-casa`, `practice-phrase-calm` y `practice-guided-calm`, en orden palabra → frase → lectura. Sus dificultades, instrucciones, objetivos, pausas y duraciones coinciden con el contrato documental. `INITIAL_EXERCISE_SEQUENCE` contiene los tres IDs y el primer ejercicio se resuelve desde esa secuencia.
- Validación: una función pura recibe catálogo y secuencia como `unknown`, devuelve éxito tipado o una lista estructurada de hallazgos, valida contrato, tamaño, tipos, IDs, dificultades, NFC, duraciones, pausas, orden, secuencia y lenguaje editorial, y produce copias readonly congeladas sin mutar la entrada.
- Filtro editorial: cubre diagnóstico, severidad, pronóstico, recuperación/deterioro, tratamiento, prescripción, clasificación clínica, reemplazo de terapia, evaluación de inteligibilidad y aprobación clínica. Un fixture deliberadamente prohibido demuestra el rechazo; el filtro no sustituye revisión profesional.
- Pausas: `pauseCues` se valida como fronteras UTF-16 posteriores a puntuación, estrictamente crecientes, dentro de rango y sin dividir pares sustitutos. La lectura canónica conserva longitud 43, coma en índice 24 y cue 25. La segmentación pura soporta múltiples cues y `GuidedReadingText` inserta el indicador textual “Pausa” sin modificar el objetivo ni atribuir duración clínica.
- Coaching: el catálogo final sustituye todas las referencias temporales y se entrega como `allowedExercises`; palabra válida selecciona `practice-phrase-calm` y una frase válida con palabra cubierta selecciona `practice-guided-calm`. Se conserva `missing_required_exercise_type`, el ID seleccionado siempre se valida contra el catálogo y `coach-rules-v1`, reglas, plantillas, umbrales y versiones no cambiaron.
- Demo: los fixtures acústico y textual viven en `demoFixtures.ts`, separados del catálogo. Demo continúa sin micrófono, `MediaRecorder`, reconocimiento, audio del usuario, WPM o red, y conserva sus tres avisos visibles de simulación.
- Contrato de salida: `SpeechOutput` usa únicamente `speak(text: string): Promise<void>`, `stop(): void` e `isAvailable(): boolean`. Idioma y voz permanecen dentro del adaptador; no se exponen objetos Web Speech al dominio.
- Selección de voz: la función pura prioriza voz local `es-EC`, cualquier `es-EC`, voz local `es-*` y cualquier `es-*`; dentro del grupo usa `default`, `voiceURI`, `lang` y `name` ordinales. Compara el idioma sin distinguir mayúsculas, conserva el objeto vigente, no usa `localeCompare`, no selecciona otros idiomas y no persiste preferencias.
- Adaptador: `BrowserSpeechOutput` encapsula `speechSynthesis`, utterances, lista de voces, `speak`, `cancel` y `voiceschanged`. Usa parámetros 1/1/1, una generación monotónica, una sola locución, cancelación previa, resolución silenciosa de cancelaciones esperadas, rechazo tipado de fallos reales, recarga de objetos de voz y limpieza de listeners al desmontar.
- Hook y controles: `useSpeechOutput` expone estados discriminados `unsupported`, `loading_voices`, `unavailable`, `ready`, `speaking`, `stopped` y `error`, además de disponibilidad, resumen de voz, `speak`, `stop` y limpieza. `SpeechControls` ofrece un único botón que alterna entre escuchar y detener según el estado, sin autoplay, pausa/reanudación, selector o movimiento automático de foco. `repeat()` y `lastText` se retiraron por quedar sin consumidores.
- Integración: `ExerciseInstruction` muestra progreso, tipo, dificultad, instrucción y objetivo; la palabra actual usa “Ejercicio 1 de 3”, la preview de frase “Ejercicio 2 de 3” y las pruebas cubren lectura “Ejercicio 3 de 3”. `selection_preview` sigue terminal y no inicia segunda captura, sesión, contador o evaluación.
- Contenido hablado: sólo se entrega la instrucción visible exacta o `${shortFeedback} ${explanation}`. Las pruebas comprueban que los payloads no incluyen objetivo por separado, texto del usuario, métricas, evidencias, IDs o versiones. Un fallo de síntesis conserva feedback, decisión y acciones.
- Cancelación: la voz se detiene antes de iniciar micrófono o reconocimiento, repetir el intento, descartar, continuar, mostrar otro ejercicio, entrar en un error recuperable y desmontar. Volver a escuchar no altera el intento y `voiceschanged` no recalcula coaching ni mueve el foco.
- Privacidad: no existe `fetch`, telemetría, almacenamiento o logs de contenido hablado. Se prefiere `localService`, pero la UI y documentación aclaran que algunas voces pueden usar infraestructura propia del navegador y Rimay no promete funcionamiento local u offline.
- Accesibilidad: todo contenido hablado permanece visible, los controles son botones nativos con altura mínima de 44 px, foco visible y región de estado breve. Las pausas tienen texto, no hay autoplay o autoavance; la validación manual final confirmó teclado, foco, zoom 200 % y reflow en Chrome y Edge, y `prefers-reduced-motion` permanece activo.
- Hallazgo de verificación: la primera ejecución global de lint detectó una actualización síncrona dentro del efecto de suscripción de voz. Se reordenó la suscripción para recibir el estado desde el callback del adaptador y conservar el remontaje de `StrictMode`; lint y todas las pruebas posteriores quedaron en verde.
- Puerta A final: `npm.cmd run typecheck`, código 0; `npm.cmd test -- exercises`, 3 archivos y 37/37 pruebas.
- Puerta B final: `npm.cmd run typecheck`, código 0; `npm.cmd test -- speech-output`, 4 archivos y 30/30 pruebas.
- Puerta C final: `npm.cmd test -- practice`, 6 archivos y 32/32 pruebas.
- Verificación global: `npm.cmd run lint`, código 0 sin errores ni advertencias; `npm.cmd run typecheck`, código 0; `npm.cmd test`, 29 archivos y 320/320 pruebas; `npm.cmd run build`, código 0, 66 módulos transformados y SPA estática generada.
- Corrección de validación manual: se confirmó la redundancia de mostrar simultáneamente escuchar y repetir para el mismo texto. Se eliminaron “Repetir instrucción” y “Repetir devolución”; después de finalizar, detener o fallar vuelve el botón “Escuchar”, que crea otra solicitud explícita con el mismo contenido. “Repetir este intento” no cambió. Las pruebas conservan una sola locución, cancelaciones, foco, estado de intento y evaluación única de coaching.
- Limitaciones automatizadas: jsdom y los dobles de navegador no demuestran disponibilidad, pronunciación, latencia o comportamiento real de las voces instaladas. La validación manual confirmó el comportamiento funcional en Chrome y Edge, pero no registró nombres o `voiceURI` concretos y no convierte el catálogo o la síntesis en contenido clínicamente validado.

## Revalidación manual final y cierre del incremento 6

- Fecha: 2026-07-19.
- Dictamen: `APTO PARA CERRAR`.
- Estado: la revalidación técnica, funcional y editorial fue completada correctamente por el responsable en Chrome y Edge. No quedaron defectos materiales pendientes; el incremento 6 queda completado y no se inició el incremento 7.
- Alcance revisado: catálogo exacto, progreso presentacional, preview terminal, lectura guiada, selección española, instrucción y devolución habladas, control contextual, cancelaciones, demo, privacidad, accesibilidad, Console, Network y Storage. No se realizó revisión clínica o profesional externa.

**Catálogo, progreso y preview**

- Los tres ejercicios exactos fueron aprobados: palabra `practice-word-casa`, frase `practice-phrase-calm` y lectura `practice-guided-calm`, con sus dificultades, instrucciones, objetivos, duraciones y `pauseCues` canónicos.
- “Ejercicio 1 de 3” y la preview “Ejercicio 2 de 3” aparecieron correctamente. La lectura guiada conservó el indicador textual “Pausa”.
- La preview de la frase permaneció terminal: no inició segunda captura, otro intento, sesión, historial o nueva evaluación de coaching.
- La revisión del catálogo fue técnica, funcional y editorial. No hubo revisión clínica externa; las pausas, duraciones y ejercicios ficticios no están clínicamente validados.

**Voces y control contextual**

- Chrome y Edge seleccionaron una voz española disponible. No se proporcionaron nombres, `voiceURI` o inventarios concretos de voces, por lo que no se afirma que ambos navegadores usaran la misma voz.
- No se observaron diferencias funcionales entre Chrome y Edge: ambos completaron el recorrido y aplicaron la misma semántica escuchar/detener sin errores. La voz concreta y su disponibilidad pueden variar según navegador y sistema operativo.
- No existió autoplay. “Escuchar instrucción” cambió a “Detener voz” durante la locución y volvió al finalizar o detener; el mismo comportamiento fue aprobado para “Escuchar devolución”.
- “Repetir instrucción” y “Repetir devolución” no aparecieron. Una nueva pulsación explícita de “Escuchar” reprodujo nuevamente el contenido, mientras “Repetir este intento” permaneció como acción distinta del flujo.
- Volver a escuchar no cambió el estado del intento, no modificó `attemptId` y no ejecutó nuevamente `evaluateCoach`. Los clics rápidos no produjeron locuciones superpuestas y no se movió el foco al iniciar, finalizar o detener.

**Cancelación, privacidad y accesibilidad**

- La voz se canceló antes de activar el micrófono y al repetir el intento, descartar o continuar. Iniciar otra acción no dejó síntesis superpuesta con la captura.
- Instrucción y devolución conservaron texto visible equivalente. Rimay no sintetizó texto reconocido, manual o demo, métricas, evidencias, IDs o información del intento.
- Demo continuó sin micrófono. Navegación por teclado, foco, zoom 200 % y reflow fueron aprobados en ambos navegadores.
- Console no mostró errores. Network confirmó que Rimay no realizó solicitudes propias para síntesis. Storage no conservó voces, textos o preferencias.
- Algunas voces pueden usar infraestructura administrada por el navegador; Rimay no promete que toda voz sea local u offline.

**Cierre:** el incremento 6 queda completado con dictamen `APTO PARA CERRAR`. La validación fue técnica, funcional y editorial, no clínica; no hubo revisión clínica o profesional externa y no se inició el incremento 7.

## Resolución documental previa al incremento 7

- Fecha: 2026-07-19.
- Estado: bloqueos documentales previos al incremento 7 resueltos exclusivamente en documentación. Los incrementos 1–6 están completados; la rama confirmada es `main`, el último commit es `f846f38 feat: add exercise catalog and accessible speech output` y el incremento 7 no se inició.
- Archivos autorizados: `AGENTS.md`, `spec.md`, `checklist.md` y `build-notes.md`. No se modificaron `scope.md`, `prd.md`, código, pruebas, configuración, dependencias o servicios; no se creó commit.
- Alcance formal: Incremento 7 — Sesión de cinco intentos y adaptación completa. Contiene exactamente cinco intentos válidos aceptados, no cinco capturas totales. Activa ejercicios posteriores, cubre los tres tipos, aplica adaptación en válidos 4–5, permite repetir o continuar capturas bloqueantes, conserva historial efímero, finaliza y permite una nueva sesión desde `completed`.
- Exclusiones: persistencia, contratos persistidos, repositorios, roles, resumen profesional, `summary-rules-v1`, panel profesional, backend, Supabase y OpenAI permanecen fuera del incremento 7.
- Aceptación: analizar no registra. Sólo “Continuar” acepta una decisión `continue` y sólo “Finalizar sesión” acepta `complete_session`. La transición valida estado, generación, decisión y candidato; congela snapshots, añade un registro, deriva progreso/cobertura, limpia recursos y entra en preview o `completed` de forma atómica. Doble clic, render repetido o evento tardío no pueden duplicar el registro.
- Historial: `validHistory` contiene únicamente `SessionAttemptRecord` con `position`, `mode`, `coachInputSnapshot`, `coachDecisionSnapshot` y `acceptedAction`. Cada registro es copia profunda readonly/congelada; admite fuente y métricas textuales `null`, identifica demo por modo y no conserva `SpeechTextResult` completo, provisional, fecha, UUID, aleatoriedad o audio.
- Fuente de verdad: `validAttemptCountBeforeCurrent = validHistory.length`; no existe contador paralelo. La cobertura se deriva exclusivamente de tipos presentes en registros válidos aceptados y conserva los prefijos vacío, palabra, palabra/frase y los tres tipos.
- Validez: una captura es válida con análisis acústico satisfactorio y sin `audio_too_short`, `no_speech_detected`, `too_quiet`, `possible_clipping` o silencio `>= 0.85`. Texto ausente, reconocimiento faltante o similitud `null` no invalidan; los errores técnicos no se registran ni se clasifican como capturas bloqueantes aceptables.
- Bloqueantes: `repeat_current` no suma, no cubre y no entra en historial. Sólo vive hasta la siguiente acción; no existe historial técnico o contador de bloqueantes en este incremento.
- Repetición: “Repetir este intento” conserva ejercicio, cancela voz, limpia audio, reconocimiento, texto, métricas y decisión, invalida trabajos, crea identidad/generación y vuelve a instrucción sin captura automática.
- Continuación bloqueante: “Continuar de todas formas” aparece junto a repetir, no registra y no cambia `CoachDecision`. Usa la función pura de candidatos del incremento 4 con dificultad objetivo igual a la actual, cobertura derivada sólo del historial y sin similitud de la captura. Mientras falta cobertura conserva el tipo obligatorio y muestra que todavía se requiere un intento válido de ese tipo.
- Preview: `selection_preview` deja de ser terminal. Tanto una aceptación válida como una continuación bloqueante limpian recursos y entran en preview; sólo la primera añade historial. “Comenzar siguiente ejercicio” vuelve a validar el candidato, lo activa, crea identidad/generación y vuelve a instrucción sin coaching, historial o captura automática.
- Cobertura y adaptación: los tres primeros válidos aceptados son palabra, frase y lectura guiada. Las capturas bloqueantes nunca cubren. Los válidos 4 y 5 usan `coach-rules-v1` y la adaptación determinista vigente sobre `EXERCISE_CATALOG`, sin cambiar reglas, candidatos, plantillas, umbrales o versiones.
- Finalización: cuatro registros previos más intento actual válido producen `complete_session`, pero la sesión sólo termina al pulsar “Finalizar sesión”. Esa acción registra posición 5 con `acceptedAction: "complete_session"`, limpia recursos, no selecciona ejercicio y entra en `completed`. Una quinta captura bloqueante mantiene 4 de 5 incluso al continuar.
- Vista completada: muestra únicamente “Sesión técnica completada”, 5 de 5 válidos, tres tipos practicados, ausencia de audio, aviso no clínico e “Iniciar nueva sesión”. No muestra puntuación, severidad, cambio clínico, adherencia, tratamiento, resumen profesional o `summary-rules-v1`.
- Nueva sesión: sólo desde `completed`; cancela voz, limpia cinco registros y recursos, restablece `practice-word-casa`, crea identidad/generación y vuelve a 0 de 5 sin captura ni persistencia. No existe reinicio global en curso.
- Intentos totales: no se define un límite adicional de capturas. La sesión puede permanecer abierta hasta obtener cinco válidos; se registra como limitación conocida y no genera contador de fallos o copy culpabilizante.
- Progreso: el indicador principal deja de usar “Ejercicio n de 3” y muestra válidos de cinco, válido pendiente, tipo actual y tipos cubiertos. La preview informa registros, siguiente válido y candidato; si procede de bloqueante mantiene el mismo pendiente y declara que la captura no se registró. Nunca representa progreso clínico.
- Voz: se conserva la política del incremento 6 y se cancela antes de captura, repetir, continuar, continuar de todas formas, activar ejercicio, finalizar, iniciar nueva sesión y desmontar. No existe autoplay.
- Privacidad: todo permanece en memoria; no se usa almacenamiento web, backend, Supabase u OpenAI. `Blob`, URL, stream, PCM y datos temporales se eliminan al cambiar de intento y nunca entran en `SessionAttemptRecord`.
- Contratos posteriores: `Attempt` y `Session` permanecen preliminares y no rigen el incremento 7. El requisito preliminar de grabación real y texto completo es incompatible con demo y con intentos válidos sin texto; su forma persistida se resolverá en el incremento 8 y nunca podrá exigir audio conservado.
- Secuenciación del PRD: `completed` en el incremento 7 sólo confirma cinco válidos en memoria. El estado completo del MVP se amplía con persistencia/roles en el incremento 8 y resumen/revisión profesional en el 9; no fue necesario modificar `prd.md` o `scope.md`.
- División interna futura: tramo A de contratos/máquina/historial; B de palabra → frase → lectura; C de adaptación 4–5 y continuación bloqueante; D de finalización/progreso/voz/nueva sesión; E de matriz automática, Chrome/Edge y revisión. Los cinco forman un único incremento y no autorizan commits parciales.
- Autorización: esta resolución no autoriza implementación. El código del incremento 7 requiere una solicitud explícita posterior.
- Verificación documental: búsquedas residuales confirmaron que `complete_session` como error, contador/cobertura fijos y preview terminal aparecen únicamente en el alcance histórico de los incrementos 5–6; la sección 10.9 y el incremento 7 del checklist los sustituyen para el siguiente incremento. Los bloques de código están balanceados, `git diff --check` no reporta errores y el diff contiene sólo los cuatro documentos autorizados. `prd.md`, `scope.md`, código, pruebas, configuración, dependencias y lockfile permanecen intactos.

## Implementación automática del incremento 7

- Fecha: 2026-07-19.
- Estado: los tramos A–D y la matriz automática del tramo E fueron implementados y verificados como un único incremento formal. La validación manual final se completó posteriormente en Chrome y Edge; el cierre se registra a continuación y no se inició el incremento 8.
- Dependencias y documentos normativos: `package.json`, `package-lock.json`, `AGENTS.md`, `spec.md`, `prd.md` y `scope.md` permanecen intactos. La documentación de ejecución se actualiza únicamente en `checklist.md` y `build-notes.md`.
- Arquitectura: `practiceSessionState.ts` contiene la máquina pura y `usePracticeSession.ts` compone su estado canónico con un único `usePracticeAttempt`. La sesión es dueña de `validHistory`, ejercicio actual, preview pendiente, progreso, cobertura y finalización; el controlador de intento conserva exclusivamente captura, reconocimiento, entrada manual/demo, audio temporal, métricas, coaching e identidad/generación del intento vigente.
- Estados: la unión discriminada usa `in_progress`, `selection_preview` y `completed`. `in_progress` compone `currentAttemptState`; la preview conserva ejercicio pendiente, origen y aviso; `completed` exige una tupla readonly de cinco registros y no contiene candidato.
- Historial: `SessionAttemptRecord` conserva posición 1–5, modo, copias profundas de `CoachInput` y `CoachDecision` y acción aceptada. Registros, snapshots, ejercicios, métricas, evidencias y arreglos anidados se copian y congelan. No se conserva `SpeechTextResult`, provisional, fecha, UUID, aleatoriedad, `Blob`, URL, stream, PCM o audio.
- Fuente de verdad: el contador anterior siempre se construye como `validHistory.length`; la cobertura se deriva de los tipos de los snapshots ya aceptados. La validación pura rechaza desborde, posiciones no consecutivas, contador/cobertura incoherentes, prefijo inicial incorrecto, acción incompatible, candidato ajeno y finalización fuera de la quinta posición.
- Tramo A: se implementaron contratos, creación inicial, composición, aceptación, activación, continuación bloqueante, finalización, reinicio y validación del historial. La primera prueba de una finalización prematura expuso una clasificación de error demasiado genérica; se corrigió a `invalid_completion_history` antes de continuar.
- Tramo B: `usePracticeAttempt` recibe ejercicio e historial desde la sesión y ya no duplica `currentExercise` ni posee la preview. Cada análisis construye `CoachInput` con el ejercicio vigente, contador y cobertura reales; analizar conserva el historial sin cambios. Palabra, frase y lectura se activan mediante el candidato devuelto por las reglas y un clic posterior en “Comenzar siguiente ejercicio”.
- Métricas textuales: el dominio cerrado sigue calculando su representación determinista; la capa de aplicación conserva en el `CoachInput` el `targetText` exacto del ejercicio vigente para satisfacer la validación contractual de frase y lectura sin modificar `text-metrics-v1`.
- Tramo C: después de cubrir palabra, frase y lectura, los intentos cuarto y quinto usan `coach-rules-v1` y `selectExerciseCandidate` sin cambios. Una captura bloqueante produce `repeat_current`; repetir conserva ejercicio y crea otro ID, mientras continuar de todas formas no registra ni cubre, usa dificultad actual y cobertura real, ignora similitud bloqueante y prepara una preview con aviso visible.
- Tramo D: sólo “Continuar” acepta `continue` y sólo “Finalizar sesión” acepta `complete_session`. El quinto análisis no completa por sí mismo; el clic final registra la posición 5, limpia recursos y entra en `completed`. Una quinta captura bloqueante conserva cuatro registros aun al continuar de todas formas.
- Guardas: referencias sincronizadas y guardas de transición evitan doble aceptación, doble finalización y activación duplicada. La generación existente invalida análisis y eventos tardíos. Una prueba integral descubrió que el candado de “continuar de todas formas” permanecía activo durante la preview; se libera después de consolidar esa transición y el estado canónico impide reutilizarla.
- Progreso e interfaz: `SessionProgress` muestra válidos de cinco, pendiente, tipo y cobertura técnica; la preview diferencia aceptación válida de captura no registrada. `SessionComplete` muestra sólo los seis elementos autorizados y dirige el foco al completar. Se retiró el progreso presentacional “Ejercicio n de 3” del recorrido principal.
- Nueva sesión: “Iniciar nueva sesión” sólo existe desde `completed`, cancela voz, limpia los cinco registros y recursos, vuelve a `practice-word-casa`, genera otra identidad y muestra 0 de 5 sin solicitar micrófono ni iniciar captura.
- Demo: `getDemoAttemptFixtures` produce texto final exacto y métricas coherentes para cada ejercicio del catálogo. Todo es local y determinista; no usa micrófono, `MediaRecorder`, `SpeechRecognition`, analizador Web Audio, `Blob` del usuario, red o persistencia.
- Voz y recursos: instrucción y feedback siguen requiriendo acción explícita. La voz se cancela antes de captura y en repetir, descartar, aceptar, continuar de todas formas, activar preview, finalizar y comenzar otra sesión. Cambiar de intento limpia reconocimiento, entrada manual, audio, URL, métricas, coaching y trabajos pendientes.
- Privacidad y costo: todo el incremento permanece en memoria y no introduce `localStorage`, Session Storage, IndexedDB, Cache API, `fetch`, telemetría, backend, Supabase, OpenAI, claves o servicios cobrables. No se añadieron dependencias ni se cambiaron versiones.
- Accesibilidad automatizada: las acciones son botones nativos de al menos 44 px, no existe autoplay o avance automático, el estado se anuncia, feedback/errores/preview/completed reciben foco dirigido y el contenido hablado conserva texto visible. La comprobación real de lector de pantalla, zoom y reflow queda para validación manual.
- Puerta A: `npm.cmd run typecheck`, código 0; `npm.cmd test -- session`, 1 archivo y 7/7 pruebas en el primer corte puro.
- Puerta B: typecheck con código 0; sesión 2 archivos y 10/10; práctica 8 archivos y 40/40.
- Puerta C: typecheck con código 0; sesión 2 archivos y 13/13; adaptación 15/15; candidatos 10/10; práctica 9 archivos y 44/44.
- Puerta D: typecheck con código 0; `PracticeAttemptFlow` 22/22 y sesión 15/15. Cubre cinco demos consecutivos, cinco válidos browser, cinco manuales, mezcla de modos, finalización explícita, ausencia de sexto intento, quinto bloqueante, reinicio limpio, foco y cancelaciones de voz.
- Verificación automática final posterior a documentación: `npm.cmd run lint`, código 0 sin errores ni advertencias; `npm.cmd run typecheck`, código 0; `npm.cmd test -- practice`, 9 archivos y 51/51; `npm.cmd test -- coaching`, 4 archivos y 104/104; `npm.cmd test`, 32 archivos y 339/339; `npm.cmd run build`, código 0, 70 módulos transformados y SPA estática generada.
- Limitaciones automatizadas: jsdom y los dobles no demuestran permisos, codecs, Web Audio, reconocimiento remoto propio del navegador, voces instaladas, pronunciación, Console/Network/Storage reales, lector de pantalla, zoom o reflow. Tampoco existe revisión clínica o profesional externa; ejercicios, métricas, coaching y progreso son una demostración técnica no clínicamente validada.
- Validación manual final: Chrome y Edge completaron sesiones de cinco intentos mediante demo y entrada manual. `SpeechRecognition` no produjo un resultado utilizable; el fallback manual permitió continuar y el reconocimiento browser permanece como mejora progresiva, no como requisito para completar la sesión.

## Validación manual final y cierre del incremento 7

- Fecha: 2026-07-20.
- Dictamen: `APTO PARA CERRAR`.
- Estado: el responsable completó la validación técnica y funcional en Chrome y Edge. No quedaron defectos materiales conocidos; el incremento 7 queda completado y no se inició el incremento 8.
- Modos validados: la sesión completa de cinco intentos funcionó mediante demo y entrada manual en ambos navegadores. `SpeechRecognition` no produjo un resultado utilizable durante la prueba; el fallo o la indisponibilidad no bloquearon el recorrido y el fallback manual funcionó correctamente. No se exige completar cinco intentos mediante reconocimiento browser.
- Aceptación: la sesión inició en 0 de 5 con `practice-word-casa`; analizar no registró. Sólo “Continuar” aceptó `continue` y sólo “Finalizar sesión” aceptó y registró el quinto `complete_session`.
- Cobertura y adaptación: palabra seleccionó frase, frase seleccionó lectura guiada y los tres primeros válidos cubrieron los tipos obligatorios. Los intentos cuarto y quinto usaron la adaptación determinista existente.
- Capturas bloqueantes: no incrementaron `validHistory` ni aportaron cobertura. “Repetir este intento” conservó el ejercicio y limpió datos temporales; “Continuar de todas formas” no registró la captura y la preview requirió “Comenzar siguiente ejercicio”. Una quinta bloqueante mantuvo 4 de 5.
- Finalización y reinicio: analizar el quinto válido no completó la sesión. La vista `completed` apareció sólo tras la acción final, mostró exclusivamente los resultados técnicos autorizados y no creó un sexto intento. Una nueva sesión limpió el historial y regresó a palabra y 0 de 5.
- Voz, micrófono y recursos: la voz se canceló antes de capturar, repetir, continuar, activar otro ejercicio, finalizar o iniciar otra sesión. No existió autoplay. Micrófono, audio y recursos temporales se limpiaron en las transiciones verificadas.
- Privacidad: Console permaneció sin errores. Network no mostró solicitudes propias de Rimay con audio, texto, métricas, decisiones o historial. Local Storage, Session Storage, IndexedDB y Cache no recibieron datos de sesión; todo permaneció en memoria.
- Accesibilidad: teclado, foco visible, zoom 200 % y reflow funcionaron correctamente en Chrome y Edge. No se informó una comprobación manual de lector de pantalla en esta validación, por lo que no se afirma como realizada.
- Limitaciones: `SpeechRecognition` continúa sujeto a soporte, permisos, red y comportamiento del navegador y no fue utilizable en esta prueba. No existe límite total de capturas; sólo cuentan intentos válidos aceptados. No existe resumen clínico o profesional y no hubo revisión clínica o profesional externa.
- Dependencias y alcance: `package.json` y `package-lock.json` permanecen intactos. No se añadieron persistencia, roles, vista profesional, `summary-rules-v1`, backend, Supabase, OpenAI ni código del incremento 8.

**Cierre:** el incremento 7 queda completado con dictamen `APTO PARA CERRAR`. La validación fue técnica y funcional, no clínica; el reconocimiento browser no produjo un resultado utilizable y el fallback manual permitió completar el flujo. No se inició el incremento 8.

## Congelación documental posterior al incremento 7

- Fecha: 2026-07-20.
- Estado base observado: rama `main`, árbol limpio y `HEAD` `c13fe5e69645a76b4d9babe331e3a8c6cdf87030` (`feat: add adaptive five-attempt practice session`).
- Alcance autorizado: exclusivamente `AGENTS.md`, `spec.md`, `checklist.md` y `build-notes.md`; no se modificaron código, pruebas, configuración, README, otros materiales de entrega, dependencias, lockfile o servicios y no se creó commit.
- Congelación: el incremento 7 cerrado es la base de la versión candidata. No se implementan los incrementos 8–9 ni se amplía funcionalidad.
- Capacidades incluidas: captura temporal, análisis acústico local, reconocimiento browser opcional, entrada manual, demo determinista, métricas textuales locales, coaching determinista, catálogo de tres ejercicios, voz accesible, cinco intentos adaptativos y finalización técnica.
- Trabajo futuro: persistencia local, roles, panel y resumen profesional, sincronización, backend y validación clínica. Estas capacidades diferidas no se registran como defectos de la versión candidata.
- Auditoría estática P0/P1: no se encontraron solicitudes propias de red, almacenamiento web, OpenAI, Supabase, telemetría, logs de producción, backend, Functions, rutas secundarias o secretos en el runtime. La UI conserva propósito técnico, aviso no clínico, privacidad del audio, distinción demo/medición real, entrada manual declarada, controles nativos y finalización técnica.
- Vercel: `package.json` usa `npm run build`, Vite conserva la salida predeterminada `dist`, no existen rutas de cliente ni archivos de backend y no se requiere `vercel.json`. La documentación vigente de Vite y Vercel indica detección automática del framework y de la salida. Hobby debe confirmarse en el panel como uso personal o no comercial, sin prueba Pro, tarjeta, Functions, add-ons, Storage, analytics pagos o dominio comprado.
- Variables: la aplicación no consulta `process.env` ni `import.meta.env`. `.env.example` conserva una variable histórica no consumida; no es requisito de build o runtime y no se configura en Vercel.
- Verificación de esta pausa: presencia y lectura completa de los documentos normativos, configuración y flujo principal; búsquedas negativas de red, almacenamiento, servicios, secretos, rutas locales y backend; revisión del diff y `git diff --check`. Los comandos de producto se sustituyen por comprobaciones documentales porque `AGENTS.md` mantiene esta fase como exclusivamente documental.
- Límite de la pausa: README, `submission.md`, `demo-script.md`, `release-checklist.md`, pruebas/build frescos, despliegue, remoto, push y commit quedan pendientes de una autorización que amplíe expresamente los archivos y acciones permitidos.

## Preparación documental autorizada de la versión candidata

- Fecha: 2026-07-20.
- Autorización posterior: se amplió el alcance únicamente a `README.md`, `docs/hackathon-build/submission.md`, `docs/hackathon-build/demo-script.md`, `docs/hackathon-build/release-checklist.md` y los cuatro documentos normativos ya modificados. Se autorizaron verificaciones frescas y un commit local exclusivamente documental; push, remotos, despliegue y `/feedback` permanecen prohibidos en esta fase.
- Materiales creados: README narrativo, borrador de Devpost, guion hablado y checklist operativo. El guion contiene 336 palabras de narración, aproximadamente 2.3 minutos a 145 palabras por minuto más las acciones en pantalla, dentro del objetivo total de 2:30–3:00.
- Auditoría editorial y estática: no se encontraron rutas absolutas locales de Windows o macOS, correos, secretos de alta confianza, enlaces Markdown locales, marcadores bloqueantes de trabajo pendiente, afirmaciones positivas de Supabase/OpenAI como runtime o documentación que presente los incrementos 8–9 como iniciados. Las menciones clínicas de los materiales son límites explícitos, no afirmaciones diagnósticas o terapéuticas.
- Coherencia: persistencia, roles, panel y resumen profesional se describen sólo como trabajo futuro. El reconocimiento browser permanece como mejora progresiva sin resultado utilizable observado; demo y entrada manual conservan la validación manual de Chrome y Edge. Continúan pendientes lector de pantalla, revisión clínica o profesional externa, GitHub, Vercel, video, capturas, Devpost y `/feedback`.
- `npm.cmd run lint`: código 0, sin errores ni advertencias reportados.
- `npm.cmd run typecheck`: código 0.
- `npm.cmd test -- session`: 2 archivos y 15/15 pruebas aprobadas.
- `npm.cmd test -- practice`: 9 archivos y 51/51 pruebas aprobadas.
- `npm.cmd test -- coaching`: 4 archivos y 104/104 pruebas aprobadas.
- `npm.cmd test`: 32 archivos y 339/339 pruebas aprobadas.
- `npm.cmd run build`: código 0; Vite 8.1.5 transformó 70 módulos y generó `dist/index.html` (0.58 kB), CSS (22.65 kB) y JavaScript (299.85 kB).
- Dependencias y código: `src/`, `package.json` y `package-lock.json` permanecen intactos. No se añadieron persistencia, roles, panel profesional, backend, Supabase, OpenAI API, servicios o dependencias.

## Hotfix P1 de voces y finalización de audio

- Fecha: 2026-07-20.
- Alcance: corrección mínima y autorizada de dos defectos P1 observados en producción. No se iniciaron los incrementos 8–9, no se añadieron características, servicios o dependencias y `package.json`/`package-lock.json` permanecieron intactos.
- Estado: la verificación automática local está aprobada. La versión publicada todavía no se considera revalidada; se debe enviar este commit, esperar un deployment nuevo y repetir los recorridos de Chrome y Edge.

### P1 — voces de SpeechSynthesis en el primer montaje

- Causa raíz confirmada: `BrowserSpeechOutput` registraba `voiceschanged` antes de su consulta inmediata, pero, si `getVoices()` devolvía una lista vacía, dependía exclusivamente de otro `voiceschanged`. Si el evento ya había ocurrido o el navegador publicaba voces sin emitirlo nuevamente, el estado permanecía en `loading_voices` hasta remontar el controlador.
- Corrección: se conserva la política de selección española existente y se añadieron cinco reintentos acotados (50, 150, 300, 600 y 1 000 ms), consulta al recuperar foco o visibilidad sólo mientras no exista una voz seleccionada y cleanup completo de timer/listeners al disponer el controlador. Encontrar una voz española detiene el ciclo; una lista no vacía sin voz española queda `unavailable`, sin fallback silencioso. No existe autoplay ni cambio de foco.
- Regresión: se prueba el orden listener/consulta, aparición sin `voiceschanged`, límite de reintentos, cleanup, recuperación por foco/visibilidad, ausencia de locución automática y habilitación del hook en el primer montaje.

### P1 — Blob de MediaRecorder no reproducible o decodificable

- Diagnóstico previo: el recorrido anterior sólo publicaba un resultado si el `Blob` tenía `size > 0`; por ello el caso observado en producción no correspondía a `size === 0`, chunks totalmente ausentes o un MIME final vacío. La construcción ya ocurría desde `onstop` y priorizaba `mediaRecorder.mimeType`. Como la versión publicada no conservaba tamaño, MIME ni trazas binarias, no es posible reconstruir forénsicamente los bytes exactos de esa captura después del hecho.
- Causa raíz confirmada en la implementación: el protocolo de finalización no tenía un latch de stop ni estado aislado por captura. Chunks, tamaño y error terminal vivían en refs compartidas, y `reset`/desmontaje retiraban handlers, vaciaban chunks y detenían tracks inmediatamente, antes del `stop` real. Una captura anterior podía además escribir en los refs de una nueva. El stop normal tampoco solicitaba un flush compatible antes de detener. Esas carreras permitían perder el chunk final o contaminar el ensamblado, produciendo un contenedor positivo en bytes pero técnicamente incompleto.
- Corrección: cada captura posee una sesión cerrada con recorder, stream, chunks, tamaño, MIME negociado, ID y latch de stop. Los handlers se instalan antes de `start()`, se ignoran chunks vacíos, `requestData()` se intenta con guardas antes de un único `stop()`, el `Blob` sólo se construye después del evento `stop`, y el MIME usa primero `mediaRecorder.mimeType` y luego el negociado. Tracks, chunks y handlers se liberan después de finalizar; resultados obsoletos se descartan sin afectar una sesión nueva. `RecordedAudio` conserva internamente `sizeBytes` y el MIME real. La URL se revoca sólo al descartar, reemplazar o desmontar.
- Regresión: 14 pruebas dedicadas cubren el último `dataavailable` posterior a la solicitud de stop, creación posterior al chunk final, chunks vacíos, orden completo, MIME real y fallback, doble stop, cleanup diferido, resultados tardíos tras reset/desmontaje, aislamiento entre capturas, Strict Mode, error `audio_empty`, ciclo de URL y tamaño real. La prueba de interfaz confirma además que reanalizar reutiliza exactamente el mismo `Blob`.

### Matriz automática del hotfix

- `npm.cmd run lint`: código 0.
- `npm.cmd run typecheck`: código 0.
- `npm.cmd test -- speech-output`: 4 archivos y 35/35 pruebas aprobadas.
- `npm.cmd test -- useAudioRecorder AudioRecorderCard`: 3 archivos y 41/41 pruebas aprobadas.
- `npm.cmd test -- audio-analysis`: 1 archivo y 6/6 pruebas aprobadas.
- `npm.cmd test -- practice`: 9 archivos y 51/51 pruebas aprobadas.
- `npm.cmd test`: 33 archivos y 358/358 pruebas aprobadas.
- `npm.cmd run build`: código 0; Vite 8.1.5 transformó 70 módulos y generó `dist/index.html` (0.58 kB), CSS (22.65 kB) y JavaScript (302.38 kB).
- `git diff --check`: código 0.
- Validación de producción pendiente: primer montaje de voz, captura reproducible, análisis y reanálisis deben repetirse en Chrome y Edge después del deployment de este commit. Hasta entonces la versión no está apta para grabar el video final.

## Decisiones confirmadas

| ID | Decisión | Motivo y consecuencia |
| --- | --- | --- |
| D-001 | Los roles quedan fuera de la versión candidata congelada. | El selector paciente/profesional permanece como trabajo futuro y no representa un defecto de la entrega técnica. |
| D-002 | El audio es estrictamente temporal. | El `Blob` puede reproducirse y analizarse localmente, pero Rimay no lo envía ni lo guarda. La vista profesional no tiene audio histórico. |
| D-003 | La voz de salida usa `SpeechSynthesis`. | Evita claves, costo y latencia. Siempre hay texto visible; un control contextual permite escuchar o detener y volver a escuchar mediante una nueva acción explícita. |
| D-004 | El modo demo usa `DemoSpeechRecognizer`. | Completa el recorrido sin red ni secretos mediante fixtures deterministas y declara que no analizó el audio. |
| D-005 | El reconocimiento automático es opcional. | `BrowserSpeechRecognizer` se usa sólo tras aviso y elección; la entrada manual está disponible desde el inicio y como recuperación. |
| D-006 | Rimay no envía el `Blob`. | `BrowserSpeechRecognizer` escucha mediante la API del navegador en paralelo; no recibe el archivo de `MediaRecorder`. |
| D-007 | Se informa la frontera de privacidad del navegador. | Algunos navegadores pueden usar un servicio remoto propio; Rimay no promete reconocimiento local u offline. |
| D-008 | Las métricas de audio y texto se calculan localmente. | `audio-metrics-v1` y `text-metrics-v1` son deterministas, versionados y no clínicos. |
| D-009 | Retroalimentación y adaptación son deterministas; el resumen queda diferido. | `coach-rules-v1` y plantillas locales reemplazan GPT en la versión entregada; `summary-rules-v1` permanece como trabajo futuro. |
| D-010 | La sesión tiene cinco intentos válidos. | Los tres primeros cubren palabra, frase y lectura guiada; los restantes permiten adaptación acotada. |
| D-011 | La versión candidata no persiste sesiones. | Todo el historial del incremento 7 vive en memoria; una posible persistencia `rimay.demo.v1` y su eliminación total quedan como trabajo futuro. |
| D-012 | El MVP no usa Supabase ni backend. | No hay Edge Functions, Database, Storage, Auth, RLS, migraciones o secretos. |
| D-013 | El MVP no usa APIs de OpenAI en runtime. | OpenAI API, `gpt-4o-transcribe`, GPT-5.6 API y Responses API quedan excluidos. |
| D-014 | El frontend estático se despliega en Vercel Hobby. | Se usa el subdominio gratuito, sin Functions, add-ons, prueba Pro, dominio comprado ni tarjeta. |
| D-015 | Se usa npm y TypeScript estricto. | Los comandos y lockfile permanecen como contrato reproducible. |
| D-016 | Compatibilidad primaria: Chrome y Edge de escritorio actuales. | Otros navegadores reciben detección de soporte y ruta manual; no se finge compatibilidad. |
| D-017 | Todo el contenido de la demostración es ficticio. | No se aceptan pacientes, audio o historias clínicas reales. |
| D-018 | Codex y GPT-5.6 son herramientas de construcción. | Pueden asistir al equipo, pero no son servicios runtime ni requisitos para ejecutar Rimay. |
| D-019 | El contador de coaching describe el estado anterior al intento actual. | `validAttemptCountBeforeCurrent` vale de 0 a 4; sólo un intento sin calidad bloqueante puede sumar uno y completar el quinto. |
| D-020 | La cobertura anterior es una entrada explícita. | `coveredExerciseTypesBeforeCurrent` permite calcular la cobertura posterior con el tipo actual válido y rechazar la ausencia del tipo requerido sin fallback. |
| D-021 | El motor devuelve una unión tipada. | `CoachResult` separa decisiones completas de errores esperables y evita fallbacks o IDs inventados. |
| D-022 | `repeat_current` es sólo una recomendación. | No contiene ejercicio alternativo ni inicia acciones; continuar pese a ella se integra en el incremento 7 sin contar el intento defectuoso. |
| D-023 | La selección de candidatos tiene orden total versionado. | Ordena copias por cobertura, distancia, ID actual, tipo, dificultad e ID ordinal, sin mutar `allowedExercises` ni usar `localeCompare`. |
| D-024 | El incremento 5 es un único recorrido de palabra. | Termina tras feedback escrito y acción explícita; una segunda captura y la sesión pertenecen a incrementos posteriores. |
| D-025 | Demo integra fixtures y no solicita micrófono. | Usa métricas acústicas y texto simulados, locales y versionados; no captura voz, no usa red, no produce WPM y declara su procedencia. |
| D-026 | `continue` termina en una vista previa. | Valida la selección y limpia recursos sin iniciar otra grabación, sesión, contador o evaluación. |
| D-027 | La aplicación falla de forma segura ante acciones inesperadas. | `complete_session` con contador anterior cero produce `unexpected_coach_action`; una selección ajena al catálogo también es un error tipado. |
| D-028 | Un intento tiene identidad monotónica y evaluación única. | El ID no usa reloj ni aleatoriedad; la generación invalida resultados tardíos y el motor se llama una sola vez desde la acción explícita. |
| D-029 | El límite de 10 MB no cambia en el incremento 5. | La recuperación debe ser clara; revisar la conservación de reproducción o la política queda para el incremento 10. |
| D-030 | El catálogo final inicial contiene exactamente tres ejercicios. | Conserva una palabra de dificultad 1, una frase de dificultad 2 y una lectura guiada de dificultad 3, sin convertir la distribución en matriz obligatoria. |
| D-031 | `pauseCues` usa offsets UTF-16 de frontera. | Las marcas son posteriores a puntuación, validables con el texto NFC exacto y visibles sin modificar el objetivo ni asignar duración clínica. |
| D-032 | `SpeechOutput` resuelve idioma y voz dentro del adaptador. | El dominio sólo habla texto, detiene y consulta disponibilidad; la selección española es determinista y no persiste objetos del navegador. |
| D-033 | La voz del incremento 6 habla sólo instrucción y feedback curados. | No sintetiza contenido del usuario, objetivos por separado, métricas o IDs; toda voz tiene texto visible, control explícito y fallback no bloqueante. |
| D-034 | El incremento 6 conserva un solo recorrido. | El catálogo y la voz preparan el incremento 7, pero `selection_preview` no inicia una segunda captura, sesión o historial. |
| D-035 | El incremento 7 tiene exactamente cinco intentos válidos aceptados. | Capturas bloqueantes, descartes y errores técnicos no cuentan; no existe límite adicional de capturas totales. |
| D-036 | Sólo una acción explícita acepta y registra un intento. | “Continuar” acepta `continue` y “Finalizar sesión” acepta `complete_session`; analizar nunca modifica el historial. |
| D-037 | `validHistory` es la única fuente de verdad de progreso y cobertura. | El contador es su longitud y los tipos cubiertos se derivan de sus snapshots; no existe estado duplicado. |
| D-038 | El historial del incremento 7 usa `SessionAttemptRecord` efímero. | Conserva snapshots profundos y modo, admite texto nulo y excluye texto completo, provisional, reloj, UUID, aleatoriedad y audio. |
| D-039 | Las capturas bloqueantes no se conservan. | `repeat_current` no suma ni cubre; no existe historial técnico o contador de fallos en este incremento. |
| D-040 | Continuar una captura bloqueante usa dificultad actual. | La función pura de candidatos recibe cobertura válida previa y no usa similitud de una captura bloqueante; `CoachDecision` no cambia. |
| D-041 | `selection_preview` requiere activación explícita en el incremento 7. | “Comenzar siguiente ejercicio” valida y activa el candidato con nueva identidad, sin captura, historial o coaching automáticos. |
| D-042 | La finalización exige “Finalizar sesión”. | `complete_session` no registra por análisis; la acción acepta el quinto snapshot, limpia y entra en `completed`. |
| D-043 | `completed` es técnico y no profesional. | Muestra 5 de 5, cobertura, ausencia de audio y aviso no clínico; resumen y panel permanecen en el incremento 9. |
| D-044 | Una nueva sesión sólo comienza desde `completed`. | Limpia historial y recursos, restablece palabra y vuelve a 0 de 5 sin persistencia o captura automática. |
| D-045 | El progreso visible describe sólo flujo técnico. | Se muestran válidos de cinco y tipos cubiertos; no se presenta puntuación o evolución clínica. |
| D-046 | El incremento 7 permanece completamente en memoria. | No usa almacenamiento web, contratos persistidos, repositorios, backend, Supabase u OpenAI y nunca conserva audio. |
| D-047 | Los contratos preliminares `Attempt` y `Session` no rigen el incremento 7. | Demo no tiene grabación real y un válido puede carecer de texto; la forma persistida se resolverá en el incremento 8. |
| D-048 | La versión candidata se congela sobre el incremento 7. | Sólo se admiten correcciones P0/P1 mínimas y autorizadas; no se amplía funcionalidad. |
| D-049 | Los incrementos 8–9 quedan diferidos. | Persistencia, roles, panel y resumen profesional son trabajo futuro y no defectos de la entrega. |
| D-050 | La preparación documental final fue autorizada en una fase posterior. | Permite README, materiales Devpost, guion, checklist, matriz fresca y un commit local exclusivamente documental; no autoriza push, remoto, despliegue o `/feedback`. |

Las decisiones anteriores que proponían un modo `live`, GPT o Supabase quedan sustituidas por D-004 a D-018 desde esta pausa documental.

## Decisiones técnicas de referencia

- Captura máxima: 60 segundos o 10 MB, lo que ocurra primero.
- Orden de MIME: `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4` y formato predeterminado sólo si Web Audio puede decodificarlo.
- Audio: `audio-metrics-v1` conserva las fórmulas verificadas en el incremento 2.
- Texto: `text-metrics-v1` conserva original, normalizado NFC y comparación sin tildes ni diéresis pero con `ñ` distinta de `n`; usa alineamiento dinámico por palabras con operaciones y desempate estables.
- Reconocimiento browser: tag inicial `es-EC`, resultados provisionales y finales, error mapping y alternativa manual.
- Reconocimiento demo: fixtures por IDs conocidos, sin `fetch` y sin acceso al audio.
- Coaching entregado: `coach-rules-v1` devuelve `CoachResult`, usa contador y cobertura anteriores al intento actual y selecciona desde `allowedExercises` con orden total; `summary-rules-v1` queda diferido.
- Catálogo: tres ejercicios readonly en orden palabra/frase/lectura, con dificultades 1–2–3 y secuencia explícita; no existe matriz obligatoria de nueve entradas.
- Pausas editoriales: offsets UTF-16 posteriores a puntuación sobre `targetText` NFC; no representan duración clínica.
- Voz: `SpeechOutput` mínimo, `es-EC` preferido, selección `es-*` determinista, parámetros `1/1/1`, una locución activa, `voiceschanged`, cancelación y fallback textual.
- Persistencia futura: una ampliación posterior puede usar `rimay.demo.v1`, máximo 20 sesiones ficticias y lista explícita de claves para eliminación total; la versión candidata no usa almacenamiento web.
- Despliegue: build estático Vite en Vercel Hobby; no se prevén variables de entorno runtime.

## Elementos pagados eliminados

- `OPENAI_API_KEY` y cualquier otro secreto de proveedor.
- OpenAI Audio Transcriptions y `gpt-4o-transcribe`.
- GPT-5.6 API, Responses API y Structured Outputs runtime.
- Las funciones `transcribe-attempt`, `coach-attempt` y `summarize-session`.
- Supabase CLI, proyecto, Edge Functions, Database, Storage, Auth, RLS y migraciones.
- Clientes `live`, CORS de funciones, rate limiting remoto y variables `VITE_SUPABASE_*`.
- APIs comerciales de transcripción y servicios con prueba temporal.
- Vercel Pro, pago por uso, Functions, add-ons, recursos de almacenamiento y dominio comprado.
- Cualquier requisito de tarjeta de crédito.

## Riesgos conocidos y mitigaciones

| Riesgo | Mitigación prevista |
| --- | --- |
| Diferencias de codec y decodificación | Negociar MIME con `isTypeSupported` y probar Chrome/Edge; no fabricar métricas si falla Web Audio. |
| Ruido ambiental altera actividad de voz | Umbrales versionados, flags técnicas y fixtures sintéticos; nunca interpretar clínicamente. |
| Web Speech no está soportado en todos los navegadores | Detectar constructor estándar/prefijado y ofrecer entrada manual siempre. |
| El navegador usa reconocimiento remoto | Aviso previo, consentimiento explícito y opción de omitir reconocimiento; Rimay nunca envía el `Blob`. |
| Red, permiso, silencio o cancelación impiden texto final | Errores tipados, conservar captura temporal y enfocar entrada manual. |
| Reconocimiento impreciso de habla disártrica | Mostrarlo como aproximación, conservar procedencia, permitir edición manual y no convertir similitud en severidad. |
| Resultados provisionales cambian o no finalizan | Mostrar estado provisional; sólo final o manual se vuelve resultado estable. |
| La sesión no continua de Web Speech finaliza tras una pausa extensa o por criterios internos del navegador | Conservar la grabación, informar el cierre y mantener disponible la entrada manual; no atribuirlo a truncación propia de Rimay. |
| Reglas parecen una evaluación clínica | Plantillas curadas, evidencia técnica, filtro editorial y aviso no clínico junto a métricas. |
| Persistencia local queda corrupta o excede cuota | Validación runtime, máximo 20 sesiones y continuidad en memoria. |
| Borrado local incompleto | Registro de claves propias, verificación posterior y mensaje de error si queda alguna; no usar `clear()`. |
| Vercel Hobby cambia límites o condiciones | Revisar documentación antes del despliegue; no activar pago y aceptar pausa al agotar cupo. |
| Voz española no disponible | Buscar voz `es-*`; conservar texto y mostrar aviso no bloqueante. |
| La lista de voces inicia vacía, cambia o invalida la selección | Escuchar `voiceschanged`, volver a seleccionar desde la lista vigente, usar generación y no persistir objetos `SpeechSynthesisVoice`. |
| La síntesis se mezcla con captura o reconocimiento | Cancelar toda locución antes de solicitar micrófono o iniciar reconocimiento. |
| Una voz del navegador se gestiona remotamente | Preferir `localService`, hablar sólo contenido ficticio visible y no prometer funcionamiento local u offline. |
| Accesibilidad motora o cognitiva insuficiente | Controles grandes, teclado, foco visible, sin tiempo forzado ni avance automático, mensajes breves. |

## Dudas pendientes no bloqueantes

Estas preguntas deben resolverse en el incremento que las necesite:

- ¿Qué versiones, sistema operativo y políticas exactas de Chrome y Edge se usarán en la presentación?
- ¿`es-EC` ofrece resultados estables en ambos navegadores objetivo o debe definirse otro tag español para el demo, sin fallback silencioso?
- ¿Qué profesional revisará el catálogo, las plantillas, las pausas guiadas y el tono final del contenido ficticio?
- ¿Los umbrales de `audio-metrics-v1` se comportan de forma útil con muestras ficticias variadas? Cualquier ajuste exige nueva versión.
- ¿Qué límites y condiciones de Vercel Hobby están vigentes en la fecha real del despliegue?
- ¿La presentación se realizará con red disponible para el reconocimiento browser o debe usar principalmente demo/manual?

## Fuentes consultadas

- [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Errores de SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionErrorEvent/error)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [MediaRecorder.isTypeSupported](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static)
- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Límites de Vercel](https://vercel.com/docs/limits)
- [Precios de Vercel](https://vercel.com/pricing)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Guía de Vite](https://vite.dev/guide/)
- [Tailwind CSS con Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Guía de Vitest](https://vitest.dev/guide/)

Las fuentes cambiantes deben revisarse otra vez en el incremento donde se implemente Web Speech o se despliegue en Vercel.
