import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Calendar, MapPin, Clock, DollarSign, Star } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useHistorico } from '@/hooks/useHistorico';

export default function HistoricoScreen() {
  const { userType } = useAuth();
  const { historicoCorridas, totalGanhos, totalCorridas } = useHistorico();
  const [filtroMes, setFiltroMes] = useState('todos');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return '#10B981';
      case 'cancelado':
        return '#EF4444';
      case 'em_andamento':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      case 'em_andamento':
        return 'Em Andamento';
      case 'pendente':
        return 'Pendente';
      case 'aceito':
        return 'Aceito';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico de Corridas</Text>
        
        {userType === 'motoboy' && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalCorridas}</Text>
              <Text style={styles.statLabel}>Corridas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>R$ {totalGanhos.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Ganho</Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView style={styles.historicoList}>
        {historicoCorridas.map((corrida) => (
          <View key={corrida.id} style={styles.corridaCard}>
            <View style={styles.corridaHeader}>
              <View style={styles.dataContainer}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.dataText}>
                  {new Date(corrida.created_at).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(corrida.status_corrida) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(corrida.status_corrida)}
                </Text>
              </View>
            </View>

            <View style={styles.tipoContainer}>
              <Text style={styles.tipoText}>{corrida.tipo_servico}</Text>
            </View>

            <View style={styles.locaisContainer}>
              <View style={styles.localItem}>
                <MapPin size={14} color="#2563EB" />
                <Text style={styles.localText} numberOfLines={1}>
                  {corrida.origem}
                </Text>
              </View>
              <View style={styles.localItem}>
                <MapPin size={14} color="#EF4444" />
                <Text style={styles.localText} numberOfLines={1}>
                  {corrida.destino}
                </Text>
              </View>
            </View>

            <View style={styles.corridaFooter}>
              <View style={styles.infoContainer}>
                <View style={styles.infoItem}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.infoText}>
                    {corrida.duracao || '--'} min
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.distanciaText}>
                    {corrida.distancia || (Math.random() * 10 + 2).toFixed(1)} km
                  </Text>
                </View>
              </View>

              <View style={styles.valorContainer}>
                <DollarSign size={18} color="#059669" />
                <Text style={styles.valorText}>
                  R$ {corrida.valor_final?.toFixed(2) || corrida.valor_estimado.toFixed(2)}
                </Text>
              </View>
            </View>

            {corrida.avaliacao && (
              <View style={styles.avaliacaoContainer}>
                <View style={styles.estrelasContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      color={star <= corrida.avaliacao! ? '#F59E0B' : '#E5E7EB'}
                      fill={star <= corrida.avaliacao! ? '#F59E0B' : 'none'}
                    />
                  ))}
                </View>
              </View>
            )}
          </View>
        ))}

        {historicoCorridas.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhuma corrida realizada ainda</Text>
            <Text style={styles.emptySubtext}>
              Suas corridas aparecerão aqui após serem concluídas
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
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 0.45,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  historicoList: {
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
    marginBottom: 12,
  },
  dataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tipoContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  tipoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    textTransform: 'capitalize',
  },
  locaisContainer: {
    marginBottom: 16,
  },
  localItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  localText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  corridaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  distanciaText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
  avaliacaoContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
  },
  estrelasContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
});