export {
  calculateTargetDifficulty,
  selectFeedbackFocus,
} from './adaptation';
export type { FeedbackFocusInput } from './adaptation';
export {
  COACH_RULES_V1_CONFIG,
  COACH_RULES_VERSION,
  COACH_TEMPLATE_CATALOG_VERSION,
  REQUIRED_EXERCISE_TYPES,
} from './config';
export {
  PROHIBITED_EDITORIAL_PATTERNS,
  inspectCoachTemplateEditorial,
  isCoachTemplateEditoriallySafe,
} from './editorial';
export {
  COACH_EVIDENCE_KEYS_V1,
  COACH_TEMPLATES,
  selectCoachTemplate,
  validateCoachTemplateCatalog,
} from './templates';
export type {
  CoachTemplateCatalogIssue,
  CoachTemplateCatalogIssueCode,
} from './templates';
export type {
  CoachAction,
  CoachDecision,
  CoachError,
  CoachErrorCode,
  CoachInput,
  CoachResult,
  CoachRuleId,
  CoachRulesVersion,
  CoachTemplate,
  CoachTemplateCatalogVersion,
  CoachTemplateId,
  CoachValidationResult,
  FeedbackFocus,
  MetricEvidenceKey,
} from './types';
export { evaluateCoach } from './rules';
export { validateCoachInput } from './validation';
