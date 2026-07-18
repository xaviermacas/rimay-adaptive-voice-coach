# PRD — Rimay Adaptive Voice Coach

## 1. Definición del producto

Rimay es una aplicación web de demostración para práctica guiada del habla. Presenta ejercicios escritos y hablados, graba una respuesta, calcula métricas descriptivas reproducibles, solicita retroalimentación estructurada y prepara un resumen para revisión profesional.

El producto no diagnostica, no determina severidad, no prescribe tratamiento y no sustituye a un profesional. Todos los perfiles, ejercicios, sesiones y resultados del MVP son ficticios.

## 2. Objetivos del MVP

- Permitir que un paciente ficticio complete cinco intentos con una interacción clara y accesible.
- Demostrar captura, reproducción, transcripción, métricas deterministas, retroalimentación validada y adaptación controlada.
- Permitir que un profesional ficticio revise la sesión en el mismo navegador.
- Separar visual y técnicamente los datos calculados, el texto generado por IA y la interpretación profesional.
- Mantener una demostración completamente funcional sin servicios externos mediante proveedores simulados.

## 3. Principios de experiencia

- La persona controla cuándo escuchar, grabar, detener, enviar y continuar.
- Todo audio tiene una alternativa textual visible.
- Ningún paso depende exclusivamente del color, de un temporizador o de precisión motora fina.
- Los mensajes describen el intento, no a la persona.
- Las fallas se presentan como problemas del sistema o de captura y ofrecen una siguiente acción concreta.
- El modo `demo` o `live` siempre es visible.

## 4. Usuarios e historias

### Paciente

- **US-P01:** Como paciente, quiero escuchar y leer la instrucción para comprender el ejercicio de más de una forma.
- **US-P02:** Como paciente, quiero otorgar permiso de micrófono sólo cuando voy a grabar y entender para qué se solicita.
- **US-P03:** Como paciente, quiero iniciar y detener la grabación con controles grandes y estados claros.
- **US-P04:** Como paciente, quiero escuchar mi grabación antes de enviarla para decidir si la uso o la repito.
- **US-P05:** Como paciente, quiero ver si la transcripción o la calidad fueron insuficientes sin recibir una etiqueta clínica.
- **US-P06:** Como paciente, quiero una devolución corta, escrita y hablada, con una acción simple para el siguiente intento.
- **US-P07:** Como paciente, quiero avanzar a un ejercicio adaptado sin quedar atrapado en repeticiones.
- **US-P08:** Como paciente, quiero finalizar y saber que la sesión quedó disponible para revisión local.

### Profesional

- **US-R01:** Como profesional, quiero ver sesiones ficticias y distinguir si están en curso o finalizadas.
- **US-R02:** Como profesional, quiero revisar cada ejercicio, transcripción, métrica y bandera de calidad.
- **US-R03:** Como profesional, quiero reconocer qué contenido fue calculado y cuál fue generado por IA.
- **US-R04:** Como profesional, quiero que las observaciones de IA indiquen los intentos y métricas que las sustentan.
- **US-R05:** Como profesional, quiero leer las limitaciones y mantener la decisión clínica final.
- **US-R06:** Como profesional, quiero un estado claro cuando no existe sesión, intento o resumen.

### Presentador de la demo

- **US-D01:** Como presentador, quiero cambiar de rol sin autenticarme para enseñar ambos recorridos en el mismo navegador.
- **US-D02:** Como presentador, quiero ejecutar el flujo completo en modo demo sin claves ni red.
- **US-D03:** Como presentador, quiero simular fallos conocidos de forma determinista para demostrar recuperación.

## 5. Flujo del paciente

### 5.1 Entrada e inicio

1. La aplicación abre en español, muestra el nombre del producto, el aviso no clínico y el modo de proveedor activo.
2. El selector de rol permite elegir “Paciente” o “Profesional”; inicia en “Paciente”.
3. Si no hay sesión activa, se muestra “Iniciar sesión de demostración”. Si existe una sesión incompleta, se ofrecen “Continuar” y “Descartar sesión ficticia”.
4. Al iniciar, se crea una sesión local con cinco intentos válidos como meta. No se solicita el micrófono todavía.

### 5.2 Presentación del ejercicio

1. Se muestra tipo, progreso, texto a pronunciar e instrucción breve.
2. “Escuchar instrucción” usa una voz `es-*` cuando exista. También se ofrecen “Detener voz” y “Repetir”.
3. Para lectura guiada, las pausas aparecen mediante texto y puntuación; no dependen de animación o color.
4. No hay avance automático.

### 5.3 Permiso y grabación

1. Al pulsar “Preparar micrófono”, se explica que el audio será temporal y no se guardará.
2. El navegador solicita permiso sólo después de esa acción.
3. Con permiso, aparece “Iniciar grabación”. Durante la captura se anuncian estado y duración transcurrida sin imponer una cuenta regresiva.
4. La grabación termina por acción del usuario o automáticamente al llegar a 60 segundos o 10 MB. El límite automático se explica con un mensaje de estado.
5. Al detener, se cierran las pistas del micrófono.

### 5.4 Revisión local

1. Se crea un reproductor para la grabación temporal.
2. El usuario puede escuchar, volver a grabar o elegir “Analizar intento”.
3. Regrabar elimina de memoria el blob anterior y revoca su URL.
4. Mientras se analiza, el reproductor sigue disponible hasta que termine o el usuario descarte el intento.

### 5.5 Análisis y retroalimentación

1. Web Audio calcula las métricas locales con `audio-metrics-v1`.
2. El proveedor de transcripción devuelve texto, estado y modelo, o un error tipado.
3. La UI muestra transcripción y métricas como descripciones, con valores ausentes marcados como “No disponible”.
4. Si la captura es insuficiente, se ofrece una única recaptura que no cuenta como intento válido.
5. Si el intento puede continuar, la aplicación crea la lista de ejercicios permitidos y solicita retroalimentación.
6. La salida validada se muestra como texto breve y se puede escuchar. El origen “Simulado” o “Generado por IA” es visible.
7. El usuario pulsa “Continuar” para pasar al siguiente ejercicio seleccionado.

### 5.6 Finalización

1. Tras cinco intentos válidos, la sesión cambia a `completed`.
2. Se muestra una confirmación, un resumen no clínico del progreso del flujo y la opción “Ver como profesional”.
3. El audio temporal se libera. Sólo quedan datos ficticios derivados en el almacenamiento local.

## 6. Flujo profesional

1. El selector cambia a “Profesional” sin iniciar sesión ni salir del navegador.
2. Se muestra una lista de sesiones ficticias locales, ordenadas por fecha descendente, con estado, cantidad de intentos y modo de proveedor.
3. Al abrir una sesión, se muestran:
   - aviso de datos ficticios y herramienta no diagnóstica;
   - estado y progreso;
   - intentos en orden;
   - ejercicio y texto solicitado;
   - transcripción aproximada y estado del proveedor;
   - métricas deterministas con versión del algoritmo;
   - banderas de calidad explicadas en lenguaje descriptivo;
   - retroalimentación generada o fallback;
   - indicación “Audio no conservado”.
4. En una sesión finalizada aparece el resumen profesional. Cada observación de IA enumera `attemptIds` y `evidenceKeys` válidos.
5. Métricas, observaciones de IA y limitaciones se presentan en secciones distintas.
6. La vista termina con: “La interpretación y decisión profesional final no forman parte de Rimay”.

## 7. Estados del sistema

### Sesión

- `idle`: no existe sesión activa.
- `in_progress`: hay menos de cinco intentos válidos.
- `completed`: cinco intentos válidos y resumen disponible o en preparación.
- `summary_failed`: la sesión terminó, pero el resumen live falló; puede reintentarse o usar fallback.

### Intento

- `instruction`: ejercicio visible, sin captura.
- `requesting_permission`: esperando respuesta del navegador.
- `ready`: micrófono disponible.
- `recording`: captura activa.
- `recorded`: blob temporal listo para reproducir.
- `analyzing_audio`: decodificación y métricas en curso.
- `transcribing`: transcripción en curso.
- `coaching`: retroalimentación en curso.
- `ready_to_continue`: resultado validado y siguiente ejercicio decidido.
- `recoverable_error`: se conserva lo recuperable y se ofrece una acción.
- `discarded`: intento temporal eliminado; no se persiste.

Los estados se modelarán con uniones discriminadas para impedir combinaciones imposibles.

## 8. Estados vacíos

| Contexto | Mensaje y acción observable |
| --- | --- |
| Paciente sin sesión | “Aún no has iniciado una sesión de demostración.” Botón “Iniciar sesión”. |
| Sesión sin intentos | Mostrar el primer ejercicio, no una tabla vacía. |
| Profesional sin sesiones | “No hay sesiones ficticias para revisar.” Botón para cambiar a Paciente. |
| Sesión sin intentos válidos | Explicar que la sesión fue iniciada pero todavía no contiene intentos revisables. |
| Intento sin transcripción | Mostrar “Transcripción no disponible”; WPM y similitud aparecen como “No disponible”. |
| Cero pausas | Mostrar `0` pausas y duración promedio como “No aplica”, no `0 ms`. |
| Resumen pendiente | Mostrar estado de preparación y conservar visibles los datos deterministas. |
| Voz española no disponible | Mantener texto visible y mostrar “La lectura por voz no está disponible en este navegador”. |

## 9. Errores y recuperación

| Código conceptual | Situación | Comportamiento requerido |
| --- | --- | --- |
| `MIC_PERMISSION_DENIED` | El usuario rechaza el permiso. | Explicar cómo volver a intentarlo o revisar el permiso del sitio; no volver a solicitar automáticamente. |
| `MIC_NOT_FOUND` | No existe dispositivo de entrada. | Mantener la instrucción visible y sugerir conectar o habilitar un micrófono. |
| `RECORDER_UNSUPPORTED` | No existe un formato compatible. | Bloquear sólo la grabación y señalar que Chrome/Edge de escritorio son el objetivo primario. |
| `RECORDING_INTERRUPTED` | La pista termina o el navegador interrumpe. | Conservar chunks utilizables si son válidos o permitir grabar de nuevo. |
| `RECORDING_LIMIT_REACHED` | Se alcanza 60 s o 10 MB. | Detener de forma segura, anunciar el límite y permitir escuchar o repetir. |
| `AUDIO_DECODE_FAILED` | Web Audio no decodifica el blob. | No inventar métricas; conservar el reproductor si funciona y ofrecer nueva grabación. |
| `INSUFFICIENT_AUDIO` | No se detecta habla o el nivel es demasiado bajo. | Ofrecer una única recaptura no contabilizada con una sugerencia de captura no clínica. |
| `TRANSCRIPTION_TIMEOUT` | El proveedor no responde. | Conservar audio y métricas locales; ofrecer reintento manual o continuar sin transcripción. |
| `TRANSCRIPTION_FAILED` | Error de formato, límite, red o proveedor. | Mostrar error genérico y código; no mostrar payload ni detalles sensibles. |
| `COACH_INVALID_OUTPUT` | JSON o reglas de dominio inválidos. | Descartar toda la salida y aplicar fallback determinista. |
| `COACH_TIMEOUT` | GPT no responde. | Aplicar fallback determinista y permitir continuar. |
| `SUMMARY_FAILED` | No se genera resumen live. | Mantener todos los intentos visibles y permitir reintento o fallback local. |
| `LOCAL_STORAGE_FAILED` | Cuota, privacidad o almacenamiento no disponible. | Mantener la sesión en memoria y avisar que se perderá al cerrar la pestaña. |
| `SPEECH_SYNTHESIS_FAILED` | No se puede reproducir la voz. | No bloquear el flujo; conservar texto y controles deshabilitados con explicación. |

No habrá reintentos automáticos de llamadas cobrables. Un reintento live exige una acción explícita.

## 10. Requisitos funcionales observables

- **FR-01:** El modo demo completa el flujo sin variables de entorno ni solicitudes de red.
- **FR-02:** El modo activo se ve en todas las pantallas relevantes.
- **FR-03:** El permiso de micrófono sólo se solicita después de “Preparar micrófono”.
- **FR-04:** La captura se detiene al alcanzar cualquiera de sus dos límites.
- **FR-05:** El usuario puede reproducir y reemplazar la grabación antes de analizarla.
- **FR-06:** Ningún blob, URL de objeto o audio serializado aparece en almacenamiento persistente.
- **FR-07:** Toda métrica muestra unidad, versión y disponibilidad correcta.
- **FR-08:** WPM y similitud son `null` si falta transcripción.
- **FR-09:** Los tres tipos de ejercicio aparecen dentro de los tres primeros intentos válidos.
- **FR-10:** La sesión finaliza con exactamente cinco intentos válidos.
- **FR-11:** Sólo una recaptura por calidad puede excluirse del conteo para cada intento planificado.
- **FR-12:** El ejercicio aplicado pertenece a `allowedExerciseIds`.
- **FR-13:** Una salida inválida de IA nunca se renderiza parcialmente.
- **FR-14:** La vista profesional muestra “Audio no conservado” en cada intento.
- **FR-15:** Cada observación del resumen referencia intentos y claves existentes.
- **FR-16:** Cambiar de rol no borra la sesión local.
- **FR-17:** El usuario controla la reproducción hablada y el avance.
- **FR-18:** Demo y live usan los mismos contratos de dominio.

## 11. Criterios de aceptación del MVP

1. En Chrome y Edge de escritorio actuales, una grabación compatible puede iniciarse, detenerse y reproducirse usando teclado.
2. Un fixture PCM conocido produce exactamente los valores esperados de `audio-metrics-v1` en ejecuciones repetidas.
3. Un intento demo muestra transcripción, métricas, devolución y siguiente ejercicio sin red.
4. Un intento live envía el audio sólo a `transcribe-attempt`; GPT-5.6 recibe únicamente texto, métricas y candidatos.
5. Respuestas con ID desconocido, campos extra, referencias inexistentes o lenguaje prohibido activan el fallback completo.
6. Permiso rechazado, transcripción fallida y voz no disponible tienen mensajes accesibles y recuperación verificable.
7. Los primeros tres intentos válidos cubren los tres tipos y la sesión termina con cinco.
8. La vista profesional abre la sesión recién completada y separa métricas, IA y limitaciones.
9. Al inspeccionar `localStorage`, red y consola no aparecen audio, claves, payloads sensibles ni datos reales.
10. La aplicación cumple navegación por teclado, foco visible, reflow, contraste y anuncios de estado definidos para WCAG 2.2 AA.
11. `npm run typecheck`, `npm test` y `npm run build` finalizan correctamente.
12. El README explica modo demo, modo live, límites médicos, privacidad y pasos de despliegue.

## 12. Restricciones de lanzamiento

El resultado es una demostración de hackathon, no un producto clínico ni un sistema preparado para datos de salud. No se habilitará acceso con pacientes reales, persistencia remota, audio histórico ni múltiples usuarios sin un incremento posterior que incorpore revisión legal, privacidad, autenticación, autorización y seguridad de datos.

