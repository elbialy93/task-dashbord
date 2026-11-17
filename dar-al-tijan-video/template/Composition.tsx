import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Easing,
  Img,
  Sequence,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Dar Al-Tijan brand template: Arabic, RTL, vertical. Everything a video says
// comes from props (see example-props.json); the look stays fixed here.

const NAVY = "#0F1A3D";
const NAVY_2 = "#182657";
const GOLD = "#E0B04F";
const EMERALD = "#1F9D6B";
const IVORY = "#F7F1E3";
const MUTED = "#B9C2DC";
const W = 1080;
const H = 1920;
const FPS = 30;
const CAIRO = "CairoLocal";
const AMIRI = "AmiriLocal";

const FONT_FILES: Array<[string, string, string]> = [
  [CAIRO, "500", "cairo-arabic-500-normal.woff2"],
  [CAIRO, "700", "cairo-arabic-700-normal.woff2"],
  [CAIRO, "900", "cairo-arabic-900-normal.woff2"],
  [AMIRI, "400", "amiri-arabic-400-normal.woff2"],
  [AMIRI, "700", "amiri-arabic-700-normal.woff2"],
];
let fontsPromise: Promise<void> | null = null;
const loadFonts = () => {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      FONT_FILES.map(([family, weight, file]) =>
        new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { weight }).load().then((f) => {
          (document.fonts as any).add(f);
        }),
      ),
    ).then(() => undefined);
  }
  return fontsPromise;
};
const useBrandFonts = () => {
  const [handle] = React.useState(() => delayRender("loading brand fonts", { timeoutInMilliseconds: 120000 }));
  React.useEffect(() => {
    loadFonts()
      .then(() => continueRender(handle))
      .catch((e) => cancelRender(e));
  }, [handle]);
};

// ------------------------------------------------------------- props ----

/** A line of text and the second (from the segment's start) at which it appears. */
export interface Cue {
  text: string;
  at: number;
}

export interface SceneSpec {
  /** hook: opening question · quote: ayah/hadith/dhikr card · point: numbered tip · list: up to 4 cards */
  type: "hook" | "quote" | "point" | "list";
  kicker?: string; // small gold pill, e.g. "أولًا"
  title?: string;
  highlight?: string; // part of the title to colour gold
  titleAt?: number;
  lines?: Cue[]; // body lines (hook/point), or lines after the quote
  quote?: Cue; // mashkool text, set in Amiri; use \n for line breaks
  intro?: string; // e.g. "قال الله تعالى"
  source?: string; // e.g. "سورة طه · ١٣٢"
  items?: Cue[]; // list cards
}

export interface Segment {
  start: number; // timeline second at which this segment's narration begins
  audioFrom?: number; // seconds inside the narration file
  audioTo?: number;
  scene: SceneSpec;
}

export interface BrandVideoProps {
  totalSeconds: number;
  narration?: string; // file in public/, optional (silent preview without it)
  logo?: string; // transparent PNG in public/
  seriesTitle?: string; // shown for the first 2.6s
  closingSeconds?: number; // length of the closing brand card, default 3.5
  segments: Segment[];
}

// ----------------------------------------------------------- helpers ----

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 0.8, 0.2, 1);
const rise = (t: number, at: number, dur = 0.7) => interpolate(t, [at, at + dur], [0, 1], { ...clamp, easing: ease });

const Lines: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split("\n").map((l, i) => (
      <React.Fragment key={i}>
        {i > 0 && <br />}
        {l}
      </React.Fragment>
    ))}
  </>
);

const Text: React.FC<{
  t: number;
  at: number;
  size: number;
  weight?: number;
  color?: string;
  font?: string;
  lineHeight?: number;
  children: React.ReactNode;
}> = ({ t, at, size, weight = 500, color = IVORY, font = CAIRO, lineHeight = 1.5, children }) => {
  const p = rise(t, at);
  return (
    <div
      style={{
        fontFamily: font,
        fontSize: size,
        fontWeight: weight,
        color,
        lineHeight,
        textAlign: "center",
        direction: "rtl",
        opacity: p,
        transform: `translateY(${(1 - p) * 30}px)`,
        filter: `blur(${(1 - p) * 8}px)`,
      }}
    >
      {children}
    </div>
  );
};

const Title: React.FC<{ t: number; at: number; size: number; title: string; highlight?: string }> = ({
  t,
  at,
  size,
  title,
  highlight,
}) => {
  const i = highlight ? title.indexOf(highlight) : -1;
  return (
    <Text t={t} at={at} size={size} weight={900} lineHeight={1.35}>
      {i < 0 ? (
        <Lines text={title} />
      ) : (
        <>
          <Lines text={title.slice(0, i)} />
          <span style={{ color: GOLD }}>{highlight}</span>
          <Lines text={title.slice(i + highlight!.length)} />
        </>
      )}
    </Text>
  );
};

const Kicker: React.FC<{ t: number; children: React.ReactNode }> = ({ t, children }) => {
  const p = rise(t, 0.1, 0.5);
  return (
    <div
      style={{
        fontFamily: CAIRO,
        fontWeight: 700,
        fontSize: 44,
        color: NAVY,
        background: GOLD,
        padding: "6px 46px",
        borderRadius: 999,
        direction: "rtl",
        opacity: p,
        transform: `scale(${0.8 + 0.2 * p})`,
      }}
    >
      {children}
    </div>
  );
};

/** Eight-point star, the brand's recurring ornament. */
const Star: React.FC<{ size: number; color?: string; opacity?: number; rotate?: number }> = ({
  size,
  color = GOLD,
  opacity = 1,
  rotate = 0,
}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ opacity, transform: `rotate(${rotate}deg)` }}>
    <rect x={-34} y={-34} width={68} height={68} fill="none" stroke={color} strokeWidth={3} />
    <rect x={-34} y={-34} width={68} height={68} fill="none" stroke={color} strokeWidth={3} transform="rotate(45)" />
    <circle r={9} fill={color} />
  </svg>
);

const Backdrop: React.FC<{ frame: number }> = ({ frame }) => (
  <AbsoluteFill style={{ background: `radial-gradient(120% 80% at 50% 30%, ${NAVY_2} 0%, ${NAVY} 60%, #0A1230 100%)` }}>
    <svg width={W} height={H} style={{ position: "absolute", opacity: 0.07 }}>
      <defs>
        <pattern id="lattice" width={180} height={180} patternUnits="userSpaceOnUse">
          <g transform="translate(90 90)" fill="none" stroke={GOLD} strokeWidth={3}>
            <rect x={-48} y={-48} width={96} height={96} />
            <rect x={-48} y={-48} width={96} height={96} transform="rotate(45)" />
          </g>
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#lattice)" transform={`translate(0 ${-(frame * 0.15) % 180})`} />
    </svg>
    {/* gold hairline frame */}
    <div
      style={{
        position: "absolute",
        inset: 36,
        border: `2px solid ${GOLD}`,
        borderRadius: 48,
        opacity: 0.45,
      }}
    />
  </AbsoluteFill>
);

const Stage: React.FC<{ children: React.ReactNode; top?: number; gap?: number }> = ({ children, top = 300, gap = 44 }) => (
  <div
    style={{
      position: "absolute",
      top,
      left: 90,
      right: 90,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap,
    }}
  >
    {children}
  </div>
);

// ------------------------------------------------------------ scenes ----

const HookScene: React.FC<{ t: number; s: SceneSpec; frame: number }> = ({ t, s, frame }) => (
  <Stage top={430} gap={56}>
    <div style={{ opacity: rise(t, -0.2, 1) }}>
      <Star size={200} rotate={frame * 0.25} />
    </div>
    {s.title && <Title t={t} at={s.titleAt ?? 0.1} size={104} title={s.title} highlight={s.highlight} />}
    {(s.lines ?? []).map((l, i) => (
      <Text key={i} t={t} at={l.at} size={64} color={MUTED}>
        <Lines text={l.text} />
      </Text>
    ))}
  </Stage>
);

const QuoteScene: React.FC<{ t: number; s: SceneSpec }> = ({ t, s }) => {
  const p = rise(t, -0.2, 0.9);
  return (
    <Stage top={340} gap={50}>
      <div
        style={{
          width: 900,
          padding: "70px 50px 60px",
          borderRadius: 56,
          background: "rgba(224,176,79,0.08)",
          border: `3px solid ${GOLD}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 34,
          opacity: p,
          transform: `scale(${0.96 + 0.04 * p})`,
        }}
      >
        {s.intro && (
          <Text t={t} at={0.15} size={50} color={MUTED}>
            {s.intro}
          </Text>
        )}
        {s.quote && (
          <Text t={t} at={s.quote.at} size={92} weight={700} font={AMIRI} color={GOLD} lineHeight={1.8}>
            <Lines text={s.quote.text} />
          </Text>
        )}
        {s.source && (
          <Text t={t} at={(s.quote?.at ?? 0) + 1.5} size={40} color={MUTED}>
            {s.source}
          </Text>
        )}
      </div>
      {(s.lines ?? []).map((l, i) => (
        <Text key={i} t={t} at={l.at} size={84} weight={900} color={i % 2 ? EMERALD : IVORY}>
          <Lines text={l.text} />
        </Text>
      ))}
    </Stage>
  );
};

const PointScene: React.FC<{ t: number; s: SceneSpec }> = ({ t, s }) => (
  <Stage top={380} gap={50}>
    {s.kicker && <Kicker t={t}>{s.kicker}</Kicker>}
    {s.title && <Title t={t} at={s.titleAt ?? 1.1} size={118} title={s.title} highlight={s.highlight} />}
    <div style={{ width: 220, height: 6, borderRadius: 3, background: EMERALD, transform: `scaleX(${rise(t, (s.titleAt ?? 1.1) + 0.3)})` }} />
    {(s.lines ?? []).map((l, i) => (
      <Text key={i} t={t} at={l.at} size={66} color={i === 0 ? IVORY : MUTED}>
        <Lines text={l.text} />
      </Text>
    ))}
  </Stage>
);

const ListScene: React.FC<{ t: number; s: SceneSpec }> = ({ t, s }) => (
  <Stage top={300} gap={38}>
    {s.kicker && <Kicker t={t}>{s.kicker}</Kicker>}
    {s.title && <Title t={t} at={s.titleAt ?? 1.1} size={108} title={s.title} highlight={s.highlight} />}
    <div style={{ height: 10 }} />
    {(s.items ?? []).map((it, i) => {
      const p = rise(t, it.at);
      return (
        <div
          key={i}
          style={{
            width: 860,
            display: "flex",
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 36,
            padding: "30px 44px",
            borderRadius: 36,
            background: NAVY_2,
            border: `2px solid rgba(224,176,79,0.5)`,
            opacity: p,
            transform: `translateX(${(1 - p) * 80}px)`,
          }}
        >
          <Star size={76} color={i % 2 ? EMERALD : GOLD} />
          <div style={{ fontFamily: CAIRO, fontWeight: 700, fontSize: 60, color: IVORY, direction: "rtl" }}>{it.text}</div>
        </div>
      );
    })}
  </Stage>
);

const ClosingCard: React.FC<{ t: number; logo?: string; frame: number }> = ({ t, logo, frame }) => {
  const p = rise(t, 0, 0.6);
  return (
    <AbsoluteFill style={{ background: NAVY, opacity: p, alignItems: "center", justifyContent: "center", gap: 50 }}>
      {logo ? <Img src={staticFile(logo)} style={{ width: 420, height: 420, objectFit: "contain" }} /> : <Star size={300} rotate={frame * 0.3} />}
      <Text t={t} at={0.3} size={130} weight={900} color={GOLD}>
        دار التيجان
      </Text>
      <Text t={t} at={0.9} size={66} weight={700}>
        نبني جيل القرآن
      </Text>
    </AbsoluteFill>
  );
};

// -------------------------------------------------------------- root ----

export const BrandVideo: React.FC<BrandVideoProps> = ({
  totalSeconds,
  narration,
  logo,
  seriesTitle,
  closingSeconds = 3.5,
  segments,
}) => {
  useBrandFonts();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = frame / fps;
  const LEAD = 0.5;
  const closingAt = totalSeconds - closingSeconds;
  const seriesP = seriesTitle ? Math.min(rise(T, 0.1, 0.5), 1 - rise(T, 2.2, 0.4)) : 0;

  return (
    <AbsoluteFill style={{ background: NAVY }}>
      <Backdrop frame={frame} />
      {segments.map((seg, i) => {
        const begin = seg.start - LEAD;
        const end = i < segments.length - 1 ? segments[i + 1].start - LEAD : closingAt;
        if (T < begin - 0.1 || T > end) return null;
        const out = interpolate(T, [end - 0.45, end], [1, 0], clamp);
        const t = T - seg.start;
        const s = seg.scene;
        return (
          <AbsoluteFill key={i} style={{ opacity: out, transform: `translateY(${(1 - out) * -24}px)` }}>
            {s.type === "hook" && <HookScene t={t} s={s} frame={frame} />}
            {s.type === "quote" && <QuoteScene t={t} s={s} />}
            {s.type === "point" && <PointScene t={t} s={s} />}
            {s.type === "list" && <ListScene t={t} s={s} />}
          </AbsoluteFill>
        );
      })}
      {/* logo, top-right */}
      {logo && T < closingAt && (
        <Img src={staticFile(logo)} style={{ position: "absolute", top: 70, right: 70, width: 150, height: 150, objectFit: "contain" }} />
      )}
      {/* series title, first 2.6s */}
      {seriesTitle && seriesP > 0 && (
        <div
          style={{
            position: "absolute",
            top: 110,
            left: 90,
            right: logo ? 250 : 90,
            fontFamily: CAIRO,
            fontWeight: 700,
            fontSize: 50,
            color: GOLD,
            direction: "rtl",
            textAlign: logo ? "right" : "center",
            opacity: seriesP,
          }}
        >
          {seriesTitle}
        </div>
      )}
      {T >= closingAt && <ClosingCard t={T - closingAt} logo={logo} frame={frame} />}
      {narration &&
        segments.map((seg, i) => {
          if (seg.audioFrom === undefined || seg.audioTo === undefined) return null;
          const dur = Math.round((seg.audioTo - seg.audioFrom) * fps);
          return (
            <Sequence key={`a${i}`} from={Math.round(seg.start * fps)} durationInFrames={dur}>
              <Audio
                src={staticFile(narration)}
                trimBefore={Math.round(seg.audioFrom * fps)}
                trimAfter={Math.round(seg.audioTo * fps)}
                volume={(f) => interpolate(f, [0, 3, dur - 3, dur], [0, 1, 1, 0], clamp)}
              />
            </Sequence>
          );
        })}
    </AbsoluteFill>
  );
};

export const calculateMetadata: CalculateMetadataFunction<BrandVideoProps> = async ({ props }) => ({
  durationInFrames: Math.round(props.totalSeconds * FPS),
  fps: FPS,
  width: W,
  height: H,
});
