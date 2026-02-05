/**
 * Debug Monitor - Comprehensive system health monitoring for Breakpoint Mobile App
 * Tracks all critical systems, performance metrics, and app health indicators
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical' | 'unknown';
  timestamp: string;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail' | 'unknown';
  message: string;
  duration?: number; // ms
  details?: Record<string, any>;
}

export interface AppMetrics {
  // Memory
  jsHeapSizeLimit?: number;
  jsHeapSizeUsed?: number;
  memoryWarnings: number;

  // Performance
  fps: number;
  slowFrames: number;
  frozenFrames: number;

  // Network
  apiLatency: number[];
  failedRequests: number;
  successfulRequests: number;

  // Errors
  jsErrors: ErrorLog[];
  nativeErrors: ErrorLog[];

  // Session
  sessionStart: string;
  lastActivity: string;
  screenViews: number;
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  type: 'js' | 'native' | 'network' | 'auth' | 'sync';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  handled: boolean;
}

export interface APIHealthStatus {
  endpoint: string;
  status: 'up' | 'down' | 'slow' | 'unknown';
  latency: number;
  lastCheck: string;
  errorRate: number;
}

export interface SyncStatus {
  lastSyncTime: string | null;
  pendingUploads: number;
  pendingDownloads: number;
  syncInProgress: boolean;
  lastSyncError: string | null;
  consecutiveFailures: number;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  tokenValid: boolean;
  tokenExpiresAt: string | null;
  refreshTokenValid: boolean;
  userId: string | null;
  userRole: string | null;
  lastAuthCheck: string;
}

export interface NotificationStatus {
  permissionGranted: boolean;
  pushToken: string | null;
  lastNotificationReceived: string | null;
  unreadCount: number;
  pollingActive: boolean;
  lastPollTime: string | null;
  pollErrors: number;
}

export interface StorageStatus {
  asyncStorageUsed: number;
  asyncStorageKeys: number;
  cacheSize: number;
  lastCleanup: string | null;
}

export interface DeviceInfo {
  platform: string;
  osVersion: string;
  deviceModel: string;
  appVersion: string;
  buildNumber: string;
  isEmulator: boolean;
  hasNotch: boolean;
  screenWidth: number;
  screenHeight: number;
}

// ============================================================
// DEBUG MONITOR CLASS
// ============================================================

class DebugMonitor {
  private static instance: DebugMonitor;
  private metrics: AppMetrics;
  private errors: ErrorLog[] = [];
  private apiLatencies: Map<string, number[]> = new Map();
  private isInitialized = false;
  private networkState: NetInfoState | null = null;
  private unsubscribeNetInfo: (() => void) | null = null;

  private constructor() {
    this.metrics = this.initializeMetrics();
  }

  static getInstance(): DebugMonitor {
    if (!DebugMonitor.instance) {
      DebugMonitor.instance = new DebugMonitor();
    }
    return DebugMonitor.instance;
  }

  private initializeMetrics(): AppMetrics {
    return {
      memoryWarnings: 0,
      fps: 60,
      slowFrames: 0,
      frozenFrames: 0,
      apiLatency: [],
      failedRequests: 0,
      successfulRequests: 0,
      jsErrors: [],
      nativeErrors: [],
      sessionStart: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      screenViews: 0,
    };
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Subscribe to network changes
    this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      this.networkState = state;
      this.logEvent('network_change', {
        connected: state.isConnected,
        type: state.type
      });
    });

    // Get initial network state
    this.networkState = await NetInfo.fetch();

    // Set up global error handler
    this.setupErrorHandlers();

    this.isInitialized = true;
    console.log('[DebugMonitor] Initialized');
  }

  cleanup(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
    this.isInitialized = false;
  }

  private setupErrorHandlers(): void {
    // Global JS error handler
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.logError({
        type: 'js',
        message: error.message,
        stack: error.stack,
        context: { isFatal },
        handled: false,
      });
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });

    // Unhandled promise rejections
    if (typeof global !== 'undefined') {
      const originalRejectionHandler = (global as any).onunhandledrejection;
      (global as any).onunhandledrejection = (event: any) => {
        this.logError({
          type: 'js',
          message: event?.reason?.message || 'Unhandled Promise Rejection',
          stack: event?.reason?.stack,
          context: { unhandledRejection: true },
          handled: false,
        });
        if (originalRejectionHandler) {
          originalRejectionHandler(event);
        }
      };
    }
  }

  // ============================================================
  // HEALTH CHECKS
  // ============================================================

  async runHealthChecks(): Promise<SystemHealth> {
    const checks: HealthCheck[] = [];
    let overallStatus: SystemHealth['overall'] = 'healthy';

    // 1. Network Connectivity
    checks.push(await this.checkNetworkHealth());

    // 2. API Health
    checks.push(await this.checkAPIHealth());

    // 3. Authentication
    checks.push(await this.checkAuthHealth());

    // 4. Local Storage
    checks.push(await this.checkStorageHealth());

    // 5. Sync Status
    checks.push(await this.checkSyncHealth());

    // 6. Notifications
    checks.push(await this.checkNotificationHealth());

    // 7. Performance
    checks.push(this.checkPerformanceHealth());

    // 8. Error Rate
    checks.push(this.checkErrorRateHealth());

    // Determine overall status
    const failCount = checks.filter(c => c.status === 'fail').length;
    const warnCount = checks.filter(c => c.status === 'warn').length;

    if (failCount >= 2) {
      overallStatus = 'critical';
    } else if (failCount === 1 || warnCount >= 3) {
      overallStatus = 'degraded';
    }

    return {
      overall: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async checkNetworkHealth(): Promise<HealthCheck> {
    const start = Date.now();
    const state = this.networkState || await NetInfo.fetch();

    return {
      name: 'Network Connectivity',
      status: state.isConnected ? 'pass' : 'fail',
      message: state.isConnected
        ? `Connected via ${state.type}`
        : 'No network connection',
      duration: Date.now() - start,
      details: {
        type: state.type,
        isInternetReachable: state.isInternetReachable,
        details: state.details,
      },
    };
  }

  private async checkAPIHealth(): Promise<HealthCheck> {
    const start = Date.now();
    const avgLatency = this.getAverageLatency();
    const errorRate = this.getErrorRate();

    let status: HealthCheck['status'] = 'pass';
    let message = 'API responding normally';

    if (errorRate > 0.5) {
      status = 'fail';
      message = `High error rate: ${(errorRate * 100).toFixed(1)}%`;
    } else if (errorRate > 0.1 || avgLatency > 3000) {
      status = 'warn';
      message = avgLatency > 3000
        ? `Slow API response: ${avgLatency.toFixed(0)}ms avg`
        : `Elevated error rate: ${(errorRate * 100).toFixed(1)}%`;
    }

    return {
      name: 'API Health',
      status,
      message,
      duration: Date.now() - start,
      details: {
        averageLatency: avgLatency,
        errorRate,
        totalRequests: this.metrics.successfulRequests + this.metrics.failedRequests,
        failedRequests: this.metrics.failedRequests,
      },
    };
  }

  private async checkAuthHealth(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      const token = await AsyncStorage.getItem('auth_token');
      const tokenExpiry = await AsyncStorage.getItem('token_expiry');
      const userId = await AsyncStorage.getItem('user_id');

      if (!token) {
        return {
          name: 'Authentication',
          status: 'warn',
          message: 'Not authenticated',
          duration: Date.now() - start,
        };
      }

      // Check if token is expired or expiring soon
      if (tokenExpiry) {
        const expiryDate = new Date(tokenExpiry);
        const now = new Date();
        const minutesUntilExpiry = (expiryDate.getTime() - now.getTime()) / 60000;

        if (minutesUntilExpiry < 0) {
          return {
            name: 'Authentication',
            status: 'fail',
            message: 'Token expired',
            duration: Date.now() - start,
          };
        } else if (minutesUntilExpiry < 5) {
          return {
            name: 'Authentication',
            status: 'warn',
            message: `Token expiring in ${minutesUntilExpiry.toFixed(0)} minutes`,
            duration: Date.now() - start,
          };
        }
      }

      return {
        name: 'Authentication',
        status: 'pass',
        message: `Authenticated as user ${userId?.slice(0, 8)}...`,
        duration: Date.now() - start,
        details: { userId },
      };
    } catch (error) {
      return {
        name: 'Authentication',
        status: 'fail',
        message: `Auth check failed: ${error}`,
        duration: Date.now() - start,
      };
    }
  }

  private async checkStorageHealth(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      const keys = await AsyncStorage.getAllKeys();

      // Test read/write
      const testKey = '__debug_test__';
      await AsyncStorage.setItem(testKey, 'test');
      const testValue = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);

      if (testValue !== 'test') {
        throw new Error('Storage read/write mismatch');
      }

      return {
        name: 'Local Storage',
        status: 'pass',
        message: `${keys.length} keys stored`,
        duration: Date.now() - start,
        details: { keyCount: keys.length },
      };
    } catch (error) {
      return {
        name: 'Local Storage',
        status: 'fail',
        message: `Storage error: ${error}`,
        duration: Date.now() - start,
      };
    }
  }

  private async checkSyncHealth(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      const lastSync = await AsyncStorage.getItem('last_sync_time');
      const syncErrors = await AsyncStorage.getItem('sync_error_count');
      const errorCount = parseInt(syncErrors || '0', 10);

      if (errorCount >= 5) {
        return {
          name: 'Data Sync',
          status: 'fail',
          message: `${errorCount} consecutive sync failures`,
          duration: Date.now() - start,
          details: { errorCount, lastSync },
        };
      }

      if (!lastSync) {
        return {
          name: 'Data Sync',
          status: 'warn',
          message: 'Never synced',
          duration: Date.now() - start,
        };
      }

      const lastSyncDate = new Date(lastSync);
      const minutesSinceSync = (Date.now() - lastSyncDate.getTime()) / 60000;

      if (minutesSinceSync > 30) {
        return {
          name: 'Data Sync',
          status: 'warn',
          message: `Last sync ${minutesSinceSync.toFixed(0)} minutes ago`,
          duration: Date.now() - start,
          details: { lastSync, minutesSinceSync },
        };
      }

      return {
        name: 'Data Sync',
        status: 'pass',
        message: `Last sync ${minutesSinceSync.toFixed(0)}m ago`,
        duration: Date.now() - start,
        details: { lastSync, minutesSinceSync },
      };
    } catch (error) {
      return {
        name: 'Data Sync',
        status: 'unknown',
        message: `Could not check sync status`,
        duration: Date.now() - start,
      };
    }
  }

  private async checkNotificationHealth(): Promise<HealthCheck> {
    const start = Date.now();

    try {
      const pushToken = await AsyncStorage.getItem('push_token');
      const lastPoll = await AsyncStorage.getItem('last_notification_poll');
      const pollErrors = await AsyncStorage.getItem('notification_poll_errors');
      const errorCount = parseInt(pollErrors || '0', 10);

      if (errorCount >= 3) {
        return {
          name: 'Notifications',
          status: 'warn',
          message: `Polling failing (${errorCount} errors)`,
          duration: Date.now() - start,
          details: { errorCount, pushToken: !!pushToken },
        };
      }

      if (!pushToken) {
        return {
          name: 'Notifications',
          status: 'warn',
          message: 'Push token not registered',
          duration: Date.now() - start,
        };
      }

      return {
        name: 'Notifications',
        status: 'pass',
        message: 'Push notifications active',
        duration: Date.now() - start,
        details: {
          hasPushToken: true,
          lastPoll,
        },
      };
    } catch (error) {
      return {
        name: 'Notifications',
        status: 'unknown',
        message: 'Could not check notification status',
        duration: Date.now() - start,
      };
    }
  }

  private checkPerformanceHealth(): HealthCheck {
    const slowFrameRate = this.metrics.slowFrames / Math.max(this.metrics.screenViews, 1);

    let status: HealthCheck['status'] = 'pass';
    let message = 'Performance normal';

    if (this.metrics.frozenFrames > 10 || slowFrameRate > 0.3) {
      status = 'fail';
      message = `${this.metrics.frozenFrames} frozen frames detected`;
    } else if (this.metrics.slowFrames > 50 || slowFrameRate > 0.1) {
      status = 'warn';
      message = `${this.metrics.slowFrames} slow frames detected`;
    }

    return {
      name: 'Performance',
      status,
      message,
      details: {
        fps: this.metrics.fps,
        slowFrames: this.metrics.slowFrames,
        frozenFrames: this.metrics.frozenFrames,
        memoryWarnings: this.metrics.memoryWarnings,
      },
    };
  }

  private checkErrorRateHealth(): HealthCheck {
    const recentErrors = this.errors.filter(e => {
      const errorTime = new Date(e.timestamp).getTime();
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      return errorTime > fiveMinutesAgo;
    });

    let status: HealthCheck['status'] = 'pass';
    let message = 'No recent errors';

    if (recentErrors.length > 10) {
      status = 'fail';
      message = `${recentErrors.length} errors in last 5 minutes`;
    } else if (recentErrors.length > 3) {
      status = 'warn';
      message = `${recentErrors.length} errors in last 5 minutes`;
    } else if (recentErrors.length > 0) {
      message = `${recentErrors.length} error(s) in last 5 minutes`;
    }

    return {
      name: 'Error Rate',
      status,
      message,
      details: {
        recentErrors: recentErrors.length,
        totalErrors: this.errors.length,
        lastError: this.errors[this.errors.length - 1],
      },
    };
  }

  // ============================================================
  // METRICS & LOGGING
  // ============================================================

  logApiCall(endpoint: string, duration: number, success: boolean): void {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Track latency by endpoint
    if (!this.apiLatencies.has(endpoint)) {
      this.apiLatencies.set(endpoint, []);
    }
    const latencies = this.apiLatencies.get(endpoint)!;
    latencies.push(duration);

    // Keep only last 100 latencies per endpoint
    if (latencies.length > 100) {
      latencies.shift();
    }

    this.metrics.apiLatency.push(duration);
    if (this.metrics.apiLatency.length > 1000) {
      this.metrics.apiLatency.shift();
    }

    this.metrics.lastActivity = new Date().toISOString();
  }

  logError(error: Omit<ErrorLog, 'id' | 'timestamp'>): void {
    const errorLog: ErrorLog = {
      ...error,
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.errors.push(errorLog);

    // Keep only last 500 errors
    if (this.errors.length > 500) {
      this.errors.shift();
    }

    // Also add to metrics
    if (error.type === 'js') {
      this.metrics.jsErrors.push(errorLog);
    } else if (error.type === 'native') {
      this.metrics.nativeErrors.push(errorLog);
    }

    console.error(`[DebugMonitor] Error logged:`, errorLog);
  }

  logEvent(eventName: string, data?: Record<string, any>): void {
    console.log(`[DebugMonitor] Event: ${eventName}`, data);
    this.metrics.lastActivity = new Date().toISOString();
  }

  logScreenView(screenName: string): void {
    this.metrics.screenViews++;
    this.logEvent('screen_view', { screen: screenName });
  }

  logSlowFrame(): void {
    this.metrics.slowFrames++;
  }

  logFrozenFrame(): void {
    this.metrics.frozenFrames++;
  }

  logMemoryWarning(): void {
    this.metrics.memoryWarnings++;
    this.logEvent('memory_warning', { count: this.metrics.memoryWarnings });
  }

  // ============================================================
  // GETTERS
  // ============================================================

  getMetrics(): AppMetrics {
    return { ...this.metrics };
  }

  getErrors(limit = 50): ErrorLog[] {
    return this.errors.slice(-limit);
  }

  getAverageLatency(): number {
    if (this.metrics.apiLatency.length === 0) return 0;
    const sum = this.metrics.apiLatency.reduce((a, b) => a + b, 0);
    return sum / this.metrics.apiLatency.length;
  }

  getErrorRate(): number {
    const total = this.metrics.successfulRequests + this.metrics.failedRequests;
    if (total === 0) return 0;
    return this.metrics.failedRequests / total;
  }

  getNetworkState(): NetInfoState | null {
    return this.networkState;
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    return {
      platform: Platform.OS,
      osVersion: Platform.Version?.toString() || 'unknown',
      deviceModel: Device.modelName || 'unknown',
      appVersion: Application.nativeApplicationVersion || 'unknown',
      buildNumber: Application.nativeBuildVersion || 'unknown',
      isEmulator: !Device.isDevice,
      hasNotch: Constants.statusBarHeight > 24,
      screenWidth: 0, // Set from component
      screenHeight: 0, // Set from component
    };
  }

  async getFullDiagnostics(): Promise<{
    health: SystemHealth;
    metrics: AppMetrics;
    errors: ErrorLog[];
    device: DeviceInfo;
    network: NetInfoState | null;
  }> {
    const [health, device] = await Promise.all([
      this.runHealthChecks(),
      this.getDeviceInfo(),
    ]);

    return {
      health,
      metrics: this.getMetrics(),
      errors: this.getErrors(100),
      device,
      network: this.networkState,
    };
  }

  // ============================================================
  // EXPORT & SHARE
  // ============================================================

  async exportDiagnosticsReport(): Promise<string> {
    const diagnostics = await this.getFullDiagnostics();

    const report = `
========================================
BREAKPOINT MOBILE APP - DIAGNOSTIC REPORT
Generated: ${new Date().toISOString()}
========================================

OVERALL HEALTH: ${diagnostics.health.overall.toUpperCase()}

DEVICE INFO:
- Platform: ${diagnostics.device.platform} ${diagnostics.device.osVersion}
- Device: ${diagnostics.device.deviceModel}
- App Version: ${diagnostics.device.appVersion} (${diagnostics.device.buildNumber})
- Is Emulator: ${diagnostics.device.isEmulator}

NETWORK:
- Connected: ${diagnostics.network?.isConnected}
- Type: ${diagnostics.network?.type}
- Internet Reachable: ${diagnostics.network?.isInternetReachable}

HEALTH CHECKS:
${diagnostics.health.checks.map(c => `- ${c.name}: ${c.status.toUpperCase()} - ${c.message}`).join('\n')}

PERFORMANCE METRICS:
- Session Duration: ${this.getSessionDuration()} minutes
- Screen Views: ${diagnostics.metrics.screenViews}
- Slow Frames: ${diagnostics.metrics.slowFrames}
- Frozen Frames: ${diagnostics.metrics.frozenFrames}
- Memory Warnings: ${diagnostics.metrics.memoryWarnings}

API METRICS:
- Total Requests: ${diagnostics.metrics.successfulRequests + diagnostics.metrics.failedRequests}
- Failed Requests: ${diagnostics.metrics.failedRequests}
- Error Rate: ${(this.getErrorRate() * 100).toFixed(2)}%
- Avg Latency: ${this.getAverageLatency().toFixed(0)}ms

RECENT ERRORS (Last 10):
${diagnostics.errors.slice(-10).map(e => `
[${e.timestamp}] ${e.type.toUpperCase()}: ${e.message}
${e.stack ? e.stack.split('\n').slice(0, 3).join('\n') : ''}
`).join('\n')}

========================================
END OF REPORT
========================================
    `.trim();

    return report;
  }

  private getSessionDuration(): number {
    const start = new Date(this.metrics.sessionStart).getTime();
    return Math.round((Date.now() - start) / 60000);
  }

  // ============================================================
  // RESET & CLEANUP
  // ============================================================

  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.errors = [];
    this.apiLatencies.clear();
    console.log('[DebugMonitor] Metrics reset');
  }

  async clearStoredDiagnostics(): Promise<void> {
    const keysToRemove = [
      'sync_error_count',
      'notification_poll_errors',
      '__debug_test__',
    ];
    await AsyncStorage.multiRemove(keysToRemove);
  }
}

// Export singleton instance
export const debugMonitor = DebugMonitor.getInstance();
export default debugMonitor;
