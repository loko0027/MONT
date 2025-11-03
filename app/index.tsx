import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// O _layout.tsx irá redirecionar o usuário para longe daqui
// assim que o auth terminar de carregar.
export default function Index() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Carregando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});