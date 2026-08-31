import type { PrintFormat } from './print/PrintableInvoice';

interface PrintFormatToggleProps {
  /** Currently selected print format. */
  value: PrintFormat;
  /** Called when the user selects a different format. */
  onChange: (format: PrintFormat) => void;
}

/**
 * PrintFormatToggle
 *
 * A compact segmented control for selecting the POS invoice print format.
 * Follows the app's glassmorphism / neu-morphism design conventions.
 *
 * Renders two buttons side by side: "A4" and "Ticket 80mm".
 * The active button uses an inset shadow style matching the existing design
 * system (--shadow-neu-inset design token).
 */
export function PrintFormatToggle({ value, onChange }: PrintFormatToggleProps) {
  return (
    <div
      className="inline-flex items-center gap-0 rounded-xl overflow-hidden"
      style={{ boxShadow: 'var(--shadow-neu)' }}
      role="group"
      aria-label="Formato de impresión"
    >
      <button
        type="button"
        onClick={() => onChange('A4')}
        aria-pressed={value === 'A4'}
        className="px-4 py-2 text-sm font-medium transition-all focus:outline-none"
        style={{
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          boxShadow: value === 'A4' ? 'var(--shadow-neu-inset)' : 'none',
          fontWeight: value === 'A4' ? 700 : 400,
        }}
      >
        A4
      </button>
      <button
        type="button"
        onClick={() => onChange('ticket')}
        aria-pressed={value === 'ticket'}
        className="px-4 py-2 text-sm font-medium transition-all focus:outline-none"
        style={{
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          boxShadow: value === 'ticket' ? 'var(--shadow-neu-inset)' : 'none',
          fontWeight: value === 'ticket' ? 700 : 400,
        }}
      >
        Ticket 80mm
      </button>
    </div>
  );
}
