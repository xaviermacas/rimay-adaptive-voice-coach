import type { CoachTemplate } from './types';

export type EditorialRuleId =
  | 'diagnosis'
  | 'severity'
  | 'prognosis'
  | 'clinical_recovery'
  | 'treatment'
  | 'prescription'
  | 'person_classification'
  | 'clinical_judgment'
  | 'clinical_measurement'
  | 'treatment_adherence';

export interface EditorialFinding {
  readonly ruleId: EditorialRuleId;
  readonly field: 'shortFeedback' | 'explanation';
}

interface ProhibitedEditorialPattern {
  readonly ruleId: EditorialRuleId;
  readonly pattern: RegExp;
}

export const PROHIBITED_EDITORIAL_PATTERNS = Object.freeze([
  { ruleId: 'diagnosis', pattern: /\bdiagn[oó]stic/iu },
  {
    ruleId: 'severity',
    pattern: /\b(severidad|sever[oa]|leve|moderad[oa]|grave)\b/iu,
  },
  { ruleId: 'prognosis', pattern: /\bpron[oó]stic/iu },
  {
    ruleId: 'clinical_recovery',
    pattern: /\b(recuperaci[oó]n|mejor[aó]|empeor[aó]|empeoramiento)\b/iu,
  },
  {
    ruleId: 'treatment',
    pattern: /\b(tratamiento|terapia|medicaci[oó]n)\b/iu,
  },
  { ruleId: 'prescription', pattern: /\bprescri/iu },
  {
    ruleId: 'person_classification',
    pattern: /\b(clasificaci[oó]n|normal|anormal|paciente)\b/iu,
  },
  {
    ruleId: 'clinical_judgment',
    pattern: /\b(aprobaci[oó]n|desaprobaci[oó]n|aprobado|desaprobado|correcto|incorrecto)\b/iu,
  },
  {
    ruleId: 'clinical_measurement',
    pattern: /\b(inteligibilidad|puntuaci[oó]n cl[ií]nica)\b/iu,
  },
  {
    ruleId: 'treatment_adherence',
    pattern: /\b(adherencia|cumplimiento terap[eé]utico)\b/iu,
  },
] as const satisfies readonly ProhibitedEditorialPattern[]);

export function inspectCoachTemplateEditorial(
  template: Pick<CoachTemplate, 'shortFeedback' | 'explanation'>,
): readonly EditorialFinding[] {
  const fields = [
    ['shortFeedback', template.shortFeedback],
    ['explanation', template.explanation],
  ] as const;

  return fields.flatMap(([field, value]) =>
    PROHIBITED_EDITORIAL_PATTERNS.filter(({ pattern }) =>
      pattern.test(value),
    ).map(({ ruleId }) => ({ ruleId, field })),
  );
}

export function isCoachTemplateEditoriallySafe(
  template: Pick<CoachTemplate, 'shortFeedback' | 'explanation'>,
): boolean {
  return inspectCoachTemplateEditorial(template).length === 0;
}
