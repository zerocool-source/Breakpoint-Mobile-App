import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getApiUrl } from '@/lib/query-client';
import { useAuth } from './AuthContext';
import type { Property } from '@shared/schema';

interface PropertyChannelWithProperty {
  id: string;
  userId: string;
  propertyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  property: Property;
}

interface PropertyChannelsContextType {
  channels: PropertyChannelWithProperty[];
  isLoading: boolean;
  addChannel: (propertyId: string) => Promise<void>;
  removeChannel: (propertyId: string) => Promise<void>;
  isPropertyInChannels: (propertyId: string) => boolean;
  refetch: () => void;
}

const PropertyChannelsContext = createContext<PropertyChannelsContextType | undefined>(undefined);

export function PropertyChannelsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: channels = [], isLoading, refetch } = useQuery<PropertyChannelWithProperty[]>({
    queryKey: ['/api/property-channels'],
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      await apiRequest('POST', '/api/property-channels', { propertyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-channels'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      await apiRequest('DELETE', `/api/property-channels/${propertyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-channels'] });
    },
  });

  const addChannel = useCallback(async (propertyId: string) => {
    await addMutation.mutateAsync(propertyId);
  }, [addMutation]);

  const removeChannel = useCallback(async (propertyId: string) => {
    await removeMutation.mutateAsync(propertyId);
  }, [removeMutation]);

  const isPropertyInChannels = useCallback((propertyId: string) => {
    return channels.some(c => c.propertyId === propertyId);
  }, [channels]);

  return (
    <PropertyChannelsContext.Provider
      value={{
        channels,
        isLoading,
        addChannel,
        removeChannel,
        isPropertyInChannels,
        refetch,
      }}
    >
      {children}
    </PropertyChannelsContext.Provider>
  );
}

export function usePropertyChannels() {
  const context = useContext(PropertyChannelsContext);
  if (context === undefined) {
    throw new Error('usePropertyChannels must be used within a PropertyChannelsProvider');
  }
  return context;
}
