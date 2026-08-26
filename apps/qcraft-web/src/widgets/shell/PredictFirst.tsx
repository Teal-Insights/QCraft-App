/**
 * The predict-first affordance.
 *
 * A question sits quietly next to the caption from the moment the widget loads.
 * The moment the user touches anything, it becomes the answer. That is the
 * whole mechanism: no modal, no submit button, no score, nothing to dismiss
 * before the widget will work. A quiz wall would cost more attention than the
 * prediction is worth, and would punish the trainer who just wants to project
 * the default state and talk over it.
 *
 * It reveals rather than hides because the reveal is the reward for having
 * guessed, and because a user who never guesses still ends up reading the
 * takeaway.
 */

interface Props {
  /** Shown before the first interaction. Phrase it as a question. */
  question: string;
  /** Shown after. Phrase it as the thing they just watched happen. */
  answer: string;
  revealed: boolean;
}

export function PredictFirst({ question, answer, revealed }: Props) {
  return (
    <p className={`wpredict${revealed ? ' wpredict--revealed' : ''}`}>
      <span className="wpredict__tag">{revealed ? 'You just saw' : 'Predict first'}</span>
      <span className="wpredict__text">{revealed ? answer : question}</span>
    </p>
  );
}
