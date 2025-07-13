import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, X } from 'lucide-react-native';

interface ErrorDisplayProps {
  error: string | null;
  onDismiss?: () => void;
  style?: any;
}

export function ErrorDisplay({ error, onDismiss, style }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        <AlertTriangle size={20} color="#DC2626" />
        <Text style={styles.errorText}>{error}</Text>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <X size={16} color="#DC2626" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#DC2626',
    lineHeight: 20,
  },
  dismissButton: {
    padding: 4,
  },
});