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
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const FoldersScreen = ({navigation}) => {
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [wordOrPhrase, setWordOrPhrase] = useState('');
  const [showNewCardInput, setShowNewCardInput] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isAddSubfolderModalVisible, setIsAddSubfolderModalVisible] =
    useState(false);
  const [isAddWordModalVisible, setIsAddWordModalVisible] = useState(false);
  const [subfolderName, setSubfolderName] = useState('');
  const [selectedFolderForSubfolder, setSelectedFolderForSubfolder] =
    useState(null);
  const [expandedFolder, setExpandedFolder] = useState(null);

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
    if (!newFolderName.trim()) {
      console.warn('Имя папки не может быть пустым.');
      return;
    }
    const newFolder = {
      name: newFolderName,
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
    setNewFolderName('');
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

  const closeModal = () => {
    setSelectedFolder(null);
  };

  const addSubfolder = () => {
    if (!subfolderName.trim()) {
      console.warn('Имя подпапки не может быть пустым.');
      return;
    }
    const newSubfolder = {
      name: subfolderName,
      subfolders: [],
      cards: [],
    };
    const updatedFolders = folders.map(folder =>
      folder === selectedFolderForSubfolder
        ? {...folder, subfolders: [...folder.subfolders, newSubfolder]}
        : folder,
    );
    saveFolders(updatedFolders);
    setSubfolderName('');
    setIsAddSubfolderModalVisible(false);
  };

  const toggleSubfolderList = folder => {
    setExpandedFolder(expandedFolder === folder ? null : folder);
  };

  const renderFolder = ({item}) => (
    <View style={styles.folderContainer}>
      <View style={styles.folderHeader}>
        <Text style={styles.folderTitle}>{item.name}</Text>
      </View>
      <ImageBackground
        source={item.coverImage ? {uri: item.coverImage} : null}
        style={styles.folderBackground}
        imageStyle={styles.folderImageStyle}>
        <TouchableOpacity
          style={[styles.deleteButton, {position: 'absolute', top: 10, right: 15}]}
          onPress={() => deleteFolder(item)}>
          <Icon name="close-circle" size={24} color="#ff5252" />
        </TouchableOpacity>
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
            onLongPress={() => setSelectedFolder(item)}>
            <Text style={styles.folderText}>{item.name}</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
      <View style={styles.addSubfolderContainer}>
        <TouchableOpacity
          onPress={() => {
            setSelectedFolderForSubfolder(item);
            setIsAddSubfolderModalVisible(true);
          }}
          style={styles.addSubfolderButton}>
          <Icon name="plus-circle" size={24} color="#007AFF" />
          <Text style={styles.addSubfolderText}>подпапка</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => toggleSubfolderList(item)}
          style={styles.listIconButton}>
          <Icon name="format-list-bulleted" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
      {expandedFolder === item && (
        <View style={styles.subfolderList}>
          {item.subfolders.map((subfolder, index) => (
            <TouchableOpacity key={index} onPress={() => enterFolder(subfolder)}>
              <Text style={styles.subfolderText}>{subfolder.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.divider} />
    </View>
  );

  const renderCard = ({item}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('CardScreen', {card: item})}>
      <Text style={styles.cardText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Modal
        visible={isAddSubfolderModalVisible}
        transparent={true}
        animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Добавить подпапку</Text>
            <TextInput
              style={styles.input}
              placeholder="Имя подпапки"
              value={subfolderName}
              onChangeText={setSubfolderName}
            />
            <TouchableOpacity
              style={styles.submitButton}
              onPress={addSubfolder}>
              <Text style={styles.submitButtonText}>подпапка</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => setIsAddSubfolderModalVisible(false)}>
              <Text style={styles.submitButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={styles.header}>
        {currentFolder ? (
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Icon name="arrow-left" size={24} color="#333" />
            <Text style={styles.backButtonText}>Назад</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.headerTitle}>
          {currentFolder ? currentFolder.name : 'Ваши ситуации'}
        </Text>
      </View>
      {currentFolder && (
        <TouchableOpacity
          style={styles.addWordButton}
          onPress={() => setShowNewCardInput(true)}>
          <Icon name="text-box-plus" size={24} color="#007AFF" />
          <Text style={styles.addWordText}>
            Добавить новое слово или выражение
          </Text>
        </TouchableOpacity>
      )}
      {!currentFolder ? (
        <FlatList
          data={folders}
          renderItem={renderFolder}
          keyExtractor={(item, index) => index.toString()}
          style={styles.folderList}
        />
      ) : (
        <View>
          {currentFolder.subfolders && currentFolder.subfolders.length > 0 && (
            <FlatList
              data={currentFolder.subfolders}
              renderItem={renderFolder}
              keyExtractor={(item, index) => index.toString()}
              style={styles.folderList}
              ListHeaderComponent={
                <Text style={styles.sectionTitle}>Подпапки</Text>
              }
            />
          )}
          <FlatList
            data={currentFolder.cards}
            renderItem={renderCard}
            keyExtractor={(item, index) => index.toString()}
            style={styles.cardList}
          />
        </View>
      )}
      {showNewFolderInput && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Название папки"
            value={newFolderName}
            onChangeText={setNewFolderName}
          />
          <TouchableOpacity style={styles.submitButton} onPress={addFolder}>
            <Text style={styles.submitButtonText}>Добавить</Text>
          </TouchableOpacity>
        </View>
      )}
      {showNewCardInput && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Слово или выражение"
            value={wordOrPhrase}
            onChangeText={setWordOrPhrase}
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={addWordOrPhrase}>
            <Text style={styles.submitButtonText}>Добавить</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedFolder !== null}
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedFolder?.name}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setIsAddWordModalVisible(true);
                  closeModal();
                }}>
                <Icon name="text-box-plus" size={24} color="#007AFF" />
                <Text style={styles.actionButtonText}>
                  Добавить слово или выражение
                </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  backButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
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
  addFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    margin: 15,
  },
  addFolderText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginVertical: 10,
    marginHorizontal: 15,
  },
  inputContainer: {
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
  submitButton: {
    backgroundColor: '#f9a825',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'column',
    paddingHorizontal: 15,
    marginVertical: 10,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    width: '100%',
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  folderContainer: {
    marginBottom: 20,
  },
  subfolderContainer: {
    padding: 10,
  },
  addIcon: {
    marginRight: 0, // Removed margin
  },
  addButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  subfolderList: {
    padding: 10,
  },
  subfolderText: {
    fontSize: 16,
    marginBottom: 5,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  addSubfolderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -20, // Move the plus icon and text closer to the folder container
  },
  addSubfolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addSubfolderText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 0, // Removed margin
  },
  folderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  listIconButton: {
    marginLeft: 10,
  },
});

export default FoldersScreen;
