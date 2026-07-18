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
type ExerciseType = 'word_repetition' | 'phrase_repetition' | 'guided_reading'
type Difficulty = 1 | 2 | 3

interface Exercise {
  id: string
  type: ExerciseType
  difficulty: Difficulty
  promptText: string
  instructionText: string
  pauseCues: readonly number[]
  expectedMaxDurationMs: number
  tags: readonly string[]
}

interface RecordingMetadata {
  mimeType: string
  sizeBytes: number
  durationMs: number
  sampleRateHz: number | null
  channelCount: number | null
}
```

`pauseCues` contiene posiciones del `promptText` para representar lectura guiada; no es una expectativa clínica sobre pausas reales.

### 6.1 Texto reconocido o declarado

```ts
type SpeechTextSource = 'browser' | 'demo' | 'manual'
type SpeechTextStatus = 'available' | 'unavailable' | 'failed' | 'cancelled'

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
  status: SpeechTextStatus
  source: SpeechTextSource
  text: string | null
  languageTag: string | null
  errorCode: SpeechRecognitionErrorCode | null
  disclosureVersion: 'speech-privacy-v1'
}
```

Reglas:

- `available` exige texto no vacío y `errorCode: null`;
- `unavailable`, `failed` o `cancelled` exigen `text: null` como resultado estable;
- un texto provisional sólo pertenece al estado transitorio de UI, no a `SpeechTextResult` persistible;
- `source: 'demo'` exige el aviso de fixture y no puede atribuirse al audio;
- `source: 'manual'` se muestra como declaración del usuario, no como transcripción automática;
- editar un texto reconocido crea un nuevo resultado `manual`; no se conserva `browser` como procedencia.

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

### 6.3 Métricas de texto

```ts
interface WordMatch {
  promptIndex: number
  textIndex: number
  token: string
}

interface IndexedToken {
  index: number
  token: string
}

interface TextMetrics {
  algorithmVersion: 'text-metrics-v1'
  source: SpeechTextSource
  normalizedPrompt: string
  normalizedText: string
  promptTokens: readonly string[]
  textTokens: readonly string[]
  wordCount: number
  wordsPerMinute: number | null
  promptSimilarity: number | null
  matchedWords: readonly WordMatch[]
  omittedWords: readonly IndexedToken[]
  additionalWords: readonly IndexedToken[]
}
```

`TextMetrics` describe una comparación técnica. Para origen `manual`, la UI debe decir que los cálculos se basan en texto escrito por el usuario; para origen `demo`, que se basan en un fixture. Ninguna fuente convierte los valores en evaluación clínica.

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
  | 'currentDifficulty'
  | 'validAttemptCount'

interface CoachInput {
  attemptId: string
  exercise: Exercise
  textSource: SpeechTextSource | null
  audioMetrics: AudioMetrics
  textMetrics: TextMetrics | null
  currentDifficulty: Difficulty
  validAttemptCount: number
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
```

`shortFeedback` y `explanation` salen exclusivamente de plantillas curadas. `selectedExerciseId` debe ser `null` para `repeat_current` y `complete_session`, o pertenecer a `allowedExercises` para `continue`.

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
  validAttemptCount: number
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

1. Convertir a minúsculas con locale español.
2. Aplicar Unicode NFKD.
3. Retirar marcas combinantes y puntuación.
4. Conservar secuencias de letras y números Unicode como tokens.
5. Colapsar espacios.

La normalización no corrige palabras, no expande abreviaturas y no usa diccionarios o servicios externos.

### 9.3 Conteo, WPM y similitud

- `wordCount` es el número de tokens del texto utilizable.
- `wordsPerMinute = wordCount / (totalDurationMs / 60_000)` cuando existe al menos un token y la duración es positiva; se redondea a una cifra decimal.
- `promptSimilarity` usa distancia Levenshtein sobre arrays de tokens:

```text
1 - distance(promptTokens, textTokens) / max(promptTokens.length, textTokens.length)
```

- El resultado se limita a `[0, 1]` y se redondea a cuatro decimales.
- Si falta texto, el prompt queda vacío tras normalizar o la duración no permite WPM, el campo correspondiente es `null`.
- WPM con origen manual o demo debe nombrar esa fuente y no afirmar que se contaron automáticamente las palabras pronunciadas.

### 9.4 Coincidencias, omisiones y adiciones

- Usar una subsecuencia común más larga sobre tokens exactos y normalizados para alinear palabras conservando el orden.
- Un token alineado produce `WordMatch` con ambos índices.
- Un token del prompt sin alinear se marca como omitido.
- Un token del texto sin alinear se marca como adicional.
- Una sustitución aparece como una omisión y una adición; no se infiere fonética.
- Ante empates de longitud, el backtracking usa orden fijo: coincidencia diagonal, avance en el prompt y después avance en el texto.
- Resultados e índices se emiten en orden ascendente.

La estrategia y el desempate son parte de `text-metrics-v1`; cambiarlos exige una nueva versión y fixtures nuevos.

## 10. Motor determinista de retroalimentación y adaptación

### 10.1 Entradas y pureza

`coach-rules-v1` recibe exclusivamente `CoachInput`. No recibe audio, objetos del navegador, hora actual, red ni aleatoriedad. Todos los catálogos, umbrales, plantillas y órdenes pertenecen a la versión.

La misma entrada serializable debe producir exactamente el mismo `CoachDecision`, incluidos texto, IDs, evidencia y ejercicio.

### 10.2 Tabla de señales

| Señal | Uso permitido |
| --- | --- |
| Banderas de calidad | Sugerir una captura más clara o mantener dificultad; nunca clasificar a la persona. |
| Similitud textual | Ajustar dificultad dentro de 1–3 y explicar comparación con el prompt. |
| Pausas | Elegir una plantilla de pausas sólo en lectura guiada. |
| Duración | Elegir una plantilla de ritmo cuando supera la duración esperada del ejercicio; no imponer diagnóstico ni límite terapéutico. |
| Proporción de silencio | Sugerir revisar inicio de captura o repetir; no inferir fluidez clínica. |
| Dificultad actual | Calcular la dificultad objetivo acotada. |
| Número de intentos | Garantizar cobertura, finalización y evitar un ciclo automático. |

### 10.3 Orden de evaluación

1. Validar entrada, versiones y lista de ejercicios permitidos. Una lista vacía es error de configuración; no se inventa un ID.
2. Si hay `no_speech_detected`, `too_quiet`, `possible_clipping`, `audio_too_short` o `silenceRatio >= 0.85`, seleccionar `repeat_current`, foco `clear_capture` y una plantilla de captura. La repetición ocurre sólo si el usuario la elige.
3. Si el intento aceptado completa el quinto intento, seleccionar `complete_session`, sin siguiente ejercicio.
4. Para intentos que aún deben cubrir palabra, frase o lectura guiada, filtrar primero por el tipo obligatorio pendiente.
5. Calcular dificultad objetivo:
   - similitud `null`: mantener;
   - similitud menor de `0.65`: reducir una, mínimo 1;
   - similitud entre `0.65` y `0.85`, inclusivo: mantener;
   - similitud mayor de `0.85` y sin flags de captura: aumentar una, máximo 3;
   - en otro caso: mantener.
6. Seleccionar foco de plantilla en este orden:
   - lectura guiada con `pauseCount === 0`: `follow_pause_cues`;
   - duración mayor a `expectedMaxDurationMs`: `steady_pace`;
   - similitud menor de `0.65`: `repeat_calmly`;
   - resto: `continue`.
7. Ordenar candidatos por: tipo obligatorio pendiente, distancia a dificultad objetivo, evitar repetir el mismo ID, tipo, dificultad e ID.
8. Elegir el primer candidato y producir explicación desde una plantilla asociada al `ruleId`, mencionando sólo evidencia real y procedencia correcta.

Los umbrales son reglas de interacción del demo y no están clínicamente validados. Cualquier cambio crea `coach-rules-v2`.

### 10.4 Plantillas curadas

- Cada plantilla tiene ID estable, foco, acción permitida, texto breve y explicación.
- El texto visible no contiene diagnóstico, severidad, pronóstico, prescripción, comparación poblacional o promesas.
- La plantilla no inserta valores que no existan en la evidencia.
- Los números de métricas se renderizan desde los contratos, no desde texto libre.
- Un filtro editorial unitario revisa todas las plantillas durante pruebas.

### 10.5 Repetición manual

- Antes de aceptar un intento, el usuario puede descartarlo y grabar de nuevo.
- Después de ver una decisión `repeat_current`, el usuario elige repetir o aceptar y continuar según las reglas de conteo del flujo.
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
- Normalización española con acentos, mayúsculas, puntuación, números, espacios y Unicode.
- Tokenización, conteo, WPM, Levenshtein y límites vacíos.
- LCS con repeticiones, sustituciones, empates, omisiones y adiciones.
- Procedencia `browser`, `demo` y `manual` y sus invariantes.
- Reglas de coaching para cada prioridad, umbral exacto y combinación de señales.
- Orden estable de candidatos y rechazo de IDs no permitidos.
- Plantillas sin lenguaje clínico y resultados idénticos ante la misma entrada.
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
