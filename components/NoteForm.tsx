import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface NoteFormProps {
  title: string;
  content: string;
  onTitleChange: (text: string) => void;
  onContentChange: (text: string) => void;
  onSubmit: () => void;
  submitButtonText: string;
}

export default function NoteForm({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSubmit,
  submitButtonText
}: NoteFormProps) {
  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={onTitleChange}
        placeholder="Note title..."
        placeholderTextColor="#666"
      />
      <TextInput
        style={[styles.input, styles.contentInput]}
        value={content}
        onChangeText={onContentChange}
        placeholder="Note content..."
        placeholderTextColor="#666"
        multiline
      />
      <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
        <Text style={styles.submitButtonText}>{submitButtonText}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 20,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  contentInput: {
    height: 150,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#ffd700',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});