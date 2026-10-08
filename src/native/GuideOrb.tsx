import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, RadialGradient, Stop } from "react-native-svg";

export interface GuideOrbProps {
  accent: string;
  accent2: string;
  /** Degrees toward what the step is about. */
  angle: number;
  /** Quicker breathing while the step waits for the user. */
  waiting: boolean;
  /** Dimmer while the target is not on this screen. */
  searching: boolean;
  reduceMotion: boolean;
  size?: number;
}

/** The guide for React Native: the same drawing as the web one, breathing with `Animated`. */
export function GuideOrb({ accent, accent2, angle, waiting, searching, reduceMotion, size = 34 }: GuideOrbProps) {
  const breath = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const duration = waiting ? 800 : 1600;
    const loop = Animated.parallel([
      Animated.loop(
        Animated.sequence([
          Animated.timing(breath, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(breath, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
      Animated.loop(Animated.timing(spin, { toValue: 1, duration: searching ? 1400 : 9000, easing: Easing.linear, useNativeDriver: true })),
    ]);
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, waiting, searching, breath, spin]);

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] });
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale }] }]}>
        <Svg width={size} height={size} viewBox="-20 -20 40 40">
          <Defs>
            <RadialGradient id="hb-halo" cx="0" cy="0" r="19" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={accent} stopOpacity={0.55} />
              <Stop offset="1" stopColor={accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle r={19} fill="url(#hb-halo)" />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Svg width={size} height={size} viewBox="-20 -20 40 40">
          <G rotation={angle}>
            <Ellipse rx={12} ry={11} fill="none" stroke={accent} strokeWidth={1.3} strokeDasharray="34 5 9 5 12 6" strokeLinecap="round" />
          </G>
          <Circle cx={15.5} r={1.5} fill="#fff" />
        </Svg>
      </Animated.View>
      <Svg width={size} height={size} viewBox="-20 -20 40 40" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="hb-core" cx="-1.5" cy="-1.5" r="8" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#fff" />
            <Stop offset="0.35" stopColor={accent2} />
            <Stop offset="1" stopColor={accent} />
          </RadialGradient>
        </Defs>
        <Circle r={6.4} fill="url(#hb-core)" opacity={searching ? 0.55 : 1} />
      </Svg>
    </View>
  );
}
