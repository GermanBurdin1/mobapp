import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/ProfileScreen';
import DictionaryScreen from '../screens/DictionaryScreen';
import FoldersScreen from '../screens/FoldersScreen';
import CardScreen from '../screens/CardScreen';

const Stack = createStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Profile" component={ProfileScreen} />
			<Stack.Screen name="Dictionary" component={DictionaryScreen} />
			<Stack.Screen name="FoldersScreen" component={FoldersScreen} />
			<Stack.Screen name="CardScreen" component={CardScreen} />
    </Stack.Navigator>
  );
};

export default StackNavigator;
