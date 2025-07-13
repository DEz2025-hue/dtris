import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Database, Download, AlertTriangle } from 'lucide-react-native';

interface DatabaseSetupGuideProps {
  onRetry?: () => void;
}

export function DatabaseSetupGuide({ onRetry }: DatabaseSetupGuideProps) {
  const handleShowInstructions = () => {
    Alert.alert(
      'Database Setup Required',
      'Your Supabase database tables are not set up. Follow these steps:\n\n' +
      '1. Go to your Supabase Dashboard\n' +
      '2. Click "SQL Editor"\n' +
      '3. Copy the content from database-setup.sql\n' +
      '4. Paste and run the migration\n' +
      '5. Create an admin user\n\n' +
      'Would you like to see the SQL content?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Show SQL', 
          onPress: () => {
            Alert.alert(
              'Database Setup SQL',
              'Copy this entire content and paste it into your Supabase SQL Editor:\n\n' +
              'CREATE TYPE user_role AS ENUM (\'owner\', \'inspector\', \'admin\');\n' +
              'CREATE TABLE users (\n' +
              '  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n' +
              '  email text UNIQUE NOT NULL,\n' +
              '  name text NOT NULL,\n' +
              '  role user_role NOT NULL DEFAULT \'owner\',\n' +
              '  phone text,\n' +
              '  address text,\n' +
              '  created_at timestamptz DEFAULT now(),\n' +
              '  updated_at timestamptz DEFAULT now()\n' +
              ');\n\n' +
              'See database-setup.sql for the complete migration.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Database size={48} color="#DC2626" />
      </View>
      
      <Text style={styles.title}>Database Not Set Up</Text>
      
      <Text style={styles.message}>
        Your ClaMax DTRIS database tables are not configured. This is required for the app to function properly.
      </Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleShowInstructions}
        >
          <Download size={20} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Setup Database</Text>
        </TouchableOpacity>
        
        {onRetry && (
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={onRetry}
          >
            <Text style={styles.secondaryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.noteContainer}>
        <AlertTriangle size={16} color="#F59E0B" />
        <Text style={styles.noteText}>
          You need admin access to your Supabase project to run the migration.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
  },
}); 