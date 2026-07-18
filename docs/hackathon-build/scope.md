# Alcance del MVP de Rimay

## Estado del repositorio

Los incrementos 1 y 2 están completados y validados. Esta revisión ocurre antes de iniciar el incremento 3 y modifica únicamente documentación para reemplazar la arquitectura con servicios externos por una arquitectura de costo USD 0. El nuevo incremento 3 requiere otra autorización expresa; esta revisión no implementa código ni configura despliegues.

## Problema

Las personas con disartria post-ACV pueden necesitar practicar palabras y frases siguiendo indicaciones claras, repetibles y accesibles. Una práctica sin guía puede resultar difícil de sostener, y revisar manualmente cada intento consume tiempo profesional.

Rimay propone una demostración de práctica guiada que captura una respuesta hablada, calcula indicadores descriptivos reproducibles, ofrece una devolución breve y organiza un resumen para revisión. No busca determinar la condición clínica de una persona.

## Público objetivo

### Paciente de demostración

Persona que necesita instrucciones visuales y habladas, controles simples, tiempo suficiente para responder y una devolución breve que no la juzgue ni la clasifique.

### Profesional de demostración

Persona que revisa sesiones ficticias, intentos, texto reconocido o ingresado manualmente, métricas calculadas y decisiones explicables del motor local. Conserva siempre la interpretación y decisión profesional final.

Los dos roles operan mediante un selector dentro del mismo navegador. No existen cuentas, pacientes reales ni acceso entre dispositivos en este MVP.

## Propuesta de valor

Rimay convierte una práctica breve en un recorrido accesible, explicable y gratuito:

- combina instrucciones escritas y habladas;
- permite grabar y escuchar el intento antes de aceptarlo;
- mantiene el audio exclusivamente en memoria y no envía el `Blob`;
- ofrece reconocimiento opcional del navegador o entrada manual;
- calcula métricas de audio y texto localmente con algoritmos versionados;
- genera retroalimentación y adaptación mediante reglas deterministas y plantillas curadas;
- presenta al profesional la evidencia y las limitaciones, no una conclusión clínica;
- se construye, prueba y despliega sin servicios de pago, secretos ni tarjeta de crédito.

## Alcance obligatorio

- Interfaz en español neutro y orientada a WCAG 2.2 AA.
- Selector local entre vista paciente y vista profesional.
- Sesiones de cinco intentos válidos con datos exclusivamente ficticios.
- Tres tipos de ejercicio:
  - repetición de palabras;
  - repetición de frases;
  - lectura guiada con pausas.
- Instrucciones visibles y reproducibles con `SpeechSynthesis`.
- Solicitud contextual de permiso de micrófono.
- Grabación de hasta 60 segundos o 10 MB con `MediaRecorder`.
- Reproducción y análisis local del audio; el `Blob` no se envía ni se almacena.
- Aviso previo y opción explícita antes de usar reconocimiento automático, porque algunos navegadores pueden procesarlo mediante un servicio remoto propio.
- `BrowserSpeechRecognizer` basado en `SpeechRecognition` o `webkitSpeechRecognition`, orientado principalmente a Chrome y Edge, ejecutado en paralelo con `MediaRecorder`, configurado en español y con resultados provisionales y finales.
- Manejo accesible de soporte ausente, permiso rechazado, captura fallida, red, silencio, idioma no compatible y cancelación.
- `DemoSpeechRecognizer` determinista, sin red y rotulado como resultado predefinido de demostración que no analizó el audio.
- Entrada manual siempre disponible y rotulada como manual, no como transcripción automática.
- Cálculo local, determinista y versionado de duración, habla estimada, pausas, RMS, pico, clipping, silencio y banderas de calidad.
- Procesamiento textual local y versionado: normalización, tokenización, similitud, coincidencias, palabras omitidas, palabras adicionales, conteo y palabras por minuto cuando exista texto utilizable.
- Motor local determinista para retroalimentación, adaptación y resumen profesional, basado en calidad de audio, similitud, pausas, duración, proporción de silencio, dificultad e intentos.
- Reglas versionadas, plantillas curadas, explicación de cada acción, mismo resultado ante la misma entrada y selección exclusiva desde ejercicios permitidos.
- Repetición manual controlada por el usuario sin afirmaciones diagnósticas.
- Persistencia en `localStorage` de sesiones ficticias y datos derivados permitidos, nunca audio.
- Acción confirmada para eliminar completamente todos los datos locales de Rimay.
- README, pruebas automatizadas, build reproducible y despliegue estático en Vercel Hobby en el incremento final.
- Declaración de Devpost fiel: construido con Codex y asistencia de GPT-5.6; el runtime es local, determinista y gratuito.

## Exclusiones

- OpenAI API, `gpt-4o-transcribe`, GPT-5.6 API y Responses API en runtime.
- APIs comerciales de transcripción, modelos hospedados contratados o servicios con facturación por uso.
- Pruebas temporales, créditos promocionales, proveedores que exijan tarjeta y cualquier configuración que pueda generar cargos.
- Supabase, Edge Functions, backend propio, funciones serverless, base de datos o almacenamiento remoto en el MVP inicial.
- Vercel Pro, add-ons, dominios comprados, analytics pagos o recursos fuera de Vercel Hobby.
- Diagnóstico, clasificación de severidad, puntuación clínica o pronóstico.
- Recomendaciones terapéuticas autónomas o prescripción de tratamiento.
- Pacientes, audios, textos reconocidos o historias clínicas reales.
- Persistencia de audio o reproducción posterior del audio por el profesional.
- Autenticación, autorización clínica, acceso entre usuarios o sincronización entre dispositivos.
- Aplicación móvil nativa, videollamadas, agenda, facturación o chat.
- Entrenamiento o ajuste de modelos.
- Análisis clínico de fonemas, articulación avanzada o integración con dispositivos médicos.
- Avatares 3D y elementos visuales no necesarios para la demostración.
- Presentar un fixture demo o una entrada manual como si provinieran del análisis automático del audio.

## Momento principal de la demostración

En un recorrido de aproximadamente 90 segundos:

1. El presentador entra como paciente e inicia una sesión ficticia.
2. Rimay muestra y pronuncia una frase.
3. Antes del reconocimiento, Rimay explica que el navegador podría usar un servicio remoto propio y permite elegir reconocimiento automático o entrada manual.
4. El paciente graba, detiene y escucha su intento; `MediaRecorder` mantiene el `Blob` sólo en memoria.
5. Si se eligió reconocimiento, Rimay muestra resultados provisionales y el resultado final con origen “Reconocimiento del navegador”. Si se eligió entrada manual, el origen visible es “Texto ingresado manualmente”.
6. Rimay calcula en el navegador métricas descriptivas de audio y texto, con versión y aviso no clínico.
7. El motor local selecciona una plantilla y un ejercicio permitido, muestra la razón determinista y permite repetir manualmente o continuar.
8. El presentador cambia a la vista profesional y abre el resumen local, donde métricas, decisiones del motor, procedencia del texto y limitaciones aparecen separadas.

El modo de demostración sin red usa `DemoSpeechRecognizer` y fixtures deterministas. Debe advertir de forma persistente que el texto fue predefinido y que el audio no fue analizado para producirlo.

## Costo e infraestructura

- Desarrollo y pruebas se realizan localmente con herramientas y dependencias sin costo de uso runtime.
- Producción es una SPA estática en Vercel Hobby bajo el subdominio gratuito asignado por la plataforma.
- No se despliegan Functions, Storage, bases de datos, analytics pagos ni add-ons.
- No se activa una prueba Pro, no se ingresa tarjeta y no se configura consumo bajo demanda.
- Si se alcanza un límite de Hobby, el proyecto acepta la pausa o espera al restablecimiento del cupo; el plan no autoriza una ampliación pagada.
- Los créditos del hackathon se reservan únicamente para Codex y no son un requisito operativo de la aplicación.

## Señales de éxito

- Una persona puede completar la sesión usando teclado y sin depender del audio, del color o del reconocimiento automático.
- Las mismas entradas de audio y texto producen las mismas métricas para las mismas versiones de algoritmo.
- La misma entrada del motor de reglas produce exactamente el mismo mensaje, acción, razón y ejercicio.
- Ningún texto presenta resultados como diagnóstico, severidad o puntuación clínica.
- La procedencia `browser`, `demo` o `manual` siempre es visible y se conserva con el intento.
- Un fallo o ausencia de `SpeechRecognition` conduce a entrada manual sin destruir la grabación temporal.
- La vista profesional puede rastrear cada decisión del motor hasta intentos y claves de métricas existentes.
- “Eliminar todos mis datos locales” quita todas las sesiones y métricas de Rimay sin afectar almacenamiento ajeno.
- Al inspeccionar red, almacenamiento y build no aparecen audio persistido, llamadas de la aplicación a APIs de análisis, claves ni recursos facturables.
- El repositorio puede construirse, probarse, ejecutarse y desplegarse dentro de Vercel Hobby con costo USD 0, sujeto a los límites y términos vigentes del plan gratuito.
