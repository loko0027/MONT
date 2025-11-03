import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { User, CircleCheck as CheckCircle, Circle as XCircle, Ban, Search, Star, FileText, Phone, Calendar } from 'lucide-react-native';
import { useAdminData } from '@/hooks/useAdminData';

export default function MotoboyManagementScreen() {
  const { usuariosAdmin, loading, aprovarMotoboy, rejeitarMotoboy, banirUsuario } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendentes' | 'aprovados' | 'banidos'>('todos');

  const motoboys = usuariosAdmin.filter(user => user.tipo_usuario === 'motoboy');
  
  const motoboysFiltrados = motoboys.filter(motoboy => {
    const matchesSearch = motoboy.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         motoboy.telefone.includes(searchTerm);
    
    const matchesStatus = filtroStatus === 'todos' || 
                         (filtroStatus === 'pendentes' && !motoboy.cnh_verificada) ||
                         (filtroStatus === 'aprovados' && motoboy.cnh_verificada) ||
                         (filtroStatus === 'banidos' && motoboy.banido);
    
    return matchesSearch && matchesStatus;
  });

  const handleAprovar = async (motoboyId: string, nome: string) => {
    Alert.alert(
      'Aprovar Motoboy',
      `Deseja aprovar ${nome} como motoboy ativo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Aprovar', 
          onPress: async () => {
            try {
              await aprovarMotoboy(motoboyId);
              Alert.alert('Sucesso', 'Motoboy aprovado com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao aprovar motoboy');
            }
          }
        },
      ]
    );
  };

  const handleRejeitar = async (motoboyId: string, nome: string) => {
    Alert.alert(
      'Rejeitar Cadastro',
      `Deseja rejeitar o cadastro de ${nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Rejeitar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await rejeitarMotoboy(motoboyId);
              Alert.alert('Sucesso', 'Cadastro rejeitado');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao rejeitar cadastro');
            }
          }
        },
      ]
    );
  };

  const handleBanir = async (motoboyId: string, nome: string) => {
    Alert.alert(
      'Banir Usuário',
      `Deseja banir ${nome} permanentemente?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Banir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await banirUsuario(motoboyId);
              Alert.alert('Sucesso', 'Usuário banido');
            } catch (error) {
              Alert.alert('Erro', 'Falha ao banir usuário');
            }
          }
        },
      ]
    );
  };

  const getStatusColor = (motoboy: any) => {
    if (motoboy.banido) return '#EF4444';
    if (motoboy.cnh_verificada && motoboy.documento_moto_verificado) return '#10B981';
    return '#F59E0B';
  };

  const getStatusText = (motoboy: any) => {
    if (motoboy.banido) return 'Banido';
    if (motoboy.cnh_verificada && motoboy.documento_moto_verificado) return 'Aprovado';
    return 'Pendente';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gerenciar Motoboys</Text>
        <Text style={styles.subtitle}>
          {motoboysFiltrados.length} motoboys encontrados
        </Text>
      </View>

      {/* Barra de Pesquisa */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtrosContainer}>
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'pendentes', label: 'Pendentes' },
          { key: 'aprovados', label: 'Aprovados' },
          { key: 'banidos', label: 'Banidos' },
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
      </ScrollView>

      {/* Lista de Motoboys */}
      <ScrollView style={styles.motoboysList}>
        {motoboysFiltrados.map((motoboy) => (
          <View key={motoboy.id} style={styles.motoboyCard}>
            <View style={styles.motoboyHeader}>
              <View style={styles.motoboyInfo}>
                <View style={styles.avatarContainer}>
                  <User size={24} color="#FFFFFF" />
                </View>
                <View style={styles.motoboyDetails}>
                  <Text style={styles.motoboyNome}>{motoboy.nome}</Text>
                  <View style={styles.motoboyMeta}>
                    <Phone size={14} color="#6B7280" />
                    <Text style={styles.motoboyTelefone}>{motoboy.telefone}</Text>
                  </View>
                  <View style={styles.motoboyMeta}>
                    <Calendar size={14} color="#6B7280" />
                    <Text style={styles.motoboyData}>
                      {new Date(motoboy.created_at).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(motoboy) }
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(motoboy)}
                </Text>
              </View>
            </View>

            {/* Avaliação e Documentos */}
            <View style={styles.motoboyStats}>
              <View style={styles.statItem}>
                <Star size={16} color="#F59E0B" />
                <Text style={styles.statText}>
                  {motoboy.avaliacao?.toFixed(1) || '5.0'}
                </Text>
              </View>
              
              <View style={styles.documentosStatus}>
                <View style={styles.documentoItem}>
                  <FileText size={14} color={motoboy.cnh_verificada ? '#10B981' : '#EF4444'} />
                  <Text style={[
                    styles.documentoText,
                    { color: motoboy.cnh_verificada ? '#10B981' : '#EF4444' }
                  ]}>
                    CNH
                  </Text>
                </View>
                
                <View style={styles.documentoItem}>
                  <FileText size={14} color={motoboy.documento_moto_verificado ? '#10B981' : '#EF4444'} />
                  <Text style={[
                    styles.documentoText,
                    { color: motoboy.documento_moto_verificado ? '#10B981' : '#EF4444' }
                  ]}>
                    Moto
                  </Text>
                </View>
              </View>
            </View>

            {/* Ações */}
            <View style={styles.acoesContainer}>
              {!motoboy.cnh_verificada && !motoboy.banido && (
                <>
                  <TouchableOpacity
                    style={[styles.acaoButton, styles.aprovarButton]}
                    onPress={() => handleAprovar(motoboy.id, motoboy.nome)}
                  >
                    <CheckCircle size={16} color="#FFFFFF" />
                    <Text style={styles.acaoButtonText}>Aprovar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.acaoButton, styles.rejeitarButton]}
                    onPress={() => handleRejeitar(motoboy.id, motoboy.nome)}
                  >
                    <XCircle size={16} color="#FFFFFF" />
                    <Text style={styles.acaoButtonText}>Rejeitar</Text>
                  </TouchableOpacity>
                </>
              )}
              
              {!motoboy.banido && (
                <TouchableOpacity
                  style={[styles.acaoButton, styles.banirButton]}
                  onPress={() => handleBanir(motoboy.id, motoboy.nome)}
                >
                  <Ban size={16} color="#FFFFFF" />
                  <Text style={styles.acaoButtonText}>Banir</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {motoboysFiltrados.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum motoboy encontrado</Text>
            <Text style={styles.emptySubtext}>
              Tente ajustar os filtros de busca
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filtrosContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
  motoboysList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  motoboyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  motoboyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  motoboyInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  motoboyDetails: {
    flex: 1,
  },
  motoboyNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  motoboyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  motoboyTelefone: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  motoboyData: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  motoboyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopColor: '#F3F4F6',
    borderTopWidth: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 6,
  },
  documentosStatus: {
    flexDirection: 'row',
  },
  documentoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  documentoText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  acoesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  acaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  aprovarButton: {
    backgroundColor: '#10B981',
  },
  rejeitarButton: {
    backgroundColor: '#F59E0B',
  },
  banirButton: {
    backgroundColor: '#EF4444',
  },
  acaoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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