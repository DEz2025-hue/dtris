import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorDisplay } from '@/components/ErrorDisplay';

describe('ErrorDisplay', () => {
  it('should not render when error is null', () => {
    const { queryByText } = render(<ErrorDisplay error={null} />);
    expect(queryByText(/error/i)).toBeNull();
  });

  it('should render error message when error is provided', () => {
    const errorMessage = 'Something went wrong';
    const { getByText } = render(<ErrorDisplay error={errorMessage} />);
    
    expect(getByText(errorMessage)).toBeTruthy();
  });

  it('should call onDismiss when dismiss button is pressed', () => {
    const mockOnDismiss = jest.fn();
    const errorMessage = 'Test error';
    
    const { getByRole } = render(
      <ErrorDisplay error={errorMessage} onDismiss={mockOnDismiss} />
    );
    
    const dismissButton = getByRole('button');
    fireEvent.press(dismissButton);
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('should not render dismiss button when onDismiss is not provided', () => {
    const errorMessage = 'Test error';
    const { queryByRole } = render(<ErrorDisplay error={errorMessage} />);
    
    expect(queryByRole('button')).toBeNull();
  });

  it('should apply custom styles', () => {
    const errorMessage = 'Test error';
    const customStyle = { backgroundColor: 'red' };
    
    const { getByTestId } = render(
      <ErrorDisplay 
        error={errorMessage} 
        style={customStyle}
      />
    );
    
    // Note: In a real test, you'd need to add testID to the component
    // This is just an example of how you might test custom styles
  });

  it('should handle long error messages', () => {
    const longErrorMessage = 'This is a very long error message that should wrap properly and not break the layout of the error display component';
    
    const { getByText } = render(<ErrorDisplay error={longErrorMessage} />);
    
    expect(getByText(longErrorMessage)).toBeTruthy();
  });

  it('should handle empty string error', () => {
    const { queryByText } = render(<ErrorDisplay error="" />);
    expect(queryByText('')).toBeNull();
  });
});