# Rimay Adaptive Voice Coach

Una experiencia web accesible para practicar producción oral mediante ejercicios guiados, métricas técnicas locales y feedback determinista.

**Estado:** Hackathon release candidate — technical demonstration

## Una práctica guiada, no una evaluación clínica

Después de un accidente cerebrovascular, algunas personas pueden necesitar oportunidades estructuradas para practicar la producción oral. Rimay explora cómo una aplicación web puede presentar una instrucción clara, ofrecer tiempo para responder y acompañar una secuencia breve de ejercicios de palabra, frase y lectura guiada.

La versión candidata es una demostración técnica. No diagnostica disartria, no puntúa severidad, no prescribe tratamiento y no sustituye el criterio de un profesional. Sus ejercicios, reglas y umbrales no han sido clínicamente validados y la aplicación no debe utilizarse con datos reales de pacientes.

El proyecto prioriza privacidad, control de la persona y comportamiento reproducible. El audio se captura de forma temporal, las métricas se calculan en el navegador y el feedback procede de reglas locales versionadas. No hay backend, telemetría, persistencia ni llamadas de Rimay a servicios de IA durante la ejecución.

## El problema que explora

Una práctica digital puede ser difícil de seguir cuando la interfaz exige demasiados pasos, usa controles pequeños o depende de una única forma de recibir instrucciones. A esto se suma una decisión sensible: enviar audio a un servicio externo puede introducir riesgos de privacidad que no son necesarios para una demostración temprana.

Rimay busca una alternativa comprensible y honesta. La instrucción existe como texto y puede escucharse; las acciones requieren confirmación explícita; los errores ofrecen una ruta recuperable; y las observaciones describen el intento actual sin clasificar a la persona. El objetivo no es producir una puntuación médica, sino demostrar una interacción técnica trazable.

## Cómo funciona

Cada sesión empieza con una palabra y progresa hacia una frase y una lectura guiada. La persona lee o escucha la instrucción, realiza un intento, revisa el resultado técnico y decide si repite o continúa. Las capturas con condiciones acústicas bloqueantes no cuentan como intentos válidos. La sesión termina únicamente después de aceptar cinco intentos válidos y activar de forma explícita “Finalizar sesión”.

El recorrido tiene tres modos:

- **Reconocimiento del navegador:** graba audio temporal y solicita texto mediante `SpeechRecognition` cuando el navegador lo permite. Algunos navegadores pueden usar un servicio remoto propio; Rimay no controla ese servicio ni promete disponibilidad, exactitud o funcionamiento offline.
- **Entrada manual:** graba audio para el análisis acústico y permite que la persona escriba lo que intentó pronunciar. Ese texto es una declaración del usuario y Rimay no verifica que corresponda a la grabación.
- **Demo determinista:** carga fixtures locales claramente identificados. No solicita micrófono, no analiza la voz de la persona y no depende de `SpeechRecognition`, por lo que es la ruta recomendada para una demostración reproducible.

`SpeechRecognition` se trata como una mejora progresiva. Si no está disponible, termina sin texto o produce un error, la entrada manual permite continuar sin fabricar una transcripción.

## Funcionalidad de la versión candidata

Rimay combina una captura temporal con dos motores de métricas y un motor de coaching local. La versión entregada incluye:

- captura mediante `MediaRecorder`, con negociación de formato y límites de 60 segundos o 10 MB;
- decodificación con Web Audio API y métricas acústicas reproducibles;
- normalización y comparación textual local con procedencia visible;
- feedback y selección del siguiente ejercicio mediante reglas deterministas;
- un catálogo ficticio de palabra, frase y lectura guiada;
- instrucciones y devolución habladas mediante `SpeechSynthesis`, siempre con texto visible;
- una sesión adaptativa de cinco intentos válidos exclusivamente en memoria;
- controles explícitos, recuperación manual y un modo demo estable.

## Arquitectura determinista

El recorrido principal puede resumirse así:

```text
captura o fixture
→ métricas acústicas
→ resultado textual opcional
→ métricas textuales
→ coach-rules-v1
→ feedback y siguiente acción
```

`audio-metrics-v1` transforma PCM decodificado en observaciones como duración, actividad estimada, pausas, RMS, pico, silencio y posible clipping. `text-metrics-v1` normaliza texto en español, alinea palabras y calcula coincidencias, omisiones, adiciones, sustituciones, similitud y palabras por minuto cuando existe evidencia suficiente.

`coach-rules-v1` recibe únicamente datos derivados y estado explícito de la sesión. Selecciona una acción y una plantilla de `coach-templates-v1`, explica la razón y sólo puede elegir ejercicios del catálogo local permitido. La máquina del intento evita combinaciones imposibles durante captura, texto y análisis; la máquina de sesión conserva los intentos válidos aceptados, la cobertura de tipos y la finalización.

Este diseño determinista hace que una misma entrada produzca el mismo resultado. Así es posible probar umbrales, errores, eventos tardíos, acciones duplicadas y selección adaptativa sin depender de una red, un modelo remoto o texto generado durante el runtime.

## Privacidad

El `Blob` de audio vive únicamente en memoria durante el intento actual. Puede reproducirse y analizarse localmente, pero Rimay no lo almacena, no lo convierte a base64 y no lo envía. Las pistas, URLs temporales y referencias se liberan al repetir, continuar, finalizar o desmontar el recorrido.

La versión candidata no usa backend, telemetría, `localStorage`, Session Storage, IndexedDB ni Cache API. Tampoco contiene clientes o endpoints de Supabase u OpenAI. El modo manual no afirma que el texto escrito fue reconocido o verificado contra el audio.

La frontera del navegador debe entenderse por separado. `SpeechRecognition` puede depender de soporte, permisos, red y servicios administrados por el navegador. De forma similar, algunas voces de `SpeechSynthesis` pueden depender del navegador o del sistema operativo aunque Rimay prefiera una voz española local cuando está disponible.

## Accesibilidad

Todo contenido sintetizado tiene un equivalente visible. Escuchar, detener, grabar, repetir, continuar y finalizar requieren una acción explícita; no hay autoplay ni avance automático. Los controles principales son nativos, operables por teclado y tienen foco visible. Las pausas de lectura aparecen como texto, no sólo mediante color o sonido.

El recorrido fue revisado manualmente con teclado, foco, zoom al 200 % y reflow en Chrome y Edge. No se completó una validación manual con lector de pantalla, por lo que el proyecto no afirma certificación ni conformidad completa con WCAG 2.2 AA.

## Instalación y ejecución

Requiere Node.js `>=22.12.0` y npm.

```bash
npm install
npm run dev
```

En Windows PowerShell puede ser necesario usar el ejecutable `.cmd` si la política local bloquea `npm.ps1`:

```powershell
npm.cmd install
npm.cmd run dev
```

Para validar la versión candidata:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

El build de Vite genera una SPA estática en `dist`. La aplicación no necesita variables de entorno, claves de API ni servicios conectados.

## Tecnologías

- React 19 y React DOM.
- Vite 8.
- TypeScript estricto.
- Tailwind CSS 4.
- Web Audio API, `MediaRecorder` y Web Speech API.
- Vitest, Testing Library y ESLint.

Las dependencias directas están fijadas con versiones exactas y el lockfile forma parte del repositorio.

## Cómo se usaron Codex y GPT-5.6

Codex y GPT-5.6 ayudaron durante la construcción, no durante la ejecución de Rimay. Se usaron para convertir requisitos de producto en contratos tipados, revisar la arquitectura, identificar riesgos del navegador, diseñar casos límite y generar o revisar pruebas. También apoyaron la reconciliación de documentación, la auditoría de privacidad y accesibilidad y la detección de inconsistencias antes de cada cierre incremental.

El runtime no llama a modelos de OpenAI. La captura, las métricas, el coaching y la adaptación se ejecutan mediante APIs del navegador y reglas locales versionadas.

## Limitaciones conocidas

Rimay es una demostración no clínicamente validada y no tuvo revisión clínica o profesional externa. `SpeechRecognition` varía entre navegadores y no produjo un resultado utilizable durante la validación final de esta versión; demo y entrada manual sí permitieron completar el recorrido en Chrome y Edge.

El texto manual es declarado por el usuario, el catálogo contiene sólo tres ejercicios y no existe persistencia ni panel profesional. Tampoco existe un límite acumulado de capturas: la sesión puede permanecer abierta hasta obtener cinco intentos válidos. Estas decisiones mantienen claro y reproducible el corte de hackathon, pero no definen un producto listo para uso clínico.

## Trabajo futuro

Los incrementos 8–9 quedaron diferidos. Una etapa posterior podría explorar persistencia local sanitizada, roles de navegación, un resumen técnico para revisión profesional, validación con profesionales y un catálogo más amplio. Cada ampliación necesitaría nuevos contratos, pruebas y revisión de privacidad; ninguna de esas funciones forma parte de la versión candidata actual.

## Estado de licencia

El proyecto todavía no tiene una licencia definida. Antes de cualquier reutilización o distribución pública más allá de la evaluación de la hackathon, el responsable debe decidir y documentar sus términos de licencia.
