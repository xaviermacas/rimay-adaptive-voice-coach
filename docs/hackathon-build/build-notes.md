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
- Contratos entregados: tipos iniciales de dominio y las interfaces `Transcriber`, `Coach`, `SessionRepository` y `SpeechOutput`; no existen implementaciones live.
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

## Decisiones confirmadas

| ID | Decisión | Motivo y consecuencia |
| --- | --- | --- |
| D-001 | El MVP usa un selector local paciente/profesional sin login. | Reduce alcance de hackathon. La revisión ocurre en el mismo navegador y no representa un modelo de acceso clínico. |
| D-002 | El audio es estrictamente temporal. | Puede reproducirse antes del envío, pero no se guarda en `localStorage`, Supabase Storage ni base de datos. La vista profesional no tendrá audio histórico. |
| D-003 | La voz de salida usa `SpeechSynthesis`. | Evita otra clave, coste y latencia. Siempre habrá texto visible y controles para escuchar, detener y repetir. |
| D-004 | `demo` es el modo predeterminado. | Debe completar todo el recorrido con fixtures y proveedores deterministas, sin red ni secretos. |
| D-005 | No existe fallback silencioso de live a demo. | El usuario debe saber si una respuesta es simulada. Un error live muestra recuperación o permite cambiar de modo explícitamente. |
| D-006 | Las métricas se calculan fuera de GPT. | Web Audio produce un contrato versionado. GPT recibe valores ya calculados y nunca recibe el audio. |
| D-007 | La IA no controla directamente la adaptación. | La aplicación genera candidatos permitidos; GPT sólo puede sugerir uno y la selección final se valida. |
| D-008 | La sesión tiene cinco intentos válidos. | Los tres primeros cubren palabra, frase y lectura guiada; los dos últimos permiten adaptación. Una única recaptura por calidad no cuenta. |
| D-009 | El frontend se despliega en Vercel y las llamadas privadas en Supabase Edge Functions. | `OPENAI_API_KEY` y otras claves privadas quedan en secretos de Supabase, nunca en `VITE_*`. |
| D-010 | Se usará npm y TypeScript estricto. | Los comandos objetivo serán estables y el lockfile deberá versionarse desde el scaffold. |
| D-011 | Compatibilidad primaria: Chrome y Edge de escritorio actuales. | Otros navegadores deben negociar formato o presentar un error accesible; no se fingirá compatibilidad. |
| D-012 | Todo el contenido de la demostración es ficticio. | Incluso en live no se aceptan datos reales de pacientes. |

## Decisiones técnicas de referencia

- Captura máxima: 60 segundos o 10 MB, lo que ocurra primero.
- Orden previsto de MIME: `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4` y, finalmente, el formato predeterminado del navegador si además puede decodificarse y enviarse.
- Algoritmo inicial: `audio-metrics-v1`, con ventanas de 20 ms y umbrales documentados en `spec.md`.
- Transcripción live: `gpt-4o-transcribe` mediante `transcribe-attempt`.
- Retroalimentación y resumen live: alias solicitado `gpt-5.6` mediante Responses API y Structured Outputs.
- Funciones previstas: `transcribe-attempt`, `coach-attempt` y `summarize-session`.
- Clave de persistencia local prevista: `rimay.demo.v1`, con número de versión dentro del documento guardado.
- No se usa Supabase Database ni Storage en este MVP. Supabase aporta el límite de servidor mediante Edge Functions.

## Riesgos conocidos y mitigaciones iniciales

| Riesgo | Mitigación prevista |
| --- | --- |
| Diferencias de codec y decodificación | Negociar MIME con `isTypeSupported`, registrar sólo el código de error y probar primero en Chrome/Edge. |
| Ruido ambiental altera la actividad de voz | Umbral derivado del piso de ruido, banderas de calidad y fixtures sintéticos; nunca interpretar clínicamente. |
| Transcripción imprecisa de habla disártrica | Mostrar la transcripción como aproximación, permitir reintento y no convertir similitud en severidad. |
| Latencia, CORS o límites de Edge Functions | Prueba técnica temprana, límite de payload, timeout, preflight y errores tipados. |
| GPT inventa números o lenguaje clínico | No pedir valores numéricos, exigir esquema estricto, referencias de evidencia, lista permitida y fallback determinista. |
| Voz española no disponible | Buscar una voz `es-*`; conservar texto visible y mostrar un aviso no bloqueante si sólo se puede leer. |
| Accesibilidad motora o cognitiva insuficiente | Controles grandes, teclado, foco visible, sin tiempo forzado ni avance automático, mensajes breves. |
| Demo pública sin autenticación | Usar sólo fixtures y almacenamiento local; no ofrecer acceso compartido ni datos reales. |

## Dudas pendientes no bloqueantes

Estas preguntas deben resolverse antes del incremento que las necesite, no durante esta fase:

- ¿Qué cuentas, proyectos y presupuestos de OpenAI, Supabase y Vercel estarán disponibles para la demo live?
- ¿Qué versiones y hardware exactos de Chrome o Edge se usarán en la presentación?
- ¿Qué profesional revisará las palabras, frases, pausas guiadas y el tono final del contenido ficticio?
- ¿Los umbrales de `audio-metrics-v1` se comportan de forma útil con muestras ficticias variadas de ruido, volumen y velocidad? Cualquier ajuste exige una nueva versión del algoritmo.
- ¿Cuáles serán los orígenes exactos de localhost, preview y producción permitidos por CORS?
- ¿Qué región de Supabase ofrece la latencia más estable para la sede de la demostración?

## Fuentes consultadas

- [GPT-5.6 Sol](https://developers.openai.com/api/docs/models/gpt-5.6-sol)
- [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Speech to text](https://developers.openai.com/api/docs/guides/speech-to-text)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [CORS para Edge Functions](https://supabase.com/docs/guides/functions/cors)
- [Changelog de cambios incompatibles de Supabase](https://supabase.com/changelog?tags=breaking-change)
- [MediaRecorder.isTypeSupported](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Guía de Vite](https://vite.dev/guide/)
- [Tailwind CSS con Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Guía de Vitest](https://vitest.dev/guide/)

Las fuentes cambiantes deben revisarse otra vez en el incremento donde se instalen dependencias o se implementen las integraciones.
