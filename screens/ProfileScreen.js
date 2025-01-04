import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProfileScreen = () => {
  const [userAvatar, setUserAvatar] = useState('https://via.placeholder.com/100');
  const [feed, setFeed] = useState([]);
  const [isPublic, setIsPublic] = useState(false);

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
          comments: [],
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

  return (
    <View style={styles.container}>
      {/* Профиль пользователя */}
      <View style={styles.profileInfo}>
        <Image source={{ uri: userAvatar }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.status}>Статус: {user.status}</Text>
        <Text style={styles.unreadWords}>У вас {user.unreadWords} непереведённых слов</Text>
        <Text style={styles.details}>Страна: {user.country}</Text>
        <Text style={styles.details}>Дата переезда: {user.moveDate}</Text>
        <Text style={styles.details}>Города проживания: {user.cities.join(', ')}</Text>
        <TouchableOpacity style={styles.toggleButton} onPress={toggleProfileVisibility}>
          <Text style={styles.toggleButtonText}>
            {isPublic ? 'Сделать профиль приватным' : 'Сделать профиль публичным'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Лента */}
      <View style={styles.feedContainer}>
        <Text style={styles.sectionTitle}>Моя лента</Text>
        <FlatList
          data={feed}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.feedItem}>
              <Text style={styles.feedDate}>{item.date}</Text>
              <Text style={styles.feedContent}>{item.situation}</Text>
              <Text style={styles.feedStatus}>Статус: {item.status}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => toggleLike(index)} style={styles.likeButton}>
                  <Icon name="heart" size={20} color="red" />
                  <Text style={styles.likeCount}>{item.likes}</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={item.comments}
                keyExtractor={(c, commentIndex) => commentIndex.toString()}
                renderItem={({ item: comment, index: commentIndex }) => (
                  <View style={styles.comment}>
                    <Text>{comment}</Text>
                    <TouchableOpacity onPress={() => deleteComment(index, commentIndex)}>
                      <Icon name="delete" size={20} color="gray" />
                    </TouchableOpacity>
                  </View>
                )}
              />

              <TextInput
                style={styles.input}
                placeholder="Напишите комментарий..."
                onSubmitEditing={event => addComment(index, event.nativeEvent.text)}
              />
            </View>
          )}
        />
      </View>
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
});

export default ProfileScreen;
