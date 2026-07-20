# Guion de demostración — 2:45 aproximadamente

Este guion está pensado para una toma reproducible de entre dos minutos y medio y tres minutos. Usa el modo demo como recorrido principal: muestra la arquitectura real de Rimay sin depender del soporte o la latencia de `SpeechRecognition`.

| Tiempo | Narración | Acción en pantalla |
| --- | --- | --- |
| 0:00–0:20 | “Después de un accidente cerebrovascular, algunas personas pueden necesitar oportunidades estructuradas para practicar producción oral. Las herramientas digitales no siempre son claras o accesibles, y enviar audio a servicios externos puede introducir riesgos innecesarios. Rimay explora una práctica guiada que prioriza control, privacidad y resultados reproducibles.” | Mostrar el encabezado y el inicio de la sesión en 0 de 5. Mantener visible el aviso de alcance y seguridad. |
| 0:20–0:35 | “Rimay es una demostración técnica, no una herramienta clínica. No diagnostica, no puntúa severidad y no recomienda tratamiento. Sus métricas describen este intento y sus ejercicios son ficticios.” | Señalar brevemente el aviso no clínico sin abrir otras ventanas. |
| 0:35–0:52 | “La sesión comienza con una palabra. La instrucción está escrita y también puedo escucharla. Nada se reproduce automáticamente: yo decido cuándo escuchar, grabar o avanzar.” | Pulsar “Escuchar instrucción”, dejar oír una frase breve y detener si es necesario. Pulsar “Preparar intento”. |
| 0:52–1:10 | “Para una demo estable elegiré datos simulados. Este modo no solicita micrófono, no graba mi voz y no afirma que el texto proceda de audio. La entrada manual es además el fallback previsto cuando el reconocimiento del navegador no está disponible.” | Elegir “Demostración”. Mostrar los tres avisos y pulsar “Cargar datos simulados”. |
| 1:10–1:32 | “Al analizar, Rimay ejecuta métricas acústicas simuladas, calcula la comparación textual local y aplica reglas deterministas. Aquí vemos la procedencia, la versión, la explicación y la evidencia. No es una puntuación clínica.” | Pulsar “Analizar intento”. Recorrer visualmente feedback, procedencia, versión y dos o tres métricas. |
| 1:32–1:55 | “Acepto el intento y Rimay propone la siguiente actividad. Los tres primeros intentos válidos cubren palabra, frase y lectura guiada. La pausa de lectura aparece como texto, no depende sólo del sonido o del color.” | Pulsar “Continuar”, mostrar la preview y “Comenzar siguiente ejercicio”. Repetir rápidamente la ruta demo para frase y lectura, señalando el indicador “Pausa”. |
| 1:55–2:15 | “Después de cubrir los tres tipos, los intentos cuarto y quinto usan la misma política de adaptación acotada. Una captura con un problema técnico no contaría; la persona puede repetir o continuar sin que Rimay la presente como progreso.” | Completar el cuarto intento demo y avanzar al quinto. Mantener visible el progreso técnico de 4 de 5. |
| 2:15–2:30 | “El quinto análisis tampoco finaliza por sí solo. La sesión termina únicamente cuando confirmo ‘Finalizar sesión’.” | Analizar el quinto intento y pulsar “Finalizar sesión”. Mostrar “5 de 5 intentos válidos” y “El audio no fue conservado”. |
| 2:30–2:48 | “En una captura real, el Blob permanece sólo en memoria. Rimay no tiene backend, telemetría ni persistencia. `SpeechRecognition` puede depender de un servicio del navegador, por eso es opcional y siempre existe la ruta manual.” | Mantener la vista completada; no abrir herramientas de desarrollo durante la toma principal. |
| 2:48–3:00 | “Construimos Rimay con React, Vite y TypeScript. Codex y GPT-5.6 ayudaron a convertir requisitos en contratos, pruebas y documentación, pero no forman parte del runtime. El resultado es una demostración explicable, reproducible y honesta sobre sus límites.” | Cerrar sobre el nombre del producto o la vista completada. |

## Plan de contingencia para la grabación

La toma principal no debe improvisarse con reconocimiento browser. Aunque esa opción permanece visible como mejora progresiva, su soporte y resultado dependen del navegador. Si falla, no intentar repararlo durante el video: volver a la ruta demo determinista.

- Usar demo para todas las tomas oficiales.
- Refrescar la página antes de repetir una toma para comenzar en 0 de 5.
- Confirmar el volumen del sistema y una voz española antes de iniciar la grabación.
- Si la síntesis no está disponible, leer la instrucción visible y continuar; la voz no bloquea el flujo.
- Si una acción queda fuera de cuadro, detener la toma y comenzar de nuevo en lugar de ocultar el estado.

Antes de grabar, cerrar notificaciones y pestañas con información personal. Las herramientas de desarrollo pueden mostrarse en una captura separada de privacidad, pero no son necesarias para completar el recorrido principal.
