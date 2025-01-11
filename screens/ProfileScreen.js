import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';

const ProfileScreen = () => {
  const [userAvatar, setUserAvatar] = useState(
    'https://via.placeholder.com/100',
  );
  const [feed, setFeed] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(null);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  const navigation = useNavigation();

  const user = {
    name: 'Ксюшилда',
    status: 'GOLD',
    unreadWords: 10,
    country: 'Франция',
    moveDate: '10 января 2022',
    cities: ['Москва', 'Париж', 'Лион'],
  };

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        await migrateDictionaryToFeed();
        const storedFeed = await AsyncStorage.getItem('feed');
        const parsedFeed = storedFeed ? JSON.parse(storedFeed) : [];
        setFeed(parsedFeed);
      } catch (error) {
        console.error('Ошибка загрузки ленты:', error);
      }
    };

    fetchFeed();
    const fetchAvatar = async () => {
      try {
        const storedAvatar = await AsyncStorage.getItem('userAvatar');
        if (storedAvatar) {
          setUserAvatar(storedAvatar);
        }
      } catch (error) {
        console.error('Ошибка при загрузке аватарки:', error);
      }
    };

    fetchAvatar();
  }, []);

  const selectAvatar = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setUserAvatar(uri);
        await AsyncStorage.setItem('userAvatar', uri);
      }
    } catch (error) {
      console.error('Ошибка при выборе аватарки:', error);
    }
  };

  const migrateDictionaryToFeed = async () => {
    try {
      const storedDictionary = await AsyncStorage.getItem('dictionary');
      const dictionary = storedDictionary ? JSON.parse(storedDictionary) : [];

      const storedFeed = await AsyncStorage.getItem('feed');
      const feed = storedFeed ? JSON.parse(storedFeed) : [];

      const existingSituations = new Set(feed.map(entry => entry.situation));

      const newFeedEntries = dictionary
        .filter(entry => !existingSituations.has(entry.situation))
        .map(entry => ({
          date: new Date(entry.date || Date.now()).toLocaleDateString(),
          situation: entry.situation,
          status: entry.translated ? 'Переведено' : 'Не переведено',
          isPublished: true,
          likes: 0,
          comments: [],
        }));

      const updatedFeed = [...feed, ...newFeedEntries];
      await AsyncStorage.setItem('feed', JSON.stringify(updatedFeed));
    } catch (error) {
      console.error('Ошибка миграции данных из dictionary в feed:', error);
    }
  };

  const toggleLike = async index => {
    const updatedFeed = [...feed];
    updatedFeed[index].likes = updatedFeed[index].likes + 1 || 1;
    setFeed(updatedFeed);
    await AsyncStorage.setItem('feed', JSON.stringify(updatedFeed));
  };

  const openCommentModal = index => {
    setSelectedPostIndex(index);
    setIsCommentModalVisible(true);
  };

  const closeCommentModal = () => {
    setIsCommentModalVisible(false);
    setCommentText('');
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;

    const updatedFeed = [...feed];
    updatedFeed[selectedPostIndex].comments = updatedFeed[selectedPostIndex].comments || [];
    updatedFeed[selectedPostIndex].comments.push(commentText);

    setFeed(updatedFeed);
    await AsyncStorage.setItem('feed', JSON.stringify(updatedFeed));
    closeCommentModal();
  };

  const toggleSettingsModal = () => {
    setIsSettingsModalVisible(!isSettingsModalVisible);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={selectAvatar}>
          <Image source={{uri: userAvatar}} style={styles.avatar} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={toggleSettingsModal}>
          <Icon name="cog" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.status}>Статус: {user.status}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.unreadWords}</Text>
            <Text style={styles.statLabel}>Слов</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.cities.length}</Text>
            <Text style={styles.statLabel}>Городов</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{feed.length}</Text>
            <Text style={styles.statLabel}>Ситуаций</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.dictionaryButton}
          onPress={() => navigation.navigate('Dictionary')}>
          <Icon name="book-open-variant" size={20} color="#fff" />
          <Text style={styles.dictionaryButtonText}>Перейти к словарю</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.addSituationButton}
        onPress={() => navigation.navigate('Dictionary')}>
        <Icon name="plus" size={20} color="#fff" />
        <Text style={styles.addSituationText}>Добавить ситуацию</Text>
      </TouchableOpacity>

      <FlatList
        data={feed}
        style={styles.feedList}
        renderItem={({item, index}) => (
          <View style={styles.feedItem}>
            <View style={styles.feedHeader}>
              <View style={styles.feedUser}>
                <Image source={{uri: userAvatar}} style={styles.feedUserAvatar} />
                <View>
                  <Text style={styles.feedUserName}>{user.name}</Text>
                  <Text style={styles.feedDate}>{item.date}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.feedContent}>
              <Text style={styles.situationText}>{item.situation}</Text>
              <Text style={styles.translationStatus}>
                {item.status}
              </Text>
            </View>
            
            <View style={styles.feedActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleLike(index)}>
                <Icon
                  name={item.isLiked ? "heart" : "heart-outline"}
                  size={24}
                  color={item.isLiked ? "#FF3B30" : "#666"}
                />
                <Text style={styles.actionText}>{item.likes || 0}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openCommentModal(index)}>
                <Icon name="comment-outline" size={24} color="#666" />
                <Text style={styles.actionText}>
                  {item.comments?.length || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSettingsModalVisible}
        onRequestClose={toggleSettingsModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Настройки</Text>
              <TouchableOpacity onPress={toggleSettingsModal}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.settingsOption}
              onPress={selectAvatar}>
              <Icon name="camera" size={24} color="#333" />
              <Text style={styles.settingsOptionText}>Изменить фото профиля</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={isCommentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeCommentModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Комментарии</Text>
              <TouchableOpacity onPress={closeCommentModal}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={feed[selectedPostIndex]?.comments || []}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item}) => (
                <View style={styles.commentItem}>
                  <Text style={styles.commentText}>{item}</Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyCommentText}>Нет комментариев</Text>
              }
            />

            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Напишите комментарий..."
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitComment}>
                <Text style={styles.submitButtonText}>Отправить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  settingsButton: {
    padding: 10,
  },
  profileInfo: {
    padding: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  status: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  dictionaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  dictionaryButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  addSituationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 12,
    borderRadius: 10,
  },
  addSituationText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  feedList: {
    flex: 1,
  },
  feedItem: {
    backgroundColor: '#fff',
    marginBottom: 10,
    padding: 15,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  feedUserName: {
    fontSize: 16,
    fontWeight: '600',
  },
  feedDate: {
    fontSize: 14,
    color: '#666',
  },
  feedContent: {
    marginBottom: 12,
  },
  situationText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  translationStatus: {
    fontSize: 14,
    color: '#666',
  },
  feedActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingsOptionText: {
    marginLeft: 15,
    fontSize: 16,
  },
  commentItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  commentText: {
    fontSize: 16,
  },
  emptyCommentText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ProfileScreen;