import { useReducedMotion } from 'react-native-reanimated';
import { motion } from '@/constants/designTokens';

export function useMotionPreference() {
  const reduceMotion = useReducedMotion();

  return {
    reduceMotion,
    shouldAnimate: !reduceMotion,
    duration: reduceMotion ? 0 : motion.base,
    fastDuration: reduceMotion ? 0 : motion.fast,
    slowDuration: reduceMotion ? 0 : motion.slow,
  };
}
