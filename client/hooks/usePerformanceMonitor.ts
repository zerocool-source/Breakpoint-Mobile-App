/**
 * Performance Monitoring Hooks
 * Track screen performance, navigation, and user interactions
 */

import { useEffect, useRef, useCallback } from 'react';
import { InteractionManager, AppState, AppStateStatus } from 'react-native';
import debugMonitor from '../utils/debugMonitor';

/**
 * Track screen mount/unmount and render time
 */
export function useScreenTracking(screenName: string) {
  const mountTime = useRef(Date.now());
  const renderComplete = useRef(false);

  useEffect(() => {
    // Log screen view
    debugMonitor.logScreenView(screenName);
    debugMonitor.logEvent('screen_mount', { screen: screenName });

    // Track time to interactive
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      if (!renderComplete.current) {
        const timeToInteractive = Date.now() - mountTime.current;
        renderComplete.current = true;

        debugMonitor.logEvent('screen_interactive', {
          screen: screenName,
          timeToInteractive,
        });

        // Log slow screen load
        if (timeToInteractive > 1000) {
          debugMonitor.logEvent('slow_screen_load', {
            screen: screenName,
            timeToInteractive,
          });
        }
      }
    });

    return () => {
      debugMonitor.logEvent('screen_unmount', {
        screen: screenName,
        sessionDuration: Date.now() - mountTime.current,
      });
      interactionPromise.cancel();
    };
  }, [screenName]);
}

/**
 * Track app state changes (foreground/background)
 */
export function useAppStateTracking() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        const prevState = appState.current;

        if (prevState.match(/inactive|background/) && nextAppState === 'active') {
          // App came to foreground
          debugMonitor.logEvent('app_foreground', {
            previousState: prevState,
          });
        } else if (nextAppState.match(/inactive|background/)) {
          // App went to background
          debugMonitor.logEvent('app_background', {
            previousState: prevState,
          });
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return appState.current;
}

/**
 * Track component render performance
 */
export function useRenderTracking(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const timeSinceLastRender = Date.now() - lastRenderTime.current;
    lastRenderTime.current = Date.now();

    // Log excessive re-renders (more than 10 in quick succession)
    if (renderCount.current > 10 && timeSinceLastRender < 100) {
      debugMonitor.logEvent('excessive_renders', {
        component: componentName,
        renderCount: renderCount.current,
        timeSinceLastRender,
      });
    }
  });

  return renderCount.current;
}

/**
 * Track async operation duration
 */
export function useOperationTracking() {
  const trackOperation = useCallback(
    async <T>(
      operationName: string,
      operation: () => Promise<T>
    ): Promise<T> => {
      const startTime = Date.now();

      try {
        const result = await operation();
        const duration = Date.now() - startTime;

        debugMonitor.logEvent('operation_complete', {
          operation: operationName,
          duration,
          success: true,
        });

        // Log slow operations
        if (duration > 2000) {
          debugMonitor.logEvent('slow_operation', {
            operation: operationName,
            duration,
          });
        }

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;

        debugMonitor.logEvent('operation_failed', {
          operation: operationName,
          duration,
          error: error.message,
        });

        debugMonitor.logError({
          type: 'js',
          message: `Operation failed: ${operationName}`,
          context: { duration, originalError: error.message },
          handled: true,
        });

        throw error;
      }
    },
    []
  );

  return { trackOperation };
}

/**
 * Track user interactions with timing
 */
export function useInteractionTracking() {
  const trackInteraction = useCallback(
    (interactionType: string, metadata?: Record<string, any>) => {
      debugMonitor.logEvent('user_interaction', {
        type: interactionType,
        timestamp: Date.now(),
        ...metadata,
      });
    },
    []
  );

  const trackButtonPress = useCallback(
    (buttonName: string, screenName?: string) => {
      debugMonitor.logEvent('button_press', {
        button: buttonName,
        screen: screenName,
        timestamp: Date.now(),
      });
    },
    []
  );

  return { trackInteraction, trackButtonPress };
}

/**
 * Memory pressure monitoring (iOS only provides this)
 */
export function useMemoryWarning() {
  useEffect(() => {
    // React Native doesn't have a direct memory warning API
    // but we can track memory-related issues through the debug monitor
    // This hook serves as a placeholder for future memory monitoring

    return () => {
      // Cleanup
    };
  }, []);
}

/**
 * Combined performance monitoring for screens
 */
export function useScreenPerformance(screenName: string) {
  useScreenTracking(screenName);
  useAppStateTracking();
  const renderCount = useRenderTracking(screenName);
  const { trackOperation } = useOperationTracking();
  const { trackInteraction, trackButtonPress } = useInteractionTracking();

  return {
    renderCount,
    trackOperation,
    trackInteraction,
    trackButtonPress,
  };
}

export default {
  useScreenTracking,
  useAppStateTracking,
  useRenderTracking,
  useOperationTracking,
  useInteractionTracking,
  useMemoryWarning,
  useScreenPerformance,
};
