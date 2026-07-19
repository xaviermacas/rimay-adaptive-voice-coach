import { describe, expect, it } from 'vitest';

import {
  PROHIBITED_EDITORIAL_PATTERNS,
  inspectCoachTemplateEditorial,
} from './editorial';
import {
  COACH_EVIDENCE_KEYS_V1,
  COACH_TEMPLATES,
  selectCoachTemplate,
  validateCoachTemplateCatalog,
} from './templates';
import type { CoachRuleId, MetricEvidenceKey } from './types';

describe('catálogo de plantillas coach-templates-v1', () => {
  it('tiene IDs únicos y configuración compatible', () => {
    expect(new Set(COACH_TEMPLATES.map(({ id }) => id)).size).toBe(
      COACH_TEMPLATES.length,
    );
    expect(validateCoachTemplateCatalog()).toEqual([]);
  });

  it('ofrece al menos una plantilla para cada regla', () => {
    const rules = [
      'capture_quality_blocking',
      'complete_fifth_valid_attempt',
      'continue_follow_pause_cues',
      'continue_steady_pace',
      'continue_repeat_calmly',
      'continue_default',
    ] as const satisfies readonly CoachRuleId[];

    for (const ruleId of rules) {
      expect(COACH_TEMPLATES.some((template) => template.ruleId === ruleId)).toBe(
        true,
      );
    }
  });

  it('declara únicamente evidencias válidas para coach-rules-v1', () => {
    const knownKeys = new Set<MetricEvidenceKey>(COACH_EVIDENCE_KEYS_V1);

    for (const template of COACH_TEMPLATES) {
      expect(
        template.allowedEvidenceKeys.every((key) => knownKeys.has(key)),
      ).toBe(true);
    }
  });

  it('declara la evidencia editorial exacta de cada plantilla', () => {
    const expectedEvidence = {
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
    } as const;

    for (const template of COACH_TEMPLATES) {
      expect(template.allowedEvidenceKeys).toEqual(expectedEvidence[template.id]);
    }
  });

  it('reconoce pauseCues y expectedMaxDurationMs como evidencias válidas', () => {
    expect(COACH_EVIDENCE_KEYS_V1).toContain('pauseCues');
    expect(COACH_EVIDENCE_KEYS_V1).toContain('expectedMaxDurationMs');
  });

  it('rechaza evidencias adicionales en una plantilla textual', () => {
    const template = COACH_TEMPLATES.find(
      ({ id }) => id === 'continue-text-browser-v1',
    );
    expect(template).toBeDefined();
    if (template === undefined) {
      throw new Error('Falta la plantilla textual browser.');
    }

    expect(
      validateCoachTemplateCatalog([
        {
          ...template,
          allowedEvidenceKeys: ['textSimilarity', 'currentDifficulty'],
        },
      ]),
    ).toContainEqual({
      code: 'incompatible_evidence_policy',
      templateId: template.id,
    });
  });

  it('rechaza evidencia textual en la plantilla sin texto', () => {
    const template = COACH_TEMPLATES.find(
      ({ id }) => id === 'continue-no-text-v1',
    );
    expect(template).toBeDefined();
    if (template === undefined) {
      throw new Error('Falta la plantilla sin texto.');
    }

    expect(
      validateCoachTemplateCatalog([
        {
          ...template,
          allowedEvidenceKeys: [
            ...template.allowedEvidenceKeys,
            'textSimilarity',
          ],
        },
      ]),
    ).toContainEqual({
      code: 'incompatible_evidence_policy',
      templateId: template.id,
    });
  });

  it.each([
    ['browser', 'texto reconocido'],
    ['manual', 'texto introducido'],
    ['demo', 'texto simulado'],
  ] as const)('usa la frase de procedencia %s', (source, expectedPhrase) => {
    for (const ruleId of [
      'continue_default',
      'continue_repeat_calmly',
    ] as const) {
      const template = selectCoachTemplate(ruleId, source);

      expect(template).not.toBeNull();
      expect(template?.explanation).toContain(expectedPhrase);
    }
  });

  it('no inventa coincidencia ni evidencia textual cuando no hay texto', () => {
    const template = selectCoachTemplate('continue_default', null);

    expect(template).not.toBeNull();
    expect(template?.explanation).not.toMatch(
      /coincidencia|reconocid|introducid|simulad|pronunciación/iu,
    );
    expect(template?.allowedEvidenceKeys).not.toContain('textSimilarity');
  });

  it('no conserva la orden ambigua de continuar y repetir', () => {
    for (const template of COACH_TEMPLATES) {
      expect(`${template.shortFeedback} ${template.explanation}`).not.toMatch(
        /continúa y repite/iu,
      );
    }
  });

  it('respalda en la explicación cada evidencia declarada', () => {
    const evidenceClaims: Readonly<Record<string, RegExp>> = {
      qualityFlags: /métricas acústicas|alertas bloqueantes|captura fue válida/iu,
      silenceRatio: /métricas acústicas|alertas bloqueantes|captura fue válida/iu,
      totalDurationMs: /duración total/iu,
      expectedMaxDurationMs: /tiempo máximo esperado/iu,
      pauseCount: /no se detectaron pausas/iu,
      pauseCues: /incluye pausas indicadas/iu,
      textSimilarity: /coincidencia/iu,
      currentDifficulty: /dificultad actual/iu,
      validAttemptCountBeforeCurrent: /quinto intento válido/iu,
    };

    for (const template of COACH_TEMPLATES) {
      for (const evidenceKey of template.allowedEvidenceKeys) {
        const claim = evidenceClaims[evidenceKey];
        expect(claim, `Falta una afirmación para ${evidenceKey}`).toBeDefined();
        expect(template.explanation).toMatch(claim ?? /$^/u);
      }
    }
  });

  it('selecciona una sola plantilla compatible por regla y procedencia', () => {
    expect(selectCoachTemplate('continue_repeat_calmly', 'browser')?.id).toBe(
      'repeat-text-browser-v1',
    );
    expect(selectCoachTemplate('continue_repeat_calmly', null)).toBeNull();
    expect(selectCoachTemplate('capture_quality_blocking', null)?.id).toBe(
      'capture-clear-v1',
    );
  });

  it('supera el filtro editorial para todas las plantillas', () => {
    expect(PROHIBITED_EDITORIAL_PATTERNS.length).toBeGreaterThan(0);
    for (const template of COACH_TEMPLATES) {
      expect(inspectCoachTemplateEditorial(template)).toEqual([]);
    }
  });

  it('detecta un fixture deliberadamente prohibido', () => {
    const findings = inspectCoachTemplateEditorial({
      shortFeedback: 'Diagnóstico grave y aprobación clínica.',
      explanation:
        'Prescribir tratamiento para el paciente durante su recuperación.',
    });

    expect(findings.map(({ ruleId }) => ruleId)).toEqual([
      'diagnosis',
      'severity',
      'clinical_judgment',
      'clinical_recovery',
      'treatment',
      'prescription',
      'person_classification',
    ]);
  });
});
