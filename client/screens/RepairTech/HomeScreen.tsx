import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform, Image, ImageSourcePropType, Linking, Alert, Modal, FlatList, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Swipeable } from 'react-native-gesture-handler';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { BubbleBackground } from '@/components/BubbleBackground';
import { ChatFAB } from '@/components/ChatFAB';
import { OfflineBanner } from '@/components/OfflineBanner';
import { NotificationBanner } from '@/components/NotificationBanner';
import { BatterySaverBanner } from '@/components/BatterySaverBanner';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import { useBattery } from '@/context/BatteryContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockRouteStops, mockQueueMetrics, mockProperties } from '@/lib/mockData';
import { getLocalApiUrl, joinUrl } from '@/lib/query-client';
import { safeApiRequest, checkNetworkConnection } from '@/lib/apiHelper';
import { NewEstimateModal, OrderPartsModal, ReportIssueModal, EmergencyReportModal } from './Modals';
import type { Job } from '@/types';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProgressCardProps {
  value: number;
  label: string;
  color: string;
}

function ProgressCard({ value, label, color }: ProgressCardProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.progressCard, { backgroundColor: theme.surface }]}>
      <ThemedText style={[styles.progressValue, { color }]}>{value}</ThemedText>
      <ThemedText style={[styles.progressLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </View>
  );
}

interface QuickActionProps {
  icon?: string;
  customImage?: ImageSourcePropType;
  label: string;
  color: string;
  onPress: () => void;
}

function QuickAction({ icon, customImage, label, color, onPress }: QuickActionProps) {
  const { theme } = useTheme();
  
  return (
    <Pressable 
      style={[styles.quickAction, { backgroundColor: theme.surface }]} 
      onPress={onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
        {customImage ? (
          <Image source={customImage} style={styles.quickActionCustomImage} />
        ) : (
          <Feather name={icon as any} size={22} color={color} />
        )}
      </View>
      <ThemedText style={styles.quickActionLabel}>{label}</ThemedText>
    </Pressable>
  );
}

interface RepairJobCardProps {
  job: Job;
  isFirst: boolean;
  drag?: () => void;
  isActive?: boolean;
  onPress: () => void;
  onNavigate: () => void;
  onComplete: () => void;
  onAccept: () => void;
  onDismiss: () => void;
}

function RepairJobCard({ job, isFirst, drag, isActive, onPress, onNavigate, onComplete, onAccept, onDismiss }: RepairJobCardProps) {
  const { theme } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);
  
  const isAssessment = job.jobType === 'assessment';
  const jobTypeLabel = isAssessment ? 'ASSESSMENT' : 'APPROVED REPAIR';
  const jobTypeColor = isAssessment ? BrandColors.tropicalTeal : BrandColors.emerald;
  const borderColor = isFirst ? BrandColors.vividTangerine : (isAssessment ? BrandColors.tropicalTeal : BrandColors.emerald);

  const handleNavigate = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const address = job.property?.address;
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      const url = Platform.select({
        ios: `maps:0,0?q=${encodedAddress}`,
        android: `geo:0,0?q=${encodedAddress}`,
        default: `https://maps.google.com/?q=${encodedAddress}`,
      });
      Linking.openURL(url).catch(() => {
        Alert.alert('Navigation Error', 'Unable to open maps. Please try again.');
      });
    } else {
      Alert.alert('No Address', 'This property does not have an address on file.');
    }
  };

  const renderLeftActions = () => (
    <Pressable
      style={styles.swipeActionLeft}
      onPress={() => {
        swipeableRef.current?.close();
        handleNavigate();
      }}
    >
      <Feather name="navigation" size={20} color="#FFFFFF" />
      <ThemedText style={styles.swipeActionText}>Navigate</ThemedText>
    </Pressable>
  );

  const renderRightActions = () => (
    <View style={styles.swipeActionsRight}>
      <Pressable
        style={styles.swipeActionDetails}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          swipeableRef.current?.close();
          onPress();
        }}
      >
        <Feather name="file-text" size={20} color="#FFFFFF" />
        <ThemedText style={styles.swipeActionText}>Details</ThemedText>
      </Pressable>
      {!isAssessment ? (
        <Pressable
          style={styles.swipeActionComplete}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            swipeableRef.current?.close();
            onComplete();
          }}
        >
          <Feather name="check-circle" size={20} color="#FFFFFF" />
          <ThemedText style={styles.swipeActionText}>Complete</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
  
  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
      overshootLeft={false}
      overshootRight={false}
    >
      <Pressable
        onLongPress={drag}
        onPress={onPress}
        style={[
          styles.jobCard,
          { backgroundColor: theme.surface },
          isFirst && styles.jobCardFirst,
          isActive && styles.jobCardActive,
        ]}
      >
        <View style={[styles.jobCardBorder, { backgroundColor: borderColor }]} />
        <View style={styles.jobCardContent}>
          {/* Job Type Badge */}
          <View style={[styles.jobTypeBadge, { backgroundColor: jobTypeColor + '20' }]}>
            <Feather 
              name={isAssessment ? 'clipboard' : 'check-circle'} 
              size={12} 
              color={jobTypeColor} 
            />
            <ThemedText style={[styles.jobTypeBadgeText, { color: jobTypeColor }]}>
              {jobTypeLabel}
            </ThemedText>
          </View>
          
          <View style={styles.jobCardHeader}>
            <View style={styles.jobCardTitleRow}>
              <ThemedText style={styles.jobCardTitle}>{job.property?.name}</ThemedText>
              <ThemedText style={[styles.jobCardTime, { color: BrandColors.azureBlue }]}>{job.scheduledTime}</ThemedText>
            </View>
            <ThemedText style={[styles.jobCardType, { color: BrandColors.vividTangerine }]}>{job.title}</ThemedText>
          </View>
          <Pressable style={styles.jobCardAddress} onPress={handleNavigate}>
            <Feather name="map-pin" size={12} color={BrandColors.azureBlue} />
            <ThemedText style={[styles.jobCardAddressText, { color: BrandColors.azureBlue }]} numberOfLines={1}>
              {job.property?.address}
            </ThemedText>
            <Feather name="external-link" size={12} color={BrandColors.azureBlue} />
          </Pressable>
          {job.photos && job.photos.length > 0 ? (
            <View style={styles.jobCardPhotos}>
              {job.photos.slice(0, 3).map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.jobCardPhoto}
                />
              ))}
              {job.photos.length > 3 ? (
                <View style={[styles.jobCardPhoto, styles.jobCardPhotoMore]}>
                  <ThemedText style={styles.jobCardPhotoMoreText}>+{job.photos.length - 3}</ThemedText>
                </View>
              ) : null}
            </View>
          ) : null}
          
          {/* Accept/Dismiss Buttons for pending jobs */}
          {job.status === 'pending' ? (
            <View style={styles.jobAcceptDismissRow}>
              <Pressable 
                style={[styles.jobAcceptButton, { backgroundColor: BrandColors.emerald }]} 
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  onAccept();
                }}
              >
                <Feather name="check" size={18} color="#FFFFFF" />
                <ThemedText style={styles.jobAcceptButtonText}>Accept</ThemedText>
              </Pressable>
              <Pressable 
                style={[styles.jobDismissButton, { backgroundColor: BrandColors.danger }]} 
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  onDismiss();
                }}
              >
                <Feather name="x" size={18} color="#FFFFFF" />
                <ThemedText style={styles.jobDismissButtonText}>Dismiss</ThemedText>
              </Pressable>
            </View>
          ) : null}
          
          {/* Action Buttons */}
          <View style={styles.jobCardActions}>
            <Pressable style={[styles.jobActionButton, { backgroundColor: BrandColors.azureBlue }]} onPress={handleNavigate}>
              <Feather name="navigation" size={16} color="#FFFFFF" />
              <ThemedText style={styles.jobActionButtonText}>Navigate</ThemedText>
            </Pressable>
            <Pressable style={[styles.jobActionButton, { backgroundColor: theme.surfaceElevated }]} onPress={onPress}>
              <Feather name="file-text" size={16} color={theme.text} />
              <ThemedText style={[styles.jobActionButtonText, { color: theme.text }]}>Details</ThemedText>
            </Pressable>
          </View>
          
          {job.status === 'in_progress' && !isAssessment ? (
            <Pressable 
              style={[styles.jobPrimaryAction, { backgroundColor: BrandColors.emerald }]} 
              onPress={onComplete}
            >
              <Feather name="check-circle" size={18} color="#FFFFFF" />
              <ThemedText style={styles.jobPrimaryActionText}>Verify & Complete</ThemedText>
            </Pressable>
          ) : null}
          
          {isFirst ? (
            <View style={styles.jobCardBadge}>
              <ThemedText style={styles.jobCardBadgeText}>NEXT STOP</ThemedText>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Swipeable>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, token } = useAuth();
  const { isConnected } = useNetwork();
  const { isBatterySaverEnabled } = useBattery();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const { data: jobsData, isLoading: isLoadingJobs, refetch: refetchJobs } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const apiUrl = getLocalApiUrl();
      const response = await fetch(joinUrl(apiUrl, '/api/jobs'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
    enabled: !!token,
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [showNewEstimateModal, setShowNewEstimateModal] = useState(false);
  const [showOrderPartsModal, setShowOrderPartsModal] = useState(false);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showRepairHistoryPicker, setShowRepairHistoryPicker] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');
  const [currentNotification, setCurrentNotification] = useState<{
    id: string;
    title: string;
    message: string;
    type: 'urgent' | 'warning' | 'info';
    icon: string;
  } | null>(null);

  // Fetch urgent notifications from office
  const { data: notifications } = useQuery<any[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const apiUrl = getLocalApiUrl();
      const response = await fetch(joinUrl(apiUrl, '/api/notifications'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    enabled: !!token,
    refetchInterval: 30000, // Poll every 30 seconds for new notifications
  });

  useEffect(() => {
    if (jobsData) {
      setJobs(jobsData);
    }
  }, [jobsData]);

  // Show first unread notification
  useEffect(() => {
    if (notifications && notifications.length > 0 && !currentNotification) {
      const notif = notifications[0];
      setCurrentNotification({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type || 'info',
        icon: notif.icon || 'bell',
      });
    }
  }, [notifications]);

  const nextStop = jobs.length > 0 ? jobs[0] : null;
  const truckId = 'RT-007';

  const handleDragEnd = ({ data }: { data: Job[] }) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setJobs(data.map((job, index) => ({ ...job, order: index + 1 })));
  };

  const handleQuickAction = (action: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    switch (action) {
      case 'emergency':
        setShowEmergencyModal(true);
        break;
      case 'estimate':
        setShowNewEstimateModal(true);
        break;
      case 'parts':
        setShowOrderPartsModal(true);
        break;
      case 'issue':
        setShowReportIssueModal(true);
        break;
      case 'history':
        setShowRepairHistoryPicker(true);
        break;
    }
  };

  const handleSelectPropertyForHistory = (property: { id: string; name: string }) => {
    setShowRepairHistoryPicker(false);
    setPropertySearch('');
    navigation.navigate('RepairHistory', { propertyId: property.id, propertyName: property.name });
  };

  const filteredProperties = mockProperties.filter(p => 
    p.name.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.address?.toLowerCase().includes(propertySearch.toLowerCase())
  ).slice(0, 50);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={['#0078D4', '#0066B8', '#005499']}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerTop}>
          <Image 
            source={require('@/assets/images/breakpoint-logo.png')} 
            style={styles.headerLogo}
          />
          <View style={styles.timeBadge}>
            <Feather name="clock" size={14} color="#FFFFFF" />
            <ThemedText style={styles.timeBadgeText}>{getCurrentTime()}</ThemedText>
          </View>
          <View style={styles.truckBadge}>
            <Feather name="truck" size={14} color="#333" />
            <ThemedText style={styles.truckBadgeText}>{truckId}</ThemedText>
          </View>
        </View>
      </LinearGradient>

      {!isConnected ? <OfflineBanner /> : null}
      {isBatterySaverEnabled ? <BatterySaverBanner /> : null}

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Today's Progress</ThemedText>
            <ThemedText style={[styles.sectionSubtitle, { color: BrandColors.vividTangerine }]}>
              {jobs.filter(j => j.status === 'completed').length}/{jobs.length} repairs
            </ThemedText>
          </View>
          
          <View style={styles.progressRow}>
            <ProgressCard value={jobs.filter(j => j.status === 'completed').length} label="COMPLETED" color={BrandColors.azureBlue} />
            <ProgressCard value={mockQueueMetrics.myEstimates} label="ESTIMATES IN PROGRESS" color={BrandColors.vividTangerine} />
            <ProgressCard value={mockQueueMetrics.partsOrdered} label="PARTS ORDERED" color={BrandColors.tropicalTeal} />
          </View>
        </Animated.View>

        {nextStop ? (
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <View style={[styles.nextStopCard, { backgroundColor: theme.surface }]}>
              <View style={styles.nextStopHeader}>
                <View style={[styles.nextStopBadge, { backgroundColor: BrandColors.azureBlue }]}>
                  <ThemedText style={styles.nextStopBadgeText}>NEXT STOP</ThemedText>
                </View>
                <Feather name="droplet" size={20} color={BrandColors.tropicalTeal} />
                <View style={[styles.nextStopTime, { backgroundColor: BrandColors.vividTangerine }]}>
                  <ThemedText style={styles.nextStopTimeText}>{nextStop.scheduledTime || 'Today'}</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.nextStopName}>{nextStop.property?.name ?? nextStop.title ?? 'Unknown Property'}</ThemedText>
              <View style={styles.nextStopAddressRow}>
                <Feather name="map-pin" size={14} color={BrandColors.vividTangerine} />
                <ThemedText style={[styles.nextStopAddress, { color: theme.textSecondary }]}>
                  {nextStop.property?.address ?? 'Address unavailable'}
                </ThemedText>
              </View>
              <View style={styles.nextStopMeta}>
                <View style={[styles.propertyTypeBadge, { backgroundColor: BrandColors.vividTangerine + '20' }]}>
                  <ThemedText style={[styles.propertyTypeBadgeText, { color: BrandColors.vividTangerine }]}>
                    {(nextStop.property as any)?.type?.toUpperCase() || 'REPAIR'}
                  </ThemedText>
                </View>
                {(nextStop.property as any)?.poolCount ? (
                  <View style={styles.poolCount}>
                    <Feather name="droplet" size={14} color={BrandColors.tropicalTeal} />
                    <ThemedText style={[styles.poolCountText, { color: BrandColors.tropicalTeal }]}>
                      {(nextStop.property as any).poolCount} pools
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ThemedText style={styles.quickActionsTitle}>QUICK ACTIONS</ThemedText>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              customImage={require('@/assets/images/emergency-icon.png')}
              label="Emergency"
              color={BrandColors.danger}
              onPress={() => handleQuickAction('emergency')}
            />
            <QuickAction
              customImage={require('@/assets/images/ace-ai-button.png')}
              label=""
              color={BrandColors.azureBlue}
              onPress={() => navigation.navigate('AceEstimateBuilder')}
            />
            <QuickAction
              customImage={require('@/assets/images/order-parts-icon.png')}
              label="Order Parts"
              color={BrandColors.vividTangerine}
              onPress={() => handleQuickAction('parts')}
            />
            <QuickAction
              customImage={require('@/assets/images/report-issues-icon.png')}
              label="Report Issue"
              color={BrandColors.danger}
              onPress={() => handleQuickAction('issue')}
            />
            <QuickAction
              customImage={require('@/assets/images/repair-history-icon.png')}
              label="Repair History"
              color={BrandColors.tropicalTeal}
              onPress={() => handleQuickAction('history')}
            />
          </View>
        </Animated.View>

      </View>
    </View>
  );

  const handleNavigateToJob = async (job: Job) => {
    const address = job.property?.address;
    if (!address) {
      Alert.alert('No Address', 'This job does not have an address to navigate to.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const encodedAddress = encodeURIComponent(address);
    
    // Try platform-specific maps apps first
    let url = '';
    if (Platform.OS === 'ios') {
      // Apple Maps
      url = `maps://app?daddr=${encodedAddress}`;
    } else if (Platform.OS === 'android') {
      // Google Maps on Android
      url = `google.navigation:q=${encodedAddress}`;
    } else {
      // Web fallback - Google Maps in browser
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to Google Maps web
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Failed to open maps:', error);
      Alert.alert('Navigation Error', 'Could not open maps application. Please try again.');
    }
  };

  const handleCompleteJob = (jobId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const handleCreateEstimateFromJob = (job: Job) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('AceEstimateBuilder', { 
      propertyId: job.property?.id,
      propertyName: job.property?.name,
      jobTitle: job.title,
    });
  };

  const handleAcceptJob = async (jobId: string) => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      Alert.alert('No Connection', 'Please check your internet connection and try again.');
      return;
    }

    const result = await safeApiRequest(`/api/jobs/${jobId}/accept`, {
      method: 'PATCH',
      showAlerts: false,
    });

    if (result.success) {
      refetchJobs();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      if (result.status === 401) {
        Alert.alert('Session Expired', 'Please log in again to continue.');
      } else if (result.status === 403) {
        Alert.alert('Access Denied', 'You don\'t have permission to accept this job.');
      } else if (result.status && result.status >= 500) {
        Alert.alert('Service Unavailable', 'The server is temporarily unavailable. Please try again in a moment.');
      } else {
        Alert.alert('Error', result.error || 'Failed to accept job. Please try again.');
      }
    }
  };

  const handleDismissJob = async (jobId: string) => {
    Alert.alert(
      'Dismiss Job',
      'Are you sure you want to dismiss this job? It will be removed from your queue.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Dismiss', 
          style: 'destructive',
          onPress: async () => {
            const isConnected = await checkNetworkConnection();
            if (!isConnected) {
              Alert.alert('No Connection', 'Please check your internet connection and try again.');
              return;
            }

            const result = await safeApiRequest(`/api/jobs/${jobId}/dismiss`, {
              method: 'PATCH',
              showAlerts: false,
            });

            if (result.success) {
              refetchJobs();
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
            } else {
              if (result.status === 401) {
                Alert.alert('Session Expired', 'Please log in again to continue.');
              } else if (result.status && result.status >= 500) {
                Alert.alert('Service Unavailable', 'The server is temporarily unavailable. Please try again.');
              } else {
                Alert.alert('Error', result.error || 'Failed to dismiss job.');
              }
            }
          }
        }
      ]
    );
  };


  return (
    <BubbleBackground bubbleCount={15}>
      <NotificationBanner
        visible={!!currentNotification}
        title={currentNotification?.title || ''}
        message={currentNotification?.message || ''}
        type={currentNotification?.type || 'info'}
        icon={currentNotification?.icon || 'bell'}
        onDismiss={async () => {
          if (currentNotification?.id) {
            try {
              const apiUrl = getLocalApiUrl();
              await fetch(joinUrl(apiUrl, `/api/notifications/${currentNotification.id}/dismiss`), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
              });
            } catch (error) {
              console.error('Failed to dismiss notification:', error);
            }
          }
          setCurrentNotification(null);
        }}
      />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{
          paddingBottom: tabBarHeight + Spacing.fabSize + Spacing['2xl'],
          flexGrow: 1,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {renderHeader()}
      </ScrollView>
      <ChatFAB
        onPress={() => navigation.navigate('Chat')}
        bottom={tabBarHeight}
      />

      <NewEstimateModal
        visible={showNewEstimateModal}
        onClose={() => setShowNewEstimateModal(false)}
        onSubmit={(data) => console.log('Estimate:', data)}
      />
      <OrderPartsModal
        visible={showOrderPartsModal}
        onClose={() => setShowOrderPartsModal(false)}
        onSubmit={(data) => console.log('Parts:', data)}
      />
      <ReportIssueModal
        visible={showReportIssueModal}
        onClose={() => setShowReportIssueModal(false)}
        propertyId={nextStop?.property?.id || jobs[0]?.property?.id || 'unknown'}
        propertyName={nextStop?.property?.name || jobs[0]?.property?.name || 'Current Property'}
        bodyOfWater="Main Pool"
        technicianId={user?.id || 'unknown'}
        technicianName={user?.name || user?.email || 'Technician'}
      />
      <EmergencyReportModal
        visible={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        onSubmit={(data) => console.log('Emergency:', data)}
      />

      <Modal
        visible={showRepairHistoryPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRepairHistoryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.repairHistoryModal, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Property</ThemedText>
              <Pressable onPress={() => setShowRepairHistoryPicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
              <Feather name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search properties..."
                placeholderTextColor={theme.textSecondary}
                value={propertySearch}
                onChangeText={setPropertySearch}
              />
            </View>
            <FlatList
              data={filteredProperties}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.propertyItem, { borderBottomColor: theme.border }]}
                  onPress={() => handleSelectPropertyForHistory(item)}
                >
                  <View style={styles.propertyItemContent}>
                    <ThemedText style={styles.propertyItemName}>{item.name}</ThemedText>
                    <ThemedText style={[styles.propertyItemAddress, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.address}
                    </ThemedText>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptySearch}>
                  <Feather name="search" size={32} color={theme.textSecondary} />
                  <ThemedText style={[styles.emptySearchText, { color: theme.textSecondary }]}>
                    No properties found
                  </ThemedText>
                </View>
              }
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  jobsContainer: {
    paddingHorizontal: Spacing.screenPadding,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  timeBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  truckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  truckBadgeText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    marginTop: -Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  progressCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  progressValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  nextStopCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  nextStopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  nextStopBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: 'auto',
  },
  nextStopBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nextStopTime: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.md,
  },
  nextStopTimeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  nextStopName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  nextStopAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  nextStopAddress: {
    fontSize: 14,
    flex: 1,
  },
  nextStopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  propertyTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  propertyTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  poolCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  poolCountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickAction: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  quickActionIcon: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  quickActionCustomImage: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  todaysJobsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  reorderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  reorderText: {
    fontSize: 12,
    fontWeight: '500',
  },
  jobCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  jobCardFirst: {
    borderWidth: 2,
    borderColor: BrandColors.vividTangerine,
  },
  jobCardActive: {
    opacity: 0.95,
  },
  jobCardBorder: {
    width: 4,
  },
  jobCardContent: {
    flex: 1,
    padding: Spacing.md,
  },
  jobCardHeader: {
    marginBottom: Spacing.xs,
  },
  jobCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  jobCardTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  jobCardType: {
    fontSize: 13,
    fontWeight: '500',
  },
  jobCardAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  jobCardAddressText: {
    fontSize: 13,
    flex: 1,
  },
  jobCardPhotos: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  jobCardPhoto: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#E5E7EB',
  },
  jobCardPhotoMore: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.azureBlue + '20',
  },
  jobCardPhotoMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.azureBlue,
  },
  jobCardBadge: {
    position: 'absolute',
    top: -Spacing.md - 2,
    left: Spacing.sm,
    backgroundColor: BrandColors.vividTangerine,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  jobCardBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  swipeActionLeft: {
    backgroundColor: BrandColors.azureBlue,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    marginVertical: Spacing.xs,
    marginLeft: Spacing.screenPadding,
    borderRadius: BorderRadius.md,
  },
  swipeActionsRight: {
    flexDirection: 'row',
    marginVertical: Spacing.xs,
    marginRight: Spacing.screenPadding,
    gap: Spacing.xs,
  },
  swipeActionDetails: {
    backgroundColor: BrandColors.tropicalTeal,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: BorderRadius.md,
  },
  swipeActionComplete: {
    backgroundColor: BrandColors.emerald,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: BorderRadius.md,
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  swipeHintText: {
    fontSize: 11,
    fontWeight: '500',
  },
  jobTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  jobTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  jobCardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  jobActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  jobActionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  jobAcceptDismissRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  jobAcceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  jobAcceptButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  jobDismissButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  jobDismissButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  jobPrimaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  jobPrimaryActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyJobsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing['2xl'],
  },
  emptyJobsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: Spacing.md,
  },
  emptyJobsText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  repairHistoryModal: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    paddingBottom: Spacing['2xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.screenPadding,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  propertyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  propertyItemContent: {
    flex: 1,
  },
  propertyItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  propertyItemAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  emptySearch: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptySearchText: {
    fontSize: 14,
    marginTop: Spacing.md,
  },
});
