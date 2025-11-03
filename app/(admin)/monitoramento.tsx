import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MapPin, Navigation, Clock, Activity, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Users } from 'lucide-react-native';
import { useAdminData } from '@/hooks/useAdminData';
import { MapaComponent } from '@/components/MapaComponent';

export default function MonitoramentoScreen() {
  const { corridasAdmin, usuariosAdmin, loading, reloadData } = useAdminData();
  const [refreshing, setRefreshing] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativas' | 'pendentes'>('ativas');

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await reloadData();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const corridasFiltradas = corridasAdmin.filter(corrida => {
    if (filtroStatus === 'ativas') {
      return ['aceito', 'em_andamento'].includes(corrida.status_corrida);
    }
    if (filtroStatus === 'pendentes') {
      return corrida.status_corrida === 'pendente';
    }
    return true;
  });

  const motoboysAtivos = usuariosAdmin.filter(user => 
    user.tipo_usuario === 'motoboy' && user.cnh_verificada
  ).length;

  const corridasEmAndamento = corridasAdmin.filter(corrida => 
    corrida.status_corrida === 'em_andamento'
  ).length;

  const corridasPendentes = corridasAdmin.filter(corrida => 
    corrida.status_corrida === 'pendente'
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return '#F59E0B';
      case 'aceito': return '#3B82F6';
      case 'em_andamento': return '#10B981';
      case 'concluido': return '#059669';
      case 'cancelado': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock size={16} color="#FFFFFF" />;
      case 'aceito': return <CheckCircle size={16} color="#FFFFFF" />;
      case 'em_andamento': return <Navigation size={16} color="#FFFFFF" />;
      case 'concluido': return <CheckCircle size={16} color="#FFFFFF" />;
      case 'cancelado': return <AlertCircle size={16} color="#FFFFFF" />;
      default: return <Activity size={16} color="#FFFFFF" />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Mapa de Monitoramento */}
      <View style={styles.mapaContainer}>
        <MapaComponent />
        
        {/* Overlay com estatísticas */}
        <View style={styles.statsOverlay}>
          <View style={styles.statItem}>
            <Users size={16} color="#2563EB" />
            <Text style={styles.statText}>{motoboysAtivos} ativos</Text>
          </View>
          <View style={styles.statItem}>
            <Navigation size={16} color="#10B981" />
            <Text style={styles.statText}>{corridasEmAndamento} em curso</Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={16} color="#F59E0B" />
            <Text style={styles.statText}>{corridasPendentes} pendentes</Text>
          </View>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        {[
          { key: 'ativas', label: 'Ativas' },
          { key: 'pendentes', label: 'Pendentes' },
          { key: 'todos', label: 'Todas' },
        ].map(filtro => (
          <TouchableOpacity
            key={filtro.key}
            style={[
              styles.filtroButton,
              filtroStatus === filtro.key && styles.filtroButtonActive
            ]}
            onPress={() => setFiltroStatus(filtro.key as any)}
          >
            <Text style={[
              styles.filtroText,
              filtroStatus === filtro.key && styles.filtroTextActive
            ]}>
              {filtro.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de Corridas */}
      <ScrollView 
        style={styles.corridasList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {corridasFiltradas.map((corrida) => (
          <View key={corrida.id} style={styles.corridaCard}>
            <View style={styles.corridaHeader}>
              <View style={styles.corridaInfo}>
                <Text style={styles.corridaId}>#{corrida.id.slice(-8)}</Text>
                <View style={styles.corridaTipoContainer}>
                  <Text style={styles.corridaTipo}>{corrida.tipo_servico}</Text>
                </View>
              </View>
              
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(corrida.status_corrida) }
                  ]}
                >
                  {getStatusIcon(corrida.status_corrida)}
                  <Text style={styles.statusText}>
                    {corrida.status_corrida.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.corridaDetalhes}>
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
              <View style={styles.participantes}>
                <Text style={styles.clienteNome}>
                  Cliente: {corrida.cliente?.nome || 'N/A'}
                </Text>
                {corrida.motoboy && (
                  <Text style={styles.motoboyNome}>
                    Motoboy: {corrida.motoboy.nome}
                  </Text>
                )}
              </View>
              
              <View style={styles.corridaValores}>
                <Text style={styles.corridaValor}>
                  R$ {corrida.valor_final?.toFixed(2) || corrida.valor_estimado.toFixed(2)}
                </Text>
                <Text style={styles.corridaTempo}>
                  {new Date(corrida.created_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            </View>

            {/* Indicador de tempo real para corridas ativas */}
            {['aceito', 'em_andamento'].includes(corrida.status_corrida) && (
              <View style={styles.tempoRealIndicator}>
                <Activity size={12} color="#10B981" />
                <Text style={styles.tempoRealText}>Monitorando em tempo real</Text>
              </View>
            )}
          </View>
        ))}

        {corridasFiltradas.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Nenhuma corrida {filtroStatus === 'todos' ? '' : filtroStatus} encontrada
            </Text>
            <Text style={styles.emptySubtext}>
              As corridas aparecerão aqui em tempo real
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
  mapaContainer: {
    height: 300,
    position: 'relative',
  },
  statsOverlay: {
    position: 'absolute',
    top: 60, // Ajuste se precisar de mais espaço do topo (SafeArea)
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 6,
  },
  filtrosContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
  },
  filtroButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filtroButtonActive: {
    backgroundColor: '#2563EB',
  },
  filtroText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filtroTextActive: {
    color: '#FFFFFF',
  },
  corridasList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  corridaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  corridaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  corridaId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 12,
  },
  corridaTipoContainer: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  corridaTipo: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  corridaDetalhes: {
    marginBottom: 12,
  },
  localItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  localText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  corridaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  participantes: {
    flex: 1,
  },
  clienteNome: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  motoboyNome: {
    fontSize: 12,
    color: '#6B7280',
  },
  corridaValores: {
    alignItems: 'flex-end',
  },
  corridaValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  corridaTempo: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  tempoRealIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopColor: '#F3F4F6',
    borderTopWidth: 1,
  },
  tempoRealText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 6,
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

// A LINHA DUPLICADA FOI REMOVIDA DAQUI