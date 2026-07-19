# Especificación técnica — Rimay Adaptive Voice Coach

## 1. Estado y alcance de esta especificación

Esta especificación define la arquitectura objetivo del MVP después de completar los incrementos 1 y 2. La revisión actual es exclusivamente documental y reemplaza, antes del incremento 3, la arquitectura anterior basada en Supabase y OpenAI por una arquitectura runtime local de costo USD 0.

No se autoriza implementación mediante esta revisión. El nuevo incremento 3 requiere autorización expresa independiente.

Palabras normativas:

- **debe**: requisito obligatorio del MVP;
- **no debe**: comportamiento prohibido;
- **puede**: decisión opcional que no cambia los contratos;
- **posterior**: fuera del MVP y sujeto a otra autorización.

## 2. Principios arquitectónicos

1. **Costo USD 0:** construir, probar, ejecutar y desplegar no requiere facturación, tarjeta, crédito promocional ni prueba temporal.
2. **Frontend estático:** todo el runtime de Rimay vive en la SPA; no existe backend, Function o servicio contratado.
3. **Audio efímero:** el `Blob` de `MediaRecorder` sólo vive durante el intento actual, nunca se envía y nunca se persiste.
4. **Reconocimiento opcional y honesto:** la procedencia `browser`, `demo` o `manual` siempre se muestra; ninguna ruta finge haber analizado audio.
5. **Privacidad informada:** antes de `SpeechRecognition`, la UI advierte que el navegador puede usar un servicio remoto propio y permite continuar manualmente.
6. **Métricas deterministas:** audio y texto se calculan localmente mediante algoritmos versionados.
7. **Coaching determinista:** retroalimentación, adaptación y resumen usan reglas versionadas y plantillas curadas, no IA runtime.
8. **Adaptación controlada:** sólo se puede seleccionar un ejercicio de la lista permitida y toda decisión incluye una razón trazable.
9. **Accesibilidad estructural:** texto, teclado, foco, tamaño de controles y estados son parte del contrato.
10. **Límite médico explícito:** toda salida es descriptiva, no clínica y limitada a datos ficticios.
11. **Dependencias mínimas:** cada librería debe resolver una necesidad verificable, fijar versión y no introducir consumo remoto cobrable.

## 3. Vista de arquitectura

```text
Vercel Hobby — archivos estáticos únicamente
└─ React + Vite + TypeScript
   ├─ UI paciente / profesional
   ├─ MediaRecorder ──────────────── Blob temporal sólo en memoria
   ├─ Web Audio ──────────────────── audio-metrics-v1
   ├─ SpeechRecognizer
   │  ├─ BrowserSpeechRecognizer ─── SpeechRecognition | webkitSpeechRecognition
   │  └─ DemoSpeechRecognizer ────── fixtures; sin red; no inspecciona audio
   ├─ ManualSpeechTextInput ───────── texto identificado como manual
   ├─ text-metrics-v1 ─────────────── normalización, tokens y comparación local
   ├─ coach-rules-v1 ──────────────── plantillas, razones y adaptación local
   ├─ SpeechSynthesis ──────────────── salida opcional con texto equivalente
   └─ LocalSessionRepository ───────── localStorage; sin audio; borrado total
```

No existen en el MVP:

- Supabase, Edge Functions, Database, Storage, Auth, RLS o migraciones;
- OpenAI API, `gpt-4o-transcribe`, GPT-5.6 API o Responses API;
- APIs comerciales de transcripción o modelos hospedados contratados;
- Vercel Functions, add-ons, almacenamiento, dominios comprados o planes pagos;
- secretos o variables runtime necesarias para que la aplicación funcione.

Codex y GPT-5.6 son herramientas de construcción usadas fuera de la aplicación durante diseño, implementación, revisión, pruebas y documentación. No aparecen en el diagrama runtime.

## 4. Capas y responsabilidades

### 4.1 Presentación

- Renderiza contenido en español neutro.
- Mantiene foco, anuncios de estado y controles principales de al menos 44 por 44 píxeles CSS.
- Distingue texto provisional, final, demo y manual.
- Muestra versiones, unidades, procedencia, razones y ausencia de audio histórico.
- Presenta el aviso de privacidad antes de permitir reconocimiento automático.
- No implementa fórmulas de métricas o reglas adaptativas dentro de componentes React.

### 4.2 Aplicación

- Orquesta las máquinas de estado de sesión, grabación y reconocimiento.
- Inicia `MediaRecorder` y `BrowserSpeechRecognizer` en paralelo desde una acción explícita cuando esa ruta fue elegida.
- Conserva y libera el `Blob`, las pistas, URLs temporales, listeners y timers.
- Decide cuándo un texto final, demo o manual es utilizable.
- Invoca métricas locales y el motor determinista.
- Persiste únicamente datos derivados validados.

### 4.3 Dominio

- Define contratos compartidos y estados discriminados.
- Implementa normalización, métricas, catálogo, política de candidatos, reglas y resúmenes como funciones puras.
- No importa React ni objetos crudos del navegador.
- No conoce endpoints, cuentas, claves, facturación o formatos de proveedores externos.

### 4.4 Adaptadores del navegador

- Traducen `MediaRecorder`, Web Audio, Web Speech, `SpeechSynthesis` y `localStorage` a contratos internos.
- Devuelven errores tipados y mensajes seguros.
- No registran audio, PCM, textos ni documentos de sesión.
- `BrowserSpeechRecognizer` no recibe el `Blob`, no crea `fetch` y no afirma que el navegador procese localmente.

### 4.5 Demostración

- Usa fixtures versionados y respuestas derivadas de IDs conocidos.
- Simula secuencias provisionales, finales y errores mediante reloj inyectable.
- No usa valores aleatorios sin semilla.
- No realiza `fetch`, no requiere red y no inspecciona `Blob`, PCM o `MediaStream`.
- Muestra: “Demostración predefinida: este texto no proviene del análisis de tu audio”.

## 5. Componentes funcionales previstos

### Shell y navegación

- `AppShell`: encabezado, aviso no clínico, costo cero y contenido principal.
- `RoleSwitcher`: selector Paciente/Profesional; no representa autenticación.
- `SpeechTextSourceBadge`: muestra “Navegador”, “Demostración” o “Manual”.
- `MedicalDisclaimer`: explica el límite no clínico con texto persistente.
- `DeleteLocalData`: confirma y elimina todos los datos propios de Rimay.

### Paciente

- `SessionStart`: iniciar, continuar o descartar una sesión ficticia.
- `ExerciseInstruction`: tipo, progreso, instrucción y texto a pronunciar.
- `SpeechControls`: escuchar, detener y repetir voz del navegador.
- `RecognitionPrivacyChoice`: aviso y elección automática/manual.
- `RecordingControls`: preparar micrófono, grabar, detener y estado.
- `LiveRecognitionText`: muestra por separado texto provisional y final.
- `ManualSpeechTextInput`: captura texto manual y rotula su origen.
- `RecordingReview`: reproductor temporal, regrabar o analizar.
- `AttemptMetrics`: valores, unidades, procedencia, calidad y versiones.
- `CoachFeedback`: plantilla, explicación, controles de voz, repetir o continuar.
- `SessionComplete`: confirmación y cambio a vista profesional.

### Profesional

- `SessionList`: lista local de sesiones ficticias.
- `SessionReview`: estado, intentos y ausencia explícita de audio.
- `AttemptReview`: prompt, texto/procedencia, métricas, calidad y decisión.
- `ProfessionalSummaryView`: observaciones deterministas, evidencia y limitaciones.

Los nombres orientan la futura organización; los contratos y comportamientos son normativos.

## 6. Contratos de dominio

Los siguientes contratos son la forma canónica prevista. Al implementarse, deben tener equivalentes de validación runtime donde crucen almacenamiento o APIs del navegador.

```ts
type UserRole = 'patient' | 'professional'
type ExerciseType =
  | 'word_repetition'
  | 'phrase_repetition'
  | 'guided_reading'
type Difficulty = 1 | 2 | 3

interface Exercise {
  id: string
  type: ExerciseType
  difficulty: Difficulty
  instruction: string
  targetText: string
  pauseCues: readonly number[]
  expectedMaxDurationMs: number
}

interface RecordingMetadata {
  mimeType: string
  sizeBytes: number
  durationMs: number
  sampleRateHz: number | null
  channelCount: number | null
}
```

`pauseCues` contiene posiciones de `targetText` para representar lectura guiada; no es una expectativa clínica sobre pausas reales. `instruction` y `targetText` contienen texto ficticio visible en español neutro.

### 6.1 Texto reconocido o declarado

```ts
type SpeechTextSource = 'browser' | 'demo' | 'manual'
type SpeechRecognitionStatus =
  | 'idle'
  | 'requesting'
  | 'listening'
  | 'processing'
  | 'completed'
  | 'unsupported'
  | 'cancelled'
  | 'error'

type SpeechRecognitionErrorCode =
  | 'unsupported'
  | 'permission_denied'
  | 'audio_capture_failed'
  | 'network_failed'
  | 'no_speech'
  | 'aborted'
  | 'language_not_supported'
  | 'service_not_allowed'
  | 'unknown'

interface SpeechTextResult {
  originalText: string
  normalizedText: string
  comparisonText: string
  source: SpeechTextSource
  languageRequested: string | null
  isFinal: boolean
  warnings: readonly string[]
  createdAt: string
}
```

Reglas:

- `originalText` conserva exactamente el texto recibido; las otras dos representaciones se derivan con las reglas de la sección 9.2;
- `languageRequested` contiene el tag solicitado al reconocedor, inicialmente `es-EC`, y es `null` cuando la entrada manual no solicitó un idioma al navegador;
- sólo un resultado con `isFinal: true` y texto no vacío puede convertirse en texto estable de un intento;
- un resultado con `isFinal: false` es transitorio, se muestra como provisional y nunca se persiste;
- soporte ausente, fallos y cancelación se representan mediante `SpeechRecognitionStatus` y `SpeechRecognitionErrorCode`; no se fabrica un `SpeechTextResult` vacío;
- `source: 'demo'` exige el aviso de fixture y no puede atribuirse al audio;
- `source: 'manual'` se muestra como declaración del usuario, no como transcripción automática;
- editar un texto reconocido crea un nuevo resultado `manual`; no se conserva `browser` como procedencia;
- `createdAt` usa ISO 8601 y `warnings` no puede contener contenido reconocido ni detalles crudos del navegador.

### 6.2 Métricas de audio

```ts
type AudioQualityFlag =
  | 'no_speech_detected'
  | 'too_quiet'
  | 'possible_clipping'
  | 'audio_too_short'
  | 'transcription_missing'

interface AudioMetrics {
  algorithmVersion: 'audio-metrics-v1'
  totalDurationMs: number
  analyzedDurationMs: number
  estimatedSpeechDurationMs: number
  silenceDurationMs: number
  silenceRatio: number
  pauseCount: number
  averagePauseDurationMs: number | null
  maximumPauseDurationMs: number | null
  rms: number
  peak: number
  clippedSampleRatio: number
  possibleClipping: boolean
  qualityFlags: readonly AudioQualityFlag[]
}
```

Los valores y umbrales de `audio-metrics-v1` permanecen como fueron implementados y registrados en `build-notes.md`. Un cambio de significado exige `audio-metrics-v2`.

El identificador histórico `transcription_missing` se conserva para no cambiar silenciosamente `audio-metrics-v1`; en la nueva UI significa que todavía no existe texto utilizable, ya sea de origen browser, demo o manual. Renombrarlo requeriría una versión nueva.

`qualityFlags` es la fuente canónica para las condiciones acústicas categóricas. Los identificadores exactos permanecen `audio_too_short`, `no_speech_detected`, `too_quiet`, `possible_clipping` y `transcription_missing`; el motor no crea alias. Para `coach-rules-v1` son bloqueantes `audio_too_short`, `no_speech_detected`, `too_quiet`, `possible_clipping` y `silenceRatio >= 0.85`. `transcription_missing`, ausencia de texto utilizable o similitud `null` no son fallos de captura.

Todo booleano derivado que represente la misma condición que una bandera debe coincidir con `qualityFlags`. En `audio-metrics-v1`, `possibleClipping` debe ser igual a `qualityFlags.includes('possible_clipping')`; una contradicción produce `inconsistent_audio_metrics` y no una decisión de coaching.

### 6.3 Métricas de texto

```ts
interface WordMatch {
  targetIndex: number
  transcribedIndex: number
  token: string
}

interface IndexedToken {
  index: number
  token: string
}

interface WordSubstitution {
  targetIndex: number
  transcribedIndex: number
  targetToken: string
  transcribedToken: string
}

type WordsPerMinuteUnavailableReason =
  | 'no_real_recording'
  | 'invalid_total_duration'
  | 'demo_source'
  | 'insufficient_voice_activity'

interface TextMetrics {
  algorithmVersion: 'text-metrics-v1'
  source: SpeechTextSource
  targetText: string
  transcribedText: string
  targetWordCount: number
  transcribedWordCount: number
  matchedWordCount: number
  matchedWords: readonly WordMatch[]
  omittedWords: readonly IndexedToken[]
  additionalWords: readonly IndexedToken[]
  substitutedWords: readonly WordSubstitution[]
  wordErrorCount: number
  wordErrorRate: number
  textSimilarity: number
  wordsPerMinute: number | null
  wordsPerMinuteUnavailableReason: WordsPerMinuteUnavailableReason | null
  warnings: readonly string[]
}

type TextMetricsResult =
  | { status: 'success'; metrics: TextMetrics }
  | { status: 'error'; error: { code: 'empty_target'; message: string } }
```

`TextMetrics` describe una comparación técnica. `targetText` y `transcribedText` conservan las representaciones normalizadas; el alineamiento compara los tokens derivados de `comparisonText`, pero las listas visibles conservan tildes, diéresis y `ñ`. Para origen `manual`, la UI debe decir que los cálculos comparan la frase objetivo con texto escrito por el usuario y que Rimay no verificó ese contenido contra la grabación; para origen `demo`, que se basan en un fixture. Ninguna fuente convierte los valores en evaluación clínica.

### 6.4 Motor de retroalimentación y adaptación

```ts
type FeedbackFocus =
  | 'repeat_calmly'
  | 'steady_pace'
  | 'follow_pause_cues'
  | 'clear_capture'
  | 'continue'
  | 'complete'

type CoachAction = 'repeat_current' | 'continue' | 'complete_session'

type MetricEvidenceKey =
  | keyof AudioMetrics
  | keyof TextMetrics
  | 'pauseCues'
  | 'expectedMaxDurationMs'
  | 'currentDifficulty'
  | 'validAttemptCountBeforeCurrent'

interface CoachInput {
  attemptId: string
  currentExercise: Exercise
  textSource: SpeechTextSource | null
  audioMetrics: AudioMetrics
  textMetrics: TextMetrics | null
  currentDifficulty: Difficulty
  validAttemptCountBeforeCurrent: number
  coveredExerciseTypesBeforeCurrent: readonly ExerciseType[]
  allowedExercises: readonly Exercise[]
}

interface CoachDecision {
  rulesVersion: 'coach-rules-v1'
  ruleId: string
  templateId: string
  shortFeedback: string
  focus: FeedbackFocus
  action: CoachAction
  explanation: string
  evidenceKeys: readonly MetricEvidenceKey[]
  selectedExerciseId: string | null
}

type CoachErrorCode =
  | 'invalid_input'
  | 'invalid_attempt_state'
  | 'incompatible_algorithm_version'
  | 'empty_allowed_exercises'
  | 'duplicate_exercise_id'
  | 'invalid_exercise'
  | 'missing_required_exercise_type'
  | 'inconsistent_audio_metrics'
  | 'inconsistent_text_metrics'

interface CoachError {
  code: CoachErrorCode
  message: string
}

type CoachResult =
  | { ok: true; decision: CoachDecision }
  | { ok: false; error: CoachError }
```

`validAttemptCountBeforeCurrent` cuenta únicamente intentos válidos terminados antes del actual. Debe ser un entero entre `0` y `4`. Un intento con calidad bloqueante no lo incrementa. Si el intento actual es válido, completa la sesión cuando `validAttemptCountBeforeCurrent + 1 === 5`.

`coveredExerciseTypesBeforeCurrent` contiene únicamente tipos cubiertos por intentos válidos anteriores, sin duplicados y en orden canónico. Para contadores `0`, `1` y `2`, debe ser respectivamente `[]`, `['word_repetition']` y `['word_repetition', 'phrase_repetition']`; con contador `3` o `4` contiene los tres tipos. Mientras el contador sea menor que `3`, `currentExercise.type` debe ser el siguiente tipo del orden. Cualquier incoherencia produce `invalid_attempt_state`. Para un intento actual válido, el motor calcula internamente la cobertura posterior añadiendo `currentExercise.type`.

`shortFeedback` y `explanation` salen exclusivamente de plantillas curadas. `selectedExerciseId` debe ser `null` para `repeat_current` y `complete_session`, o pertenecer a `allowedExercises` para `continue`. Los errores esperables se devuelven como `CoachResult`; no se expresan como decisiones parciales ni mediante un ID inventado.

Cuando `textMetrics` no es `null`, `textMetrics.targetText` debe ser exactamente igual a `currentExercise.targetText`. La comparación contractual no normaliza, corrige ni elimina puntuación. Una diferencia devuelve `inconsistent_text_metrics` antes de usar esas métricas para dificultad, foco, evidencia o selección.

### 6.5 Sesiones y resumen

```ts
interface Attempt {
  id: string
  sessionId: string
  sequence: number
  exerciseSnapshot: Exercise
  status: 'completed'
  recording: RecordingMetadata
  speechText: SpeechTextResult
  audioMetrics: AudioMetrics
  textMetrics: TextMetrics | null
  decision: CoachDecision
  createdAt: string
}

interface Session {
  id: string
  schemaVersion: 1
  status: 'in_progress' | 'completed'
  fictionalParticipantId: string
  attemptIds: readonly string[]
  currentExerciseId: string | null
  startedAt: string
  completedAt: string | null
}

interface EvidenceReference {
  attemptId: string
  metricKeys: readonly MetricEvidenceKey[]
}

interface SummaryObservation {
  templateId: string
  text: string
  evidence: readonly EvidenceReference[]
}

interface ProfessionalSummary {
  rulesVersion: 'summary-rules-v1'
  overview: string
  observations: readonly SummaryObservation[]
  dataQualityNotes: readonly string[]
  limitations: readonly string[]
  source: 'local_rules'
}
```

Las recapturas descartadas y los errores técnicos nunca se convierten en `Attempt`. Las referencias sólo pueden apuntar a intentos de la misma sesión y a claves existentes.

En `Session`, la cantidad de intentos válidos terminados se deriva de `attemptIds.length`; no se persiste un segundo contador que pueda divergir. `validAttemptCountBeforeCurrent` pertenece exclusivamente a `CoachInput` y describe el estado anterior al intento que se está evaluando.

## 7. Contratos de reconocimiento y salida

```ts
interface RecognitionCallbacks {
  onInterim(text: string): void
  onFinal(text: string): void
  onError(errorCode: SpeechRecognitionErrorCode): void
  onEnd(): void
}

interface ActiveRecognition {
  stop(): void
  abort(): void
}

interface SpeechRecognizer {
  readonly source: 'browser' | 'demo'
  isSupported(): boolean
  start(input: {
    languageTag: string
    callbacks: RecognitionCallbacks
  }): ActiveRecognition
}

interface SessionBundle {
  session: Session
  attempts: readonly Attempt[]
  summary: ProfessionalSummary | null
}

interface SessionRepository {
  list(): Promise<readonly Session[]>
  get(sessionId: string): Promise<SessionBundle | null>
  save(bundle: SessionBundle): Promise<void>
  remove(sessionId: string): Promise<void>
  removeAll(): Promise<void>
}

interface SpeechOutput {
  speak(text: string): Promise<void>
  stop(): void
  isAvailable(): boolean
}
```

`ManualSpeechTextInput` no implementa `SpeechRecognizer`, porque no reconoce voz. Produce un `SpeechTextResult` con `source: 'manual'` tras una acción explícita.

### 7.1 `BrowserSpeechRecognizer`

- Detecta primero `window.SpeechRecognition` y después `window.webkitSpeechRecognition`.
- Si ninguno existe, devuelve `unsupported` sin solicitar permiso.
- Configura `lang` con un tag BCP 47 español definido por la aplicación, inicialmente `es-EC`; un error de idioma conduce a entrada manual y no cambia de idioma silenciosamente.
- Configura `interimResults = true` y `maxAlternatives = 1`.
- Puede usar `continuous` sólo si las pruebas de Chrome y Edge demuestran un cierre estable dentro del límite de 60 segundos; la lógica no debe depender de continuidad ilimitada.
- Traduce eventos crudos a callbacks internos y errores conocidos.
- `stop()` intenta obtener un resultado final; `abort()` cancela sin conservar texto provisional.
- Nunca recibe el `Blob`, no sube archivos y no puede prometer procesamiento local u offline.

### 7.2 `DemoSpeechRecognizer`

- Selecciona una secuencia por `exerciseId` y `scenarioId` conocidos.
- Emite cero o más resultados provisionales y un resultado final usando un reloj inyectable.
- Los errores demo son escenarios explícitos y estables.
- No recibe grabación, stream, PCM o métricas como entrada.
- La misma configuración produce la misma secuencia y tiempos lógicos.

## 8. Flujo de captura, reconocimiento y privacidad

### 8.1 Preparación

1. Comprobar soporte de `MediaRecorder`, Web Audio y Web Speech sin pedir permiso.
2. Mostrar el aviso `speech-privacy-v1` antes de cualquier reconocimiento:
   - el `Blob` se mantiene sólo en memoria;
   - Rimay no envía ni almacena el `Blob`;
   - el navegador puede enviar audio de reconocimiento a un servicio remoto propio;
   - Rimay no controla la retención o procesamiento de ese servicio;
   - la entrada manual permite continuar sin reconocimiento automático.
3. Registrar sólo en el estado de la sesión que el aviso visible fue aceptado; no registrar datos personales.

### 8.2 Captura paralela

1. El formato de `MediaRecorder` se selecciona con `isTypeSupported()` en este orden:
   1. `audio/webm;codecs=opus`;
   2. `audio/webm`;
   3. `audio/mp4`;
   4. formato predeterminado sólo si Web Audio puede decodificarlo.
2. Tras la elección y acción del usuario, iniciar reconocimiento y `MediaRecorder` en la misma transición de estado.
3. Ambos mecanismos escuchan el micrófono en paralelo, pero no se presupone que procesen exactamente los mismos bytes, intervalos o canal.
4. Los chunks de `MediaRecorder` se acumulan en memoria. La captura se detiene a 60 000 ms o 10 000 000 bytes.
5. Al detener, solicitar fin del reconocimiento, cerrar todas las pistas y aceptar sólo un resultado final.
6. Si el reconocedor termina antes, la grabación puede continuar; la UI informa la situación y conserva la ruta manual.
7. Si la grabación termina antes, se detiene o cancela el reconocedor y se conserva el `Blob` sólo para reproducción y análisis local.

### 8.3 Limpieza

- Revocar la URL del reproductor al reemplazar el `Blob`, descartar, finalizar o desmontar.
- Liberar pistas, callbacks, listeners, timers, `AudioContext` y referencias al `Blob`.
- Un resultado tardío después de cancelar o desmontar se ignora mediante un identificador de ejecución.
- No serializar, convertir a base64, copiar a logs o escribir audio en `localStorage`, IndexedDB o Cache API.

## 9. Procesamiento local de audio y texto

### 9.1 `audio-metrics-v1`

`audio-metrics-v1` mantiene las fórmulas implementadas en el incremento 2:

- PCM mono como promedio por muestra de los canales;
- ventanas de 20 ms;
- RMS global y por ventana;
- pico absoluto;
- piso de ruido en percentil 20;
- umbral `max(0.015, noiseFloor × 3)`;
- unión de brechas menores de 200 ms;
- descarte de segmentos menores de 120 ms;
- pausas internas de al menos 300 ms;
- clipping cuando `abs(sample) >= 0.99` y flag desde ratio `>= 0.001`;
- duraciones y proporción de silencio deterministas.

Los umbrales son heurísticas técnicas de captura. No se pueden presentar como límites clínicos.

### 9.2 Normalización española de `text-metrics-v1`

Cada texto conserva tres representaciones:

1. `originalText` es el valor recibido sin modificaciones.
2. `normalizedText` aplica Unicode NFC, convierte a minúsculas con locale español, reemplaza la puntuación por espacios, colapsa el espacio en blanco y recorta los extremos. Conserva vocales acentuadas, diéresis y `ñ`.
3. `comparisonText` parte de `normalizedText`, conserva cada `ñ` como una letra distinta y elimina tildes o diéresis de los demás caracteres únicamente para comparar.

Para construir `comparisonText`, cada `ñ` se protege antes de descomponer los demás caracteres y retirar sus marcas diacríticas. No se permite retirar marcas combinantes de forma indiscriminada, porque eso transformaría `ñ` en `n`. El resultado vuelve a una forma Unicode compuesta y conserva los espacios ya normalizados.

La puntuación se reemplaza por espacios para no unir palabras adyacentes. La normalización no corrige palabras, no expande abreviaturas y no usa diccionarios o servicios externos. Una cadena vacía continúa vacía y se valida antes de calcular métricas.

### 9.3 Alineamiento, WER y similitud

- El objetivo y el texto utilizable se tokenizan por los espacios de sus respectivos `comparisonText`.
- Una matriz de programación dinámica alinea palabras con cuatro operaciones: `match` con costo `0`, y `substitution`, `omission` o `addition` con costo `1`.
- Una sustitución es una única operación entre un token objetivo y un token del texto; no se convierte en una omisión más una adición.
- Durante el backtracking, los empates se resuelven siempre en este orden: `match`, `substitution`, `omission`, `addition`.
- Coincidencias, sustituciones, omisiones y adiciones se emiten en orden ascendente, con índices estables. Los tokens visibles proceden de `normalizedText` para conservar tildes, diéresis y `ñ`.

```text
wordErrorCount = substitutions + omissions + additions
wordErrorRate = wordErrorCount / targetWordCount
textSimilarity = max(0, 1 - wordErrorRate)
```

`wordErrorRate` puede ser mayor que `1` cuando existen muchas palabras adicionales. `textSimilarity` queda limitado entre `0` y `1`; ambos valores se redondean a cuatro decimales después de calcular con precisión completa. Si el objetivo queda vacío tras normalizar, se devuelve `TextMetricsResult` con error tipado `empty_target` y no se fabrica un objeto de métricas.

La matriz, los costos y la regla de desempate forman parte de `text-metrics-v1`; cambiarlos exige una versión nueva y fixtures nuevos.

### 9.4 Palabras por minuto

```text
wordsPerMinute = transcribedWordCount / (totalDurationMs / 60_000)
```

- `totalDurationMs` debe proceder de una grabación real, ser finito y mayor que cero. Incluye pausas y representa la velocidad global de la producción.
- `wordsPerMinute` se redondea a una cifra decimal y es `null` si no existe grabación real o la duración es cero, inválida o no finita.
- Un resultado demo sin audio real produce `null`.
- Una entrada manual sin captura produce `null`; si está asociada a una captura real válida, puede producir WPM y conserva `source: 'manual'`.
- WPM también es `null` si `qualityFlags` contiene `no_speech_detected` o `too_quiet`, o si `estimatedSpeechDurationMs` es menor que `audio-metrics-v1.minimumSpeechDurationMs`.
- `estimatedSpeechDurationMs` se usa sólo como condición de calidad y nunca como denominador de WPM: medir sólo el tiempo estimado de voz correspondería a otra métrica similar a una tasa de articulación, fuera de este incremento.
- `wordsPerMinuteUnavailableReason` distingue ausencia de grabación, duración inválida, fuente demo y actividad de voz insuficiente; es `null` cuando existe un valor numérico.
- La UI nombra siempre la procedencia y no afirma que las palabras manuales o demo fueron contadas automáticamente a partir de la voz.

## 10. Motor determinista de retroalimentación y adaptación

### 10.1 Entradas y pureza

`coach-rules-v1` recibe exclusivamente `CoachInput` y devuelve `CoachResult`. No recibe audio, objetos del navegador, hora actual, red ni aleatoriedad. Todos los catálogos, umbrales, plantillas y órdenes pertenecen a la versión.

La misma entrada serializable debe producir exactamente el mismo `CoachResult`, incluidos error o decisión, texto, IDs, evidencia y ejercicio. Los errores esperables permanecen en la rama `ok: false`; no se convierten en fallbacks, decisiones incompletas o excepciones de control de flujo.

### 10.2 Tabla de señales

| Señal | Uso permitido |
| --- | --- |
| Banderas de calidad | Usar los identificadores exactos de `AudioQualityFlag` para sugerir una captura más clara; nunca clasificar a la persona. |
| Similitud textual | Ajustar dificultad dentro de 1–3 y explicar la comparación con `targetText` según la procedencia. |
| Pausas | Elegir una plantilla de pausas sólo en lectura guiada. |
| Duración | Elegir una plantilla de ritmo cuando supera la duración esperada del ejercicio; no imponer diagnóstico ni límite terapéutico. |
| Proporción de silencio | Sugerir revisar inicio de captura o repetir; no inferir fluidez clínica. |
| Dificultad actual | Calcular la dificultad objetivo acotada. |
| Intentos válidos anteriores | Usar `validAttemptCountBeforeCurrent` para finalización sin contar capturas bloqueantes. |
| Cobertura anterior | Usar `coveredExerciseTypesBeforeCurrent` para garantizar los tres tipos obligatorios en orden. |

### 10.3 Orden de evaluación

1. Validar entrada, estado del intento, versión `audio-metrics-v1`, versión `text-metrics-v1` cuando existan métricas textuales, consistencia acústica y `allowedExercises`:
   - entrada mal formada: `invalid_input`;
   - contador fuera de `0`–`4`, cobertura imposible o estado incoherente con intentos válidos anteriores: `invalid_attempt_state`;
   - versión de algoritmo incompatible: `incompatible_algorithm_version`;
   - lista permitida vacía: `empty_allowed_exercises`;
   - IDs repetidos: `duplicate_exercise_id`;
   - ejercicio actual o permitido inválido: `invalid_exercise`;
   - contradicción entre un booleano acústico derivado y su flag: `inconsistent_audio_metrics`.
   - `targetText` textual distinto del ejercicio actual: `inconsistent_text_metrics`.
2. Evaluar calidad acústica desde `qualityFlags`. Si contiene `no_speech_detected`, `too_quiet`, `possible_clipping` o `audio_too_short`, o si `silenceRatio >= 0.85`, devolver `repeat_current`, foco `clear_capture` y una plantilla de captura. El intento no es válido, no incrementa `validAttemptCountBeforeCurrent` y no añade cobertura. La repetición sólo ocurre si el usuario la elige.
3. Si la calidad no es bloqueante, contabilizar conceptualmente el intento actual como válido: `nextValidAttemptCount = validAttemptCountBeforeCurrent + 1` y cobertura posterior igual a los tipos anteriores más `currentExercise.type`.
4. Si `nextValidAttemptCount === 5`, devolver `complete_session`, sin siguiente ejercicio. Una captura bloqueante en esta frontera ya terminó en el paso 2 y nunca completa la sesión.
5. Calcular el primer tipo obligatorio todavía ausente después del intento actual, en este orden: `word_repetition`, `phrase_repetition`, `guided_reading`. Si falta uno, considerar exclusivamente ejercicios permitidos de ese tipo. Si no existe ninguno, devolver `missing_required_exercise_type`; no aplicar fallback.
6. Calcular dificultad objetivo:
   - similitud `null`: mantener;
   - similitud menor de `0.65`: reducir una, mínimo 1;
   - similitud entre `0.65` y `0.85`, inclusivo: mantener;
   - similitud mayor de `0.85` y sin flags de captura: aumentar una, máximo 3;
   - en otro caso: mantener.
7. Seleccionar foco de plantilla en este orden:
   - lectura guiada con `pauseCues.length > 0` y `pauseCount === 0`: `follow_pause_cues`;
   - duración mayor a `expectedMaxDurationMs`: `steady_pace`;
   - similitud menor de `0.65`: `repeat_calmly`;
   - resto: `continue`.
8. Ordenar una copia de los candidatos, sin mutar `allowedExercises`, por: tipo obligatorio pendiente, distancia a dificultad objetivo, evitar `currentExercise.id`, orden de tipo, dificultad e ID. El orden de tipo es `word_repetition`, `phrase_repetition`, `guided_reading`. Los IDs usan comparación ordinal con `<` y `>`; no se usa `localeCompare`.
9. Elegir el primer candidato. Si solamente existe `currentExercise` y no falta un tipo obligatorio, puede seleccionarse de nuevo. El ID elegido siempre pertenece a `allowedExercises`.
10. Seleccionar la plantilla asociada al `ruleId` y producir `CoachDecision`, mencionando sólo evidencia real y procedencia correcta.

La política de candidatos se exporta como función pura independiente para que el incremento 7 pueda continuar después de una recomendación `repeat_current` sin añadir un ejercicio alternativo a esa decisión. Recibe datos validados, ordena copias y produce el mismo resultado para la misma entrada.

Los umbrales son reglas de interacción del demo y no están clínicamente validados. Cualquier cambio crea `coach-rules-v2`.

### 10.4 Plantillas curadas

- Cada plantilla tiene ID estable, foco, acción permitida, texto breve y explicación.
- El texto visible no contiene diagnóstico, severidad, pronóstico, prescripción, comparación poblacional o promesas.
- La plantilla no inserta valores que no existan en la evidencia.
- Cada `evidenceKey` respalda una afirmación explícita de `shortFeedback` o `explanation`; los criterios internos usados para ordenar candidatos no se exponen sólo por intervenir en la selección.
- `pauseCues` y `expectedMaxDurationMs` son evidencias editoriales válidas del ejercicio actual. La plantilla de pausas declara exactamente `pauseCount` y `pauseCues`; la de ritmo declara exactamente `totalDurationMs` y `expectedMaxDurationMs`.
- Las plantillas con texto declaran únicamente `textSimilarity`. La plantilla sin texto declara `qualityFlags`, `silenceRatio` y `currentDifficulty`, sin evidencia textual.
- Los números de métricas se renderizan desde los contratos, no desde texto libre.
- La procedencia se nombra exactamente como “texto reconocido” para `browser`, “texto introducido” para `manual` y “texto simulado” para `demo`.
- Una plantilla manual o demo no atribuye el texto al análisis de pronunciación. La evidencia acústica y textual se mantiene separada y ninguna se presenta como validación de la otra.
- Un filtro editorial unitario revisa todas las plantillas durante pruebas.

### 10.5 Repetición manual

- Antes de aceptar un intento, el usuario puede descartarlo y grabar de nuevo.
- Una decisión `repeat_current` siempre contiene `selectedExerciseId: null`; es una recomendación y nunca inicia una repetición.
- Si el usuario decide continuar pese a la recomendación, esa interacción pertenece al incremento 7 y usa la función pura de candidatos exportada en el incremento 4. El intento defectuoso no cuenta como válido ni aporta cobertura.
- El motor no inicia grabación, no avanza automáticamente y no impone una cuenta regresiva.
- Repetir libera primero el `Blob`, URL, reconocimiento y resultados temporales anteriores.

### 10.6 Resumen profesional

`summary-rules-v1` ordena plantillas por ID de intento y evidencia disponible. El resumen:

- declara que la sesión y los datos son ficticios;
- enumera procedencia del texto y banderas de calidad presentes;
- referencia métricas visibles sin interpretarlas clínicamente;
- incluye las versiones de audio, texto y coaching;
- no compara a la persona con una población;
- produce el mismo resultado para el mismo `SessionBundle`.

## 11. Persistencia local y eliminación

`LocalSessionRepository` usa una única clave versionada: `rimay.demo.v1`.

```ts
interface PersistedRimayData {
  schemaVersion: 1
  sessions: readonly Session[]
  attemptsBySession: Readonly<Record<string, readonly Attempt[]>>
  summariesBySession: Readonly<Record<string, ProfessionalSummary>>
}
```

Antes de escribir:

- validar el documento completo;
- aceptar sólo perfiles y sesiones ficticias;
- excluir `Blob`, URL, base64, `MediaStream`, buffer PCM, objetos Web Speech y texto provisional;
- limitar el historial a las 20 sesiones ficticias más recientes;
- capturar `QuotaExceededError` y continuar en memoria;
- no sincronizar entre dispositivos, cuentas o pestañas como requisito del MVP.

La acción “Eliminar todos los datos locales” debe:

1. solicitar confirmación clara;
2. detener grabación, reconocimiento y síntesis activos;
3. liberar pistas, contexts, buffers, URLs y `Blob` en memoria;
4. eliminar `rimay.demo.v1` y cualquier clave futura registrada en la lista de claves propias de Rimay;
5. limpiar sesiones, intentos, resúmenes y fixtures cargados en memoria;
6. verificar que las claves propias ya no existan antes de confirmar éxito;
7. no llamar `localStorage.clear()`, para no afectar datos ajenos del mismo origen.

Rimay no puede eliminar datos que un servicio propio del navegador hubiera procesado fuera del almacenamiento de la aplicación; el aviso de privacidad debe declarar ese límite.

## 12. Seguridad, privacidad y costo

### 12.1 Prohibiciones runtime

- No incluir SDKs, clientes, endpoints o variables de OpenAI, Supabase u otro proveedor de análisis.
- No usar `fetch`, XHR, WebSocket o `sendBeacon` para enviar audio, texto, métricas o sesiones.
- No incluir secretos ni solicitar claves al usuario.
- No activar analytics, telemetría, crash reporting o fuentes remotas en el MVP.
- No cargar modelos, diccionarios o recursos desde una CDN en runtime; los assets necesarios deben formar parte del build estático.

### 12.2 Frontera de privacidad de Web Speech

`BrowserSpeechRecognizer` es una llamada a una capacidad del agente de usuario. Algunos navegadores implementan esa capacidad con un motor remoto y pueden requerir red. Rimay:

- no selecciona ni contrata ese proveedor;
- no recibe garantías sobre retención, ubicación o exactitud;
- no puede inspeccionar ni borrar datos procesados por el navegador;
- no afirma que el reconocimiento sea offline;
- permite omitirlo por completo y usar entrada manual.

### 12.3 Guardas de costo

- Despliegue exclusivo en Vercel Hobby con SPA estática y subdominio gratuito `.vercel.app`.
- No activar prueba Pro, equipo pago, add-on, Storage, Functions, Analytics Plus, Speed Insights pago o dominio comprado.
- No introducir una tarjeta de crédito para el proyecto.
- Revisar el panel de proyecto antes y después del despliegue para confirmar plan Hobby y ausencia de recursos facturables.
- Si un límite de Hobby se alcanza, aceptar la pausa o esperar el restablecimiento; no habilitar pago por uso.
- Revisar términos y límites vigentes justo antes del despliegue, porque el plan puede cambiar.

## 13. Configuración

El MVP no necesita variables de entorno runtime. Las opciones se resuelven mediante configuración local versionada y segura:

```text
recognitionLanguageTag=es-EC
audioMetricsVersion=audio-metrics-v1
textMetricsVersion=text-metrics-v1
coachRulesVersion=coach-rules-v1
summaryRulesVersion=summary-rules-v1
storageKey=rimay.demo.v1
```

No se crea `.env` para OpenAI, Supabase o un proveedor de transcripción. Si una herramienta de build exige variables internas, ninguna puede contener secretos, endpoints de análisis o habilitadores de facturación.

## 14. Estructura futura de carpetas

```text
AGENTS.md
README.md
docs/hackathon-build/
src/
  app/
  components/
  config/
  domain/
    audio/
    text/
    coaching/
    exercises/
    sessions/
    contracts/
  features/
    practice/
    recording/
    speech-recognition/
    professional-review/
  recognizers/
    browser/
    demo/
  repositories/
  test/
```

No se prevén carpetas `supabase/`, `api/`, `functions/` o adaptadores OpenAI en el MVP.

## 15. Estrategia de pruebas

### 15.1 Unitarias con Vitest

- Métricas de audio existentes con PCM sintético.
- Las tres representaciones textuales con acentos, diéresis, `ñ`, mayúsculas, puntuación, números, espacios y Unicode.
- Tokenización, conteos, WER, similitud, objetivo vacío y WPM basado en `totalDurationMs`.
- Alineamiento por programación dinámica con coincidencias, sustituciones, omisiones, adiciones, repeticiones y el orden de desempate canónico.
- Procedencia `browser`, `demo` y `manual` y sus invariantes.
- Reglas de coaching para cada prioridad, umbral exacto, combinación de señales y frontera del quinto intento con calidad válida o bloqueante.
- Validación de `validAttemptCountBeforeCurrent` entre `0` y `4`, cobertura anterior coherente y cálculo de cobertura posterior sólo para un intento válido.
- Cada rama tipada de `CoachResult`, incluidas versiones incompatibles, lista vacía, IDs duplicados, ejercicio inválido, tipo obligatorio ausente y métricas acústicas inconsistentes.
- Correspondencia exacta entre `textMetrics.targetText` y `currentExercise.targetText`, incluidas diferencias de palabra o puntuación, y ausencia de validación cuando las métricas son `null`.
- Orden estable de candidatos sobre copias: cobertura, distancia, ID actual, orden canónico de tipo, dificultad e ID ordinal sin `localeCompare`.
- Catálogo adversarial, rechazo de IDs no permitidos, ausencia de fallback para tipo obligatorio y repetición del ejercicio actual cuando es el único candidato válido.
- Plantillas sin lenguaje clínico, procedencia textual correcta, evidencia acústica/textual separada y resultados idénticos ante la misma entrada.
- Política exacta de evidencia por plantilla, precondición no vacía de `pauseCues` y matriz de determinismo con misma referencia, copia profunda y catálogo invertido sin mutación.
- Resumen con referencias existentes y orden estable.
- Serialización que rechaza audio, objetos del navegador y texto provisional.
- Eliminación completa de claves propias sin usar `clear()`.

### 15.2 Adaptadores y componentes

- Detección estándar, prefijada y ausente de Web Speech.
- Inicio paralelo de reconocedor y `MediaRecorder` desde una acción.
- Secuencias provisional → provisional → final y final ausente.
- Mapeo de `not-allowed`, `audio-capture`, `network`, `no-speech`, `aborted`, `language-not-supported`, `service-not-allowed` y desconocido.
- `stop`, `abort`, doble inicio, evento tardío y desmontaje.
- Demo estable sin acceso al `Blob` y sin `fetch`.
- Ruta manual por elección, fallo y edición de texto reconocido.
- Aviso de privacidad antes del reconocimiento y foco a alternativa manual.
- Regrabar revoca el objeto anterior.
- Error de voz conserva texto.
- Estados vacíos del profesional y separación visible de secciones.

### 15.3 Pruebas de costo y privacidad

- Búsqueda estática de OpenAI, Supabase, endpoints, secretos y SDKs prohibidos.
- Prueba sin red del modo demo después de cargar los assets locales.
- Inspección de Network: ninguna solicitud de la aplicación envía audio, texto, métricas o sesión.
- Inspección de Storage: sólo `rimay.demo.v1`, sin audio, base64, PCM u objetos temporales.
- Eliminación total seguida de verificación de ausencia de claves de Rimay.
- Inspección del build de Vite para confirmar ausencia de claves, endpoints y chunks de SDKs prohibidos.
- Inspección de Vercel para confirmar despliegue estático en Hobby sin Functions o add-ons.

### 15.4 Manuales

- Chrome y Edge actuales en escritorio.
- `SpeechRecognition` estándar, prefijado o ausente según navegador.
- Micrófono permitido, rechazado, ausente e interrumpido.
- Reconocimiento con voz, silencio, cancelación, red disponible y red ausente.
- Entrada manual elegida desde el inicio y después de cada error.
- Teclado, lector de pantalla, zoom 200 %, reflow y contraste.
- Revisión de aviso, procedencia, métricas no clínicas y explicación de reglas.
- Eliminación local y nueva sesión limpia.

No se añade Playwright salvo que un fallo repetible justifique la dependencia.

## 16. Estrategia de despliegue USD 0

1. Verificar en la documentación vigente que la cuenta/proyecto están en Vercel Hobby y que la acción no solicita tarjeta ni prueba Pro.
2. Ejecutar `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` localmente.
3. Auditar el directorio de salida: sólo archivos estáticos, sin Functions, mapas sensibles, secretos o endpoints de análisis.
4. Importar o desplegar el proyecto como SPA Vite en el subdominio gratuito de Vercel.
5. No habilitar Web Analytics Plus, Speed Insights pago, Blob, KV, Postgres, Functions, dominio comprado o add-ons.
6. Probar la preview y producción primero con `DemoSpeechRecognizer` y red bloqueada después de cargar la app.
7. Probar `BrowserSpeechRecognizer` sólo después de mostrar y aceptar el aviso de privacidad.
8. Inspeccionar Network, Storage, consola y panel de Vercel.
9. Registrar la fecha de verificación de límites Hobby y aceptar que el servicio puede pausarse al agotar el cupo.
10. Publicar el guion y las afirmaciones de Devpost sin atribuir runtime a GPT-5.6.

No se despliega si la plataforma solicita un plan pago o tarjeta, si aparecen datos reales, si el build contiene claves o endpoints, si se persiste audio o si existe lenguaje clínico.

## 17. Limitaciones de `SpeechRecognition`

1. No es una capacidad Baseline y no funciona en todos los navegadores.
2. Chrome y Edge son el objetivo primario, pero el soporte y el prefijo pueden variar por versión, sistema operativo y políticas administradas.
3. Algunos navegadores usan un servicio remoto propio; el reconocimiento puede requerir internet y no ser offline.
4. Rimay no controla proveedor, retención, región, disponibilidad, latencia ni cambios del servicio del navegador.
5. El permiso puede estar bloqueado por usuario, navegador, sistema operativo, contexto no seguro o política empresarial.
6. El conjunto de idiomas admitidos es dependiente del navegador; un tag español puede ser rechazado.
7. Resultados provisionales pueden cambiar, repetirse o no convertirse en un resultado final.
8. El servicio puede terminar por silencio, red, cancelación, límites internos o eventos del navegador antes que `MediaRecorder`.
9. Reconocimiento y grabación paralelos no garantizan muestras, tiempos o segmentación idénticos.
10. La precisión varía con ruido, micrófono, conexión, acento, ritmo y características del habla; no debe asumirse exactitud para habla disártrica.
11. La confianza reportada por el navegador, cuando existe, no se usa como puntuación clínica ni como criterio adaptativo del MVP.
12. El modo local mediante capacidades experimentales como paquetes de idioma no tiene soporte suficientemente uniforme para ser requisito del MVP.
13. La entrada manual es la recuperación obligatoria y también una opción de privacidad desde el inicio.

## 18. Observabilidad y manejo de errores

El dominio usa códigos estables y la UI los traduce a mensajes españoles. Los detalles crudos del navegador sólo pueden existir de forma transitoria durante desarrollo y no deben incluir contenido reconocido.

Datos técnicos que pueden mostrarse sin telemetría remota:

- estado y código de error;
- duración y tamaño de la grabación;
- versión de algoritmos y reglas;
- procedencia del texto;
- disponibilidad de soporte.

Contenido prohibido en logs:

- audio, `Blob` o PCM;
- texto provisional, reconocido o manual;
- prompt del ejercicio completo cuando pueda asociarse a una sesión;
- documento completo de sesión;
- nombre, correo o identificador de una persona;
- claves, tokens o cabeceras.

## 19. Declaración de herramientas de construcción

La documentación, README y Devpost deben distinguir:

- **Construcción:** Codex y asistencia de GPT-5.6 para diseño, implementación, revisión, pruebas y documentación.
- **Runtime:** Web APIs del navegador, algoritmos locales y reglas deterministas versionadas.
- **Transcripción:** capacidad opcional `SpeechRecognition` del navegador, fixture demo o entrada manual; nunca OpenAI.
- **Feedback y resumen:** `coach-rules-v1` y `summary-rules-v1`; nunca GPT-5.6 en runtime.

## 20. Referencias técnicas

- [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Errores de SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionErrorEvent/error)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [MediaRecorder MIME support](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static)
- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Límites de Vercel](https://vercel.com/docs/limits)
- [Precios de Vercel](https://vercel.com/pricing)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

Las condiciones, compatibilidad y límites cambiantes se revisan de nuevo justo antes del incremento que implemente o despliegue la capacidad correspondiente.
