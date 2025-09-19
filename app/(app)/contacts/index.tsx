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
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface Contact {
    id: string;
    name: string;
    phone: string;
    email: string;
    group?: string;
    favorite?: boolean;
    photo?: string | null;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const ITEMS_PER_PAGE = 10;


const ContactDetailModal = ({ contact, onClose, onEdit, onDelete }) => {
    if (!contact) return null;

    const handleClose = () => {
        onClose();
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const handlePhonePress = () => {
        // Replace with your phone call logic
        if (contact.phone) {
            Linking.openURL(`tel:${contact.phone}`);
        }
    };

    const handleEmailPress = () => {
        // Replace with your email logic
        if (contact.email) {
            Linking.openURL(`mailto:${contact.email}`);
        }

    };

    return (
        <Modal
            visible={!!contact}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#007AFF" />
                        </TouchableOpacity>
                        <View style={styles.headerActions}>
                            <TouchableOpacity onPress={onEdit} style={styles.headerButton}>
                                <Ionicons name="create-outline" size={24} color="#007AFF" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onDelete} style={styles.headerButton}>
                                <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Contact Info */}
                    <ScrollView style={styles.detailContent}>
                        <View style={styles.profileSection}>
                            <View style={styles.profilePhotoContainer}>
                                {contact.photo ? (
                                    <Image source={{ uri: contact.photo }} style={styles.profilePhoto} />
                                ) : (
                                    <View style={styles.initialsContainer}>
                                        <Text style={styles.initialsText}>{getInitials(contact.name)}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.profileName}>{contact.name}</Text>
                            {contact.group && (
                                <View style={styles.groupBadge}>
                                    <Text style={styles.groupText}>{contact.group}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.detailSection}>
                            <TouchableOpacity style={styles.detailRow} onPress={handlePhonePress}>
                                <View style={styles.detailIconContainer}>
                                    <Ionicons name="call" size={24} color="#007AFF" />
                                </View>
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Phone</Text>
                                    <Text style={styles.detailValue}>{contact.phone}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.detailRow} onPress={handleEmailPress}>
                                <View style={styles.detailIconContainer}>
                                    <Ionicons name="mail" size={24} color="#007AFF" />
                                </View>
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Email</Text>
                                    <Text style={styles.detailValue}>{contact.email}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.detailRow}>
                                <View style={styles.detailIconContainer}>
                                    <Ionicons name="home" size={24} color="#007AFF" />
                                </View>
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Address</Text>
                                    <Text style={styles.detailValue}>{contact.address}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.detailRow}>
                                <View style={styles.detailIconContainer}>
                                    <Ionicons name="" size={24} color="#007AFF" />
                                </View>
                                <View style={styles.detailTextContainer}>
                                    <Text style={styles.detailLabel}>Notes</Text>
                                    <Text style={styles.detailValue}>{contact.notes}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
                            </TouchableOpacity>

                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.messageButton}>
                            <Ionicons name="chatbubble" size={20} color="#FFF" />
                            <Text style={styles.buttonText}>Message</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.callButton}>
                            <Ionicons name="call" size={20} color="#FFF" />
                            <Text style={styles.buttonText}>Call</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const Contacts = () => {

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Call fetchContacts on component mount
    useEffect(() => {
        const loadContacts = async () => {
            const cachedContacts = await AsyncStorage.getItem('contacts');
            if (cachedContacts) {
                setContacts(JSON.parse(cachedContacts));
            }
            fetchContacts();
        };
        loadContacts();
    }, []);


    const fetchContacts = async (page = 1) => {
        // console.log('Starting fetch...');
        // console.log('Current page:', page);

        try {
            let token = await AsyncStorage.getItem('token');
            token = "Bearer " + token.replace(/['"]+/g, '');

            const response = await axios.get(`${API_URL}/contacts`,
                {
                    params: { page, per_page: ITEMS_PER_PAGE },
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    }
                }
            );

            // setContacts(response.data.data);
            const newContacts = response.data.data;
            // console.log(newContacts);

            // Save contacts to AsyncStorage
            await AsyncStorage.setItem('contacts', JSON.stringify(newContacts));

            setContacts(page === 1 ? newContacts : [...contacts, ...newContacts]);
            setHasMore(newContacts.length === ITEMS_PER_PAGE);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error:', error);
            setError('Failed to fetch contacts');

            const cachedContacts = await AsyncStorage.getItem('contacts');
            if (cachedContacts) {
                setContacts(JSON.parse(cachedContacts));
            }
        }
    };


    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchField, setShowSearchField] = useState(false);
    const [showGroups, setShowGroups] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const [showContactDetail, setShowContactDetail] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [editMode, setEditMode] = useState(false);

    const groups = ['All', 'Family', 'Work', 'Friends', 'Favorites'];
    const [selectedGroup, setSelectedGroup] = useState('All');

    const [newContact, setNewContact] = useState({
        name: '',
        phone: '',
        email: '',
        group: 'Family',
        favorite: false,
        photo: null,
        address: '',
        work_or_education: '',
        notes: ''
    });

    const filteredContacts = React.useMemo(() => {
        return (contacts || []).filter(contact => {
            const matchesSearch = searchQuery.toLowerCase().trim() === '' || (
                (contact?.name?.toLowerCase()?.includes(searchQuery.toLowerCase()) || false) ||
                (contact?.phone?.includes(searchQuery) || false) ||
                (contact?.email?.toLowerCase()?.includes(searchQuery.toLowerCase()) || false)
            );

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
            name: '',
            phone: '',
            email: '',
            group: 'Family',
            favorite: false,
            photo: null,
        });
        setEditMode(false);
    };

    const deleteContact = async (contact) => {
        try {
            // Show confirmation alert
            Alert.alert(
                "Delete Contact",
                `Are you sure you want to delete ${contact.name}?`,
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            // Get token
                            let token = await AsyncStorage.getItem('token');
                            token = "Bearer " + token.replace(/['"]+/g, '');

                            // Make API call to delete
                            await axios.delete(`${API_URL}/contacts/${contact.id}`, {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': token
                                }
                            });

                            // Update local state
                            setContacts(contacts.filter(c => c.id !== contact.id));

                            // Close the contact detail modal
                            setShowContactDetail(false);
                            setSelectedContact(null);

                            // Show success message
                            Alert.alert('Success', 'Contact deleted successfully');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error deleting contact:', error);
            Alert.alert('Error', 'Failed to delete contact');
        }
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
                <Text style={styles.contactPhone}>{contact.address}</Text>
                <Text style={styles.contactPhone}>{contact.notes}</Text>

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
                placeholder="Name"
                value={newContact.name}
                onChangeText={(text) => setNewContact({ ...newContact, name: text })}
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

            <TextInput
                style={styles.input}
                placeholder="address"
                value={newContact.Address}
                onChangeText={(text) => setNewContact({ ...newContact, address: text })}
                keyboardType=""
            />

            <TextInput
                style={styles.input}
                placeholder="notes"
                value={newContact.notes}
                onChangeText={(text) => setNewContact({ ...newContact, notes: text })}
                keyboardType=""
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

    const handleCloseModal = () => {
        setShowContactDetail(false);
        setSelectedContact(null);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Contacts</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.headerIconButton}
                        onPress={() => setShowSearchField(!showSearchField)}
                    >
                        <Ionicons name="search" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerIconButton}
                        onPress={() => setShowGroups(!showGroups)}
                    >
                        <Ionicons name="grid-outline" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerIconButton}
                        onPress={() => {
                            setEditMode(false);
                            setShowAddContact(true);
                        }}
                    >
                        <Ionicons name="add" size={24} color="#007AFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search Bar - Only show when toggled */}
            {showSearchField && (
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus={true}
                    />
                    <TouchableOpacity
                        onPress={() => {
                            setShowSearchField(false);
                            setSearchQuery('');
                        }}
                        style={styles.closeSearchButton}
                    >
                        <Ionicons name="close" size={20} color="#666" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Groups - Only show when toggled */}
            {showGroups && (
                <View style={styles.groupsWrapper}>
                    <View style={styles.groupsHeader}>
                        <Text style={styles.groupsTitle}>Filter by Group</Text>
                        <TouchableOpacity
                            onPress={() => setShowGroups(false)}
                            style={styles.closeGroupsButton}
                        >
                            <Ionicons name="close" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
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
                </View>
            )}

            {/* Contacts List */}
          

            <FlatList
                data={filteredContacts}
                renderItem={({ item }) => <ContactListItem contact={item} />}
                keyExtractor={item => item.id.toString()}
                style={styles.contactsList}

                // numColumns={2}
                // contentContainerStyle={styles.notesContainer}
                onEndReached={() => {
                    // console.log("End reached, loading more notes...");
                    if (!isLoadingMore) {
                        // console.log("Loading more notes...");
                        fetchContacts(currentPage + 1);
                    }
                }}
                onEndReachedThreshold={0.5}
            // ListFooterComponent={renderFooter}
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

                        <View style={styles.actionButtons}>
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

            <ContactDetailModal
                contact={selectedContact}
                onClose={handleCloseModal}
                onEdit={() => editContact(selectedContact)}
                onDelete={() => deleteContact(selectedContact)}
            />
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconButton: {
        padding: 8,
        marginLeft: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
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
    closeSearchButton: {
        padding: 4,
        marginLeft: 8,
    },
    groupsWrapper: {
        backgroundColor: '#FFF',
        margin: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E9F0',
        padding: 12,
    },
    groupsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    groupsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    closeGroupsButton: {
        padding: 4,
    },
    groupsContainer: {
        paddingHorizontal: 0,
        marginBottom: 0,
    },
    groupChip: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: '#E1F5FE',
        borderRadius: 15,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    selectedGroupChip: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    groupChipText: {
        color: '#007AFF',
        fontSize: 12,
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
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#FFF',
        marginTop: 50,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    backButton: {
        padding: 8,
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerButton: {
        padding: 8,
        marginLeft: 16,
    },
    profileSection: {
        alignItems: 'center',
        padding: 20,
    },
    profilePhotoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    profilePhoto: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    initialsContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        color: '#FFF',
        fontSize: 36,
        fontWeight: 'bold',
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    groupBadge: {
        backgroundColor: '#E1F5FE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    groupText: {
        color: '#0288D1',
        fontSize: 14,
        fontWeight: '600',
    },
    detailSection: {
        marginTop: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    detailIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    detailTextContainer: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 14,
        color: '#666666',
    },
    detailValue: {
        fontSize: 16,
        color: '#333333',
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    messageButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    callButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#4CD964',
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    form: {
        padding: 20,
        backgroundColor: '#FFF',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    input: {
        height: 50,
        borderColor: '#E5E9F0',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 15,
        paddingHorizontal: 10,
        fontSize: 16,
        backgroundColor: '#F8F9FB',
    },
    groupSelector: {
        marginTop: 10,
    },
    groupLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    cancelButton: {
        backgroundColor: '#FF3B30', // Red color for cancel
        flex: 1,
        flexDirection: 'row',
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#007AFF', // Blue color for save
        padding: 15,
        borderRadius: 8,
        marginLeft: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '60',
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default Contacts;


