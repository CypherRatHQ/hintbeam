import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import type { Box, PathRoute } from "../core/geometry.js";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface LightProps {
  /** The path from the step card to the target, made by the chosen path style. */
  route: PathRoute | null;
  /** What is highlighted. */
  box: Box;
  radius: number;
  color: string;
  /** Where the light blends to, toward the target. */
  color2?: string;
  reduceMotion: boolean;
  /** Draw the light again only when this changes (a new step); otherwise it follows in place. */
  drawKey?: string;
  /** 0–1: how much the light glows. */
  glow?: number;
  /** Draw once, then stay still: no travelling spark. */
  calm?: boolean;
}

/**
 * The light: a path drawn from the card to the target, a spark that travels it, and a ring that
 * follows the target's shape. Under reduced motion it is a still line and ring.
 */
export function Light({
  route,
  box,
  radius,
  color,
  color2 = color,
  reduceMotion,
  drawKey,
  glow: glowAmount = 0.4,
  calm = false,
}: LightProps) {
  const draw = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const travel = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const key = drawKey ?? route?.d ?? `${box.x},${box.y},${box.width},${box.height}`;

  useEffect(() => {
    if (reduceMotion) {
      draw.setValue(1);
      glow.setValue(1);
      return;
    }
    draw.setValue(0);
    travel.setValue(0);
    glow.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(draw, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(glow, { toValue: 1, duration: 220, useNativeDriver: false }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(travel, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
          Animated.delay(900),
          Animated.timing(travel, { toValue: 0, duration: 0, useNativeDriver: false }),
        ]),
      ),
    ]);
    animation.start();
    return () => animation.stop();
  }, [key, reduceMotion, draw, travel, glow]);

  const pad = 6;
  const ring = (
    <Animated.View
      style={[
        styles.ring,
        {
          left: box.x - pad,
          top: box.y - pad,
          width: box.width + pad * 2,
          height: box.height + pad * 2,
          borderRadius: radius + pad,
          borderColor: color,
          opacity: glow,
        },
      ]}
    />
  );
  if (!route) {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {ring}
      </View>
    );
  }

  const input = route.points.map((_, i) => i / Math.max(1, route.points.length - 1));
  const sparkX = travel.interpolate({ inputRange: input, outputRange: route.points.map((p) => p.x) });
  const sparkY = travel.interpolate({ inputRange: input, outputRange: route.points.map((p) => p.y) });
  const sparkOpacity = travel.interpolate({ inputRange: [0, 0.08, 0.9, 1], outputRange: [0, 1, 1, 0] });
  const dashOffset = draw.interpolate({ inputRange: [0, 1], outputRange: [route.length, 0] });
  const dash = [route.length, route.length];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient
            id="hb-light"
            gradientUnits="userSpaceOnUse"
            x1={route.start.x}
            y1={route.start.y}
            x2={route.end.x}
            y2={route.end.y}
          >
            <Stop offset="0" stopColor={color} />
            <Stop offset="1" stopColor={color2} />
          </LinearGradient>
        </Defs>
        {route.strands?.map((strand, i) => (
          <AnimatedPath
            key={i}
            d={strand.d}
            stroke="url(#hb-light)"
            strokeOpacity={i === 0 ? 0.55 : 0.42}
            strokeWidth={i === 0 ? 1.1 : 0.9}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={[strand.length, strand.length]}
            strokeDashoffset={draw.interpolate({ inputRange: [0, 0.15 + i * 0.1, 1], outputRange: [strand.length, strand.length, 0] })}
          />
        ))}
        <AnimatedPath
          d={route.d}
          stroke="url(#hb-light)"
          strokeOpacity={0.18 * glowAmount}
          strokeWidth={3 + 3 * glowAmount}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={dash}
          strokeDashoffset={dashOffset}
        />
        <AnimatedPath
          d={route.d}
          stroke="url(#hb-light)"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={dash}
          strokeDashoffset={dashOffset}
        />
        {reduceMotion || calm ? null : <AnimatedCircle cx={sparkX} cy={sparkY} r={4} fill={color} opacity={sparkOpacity} />}
      </Svg>
      {ring}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { position: "absolute", borderWidth: 2 },
});
