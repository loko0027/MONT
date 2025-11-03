// components/AddressSearchModal.tsx
import React from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { X } from 'lucide-react-native';

interface Coordenada {
  latitude: number;
  longitude: number;
}

interface AddressSearchModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAddressSelect: (address: string, coords: Coordenada) => void;
  placeholder?: string;
}

export const AddressSearchModal: React.FC<AddressSearchModalProps> = ({
  isVisible,
  onClose,
  onAddressSelect,
  placeholder = "Buscar endereço...",
}) => {
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Buscar Endereço</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={28} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Campo de busca */}
        <GooglePlacesAutocomplete
          placeholder={placeholder}
          query={{
            key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
            language: 'pt-BR',
            components: 'country:br',
          }}
          fetchDetails={true}
          onPress={(data, details = null) => {
            if (details) {
              const { lat, lng } = details.geometry.location;
              const coords = { latitude: lat, longitude: lng };
              onAddressSelect(data.description, coords);
              onClose();
            }
          }}
          styles={{
            textInputContainer: styles.inputContainer,
            textInput: styles.input,
            listView: styles.listView,
          }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
  },
  input: {
    height: 50,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#111827',
  },
  listView: {
    backgroundColor: '#FFFFFF',
  },
});
