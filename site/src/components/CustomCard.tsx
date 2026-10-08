"use client";

import { createPortal } from "react-dom";
import type { TourStepView } from "hintbeam";

/** A deliberately different step UI, to show `renderStep`: a paper note docked to the bottom of the screen. */
export function CustomCard({ step }: { step: TourStepView }) {
  if (!step.step) return null;
  const box = step.highlight?.box;
  return createPortal(
    <>
      {box ? (
        <div
          className="custom-highlight"
          style={{ left: box.x - 4, top: box.y - 4, width: box.width + 8, height: box.height + 8 }}
          aria-hidden="true"
        />
      ) : null}
      <div className="custom-card" role="dialog" aria-live="polite">
        <span className="custom-count">
          {step.index + 1}/{step.total}
        </span>
        <p>{step.step.text}</p>
        <div className="custom-actions">
          <button type="button" onClick={step.skip} aria-label={step.labels.skip}>
            ✕
          </button>
          {step.primary === "showMe" ? (
            <button type="button" className="primary" onClick={step.showMe}>
              {step.labels.showMe}
            </button>
          ) : null}
          {step.primary === "takeMeThere" ? (
            <button type="button" className="primary" onClick={step.takeMeThere}>
              {step.labels.takeMeThere}
            </button>
          ) : null}
          {step.primary === "next" || step.primary === "done" ? (
            <button type="button" className="primary" onClick={step.next}>
              {step.primary === "done" ? step.labels.done : step.labels.next}
            </button>
          ) : null}
        </div>
      </div>
    </>,
    document.body,
  );
}
