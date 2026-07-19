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

Las decisiones anteriores que proponían un modo `live`, GPT o Supabase quedan sustituidas por D-004 a D-018 desde esta pausa documental.

## Decisiones técnicas de referencia

- Captura máxima: 60 segundos o 10 MB, lo que ocurra primero.
- Orden de MIME: `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4` y formato predeterminado sólo si Web Audio puede decodificarlo.
- Audio: `audio-metrics-v1` conserva las fórmulas verificadas en el incremento 2.
- Texto: `text-metrics-v1` conserva original, normalizado NFC y comparación sin tildes ni diéresis pero con `ñ` distinta de `n`; usa alineamiento dinámico por palabras con operaciones y desempate estables.
- Reconocimiento browser: tag inicial `es-EC`, resultados provisionales y finales, error mapping y alternativa manual.
- Reconocimiento demo: fixtures por IDs conocidos, sin `fetch` y sin acceso al audio.
- Coaching: `coach-rules-v1`; resumen: `summary-rules-v1`.
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
