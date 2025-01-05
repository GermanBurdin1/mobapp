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
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';

const ProfileScreen = () => {
  const [userAvatar, setUserAvatar] = useState(
    'https://via.placeholder.com/100',
  );
  const [feed, setFeed] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(null); // Для хранения выбранного поста
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false); // Управление модальным окном
  const [commentText, setCommentText] = useState(''); // Текст нового комментария

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
        await migrateDictionaryToFeed(); // Синхронизация feed с dictionary
        const storedFeed = await AsyncStorage.getItem('feed');
        const parsedFeed = storedFeed ? JSON.parse(storedFeed) : [];
        setFeed(parsedFeed); // Обновляем отображение ленты
      } catch (error) {
        console.error('Ошибка загрузки ленты:', error);
      }
    };

    fetchFeed();
  }, []);

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
          comments: [], // Убедитесь, что всегда есть пустой массив
        }));

      const updatedFeed = [...feed, ...newFeedEntries];

      await AsyncStorage.setItem('feed', JSON.stringify(updatedFeed));
      console.log('Ситуации из dictionary добавлены в feed:', newFeedEntries);
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

  const addComment = async (index, comment) => {
    const updatedFeed = [...feed];
    updatedFeed[index].comments.push(comment);

    setFeed(updatedFeed);
    await AsyncStorage.setItem('feed', JSON.stringify(updatedFeed));
  };

  const deleteComment = async (index, commentIndex) => {
    const updatedFeed = [...feed];
    updatedFeed[index].comments.splice(commentIndex, 1);

    setFeed(updatedFeed);
    await AsyncStorage.setItem('feed', JSON.stringify(updatedFeed));
  };

  const toggleProfileVisibility = () => {
    setIsPublic(prev => !prev);
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

    // Убедитесь, что `comments` инициализирован как массив
    updatedFeed[selectedPostIndex].comments =
      updatedFeed[selectedPostIndex].comments || [];
    updatedFeed[selectedPostIndex].comments.push(commentText);

    setFeed(updatedFeed);
    await AsyncStorage.setItem('feed', JSON.stringify(updatedFeed));
    closeCommentModal();
  };

  return (
    <View style={styles.container}>
      {/* Профиль пользователя */}
      <View style={styles.profileInfo}>
        <Image source={{uri: userAvatar}} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.status}>Статус: {user.status}</Text>
        <Text style={styles.unreadWords}>
          У вас {user.unreadWords} непереведённых слов
        </Text>
        <Text style={styles.details}>Страна: {user.country}</Text>
        <Text style={styles.details}>Дата переезда: {user.moveDate}</Text>
        <Text style={styles.details}>
          Города проживания: {user.cities.join(', ')}
        </Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleProfileVisibility}>
          <Text style={styles.toggleButtonText}>
            {isPublic
              ? 'Сделать профиль приватным'
              : 'Сделать профиль публичным'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Лента */}
      <View style={styles.feedContainer}>
        <Text style={styles.sectionTitle}>Моя лента</Text>
        <FlatList
          data={feed}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item, index}) => (
            <View style={styles.feedItem}>
              <Text style={styles.feedDate}>{item.date}</Text>
              <Text style={styles.feedContent}>{item.situation}</Text>
              <Text style={styles.feedStatus}>Статус: {item.status}</Text>
              <View style={[styles.actions, {justifyContent: 'flex-start'}]}>
                {/* Лайк */}
                <TouchableOpacity
                  onPress={() => toggleLike(index)}
                  style={styles.actionButton}>
                  <Icon name="heart-outline" size={20} color="black" />
                  <Text style={styles.actionText}>{item.likes}</Text>
                </TouchableOpacity>

                {/* Комментарии */}
                <TouchableOpacity
                  onPress={() => openCommentModal(index)}
                  style={styles.actionButton}>
                  <Icon name="comment-outline" size={20} color="black" />
                  <Text style={styles.actionText}>
                    {item.comments?.length || 0}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      {/* Кнопка добавления ситуации */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('Dictionary')}>
        <Text style={styles.addButtonText}>Добавить ситуацию</Text>
      </TouchableOpacity>
      <Modal
        visible={isCommentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeCommentModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Комментарии</Text>
            <FlatList
              data={feed[selectedPostIndex]?.comments || []} // Добавьте `|| []` для предотвращения ошибок
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item, index}) => (
                <View style={styles.commentItem}>
                  <View style={styles.commentItem}>
                    <Text style={styles.modalComment}>{item}</Text>
                  </View>

                  <Text style={styles.commentDate}>
                    {new Date().toLocaleString()}{' '}
                    {/* Здесь вы можете заменить на дату из данных */}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyCommentText}>Нет комментариев</Text>
              } // Пустое состояние
            />

            <TextInput
              style={styles.input}
              placeholder="Напишите комментарий..."
              value={commentText}
              onChangeText={setCommentText}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={submitComment}
                style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Отправить</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={closeCommentModal}
                style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Закрыть</Text>
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
    padding: 20,
    backgroundColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  status: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
  },
  unreadWords: {
    fontSize: 14,
    color: '#555',
  },
  details: {
    fontSize: 14,
    marginTop: 5,
  },
  toggleButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  feedContainer: {
    flex: 1,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  feedItem: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  feedDate: {
    fontSize: 12,
    color: '#888',
  },
  feedContent: {
    fontSize: 16,
    marginTop: 5,
  },
  feedStatus: {
    fontSize: 14,
    marginTop: 5,
    color: '#007bff',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Разделяем элементы по сторонам
    marginTop: 10,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeCount: {
    marginLeft: 5,
    fontSize: 14,
    color: '#f57c00',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 14,
    marginTop: 10,
  },
  comment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalComment: {
    fontSize: 14,
    marginVertical: 5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#d9534f',
    padding: 10,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyCommentText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginVertical: 10,
  },
  firstComment: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15, // Отступ между кнопками
  },
  actionText: {
    marginLeft: 5, // Отступ между иконкой и текстом
    fontSize: 14,
    color: '#333',
  },

  feedDateRight: {
    fontSize: 12,
    color: '#888',
    marginLeft: 'auto', // Чтобы дата выравнивалась справа
  },
  commentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  commentDate: {
    fontSize: 12,
    color: '#888',
  },
});

export default ProfileScreen;
