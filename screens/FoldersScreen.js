import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ImageBackground,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const FoldersScreen = ({navigation}) => {
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [wordOrPhrase, setWordOrPhrase] = useState('');
  const [showNewCardInput, setShowNewCardInput] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('folders');
        const parsedData = storedData ? JSON.parse(storedData) : [];
        console.log('Загруженные папки из AsyncStorage:', parsedData);
        setFolders(parsedData);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };
    fetchData();
  }, []);

  const addWordOrPhrase = () => {
		if (!wordOrPhrase.trim()) {
			console.warn('Слово или выражение не может быть пустым.');
			return;
		}
	
		console.log('Добавляем слово или выражение:', wordOrPhrase);
		console.log('Текущая папка до обновления:', currentFolder);
	
		// Обновляем текущую папку
		const updatedCurrentFolder = {
			...currentFolder,
			cards: [...currentFolder.cards, wordOrPhrase],
		};
	
		// Рекурсивно обновляем папки
		const updateFolderRecursively = (folders, targetFolder, updatedFolder) => {
			return folders.map(folder => {
				if (folder === targetFolder) {
					return updatedFolder;
				}
	
				// Рекурсивно обновляем подпапки
				if (folder.subfolders && folder.subfolders.length > 0) {
					return {
						...folder,
						subfolders: updateFolderRecursively(
							folder.subfolders,
							targetFolder,
							updatedFolder,
						),
					};
				}
	
				return folder; // Остальные папки без изменений
			});
		};
	
		const updatedFolders = updateFolderRecursively(
			folders,
			currentFolder,
			updatedCurrentFolder,
		);
	
		console.log('Обновленные папки:', updatedFolders);
	
		// Сохраняем данные
		saveFolders(updatedFolders);
		setCurrentFolder(updatedCurrentFolder); // Обновляем состояние текущей папки
		setFolders(updatedFolders); // Обновляем состояние всех папок
		setWordOrPhrase(''); // Очищаем поле ввода
		setShowNewCardInput(false); // Скрываем поле ввода слова
	};
	

  const saveFolders = async updatedFolders => {
    console.log('Сохраняемые папки:', updatedFolders);
    try {
      await AsyncStorage.setItem('folders', JSON.stringify(updatedFolders));
      setFolders(updatedFolders);
    } catch (error) {
      console.error('Ошибка сохранения данных:', error);
    }
  };

  const addFolder = () => {
    if (!folderName.trim()) {
      console.warn('Имя папки не может быть пустым.');
      return;
    }
    const newFolder = {
      name: folderName,
      subfolders: [],
      cards: [],
      coverImage: null, // Обложка по умолчанию
    };
    console.log('Созданная папка:', newFolder);
    const updatedFolders = currentFolder
      ? folders.map(folder =>
          folder === currentFolder
            ? {...folder, subfolders: [...folder.subfolders, newFolder]}
            : folder,
        )
      : [...folders, newFolder];
    saveFolders(updatedFolders);
    setFolderName('');
    setShowNewFolderInput(false);
  };

  const deleteFolder = folderToDelete => {
    const confirmDelete = () => {
      const updatedFolders = currentFolder
        ? folders.map(folder =>
            folder === currentFolder
              ? {
                  ...folder,
                  subfolders: folder.subfolders.filter(
                    sub => sub !== folderToDelete,
                  ),
                }
              : folder,
          )
        : folders.filter(folder => folder !== folderToDelete);
      saveFolders(updatedFolders);
    };
    Alert.alert(
      'Удалить папку',
      `Вы уверены, что хотите удалить папку "${folderToDelete.name}"?`,
      [
        {text: 'Отмена', style: 'cancel'},
        {text: 'Удалить', style: 'destructive', onPress: confirmDelete},
      ],
    );
  };

  const enterFolder = folder => {
    setCurrentFolder(folder);
  };

  const goBack = () => {
    setCurrentFolder(null);
  };

  const renderFolder = ({item}) => (
    <ImageBackground
      source={item.coverImage ? {uri: item.coverImage} : null}
      style={styles.folderBackground}
      imageStyle={styles.folderImageStyle}>
      <View style={styles.folderContent}>
        <Icon
          name="folder"
          size={24}
          color="#f9a825"
          style={styles.folderIcon}
        />
        <TouchableOpacity
          style={styles.folder}
          onPress={() => enterFolder(item)}
          onLongPress={() => deleteFolder(item)}>
          <Text style={styles.folderText}>{item.name}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteFolder(item)}>
        <Icon name="close-circle" size={24} color="#ff5252" />
      </TouchableOpacity>
    </ImageBackground>
  );

  const renderCard = ({item}) => (
		<TouchableOpacity
			style={styles.card}
			onPress={() => navigation.navigate('CardScreen', { card: item })}>
			<Text style={styles.cardText}>{item}</Text>
		</TouchableOpacity>
	);
	

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {currentFolder ? `Ситуация: ${currentFolder.name}` : 'Ваши ситуации'}
      </Text>
      <FlatList
        data={currentFolder ? currentFolder.subfolders : folders}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderFolder}
      />
      {currentFolder && (
        <>
          <Text style={styles.subtitle}>Слова и выражения:</Text>
          <FlatList
            data={currentFolder.cards}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderCard}
          />
        </>
      )}
      {currentFolder ? (
        <>
          {showNewFolderInput && (
            <View style={styles.newFolderContainer}>
              <TextInput
                style={styles.input}
                placeholder="Введите имя новой подпапки..."
                value={folderName}
                onChangeText={setFolderName}
              />
              <TouchableOpacity style={styles.addButton} onPress={addFolder}>
                <Text style={styles.addButtonText}>Добавить подпапку</Text>
              </TouchableOpacity>
            </View>
          )}
          {showNewCardInput && (
            <View style={styles.newFolderContainer}>
              <TextInput
                style={styles.input}
                placeholder="Введите слово или выражение..."
                value={wordOrPhrase}
                onChangeText={setWordOrPhrase}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={addWordOrPhrase}>
                <Text style={styles.addButtonText}>Добавить слово</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNewFolderInput(true)}>
            <Text style={styles.addButtonText}>Добавить подпапку</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNewCardInput(true)}>
            <Text style={styles.addButtonText}>
              Добавить слово или выражение
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>Назад</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {showNewFolderInput && (
            <View style={styles.newFolderContainer}>
              <TextInput
                style={styles.input}
                placeholder="Введите имя новой папки..."
                value={folderName}
                onChangeText={setFolderName}
              />
              <TouchableOpacity style={styles.addButton} onPress={addFolder}>
                <Text style={styles.addButtonText}>Добавить</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNewFolderInput(true)}>
            <Text style={styles.addButtonText}>Добавить папку</Text>
          </TouchableOpacity>
        </>
      )}
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
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  folderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5, // Для отступа внутри фона
  },
  folderIcon: {
    marginRight: 10, // Отступ между иконкой и текстом
  },
  folderBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  folderImageStyle: {
    borderRadius: 10,
    opacity: 0.8, // Чтобы текст и иконка выделялись
  },
  folder: {
    flex: 1,
  },
  folderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteButton: {
    marginLeft: 0,
  },
  card: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  cardText: {
    fontSize: 16,
  },
  newFolderContainer: {
    marginBottom: 15,
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
  addButton: {
    backgroundColor: '#f9a825',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FoldersScreen;
