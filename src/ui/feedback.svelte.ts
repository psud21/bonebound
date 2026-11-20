/** Short-lived UI feedback: floating damage numbers and toasts. Not saved. */

export interface FloatText {
  id: number;
  text: string;
  /** Horizontal offset in px so rapid clicks don't stack exactly. */
  dx: number;
  crit?: boolean;
}

export interface Toast {
  id: number;
  text: string;
}

let nextId = 1;

export const feedback = $state({ floats: [] as FloatText[], toasts: [] as Toast[] });

export function floatText(text: string, crit = false): void {
  const id = nextId++;
  feedback.floats.push({ id, text, dx: Math.round((Math.random() - 0.5) * 80), crit });
  if (feedback.floats.length > 20) feedback.floats.shift();
  setTimeout(() => {
    const i = feedback.floats.findIndex((f) => f.id === id);
    if (i >= 0) feedback.floats.splice(i, 1);
  }, 900);
}

export function toast(text: string, ms = 4500): void {
  const id = nextId++;
  feedback.toasts.push({ id, text });
  if (feedback.toasts.length > 4) feedback.toasts.shift();
  setTimeout(() => {
    const i = feedback.toasts.findIndex((t) => t.id === id);
    if (i >= 0) feedback.toasts.splice(i, 1);
  }, ms);
}
