import type {
  Difficulty,
  Exercise,
  ExerciseType,
} from '../contracts/domain';

const EXERCISE_TYPES = Object.freeze([
  'word_repetition',
  'phrase_repetition',
  'guided_reading',
] as const satisfies readonly ExerciseType[]);

const TYPE_ORDER = Object.freeze({
  word_repetition: 0,
  phrase_repetition: 1,
  guided_reading: 2,
}) satisfies Readonly<Record<ExerciseType, number>>;

const EXPECTED_DIFFICULTY = Object.freeze({
  word_repetition: 1,
  phrase_repetition: 2,
  guided_reading: 3,
}) satisfies Readonly<Record<ExerciseType, Difficulty>>;

export type ExerciseEditorialRuleId =
  | 'diagnosis'
  | 'severity'
  | 'prognosis'
  | 'recovery_or_deterioration'
  | 'treatment'
  | 'prescription'
  | 'clinical_classification'
  | 'therapy_replacement'
  | 'intelligibility_evaluation'
  | 'clinical_approval';

export type ExerciseCatalogIssueCode =
  | 'catalog_not_array'
  | 'catalog_size'
  | 'invalid_exercise'
  | 'invalid_id'
  | 'duplicate_id'
  | 'invalid_type'
  | 'missing_exercise_type'
  | 'duplicate_exercise_type'
  | 'invalid_difficulty'
  | 'empty_instruction'
  | 'empty_target_text'
  | 'text_not_nfc'
  | 'invalid_duration'
  | 'invalid_pause_cues'
  | 'pause_cue_order'
  | 'pause_cue_range'
  | 'pause_cue_surrogate_split'
  | 'pause_cue_not_after_punctuation'
  | 'unexpected_pause_cues'
  | 'missing_pause_cue'
  | 'prohibited_editorial_content'
  | 'catalog_order'
  | 'invalid_sequence'
  | 'duplicate_sequence_id'
  | 'unknown_sequence_id'
  | 'sequence_order';

export type ExerciseCatalogField =
  | keyof Exercise
  | 'catalog'
  | 'initialSequence';

export interface ExerciseCatalogIssue {
  readonly code: ExerciseCatalogIssueCode;
  readonly message: string;
  readonly exerciseId?: string;
  readonly field?: ExerciseCatalogField;
  readonly editorialRuleId?: ExerciseEditorialRuleId;
}

export type ExerciseCatalogValidationResult =
  | {
      readonly ok: true;
      readonly catalog: readonly Exercise[];
      readonly initialSequence: readonly string[];
    }
  | { readonly ok: false; readonly issues: readonly ExerciseCatalogIssue[] };

interface ProhibitedExercisePattern {
  readonly ruleId: ExerciseEditorialRuleId;
  readonly pattern: RegExp;
}

const PROHIBITED_EXERCISE_PATTERNS = Object.freeze([
  { ruleId: 'diagnosis', pattern: /\bdiagn[oó]stic/iu },
  {
    ruleId: 'severity',
    pattern: /\b(severidad|leve|moderad[oa]|grave)\b/iu,
  },
  { ruleId: 'prognosis', pattern: /\bpron[oó]stic/iu },
  {
    ruleId: 'recovery_or_deterioration',
    pattern:
      /\b(recuperaci[oó]n|recuperad[oa]|deterioro|empeoramiento|mejor[ií]a cl[ií]nica)\b/iu,
  },
  {
    ruleId: 'treatment',
    pattern: /\b(tratamiento|terapia|medicaci[oó]n)\b/iu,
  },
  {
    ruleId: 'prescription',
    pattern: /\b(prescripci[oó]n|prescribir|recetar)\b/iu,
  },
  {
    ruleId: 'clinical_classification',
    pattern: /\b(clasificaci[oó]n cl[ií]nica|normal|anormal)\b/iu,
  },
  {
    ruleId: 'therapy_replacement',
    pattern: /\b(reemplaza|sustituye).{0,30}\b(terapia|profesional)\b/iu,
  },
  {
    ruleId: 'intelligibility_evaluation',
    pattern: /\b(evaluaci[oó]n de inteligibilidad|inteligibilidad)\b/iu,
  },
  {
    ruleId: 'clinical_approval',
    pattern:
      /\b(aprobaci[oó]n cl[ií]nica|aprobado cl[ií]nicamente|validado cl[ií]nicamente)\b/iu,
  },
] as const satisfies readonly ProhibitedExercisePattern[]);

function compareOrdinal(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

export function compareExercisesCanonical(
  left: Exercise,
  right: Exercise,
): number {
  const typeOrder = TYPE_ORDER[left.type] - TYPE_ORDER[right.type];
  if (typeOrder !== 0) {
    return typeOrder;
  }
  const difficultyOrder = left.difficulty - right.difficulty;
  return difficultyOrder !== 0
    ? difficultyOrder
    : compareOrdinal(left.id, right.id);
}

export function orderExerciseCatalog(
  catalog: readonly Exercise[],
): readonly Exercise[] {
  return [...catalog].sort(compareExercisesCanonical);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isExerciseType(value: unknown): value is ExerciseType {
  return EXERCISE_TYPES.some((type) => type === value);
}

function isDifficulty(value: unknown): value is Difficulty {
  return value === 1 || value === 2 || value === 3;
}

function issue(
  code: ExerciseCatalogIssueCode,
  message: string,
  context: {
    readonly exerciseId?: string;
    readonly field?: ExerciseCatalogField;
    readonly editorialRuleId?: ExerciseEditorialRuleId;
  } = {},
): ExerciseCatalogIssue {
  return {
    code,
    message,
    ...(context.exerciseId === undefined
      ? {}
      : { exerciseId: context.exerciseId }),
    ...(context.field === undefined ? {} : { field: context.field }),
    ...(context.editorialRuleId === undefined
      ? {}
      : { editorialRuleId: context.editorialRuleId }),
  };
}

export function inspectExerciseEditorialText(
  text: string,
): readonly ExerciseEditorialRuleId[] {
  return PROHIBITED_EXERCISE_PATTERNS.filter(({ pattern }) =>
    pattern.test(text),
  ).map(({ ruleId }) => ruleId);
}

function cueSplitsSurrogatePair(text: string, cue: number): boolean {
  const previous = text.charCodeAt(cue - 1);
  const next = text.charCodeAt(cue);
  return (
    previous >= 0xd800 &&
    previous <= 0xdbff &&
    next >= 0xdc00 &&
    next <= 0xdfff
  );
}

function cueFollowsPunctuation(text: string, cue: number): boolean {
  return /[,.!?;:]/u.test(text.slice(cue - 1, cue));
}

function parseExercise(
  value: unknown,
  index: number,
  issues: ExerciseCatalogIssue[],
): Exercise | null {
  if (!isRecord(value)) {
    issues.push(
      issue('invalid_exercise', `El ejercicio ${index + 1} no es un objeto.`),
    );
    return null;
  }

  const rawId = value['id'];
  const exerciseId = typeof rawId === 'string' ? rawId : undefined;
  const context = exerciseId === undefined ? {} : { exerciseId };
  let structurallyValid = true;

  if (typeof rawId !== 'string' || rawId.trim() === '') {
    structurallyValid = false;
    issues.push(
      issue('invalid_id', 'El ID debe ser una cadena no vacía.', {
        ...context,
        field: 'id',
      }),
    );
  }

  const rawType = value['type'];
  if (!isExerciseType(rawType)) {
    structurallyValid = false;
    issues.push(
      issue('invalid_type', 'El tipo de ejercicio no es válido.', {
        ...context,
        field: 'type',
      }),
    );
  }

  const rawDifficulty = value['difficulty'];
  if (!isDifficulty(rawDifficulty)) {
    structurallyValid = false;
    issues.push(
      issue('invalid_difficulty', 'La dificultad debe estar entre 1 y 3.', {
        ...context,
        field: 'difficulty',
      }),
    );
  }

  const rawInstruction = value['instruction'];
  if (typeof rawInstruction !== 'string' || rawInstruction.trim() === '') {
    structurallyValid = false;
    issues.push(
      issue('empty_instruction', 'La instrucción debe ser una cadena no vacía.', {
        ...context,
        field: 'instruction',
      }),
    );
  }

  const rawTargetText = value['targetText'];
  if (typeof rawTargetText !== 'string' || rawTargetText.trim() === '') {
    structurallyValid = false;
    issues.push(
      issue('empty_target_text', 'El texto objetivo debe ser no vacío.', {
        ...context,
        field: 'targetText',
      }),
    );
  }

  const rawDuration = value['expectedMaxDurationMs'];
  if (
    typeof rawDuration !== 'number' ||
    !Number.isFinite(rawDuration) ||
    !Number.isInteger(rawDuration) ||
    rawDuration <= 0 ||
    rawDuration > 60_000
  ) {
    structurallyValid = false;
    issues.push(
      issue(
        'invalid_duration',
        'La duración debe ser un entero positivo menor o igual a 60 000 ms.',
        { ...context, field: 'expectedMaxDurationMs' },
      ),
    );
  }

  const rawPauseCues = value['pauseCues'];
  const pauseCuesAreIntegers =
    Array.isArray(rawPauseCues) &&
    rawPauseCues.every(
      (cue) => typeof cue === 'number' && Number.isInteger(cue),
    );
  if (!pauseCuesAreIntegers) {
    structurallyValid = false;
    issues.push(
      issue(
        'invalid_pause_cues',
        'Las pausas deben ser un array de enteros UTF-16.',
        { ...context, field: 'pauseCues' },
      ),
    );
  }

  if (typeof rawInstruction === 'string') {
    if (rawInstruction.normalize('NFC') !== rawInstruction) {
      issues.push(
        issue('text_not_nfc', 'La instrucción debe estar normalizada en NFC.', {
          ...context,
          field: 'instruction',
        }),
      );
    }
    for (const ruleId of inspectExerciseEditorialText(rawInstruction)) {
      issues.push(
        issue(
          'prohibited_editorial_content',
          'La instrucción contiene lenguaje editorial no permitido.',
          { ...context, field: 'instruction', editorialRuleId: ruleId },
        ),
      );
    }
  }

  if (typeof rawTargetText === 'string') {
    if (rawTargetText.normalize('NFC') !== rawTargetText) {
      issues.push(
        issue(
          'text_not_nfc',
          'El texto objetivo debe estar normalizado en NFC.',
          { ...context, field: 'targetText' },
        ),
      );
    }
    for (const ruleId of inspectExerciseEditorialText(rawTargetText)) {
      issues.push(
        issue(
          'prohibited_editorial_content',
          'El texto objetivo contiene lenguaje editorial no permitido.',
          { ...context, field: 'targetText', editorialRuleId: ruleId },
        ),
      );
    }
  }

  if (!structurallyValid) {
    return null;
  }

  const id = rawId as string;
  const type = rawType as ExerciseType;
  const difficulty = rawDifficulty as Difficulty;
  const instruction = rawInstruction as string;
  const targetText = rawTargetText as string;
  const expectedMaxDurationMs = rawDuration as number;
  const pauseCues = [...(rawPauseCues as readonly number[])];

  if (difficulty !== EXPECTED_DIFFICULTY[type]) {
    issues.push(
      issue(
        'invalid_difficulty',
        'La dificultad no coincide con la asignación canónica del tipo.',
        { exerciseId: id, field: 'difficulty' },
      ),
    );
  }

  for (let cueIndex = 0; cueIndex < pauseCues.length; cueIndex += 1) {
    const cue = pauseCues[cueIndex];
    if (cue === undefined) {
      continue;
    }
    const previousCue = pauseCues[cueIndex - 1];
    if (previousCue !== undefined && cue <= previousCue) {
      issues.push(
        issue(
          'pause_cue_order',
          'Las pausas deben ser únicas y estrictamente crecientes.',
          { exerciseId: id, field: 'pauseCues' },
        ),
      );
    }
    if (cue <= 0 || cue >= targetText.length) {
      issues.push(
        issue('pause_cue_range', 'La pausa está fuera del texto objetivo.', {
          exerciseId: id,
          field: 'pauseCues',
        }),
      );
      continue;
    }
    if (cueSplitsSurrogatePair(targetText, cue)) {
      issues.push(
        issue(
          'pause_cue_surrogate_split',
          'La pausa no puede dividir un par sustituto UTF-16.',
          { exerciseId: id, field: 'pauseCues' },
        ),
      );
    }
    if (!cueFollowsPunctuation(targetText, cue)) {
      issues.push(
        issue(
          'pause_cue_not_after_punctuation',
          'La pausa debe aparecer inmediatamente después de puntuación.',
          { exerciseId: id, field: 'pauseCues' },
        ),
      );
    }
  }

  if (type === 'guided_reading' && pauseCues.length === 0) {
    issues.push(
      issue('missing_pause_cue', 'La lectura guiada necesita una pausa.', {
        exerciseId: id,
        field: 'pauseCues',
      }),
    );
  }
  if (type !== 'guided_reading' && pauseCues.length > 0) {
    issues.push(
      issue(
        'unexpected_pause_cues',
        'Palabra y frase no pueden contener marcas de pausa.',
        { exerciseId: id, field: 'pauseCues' },
      ),
    );
  }

  return {
    id,
    type,
    difficulty,
    instruction,
    targetText,
    pauseCues,
    expectedMaxDurationMs,
  };
}

function freezeExercise(exercise: Exercise): Exercise {
  return Object.freeze({
    ...exercise,
    pauseCues: Object.freeze([...exercise.pauseCues]),
  });
}

export function validateExerciseCatalog(
  input: unknown,
  initialSequenceInput: unknown,
): ExerciseCatalogValidationResult {
  if (!Array.isArray(input)) {
    return {
      ok: false,
      issues: Object.freeze([
        issue('catalog_not_array', 'El catálogo debe ser un array.', {
          field: 'catalog',
        }),
      ]),
    };
  }

  const issues: ExerciseCatalogIssue[] = [];
  if (input.length !== 3) {
    issues.push(
      issue('catalog_size', 'El catálogo debe contener exactamente tres entradas.', {
        field: 'catalog',
      }),
    );
  }

  const catalog = input.flatMap((value, index) => {
    const exercise = parseExercise(value, index, issues);
    return exercise === null ? [] : [exercise];
  });

  const ids = new Set<string>();
  const typeCounts = new Map<ExerciseType, number>();
  for (const exercise of catalog) {
    if (ids.has(exercise.id)) {
      issues.push(
        issue('duplicate_id', 'Los IDs del catálogo deben ser únicos.', {
          exerciseId: exercise.id,
          field: 'id',
        }),
      );
    }
    ids.add(exercise.id);
    typeCounts.set(exercise.type, (typeCounts.get(exercise.type) ?? 0) + 1);
  }

  for (const type of EXERCISE_TYPES) {
    const count = typeCounts.get(type) ?? 0;
    if (count === 0) {
      issues.push(
        issue(
          'missing_exercise_type',
          `Falta el tipo obligatorio ${type}.`,
          { field: 'type' },
        ),
      );
    } else if (count > 1) {
      issues.push(
        issue(
          'duplicate_exercise_type',
          `El tipo ${type} aparece más de una vez.`,
          { field: 'type' },
        ),
      );
    }
  }

  const orderedCatalog = orderExerciseCatalog(catalog);
  if (
    catalog.length > 1 &&
    catalog.some((exercise, index) => orderedCatalog[index]?.id !== exercise.id)
  ) {
    issues.push(
      issue('catalog_order', 'El catálogo no sigue el orden canónico.', {
        field: 'catalog',
      }),
    );
  }

  let initialSequence: readonly string[] | null = null;
  if (
    !Array.isArray(initialSequenceInput) ||
    initialSequenceInput.length !== 3 ||
    !initialSequenceInput.every((id) => typeof id === 'string')
  ) {
    issues.push(
      issue('invalid_sequence', 'La secuencia debe contener tres IDs.', {
        field: 'initialSequence',
      }),
    );
  } else {
    initialSequence = [...initialSequenceInput];
    const sequenceIds = new Set(initialSequence);
    if (sequenceIds.size !== initialSequence.length) {
      issues.push(
        issue(
          'duplicate_sequence_id',
          'La secuencia no puede repetir IDs.',
          { field: 'initialSequence' },
        ),
      );
    }
    if (initialSequence.some((id) => !ids.has(id))) {
      issues.push(
        issue(
          'unknown_sequence_id',
          'La secuencia contiene un ID que no pertenece al catálogo.',
          { field: 'initialSequence' },
        ),
      );
    }
    const expectedSequence = orderedCatalog.map(({ id }) => id);
    if (
      initialSequence.some((id, index) => expectedSequence[index] !== id)
    ) {
      issues.push(
        issue(
          'sequence_order',
          'La secuencia debe seguir palabra, frase y lectura guiada.',
          { field: 'initialSequence' },
        ),
      );
    }
  }

  if (issues.length > 0 || initialSequence === null) {
    return { ok: false, issues: Object.freeze([...issues]) };
  }

  return {
    ok: true,
    catalog: Object.freeze(catalog.map(freezeExercise)),
    initialSequence: Object.freeze([...initialSequence]),
  };
}
