# Rimay Adaptive Voice Coach

## Estado y propósito

Rimay es una aplicación web accesible para práctica guiada del habla con datos ficticios, orientada a personas con disartria post-ACV y a profesionales que revisan el resultado de una sesión de demostración.

Rimay es una herramienta de apoyo para práctica y seguimiento. No diagnostica disartria, no clasifica severidad, no prescribe tratamiento y no sustituye el criterio de un profesional.

El repositorio se encuentra en el incremento documental inicial. Hasta que exista autorización expresa para el incremento siguiente, sólo se pueden modificar `AGENTS.md` y archivos bajo `docs/hackathon-build/`. No inicialices Git, React, Vite, Supabase, migraciones, funciones ni integraciones durante esta fase.

## Arquitectura esperada

- Frontend: React, Vite, TypeScript estricto y Tailwind CSS.
- Captura: `MediaRecorder` con negociación de MIME en tiempo de ejecución y límites de 60 segundos o 10 MB.
- Análisis: Web Audio API para decodificar PCM y calcular métricas deterministas y versionadas en el navegador.
- Voz de salida: `SpeechSynthesis` con voz española cuando esté disponible y texto visible equivalente.
- Backend privado: Supabase Edge Functions para transcripción y llamadas a OpenAI. Las claves privadas viven sólo en secretos de Supabase.
- IA: `gpt-4o-transcribe` para transcripción y `gpt-5.6` mediante Responses API con salida estructurada para retroalimentación y resumen.
- Proveedores: implementaciones `demo` y `live` detrás de contratos explícitos. `demo` es el modo predeterminado y no requiere secretos.
- Persistencia del MVP: datos ficticios derivados en el navegador; el audio existe sólo de forma temporal y nunca se persiste.
- Despliegue: Vercel para el frontend y Supabase para Edge Functions.

Consulta `docs/hackathon-build/spec.md` antes de tomar decisiones de arquitectura o de contratos.

## Comandos del proyecto

Estos comandos son el contrato objetivo a partir del incremento de scaffold. Todavía no funcionan porque no existe `package.json`.

```text
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

Cuando se incorpore lint, deberá ejecutarse con `npm run lint`. Los comandos adicionales de Supabase deberán descubrirse con `supabase --help` y documentarse antes de usarlos; no se deben adivinar opciones de la CLI.

## Flujo de trabajo obligatorio

1. Lee este archivo, el documento de alcance, el PRD, la especificación, el checklist y las notas de construcción antes de modificar el proyecto.
2. Trabaja en un solo incremento autorizado. No adelantes archivos, dependencias o comportamiento de incrementos posteriores.
3. Conserva el árbol en un estado verificable. Después de cada cambio ejecuta la comprobación más pequeña que pueda falsarlo.
4. Antes de finalizar, ejecuta como mínimo `npm run typecheck`, `npm test` y `npm run build` cuando esos comandos existan. Para cambios de interfaz, realiza además una comprobación manual del flujo afectado.
5. Revisa el diff completo y confirma que no contiene claves, datos sensibles, audio, transcripciones en logs ni cambios fuera de alcance.
6. Informa con precisión qué se verificó, qué no se pudo verificar y por qué.
7. Detente al cumplir la aceptación del incremento. No avances al siguiente incremento sin autorización expresa del responsable del proyecto.

Durante la fase documental, reemplaza los comandos aún inexistentes por comprobaciones de presencia, enlaces, cobertura y consistencia mediante lectura y búsqueda de texto.

## Convenciones de TypeScript

- Mantén `strict` activado. Habilita también `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes` cuando se cree el `tsconfig`.
- No uses `any`. Para entradas desconocidas, usa `unknown` y valídalas antes de acceder a sus campos.
- Valida todas las fronteras externas con esquemas de ejecución; los tipos estáticos no sustituyen la validación de red, almacenamiento o IA.
- Usa uniones discriminadas para estados asíncronos y de grabación. Evita combinaciones de booleanos que permitan estados imposibles.
- Mantén puras las métricas, la normalización de texto, la validación y la selección adaptativa.
- Incluye unidades en los nombres (`durationMs`, `sizeBytes`) y usa fechas ISO 8601.
- Usa `import type` para importaciones exclusivamente de tipos y evita aserciones de tipo salvo justificación localizada.
- Usa identificadores y nombres de archivo en inglés; todo el contenido visible para el usuario debe estar en español neutro.
- Prefiere módulos pequeños organizados por funcionalidad. No agregues abstracciones o dependencias sin una necesidad demostrable.
- No mezcles tipos de dominio con respuestas crudas de proveedores. Traduce cada frontera a contratos internos compartidos.

## Accesibilidad

- El objetivo es WCAG 2.2 nivel AA.
- Usa HTML semántico y controles nativos antes que elementos personalizados.
- Toda funcionalidad debe operar con teclado, mantener un orden de foco lógico y mostrar foco visible y no oculto.
- Los objetivos interactivos principales deben medir al menos 44 por 44 píxeles CSS.
- No comuniques estado, calidad o éxito únicamente mediante color, sonido, forma o posición.
- Toda instrucción y retroalimentación hablada debe existir también como texto visible. El usuario debe poder escuchar, detener y repetir el audio.
- No reproduzcas audio ni avances de ejercicio sin una acción o confirmación clara del usuario.
- Anuncia estados asíncronos y errores mediante regiones de estado apropiadas sin mover el foco de forma sorpresiva.
- Usa lenguaje corto, concreto y respetuoso. Evita presión de tiempo, animaciones innecesarias y controles pequeños.
- Los errores deben identificar el problema y una acción recuperable, sin culpar al usuario.
- Prueba zoom, reflow, contraste, navegación por teclado y lector de pantalla en los flujos modificados.

## Seguridad y privacidad

- Nunca expongas `OPENAI_API_KEY`, claves secretas de Supabase ni `service_role` en el frontend, variables `VITE_*`, repositorio, pruebas o logs.
- El frontend sólo puede contener valores expresamente publicables. Las llamadas a OpenAI se realizan desde Edge Functions.
- No uses datos reales de pacientes. Nombres, sesiones, audios, transcripciones y ejercicios de prueba deben ser ficticios.
- No registres audio, transcripciones, prompts completos, identificadores personales ni payloads de sesión en consola o telemetría.
- El audio se conserva sólo en memoria durante grabación, reproducción y envío. Revoca las URL de objeto y libera pistas y buffers al finalizar.
- Aplica límites de tamaño, duración, MIME, tiempo de espera y origen antes de enviar datos a proveedores.
- No cambies silenciosamente de `live` a `demo`; el modo y el origen simulado de los datos deben ser visibles.
- Valida respuestas de IA por esquema y reglas de dominio antes de mostrarlas o aplicarlas.
- GPT no calcula métricas, no recibe audio y no puede seleccionar ejercicios fuera de la lista permitida.
- No introduzcas almacenamiento remoto, autenticación o RLS hasta que un incremento los autorice y defina su modelo de acceso.
- Fija versiones de dependencias directas y conserva el lockfile cuando se inicialice el proyecto.

## Restricciones médicas y editoriales

- Describe observaciones de la grabación; no infieras diagnóstico, etiología, pronóstico o severidad.
- No uses etiquetas como “normal”, “anormal”, “leve”, “moderada”, “grave”, “mejoró clínicamente” o equivalentes para clasificar a una persona.
- No recomiendes cambios de tratamiento, medicación, frecuencia terapéutica ni consulta urgente basándote en las métricas.
- No presentes similitud, palabras por minuto, volumen, pausas o clipping como puntuaciones clínicas.
- Toda retroalimentación debe ser breve, alentadora, no clínica y limitada al intento actual.
- La vista profesional debe separar métricas calculadas, observaciones generadas por IA y decisión profesional.
- Si una salida viola estas reglas, descártala y usa el fallback determinista previsto.

## Fuentes normativas

- Alcance: `docs/hackathon-build/scope.md`
- Requisitos: `docs/hackathon-build/prd.md`
- Arquitectura y contratos: `docs/hackathon-build/spec.md`
- Orden de construcción: `docs/hackathon-build/checklist.md`
- Decisiones y dudas: `docs/hackathon-build/build-notes.md`

