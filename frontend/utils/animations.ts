import { Animated, Easing } from 'react-native';
import { useRef, useEffect } from 'react';

// Spring configuration presets
export const SpringConfigs = {
  gentle: { tension: 100, friction: 10 },
  bouncy: { tension: 180, friction: 12 },
  stiff: { tension: 300, friction: 20 },
  wobbly: { tension: 180, friction: 8 },
};

// Easing presets
export const CustomEasing = {
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
  bounceOut: Easing.bezier(0.34, 1.56, 0.64, 1),
  easeOutBack: Easing.bezier(0.34, 1.56, 0.64, 1),
  easeInOutQuart: Easing.bezier(0.77, 0, 0.175, 1),
};

// Hook for fade-in animation
export const useFadeIn = (delay: number = 0, duration: number = 400) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: CustomEasing.smooth,
      useNativeDriver: true,
    }).start();
  }, []);

  return opacity;
};

// Hook for slide-up animation
export const useSlideUp = (delay: number = 0, distance: number = 30) => {
  const translateY = useRef(new Animated.Value(distance)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        easing: CustomEasing.easeOutBack,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { translateY, opacity };
};

// Hook for scale-in animation with bounce
export const useScaleIn = (delay: number = 0) => {
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        ...SpringConfigs.bouncy,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { scale, opacity };
};

// Hook for staggered list animations
export const useStaggeredList = (itemCount: number, staggerDelay: number = 100) => {
  const animations = useRef(
    Array.from({ length: itemCount }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  const animate = () => {
    const animationConfigs = animations.map((anim, index) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 300,
          delay: index * staggerDelay,
          useNativeDriver: true,
        }),
        Animated.spring(anim.translateY, {
          toValue: 0,
          ...SpringConfigs.gentle,
          delay: index * staggerDelay,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.stagger(staggerDelay, animationConfigs).start();
  };

  return { animations, animate };
};

// Pulse animation for attention
export const createPulseAnimation = (value: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

// Shimmer animation for skeleton loading
export const createShimmerAnimation = (value: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ])
  );
};

// Button press animation
export const createButtonPressAnimation = (
  scale: Animated.Value,
  callback?: () => void
) => {
  return Animated.sequence([
    Animated.spring(scale, {
      toValue: 0.92,
      ...SpringConfigs.stiff,
      useNativeDriver: true,
    }),
    Animated.spring(scale, {
      toValue: 1,
      ...SpringConfigs.bouncy,
      useNativeDriver: true,
    }),
  ]).start(callback);
};

// Wiggle animation for errors
export const createWiggleAnimation = (value: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(value, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: 10, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(value, { toValue: 0, duration: 50, useNativeDriver: true }),
  ]).start();
};

// Parallax scroll effect
export const createParallaxStyle = (
  scrollY: Animated.Value,
  inputRange: number[],
  outputRange: number[]
) => {
  return {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange,
          outputRange,
          extrapolate: 'clamp',
        }),
      },
    ],
  };
};

// Fade in with scale for cards
export const animateCardIn = (
  opacity: Animated.Value,
  scale: Animated.Value,
  delay: number = 0
) => {
  return Animated.parallel([
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      delay,
      easing: CustomEasing.smooth,
      useNativeDriver: true,
    }),
    Animated.spring(scale, {
      toValue: 1,
      ...SpringConfigs.gentle,
      delay,
      useNativeDriver: true,
    }),
  ]);
};

// Rotate animation for loading
export const createSpinAnimation = (value: Animated.Value) => {
  return Animated.loop(
    Animated.timing(value, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

// Progress animation
export const animateProgress = (
  value: Animated.Value,
  toValue: number,
  duration: number = 1000
) => {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: CustomEasing.smooth,
    useNativeDriver: false, // Width animations need useNativeDriver: false
  });
};

// Breathe animation for zen elements
export const createBreatheAnimation = (scale: Animated.Value) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.05,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

// Number counter animation
export const animateNumber = (
  value: Animated.Value,
  toValue: number,
  duration: number = 1000
) => {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: CustomEasing.easeInOutQuart,
    useNativeDriver: false,
  });
};

// Slide from side animation
export const createSlideFromSide = (
  translateX: Animated.Value,
  fromLeft: boolean = true,
  delay: number = 0
) => {
  translateX.setValue(fromLeft ? -100 : 100);

  return Animated.spring(translateX, {
    toValue: 0,
    ...SpringConfigs.gentle,
    delay,
    useNativeDriver: true,
  });
};

// Flip animation
export const createFlipAnimation = (
  rotateY: Animated.Value,
  duration: number = 300
) => {
  return Animated.timing(rotateY, {
    toValue: 180,
    duration,
    easing: CustomEasing.smooth,
    useNativeDriver: true,
  });
};
