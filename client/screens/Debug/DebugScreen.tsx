/**
 * DebugScreen - Comprehensive system health monitoring dashboard
 * Shows all critical systems, performance metrics, and app health
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import debugMonitor, {
  SystemHealth,
  HealthCheck,
  AppMetrics,
  ErrorLog,
  DeviceInfo,
} from '../../utils/debugMonitor';
import { NetInfoState } from '@react-native-community/netinfo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================
// TYPES
// ============================================================

interface DiagnosticsData {
  health: SystemHealth;
  metrics: AppMetrics;
  errors: ErrorLog[];
  device: DeviceInfo;
  network: NetInfoState | null;
}

// ============================================================
// COMPONENT
// ============================================================

export default function DebugScreen() {
  const { user, token } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'health' | 'metrics' | 'errors' | 'device'>('health');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Load diagnostics
  const loadDiagnostics = useCallback(async () => {
    try {
      const data = await debugMonitor.getFullDiagnostics();
      setDiagnostics(data);
    } catch (error) {
      console.error('Failed to load diagnostics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDiagnostics();

    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(loadDiagnostics, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadDiagnostics, autoRefresh]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadDiagnostics();
  }, [loadDiagnostics]);

  const handleExportReport = async () => {
    try {
      const report = await debugMonitor.exportDiagnosticsReport();
      await Share.share({
        message: report,
        title: 'Breakpoint App Diagnostics',
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export diagnostics report');
    }
  };

  const handleResetMetrics = () => {
    Alert.alert(
      'Reset Metrics',
      'This will clear all collected metrics and errors. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            debugMonitor.resetMetrics();
            loadDiagnostics();
          },
        },
      ]
    );
  };

  // ============================================================
  // RENDER FUNCTIONS
  // ============================================================

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>System Diagnostics</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setAutoRefresh(!autoRefresh)}
          >
            <Ionicons
              name={autoRefresh ? 'pause' : 'play'}
              size={20}
              color={autoRefresh ? '#10b981' : '#64748b'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleExportReport}>
            <Ionicons name="share-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Overall Status Banner */}
      {diagnostics && (
        <View style={[styles.statusBanner, getStatusBannerStyle(diagnostics.health.overall)]}>
          <Ionicons
            name={getStatusIcon(diagnostics.health.overall)}
            size={24}
            color="#fff"
          />
          <Text style={styles.statusText}>
            System Status: {diagnostics.health.overall.toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabs}>
      {(['health', 'metrics', 'errors', 'device'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
          {tab === 'errors' && diagnostics && diagnostics.errors.length > 0 && (
            <View style={styles.errorBadge}>
              <Text style={styles.errorBadgeText}>{diagnostics.errors.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderHealthTab = () => {
    if (!diagnostics) return null;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Health Checks</Text>
        <Text style={styles.sectionSubtitle}>
          Last checked: {new Date(diagnostics.health.timestamp).toLocaleTimeString()}
        </Text>

        {diagnostics.health.checks.map((check, index) => (
          <View key={index} style={styles.healthCheckCard}>
            <View style={styles.healthCheckHeader}>
              <View style={[styles.statusDot, getStatusDotStyle(check.status)]} />
              <Text style={styles.healthCheckName}>{check.name}</Text>
              {check.duration && (
                <Text style={styles.healthCheckDuration}>{check.duration}ms</Text>
              )}
            </View>
            <Text style={styles.healthCheckMessage}>{check.message}</Text>
            {check.details && (
              <View style={styles.healthCheckDetails}>
                {Object.entries(check.details).map(([key, value]) => (
                  <Text key={key} style={styles.detailItem}>
                    {key}: {JSON.stringify(value)}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderMetricsTab = () => {
    if (!diagnostics) return null;
    const { metrics } = diagnostics;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>

        {/* Session Info */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsCardTitle}>Session</Text>
          <View style={styles.metricsRow}>
            <MetricItem label="Started" value={new Date(metrics.sessionStart).toLocaleTimeString()} />
            <MetricItem label="Screen Views" value={metrics.screenViews.toString()} />
          </View>
        </View>

        {/* API Performance */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsCardTitle}>API Performance</Text>
          <View style={styles.metricsRow}>
            <MetricItem
              label="Avg Latency"
              value={`${debugMonitor.getAverageLatency().toFixed(0)}ms`}
            />
            <MetricItem
              label="Error Rate"
              value={`${(debugMonitor.getErrorRate() * 100).toFixed(1)}%`}
              warn={debugMonitor.getErrorRate() > 0.1}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricItem label="Successful" value={metrics.successfulRequests.toString()} />
            <MetricItem
              label="Failed"
              value={metrics.failedRequests.toString()}
              warn={metrics.failedRequests > 0}
            />
          </View>
        </View>

        {/* Frame Performance */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsCardTitle}>Frame Performance</Text>
          <View style={styles.metricsRow}>
            <MetricItem label="FPS" value={metrics.fps.toString()} />
            <MetricItem
              label="Slow Frames"
              value={metrics.slowFrames.toString()}
              warn={metrics.slowFrames > 50}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricItem
              label="Frozen Frames"
              value={metrics.frozenFrames.toString()}
              warn={metrics.frozenFrames > 5}
            />
            <MetricItem
              label="Memory Warnings"
              value={metrics.memoryWarnings.toString()}
              warn={metrics.memoryWarnings > 0}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleResetMetrics}>
          <Ionicons name="refresh" size={16} color="#ef4444" />
          <Text style={styles.resetButtonText}>Reset Metrics</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderErrorsTab = () => {
    if (!diagnostics) return null;
    const { errors } = diagnostics;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Error Log</Text>
        <Text style={styles.sectionSubtitle}>
          {errors.length} error(s) recorded this session
        </Text>

        {errors.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            <Text style={styles.emptyStateText}>No errors recorded</Text>
          </View>
        ) : (
          errors.slice().reverse().map((error) => (
            <View key={error.id} style={styles.errorCard}>
              <View style={styles.errorHeader}>
                <View style={[styles.errorTypeBadge, getErrorTypeBadgeStyle(error.type)]}>
                  <Text style={styles.errorTypeText}>{error.type.toUpperCase()}</Text>
                </View>
                <Text style={styles.errorTime}>
                  {new Date(error.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.errorMessage}>{error.message}</Text>
              {error.stack && (
                <Text style={styles.errorStack} numberOfLines={4}>
                  {error.stack}
                </Text>
              )}
              {!error.handled && (
                <View style={styles.unhandledBadge}>
                  <Text style={styles.unhandledText}>Unhandled</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>
    );
  };

  const renderDeviceTab = () => {
    if (!diagnostics) return null;
    const { device, network } = diagnostics;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Device Information</Text>

        <View style={styles.deviceCard}>
          <Text style={styles.deviceCardTitle}>App Info</Text>
          <DeviceInfoRow label="Version" value={device.appVersion} />
          <DeviceInfoRow label="Build" value={device.buildNumber} />
          <DeviceInfoRow label="Platform" value={`${device.platform} ${device.osVersion}`} />
        </View>

        <View style={styles.deviceCard}>
          <Text style={styles.deviceCardTitle}>Hardware</Text>
          <DeviceInfoRow label="Device" value={device.deviceModel} />
          <DeviceInfoRow label="Emulator" value={device.isEmulator ? 'Yes' : 'No'} />
        </View>

        <View style={styles.deviceCard}>
          <Text style={styles.deviceCardTitle}>Network</Text>
          <DeviceInfoRow label="Connected" value={network?.isConnected ? 'Yes' : 'No'} />
          <DeviceInfoRow label="Type" value={network?.type || 'Unknown'} />
          <DeviceInfoRow
            label="Internet"
            value={network?.isInternetReachable ? 'Reachable' : 'Not Reachable'}
          />
        </View>

        <View style={styles.deviceCard}>
          <Text style={styles.deviceCardTitle}>User Session</Text>
          <DeviceInfoRow label="User ID" value={user?.id?.slice(0, 12) + '...' || 'Not logged in'} />
          <DeviceInfoRow label="Role" value={user?.role || 'N/A'} />
          <DeviceInfoRow label="Token" value={token ? 'Present' : 'Missing'} />
        </View>
      </View>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0891b2" />
          <Text style={styles.loadingText}>Running diagnostics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'health' && renderHealthTab()}
        {activeTab === 'metrics' && renderMetricsTab()}
        {activeTab === 'errors' && renderErrorsTab()}
        {activeTab === 'device' && renderDeviceTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function MetricItem({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, warn && styles.metricValueWarn]}>{value}</Text>
    </View>
  );
}

function DeviceInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.deviceInfoRow}>
      <Text style={styles.deviceInfoLabel}>{label}</Text>
      <Text style={styles.deviceInfoValue}>{value}</Text>
    </View>
  );
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getStatusBannerStyle(status: SystemHealth['overall']) {
  switch (status) {
    case 'healthy':
      return { backgroundColor: '#10b981' };
    case 'degraded':
      return { backgroundColor: '#f59e0b' };
    case 'critical':
      return { backgroundColor: '#ef4444' };
    default:
      return { backgroundColor: '#64748b' };
  }
}

function getStatusIcon(status: SystemHealth['overall']) {
  switch (status) {
    case 'healthy':
      return 'checkmark-circle';
    case 'degraded':
      return 'warning';
    case 'critical':
      return 'alert-circle';
    default:
      return 'help-circle';
  }
}

function getStatusDotStyle(status: HealthCheck['status']) {
  switch (status) {
    case 'pass':
      return { backgroundColor: '#10b981' };
    case 'warn':
      return { backgroundColor: '#f59e0b' };
    case 'fail':
      return { backgroundColor: '#ef4444' };
    default:
      return { backgroundColor: '#64748b' };
  }
}

function getErrorTypeBadgeStyle(type: ErrorLog['type']) {
  switch (type) {
    case 'js':
      return { backgroundColor: '#f59e0b' };
    case 'native':
      return { backgroundColor: '#ef4444' };
    case 'network':
      return { backgroundColor: '#3b82f6' };
    case 'auth':
      return { backgroundColor: '#8b5cf6' };
    case 'sync':
      return { backgroundColor: '#06b6d4' };
    default:
      return { backgroundColor: '#64748b' };
  }
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 14,
  },

  // Header
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  statusText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0891b2',
  },
  tabText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#0891b2',
  },
  errorBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  errorBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  tabContent: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: -8,
  },

  // Health Checks
  healthCheckCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
  },
  healthCheckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  healthCheckName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  healthCheckDuration: {
    fontSize: 12,
    color: '#64748b',
  },
  healthCheckMessage: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 20,
  },
  healthCheckDetails: {
    marginTop: 8,
    marginLeft: 20,
    padding: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
  },
  detailItem: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // Metrics
  metricsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
  },
  metricsCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0891b2',
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricItem: {
    flex: 1,
    padding: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    marginVertical: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  metricValueWarn: {
    color: '#f59e0b',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  resetButtonText: {
    color: '#ef4444',
    fontWeight: '600',
  },

  // Errors
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  errorTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  errorTypeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  errorTime: {
    fontSize: 12,
    color: '#64748b',
  },
  errorMessage: {
    fontSize: 13,
    color: '#fff',
    marginBottom: 4,
  },
  errorStack: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 4,
  },
  unhandledBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unhandledText: {
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '600',
  },

  // Device
  deviceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
  },
  deviceCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0891b2',
    marginBottom: 8,
  },
  deviceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  deviceInfoLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  deviceInfoValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
});
