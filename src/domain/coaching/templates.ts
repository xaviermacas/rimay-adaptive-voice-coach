import type { SpeechTextSource } from '../contracts/speech';
import { COACH_TEMPLATE_CATALOG_VERSION } from './config';
import { inspectCoachTemplateEditorial } from './editorial';
import type {
  CoachAction,
  CoachRuleId,
  CoachTemplate,
  CoachTemplateId,
  FeedbackFocus,
  MetricEvidenceKey,
} from './types';

const ALL_TEXT_SOURCES = Object.freeze([
  'browser',
  'manual',
  'demo',
  null,
] as const satisfies readonly (SpeechTextSource | null)[]);

export const COACH_EVIDENCE_KEYS_V1 = Object.freeze([
  'qualityFlags',
  'silenceRatio',
  'totalDurationMs',
  'pauseCount',
  'pauseCues',
  'expectedMaxDurationMs',
  'textSimilarity',
  'currentDifficulty',
  'validAttemptCountBeforeCurrent',
] as const satisfies readonly MetricEvidenceKey[]);

const RULE_OUTPUTS = Object.freeze({
  capture_quality_blocking: {
    action: 'repeat_current',
    focus: 'clear_capture',
  },
  complete_fifth_valid_attempt: {
    action: 'complete_session',
    focus: 'complete',
  },
  continue_follow_pause_cues: {
    action: 'continue',
    focus: 'follow_pause_cues',
  },
  continue_steady_pace: {
    action: 'continue',
    focus: 'steady_pace',
  },
  continue_repeat_calmly: {
    action: 'continue',
    focus: 'repeat_calmly',
  },
  continue_default: {
    action: 'continue',
    focus: 'continue',
  },
}) satisfies Record<
  CoachRuleId,
  { readonly action: CoachAction; readonly focus: FeedbackFocus }
>;

function defineTemplate(template: Omit<CoachTemplate, 'catalogVersion'>): CoachTemplate {
  return Object.freeze({
    catalogVersion: COACH_TEMPLATE_CATALOG_VERSION,
    ...template,
    allowedEvidenceKeys: Object.freeze([...template.allowedEvidenceKeys]),
    allowedTextSources: Object.freeze([...template.allowedTextSources]),
  });
}

export const COACH_TEMPLATES = Object.freeze([
  defineTemplate({
    id: 'capture-clear-v1',
    ruleId: 'capture_quality_blocking',
    action: 'repeat_current',
    focus: 'clear_capture',
    shortFeedback: 'Repite la actividad con una grabación más clara.',
    explanation:
      'Las métricas acústicas detectaron una captura que no permite aplicar la adaptación textual de forma confiable.',
    allowedEvidenceKeys: ['qualityFlags', 'silenceRatio'],
    allowedTextSources: ALL_TEXT_SOURCES,
  }),
  defineTemplate({
    id: 'session-complete-v1',
    ruleId: 'complete_fifth_valid_attempt',
    action: 'complete_session',
    focus: 'complete',
    shortFeedback: 'Completaste los cinco intentos de esta sesión.',
    explanation:
      'La captura actual no presentó alertas bloqueantes y completa el quinto intento válido de la sesión.',
    allowedEvidenceKeys: [
      'validAttemptCountBeforeCurrent',
      'qualityFlags',
      'silenceRatio',
    ],
    allowedTextSources: ALL_TEXT_SOURCES,
  }),
  defineTemplate({
    id: 'pause-cues-v1',
    ruleId: 'continue_follow_pause_cues',
    action: 'continue',
    focus: 'follow_pause_cues',
    shortFeedback: 'En la siguiente actividad, sigue las pausas indicadas.',
    explanation:
      'La actividad actual incluye pausas indicadas y no se detectaron pausas durante este intento.',
    allowedEvidenceKeys: ['pauseCount', 'pauseCues'],
    allowedTextSources: ALL_TEXT_SOURCES,
  }),
  defineTemplate({
    id: 'steady-pace-v1',
    ruleId: 'continue_steady_pace',
    action: 'continue',
    focus: 'steady_pace',
    shortFeedback: 'Mantén un ritmo estable en la siguiente actividad.',
    explanation:
      'La duración total del intento superó el tiempo máximo esperado para esta actividad.',
    allowedEvidenceKeys: ['totalDurationMs', 'expectedMaxDurationMs'],
    allowedTextSources: ALL_TEXT_SOURCES,
  }),
  defineTemplate({
    id: 'repeat-text-browser-v1',
    ruleId: 'continue_repeat_calmly',
    action: 'continue',
    focus: 'repeat_calmly',
    shortFeedback: 'En la siguiente actividad, pronuncia el texto con calma.',
    explanation:
      'El texto reconocido mostró baja coincidencia con la frase objetivo; el siguiente ejercicio mantiene el foco en pronunciar con calma.',
    allowedEvidenceKeys: ['textSimilarity'],
    allowedTextSources: ['browser'],
  }),
  defineTemplate({
    id: 'repeat-text-manual-v1',
    ruleId: 'continue_repeat_calmly',
    action: 'continue',
    focus: 'repeat_calmly',
    shortFeedback: 'En la siguiente actividad, pronuncia el texto con calma.',
    explanation:
      'El texto introducido mostró baja coincidencia con la frase objetivo; el siguiente ejercicio mantiene el foco en pronunciar con calma.',
    allowedEvidenceKeys: ['textSimilarity'],
    allowedTextSources: ['manual'],
  }),
  defineTemplate({
    id: 'repeat-text-demo-v1',
    ruleId: 'continue_repeat_calmly',
    action: 'continue',
    focus: 'repeat_calmly',
    shortFeedback: 'En la siguiente actividad, pronuncia el texto con calma.',
    explanation:
      'El texto simulado mostró baja coincidencia con la frase objetivo; el siguiente ejercicio mantiene el foco en pronunciar con calma.',
    allowedEvidenceKeys: ['textSimilarity'],
    allowedTextSources: ['demo'],
  }),
  defineTemplate({
    id: 'continue-text-browser-v1',
    ruleId: 'continue_default',
    action: 'continue',
    focus: 'continue',
    shortFeedback: 'Buen intento. Continúa con la siguiente actividad.',
    explanation:
      'El texto reconocido mostró coincidencia suficiente para continuar.',
    allowedEvidenceKeys: ['textSimilarity'],
    allowedTextSources: ['browser'],
  }),
  defineTemplate({
    id: 'continue-text-manual-v1',
    ruleId: 'continue_default',
    action: 'continue',
    focus: 'continue',
    shortFeedback: 'Buen intento. Continúa con la siguiente actividad.',
    explanation:
      'El texto introducido mostró coincidencia suficiente para continuar.',
    allowedEvidenceKeys: ['textSimilarity'],
    allowedTextSources: ['manual'],
  }),
  defineTemplate({
    id: 'continue-text-demo-v1',
    ruleId: 'continue_default',
    action: 'continue',
    focus: 'continue',
    shortFeedback: 'Buen intento. Continúa con la siguiente actividad.',
    explanation:
      'El texto simulado mostró coincidencia suficiente para continuar.',
    allowedEvidenceKeys: ['textSimilarity'],
    allowedTextSources: ['demo'],
  }),
  defineTemplate({
    id: 'continue-no-text-v1',
    ruleId: 'continue_default',
    action: 'continue',
    focus: 'continue',
    shortFeedback: 'Buen intento. Continúa con la siguiente actividad.',
    explanation:
      'No hubo métricas textuales disponibles; la captura fue válida y se mantuvo la dificultad actual.',
    allowedEvidenceKeys: [
      'qualityFlags',
      'silenceRatio',
      'currentDifficulty',
    ],
    allowedTextSources: [null],
  }),
] as const satisfies readonly CoachTemplate[]);

const EXPECTED_EVIDENCE_KEYS_BY_TEMPLATE = Object.freeze({
  'capture-clear-v1': ['qualityFlags', 'silenceRatio'],
  'session-complete-v1': [
    'validAttemptCountBeforeCurrent',
    'qualityFlags',
    'silenceRatio',
  ],
  'pause-cues-v1': ['pauseCount', 'pauseCues'],
  'steady-pace-v1': ['totalDurationMs', 'expectedMaxDurationMs'],
  'repeat-text-browser-v1': ['textSimilarity'],
  'repeat-text-manual-v1': ['textSimilarity'],
  'repeat-text-demo-v1': ['textSimilarity'],
  'continue-text-browser-v1': ['textSimilarity'],
  'continue-text-manual-v1': ['textSimilarity'],
  'continue-text-demo-v1': ['textSimilarity'],
  'continue-no-text-v1': [
    'qualityFlags',
    'silenceRatio',
    'currentDifficulty',
  ],
} satisfies Record<CoachTemplateId, readonly MetricEvidenceKey[]>);

function followsEvidencePolicy(template: CoachTemplate): boolean {
  const expectedEvidenceKeys = EXPECTED_EVIDENCE_KEYS_BY_TEMPLATE[template.id];

  return (
    template.allowedEvidenceKeys.length === expectedEvidenceKeys.length &&
    template.allowedEvidenceKeys.every(
      (evidenceKey, index) => evidenceKey === expectedEvidenceKeys[index],
    )
  );
}

export type CoachTemplateCatalogIssueCode =
  | 'duplicate_template_id'
  | 'incompatible_rule_output'
  | 'unknown_evidence_key'
  | 'incompatible_evidence_policy'
  | 'duplicate_text_source'
  | 'empty_text_sources'
  | 'editorial_violation';

export interface CoachTemplateCatalogIssue {
  readonly code: CoachTemplateCatalogIssueCode;
  readonly templateId: CoachTemplateId;
}

export function validateCoachTemplateCatalog(
  templates: readonly CoachTemplate[] = COACH_TEMPLATES,
): readonly CoachTemplateCatalogIssue[] {
  const issues: CoachTemplateCatalogIssue[] = [];
  const seenIds = new Set<CoachTemplateId>();
  const knownEvidenceKeys = new Set<MetricEvidenceKey>(COACH_EVIDENCE_KEYS_V1);

  for (const template of templates) {
    if (seenIds.has(template.id)) {
      issues.push({ code: 'duplicate_template_id', templateId: template.id });
    }
    seenIds.add(template.id);

    const expectedOutput = RULE_OUTPUTS[template.ruleId];
    if (
      template.action !== expectedOutput.action ||
      template.focus !== expectedOutput.focus
    ) {
      issues.push({ code: 'incompatible_rule_output', templateId: template.id });
    }

    if (
      template.allowedEvidenceKeys.some(
        (evidenceKey) => !knownEvidenceKeys.has(evidenceKey),
      )
    ) {
      issues.push({ code: 'unknown_evidence_key', templateId: template.id });
    }
    if (!followsEvidencePolicy(template)) {
      issues.push({
        code: 'incompatible_evidence_policy',
        templateId: template.id,
      });
    }

    if (template.allowedTextSources.length === 0) {
      issues.push({ code: 'empty_text_sources', templateId: template.id });
    }
    if (
      new Set<SpeechTextSource | null>(template.allowedTextSources).size !==
      template.allowedTextSources.length
    ) {
      issues.push({ code: 'duplicate_text_source', templateId: template.id });
    }

    if (inspectCoachTemplateEditorial(template).length > 0) {
      issues.push({ code: 'editorial_violation', templateId: template.id });
    }
  }

  return issues;
}

export function selectCoachTemplate(
  ruleId: CoachRuleId,
  textSource: SpeechTextSource | null,
): CoachTemplate | null {
  const matches = COACH_TEMPLATES.filter(
    (template) =>
      template.ruleId === ruleId &&
      template.allowedTextSources.includes(textSource),
  );

  return matches.length === 1 ? (matches[0] ?? null) : null;
}
