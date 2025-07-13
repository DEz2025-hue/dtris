import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Text, TouchableOpacity } from 'react-native';

// Mock the supabaseService
jest.mock('@/utils/supabaseService', () => ({
  supabaseService: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

// Mock the notifications service
jest.mock('@/utils/notifications', () => ({
  notificationService: {
    registerDeviceToken: jest.fn(),
  },
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, login, logout, isLoading, error } = useAuth();
  
  return (
    <>
      <Text testID="user-name">{user?.name || 'No user'}</Text>
      <Text testID="loading">{isLoading ? 'Loading' : 'Not loading'}</Text>
      <Text testID="error">{error || 'No error'}</Text>
      <TouchableOpacity testID="login-button" onPress={() => login('test@example.com', 'password')}>
        <Text>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="logout-button" onPress={logout}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide initial state', () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('user-name')).toHaveTextContent('No user');
    expect(getByTestId('error')).toHaveTextContent('No error');
  });

  it('should handle successful login', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'owner' as const,
      createdAt: new Date(),
    };

    require('@/utils/supabaseService').supabaseService.signIn.mockResolvedValue({
      user: { id: '123' },
    });
    require('@/utils/supabaseService').supabaseService.getCurrentUser.mockResolvedValue(mockUser);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      const loginButton = getByTestId('login-button');
      loginButton.props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('user-name')).toHaveTextContent('Test User');
    });
  });

  it('should handle login failure', async () => {
    const mockError = new Error('Invalid credentials');
    require('@/utils/supabaseService').supabaseService.signIn.mockRejectedValue(mockError);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      const loginButton = getByTestId('login-button');
      loginButton.props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('error')).toHaveTextContent('Invalid credentials');
    });
  });

  it('should handle logout', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'owner' as const,
      createdAt: new Date(),
    };

    // First login
    require('@/utils/supabaseService').supabaseService.signIn.mockResolvedValue({
      user: { id: '123' },
    });
    require('@/utils/supabaseService').supabaseService.getCurrentUser.mockResolvedValue(mockUser);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Login
    await act(async () => {
      const loginButton = getByTestId('login-button');
      loginButton.props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('user-name')).toHaveTextContent('Test User');
    });

    // Logout
    require('@/utils/supabaseService').supabaseService.signOut.mockResolvedValue(undefined);

    await act(async () => {
      const logoutButton = getByTestId('logout-button');
      logoutButton.props.onPress();
    });

    await waitFor(() => {
      expect(getByTestId('user-name')).toHaveTextContent('No user');
    });
  });

  it('should handle loading states', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'owner' as const,
      createdAt: new Date(),
    };

    // Simulate slow login
    require('@/utils/supabaseService').supabaseService.signIn.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ user: { id: '123' } }), 100))
    );
    require('@/utils/supabaseService').supabaseService.getCurrentUser.mockResolvedValue(mockUser);

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      const loginButton = getByTestId('login-button');
      loginButton.props.onPress();
    });

    // Should show loading initially
    expect(getByTestId('loading')).toHaveTextContent('Loading');

    // Wait for login to complete
    await waitFor(() => {
      expect(getByTestId('loading')).toHaveTextContent('Not loading');
      expect(getByTestId('user-name')).toHaveTextContent('Test User');
    });
  });
});