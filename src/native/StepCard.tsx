import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import { inflate } from "../core/geometry.js";
import { edgeBeacon, placeStep, type StepPlacement } from "../core/layout.js";
import type { TourStepUIProps } from "../react/platform.js";
import { GuideOrb } from "./GuideOrb.js";
import { Light } from "./Light.js";

const SOCKET = 42;
/** The ring is drawn this far outside the target; the light ends on it. */
const RING = 6;
const OUT_OF: Record<StepPlacement["edge"], { x: number; y: number }> = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => alive && setReduce(value),
      () => undefined,
    );
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);
  return reduce;
}

/** The built-in step card for React Native: words, progress, controls and the light. */
export function NativeStepCard({ view, theme, path }: TourStepUIProps) {
  const window = useWindowDimensions();
  const reduceMotion = useReduceMotion() || theme.motion === "none";
  const [height, setHeight] = useState(0);
  const { step, labels, highlight, where } = view;

  // Announce each step once, without moving focus.
  useEffect(() => {
    if (step) AccessibilityInfo.announceForAccessibility(labels.announce(step.title, step.text, view.index + 1, view.total));
  }, [step, view.index, view.total, labels]);

  const box = highlight?.box ?? null;
  const offscreen = where?.kind === "offscreen" ? where : null;
  const aim = box ? (offscreen ? edgeBeacon(window, box, offscreen.direction, offscreen.band) : inflate(box, RING)) : null;
  const placement = placeStep(window, offscreen ? box : aim, height, {
    insets: theme.inset,
    maxWidth: theme.maxCardWidth,
    gap: theme.light ? (theme.guide ? 56 : 40) : 14,
  });
  const showPath = theme.light && aim !== null && height > 0;
  const route = useMemo(
    () => (showPath && aim ? path(placement.guide, aim, { gap: theme.guide ? SOCKET / 2 + 2 : 4, leave: OUT_OF[placement.edge] }) : null),
    [showPath, aim?.x, aim?.y, aim?.width, aim?.height, path, placement.guide.x, placement.guide.y, placement.edge, theme.guide],
  );
  const g = placement.guide;
  const angle = aim ? (Math.atan2(aim.y + aim.height / 2 - g.y, aim.x + aim.width / 2 - g.x) * 180) / Math.PI : -90;

  if (!step) return null;

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    if (next !== height) setHeight(next);
  };
  const font = theme.fontFamily ? { fontFamily: theme.fontFamily } : null;
  const button = (label: string, onPress: () => void, primary: boolean, quiet = false) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        primary ? { backgroundColor: theme.accent, borderRadius: 12 } : null,
        quiet ? styles.quiet : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.buttonText, font, { color: primary ? theme.onAccent : theme.mutedText }, quiet ? styles.quietText : null]}>
        {label}
      </Text>
    </Pressable>
  );
  const primary =
    view.primary === "showMe"
      ? button(labels.showMe, view.showMe, true)
      : view.primary === "takeMeThere"
        ? button(labels.takeMeThere, view.takeMeThere, true)
        : view.primary === "wait"
          ? null
          : button(view.primary === "done" ? labels.done : labels.next, view.next, true);

  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { zIndex: theme.zIndex }]}>
      {highlight && aim ? (
        <Light
          route={route}
          box={offscreen ? aim : highlight.box}
          radius={offscreen ? 1 : highlight.radius}
          color={theme.accent}
          color2={theme.accent2}
          reduceMotion={reduceMotion}
          drawKey={`${view.key}:${where?.kind}`}
          glow={theme.glow}
          calm={theme.motion !== "full"}
        />
      ) : null}
      <View
        onLayout={onLayout}
        accessibilityLiveRegion="polite"
        style={[
          styles.card,
          styles.shadow,
          {
            left: placement.left,
            top: placement.top,
            width: placement.width,
            backgroundColor: theme.card,
            borderColor: theme.border,
            borderRadius: theme.radius,
            opacity: height > 0 ? 1 : 0,
            paddingTop: theme.guide && placement.edge === "top" ? 24 : 16,
            paddingBottom: theme.guide && placement.edge === "bottom" ? 24 : 12,
          },
        ]}
      >
        {theme.guide ? (
          <View
            pointerEvents="none"
            style={[
              styles.socket,
              {
                left: g.x - placement.left - SOCKET / 2,
                top: g.y - placement.top - SOCKET / 2,
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <GuideOrb
              accent={theme.accent}
              accent2={theme.accent2}
              angle={angle}
              waiting={view.primary === "wait"}
              searching={where?.kind === "notFound" || where?.kind === "otherScreen"}
              reduceMotion={reduceMotion}
            />
          </View>
        ) : null}
        <Text style={[styles.count, font, { color: theme.mutedText }]}>{labels.stepOf(view.index + 1, view.total)}</Text>
        {step.title ? <Text style={[styles.title, font, { color: theme.text }]}>{step.title}</Text> : null}
        <Text style={[styles.text, font, { color: theme.text }]}>{step.text}</Text>
        {where?.kind === "notFound" ? <Text style={[styles.hint, font, { color: theme.mutedText }]}>{labels.notFound}</Text> : null}
        <View style={styles.row}>
          {button(labels.skip, view.skip, false, true)}
          <View style={styles.actions}>
            {view.primary === "wait" ? <Text style={[styles.progress, font, { color: theme.accent }]}>{labels.yourTurn}</Text> : null}
            {view.isFirst ? null : button(labels.back, view.back, false)}
            {primary}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { position: "absolute", paddingHorizontal: 18, borderWidth: StyleSheet.hairlineWidth },
  socket: {
    position: "absolute",
    width: SOCKET,
    height: SOCKET,
    borderRadius: SOCKET / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  shadow: { shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  title: { fontSize: 17, fontWeight: "600", marginBottom: 4 },
  text: { fontSize: 15, lineHeight: 21 },
  hint: { fontSize: 13, marginTop: 6 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  progress: { fontSize: 13, fontWeight: "600", marginRight: 6 },
  count: { fontSize: 12, fontWeight: "600", letterSpacing: 0.3, marginBottom: 6 },
  actions: { flexDirection: "row", alignItems: "center", gap: 4 },
  button: { minHeight: 44, minWidth: 44, paddingHorizontal: 14, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  buttonText: { fontSize: 15, fontWeight: "600" },
  quiet: { paddingHorizontal: 8, marginLeft: -8 },
  quietText: { fontSize: 14, fontWeight: "500" },
  pressed: { opacity: 0.7 },
});
