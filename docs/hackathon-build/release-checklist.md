# Checklist de versión candidata y entrega

Las casillas marcadas corresponden a evidencia observada en el repositorio o a validación manual histórica. El audio ya fue validado sobre `113754e`, pero la voz conservó una carrera entre snapshot y suscripción; la versión no vuelve a considerarse validada hasta desplegar esta corrección final y repetir Chrome y Edge.

## Código congelado

La versión candidata se apoya en el incremento 7 cerrado. Cualquier cambio funcional requiere otro alcance y no debe mezclarse con la preparación de entrega.

- [x] Incrementos 1–7 cerrados.
- [x] Incrementos 8–9 diferidos como trabajo futuro.
- [x] Únicos cambios en `src/`: hotfix mínimo y autorizado de dos P1; sin incrementos 8–9.
- [x] `package.json` y lockfile sin modificaciones.
- [x] Cero dependencias nuevas, persistencia, backend, Supabase u OpenAI API.

## Validación automática

Ejecutar la matriz completa sobre el árbol documental final. Registrar cantidades exactas en `build-notes.md` antes del commit.

- [x] `npm.cmd run lint`.
- [x] `npm.cmd run typecheck`.
- [x] `npm.cmd test -- session`: 2 archivos y 15/15 pruebas.
- [x] `npm.cmd test -- practice`: 9 archivos y 51/51 pruebas.
- [x] `npm.cmd test -- coaching`: 4 archivos y 104/104 pruebas.
- [x] `npm.cmd test -- speech-output`: 4 archivos y 37/37 pruebas.
- [x] `npm.cmd test -- useAudioRecorder AudioRecorderCard`: 3 archivos y 41/41 pruebas.
- [x] `npm.cmd test -- audio-analysis`: 1 archivo y 6/6 pruebas.
- [x] `npm.cmd test`: 33 archivos y 361/361 pruebas.
- [x] `npm.cmd run build`: 70 módulos transformados.
- [x] `git diff --check`.

## Validación manual

La validación funcional anterior ocurrió sobre el incremento 7 en Chrome y Edge, pero después se reprodujeron dos P1. Sus resultados no validan el nuevo hotfix; no se deben inventar verificaciones adicionales.

### Revalidación obligatoria del hotfix P1

- [x] Regresión automática: voz disponible aunque aparezca después del antiguo límite de 2,1 s y sin un nuevo `voiceschanged`.
- [x] Regresión automática: snapshot de voz sincronizado si cambia entre el primer render y la suscripción React.
- [x] Regresión automática: último chunk incluido y Blob creado sólo tras el evento `stop`.
- [x] Regresión automática: reanálisis usa el mismo Blob; capturas tardías o nuevas permanecen aisladas.
- [x] Regresión automática: MP4/AAC se prioriza cuando está disponible y WebM permanece como fallback.
- [ ] Commit de sincronización React enviado a `main` y deployment de Vercel asociado al nuevo SHA.
- [ ] Chrome: “Escuchar instrucción” se habilita en el primer recorrido sin remontar la vista.
- [ ] Edge: “Escuchar instrucción” se habilita en el primer recorrido sin remontar la vista.
- [ ] Chrome: grabación de 3–4 s muestra duración reproducible, análisis válido y reanálisis válido.
- [ ] Edge: grabación de 3–4 s muestra duración reproducible, análisis válido y reanálisis válido.
- [ ] Console sin errores y Network/Storage sin audio, texto, métricas o persistencia propia durante ambos recorridos.
- [ ] Micrófono liberado al finalizar, descartar, reemplazar y salir del intento.
- [ ] Dictamen de producción actualizado; no grabar video mientras alguna comprobación anterior falle.

- [x] Sesión de cinco intentos completada mediante demo en Chrome y Edge.
- [x] Sesión completada mediante entrada manual en Chrome y Edge.
- [x] Captura bloqueante, repetición, continuación y quinto intento revisados.
- [x] Consola sin errores durante el recorrido principal validado.
- [x] Network y Storage inspeccionados durante la validación manual.
- [ ] Resultado utilizable de `SpeechRecognition` confirmado en la versión candidata.
- [ ] Validación manual con lector de pantalla.
- [ ] Ensayo final del guion cronometrado con el build publicado.

## Privacidad

La revisión debe distinguir lo que controla Rimay de las capacidades administradas por el navegador.

- [x] Audio real limitado al intento actual y nunca persistido.
- [x] Sin `fetch`, telemetría o almacenamiento web en el runtime.
- [x] Entrada manual rotulada como declaración no verificada contra el audio.
- [x] Demo rotulada como fixture que no analizó la voz.
- [x] Aviso visible sobre posible procesamiento remoto de `SpeechRecognition`.
- [x] Documentación evita prometer que toda voz sintetizada es local u offline.
- [ ] Repetir la inspección de Network y Storage en la URL pública.

## Accesibilidad

El objetivo es conservar un recorrido operable y comprensible sin afirmar certificación completa.

- [x] Instrucciones y feedback hablados tienen texto equivalente.
- [x] Controles explícitos; sin autoplay ni avance automático.
- [x] Teclado, foco visible, zoom 200 % y reflow revisados en Chrome y Edge.
- [x] Pausas mostradas mediante texto.
- [ ] Validación manual con lector de pantalla.
- [ ] Revisión final de contraste y reflow en la URL pública.

## GitHub

Crear un repositorio vacío y público sólo después de cerrar el commit local. No añadir una licencia sin decisión del responsable.

- [ ] Repositorio público creado.
- [ ] Remoto `origin` configurado.
- [ ] Rama `main` enviada.
- [ ] README visible correctamente en GitHub.
- [ ] Repository URL copiada en los materiales de entrega.

## Vercel

Importar el repositorio con preset Vite, build `npm run build`, salida `dist` y ninguna variable de entorno. El proyecto debe permanecer en Hobby y sin recursos cobrables.

- [ ] Proyecto importado en Vercel.
- [ ] Plan Hobby confirmado para uso personal o no comercial.
- [ ] Cero Functions, Storage, add-ons, analytics pagos o dominio comprado.
- [ ] Build de producción completado.
- [ ] URL pública validada.
- [ ] Demo y ruta manual probadas en producción.

## Video

La toma debe usar la demo determinista y durar aproximadamente entre 2:30 y 3:00.

- [ ] Guion ensayado y cronometrado.
- [ ] Volumen y voz comprobados.
- [ ] Video grabado sin información personal visible.
- [ ] Video revisado de principio a fin.
- [ ] Video URL copiada en Devpost.

## Capturas

Las imágenes deben mostrar el propósito, el flujo y el resultado técnico sin exponer consola, rutas locales o datos personales.

- [ ] Captura de inicio y aviso no clínico.
- [ ] Captura de ejercicio y modos.
- [ ] Captura de feedback, evidencia y métricas.
- [ ] Captura de sesión completada.
- [ ] Texto alternativo preparado para cada imagen.

## Devpost

Usar `submission.md` como borrador y revisar el texto final en el formulario real.

- [ ] Project name y tagline cargados.
- [ ] Descripción y arquitectura revisadas.
- [ ] Tecnologías declaradas sin servicios inexistentes.
- [ ] Limitaciones visibles y trabajo futuro correctamente separado.
- [ ] Demo URL añadida.
- [ ] Repository URL añadida.
- [ ] Video URL añadida.
- [ ] Entrega previsualizada en Devpost.

## Codex `/feedback`

La llamada queda deliberadamente pendiente hasta que el commit y la presentación estén cerrados.

- [ ] Ejecutar `/feedback` en la sesión principal.
- [ ] Copiar el Session ID exacto.
- [ ] Añadirlo a `submission.md` y Devpost.

## Revisión final de enlaces

- [ ] Abrir Demo URL en una ventana privada.
- [ ] Abrir Repository URL sin autenticación.
- [ ] Abrir Video URL sin permisos especiales.
- [ ] Confirmar que no quedan `[PENDING]` en la entrega enviada.

## Envío

- [ ] Revisar fecha y hora límite en la zona horaria del evento.
- [ ] Realizar el envío final antes del plazo.
- [ ] Conservar una captura de confirmación.
