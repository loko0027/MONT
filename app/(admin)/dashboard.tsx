import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { ChartBar as BarChart3, Users, Car, DollarSign, Clock, TrendingUp, Activity, MapPin } from 'lucide-react-native';
import { useAdminData } from '@/hooks/useAdminData';

export default function AdminDashboard() {
  const { stats, corridasAdmin, usuariosAdmin, loading, atualizarEstatisticas } = useAdminData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await atualizarEstatisticas();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return '#F59E0B';
      case 'aceito':
      case 'em_andamento': return '#3B82F6';
      case 'concluido': return '#10B981';
      case 'cancelado': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const corridasRecentes = corridasAdmin.slice(0, 5);

  if (loading) return null;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Admin</Text>
        <Text style={styles.subtitle}>Visão geral do sistema MotoON</Text>
      </View>

      {/* Cards de Estatísticas */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
            <Users size={24} color="#2563EB" />
          </View>
          <Text style={styles.statValue}>{stats?.total_usuarios || 0}</Text>
          <Text style={styles.statLabel}>Total Usuários</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
            <Car size={24} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{stats?.total_corridas || 0}</Text>
          <Text style={styles.statLabel}>Total Corridas</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
            <Clock size={24} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>{stats?.corridas_pendentes || 0}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
            <DollarSign size={24} color="#059669" />
          </View>
          <Text style={styles.statValue}>R$ {stats?.receita_dia?.toFixed(2) || '0.00'}</Text>
          <Text style={styles.statLabel}>Receita Hoje</Text>
        </View>
      </View>

      {/* Resumo Rápido */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumo do Sistema</Text>
        <View style={styles.resumoContainer}>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoValue}>{stats?.total_clientes || 0}</Text>
            <Text style={styles.resumoLabel}>Clientes</Text>
          </View>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoValue}>{stats?.total_motoboys || 0}</Text>
            <Text style={styles.resumoLabel}>Motoboys</Text>
          </View>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoValue}>{stats?.corridas_em_andamento || 0}</Text>
            <Text style={styles.resumoLabel}>Em Andamento</Text>
          </View>
          <View style={styles.resumoItem}>
            <Text style={styles.resumoValue}>{stats?.corridas_concluidas || 0}</Text>
            <Text style={styles.resumoLabel}>Concluídas</Text>
          </View>
        </View>
      </View>

      {/* Corridas Recentes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Corridas Recentes</Text>
          <TouchableOpacity style={styles.verMaisButton}>
            <Text style={styles.verMaisText}>Ver Todas</Text>
          </TouchableOpacity>
        </View>

        {corridasRecentes.map((corrida) => (
          <View key={corrida.id} style={styles.corridaCard}>
            <View style={styles.corridaHeader}>
              <View style={styles.corridaInfo}>
                <Text style={styles.corridaId}>#{corrida.id.slice(-8)}</Text>
                <Text style={styles.corridaTipo}>{corrida.tipo_servico}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(corrida.status_corrida) },
                ]}
              >
                <Text style={styles.statusText}>{corrida.status_corrida}</Text>
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
              <Text style={styles.clienteNome}>
                Cliente: {corrida.cliente?.nome || 'N/A'}
              </Text>
              <Text style={styles.corridaValor}>
                R$ {corrida.valor_final?.toFixed(2) || corrida.valor_estimado.toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Ações Rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.acoesGrid}>
          <TouchableOpacity style={styles.acaoCard}>
            <BarChart3 size={24} color="#2563EB" />
            <Text style={styles.acaoText}>Relatórios</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.acaoCard}>
            <Users size={24} color="#10B981" />
            <Text style={styles.acaoText}>Usuários</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.acaoCard}>
            <Activity size={24} color="#F59E0B" />
            <Text style={styles.acaoText}>Monitoramento</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.acaoCard}>
            <TrendingUp size={24} color="#8B5CF6" />
            <Text style={styles.acaoText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  verMaisButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  verMaisText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  resumoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  resumoItem: {
    alignItems: 'center',
  },
  resumoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  resumoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  corridaCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  corridaTipo: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textTransform: 'capitalize',
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
    alignItems: 'center',
  },
  clienteNome: {
    fontSize: 14,
    color: '#6B7280',
  },
  corridaValor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  acoesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  acaoCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  acaoText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  demoNotice: {
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  demoNoticeText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '600',
  },
});