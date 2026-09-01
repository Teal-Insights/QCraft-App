/**
 * How long the chart transitions run.
 *
 * The brief is explicit that the animation is the pedagogy, so this is not a
 * decoration to be switched off wholesale. But a user who has asked their
 * operating system for reduced motion has asked for a reason, and a 450ms
 * sweep of a full-screen chart is exactly the kind of movement that request is
 * about. The compromise: keep the transition, make it short enough to read as
 * a settle rather than a sweep. At 90ms the line still moves continuously from
 * old shape to new, which is the property that does the teaching.
 */

const FULL_DURATION = 450;
const REDUCED_DURATION = 90;

export function transitionDuration(): number {
  const reduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return reduced ? REDUCED_DURATION : FULL_DURATION;
}
