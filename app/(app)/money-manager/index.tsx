import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const ITEMS_PER_PAGE = 10;

interface Transaction {
  id: string;
  amount: number;
  currency?: string;
  category: string;
  description: string;
  type: 'income' | 'expense' | 'credit' | 'debit';
  datetime: string;
  notes: string;
}

const MoneyManager = () => {
  // Helper function to normalize transaction type to income/expense
  const normalizeType = (type: string): 'income' | 'expense' => {
    if (type === 'credit' || type === 'income') return 'income';
    if (type === 'debit' || type === 'expense') return 'expense';
    return 'expense'; // default
  };

  // Helper function to check if transaction is income type
  const isIncomeType = (type: string): boolean => {
    return type === 'credit' || type === 'income';
  };

  // State Management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Ref to always hold the latest transactions (avoids stale closure in async functions)
  const transactionsRef = useRef<Transaction[]>([]);

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('debit');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('date');

  // Currency States
  const [currency, setCurrency] = useState('BDT');

  const categories = ['All', 'Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Other'];
  const types = ['All', 'credit', 'debit'];

  const currencySymbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'BDT': '৳',
  };

  const currencies = ['USD', 'EUR', 'BDT'];

  // Apply Filters and Search
  const applyFilters = useCallback((data: Transaction[]) => {
    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.error('applyFilters received non-array data:', data);
      setFilteredTransactions([]);
      return;
    }

    let filtered = [...data];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(t =>
        t.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.amount?.toString().includes(searchQuery)
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Type filter
    if (selectedType !== 'All') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'amount':
          return b.amount - a.amount;
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        default:
          return 0;
      }
    });

    setFilteredTransactions(filtered);
  }, [searchQuery, selectedCategory, selectedType, sortBy]);

  const fetchTransactions = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      // NOTE: backend uses `per_page` not `limit` (same as notes API)
      const url = `/transactions?page=${pageNum}&per_page=${ITEMS_PER_PAGE}`;
      console.log('Fetching page:', pageNum, 'url:', url);

      const response = await api.get(url);

      // Handle different response formats
      let incoming: Transaction[] = [];
      if (Array.isArray(response.data)) {
        incoming = response.data;
      } else if (response.data?.transactions && Array.isArray(response.data.transactions)) {
        incoming = response.data.transactions;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        incoming = response.data.data;
      } else {
        console.error('Unexpected response format:', response.data);
      }

      console.log(`Page ${pageNum} returned ${incoming.length} items`);

      setHasMore(incoming.length === ITEMS_PER_PAGE);
      setPage(pageNum);

      // Build the full list using the ref (always up-to-date, no stale closure)
      const updated = (pageNum === 1 || isRefresh)
        ? incoming
        : [...transactionsRef.current, ...incoming];

      transactionsRef.current = updated;  // keep ref in sync
      setTransactions(updated);

    } catch (error: any) {
      console.error('Fetch error:', error.response?.status, error.message);
      if (pageNum === 1) {
        transactionsRef.current = [];
        setTransactions([]);
        setFilteredTransactions([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTransactions(1, false);
  }, []);

  // Re-apply filters whenever transactions OR filter settings change
  useEffect(() => {
    applyFilters(transactions);
  }, [transactions, searchQuery, selectedCategory, selectedType, sortBy]);

  // Add Transaction
  const addTransaction = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const newTransaction = {
        amount: parseFloat(amount),
        notes: description,
        category,
        type: transactionType,
        datetime: date.toISOString(),
        currency,
      };

      console.log('Adding transaction:', newTransaction);

      // Post to API
      await api.post('/transactions', newTransaction);

      // Clear form
      resetForm();
      setModalVisible(false);

      // Refresh transactions from server
      fetchTransactions(1, true);

      Alert.alert('Success', 'Transaction added successfully');
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', `Failed to add transaction: ${error.message}`);
    }
  };

  // Update Transaction
  const updateTransaction = async () => {
    if (!amount || !description || !editingId) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const updatedTransaction = {
        amount: parseFloat(amount),
        notes: description,
        category,
        type: transactionType,
        datetime: date.toISOString(),
        currency,
      };

      console.log('Updating transaction:', updatedTransaction);

      // Update via API
      await api.put(`/transactions/${editingId}`, updatedTransaction);

      // Clear form
      resetForm();
      setModalVisible(false);

      // Refresh transactions from server
      fetchTransactions(1, true);

      Alert.alert('Success', 'Transaction updated successfully');
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', `Failed to update transaction: ${error.message}`);
    }
  };

  // Reset Form
  const resetForm = () => {
    setAmount('');
    setDescription('');
    setCategory('Food');
    setTransactionType('debit');
    setDate(new Date());
    setIsEditing(false);
    setEditingId(null);
  };

  // Open Edit Modal
  const openEditModal = (item: Transaction) => {
    setIsEditing(true);
    setEditingId(item.id);
    setAmount(item.amount.toString());
    setDescription(item.notes || '');
    setCategory(item.category || 'Food');
    // Normalize the type to income/expense for the UI
    setTransactionType(normalizeType(item.type));
    setDate(new Date(item.datetime));
    setModalVisible(true);
  };

  // Delete Transaction
  const deleteTransaction = (id: string) => {
    Alert.alert('Delete', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/transactions/${id}`);
            fetchTransactions(1, true);
            Alert.alert('Success', 'Transaction deleted');
          } catch (error: any) {
            console.error('Error deleting transaction:', error);
            Alert.alert('Error', `Failed to delete transaction: ${error.message}`);
          }
        },
      },
    ]);
  };

  // Load More — guarded by isLoadingMore to prevent duplicate requests
  const loadMore = () => {
    if (hasMore && !isLoadingMore && !loading && !refreshing) {
      fetchTransactions(page + 1, false);
    }
  };

  // Get Total Income and Expense
  const getTotals = () => {
    if (!Array.isArray(filteredTransactions)) {
      return { income: 0, expense: 0, balance: 0 };
    }

    const income = filteredTransactions
      .filter(t => isIncomeType(t.type))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const expense = filteredTransactions
      .filter(t => !isIncomeType(t.type))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return { income, expense, balance: income - expense };
  };

  const { income, expense, balance } = getTotals();

  // Transaction Item Component
  const TransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onPress={() => openEditModal(item)}
      onLongPress={() => deleteTransaction(item.id)}
    >
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: isIncomeType(item.type) ? '#10B981' : '#EF4444' },
          ]}
        >
          <Ionicons
            name={isIncomeType(item.type) ? 'arrow-down' : 'arrow-up'}
            size={20}
            color="#FFF"
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.notes || 'No notes'}</Text>
          <Text style={styles.transactionCategory}>{item.category || 'Uncategorized'}</Text>
          <Text style={styles.transactionDate}>
            {item.datetime ? new Date(item.datetime).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }) : 'No date'}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          { color: isIncomeType(item.type) ? '#10B981' : '#EF4444' },
        ]}
      >
        {isIncomeType(item.type) ? '+' : '-'}${(item.amount || 0).toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  // Footer: only shows during pagination, not initial load
  const Footer = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Summary */}
      <View style={[styles.header, { backgroundColor: '#F0FFF4' }]}>
        <Text style={[styles.title, { color: '#007AFF' }]}>Money Manager</Text>
        <View style={[styles.summaryContainer, { backgroundColor: '#E6FAF0', borderRadius: 18 }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: '#22C55E', fontSize: 15 }]}>Income</Text>
            <Text style={[styles.summaryAmount, { color: '#22C55E', fontSize: 22 }]}>
              +${income.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: '#EF4444', fontSize: 15 }]}>Expense</Text>
            <Text style={[styles.summaryAmount, { color: '#EF4444', fontSize: 22 }]}>
              -${expense.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: '#007AFF', fontSize: 15 }]}>Balance</Text>
            <Text style={[
              styles.summaryAmount,
              {
                color: balance >= 0 ? '#22C55E' : '#EF4444',
                fontSize: 22,
              }
            ]}>
              ${balance.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {/* Type Filter */}
        {types.map(type => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              selectedType === type && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedType(type)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedType === type && styles.filterButtonTextActive,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Category Filter */}
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterButton,
              selectedCategory === cat && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedCategory === cat && styles.filterButtonTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Sort Filter */}
        <TouchableOpacity
          style={[styles.filterButton, styles.sortButton]}
          onPress={() => {
            const sorts = ['date', 'amount', 'category'];
            const currentIndex = sorts.indexOf(sortBy);
            setSortBy(sorts[(currentIndex + 1) % sorts.length]);
          }}
        >
          <Ionicons name="swap-vertical" size={16} color="#007AFF" />
          <Text style={styles.filterButtonText}>{sortBy}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Debug Info */}
      <View style={styles.debugInfo}>
        <Text style={styles.debugText}>
          Total: {transactions.length} | Filtered: {filteredTransactions.length}
        </Text>
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={TransactionItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchTransactions(1, true)} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.emptyText}>Loading transactions...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={50} color="#CCC" />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubtext}>
                {transactions.length > 0
                  ? 'Try adjusting your filters'
                  : 'Add your first transaction to get started'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={Footer}
        contentContainerStyle={styles.listContent}
      />

      {/* Add Transaction Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                resetForm();
                setModalVisible(false);
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Type Selection */}
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeSelector}>
                {(['income', 'expense'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      transactionType === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setTransactionType(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        transactionType === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Currency Selection */}
              <Text style={styles.inputLabel}>Currency</Text>
              <View style={styles.currencySelector}>
                {currencies.map(curr => (
                  <TouchableOpacity
                    key={curr}
                    style={[
                      styles.currencyButton,
                      currency === curr && styles.currencyButtonActive,
                    ]}
                    onPress={() => setCurrency(curr)}
                  >
                    <Text
                      style={[
                        styles.currencyButtonText,
                        currency === curr && styles.currencyButtonTextActive,
                      ]}
                    >
                      {currencySymbols[curr]} {curr}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Amount Input */}
              <Text style={styles.inputLabel}>Amount</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>{currencySymbols[currency]}</Text>

                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              {/* Description Input */}
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="Enter description"
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
              />

              {/* Category Selection */}
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.slice(1).map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat && styles.categoryButtonActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        category === cat && styles.categoryButtonTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date & Time Picker */}
              <Text style={styles.inputLabel}>Date & Time</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={[styles.datePickerButton, { flex: 1, marginRight: 8 }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.datePickerText}>
                    {date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  <Ionicons name="calendar" size={20} color="#007AFF" style={styles.datePickerIcon} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.datePickerButton, { flex: 1 }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.datePickerText}>
                    {date.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  <Ionicons name="time" size={20} color="#007AFF" style={styles.datePickerIcon} />
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setDate(selectedDate);
                    }
                  }}
                  style={styles.dateTimePicker}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={date}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) {
                      setDate(selectedTime);
                    }
                  }}
                  style={styles.dateTimePicker}
                />
              )}
            </ScrollView>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={isEditing ? updateTransaction : addTransaction}
            >
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Transaction' : 'Add Transaction'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#F0FFF4',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#007AFF',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: '#E6FAF0',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  summaryDivider: {
    width: 1.5,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    marginRight: 4,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  filterButtonTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  debugInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  debugText: {
    fontSize: 13,
    color: '#7C6E0F',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexGrow: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#E8ECF4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  transactionCategory: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 14,
    letterSpacing: -0.3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    marginTop: 16,
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999',
    marginTop: 8,
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 28,
    right: 28,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8ECF4',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666',
    letterSpacing: -0.2,
  },
  typeButtonTextActive: {
    color: '#007AFF',
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  currencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  currencyButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    letterSpacing: -0.2,
  },
  currencyButtonTextActive: {
    color: '#007AFF',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    height: 56,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '800',
    color: '#007AFF',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    height: 56,
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  descriptionInput: {
    height: 110,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  categoryButton: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#F0F8FF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    letterSpacing: -0.2,
  },
  categoryButtonTextActive: {
    color: '#007AFF',
  },
  submitButton: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#E8ECF4',
    height: 56,
  },
  datePickerText: {
    flex: 1,
    height: 56,
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  datePickerIcon: {
    marginLeft: 10,
  },
  dateTimePicker: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
});

export default MoneyManager;