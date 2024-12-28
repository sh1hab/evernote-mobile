import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
// const router = useRouter();

const ModularHomePage = () => {
  const [installedModules, setInstalledModules] = useState([
    {
      id: '1',
      name: 'Notes',
      icon: 'document-text',
      color: '#FF6B6B',
      installed: true,
      count: '12 notes',
    }
  ]);

  const [showModuleStore, setShowModuleStore] = useState(false);

  const availableModules = [
    {
      id: '2',
      name: 'Contacts',
      icon: 'people',
      color: '#4ECDC4',
      description: 'Manage your contacts with ease',
      features: ['Contact groups', 'Quick dial', 'Import/Export']
    },
    {
      id: '3',
      name: 'Money Manager',
      icon: 'wallet',
      color: '#45B7D1',
      description: 'Track your expenses and income',
      features: ['Budget tracking', 'Reports', 'Categories']
    },
    {
      id: '4',
      name: 'Tasks',
      icon: 'checkmark-circle',
      color: '#96CEB4',
      description: 'Organize your daily tasks',
      features: ['Due dates', 'Priority levels', 'Categories']
    },
    {
      id: '5',
      name: 'Calendar',
      icon: 'calendar',
      color: '#9B59B6',
      description: 'Schedule and manage events',
      features: ['Event reminders', 'Recurring events', 'Sharing']
    },
    {
      id: '6',
      name: 'Photos',
      icon: 'images',
      color: '#3498DB',
      description: 'Organize your photo collection',
      features: ['Albums', 'Tags', 'Search']
    }
  ];

  const installModule = (module) => {
    if (!installedModules.find(m => m.id === module.id)) {
      setInstalledModules([...installedModules, { ...module, installed: true }]);
    }
    setShowModuleStore(false);
  };

  const navigation = useNavigation();

  const uninstallModule = (moduleId) => {
    setInstalledModules(installedModules.filter(m => m.id !== moduleId));
  };

  const ModuleCard = ({ module }) => (
    <TouchableOpacity
      style={[styles.moduleCard]}
      onPress={() => {
        // navigate to module screen
        // navigation.navigate('/(app)/contacts');
        router.push('/(app)/contacts');
        console.log(`Navigate to ${module.name}`);
      }}
    >
      <View style={[styles.moduleIconContainer, { backgroundColor: module.color }]}>
        <Ionicons name={module.icon} size={24} color="#FFF" />
      </View>
      <View style={styles.moduleContent}>
        <Text style={styles.moduleName}>{module.name}</Text>
        {module.count && (
          <Text style={styles.moduleCount}>{module.count}</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.moduleAction}
        onPress={() => uninstallModule(module.id)}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const ModuleStoreItem = ({ module }) => (
    <View style={styles.storeItem}>
      <View style={styles.storeItemContent}>
        <View style={[styles.storeIconContainer, { backgroundColor: module.color }]}>
          <Ionicons name={module.icon} size={32} color="#FFF" />
        </View>
        <View style={styles.moduleInfo}>
          <Text style={styles.moduleStoreName}>{module.name}</Text>
          <Text style={styles.moduleDescription}>{module.description}</Text>
          <View style={styles.featuresList}>
            {module.features.map((feature, index) => (
              <View key={index} style={styles.featureTag}>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.installButton}
        onPress={() => installModule(module)}
      >
        <Text style={styles.installText}>Install</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Workspace</Text>
          <Text style={styles.headerSubtitle}>
            {installedModules.length} modules installed
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.storeButton}
          onPress={() => setShowModuleStore(true)}
        >
          <Ionicons name="add-circle" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar (Optional) */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <Text style={styles.searchPlaceholder}>Search modules...</Text>
      </View>

      {/* Installed Modules Grid */}
      <ScrollView style={styles.modulesContainer}>
        <View style={styles.modulesGrid}>
          {installedModules.map(module => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </View>
      </ScrollView>

      {/* Module Store Modal */}
      <Modal
        visible={showModuleStore}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Module</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModuleStore(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.storeList}>
              {availableModules
                .filter(module => !installedModules.find(m => m.id === module.id))
                .map(module => (
                  <ModuleStoreItem key={module.id} module={module} />
                ))}
            </ScrollView>
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
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  storeButton: {
    width: 44,
    height: 44,
    backgroundColor: '#F0F8FF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E9F0',
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: '#666',
    fontSize: 16,
  },
  modulesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  moduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleContent: {
    flex: 1,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  moduleCount: {
    fontSize: 13,
    color: '#666',
  },
  moduleAction: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#F8F9FB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E9F0',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  storeList: {
    flex: 1,
    padding: 16,
  },
  storeItem: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  storeItemContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  storeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleStoreName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  featureTag: {
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#007AFF',
  },
  installButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  installText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ModularHomePage;