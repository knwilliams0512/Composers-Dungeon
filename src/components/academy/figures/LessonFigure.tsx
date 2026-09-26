import { CircleFigure } from "./CircleFigure";
import { FigureSound, type SoundEvent } from "./FigureSound";
import { FormFigure, ScoreOrderFigure } from "./FormFigure";
import { KeyboardFigure } from "./KeyboardFigure";
import { RhythmFigure } from "./RhythmFigure";
import { StaffFigure } from "./StaffFigure";
import { placeNotes, type LessonFigure as Spec } from "@/lib/lesson-figure";
import { TICKS_PER_WHOLE } from "@/lib/score";
import { inkAccent } from "@/lib/studio/ink";

/**
 * One figure, framed.
 *
 * The staff figures are drawn on a pale page rather than the app's dark
 * ground, because that is what music looks like and a lesson is the wrong
 * place to teach someone to read white notes on black. The diagrams that are
 * not notation keep the dark surface they sit on.
 */

/** Seconds per tick at a walking pace a figure can be followed at. */
const TEMPO = 96;
const SECONDS_PER_TICK = 60 / TEMPO / (TICKS_PER_WHOLE / 4);

function soundFor(spec: Spec): SoundEvent[] | null {
  if (spec.kind === "staff") {
    if (spec.silent) return null;
    return placeNotes(spec.notes).map((note) => ({
      pitch: note.rest ? -1 : note.pitch,
      at: note.start * SECONDS_PER_TICK,
      length: note.duration * SECONDS_PER_TICK,
    }));
  }
  if (spec.kind === "keyboard") {
    if (spec.silent) return null;
    const marks = (spec.marks ?? []).filter((m) => m.tone !== "muted");
    if (marks.length === 0) return null;
    return marks.map((mark, i) => ({
      pitch: mark.pitch,
      at: i * 0.42,
      length: 0.5,
    }));
  }
  if (spec.kind === "rhythm") {
    if (spec.silent) return null;
    let cursor = 0;
    return spec.row.map((cell) => {
      const at = cursor * SECONDS_PER_TICK;
      cursor += cell.duration;
      // One pitch throughout: the figure is about length, not melody.
      return { pitch: cell.rest ? -1 : 72, at, length: cell.duration * SECONDS_PER_TICK };
    });
  }
  return null;
}

export function LessonFigure({ spec, accent }: { spec: Spec; accent: string }) {
  const sound = soundFor(spec);
  // Notation and the beat grid are drawn in engraver's ink, so they need the
  // page. The keyboard is a dark object in the world and the rest are
  // diagrams; they keep the surface they sit on.
  const onPage = spec.kind === "staff" || spec.kind === "rhythm";
  const caption = "caption" in spec ? spec.caption : undefined;
  const onPageAccent = inkAccent(accent);

  return (
    <figure
      className="mt-4 overflow-hidden rounded-xl border backdrop-blur"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 32%, transparent)`,
        background: "rgba(8,7,12,0.5)",
      }}
    >
      <div
        className="flex items-center justify-between gap-3 border-b px-3.5 py-2"
        style={{
          borderColor: `color-mix(in srgb, ${accent} 22%, transparent)`,
          background: `color-mix(in srgb, ${accent} 10%, transparent)`,
        }}
      >
        <figcaption
          className="min-w-0 text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: accent }}
        >
          {caption ?? "On the page"}
        </figcaption>
        {sound && sound.length > 0 && (
          <FigureSound events={sound} label={caption ?? "this example"} />
        )}
      </div>

      <div
        className={`flex justify-center overflow-x-auto px-3 py-4${
          onPage ? "" : " [&>*]:w-full"
        }`}
        style={
          onPage
            ? {
                // Notation belongs on paper. The warmth keeps it from glaring
                // out of a dark page the way plain white would.
                background:
                  "linear-gradient(180deg, #f7f3ea 0%, #f2ece0 100%)",
              }
            : undefined
        }
      >
        {spec.kind === "staff" && <StaffFigure spec={spec} accent={onPageAccent} />}
        {spec.kind === "keyboard" && <KeyboardFigure spec={spec} accent={accent} />}
        {spec.kind === "rhythm" && <RhythmFigure spec={spec} accent={onPageAccent} />}
        {spec.kind === "circle" && <CircleFigure spec={spec} accent={accent} />}
        {spec.kind === "form" && <FormFigure spec={spec} accent={accent} />}
        {spec.kind === "scoreOrder" && <ScoreOrderFigure spec={spec} accent={accent} />}
      </div>
    </figure>
  );
}
