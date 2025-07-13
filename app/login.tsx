import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { createTestUsers, getTestCredentials } from '@/utils/devUtils';
import { config } from '@/utils/config';
import { LogIn, User, Lock } from 'lucide-react-native';
import { analytics } from '@/utils/analytics';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isCreatingUsers, setIsCreatingUsers] = useState(false);
  const [showDevTools, setShowDevTools] = useState(config.platform.isDevelopment);
  const { login, isLoading, error } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }

    setLocalError(null);
    const success = await login(email, password);
    if (success) {
      analytics.track('user_login', { email });
      router.replace('/(tabs)');
    } else {
      analytics.track('user_login_failed', { email });
    }
  };

  const fillDemoCredentials = (role: 'owner' | 'inspector' | 'admin') => {
    const testCredentials = getTestCredentials();
    const userCred = testCredentials.find(cred => cred.role === role);
    
    if (userCred) {
      setEmail(userCred.email);
      setPassword(userCred.password);
    }
    setLocalError(null);
  };

  const handleCreateTestUsers = async () => {
    if (!config.platform.isDevelopment) {
      setLocalError('Test user creation is only available in development mode');
      return;
    }

    setIsCreatingUsers(true);
    setLocalError(null);

    try {
      const result = await createTestUsers();
      
      if (result.success > 0) {
        setLocalError(null);
        // Show success message
        console.log(`✅ Created ${result.success} test users successfully!`);
      }
      
      if (result.errors.length > 0) {
        setLocalError(`Some users already exist or failed to create: ${result.errors.length} errors`);
      }
    } catch (error: any) {
      setLocalError(`Failed to create test users: ${error.message}`);
    } finally {
      setIsCreatingUsers(false);
    }
  };
  const displayError = localError || error;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <LogIn size={40} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.title}>ClaMax DTRIS</Text>
          <Text style={styles.subtitle}>Digital Transportation Registration & Inspection System</Text>
          <Text style={styles.country}>Republic of Liberia</Text>
        </View>

        <View style={styles.form}>
          <ErrorDisplay 
            error={displayError} 
            onDismiss={() => setLocalError(null)} 
          />

          <View style={styles.inputContainer}>
            <User size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#9CA3AF"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#9CA3AF"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => router.push('/auth/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Demo Accounts</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.demoButtons}>
            <TouchableOpacity 
              style={[styles.demoButton, isLoading && styles.demoButtonDisabled]}
              onPress={() => fillDemoCredentials('owner')}
              disabled={isLoading}
            >
              <Text style={styles.demoButtonText}>Vehicle Owner (john.doe@example.com)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.demoButton, isLoading && styles.demoButtonDisabled]}
              onPress={() => fillDemoCredentials('inspector')}
              disabled={isLoading}
            >
              <Text style={styles.demoButtonText}>Inspector (inspector@dtris.gov.lr)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.demoButton, isLoading && styles.demoButtonDisabled]}
              onPress={() => fillDemoCredentials('admin')}
              disabled={isLoading}
            >
              <Text style={styles.demoButtonText}>Admin (admin@dtris.gov.lr)</Text>
            </TouchableOpacity>
          </View>

          {showDevTools && (
            <View style={styles.devSection}>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Development Tools</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                style={[styles.createUsersButton, isCreatingUsers && styles.createUsersButtonDisabled]}
                onPress={handleCreateTestUsers}
                disabled={isCreatingUsers || isLoading}
              >
                <Text style={styles.createUsersButtonText}>
                  {isCreatingUsers ? 'Creating Test Users...' : 'Create Test Users in Database'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.devNote}>
                This will create the demo accounts in your Supabase database.{'\n'}
                Password for all accounts: demo123
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ministry of Transport - Republic of Liberia</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#1E40AF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  country: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#F59E0B',
    fontWeight: '600',
  },
  form: {
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  loginButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#1E40AF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  demoButtons: {
    gap: 12,
  },
  demoButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  demoButtonDisabled: {
    opacity: 0.5,
  },
  demoButtonText: {
    color: '#1F2937',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  devSection: {
    marginTop: 24,
  },
  createUsersButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  createUsersButtonDisabled: {
    opacity: 0.5,
  },
  createUsersButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  devNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});