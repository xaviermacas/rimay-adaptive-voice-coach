# Especificación técnica — Rimay Adaptive Voice Coach

## 1. Estado y alcance de esta especificación

Esta especificación define la arquitectura objetivo del MVP de hackathon. No representa código ya implementado. El repositorio estaba vacío al redactarla y la fase actual sólo crea documentación.

Palabras normativas:

- **debe**: requisito obligatorio del MVP;
- **no debe**: comportamiento prohibido;
- **puede**: decisión opcional que no cambia los contratos;
- **posterior**: fuera del MVP y sujeto a otra autorización.

## 2. Principios arquitectónicos

1. **Demo primero:** el recorrido completo funciona sin red ni secretos.
2. **Mismas fronteras:** demo y live implementan los mismos contratos de dominio.
3. **Audio efímero:** el blob sólo vive durante el intento actual y nunca se persiste.
4. **Métricas deterministas:** se calculan fuera de GPT y llevan versión de algoritmo.
5. **IA limitada:** GPT recibe datos estructurados, no audio, y no puede inventar ni modificar métricas.
6. **Adaptación controlada:** una política local genera candidatos; la IA sólo puede sugerir uno de ellos.
7. **Accesibilidad estructural:** texto, teclado, foco y estados forman parte del diseño, no un ajuste final.
8. **Límite médico explícito:** toda salida es descriptiva y no clínica.
9. **Errores recuperables:** una falla remota no debe destruir datos temporales que aún puedan reintentarse.
10. **Dependencias mínimas:** cada librería debe resolver una necesidad verificable y fijar su versión.

## 3. Vista de arquitectura

```text
Vercel
└─ React + Vite + TypeScript
   ├─ UI paciente / profesional
   ├─ MediaRecorder + reproductor temporal
   ├─ Web Audio + audio-metrics-v1
   ├─ política adaptativa y validadores
   ├─ SpeechSynthesis
   ├─ SessionRepository local
   └─ proveedores
      ├─ demo: fixtures deterministas, sin red
      └─ live: Supabase Edge Functions
         ├─ transcribe-attempt ── OpenAI Audio / gpt-4o-transcribe
         ├─ coach-attempt ────── OpenAI Responses / gpt-5.6
         └─ summarize-session ── OpenAI Responses / gpt-5.6
```

Supabase Database, Storage, Auth y migraciones no forman parte de este MVP. Edge Functions se usa como frontera de servidor para proteger las claves y validar las solicitudes live.

## 4. Capas y responsabilidades

### 4.1 Presentación

- Renderiza contenido en español neutro.
- Mantiene foco, anuncios de estado y controles de al menos 44 por 44 píxeles CSS.
- No consume respuestas crudas de OpenAI o Supabase.
- Distingue visualmente contenido calculado, simulado, generado por IA y fallback.
- No implementa reglas de métricas o adaptación dentro de componentes React.

### 4.2 Aplicación

- Orquesta la máquina de estados de sesión e intento.
- Conserva el blob sólo mientras sea necesario.
- Invoca análisis local, proveedores y validadores.
- Decide cuándo persistir datos derivados.
- Aplica el ejercicio final únicamente después de la validación.

### 4.3 Dominio

- Define contratos compartidos y estados discriminados.
- Implementa normalización, métricas, política de candidatos y fallbacks como funciones puras.
- No importa React, Supabase u OpenAI.
- No conoce variables de entorno ni formatos de respuestas externas.

### 4.4 Proveedores

- Traducen cada API o fixture al contrato interno.
- Devuelven errores tipados y seguros para mostrar.
- No registran payloads de audio, transcripciones o prompts.
- El proveedor live no puede activar el proveedor demo por sí mismo.

### 4.5 Edge Functions

- Validan método, origen, tipo, esquema, tamaño y tiempo de ejecución.
- Obtienen `OPENAI_API_KEY` desde secretos de Supabase.
- Traducen errores externos a códigos internos sin filtrar payloads o detalles de claves.
- No guardan audio, transcripciones ni resultados en Storage o Database.
- No encadenan Edge Functions; cada función llama directamente al proveedor requerido.

## 5. Componentes funcionales previstos

### Shell y navegación

- `AppShell`: encabezado, aviso de demo, modo activo y contenido principal.
- `RoleSwitcher`: selector Paciente/Profesional; no representa autenticación.
- `ProviderModeBadge`: muestra `Demo` o `Live` en todo flujo dependiente de proveedores.
- `MedicalDisclaimer`: explica el límite no clínico con texto persistente.

### Paciente

- `SessionStart`: iniciar, continuar o descartar una sesión ficticia.
- `ExerciseInstruction`: tipo, progreso, instrucción y texto a pronunciar.
- `SpeechControls`: escuchar, detener y repetir voz del navegador.
- `RecordingControls`: preparar micrófono, grabar, detener y estado.
- `RecordingReview`: reproductor temporal, regrabar o analizar.
- `AttemptMetrics`: valores, unidades, calidad y versión.
- `CoachFeedback`: texto validado, origen y reproducción por voz.
- `SessionComplete`: confirmación y cambio a vista profesional.

### Profesional

- `SessionList`: lista local de sesiones ficticias.
- `SessionReview`: estado, intentos y ausencia explícita de audio.
- `AttemptReview`: prompt, transcripción, métricas, calidad y feedback.
- `ProfessionalSummaryView`: observaciones, evidencia y limitaciones.

Los nombres son orientativos para organizar el código; los contratos y comportamientos son normativos.

## 6. Contratos de dominio

Los siguientes contratos son la forma canónica prevista. Cuando se implementen, se definirán en TypeScript y con esquemas de ejecución equivalentes en toda frontera externa.

```ts
type ProviderMode = 'demo' | 'live'
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

`pauseCues` contiene posiciones de caracteres del `promptText` que ayudan a representar lectura guiada; no es una expectativa clínica sobre las pausas reales.

```ts
type AudioQualityFlag =
  | 'no_speech_detected'
  | 'too_quiet'
  | 'possible_clipping'
  | 'audio_too_short'
  | 'transcription_missing'

interface DeterministicMetrics {
  algorithmVersion: 'audio-metrics-v1'
  totalDurationMs: number
  estimatedSpeechDurationMs: number
  pauseCount: number
  averagePauseDurationMs: number | null
  rms: number
  peak: number
  clippedSampleRatio: number
  possibleClipping: boolean
  wordCount: number | null
  wordsPerMinute: number | null
  promptSimilarity: number | null
  qualityFlags: readonly AudioQualityFlag[]
}
```

Reglas del contrato:

- duraciones son enteros no negativos en milisegundos;
- `rms`, `peak`, `clippedSampleRatio` y `promptSimilarity` se limitan a `[0, 1]`;
- `averagePauseDurationMs` es `null` cuando `pauseCount` es cero;
- `wordCount`, `wordsPerMinute` y `promptSimilarity` son `null` sin una transcripción utilizable;
- `possibleClipping` debe equivaler a la regla de `clippedSampleRatio` de la versión declarada;
- flags duplicadas no son válidas.

```ts
type TranscriptionStatus = 'available' | 'unavailable' | 'failed'

interface TranscriptionResult {
  status: TranscriptionStatus
  text: string | null
  model: string | null
  language: 'es' | null
  errorCode: string | null
}

type FeedbackFocus =
  | 'repeat_calmly'
  | 'steady_pace'
  | 'follow_pause_cues'
  | 'clear_capture'
  | 'continue'

type MetricEvidenceKey =
  | 'totalDurationMs'
  | 'estimatedSpeechDurationMs'
  | 'pauseCount'
  | 'averagePauseDurationMs'
  | 'rms'
  | 'peak'
  | 'clippedSampleRatio'
  | 'possibleClipping'
  | 'wordCount'
  | 'wordsPerMinute'
  | 'promptSimilarity'
  | 'qualityFlags'

interface EvidenceReference {
  attemptId: string
  metricKeys: readonly MetricEvidenceKey[]
}

interface CoachRequest {
  attemptId: string
  exercise: Exercise
  transcript: string | null
  metrics: DeterministicMetrics
  allowedExercises: readonly Exercise[]
}

interface CoachResponse {
  shortFeedback: string
  focus: FeedbackFocus
  suggestedExerciseId: string
  professionalNote: string
  evidence: readonly EvidenceReference[]
}
```

`CoachResponse` no contiene campos numéricos de métricas. La UI obtiene todos los números de `DeterministicMetrics`, nunca del texto del modelo.

```ts
type AttemptWorkflowStatus =
  | 'instruction'
  | 'requesting_permission'
  | 'ready'
  | 'recording'
  | 'recorded'
  | 'analyzing_audio'
  | 'transcribing'
  | 'coaching'
  | 'ready_to_continue'
  | 'recoverable_error'
  | 'discarded'

interface Attempt {
  id: string
  sessionId: string
  sequence: number
  exerciseSnapshot: Exercise
  status: 'completed'
  validAttempt: true
  recaptureUsed: boolean
  recording: RecordingMetadata
  transcription: TranscriptionResult
  metrics: DeterministicMetrics
  feedback: CoachResponse
  feedbackSource: 'demo' | 'openai' | 'fallback'
  selectedNextExerciseId: string | null
  createdAt: string
}

interface Session {
  id: string
  schemaVersion: 1
  status: 'in_progress' | 'completed' | 'summary_failed'
  providerMode: ProviderMode
  fictionalParticipantId: string
  attemptIds: readonly string[]
  validAttemptCount: number
  currentExerciseId: string | null
  startedAt: string
  completedAt: string | null
}

interface SummaryObservation {
  text: string
  evidence: readonly EvidenceReference[]
}

interface ProfessionalSummary {
  overview: string
  observations: readonly SummaryObservation[]
  dataQualityNotes: readonly string[]
  limitations: readonly string[]
  source: 'demo' | 'openai' | 'fallback'
}
```

`AttemptWorkflowStatus` describe únicamente la máquina transitoria de la UI. Sus estados se implementarán como una unión discriminada que sólo contiene los datos disponibles en cada etapa; por ejemplo, el blob aparece desde `recorded` y las métricas sólo después de `analyzing_audio`. `Attempt` es el registro persistible que se crea al completar el flujo con métricas válidas y feedback live o fallback. Las recapturas descartadas y los errores técnicos nunca se convierten en `Attempt`.

Las referencias deben apuntar sólo a intentos de la sesión y a claves existentes. `algorithmVersion`, identificadores, unidades y valores se renderizan desde los objetos deterministas, no desde `ProfessionalSummary`.

## 7. Contratos de proveedor

```ts
interface Transcriber {
  transcribe(input: {
    audio: Blob
    recording: RecordingMetadata
    signal: AbortSignal
  }): Promise<TranscriptionResult>
}

interface Coach {
  createAttemptFeedback(
    input: CoachRequest,
    signal: AbortSignal,
  ): Promise<CoachResponse>

  createProfessionalSummary(
    input: {
      session: Session
      attempts: readonly Attempt[]
    },
    signal: AbortSignal,
  ): Promise<ProfessionalSummary>
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
}

interface SpeechOutput {
  speak(text: string): Promise<void>
  stop(): void
  isAvailable(): boolean
}
```

### Demo

- Usa fixtures versionados y respuestas derivadas de IDs conocidos.
- Simula latencia mediante reloj inyectable, no valores aleatorios sin semilla.
- Puede activar explícitamente escenarios de error para pruebas y presentación.
- No realiza `fetch` ni requiere configuración externa.

### Live

- Invoca exclusivamente las Edge Functions definidas.
- Usa el cliente publicable de Supabase; nunca contiene claves secretas.
- Respeta `AbortSignal`, timeout y error mapping.
- No persiste respuestas remotas fuera de `SessionRepository` local.

## 8. Flujo de audio

### 8.1 Preparación y captura

1. El soporte se comprueba en el navegador sin pedir permiso.
2. El formato se selecciona con `MediaRecorder.isTypeSupported()` en este orden:
   1. `audio/webm;codecs=opus`;
   2. `audio/webm`;
   3. `audio/mp4`;
   4. formato predeterminado del navegador, sólo si Web Audio puede decodificarlo y la transcripción lo acepta.
3. `getUserMedia({ audio: true })` se llama tras la acción “Preparar micrófono”.
4. Los chunks se acumulan en memoria. La captura se detiene al llegar a 60 000 ms o 10 000 000 bytes.
5. Al detener, se ejecuta `stop()` en todas las pistas aunque el procesamiento falle.
6. La URL del reproductor se revoca al reemplazar el blob, finalizar la sesión o desmontar el flujo.

No se serializa el blob, no se convierte a base64 y no se escribe en `localStorage`, IndexedDB, Cache API, Supabase Storage o logs.

### 8.2 Decodificación

1. `AudioContext.decodeAudioData` convierte el blob a PCM.
2. Para varias pistas, cada muestra mono es el promedio aritmético de los canales en esa posición.
3. Duración canónica: `sampleCount / sampleRateHz`.
4. Si la decodificación falla, no se fabrican valores parciales; se produce el error técnico `AUDIO_DECODE_FAILED` y se ofrece recaptura.

### 8.3 `audio-metrics-v1`

La misma matriz PCM y la misma frecuencia de muestreo deben producir exactamente el mismo resultado.

1. Dividir PCM mono en ventanas consecutivas de 20 ms; la última ventana puede ser menor.
2. Calcular RMS por ventana y RMS global con `sqrt(mean(sample²))`.
3. Calcular `peak` como el máximo de `abs(sample)`.
4. Calcular el piso de ruido como percentil 20 de los RMS de ventana, usando el elemento de índice `floor(0.20 × (n - 1))` de la lista ordenada.
5. Definir `speechThreshold = max(0.015, noiseFloor × 3)`.
6. Marcar una ventana como habla cuando `windowRms >= speechThreshold`.
7. Unir segmentos de habla separados por menos de 200 ms.
8. Descartar segmentos de habla menores de 120 ms como ruido transitorio.
9. `estimatedSpeechDurationMs` es la suma de los segmentos restantes.
10. Una pausa es un intervalo interno, entre dos segmentos de habla, de al menos 300 ms. Silencio inicial y final no cuentan.
11. `averagePauseDurationMs` es la media de las pausas o `null` si no existen.
12. Una muestra está clipped si `abs(sample) >= 0.99`. `possibleClipping` es verdadero cuando `clippedSampleRatio >= 0.001`.

Flags iniciales:

- `audio_too_short`: duración total menor de 500 ms;
- `no_speech_detected`: habla estimada menor de 300 ms;
- `too_quiet`: RMS global menor de `0.01`;
- `possible_clipping`: regla de clipping verdadera;
- `transcription_missing`: transcripción ausente al completar el intento.

Un fallo de decodificación es un error técnico del flujo y no una bandera dentro de un objeto de métricas: si no existe PCM, no existe `DeterministicMetrics`. Los umbrales son heurísticas de calidad de captura, no límites clínicos. Cualquier cambio crea `audio-metrics-v2` y nuevos fixtures; nunca se altera silenciosamente el significado de v1.

### 8.4 Métricas basadas en texto

Normalización española v1:

1. convertir a minúsculas con locale `es`;
2. aplicar normalización Unicode NFKD;
3. retirar marcas combinantes y puntuación;
4. conservar secuencias de letras y números Unicode como tokens;
5. colapsar espacios.

`wordCount` es la cantidad de tokens transcritos. `wordsPerMinute = wordCount / (totalDurationMs / 60_000)` cuando hay palabras y duración positiva; se redondea a una cifra decimal dentro del contrato.

`promptSimilarity` usa distancia Levenshtein sobre arrays de tokens normalizados:

```text
1 - distance(promptTokens, transcriptTokens) / max(promptTokens.length, transcriptTokens.length)
```

El resultado se limita a `[0, 1]` y se redondea a cuatro decimales. RMS, pico y ratio de clipping se redondean a seis decimales; las duraciones se redondean al milisegundo más cercano. Es `null` si falta transcripción o alguno de los textos normalizados queda vacío. No se presenta como exactitud clínica.

## 9. Transcripción live

### `transcribe-attempt`

- Método: `POST` multipart/form-data.
- Campos: `audio` y `mimeType`; no se envían nombre, correo ni identificador clínico.
- Validaciones: origen permitido, un archivo, MIME permitido, tamaño máximo 10 MB y request body válido.
- Proveedor: OpenAI Audio Transcriptions con `gpt-4o-transcribe` y lenguaje español cuando la API lo permita.
- Timeout del cliente: 30 segundos. Un reintento sólo ocurre tras acción del usuario.
- Respuesta exitosa:

```json
{
  "status": "available",
  "text": "texto aproximado",
  "model": "gpt-4o-transcribe",
  "language": "es",
  "errorCode": null
}
```

- Respuesta de error: código estable (`INVALID_AUDIO`, `PAYLOAD_TOO_LARGE`, `UPSTREAM_TIMEOUT`, `UPSTREAM_ERROR`) y mensaje genérico en español; nunca incluye el cuerpo externo.

La función no conserva el audio después de completar la solicitud.

## 10. Flujo de GPT-5.6

### 10.1 Retroalimentación por intento

`coach-attempt` recibe JSON compatible con `CoachRequest`, no multipart. La Edge Function vuelve a validar:

- ejercicio y transcripción;
- métricas, rangos, unidades y `algorithmVersion`;
- lista no vacía de ejercicios permitidos;
- ausencia de campos inesperados.

Invoca Responses API con modelo `gpt-5.6` y `text.format` de tipo `json_schema` estricto. El prompt de sistema debe:

- declarar la herramienta como no clínica;
- prohibir diagnóstico, severidad, tratamiento y métricas nuevas;
- limitar la respuesta al intento y a los candidatos recibidos;
- pedir español claro y respetuoso;
- exigir referencias de evidencia existentes.

Timeout del cliente: 20 segundos. No hay reintento automático.

### 10.2 Validación de salida

La respuesta sólo se acepta si supera, en orden:

1. estado exitoso y salida estructurada presente;
2. JSON Schema estricto sin campos extra;
3. límites: `shortFeedback` de 1 a 160 caracteres y `professionalNote` de 1 a 240;
4. `suggestedExerciseId` contenido en `allowedExercises`;
5. `focus` perteneciente al enum permitido;
6. cada `attemptId` y `metricKey` existente en la solicitud;
7. filtro editorial sin diagnóstico, severidad, tratamiento, promesas o instrucciones médicas;
8. ausencia de dígitos en los campos narrativos, para impedir que el modelo inserte valores que aparenten ser métricas.

Si falla cualquier regla, se descarta la respuesta completa. No se rescatan campos individuales.

### 10.3 Fallback por intento

El fallback es una función local pura:

- calidad insuficiente: “Probemos otra grabación cuando estés listo.” y `clear_capture`;
- similitud disponible menor de 0.65: “Gracias por intentarlo. Repite con calma siguiendo el texto.” y `repeat_calmly`;
- lectura guiada con pausas registradas: “Buen trabajo. En el siguiente ejercicio, sigue las pausas marcadas.” y `follow_pause_cues`;
- resto: “Intento completado. Continúa con el siguiente ejercicio cuando estés listo.” y `continue`.

El ejercicio sugerido es el primer candidato del orden determinista.

### 10.4 Resumen profesional

`summarize-session` recibe una sesión finalizada y sus cinco intentos válidos sin audio. Usa el mismo modelo, salida estructurada y prohibiciones. El resumen no repite valores numéricos; referencia intentos y claves que la UI presenta desde los contratos deterministas.

Validaciones adicionales:

- todos los intentos pertenecen a la sesión;
- existen exactamente cinco intentos válidos;
- cada referencia apunta a esos intentos;
- `limitations` contiene el límite no clínico y la naturaleza ficticia de los datos;
- no hay comparación poblacional, diagnóstico, severidad o prescripción.

El fallback resume que la sesión se completó, enumera las banderas de calidad presentes y remite a las métricas visibles sin interpretarlas.

## 11. Política adaptativa

### 11.1 Cobertura y duración

- Una sesión termina con cinco intentos válidos.
- Intento 1: `word_repetition`.
- Intento 2: `phrase_repetition`.
- Intento 3: `guided_reading`.
- Intentos 4 y 5: tipo y dificultad adaptables según catálogo y reglas.
- Una única recaptura por posición puede no contar. Después de usarla, el siguiente resultado procesable contabiliza aunque tenga flags, para evitar bucles. Un fallo técnico de captura o decodificación nunca se persiste como intento.

### 11.2 Generación de candidatos

La política recibe intento actual, cobertura, catálogo y cantidad restante. Primero filtra ejercicios que:

- existen en el catálogo;
- no repiten el mismo ID más de una vez consecutiva, salvo recaptura;
- permiten completar los tipos obligatorios restantes;
- están en dificultad 1 a 3;
- no contienen etiquetas excluidas por configuración.

Después asigna dificultad objetivo:

- captura insuficiente o similitud `null`: mantener dificultad;
- similitud menor de `0.65`: reducir una dificultad, con mínimo 1;
- similitud entre `0.65` y `0.85`, inclusive en el límite inferior: mantener dificultad;
- similitud mayor de `0.85`: aumentar una dificultad, con máximo 3.

El orden estable es: distancia a dificultad objetivo, prioridad de cobertura, tipo, dificultad e ID. Se entregan como máximo tres candidatos a GPT.

WPM, RMS, pausas y clipping no cambian dificultad; se mantienen descriptivos para evitar convertirlos en criterios seudoclínicos. Los flags pueden activar recaptura, no una clasificación de desempeño.

### 11.3 Aplicación

- Si GPT devuelve un candidato válido, se aplica ese ID.
- Si GPT falla o devuelve un ID inválido, se aplica el primer candidato determinista.
- La UI puede explicar “Se eligió otro ejercicio del mismo nivel” o equivalente, pero no muestra inferencias clínicas.

## 12. Persistencia local

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

- se valida el documento completo;
- se excluye cualquier `Blob`, URL, base64, `MediaStream`, buffer PCM o objeto de proveedor;
- se limita el historial a las 20 sesiones ficticias más recientes;
- se captura `QuotaExceededError` y se continúa en memoria.

Los fixtures iniciales se cargan sólo si no existe documento local. “Descartar” elimina únicamente la sesión elegida después de confirmación. No hay sincronización entre pestañas requerida para el MVP.

## 13. Seguridad de Edge Functions

- Secretos: `OPENAI_API_KEY`, `OPENAI_TRANSCRIPTION_MODEL` y `OPENAI_COACH_MODEL` viven en Supabase project secrets.
- Frontend: sólo `VITE_SUPABASE_URL`, clave publicable y `VITE_PROVIDER_MODE` pueden ser públicas.
- CORS: lista explícita de orígenes de localhost, preview y producción; responder `OPTIONS`; no usar `*` en producción.
- Aplicar límites de método, `Content-Type`, tamaño y timeout antes de procesar.
- No registrar request bodies, audio, transcripciones, prompts, respuestas de IA o IDs de sesión.
- Logs permitidos: nombre de función, timestamp, estado, duración, código de error y un ID de correlación aleatorio no persistido en el cliente.
- Sanitizar errores; no devolver stack traces o respuestas crudas de OpenAI.
- Añadir rate limiting antes de exponer live públicamente. Hasta entonces, live es sólo para una demo controlada con datos ficticios.
- Revisar changelog y documentación de Supabase al implementar; no asumir que ejemplos o comandos siguen vigentes.

## 14. Configuración

```text
VITE_PROVIDER_MODE=demo|live
VITE_SUPABASE_URL=<publicable>
VITE_SUPABASE_PUBLISHABLE_KEY=<publicable>

# Sólo secretos de Supabase Edge Functions
OPENAI_API_KEY=<secret>
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-transcribe
OPENAI_COACH_MODEL=gpt-5.6
ALLOWED_ORIGINS=http://localhost:5173,https://<preview>,https://<production>
```

Reglas:

- `demo` es el valor predeterminado cuando falta configuración.
- Seleccionar `live` sin configuración válida impide la llamada y muestra un error; no cambia a demo.
- Ninguna variable que empiece por `VITE_` puede contener un secreto.
- `.env.example` contiene sólo nombres y valores ficticios.

## 15. Estructura futura de carpetas

```text
AGENTS.md
README.md
docs/hackathon-build/
src/
  app/
  components/
  domain/
    audio/
    exercises/
    sessions/
    contracts/
  features/
    practice/
    recording/
    professional-review/
  providers/
    demo/
    live/
  repositories/
  test/
supabase/
  config.toml
  functions/
    _shared/
    transcribe-attempt/
    coach-attempt/
    summarize-session/
```

No se prevé `supabase/migrations/` en este MVP porque no habrá base de datos. Si se autoriza persistencia remota, su modelo de Auth, RLS y retención se diseña antes de crear la primera migración.

## 16. Estrategia de pruebas

### Unitarias con Vitest

- RMS, pico, clipping, ventanas, unión de segmentos, pausas y flags con PCM sintético.
- Casos de borde: vacío, menos de una ventana, silencio, ruido, clipping, multicanal y frecuencia de muestreo distinta.
- Normalización española, conteo, WPM y Levenshtein.
- Política de cobertura, dificultad, límite de candidatos y fallback.
- Validación de contratos con campos extra, rangos inválidos y referencias inexistentes.
- Serialización que rechaza cualquier audio o URL temporal.

### Componentes con Testing Library

- permiso antes y después de la acción del usuario;
- navegación completa por teclado y foco tras errores;
- estados de grabación y límite automático;
- regrabar revoca el objeto anterior;
- error de voz conserva texto;
- salida inválida de IA muestra fallback completo;
- estados vacíos del profesional;
- separación visible de métricas, IA y limitaciones.

### Contratos y Edge Functions

- proveedores demo y live pasan las mismas pruebas de contrato;
- handlers se prueban con método, origen, MIME, tamaño, timeout y upstream simulado;
- prueba local con `supabase functions serve` cuando se implemente;
- prueba real controlada con audio ficticio WebM antes de integrar la UI.

### Manuales

- Chrome y Edge actuales en escritorio;
- micrófono permitido, rechazado, ausente e interrumpido;
- teclado, lector de pantalla, zoom 200 %, reflow y contraste;
- red lenta y sin red;
- inspección de consola, red y `localStorage` para confirmar ausencia de secretos y audio.

No se añade Playwright en el MVP salvo que un fallo repetible justifique la dependencia.

## 17. Estrategia de despliegue

1. `npm run typecheck`, `npm test` y `npm run build` deben pasar localmente.
2. Vercel construye la SPA de Vite y configura sólo variables públicas.
3. Supabase despliega las tres Edge Functions y configura secretos mediante su mecanismo oficial vigente.
4. CORS permite localhost, preview elegida y dominio final.
5. Preview se prueba primero en `demo`; `live` se activa sólo en una preview controlada.
6. Se ejecuta el guion de 90 segundos y los errores principales.
7. Producción de hackathon inicia en `demo`, con un control explícito si se habilita live.
8. El README registra fecha, modelos, límites, origen ficticio y pasos de desactivación de live.

No se despliega si aparecen datos reales, claves en assets, audio persistente, fallos de validación o lenguaje clínico.

## 18. Observabilidad y manejo de errores

El dominio usa códigos estables; la UI traduce a mensajes españoles. Los proveedores adjuntan causa técnica sólo en memoria de desarrollo y nunca incluyen contenido sensible.

Métricas operativas permitidas:

- duración de llamada;
- estado HTTP;
- código de error;
- tamaño del payload en bytes;
- modo demo/live;
- versión del algoritmo.

Contenido prohibido en logs y telemetría:

- audio o PCM;
- transcripción o texto solicitado;
- prompts y respuestas del modelo;
- nombre, correo o identificador de una persona;
- claves, tokens o cabeceras;
- documento completo de sesión.

## 19. Referencias técnicas

- [Modelo GPT-5.6 Sol y alias `gpt-5.6`](https://developers.openai.com/api/docs/models/gpt-5.6-sol)
- [Structured Outputs en Responses API](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Speech to text](https://developers.openai.com/api/docs/guides/speech-to-text)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [CORS desde navegador](https://supabase.com/docs/guides/functions/cors)
- [Cambios incompatibles de Supabase](https://supabase.com/changelog?tags=breaking-change)
- [MediaRecorder MIME support](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
