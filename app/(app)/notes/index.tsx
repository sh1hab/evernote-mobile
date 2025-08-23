import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Dimensions, Modal, ActivityIndicator, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';


const windowWidth = Dimensions.get('window').width;
const API_URL = process.env.EXPO_PUBLIC_API_URL;
const ITEMS_PER_PAGE = 10;

const getRandomColor = () => {
    const colors = [
        '#FFEB3B', '#FFCC80', '#FFAB91', '#FF8A65', '#FF6F61',
        '#F48FB1', '#E1BEE7', '#BBDEFB', '#B2EBF2', '#B2DFDB',
        '#C8E6C9', '#DCE775', '#FFF9C4', '#D1C4E9', '#B3E5FC',
        '#C5E1A5',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

// Add this interface near the top of your file
interface Note {
    id: number;
    title: string;
    description?: string;
    created_at: string;
}

export default function App() {
    const navigation = useNavigation();
    // Update your useState for notes
    const [notes, setNotes] = useState<Note[]>([]);
    const [noteText, setNoteText] = useState('');
    const [loading, setLoading] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    const [noteDetailsVisible, setNoteDetailsVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        loadNotes();
    }, []);



    const loadNotes = async (page = 1) => {
        // if (!hasMore && page > 1) return;
        setLoading(page === 1);
        setIsLoadingMore(page > 1);

        // console.log(page);

        try {
            let token = await AsyncStorage.getItem('token');
            token = "Bearer " + token.replace(/['"]+/g, '');

            const response = await axios.get(`${API_URL}/notes`, {
                params: { page, per_page: ITEMS_PER_PAGE },
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token,
                }
            });

            const newNotes = response.data.data;
            setHasMore(newNotes.length === ITEMS_PER_PAGE);
            setNotes(page === 1 ? newNotes : [...notes, ...newNotes]);
            setCurrentPage(page);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch notes');
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    };

    const renderNote = ({ item }) => (
        <TouchableOpacity
            style={[styles.note, { backgroundColor: getRandomColor() }]}
            onLongPress={() => deleteNote(item.id)}
            onPress={() => setSelectedNote(item)}
        >
            <Text style={styles.noteText} numberOfLines={3}>{item.title}</Text>
            <Text style={styles.noteDate}>
                {new Date(item.created_at).toLocaleDateString()}
            </Text>
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!loading) return null;
        return (
            <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color="#000" />
            </View>
        );
    };


    const addNote = async () => {
        if (!noteText.trim()) return;

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.post(`${API_URL}/notes`,
                { title: noteText, content: noteText },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    }
                }
            );
            setNotes([...notes, response.data.data]);
            setNoteText('');
        } catch (error) {
            Alert.alert('Error', 'Failed to add note');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteNote = async (id) => {
        Alert.alert(
            "Confirm Deletion",
            "Are you sure you want to delete this note?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "OK",
                    onPress: async () => {
                        try {
                            let token = await AsyncStorage.getItem('token');
                            token = "Bearer " + token.replace(/['"]+/g, '');

                            await axios.delete(`${API_URL}/notes/${id}`, {
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                }
                            });
                            setNotes(notes.filter(note => note.id !== id));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete note');
                            console.error('Error:', error);
                        }
                    }
                }
            ],
            { cancelable: true }
        );

        // try {
        //     let token = await AsyncStorage.getItem('token');
        //     token = "Bearer " + token.replace(/['"]+/g, '');

        //     await axios.delete(`${API_URL}/notes/${id}`, {
        //         headers: {
        //             'Content-Type': 'application/json',
        //             Authorization: `Bearer ${token}`,
        //         }
        //     });
        //     setNotes(notes.filter(note => note.id !== id));
        // } catch (error) {
        //     Alert.alert('Error', 'Failed to delete note');
        //     console.error('Error:', error);
        // }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            navigation.replace('Login');
        } catch (error) {
            console.error('Logout error:', error);
        }
        setMenuVisible(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="auto" />

            <View style={styles.container}>
                <StatusBar style="auto" />
                <View style={styles.header}>
                    <Text style={styles.headerText}>Notes</Text>
                    <TouchableOpacity onPress={() => setMenuVisible(true)}>
                        <Text style={styles.menuButton}>☰</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={noteText}
                        onChangeText={setNoteText}
                        placeholder="Write a note..."
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.addButton, loading && styles.disabledButton]}
                        onPress={addNote}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>+</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={notes}
                    renderItem={renderNote}
                    keyExtractor={item => item?.id?.toString() || Math.random().toString()}
                    numColumns={2}
                    contentContainerStyle={styles.notesContainer}
                    onEndReached={() => {
                        console.log("End reached, loading more notes...");
                        if (!isLoadingMore) {
                            console.log("Loading more notes...");
                            loadNotes(currentPage + 1);
                        }
                    }}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                />

                <Modal
                    transparent={true}
                    animationType="slide"
                    visible={!!selectedNote}
                    onRequestClose={() => setSelectedNote(null)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                                <Text style={styles.modalTitle}>{selectedNote?.title}</Text>
                                <Text style={styles.modalDescription}>{selectedNote?.description}</Text>

                                <Text style={styles.modalDate}>
                                    {selectedNote && new Date(selectedNote.created_at).toLocaleString()}
                                </Text>
                            </ScrollView>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setSelectedNote(null)}
                            >
                                <Text style={styles.modalCloseText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal
                    transparent={true}
                    animationType="slide"
                    visible={menuVisible}
                    onRequestClose={() => setMenuVisible(false)}
                >
                    <TouchableOpacity
                        style={styles.menuOverlay}
                        activeOpacity={1}
                        onPress={() => setMenuVisible(false)}
                    >
                        <View style={styles.menuContent}>
                            <TouchableOpacity onPress={logout}>
                                <Text style={styles.menuItem}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    menuButton: {
        fontSize: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#ffd700',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    disabledButton: {
        opacity: 0.7,
    },
    notesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        justifyContent: 'space-between',
    },
    note: {
        width: windowWidth / 2 - 20,
        padding: 15,
        margin: 5,
        borderRadius: 10,
        elevation: 3,
        minHeight: 120,
    },
    noteText: {
        fontSize: 16,
        marginBottom: 10,
    },
    noteDate: {
        fontSize: 12,
        color: '#666',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalDate: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    modalCloseButton: {
        alignSelf: 'flex-end',
        padding: 10,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        minWidth: 200,
    },
    menuItem: {
        fontSize: 18,
        padding: 10,
        textAlign: 'center',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
    },
    loadingMore: {
        width: '100%',
        paddingVertical: 15,
        alignItems: 'center',
    },
});