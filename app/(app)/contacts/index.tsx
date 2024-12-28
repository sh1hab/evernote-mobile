import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput,
    Image,
    FlatList,
    StatusBar,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { contactsApi } from '../../services/api';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Contact {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    group?: string;
    favorite?: boolean;
    photo?: string | null;
}

const Contacts = () => {
   

    const [contacts, setContacts] = useState<Contact[]>([]);

    const fetchContacts = async () => {
        console.log('Starting fetch...');

        try {
            const token = await AsyncStorage.getItem('token');

            const response = await axios.get(
                'https://b967-103-120-32-51.ngrok-free.app/api/v1/contacts',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer 676fd6a19aaa021cc20f709f|L0VMy45lS0bOcKO13Ann52MZUAq3nVmhmmbZf72U5538aa9b
`
                    }
                }
            );

            console.log('Response:', response.data);
            setContacts(response.data.data);
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to fetch contacts');
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const [searchQuery, setSearchQuery] = useState('');
    const [showAddContact, setShowAddContact] = useState(false);
    const [showContactDetail, setShowContactDetail] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [editMode, setEditMode] = useState(false);

    const groups = ['All', 'Family', 'Work', 'Friends', 'Favorites'];
    const [selectedGroup, setSelectedGroup] = useState('All');

    const [newContact, setNewContact] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        group: 'Family',
        favorite: false,
        photo: null,
    });

    const filteredContacts = React.useMemo(() => {
        return (contacts || []).filter(contact => {
            const matchesSearch =
                (contact.firstName + ' ' + contact.lastName)
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                contact.phone.includes(searchQuery) ||
                contact.email.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesGroup =
                selectedGroup === 'All' ||
                contact.group === selectedGroup ||
                (selectedGroup === 'Favorites' && contact.favorite);

            return matchesSearch && matchesGroup;
        });
    }, [contacts, searchQuery, selectedGroup]);

    const saveContact = () => {
        if (editMode && selectedContact) {
            setContacts(contacts.map(c =>
                c.id === selectedContact.id
                    ? { ...newContact, id: selectedContact.id }
                    : c
            ));
        } else {
            setContacts([...contacts, { ...newContact, id: Date.now().toString() }]);
        }
        setShowAddContact(false);
        setNewContact({
            firstName: '',
            lastName: '',
            phone: '',
            email: '',
            group: 'Family',
            favorite: false,
            photo: null,
        });
        setEditMode(false);
    };

    const deleteContact = (contactId) => {
        setContacts(contacts.filter(c => c.id !== contactId));
        setShowContactDetail(false);
    };

    const editContact = (contact) => {
        setNewContact({ ...contact });
        setEditMode(true);
        setShowAddContact(true);
        setShowContactDetail(false);
    };

    const toggleFavorite = (contactId) => {
        setContacts(contacts.map(c =>
            c.id === contactId ? { ...c, favorite: !c.favorite } : c
        ));
    };

    const ContactListItem = ({ contact }) => (
        <TouchableOpacity
            style={styles.contactItem}
            onPress={() => {
                setSelectedContact(contact);
                setShowContactDetail(true);
            }}
        >
            <View style={styles.contactPhoto}>
                {contact.photo ? (
                    <Image source={{ uri: contact.photo }} style={styles.photoImage} />
                ) : (
                    <Text style={styles.photoPlaceholder}>
                        {contact.name}
                    </Text>
                )}
            </View>
            <View style={styles.contactInfo}>
                <Text style={styles.contactName}>
                {contact.name}
                </Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
            </View>
            <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(contact.id)}
            >
                <Ionicons
                    name={contact.favorite ? "star" : "star-outline"}
                    size={24}
                    color={contact.favorite ? "#FFD700" : "#666"}
                />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const ContactForm = () => (
        <View style={styles.form}>
            <TextInput
                style={styles.input}
                placeholder="First Name"
                value={newContact.firstName}
                onChangeText={(text) => setNewContact({ ...newContact, firstName: text })}
            />
            <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={newContact.lastName}
                onChangeText={(text) => setNewContact({ ...newContact, lastName: text })}
            />
            <TextInput
                style={styles.input}
                placeholder="Phone"
                value={newContact.phone}
                onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
                keyboardType="phone-pad"
            />
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={newContact.email}
                onChangeText={(text) => setNewContact({ ...newContact, email: text })}
                keyboardType="email-address"
            />

            <View style={styles.groupSelector}>
                <Text style={styles.groupLabel}>Group:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {groups.slice(1).map((group) => (
                        <TouchableOpacity
                            key={group}
                            style={[
                                styles.groupChip,
                                newContact.group === group && styles.selectedGroupChip,
                            ]}
                            onPress={() => setNewContact({ ...newContact, group: group })}
                        >
                            <Text style={[
                                styles.groupChipText,
                                newContact.group === group && styles.selectedGroupChipText,
                            ]}>
                                {group}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Contacts</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        setEditMode(false);
                        setShowAddContact(true);
                    }}
                >
                    <Ionicons name="add" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Groups */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.groupsContainer}
            >
                {groups.map((group) => (
                    <TouchableOpacity
                        key={group}
                        style={[
                            styles.groupChip,
                            selectedGroup === group && styles.selectedGroupChip,
                        ]}
                        onPress={() => setSelectedGroup(group)}
                    >
                        <Text style={[
                            styles.groupChipText,
                            selectedGroup === group && styles.selectedGroupChipText,
                        ]}>
                            {group}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Contacts List */}
            <FlatList
                data={filteredContacts}
                renderItem={({ item }) => <ContactListItem contact={item} />}
                keyExtractor={(item) => item.id}
                style={styles.contactsList}
            />

            {/* Add/Edit Contact Modal */}
            <Modal
                visible={showAddContact}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editMode ? 'Edit Contact' : 'New Contact'}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowAddContact(false)}
                            >
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            <ContactForm />
                        </ScrollView>
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowAddContact(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={saveContact}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Contact Detail Modal */}
            <Modal
                visible={showContactDetail}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedContact && (
                            <>
                                <View style={styles.modalHeader}>
                                    <TouchableOpacity
                                        onPress={() => setShowContactDetail(false)}
                                    >
                                        <Ionicons name="arrow-back" size={24} color="#000" />
                                    </TouchableOpacity>
                                    <View style={styles.detailActions}>
                                        <TouchableOpacity
                                            style={styles.editButton}
                                            onPress={() => editContact(selectedContact)}
                                        >
                                            <Ionicons name="create" size={24} color="#007AFF" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.deleteButton}
                                            onPress={() => deleteContact(selectedContact.id)}
                                        >
                                            <Ionicons name="trash" size={24} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <ScrollView style={styles.detailContent}>
                                    <View style={styles.detailPhoto}>
                                        {selectedContact.photo ? (
                                            <Image
                                                source={{ uri: selectedContact.photo }}
                                                style={styles.detailPhotoImage}
                                            />
                                        ) : (
                                            <Text style={styles.detailPhotoPlaceholder}>
                                                {selectedContact.firstName[0]}{selectedContact.lastName[0]}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={styles.detailName}>
                                        {selectedContact.firstName} {selectedContact.lastName}
                                    </Text>
                                    <View style={styles.detailGroup}>
                                        <Text style={styles.groupBadge}>{selectedContact.group}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="call" size={24} color="#007AFF" />
                                        <Text style={styles.detailText}>{selectedContact.phone}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="mail" size={24} color="#007AFF" />
                                        <Text style={styles.detailText}>{selectedContact.email}</Text>
                                    </View>
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#FFF',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    addButton: {
        padding: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        padding: 12,
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E9F0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    groupsContainer: {
        paddingHorizontal: 10,
        marginBottom: 6,
    },
    groupChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E9F0',
    },
    selectedGroupChip: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    groupChipText: {
        color: '#666',
    },
    selectedGroupChipText: {
        color: '#FFF',
    },
    contactsList: {
        flex: 1,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E9F0',
    },
    contactPhoto: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    photoPlaceholder: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    contactInfo: {
        flex: 1,
        marginLeft: 16,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
    },
    contactPhone: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    favoriteButton: {
        padding: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E9F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    closeButton: {
        padding: 8,
    },
    form: {
        padding: 16,
    },
    input: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#F8F9FB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E9F0',
    },

});

export default Contacts;


