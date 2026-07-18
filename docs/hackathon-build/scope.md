# Alcance del MVP de Rimay

## Estado del repositorio

Al iniciar esta fase, la carpeta de trabajo contiene cero archivos y no es un repositorio Git. No existe una versión previa de Rimay que pueda reutilizarse. Este incremento sólo establece documentación; la inicialización técnica pertenece al siguiente incremento y requiere autorización expresa.

## Problema

Las personas con disartria post-ACV pueden necesitar practicar palabras y frases siguiendo indicaciones claras, repetibles y accesibles. Una práctica sin guía puede resultar difícil de sostener, y revisar manualmente cada intento consume tiempo profesional.

Rimay propone una demostración de práctica guiada que captura una respuesta hablada, calcula indicadores descriptivos reproducibles, ofrece una devolución breve y organiza un resumen para revisión. No busca determinar la condición clínica de una persona.

## Público objetivo

### Paciente de demostración

Persona que necesita instrucciones visuales y habladas, controles simples, tiempo suficiente para responder y una devolución breve que no la juzgue ni la clasifique.

### Profesional de demostración

Persona que revisa sesiones ficticias, intentos, transcripciones, métricas calculadas y un resumen generado por IA. Conserva siempre la interpretación y decisión profesional final.

Los dos roles operan mediante un selector dentro del mismo navegador. No existen cuentas, pacientes reales ni acceso entre dispositivos en este MVP.

## Propuesta de valor

Rimay convierte una práctica breve en un recorrido accesible y explicable:

- combina instrucciones escritas y habladas;
- permite grabar y escuchar el intento antes de enviarlo;
- separa métricas deterministas de texto generado por IA;
- adapta el siguiente ejercicio dentro de límites controlados;
- funciona en modo de demostración sin claves ni servicios externos;
- presenta al profesional la evidencia y las limitaciones, no una conclusión clínica.

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
- Reproducción local del audio antes de procesarlo.
- Transcripción mediante proveedor simulado o `gpt-4o-transcribe` desde una Edge Function.
- Cálculo local, determinista y versionado de duración, habla estimada, pausas, RMS, pico, clipping, palabras por minuto, similitud y banderas de calidad.
- Retroalimentación estructurada con proveedor simulado o `gpt-5.6` mediante Responses API.
- Validación de esquema, dominio, evidencia y lenguaje antes de aplicar cualquier salida de IA.
- Selección adaptativa limitada a ejercicios permitidos por una política determinista.
- Resumen profesional que distinga datos calculados, texto generado y limitaciones.
- Persistencia local de sesiones derivadas y fixtures de demostración.
- Manejo accesible de estados vacíos, permisos rechazados, fallos de captura, red, transcripción, IA y voz.
- README, pruebas automatizadas, build reproducible y despliegue de demostración en el incremento final.

## Exclusiones

- Diagnóstico, clasificación de severidad, puntuación clínica o pronóstico.
- Recomendaciones terapéuticas autónomas o prescripción de tratamiento.
- Pacientes, audios, transcripciones o historias clínicas reales.
- Persistencia de audio o reproducción posterior del audio por el profesional.
- Autenticación, autorización clínica, acceso entre usuarios o sincronización entre dispositivos.
- Aplicación móvil nativa, videollamadas, agenda, facturación o chat.
- Entrenamiento o ajuste de modelos.
- Análisis clínico de fonemas, articulación avanzada o integración con dispositivos médicos.
- Avatares 3D y elementos visuales no necesarios para la demostración.
- Uso del modo demo como sustituto silencioso cuando falle un proveedor live.

## Momento principal de la demostración

En un recorrido de aproximadamente 90 segundos:

1. El presentador entra como paciente e inicia una sesión ficticia.
2. Rimay muestra y pronuncia una frase.
3. El paciente graba, detiene y escucha su intento.
4. Rimay muestra la transcripción y métricas descriptivas calculadas fuera de GPT.
5. GPT-5.6 devuelve una frase breve y un ejercicio sugerido dentro de una lista permitida; Rimay valida ambos y reproduce la devolución.
6. El siguiente ejercicio cambia de forma explicable sin usar etiquetas clínicas.
7. El presentador cambia a la vista profesional y abre el resumen, donde las métricas, observaciones de IA y limitaciones aparecen claramente separadas.

El modo demo debe poder reproducir este recorrido completo sin red ni secretos, con latencias y errores simulables de forma determinista.

## Señales de éxito

- Una persona puede completar la sesión usando teclado y sin depender del audio o del color.
- Las mismas muestras de audio producen las mismas métricas para una misma versión del algoritmo.
- Ningún texto presenta resultados como diagnóstico o clasificación.
- Un fallo de proveedor ofrece una recuperación clara y no destruye la grabación local antes de que el usuario decida.
- La vista profesional puede rastrear cada observación de IA hasta intentos y claves de métricas existentes.
- El repositorio puede ejecutarse en modo demo sin configurar OpenAI o Supabase.

