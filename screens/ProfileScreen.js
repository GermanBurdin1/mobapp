import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Image, FlatList, Button} from 'react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';

const ProfileScreen = () => {
  const [userAvatar, setUserAvatar] = useState(
    'https://via.placeholder.com/100',
  );
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
        const storedFeed = await AsyncStorage.getItem('feed');
        const parsedFeed = storedFeed ? JSON.parse(storedFeed) : [];
        setFeed(parsedFeed);
      } catch (error) {
        console.error('Ошибка загрузки ленты:', error);
      }
    };

    fetchFeed();
  }, []);

  const toggleProfileVisibility = () => {
    setIsPublic((prev) => !prev);
  };

  const handleSelectPhoto = () => {
    launchImageLibrary({mediaType: 'photo', quality: 1}, response => {
      if (response.assets && response.assets.length > 0) {
        setUserAvatar(response.assets[0].uri);
      }
    });
  };

  const handleTakePhoto = () => {
    launchCamera({mediaType: 'photo', quality: 1}, response => {
      if (response.assets && response.assets.length > 0) {
        setUserAvatar(response.assets[0].uri);
      }
    });
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
        <Button
          title={isPublic ? 'Сделать профиль приватным' : 'Сделать профиль публичным'}
          onPress={toggleProfileVisibility}
        />
        <View style={styles.buttons}>
          <Button title="Выбрать из галереи" onPress={handleSelectPhoto} />
          <Button title="Сделать фото" onPress={handleTakePhoto} />
        </View>
      </View>

      {/* Лента */}
      <View style={styles.feedContainer}>
        <Text style={styles.sectionTitle}>Моя лента</Text>
        <FlatList
          data={feed}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({item}) => (
            <View style={styles.feedItem}>
              <Text style={styles.feedDate}>{item.date}</Text>
              <Text style={styles.feedContent}>{item.situation}</Text>
              <Text style={styles.feedStatus}>Статус: {item.status}</Text>
            </View>
          )}
        />
      </View>

      {/* Переход к словарю */}
      <View style={styles.navigationButton}>
        <Button
          title="Перейти к словарю"
          onPress={() => navigation.navigate('Dictionary')}
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
  navigationButton: {
    marginTop: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
});

export default ProfileScreen;
