# Rimay Adaptive Voice Coach

## Estado y propósito

Rimay es una aplicación web accesible para práctica guiada del habla con datos ficticios, orientada a personas con disartria post-ACV y a profesionales que revisan el resultado de una sesión de demostración.

Rimay es una herramienta de apoyo para práctica y seguimiento. No diagnostica disartria, no clasifica severidad, no prescribe tratamiento y no sustituye el criterio de un profesional.

Los incrementos 1, 2, 3, 4, 5 y 6 están completados. El último commit confirmado es `f846f38 feat: add exercise catalog and accessible speech output`. El incremento 7 — Sesión de cinco intentos y adaptación completa es el siguiente incremento planificado y todavía no se ha iniciado.

La tarea actual está autorizada exclusivamente para resolver bloqueos documentales previos al incremento 7 en `AGENTS.md`, `docs/hackathon-build/spec.md`, `docs/hackathon-build/checklist.md` y `docs/hackathon-build/build-notes.md`. El código del incremento 7 sólo puede modificarse después de una autorización explícita posterior. Durante esta pausa no escribas código de aplicación, no agregues dependencias, no configures servicios y no hagas commit.

## Arquitectura esperada

- Frontend estático: React, Vite, TypeScript estricto y Tailwind CSS.
- Captura: `MediaRecorder` con negociación de MIME en tiempo de ejecución y límites de 60 segundos o 10 MB.
- Análisis de audio: Web Audio API para decodificar PCM y calcular métricas deterministas y versionadas en el navegador.
- Reconocimiento opcional: `BrowserSpeechRecognizer` basado en `SpeechRecognition` o `webkitSpeechRecognition`, iniciado en paralelo con `MediaRecorder`, con resultados provisionales y finales en español.
- Demostración: `DemoSpeechRecognizer` determinista, sin red y claramente identificado como texto predefinido que no analizó el audio.
- Alternativa manual: el usuario puede omitir o abandonar el reconocimiento automático y escribir lo que intentó pronunciar; la interfaz identifica el origen manual y nunca lo presenta como transcripción automática.
- Procesamiento textual: normalización, tokenización, similitud, coincidencias, omisiones, adiciones y palabras por minuto se calculan localmente mediante reglas versionadas y pruebas deterministas.
- Retroalimentación, adaptación y resumen: motor local determinista con reglas versionadas, plantillas curadas, razones visibles y selección limitada al catálogo permitido.
- Voz de salida: `SpeechSynthesis` con voz española cuando esté disponible y texto visible equivalente.
- Persistencia del MVP: una clave versionada de `localStorage` conserva sólo sesiones ficticias y datos derivados; incluye una acción para eliminar todos los datos locales de Rimay. El audio nunca se persiste.
- Despliegue: SPA estática en Vercel Hobby, dentro de sus límites gratuitos, sin Functions, add-ons, dominios comprados ni servicios conectados que puedan generar cargos.
- Sin backend inicial: no se implementan Supabase, Edge Functions, OpenAI API, APIs comerciales ni integraciones que requieran facturación, prueba temporal o tarjeta de crédito.
- Herramientas de construcción: Codex y GPT-5.6 pueden usarse durante diseño, implementación, revisión, pruebas y documentación; no son dependencias ni servicios runtime de Rimay.

Consulta `docs/hackathon-build/spec.md` antes de tomar decisiones de arquitectura o de contratos.

## Restricción de costo USD 0

- Ninguna función runtime de Rimay puede requerir una API key, cuenta facturable, tarjeta, crédito promocional o prueba temporal.
- No introduzcas OpenAI API, `gpt-4o-transcribe`, GPT-5.6 API, Responses API, Supabase ni proveedores comerciales de transcripción en el MVP.
- No habilites planes Pro, add-ons, analytics pagos, almacenamiento remoto, funciones serverless ni dominios comprados.
- Si Vercel Hobby alcanza un límite gratuito, el despliegue debe esperar al restablecimiento del cupo o continuar localmente; nunca debe activar facturación.
- Antes de incorporar una dependencia o servicio, demuestra que no requiere pago en instalación, prueba, build, despliegue ni runtime.

## Comandos del proyecto

```text
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

No se necesitan comandos de Supabase ni de una API externa para construir, probar o desplegar el MVP.

## Flujo de trabajo obligatorio

1. Lee este archivo, el documento de alcance, el PRD, la especificación, el checklist y las notas de construcción antes de modificar el proyecto.
2. Trabaja en un solo incremento autorizado. No adelantes archivos, dependencias o comportamiento de incrementos posteriores.
3. Conserva el árbol en un estado verificable. Después de cada cambio ejecuta la comprobación más pequeña que pueda falsarlo.
4. Antes de finalizar, ejecuta como mínimo `npm run typecheck`, `npm test` y `npm run build` cuando esos comandos existan. Para cambios de interfaz, realiza además una comprobación manual del flujo afectado.
5. Revisa el diff completo y confirma que no contiene claves, datos sensibles, audio, transcripciones en logs, servicios cobrables ni cambios fuera de alcance.
6. Informa con precisión qué se verificó, qué no se pudo verificar y por qué.
7. Detente al cumplir la aceptación del incremento. No avances al siguiente incremento sin autorización expresa del responsable del proyecto.

Durante una fase exclusivamente documental, reemplaza los comandos de producto por comprobaciones de presencia, enlaces, cobertura, costo y consistencia mediante lectura, búsqueda de texto y revisión del diff.

## Convenciones de TypeScript

- Mantén `strict`, `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`.
- No uses `any`. Para entradas desconocidas, usa `unknown` y valídalas antes de acceder a sus campos.
- Valida todas las fronteras del navegador y del almacenamiento con esquemas de ejecución; los tipos estáticos no sustituyen la validación runtime.
- Usa uniones discriminadas para estados asíncronos, de grabación y de reconocimiento. Evita combinaciones de booleanos que permitan estados imposibles.
- Mantén puras las métricas, la normalización de texto, la validación y la selección adaptativa.
- Incluye unidades en los nombres (`durationMs`, `sizeBytes`) y usa fechas ISO 8601.
- Usa `import type` para importaciones exclusivamente de tipos y evita aserciones de tipo salvo justificación localizada.
- Usa identificadores y nombres de archivo en inglés; todo el contenido visible para el usuario debe estar en español neutro.
- Prefiere módulos pequeños organizados por funcionalidad. No agregues abstracciones o dependencias sin una necesidad demostrable.
- No mezcles tipos de dominio con eventos crudos de APIs del navegador. Traduce cada frontera a contratos internos compartidos.

## Accesibilidad

- El objetivo es WCAG 2.2 nivel AA.
- Usa HTML semántico y controles nativos antes que elementos personalizados.
- Toda funcionalidad debe operar con teclado, mantener un orden de foco lógico y mostrar foco visible y no oculto.
- Los objetivos interactivos principales deben medir al menos 44 por 44 píxeles CSS.
- No comuniques estado, calidad o éxito únicamente mediante color, sonido, forma o posición.
- Toda instrucción y retroalimentación hablada debe existir también como texto visible. El usuario debe poder escuchar, detener y repetir el audio.
- No reproduzcas audio, inicies reconocimiento ni avances de ejercicio sin una acción o confirmación clara del usuario.
- Anuncia estados asíncronos y errores mediante regiones de estado apropiadas sin mover el foco de forma sorpresiva.
- Usa lenguaje corto, concreto y respetuoso. Evita presión de tiempo, animaciones innecesarias y controles pequeños.
- Los errores deben identificar el problema y una acción recuperable, sin culpar al usuario.
- Prueba zoom, reflow, contraste, navegación por teclado y lector de pantalla en los flujos modificados.

## Seguridad y privacidad

- No uses datos reales de pacientes. Nombres, sesiones, audios, textos reconocidos y ejercicios de prueba deben ser ficticios.
- No registres audio, PCM, textos reconocidos o manuales, identificadores personales ni documentos de sesión en consola o telemetría.
- El `Blob` de `MediaRecorder` se conserva sólo en memoria durante grabación, reproducción y análisis local. Rimay no lo envía ni lo almacena. Revoca las URL de objeto y libera pistas y buffers al finalizar.
- Antes de iniciar `BrowserSpeechRecognizer`, la interfaz debe informar que algunos navegadores pueden enviar audio a un servicio remoto propio para realizar `SpeechRecognition`. Ese procesamiento pertenece al navegador, no a un proveedor contratado por Rimay.
- El reconocimiento automático es opcional. Debe existir una ruta manual siempre disponible, incluida la ausencia de soporte, red, silencio, permiso o cancelación.
- No presentes texto provisional como final; conserva la procedencia `browser`, `demo` o `manual` en el contrato y en la interfaz.
- `DemoSpeechRecognizer` no recibe ni inspecciona el `Blob` y no puede afirmar que transcribió o analizó la voz.
- No introduzcas secretos, variables privadas, `fetch` a APIs de análisis, almacenamiento remoto, autenticación o RLS en el MVP.
- `localStorage` sólo puede contener el documento versionado de sesiones ficticias y datos derivados permitidos. La eliminación total debe borrar todas las claves de Rimay y limpiar el estado en memoria sin afectar datos de otros sitios.
- Fija versiones de dependencias directas y conserva el lockfile.

## Restricciones médicas y editoriales

- Describe observaciones del intento; no infieras diagnóstico, etiología, pronóstico o severidad.
- No uses etiquetas como “normal”, “anormal”, “leve”, “moderada”, “grave”, “mejoró clínicamente” o equivalentes para clasificar a una persona.
- No recomiendes cambios de tratamiento, medicación, frecuencia terapéutica ni consulta urgente basándote en las métricas.
- No presentes similitud, coincidencias, omisiones, adiciones, palabras por minuto, volumen, pausas o clipping como puntuaciones clínicas.
- Toda retroalimentación debe ser breve, alentadora, no clínica y limitada al intento actual.
- La vista profesional debe separar métricas calculadas, decisiones del motor de reglas, limitaciones y decisión profesional.
- Toda acción adaptativa debe incluir versión de reglas, plantilla, razón y evidencia determinista.

## Fuentes normativas

- Alcance: `docs/hackathon-build/scope.md`
- Requisitos: `docs/hackathon-build/prd.md`
- Arquitectura y contratos: `docs/hackathon-build/spec.md`
- Orden de construcción: `docs/hackathon-build/checklist.md`
- Decisiones y dudas: `docs/hackathon-build/build-notes.md`
