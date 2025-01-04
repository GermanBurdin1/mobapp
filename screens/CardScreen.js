import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CardScreen = ({ route }) => {
  const { card } = route.params;
  const [translation, setTranslation] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [savedTranslation, setSavedTranslation] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    const fetchSavedTranslation = async () => {
      try {
        const storedTranslations = await AsyncStorage.getItem('translations');
        const translations = storedTranslations ? JSON.parse(storedTranslations) : {};
        setSavedTranslation(translations[card] || '');
      } catch (error) {
        console.error('Ошибка загрузки перевода:', error);
      }
    };
    fetchSavedTranslation();
  }, [card]);

  const translateWord = async () => {
    if (!card || !card.trim()) {
      Alert.alert('Ошибка', 'Введите слово для перевода.');
      return;
    }

    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(card)}&langpair=ru|en`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка API:', response.status, response.statusText, errorText);
        Alert.alert('Ошибка', `API вернул ошибку: ${response.statusText} (${errorText})`);
        return;
      }

      const data = await response.json();

      if (data.responseData && data.responseData.translatedText) {
        setTranslatedText(data.responseData.translatedText);
        Alert.alert('Перевод', `Перевод: ${data.responseData.translatedText}`);
      } else {
        console.error('Ответ не содержит перевода:', data);
        Alert.alert('Ошибка', 'Не удалось перевести слово.');
      }
    } catch (error) {
      console.error('Ошибка при подключении к API:', error);
      Alert.alert('Ошибка', 'Произошла ошибка при подключении к API.');
    }
  };

  const saveTranslation = async (text) => {
    if (!text.trim()) {
      Alert.alert('Ошибка', 'Введите перевод.');
      return;
    }
    try {
      const storedTranslations = await AsyncStorage.getItem('translations');
      const translations = storedTranslations ? JSON.parse(storedTranslations) : {};
      translations[card] = text;
      await AsyncStorage.setItem('translations', JSON.stringify(translations));
      setSavedTranslation(text);
      Alert.alert('Успех', `Перевод "${text}" сохранён.`);
      setTranslation('');
    } catch (error) {
      console.error('Ошибка сохранения перевода:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить перевод.');
    }
  };

  const deleteTranslation = async () => {
    try {
      const storedTranslations = await AsyncStorage.getItem('translations');
      const translations = storedTranslations ? JSON.parse(storedTranslations) : {};
      delete translations[card];
      await AsyncStorage.setItem('translations', JSON.stringify(translations));
      setSavedTranslation('');
      Alert.alert('Успех', 'Перевод удалён.');
    } catch (error) {
      console.error('Ошибка удаления перевода:', error);
      Alert.alert('Ошибка', 'Не удалось удалить перевод.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Слово</Text>
      <Text style={styles.cardText}>{card}</Text>
      <Button title="Перевести" onPress={translateWord} />
      {translatedText && (
        <>
          <Text style={styles.translationText}>
            Предложенный перевод: {translatedText}
          </Text>
          <View style={styles.buttonContainer}>
            <Button
              title="Сохранить предложенный перевод"
              onPress={() => saveTranslation(translatedText)}
            />
            <Button
              title="Предложить свой перевод"
              onPress={() => setShowCustomInput(true)}
            />
          </View>
        </>
      )}
      {showCustomInput && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Введите ваш перевод..."
            value={translation}
            onChangeText={setTranslation}
          />
          <Button
            title="Сохранить свой перевод"
            onPress={() => {
              saveTranslation(translation);
              setShowCustomInput(false);
            }}
          />
        </>
      )}
      {savedTranslation ? (
        <>
          <Text style={styles.savedTranslationText}>
            Сохранённый перевод: {savedTranslation}
          </Text>
          <Button title="Удалить перевод" onPress={deleteTranslation} />
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cardText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    width: '80%',
    marginBottom: 20,
  },
  translationText: {
    fontSize: 16,
    marginTop: 10,
    fontStyle: 'italic',
  },
  savedTranslationText: {
    fontSize: 18,
    color: 'green',
    marginTop: 20,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

export default CardScreen;
