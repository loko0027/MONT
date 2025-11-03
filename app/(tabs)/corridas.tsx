import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Clock, MapPin, DollarSign } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useCorridas } from '@/hooks/useCorridas';

export default function CorridasScreen() {
  const { userType } = useAuth();
  const { corridasDisponiveis, aceitarCorrida } = useCorridas();

  if (userType !== 'motoboy') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Acesso apenas para motoboys</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Corridas Disponíveis</Text>
        <Text style={styles.subtitle}>
          {corridasDisponiveis.length} corridas aguardando
        </Text>
      </View>

      <ScrollView style={styles.corridasList}>
        {corridasDisponiveis.map((corrida) => (
          <View key={corrida.id} style={styles.corridaCard}>
            <View style={styles.corridaHeader}>
              <View style={styles.tipoContainer}>
                <Text style={styles.tipoText}>{corrida.tipo_servico}</Text>
              </View>
              <Text style={styles.distanciaText}>
                ~{(Math.random() * 10 + 2).toFixed(1)} km
              </Text>
            </View>

            <View style={styles.locaisContainer}>
              <View style={styles.localItem}>
                <MapPin size={16} color="#2563EB" />
                <Text style={styles.localText} numberOfLines={1}>
                  {corrida.origem}
                </Text>
              </View>
              <View style={styles.localItem}>
                <MapPin size={16} color="#EF4444" />
                <Text style={styles.localText} numberOfLines={1}>
                  {corrida.destino}
                </Text>
              </View>
            </View>

            <View style={styles.corridaFooter}>
              <View style={styles.valorContainer}>
                <DollarSign size={20} color="#059669" />
                <Text style={styles.valorText}>
                  R$ {corrida.valor_estimado.toFixed(2)}
                </Text>
              </View>

              <View style={styles.tempoContainer}>
                <Clock size={16} color="#6B7280" />
                <Text style={styles.tempoText}>
                  {Math.floor(Math.random() * 30 + 5)}min
                </Text>
              </View>

              <TouchableOpacity
                style={styles.aceitarButton}
                onPress={() => aceitarCorrida(corrida.id)}
              >
                <Text style={styles.aceitarButtonText}>Aceitar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {corridasDisponiveis.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Nenhuma corrida disponível no momento
            </Text>
            <Text style={styles.emptySubtext}>
              Novas corridas aparecerão aqui automaticamente
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 60,
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  corridasList: {
    flex: 1,
    padding: 16,
  },
  corridaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  corridaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipoContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tipoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    textTransform: 'capitalize',
  },
  distanciaText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  locaisContainer: {
    marginBottom: 20,
  },
  localItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  localText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  corridaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginLeft: 4,
  },
  tempoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempoText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  aceitarButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  aceitarButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 100,
  },
});