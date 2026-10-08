/**
 * Every word an app user reads. Pass `labels` to `TourProvider` to translate or reword any of them;
 * nothing in the components is hard-coded.
 */
export interface TourLabels {
  next: string;
  back: string;
  skip: string;
  /** The last step's Next. */
  done: string;
  /** Offered when the target is on this screen but scrolled out of view. */
  showMe: string;
  /** Offered when the target is on another screen. */
  takeMeThere: string;
  /** Shown when the target cannot be found right now. The tour never points at nothing. */
  notFound: string;
  /** Shown while a step waits for the user to tap the target or for the app to finish something. */
  yourTurn: string;
  /** "Step 2 of 5". */
  stepOf: (step: number, total: number) => string;
  /** Read by screen readers when a step appears. */
  announce: (title: string | undefined, text: string, step: number, total: number) => string;
}

export const TOUR_LABELS: TourLabels = {
  next: "Next",
  back: "Back",
  skip: "Skip",
  done: "Done",
  showMe: "Show me",
  takeMeThere: "Take me there",
  notFound: "I can't find this here right now.",
  yourTurn: "Your turn",
  stepOf: (step, total) => `Step ${step} of ${total}`,
  announce: (title, text, step, total) => `${title ? `${title}. ` : ""}${text} Step ${step} of ${total}.`,
};
