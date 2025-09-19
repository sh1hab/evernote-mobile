import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const windowWidth = Dimensions.get('window').width;

export default function App() {
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('notes');
      if (savedNotes) setNotes(JSON.parse(savedNotes));
    } catch (error) {
      Alert.alert('Error', 'Failed to load notes');
    }
  };

  const saveNotes = async (updatedNotes) => {
    try {
      await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
    } catch (error) {
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const addNote = () => {
    if (noteText.trim()) {
      const newNote = {
        id: Date.now().toString(),
        text: noteText,
        color: getRandomColor(),
        rotation: Math.random() * 10 - 5, // Random rotation between -5 and 5 degrees
      };
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      saveNotes(updatedNotes);
      setNoteText('');
    }
  };

  const deleteNote = (id) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    saveNotes(updatedNotes);
  };

  const getRandomColor = () => {
    const colors = ['#fff740', '#feff9c', '#fff98c', '#fffd7f', '#fff7ad'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.header}>Sticky Notes</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={noteText}
          onChangeText={setNoteText}
          placeholder="Write a note..."
          multiline
          maxLength={100}
        />
        <TouchableOpacity style={styles.addButton} onPress={addNote}>
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.notesContainer}>
        {notes.map(note => (
          <TouchableOpacity
            key={note.id}
            style={[
              styles.note,
              {
                backgroundColor: note.color,
                transform: [{ rotate: `${note.rotation}deg` }]
              }
            ]}
            onLongPress={() => deleteNote(note.id)}
          >
            <Text style={styles.noteText}>{note.text}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    backgroundColor: '#fff9c4',
    minHeight: 50,
  },
  addButton: {
    backgroundColor: '#ffd700',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontSize: 24,
    color: '#000',
  },
  notesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
  },
  note: {
    width: windowWidth / 2 - 30,
    padding: 15,
    margin: 5,
    minHeight: 100,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noteText: {
    fontSize: 16,
    color: '#000',
  },
});