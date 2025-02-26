import React, { memo } from 'react';
import { TextInput, TextInputProps } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface OptimizedTextInputProps extends TextInputProps {
  onChangeText?: (text: string) => void;
}

const OptimizedTextInputComponent = memo(({ 
  onChangeText,
  style,
  ...props 
}: OptimizedTextInputProps) => {
  const handleTextChange = (text: string) => {
    if (onChangeText) {
      requestAnimationFrame(() => {
        onChangeText(text);
      });
    }
  };

  return (
    <TextInput
      {...props}
      style={[styles.input, style]}
      onChangeText={handleTextChange}
      autoCapitalize="none"
      autoCorrect={false}
      textAlignVertical="top"
      dense
      blurOnSubmit={false}
      enablesReturnKeyAutomatically
      returnKeyType="done"
      underlineColor="transparent"
      selectionColor="#6200ee"
      theme={{
        colors: {
          primary: '#6200ee',
        },
      }}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#fff',
    fontSize: 16,
    lineHeight: 24,
    paddingTop: 8,
    paddingBottom: 8,
    textAlign: 'left',
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
});

// Create the component with the Icon property
const OptimizedTextInput = Object.assign(OptimizedTextInputComponent, {
  Icon: TextInput.Icon
});

export default OptimizedTextInput; 