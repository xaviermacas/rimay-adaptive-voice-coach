# Borrador de presentación para Devpost

Este documento reúne texto reutilizable para la entrega de Rimay. Los enlaces y el Session ID permanecen como placeholders hasta que existan; no deben reemplazarse con valores inventados.

## Project name

Rimay Adaptive Voice Coach

## Tagline

**Recomendada:** Práctica oral accesible con métricas locales y feedback determinista.

Alternativas:

- Cinco intentos guiados, privacidad local y decisiones explicables.
- Una demostración web de práctica oral clara, reproducible y sin backend.

## Elevator pitch

Rimay es una demostración web accesible para practicar producción oral mediante ejercicios de palabra, frase y lectura guiada. Captura audio de forma temporal, calcula métricas acústicas y textuales en el navegador y ofrece feedback mediante reglas locales versionadas. La persona puede usar reconocimiento opcional del navegador, declarar manualmente lo que intentó decir o recorrer una demo determinista. Una sesión termina después de cinco intentos válidos aceptados. Rimay no diagnostica, no puntúa severidad y no sustituye la evaluación de un profesional.

## Inspiration

El proyecto parte de una pregunta humana y técnica: ¿cómo podría una experiencia web acompañar una práctica oral estructurada sin convertir observaciones de una grabación en una conclusión clínica? Después de un accidente cerebrovascular, algunas personas pueden necesitar oportunidades de práctica claras, repetibles y accesibles. Sin embargo, una interfaz compleja, la dependencia de reconocimiento automático o el envío de audio a terceros pueden convertirse en barreras adicionales.

Rimay explora una respuesta deliberadamente acotada. Presenta instrucciones breves, deja el control de cada acción en manos de la persona y describe únicamente el intento actual. No surge de una validación clínica documentada ni pretende demostrar eficacia terapéutica; es un prototipo técnico que busca hacer visibles desde el inicio la privacidad, la accesibilidad y los límites médicos.

## What it does

La sesión empieza con una palabra, continúa con una frase y luego una lectura guiada con una pausa visible. La persona puede leer la instrucción o escucharla, elegir cómo realizará el intento y controlar cuándo comienza y termina la grabación. El audio real permanece temporalmente en memoria y puede reproducirse antes del análisis.

Rimay calcula métricas acústicas locales y, cuando existe texto utilizable, métricas textuales. Ese texto puede proceder de `SpeechRecognition` del navegador o de una declaración manual; la interfaz muestra siempre su procedencia. La demo usa fixtures locales claramente identificados, no solicita micrófono y no afirma que analizó una voz.

Un motor determinista selecciona feedback, muestra la evidencia utilizada y propone repetir o continuar. Las capturas con condiciones técnicas bloqueantes no cuentan. Los tres primeros intentos válidos cubren los tres tipos de ejercicio y los siguientes aplican la adaptación acotada. La sesión sólo finaliza después de aceptar explícitamente el quinto intento válido.

## How we built it

Rimay es una SPA estática construida con React, Vite, TypeScript estricto y Tailwind CSS. `MediaRecorder` gestiona la captura temporal y negocia el formato disponible en el navegador. Web Audio decodifica PCM y calcula `audio-metrics-v1`; un módulo puro aplica normalización y alineamiento por palabras para producir `text-metrics-v1`.

El feedback no se genera con un modelo remoto. `coach-rules-v1` valida sus entradas, evalúa señales en un orden estable y selecciona una plantilla de `coach-templates-v1`. Dos máquinas de estado discriminadas separan la vida del intento y la sesión completa. Esto evita estados imposibles y permite invalidar eventos tardíos o acciones duplicadas.

La arquitectura no necesita backend, autenticación, base de datos, telemetría o variables secretas. Las pruebas usan PCM sintético, fixtures textuales y dobles de APIs del navegador para falsificar umbrales, fallos, limpieza de recursos, concurrencia y adaptación.

## Architecture

```text
MediaRecorder o fixture demo
        ↓
audio-metrics-v1
        ↓
texto browser, manual, demo o ausente
        ↓
text-metrics-v1 cuando corresponde
        ↓
coach-rules-v1 + coach-templates-v1
        ↓
feedback, evidencia y siguiente acción
        ↓
máquina de sesión: 0 → 5 intentos válidos
```

La captura y los adaptadores del navegador viven fuera del dominio puro. El catálogo sólo ofrece tres ejercicios ficticios permitidos. La misma entrada serializable produce la misma decisión, por lo que cada resultado puede relacionarse con una regla, una plantilla y evidencia conocida. Esta trazabilidad fue más importante para la demostración que una respuesta generativa difícil de reproducir.

## How Codex was used

Codex acompañó el proyecto durante una planificación incremental de siete entregas. Ayudó a convertir requisitos ambiguos en contratos observables, reconciliar nombres y estados entre la especificación y TypeScript y revisar los riesgos antes de escribir integración. Cada incremento separó una incertidumbre principal —captura, métricas, reconocimiento, coaching, composición, voz y sesión— y cerró con pruebas y evidencia documentada.

También se utilizó para diseñar casos límite: permisos que llegan tarde, resultados provisionales que nunca finalizan, dobles clics, callbacks después del desmontaje, catálogos adversariales y capturas bloqueantes cerca del quinto intento. Codex generó y revisó pruebas, inspeccionó diffs, mantuvo la documentación normativa y auditó que no aparecieran audio persistido, secretos, red propia o lenguaje clínicamente inseguro.

La misma sesión principal de trabajo conserva la trazabilidad entre decisiones, implementación, validación y materiales de entrega. Antes de cada commit se revisaron los contratos, la matriz automática y el alcance. Codex no se usa como servicio runtime y no transcribe ni genera feedback dentro de Rimay. La ejecución de `/feedback` se realizará después de cerrar los materiales de presentación; su Session ID sigue pendiente.

## Challenges

La variabilidad de `SpeechRecognition` fue el riesgo más visible. Sus eventos, soporte, permisos y dependencia de red pertenecen al navegador, no a Rimay. La versión final no produjo un resultado browser utilizable durante la validación manual, así que la entrada manual y la demo se trataron como rutas de primera clase en lugar de ocultar esa limitación.

La limpieza de recursos exigió atención similar. Un intento puede tener stream, grabador, chunks, URL temporal, reconocimiento, síntesis y análisis asíncrono activos. Generaciones monotónicas y guardas síncronas permiten ignorar eventos tardíos, evitar decisiones duplicadas y liberar recursos cuando la persona repite, continúa o inicia otra sesión.

Otro reto fue preservar determinismo sin convertir métricas técnicas en significado clínico. Los umbrales ayudan a decidir si una captura puede contarse o si conviene repetir, pero no describen severidad, pronóstico o respuesta terapéutica. Las plantillas se curaron para hablar del intento y la evidencia, no de la persona.

## Accomplishments

La versión candidata completa una sesión de cinco intentos válidos mediante demo o entrada manual, cubre palabra, frase y lectura guiada y aplica adaptación determinista en los intentos posteriores. El audio permanece temporal, el modo demo no solicita micrófono y cada decisión muestra versión, razón y evidencia.

El proyecto también consiguió integrar voz accesible sin autoplay, fallback textual, recuperación frente a reconocimiento ausente y una matriz automatizada amplia sin agregar backend o dependencias de IA. Chrome y Edge completaron los recorridos demo y manual con consola, red y almacenamiento inspeccionados.

## What we learned

En lo técnico, aprendimos que las APIs Web Speech deben tratarse como capacidades progresivas, no como una base uniforme. También comprobamos que una máquina de estados explícita y una política rigurosa de limpieza simplifican mucho la concurrencia del navegador.

En producto, la procedencia visible importa tanto como la métrica: un texto reconocido, uno simulado y uno declarado manualmente no deben compartir la misma explicación. En el plano biomédico, el aprendizaje central fue mantener una frontera editorial firme. Una observación reproducible puede apoyar una demostración, pero no se convierte por ello en una medida clínicamente válida.

## Accessibility and privacy

Las instrucciones y el feedback hablado existen también como texto. No hay autoplay, los controles principales son nativos y grandes, el foco es visible y las pausas se presentan de forma textual. El recorrido fue revisado con teclado, zoom al 200 % y reflow en Chrome y Edge, pero todavía no tuvo una comprobación manual con lector de pantalla ni una certificación WCAG.

El audio real vive sólo durante el intento actual y no se almacena ni se envía por la aplicación. No existen backend, telemetría o persistencia. La interfaz explica que `SpeechRecognition` y algunas voces sintetizadas pueden depender de servicios administrados por el navegador o el sistema operativo. La ruta manual permite evitar el reconocimiento automático.

## Limitations

Rimay no está clínicamente validado, no tuvo revisión profesional externa y no debe utilizarse con pacientes o datos reales. El catálogo se limita a tres ejercicios ficticios. La entrada manual es una declaración del usuario, no una verificación acústica. `SpeechRecognition` varía por navegador y no fue utilizable durante la validación final.

La versión candidata no persiste sesiones, no ofrece roles ni panel profesional y no limita el número total de capturas necesarias para alcanzar cinco intentos válidos. Estas funciones fueron deliberadamente diferidas y no se presentan como existentes.

## What is next

Los incrementos 8–9 permanecen como trabajo futuro. Podrían añadir persistencia local sanitizada con eliminación explícita, roles de navegación y un resumen técnico para revisión profesional. Un proyecto posterior también debería ampliar el catálogo y realizar validación con profesionales antes de considerar cualquier uso más allá de la demostración.

## Links and Codex feedback

- Demo URL: **[PENDING]**
- Repository URL: **[PENDING]**
- Video URL: **[PENDING]**
- Codex `/feedback` Session ID: **[PENDING]**
