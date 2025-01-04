import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';

const DictionaryScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [situation, setSituation] = useState('');
  const [word, setWord] = useState('');
  const [words, setWords] = useState([]);
  const [folder, setFolder] = useState('');
  const [subfolder, setSubfolder] = useState('');
  const [coverImage, setCoverImage] = useState(null);

  const handleNextStep = () => setStep((prev) => prev + 1);

  const selectImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 1,
      },
      (response) => {
        if (response.didCancel) {
          console.log('Пользователь отменил выбор изображения');
        } else if (response.errorCode) {
          console.error('Ошибка выбора изображения:', response.errorMessage);
        } else {
          const uri = response.assets[0]?.uri;
          if (uri) {
            setCoverImage(uri);
          }
        }
      }
    );
  };

  const addWord = () => {
    if (word.trim()) {
      setWords((prevWords) => [...prevWords, word.trim()]);
      setWord('');
    }
  };

  const handleSave = async () => {
		const entry = {
			situation,
			words,
			folder,
			subfolder,
			coverImage,
			translated: false,
			date: new Date().toISOString(), // Добавляем дату
		};
	
		try {
			// Сохраняем запись в словарь
			const storedDictionary = await AsyncStorage.getItem('dictionary');
			const dictionary = storedDictionary ? JSON.parse(storedDictionary) : [];
			dictionary.push(entry);
			await AsyncStorage.setItem('dictionary', JSON.stringify(dictionary));
	
			// Сохраняем запись в ленту
			const storedFeed = await AsyncStorage.getItem('feed');
			const feed = storedFeed ? JSON.parse(storedFeed) : [];
			feed.push({
				date: new Date().toLocaleDateString(),
				situation,
				status: entry.translated ? 'Переведено' : 'Не переведено',
			});
			await AsyncStorage.setItem('feed', JSON.stringify(feed));
	
			// Сохраняем в папки
			const storedFolders = await AsyncStorage.getItem('folders');
			const folders = storedFolders ? JSON.parse(storedFolders) : [];
	
			let folderIndex = folders.findIndex((f) => f.name === folder);
			if (folderIndex === -1) {
				folders.push({
					name: folder,
					subfolders: [],
					cards: [],
					coverImage,
				});
				folderIndex = folders.length - 1;
			}
	
			const selectedFolder = folders[folderIndex];
			if (subfolder) {
				let subfolderIndex = selectedFolder.subfolders.findIndex(
					(sf) => sf.name === subfolder
				);
				if (subfolderIndex === -1) {
					selectedFolder.subfolders.push({
						name: subfolder,
						subfolders: [],
						cards: [],
						coverImage,
					});
					subfolderIndex = selectedFolder.subfolders.length - 1;
				}
				selectedFolder.subfolders[subfolderIndex].cards.push(...words);
			} else {
				selectedFolder.cards.push(...words);
			}
	
			await AsyncStorage.setItem('folders', JSON.stringify(folders));
		} catch (error) {
			console.error('Ошибка сохранения:', error);
		}
	
		setSituation('');
		setWords([]);
		setFolder('');
		setSubfolder('');
		setCoverImage(null);
		setStep(1);
	};	

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Добавьте новую запись</Text>
      {step === 1 && (
        <View style={styles.inputContainer}>
          <Icon name="lightbulb-outline" size={24} color="#f9a825" style={styles.icon} />
          <Text style={styles.label}>Опишите ситуацию:</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите ситуацию..."
            value={situation}
            onChangeText={setSituation}
          />
          <TouchableOpacity style={styles.button} onPress={handleNextStep}>
            <Text style={styles.buttonText}>Далее</Text>
          </TouchableOpacity>
        </View>
      )}
      {step === 2 && (
        <View style={styles.inputContainer}>
          <Icon name="text-box-outline" size={24} color="#007bff" style={styles.icon} />
          <Text style={styles.label}>Добавьте слово или выражение:</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите слово или выражение..."
            value={word}
            onChangeText={setWord}
          />
          <TouchableOpacity style={styles.addWordButton} onPress={addWord}>
            <Text style={styles.addWordButtonText}>Добавить слово</Text>
          </TouchableOpacity>
          <FlatList
            data={words}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => <Text style={styles.wordItem}>{item}</Text>}
          />
          <TouchableOpacity style={styles.button} onPress={handleNextStep}>
            <Text style={styles.buttonText}>Далее</Text>
          </TouchableOpacity>
        </View>
      )}
      {step === 3 && (
        <View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Укажите папку:</Text>
            <TextInput
              style={styles.input}
              placeholder="Введите имя папки..."
              value={folder}
              onChangeText={setFolder}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Укажите подпапку (необязательно):</Text>
            <TextInput
              style={styles.input}
              placeholder="Введите имя подпапки..."
              value={subfolder}
              onChangeText={setSubfolder}
            />
          </View>
          <TouchableOpacity style={styles.imageButton} onPress={selectImage}>
            <Text style={styles.imageButtonText}>Выбрать обложку</Text>
          </TouchableOpacity>
          {coverImage && (
            <Image source={{ uri: coverImage }} style={styles.previewImage} />
          )}
          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Сохранить</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        style={styles.viewFoldersButton}
        onPress={() => navigation.navigate('FoldersScreen')}
      >
        <Text style={styles.viewFoldersButtonText}>Посмотреть папки и записи</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#f9a825',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addWordButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  addWordButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  wordItem: {
    fontSize: 16,
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  imageButton: {
    backgroundColor: '#6a1b9a',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  imageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  previewImage: {
    width: 100,
    height: 100,
    marginTop: 10,
    alignSelf: 'center',
  },
  viewFoldersButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  viewFoldersButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  icon: {
    marginBottom: 5,
  },
});

export default DictionaryScreen;
