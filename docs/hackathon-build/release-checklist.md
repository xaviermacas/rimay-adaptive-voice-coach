# Checklist de versión candidata y entrega

Las casillas marcadas corresponden a evidencia observada en el repositorio o a la validación manual ya confirmada. Las actividades externas de publicación permanecen pendientes.

## Código congelado

La versión candidata se apoya en el incremento 7 cerrado. Cualquier cambio funcional requiere otro alcance y no debe mezclarse con la preparación de entrega.

- [x] Incrementos 1–7 cerrados.
- [x] Incrementos 8–9 diferidos como trabajo futuro.
- [x] Funcionalidad congelada; sin cambios en `src/`.
- [x] `package.json` y lockfile sin modificaciones.
- [x] Cero dependencias nuevas, persistencia, backend, Supabase u OpenAI API.

## Validación automática

Ejecutar la matriz completa sobre el árbol documental final. Registrar cantidades exactas en `build-notes.md` antes del commit.

- [x] `npm.cmd run lint`.
- [x] `npm.cmd run typecheck`.
- [x] `npm.cmd test -- session`: 2 archivos y 15/15 pruebas.
- [x] `npm.cmd test -- practice`: 9 archivos y 51/51 pruebas.
- [x] `npm.cmd test -- coaching`: 4 archivos y 104/104 pruebas.
- [x] `npm.cmd test`: 32 archivos y 339/339 pruebas.
- [x] `npm.cmd run build`: 70 módulos transformados.
- [x] `git diff --check`.

## Validación manual

La validación funcional más reciente ocurrió sobre el incremento 7 en Chrome y Edge. No se deben inventar verificaciones adicionales.

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
