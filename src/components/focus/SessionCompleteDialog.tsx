import React, { useState } from 'react';
import { Dialog, Portal, TextInput, Button } from 'react-native-paper';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onComplete: (notes: string) => void;
}

export default function SessionCompleteDialog({ visible, onDismiss, onComplete }: Props) {
  const [notes, setNotes] = useState('');

  const handleComplete = () => {
    onComplete(notes);
    setNotes('');
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Session Complete!</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Session Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleComplete}>Save & Continue</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
} 