import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/designTokens';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { useThemeColors } from '@/hooks/useThemeColors';

interface SkeletonCardProps {
  rows?: number;
}

export function SkeletonCard({ rows = 3 }: SkeletonCardProps) {
  const theme = useThemeColors();
  const { shouldAnimate } = useMotionPreference();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shouldAnimate) {
      pulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse, shouldAnimate]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0.82] });
  const blockColor = theme.isDark ? theme.surfaceSoft : colors.panelSoft;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Animated.View style={[styles.icon, { opacity, backgroundColor: blockColor }]} />
      {Array.from({ length: rows }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.line,
            index === rows - 1 && styles.shortLine,
            { opacity, backgroundColor: blockColor },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  line: {
    height: 12,
    borderRadius: radius.sm,
  },
  shortLine: {
    width: '62%',
  },
});
