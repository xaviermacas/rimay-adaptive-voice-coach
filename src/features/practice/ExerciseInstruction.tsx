import type { Exercise } from '../../domain/contracts';
import type { SpeechOutputController } from '../speech-output';
import { SpeechControls } from '../speech-output';
import { GuidedReadingText } from './GuidedReadingText';

interface ExerciseInstructionProps {
  readonly exercise: Exercise;
  readonly position: number;
  readonly speech: SpeechOutputController;
  readonly total: number;
}

const EXERCISE_TYPE_LABELS = {
  word_repetition: 'Repetición de palabra',
  phrase_repetition: 'Repetición de frase',
  guided_reading: 'Lectura guiada',
} as const;

export function ExerciseInstruction({
  exercise,
  position,
  speech,
  total,
}: ExerciseInstructionProps) {
  return (
    <section aria-labelledby={`exercise-instruction-${exercise.id}`}>
      <p className="text-sm font-bold text-rimay-700">
        Ejercicio {position} de {total}
      </p>
      <h3
        className="mt-2 text-xl font-bold text-slate-950"
        id={`exercise-instruction-${exercise.id}`}
      >
        {EXERCISE_TYPE_LABELS[exercise.type]}
      </h3>
      <p className="mt-1 text-sm font-semibold text-slate-600">
        Dificultad: nivel {exercise.difficulty}
      </p>
      <p className="mt-4 text-lg font-semibold leading-7 text-slate-950">
        {exercise.instruction}
      </p>

      <div className="mt-3">
        {exercise.type === 'guided_reading' ? (
          <GuidedReadingText
            pauseCues={exercise.pauseCues}
            targetText={exercise.targetText}
          />
        ) : (
          <p className="rounded-2xl border border-rimay-100 bg-rimay-50 px-5 py-4 text-3xl font-bold text-rimay-900">
            {exercise.targetText}
          </p>
        )}
      </div>

      <SpeechControls
        controller={speech}
        kind="instruction"
        text={exercise.instruction}
      />
    </section>
  );
}
