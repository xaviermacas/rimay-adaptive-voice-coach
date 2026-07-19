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

## Decisiones confirmadas

| ID | Decisión | Motivo y consecuencia |
| --- | --- | --- |
| D-001 | El MVP usa un selector local paciente/profesional sin login. | La revisión ocurre en el mismo navegador y no representa un modelo de acceso clínico. |
| D-002 | El audio es estrictamente temporal. | El `Blob` puede reproducirse y analizarse localmente, pero Rimay no lo envía ni lo guarda. La vista profesional no tiene audio histórico. |
| D-003 | La voz de salida usa `SpeechSynthesis`. | Evita claves, costo y latencia. Siempre hay texto visible y controles para escuchar, detener y repetir. |
| D-004 | El modo demo usa `DemoSpeechRecognizer`. | Completa el recorrido sin red ni secretos mediante fixtures deterministas y declara que no analizó el audio. |
| D-005 | El reconocimiento automático es opcional. | `BrowserSpeechRecognizer` se usa sólo tras aviso y elección; la entrada manual está disponible desde el inicio y como recuperación. |
| D-006 | Rimay no envía el `Blob`. | `BrowserSpeechRecognizer` escucha mediante la API del navegador en paralelo; no recibe el archivo de `MediaRecorder`. |
| D-007 | Se informa la frontera de privacidad del navegador. | Algunos navegadores pueden usar un servicio remoto propio; Rimay no promete reconocimiento local u offline. |
| D-008 | Las métricas de audio y texto se calculan localmente. | `audio-metrics-v1` y `text-metrics-v1` son deterministas, versionados y no clínicos. |
| D-009 | Retroalimentación, adaptación y resumen son deterministas. | Reglas y plantillas locales reemplazan GPT; toda acción incluye versión, razón y evidencia. |
| D-010 | La sesión tiene cinco intentos válidos. | Los tres primeros cubren palabra, frase y lectura guiada; los restantes permiten adaptación acotada. |
| D-011 | Persistencia sólo en `localStorage`. | `rimay.demo.v1` guarda sesiones ficticias y datos derivados; existe eliminación total y nunca se persiste audio. |
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

Las decisiones anteriores que proponían un modo `live`, GPT o Supabase quedan sustituidas por D-004 a D-018 desde esta pausa documental.

## Decisiones técnicas de referencia

- Captura máxima: 60 segundos o 10 MB, lo que ocurra primero.
- Orden de MIME: `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4` y formato predeterminado sólo si Web Audio puede decodificarlo.
- Audio: `audio-metrics-v1` conserva las fórmulas verificadas en el incremento 2.
- Texto: `text-metrics-v1` conserva original, normalizado NFC y comparación sin tildes ni diéresis pero con `ñ` distinta de `n`; usa alineamiento dinámico por palabras con operaciones y desempate estables.
- Reconocimiento browser: tag inicial `es-EC`, resultados provisionales y finales, error mapping y alternativa manual.
- Reconocimiento demo: fixtures por IDs conocidos, sin `fetch` y sin acceso al audio.
- Coaching: `coach-rules-v1` devuelve `CoachResult`, usa contador y cobertura anteriores al intento actual y selecciona desde `allowedExercises` con orden total; resumen: `summary-rules-v1`.
- Persistencia: clave `rimay.demo.v1`, máximo 20 sesiones ficticias y lista explícita de claves para eliminación total.
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
