# PRD — Rimay Adaptive Voice Coach

## 1. Definición del producto

Rimay es una aplicación web de demostración para práctica guiada del habla. Presenta ejercicios escritos y hablados, graba una respuesta, calcula métricas descriptivas reproducibles, ofrece reconocimiento opcional del navegador o entrada manual, produce retroalimentación mediante reglas locales y prepara un resumen para revisión profesional.

El producto no diagnostica, no determina severidad, no prescribe tratamiento y no sustituye a un profesional. Todos los perfiles, ejercicios, sesiones y resultados del MVP son ficticios.

El runtime del MVP es local, determinista y gratuito. No usa OpenAI API, Supabase, Edge Functions, APIs comerciales ni ningún servicio que requiera facturación o tarjeta de crédito.

## 2. Objetivos del MVP

- Permitir que un paciente ficticio complete cinco intentos con una interacción clara y accesible.
- Demostrar captura, reproducción, reconocimiento opcional, entrada manual, métricas deterministas, retroalimentación explicable y adaptación controlada.
- Permitir que un profesional ficticio revise la sesión en el mismo navegador.
- Separar visual y técnicamente métricas calculadas, procedencia del texto, decisiones del motor local, limitaciones e interpretación profesional.
- Mantener una demostración completamente funcional sin red mediante `DemoSpeechRecognizer` y fixtures claramente identificados.
- Construir, probar y desplegar la SPA estática con costo USD 0.

## 3. Principios de experiencia

- La persona controla cuándo escuchar, grabar, detener, reconocer, escribir, repetir, aceptar y continuar.
- Todo audio hablado por Rimay tiene una alternativa textual visible.
- Ningún paso depende exclusivamente del color, de un temporizador, del reconocimiento automático o de precisión motora fina.
- Los mensajes describen el intento, no a la persona.
- Las fallas se presentan como problemas del sistema o de captura y ofrecen una siguiente acción concreta.
- La procedencia del texto siempre es visible: “Reconocimiento del navegador”, “Demostración predefinida” o “Entrada manual”.
- Antes de iniciar reconocimiento automático se explica que algunos navegadores pueden enviar audio a un servicio remoto propio; continuar sin reconocimiento siempre es posible.
- No hay reproducción, reconocimiento, repetición o avance automático sin acción del usuario.

## 4. Usuarios e historias

### Paciente

- **US-P01:** Como paciente, quiero escuchar y leer la instrucción para comprender el ejercicio de más de una forma.
- **US-P02:** Como paciente, quiero otorgar permiso de micrófono sólo cuando voy a grabar y entender para qué se solicita.
- **US-P03:** Como paciente, quiero saber que Rimay no envía ni guarda mi `Blob` y que el reconocimiento del navegador podría usar un servicio remoto propio.
- **US-P04:** Como paciente, quiero elegir entre reconocimiento automático y entrada manual antes de comenzar.
- **US-P05:** Como paciente, quiero iniciar y detener la grabación con controles grandes y estados claros.
- **US-P06:** Como paciente, quiero escuchar mi grabación antes de aceptar el intento y poder repetirlo manualmente.
- **US-P07:** Como paciente, quiero distinguir resultados provisionales de resultados finales y conocer su procedencia.
- **US-P08:** Como paciente, quiero escribir lo que intenté pronunciar cuando no deseo o no puedo usar reconocimiento automático.
- **US-P09:** Como paciente, quiero ver las métricas como observaciones técnicas, no como evaluación clínica.
- **US-P10:** Como paciente, quiero una devolución corta, escrita y hablada, con una explicación simple de la acción elegida.
- **US-P11:** Como paciente, quiero avanzar sólo a un ejercicio permitido y sin quedar atrapado en repeticiones.
- **US-P12:** Como paciente, quiero finalizar y saber que la sesión ficticia quedó disponible para revisión local.
- **US-P13:** Como paciente, quiero eliminar completamente todos los datos de Rimay guardados en mi navegador.

### Profesional

- **US-R01:** Como profesional, quiero ver sesiones ficticias y distinguir si están en curso o finalizadas.
- **US-R02:** Como profesional, quiero revisar cada ejercicio, procedencia del texto, métricas y banderas de calidad.
- **US-R03:** Como profesional, quiero distinguir cálculos locales de decisiones del motor de reglas.
- **US-R04:** Como profesional, quiero que cada observación indique los intentos y métricas que la sustentan.
- **US-R05:** Como profesional, quiero conocer la versión de algoritmos, reglas y plantillas usada.
- **US-R06:** Como profesional, quiero leer las limitaciones y mantener la decisión profesional final.
- **US-R07:** Como profesional, quiero un estado claro cuando no existe sesión, intento, texto o resumen.

### Presentador de la demo

- **US-D01:** Como presentador, quiero cambiar de rol sin autenticarme para enseñar ambos recorridos en el mismo navegador.
- **US-D02:** Como presentador, quiero ejecutar el flujo completo sin red, claves, cuentas de proveedor ni servicios pagos.
- **US-D03:** Como presentador, quiero simular resultados y fallos de forma determinista sin afirmar que el audio demo fue analizado.
- **US-D04:** Como presentador, quiero poder afirmar con precisión que Codex y GPT-5.6 ayudaron a construir Rimay, pero no se usan en runtime.

## 5. Flujo del paciente

### 5.1 Entrada e inicio

1. La aplicación abre en español, muestra el nombre del producto, el aviso no clínico y que el procesamiento runtime es local y gratuito.
2. El selector de rol permite elegir “Paciente” o “Profesional”; inicia en “Paciente”.
3. Si no hay sesión activa, se muestra “Iniciar sesión de demostración”. Si existe una sesión incompleta, se ofrecen “Continuar” y “Descartar sesión ficticia”.
4. Al iniciar, se crea una sesión local con cinco intentos válidos como meta. No se solicita el micrófono todavía.

### 5.2 Presentación del ejercicio

1. Se muestra tipo, progreso, texto a pronunciar e instrucción breve.
2. “Escuchar instrucción” usa una voz `es-*` cuando exista. También se ofrecen “Detener voz” y “Repetir”.
3. Para lectura guiada, las pausas aparecen mediante texto y puntuación; no dependen de animación o color.
4. No hay avance automático.

### 5.3 Elección de reconocimiento y privacidad

1. Antes de grabar, la UI explica que `MediaRecorder` conserva el `Blob` únicamente en memoria y que Rimay no lo envía ni lo almacena.
2. La UI explica que `SpeechRecognition` es una función del navegador y que Chrome, Edge u otros navegadores pueden enviar el audio escuchado por esa función a un servicio remoto propio. Rimay no controla ese procesamiento ni contrata ese servicio.
3. El usuario elige explícitamente:
   - “Grabar con reconocimiento del navegador”; o
   - “Grabar y escribir lo que intenté decir”.
4. La entrada manual permanece disponible después de cualquier fallo, silencio o cancelación del reconocimiento.

### 5.4 Permiso, grabación y reconocimiento paralelo

1. El navegador solicita permiso sólo después de una acción explícita.
2. Al pulsar “Iniciar grabación” con reconocimiento elegido, `BrowserSpeechRecognizer` y `MediaRecorder` comienzan dentro de la misma acción del usuario y avanzan en paralelo.
3. El reconocedor usa `SpeechRecognition` o `webkitSpeechRecognition`, configura un idioma `es-*`, solicita resultados provisionales y finales y no recibe el `Blob` de `MediaRecorder`.
4. Los resultados provisionales se anuncian como tales, pueden cambiar y nunca se persisten como resultado final.
5. La grabación termina por acción del usuario o automáticamente al llegar a 60 segundos o 10 MB. Detener solicita el resultado final disponible y libera las pistas al completar la captura.
6. Permiso, soporte ausente, red, silencio, captura, idioma, cancelación y cierre inesperado tienen estados diferenciados y recuperación manual.

### 5.5 Revisión local y texto utilizable

1. Se crea un reproductor para la grabación temporal.
2. El usuario puede escuchar, volver a grabar o analizar el intento.
3. Regrabar elimina de memoria el `Blob` anterior y revoca su URL.
4. Si existe un resultado final del navegador, se muestra como aproximación con origen “Reconocimiento del navegador”.
5. Si el usuario eligió entrada manual o el reconocimiento no produjo texto final, se muestra un campo para escribir lo que intentó pronunciar, identificado como “Entrada manual”.
6. En modo demo, el texto viene de un fixture estable y se muestra “Demostración predefinida: este texto no proviene del análisis de tu audio”.
7. El usuario puede corregir sólo mediante la ruta manual; una edición no conserva el origen automático.

### 5.6 Análisis, retroalimentación y adaptación

1. Web Audio calcula métricas locales con `audio-metrics-v1`.
2. `text-metrics-v1` normaliza y tokeniza el prompt y el texto utilizable; calcula conteo, palabras por minuto, similitud, coincidencias, omisiones y adiciones.
3. La UI muestra valores y procedencia con “No disponible” cuando corresponda y un aviso explícito de que no son métricas clínicas.
4. `coach-rules-v1` recibe sólo datos derivados: calidad de audio, similitud, pausas, duración, proporción de silencio, dificultad actual y cantidad de intentos.
5. El motor selecciona una plantilla curada, una acción y sólo un ejercicio contenido en `allowedExerciseIds`. La salida incluye versión, ID de regla, evidencia y explicación breve.
6. La misma entrada produce siempre la misma salida. No hay llamadas de red, texto generado por IA ni reintentos cobrables.
7. La devolución se muestra como texto y puede escucharse. El usuario elige “Repetir este intento” o “Continuar”.

### 5.7 Finalización

1. Tras cinco intentos válidos aceptados, la sesión cambia a `completed`.
2. Un resumen determinista organiza observaciones descriptivas y referencias de evidencia sin interpretación clínica.
3. Se muestra confirmación y la opción “Ver como profesional”.
4. El audio temporal se libera. Sólo quedan la sesión ficticia y los datos derivados permitidos en `localStorage`.

## 6. Flujo profesional

1. El selector cambia a “Profesional” sin iniciar sesión ni salir del navegador.
2. Se muestra una lista de sesiones ficticias locales, ordenadas por fecha descendente, con estado y cantidad de intentos.
3. Al abrir una sesión, se muestran:
   - aviso de datos ficticios y herramienta no diagnóstica;
   - estado y progreso;
   - intentos en orden;
   - ejercicio y texto solicitado;
   - texto aproximado o manual y su procedencia;
   - métricas deterministas con versión del algoritmo;
   - banderas de calidad explicadas en lenguaje descriptivo;
   - plantilla, acción, razón y versión del motor;
   - indicación “Audio no conservado”.
4. Cada observación del resumen referencia `attemptIds` y `evidenceKeys` existentes.
5. Métricas, decisiones del motor, limitaciones e interpretación profesional se presentan en secciones distintas.
6. La vista termina con: “La interpretación y decisión profesional final no forman parte de Rimay”.

## 7. Estados del sistema

### Sesión

- `idle`: no existe sesión activa.
- `in_progress`: hay menos de cinco intentos válidos.
- `completed`: cinco intentos válidos y resumen determinista disponible.
- `storage_warning`: la sesión continúa en memoria porque el almacenamiento local no está disponible.

### Intento

- `instruction`: ejercicio visible, sin captura.
- `privacy_choice`: esperando elección entre reconocimiento y entrada manual.
- `requesting_permission`: esperando respuesta del navegador.
- `recording`: captura activa; reconocimiento puede estar `listening`, `interim`, `final`, `failed`, `cancelled` o `not_requested`.
- `recorded`: `Blob` temporal listo para reproducir.
- `awaiting_text`: falta resultado final y se ofrece entrada manual.
- `analyzing`: decodificación y métricas locales en curso.
- `ready_to_continue`: resultado determinista disponible.
- `recoverable_error`: se conserva lo recuperable y se ofrece una acción.
- `discarded`: intento temporal eliminado; no se persiste.

Los estados se modelarán con uniones discriminadas para impedir combinaciones imposibles.

## 8. Estados vacíos

| Contexto | Mensaje y acción observable |
| --- | --- |
| Paciente sin sesión | “Aún no has iniciado una sesión de demostración.” Botón “Iniciar sesión”. |
| Sesión sin intentos | Mostrar el primer ejercicio, no una tabla vacía. |
| Profesional sin sesiones | “No hay sesiones ficticias para revisar.” Botón para cambiar a Paciente. |
| Intento sin texto | Mostrar “Texto no disponible” y ofrecer entrada manual; métricas textuales aparecen como “No disponible”. |
| Resultado sólo provisional | Explicar que no llegó un resultado final y ofrecer entrada manual. |
| Cero pausas | Mostrar `0` pausas y duración promedio como “No aplica”, no `0 ms`. |
| Voz española no disponible | Mantener texto visible y mostrar “La lectura por voz no está disponible en este navegador”. |
| Almacenamiento vacío tras eliminación | Confirmar “Se eliminaron todos los datos locales de Rimay”. |

## 9. Errores y recuperación

| Código conceptual | Situación | Comportamiento requerido |
| --- | --- | --- |
| `MIC_PERMISSION_DENIED` | El usuario rechaza el permiso. | Explicar cómo reintentar; no volver a solicitar automáticamente. La entrada manual sigue disponible para el texto, pero no fabrica métricas de audio. |
| `MIC_NOT_FOUND` | No existe dispositivo de entrada. | Mantener la instrucción visible y sugerir conectar o habilitar un micrófono. |
| `RECORDER_UNSUPPORTED` | No existe un formato compatible. | Bloquear sólo la grabación y señalar que Chrome/Edge de escritorio son el objetivo primario. |
| `RECORDING_INTERRUPTED` | La pista termina o el navegador interrumpe. | Conservar chunks utilizables si son válidos o permitir grabar de nuevo. |
| `RECORDING_LIMIT_REACHED` | Se alcanza 60 s o 10 MB. | Detener de forma segura, anunciar el límite y permitir escuchar o repetir. |
| `AUDIO_DECODE_FAILED` | Web Audio no decodifica el `Blob`. | No inventar métricas; conservar el reproductor si funciona y ofrecer nueva grabación. |
| `SPEECH_RECOGNITION_UNSUPPORTED` | No existen `SpeechRecognition` ni `webkitSpeechRecognition`. | Explicar la limitación y enfocar la opción de entrada manual. |
| `SPEECH_PERMISSION_DENIED` | El navegador bloquea reconocimiento por seguridad o preferencia. | No reiniciar automáticamente; ofrecer revisión de permiso o entrada manual. |
| `SPEECH_NETWORK_FAILED` | El servicio propio del navegador requiere red y falla. | Informar que el reconocimiento no está disponible; conservar el `Blob` local y ofrecer entrada manual. |
| `SPEECH_NO_SPEECH` | El navegador no detecta habla. | No inventar texto; permitir repetir o escribir manualmente. |
| `SPEECH_ABORTED` | Usuario o navegador cancela. | Marcar cancelado, no como error clínico; permitir reiniciar explícitamente o escribir. |
| `SPEECH_LANGUAGE_UNSUPPORTED` | El navegador no admite el idioma español configurado. | No cambiar idioma silenciosamente; ofrecer entrada manual. |
| `SPEECH_SERVICE_NOT_ALLOWED` | El navegador bloquea su servicio de reconocimiento. | Explicar la indisponibilidad y ofrecer entrada manual. |
| `LOCAL_STORAGE_FAILED` | Cuota, privacidad o almacenamiento no disponible. | Mantener la sesión en memoria y avisar que se perderá al cerrar la pestaña. |
| `LOCAL_DELETE_FAILED` | No se puede completar la eliminación. | Indicar qué dato de Rimay sigue presente sin afirmar un borrado completo. |
| `SPEECH_SYNTHESIS_FAILED` | No se puede reproducir la voz. | No bloquear el flujo; conservar texto y controles con explicación. |

No existen reintentos automáticos de red ni rutas a proveedores contratados. Todo reintento de captura o reconocimiento exige una acción explícita.

## 10. Requisitos funcionales observables

- **FR-01:** El modo demo completa el flujo sin variables de entorno ni solicitudes de red de la aplicación.
- **FR-02:** El origen `browser`, `demo` o `manual` se ve junto a cada texto relevante.
- **FR-03:** El permiso de micrófono y el reconocimiento sólo se solicitan después del aviso y de una acción explícita.
- **FR-04:** Con reconocimiento automático elegido, `MediaRecorder` y el reconocedor comienzan en paralelo desde la misma acción.
- **FR-05:** La captura se detiene al alcanzar cualquiera de sus dos límites.
- **FR-06:** El usuario puede reproducir y reemplazar la grabación antes de aceptarla.
- **FR-07:** Ningún `Blob`, URL de objeto, PCM o audio serializado aparece en almacenamiento persistente o solicitudes de la aplicación.
- **FR-08:** Los resultados provisionales y finales se distinguen; sólo un final o una entrada manual se usa como texto estable.
- **FR-09:** La entrada manual está disponible por elección y como recuperación de cualquier fallo de reconocimiento.
- **FR-10:** `DemoSpeechRecognizer` no recibe el `Blob` y muestra que su texto es predefinido.
- **FR-11:** Toda métrica muestra unidad, versión, procedencia y disponibilidad correcta.
- **FR-12:** Métricas textuales son `null` si falta texto utilizable.
- **FR-13:** Coincidencias, omisiones y adiciones conservan un orden determinista.
- **FR-14:** El motor devuelve la misma decisión para la misma entrada y declara `rulesVersion`, `ruleId`, `templateId`, explicación y evidencia.
- **FR-15:** El ejercicio aplicado pertenece a `allowedExerciseIds`.
- **FR-16:** La repetición manual está siempre bajo control del usuario.
- **FR-17:** Los tres tipos de ejercicio aparecen dentro de los tres primeros intentos válidos.
- **FR-18:** La sesión finaliza con exactamente cinco intentos válidos aceptados.
- **FR-19:** La vista profesional muestra “Audio no conservado” en cada intento.
- **FR-20:** Cada observación del resumen referencia intentos y claves existentes.
- **FR-21:** Cambiar de rol no borra la sesión local.
- **FR-22:** “Eliminar todos los datos locales” quita todas las claves propias de Rimay, limpia la sesión en memoria y revoca recursos temporales.
- **FR-23:** La aplicación no contiene clientes, endpoints, claves o dependencias runtime de OpenAI o Supabase.
- **FR-24:** El despliegue de Vercel contiene sólo la SPA estática y no activa recursos pagados.

## 11. Criterios de aceptación del MVP

1. En Chrome y Edge de escritorio actuales, una grabación compatible puede iniciarse, detenerse y reproducirse usando teclado.
2. Antes del reconocimiento se muestra el aviso sobre posible procesamiento remoto del navegador y se ofrece continuar manualmente.
3. Donde exista soporte, `BrowserSpeechRecognizer` muestra resultados provisionales y finales en español mientras `MediaRecorder` mantiene su propio `Blob` en memoria.
4. Soporte ausente, permiso, red, silencio, cancelación e idioma no compatible conducen a una recuperación manual verificable.
5. Un fixture demo produce una secuencia estable y visible como predefinida, sin inspeccionar audio ni usar red.
6. Fixtures conocidos producen exactamente los valores esperados de `audio-metrics-v1` y `text-metrics-v1` en ejecuciones repetidas.
7. El motor `coach-rules-v1` produce exactamente el mismo mensaje, acción, razón, evidencia y ejercicio permitido para la misma entrada.
8. Los primeros tres intentos válidos cubren los tres tipos y la sesión termina con cinco.
9. La vista profesional separa métricas, procedencia, decisiones de reglas, limitaciones y decisión profesional.
10. Al inspeccionar `localStorage`, red y consola no aparecen audio, claves, payloads sensibles, datos reales ni solicitudes de la aplicación a APIs de análisis.
11. La eliminación total deja `localStorage` sin claves de Rimay y la UI sin sesiones, intentos o resúmenes persistidos.
12. La aplicación cumple navegación por teclado, foco visible, reflow, contraste y anuncios de estado definidos para WCAG 2.2 AA.
13. `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` finalizan correctamente.
14. El README explica reconocimiento del navegador, alternativa manual, demo sin red, límites médicos, privacidad, eliminación local y despliegue Vercel Hobby.
15. Una revisión de costos confirma ausencia de tarjeta, pruebas Pro, add-ons, Functions, Supabase, OpenAI y otros proveedores cobrables.
16. El despliegue estático funciona en un subdominio gratuito de Vercel Hobby dentro de sus límites vigentes; si se agota el cupo, no se habilita facturación.

## 12. Declaraciones públicas y Devpost

Declaraciones permitidas:

- “Rimay fue construido con Codex y asistencia de GPT-5.6 durante el diseño, la implementación, la revisión, las pruebas y la documentación”.
- “El motor runtime de retroalimentación y adaptación es local, determinista, versionado y gratuito”.
- “El reconocimiento automático, cuando se habilita, usa la capacidad `SpeechRecognition` del navegador; Rimay también ofrece una ruta demo sin red y entrada manual”.

Declaraciones prohibidas:

- afirmar que GPT-5.6 genera retroalimentación o resúmenes en runtime;
- afirmar que OpenAI transcribe el audio;
- afirmar que `DemoSpeechRecognizer` analizó la grabación;
- afirmar que el reconocimiento del navegador siempre es local, privado, exacto, compatible u offline;
- presentar métricas o decisiones como validación clínica.

## 13. Restricciones de lanzamiento

El resultado es una demostración de hackathon, no un producto clínico ni un sistema preparado para datos de salud. No se habilitará acceso con pacientes reales, persistencia remota, audio histórico ni múltiples usuarios sin un proyecto posterior que incorpore revisión legal, privacidad, autenticación, autorización y seguridad de datos.

Vercel Hobby es un plan con límites y condiciones de uso. El despliegue gratuito debe mantenerse dentro de ellos y no autoriza automáticamente un uso comercial o clínico. Si la plataforma exige una mejora pagada o tarjeta para una acción, esa acción queda fuera del MVP.
