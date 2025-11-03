import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
// Adicionado ícone 'Ban' para o botão de cancelar
import { Clock, MapPin, CircleCheck as CheckCircle, Navigation, Star, MessageCircle, Ban } from 'lucide-react-native';

// Interface da Corrida (garanta que é a mesma usada no seu hook)
interface Corrida {
  id: string;
  origem: string;
  destino: string;
  status_corrida: string;
  valor_estimado: number;
  tipo_servico: string;
  tempo_estimado?: number;
  created_at: string; // Adicionado para lógica de tempo, se necessário no futuro
  updated_at: string; // Adicionado para lógica de tempo
}

// PROPS ATUALIZADAS para receber a função de cancelamento
interface StatusCorridaProps {
  corrida: Corrida;
  onAtualizarStatus: (corridaId: string, novoStatus: string) => Promise<void>;
  onCancelarCorrida: () => Promise<void>; // <-- NOVA PROP RECEBIDA
  userType: 'cliente' | 'motoboy' | 'admin'; // Adicionado 'admin' por segurança
}

export function StatusCorrida({
  corrida,
  onAtualizarStatus,
  onCancelarCorrida, // <-- PROP SENDO USADA
  userType
}: StatusCorridaProps) {

  const getStatusText = () => {
    switch (corrida.status_corrida) {
      case 'pendente': return 'Procurando motoboy...';
      case 'aceito': return 'Motoboy a caminho';
      case 'em_andamento': return 'Em andamento';
      case 'concluido': return 'Corrida concluída';
      case 'cancelado': return 'Corrida Cancelada';
      case 'cancelado_com_multa': return 'Cancelada (com multa)';
      default: return corrida.status_corrida;
    }
  };

  const getStatusColor = () => {
    switch (corrida.status_corrida) {
      case 'pendente': return '#F59E0B'; // Laranja
      case 'aceito': return '#3B82F6'; // Azul
      case 'em_andamento': return '#10B981'; // Verde Claro
      case 'concluido': return '#059669'; // Verde Escuro
      case 'cancelado':
      case 'cancelado_com_multa': return '#EF4444'; // Vermelho
      default: return '#6B7280'; // Cinza
    }
  };

  // Determina qual botão de ação principal mostrar
  const getProximaAcao = () => {
    if (userType === 'cliente') {
      switch (corrida.status_corrida) {
        case 'concluido':
          return { text: 'Avaliar Motoboy', action: 'avaliar', icon: Star };
        default:
          return null; // Cliente não tem ação principal durante a corrida
      }
    } else { // Motoboy
      switch (corrida.status_corrida) {
        case 'aceito':
          return { text: 'Iniciar Corrida', action: 'iniciar', icon: Navigation };
        case 'em_andamento':
          return { text: 'Concluir Corrida', action: 'concluir', icon: CheckCircle };
        default:
          return null; // Motoboy não tem ação principal em outros status
      }
    }
  };

  const handleAcao = async (action: string) => {
    try {
      switch (action) {
        case 'iniciar':
          await onAtualizarStatus(corrida.id, 'em_andamento');
          break;
        case 'concluir':
          await onAtualizarStatus(corrida.id, 'concluido');
          Alert.alert('Sucesso', 'Corrida concluída!');
          break;
        case 'avaliar':
          // Simula sistema de avaliação (pode ser melhorado)
          Alert.alert(
            'Avaliar Motoboy',
            'Como você avalia esta corrida?',
            [
              { text: '⭐', onPress: () => console.log('1 estrela') },
              { text: '⭐⭐', onPress: () => console.log('2 estrelas') },
              { text: '⭐⭐⭐', onPress: () => console.log('3 estrelas') },
              { text: '⭐⭐⭐⭐', onPress: () => console.log('4 estrelas') },
              { text: '⭐⭐⭐⭐⭐', onPress: () => console.log('5 estrelas') },
            ]
          );
          break;
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar status da corrida');
    }
  };

  const proximaAcao = getProximaAcao();
  const podeCancelar = ['pendente', 'aceito', 'em_andamento'].includes(corrida.status_corrida);

  return (
    <View style={styles.container}>
      {/* Header com Status */}
      <View style={styles.header}>
        <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
          <Clock size={16} color="#FFFFFF" />
        </View>
        <View style={styles.statusInfo}>
          <Text style={styles.statusText}>{getStatusText()}</Text>
          <Text style={styles.tipoServico}>{corrida.tipo_servico}</Text>
        </View>
      </View>

      {/* Locais de Origem e Destino */}
      <View style={styles.locaisContainer}>
        <View style={styles.localItem}>
          <View style={[styles.marcadorLocal, { backgroundColor: '#3B82F6' }]}>
            <MapPin size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.localText} numberOfLines={1}>
            {corrida.origem}
          </Text>
        </View>
        <View style={styles.linhaConectora} />
        <View style={styles.localItem}>
          <View style={[styles.marcadorLocal, { backgroundColor: '#EF4444' }]}>
            <MapPin size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.localText} numberOfLines={1}>
            {corrida.destino}
          </Text>
        </View>
      </View>

      {/* Informações de Valor e Tempo */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Valor</Text>
          <Text style={styles.infoValue}>R$ {corrida.valor_estimado.toFixed(2)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Tempo Est.</Text>
          <Text style={styles.infoValue}>
            {corrida.tempo_estimado || '--'} min
          </Text>
        </View>
      </View>

      {/* Botão de Ação Principal (Iniciar/Concluir/Avaliar) */}
      {proximaAcao && (
        <TouchableOpacity
          style={styles.acaoButton}
          onPress={() => handleAcao(proximaAcao.action)}
        >
          <proximaAcao.icon size={20} color="#FFFFFF" />
          <Text style={styles.acaoButtonText}>{proximaAcao.text}</Text>
        </TouchableOpacity>
      )}

      {/* --- BOTÃO DE CANCELAR ADICIONADO --- */}
      {/* Mostra o botão apenas se a corrida pode ser cancelada */}
      {podeCancelar && (
        <TouchableOpacity
          style={styles.cancelarButton} // Novo estilo
          onPress={onCancelarCorrida}   // Chama a função recebida
        >
          <Ban size={18} color="#FFFFFF" />
          <Text style={styles.cancelarButtonText}>Cancelar Corrida</Text>
        </TouchableOpacity>
      )}

      {/* Botão Secundário (Mensagem) */}
      <View style={styles.acoesSec}>
        <TouchableOpacity style={styles.acaoSecButton}>
          <MessageCircle size={16} color="#6B7280" />
          <Text style={styles.acaoSecText}>Mensagem</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ESTILOS (Antigos + Novos)
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30, // Espaço extra
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  tipoServico: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  locaisContainer: {
    marginBottom: 20,
  },
  localItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom removido para a linha conectar melhor
  },
  marcadorLocal: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  linhaConectora: {
    width: 2,
    height: 20, // Altura da linha entre os marcadores
    backgroundColor: '#E5E7EB',
    marginLeft: 13, // Alinha com o centro do marcador
    marginVertical: -6, // Puxa a linha para conectar os itens
  },
  localText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  acaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12, // Espaço antes do botão cancelar/ações sec
  },
  acaoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // --- NOVOS ESTILOS PARA O BOTÃO CANCELAR ---
  cancelarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444', // Vermelho
    paddingVertical: 14, // Um pouco menor que o principal
    borderRadius: 10,
    marginTop: 8, // Espaço após o botão principal (se existir)
    marginBottom: 12,
  },
  cancelarButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // --- FIM DOS NOVOS ESTILOS ---

  acoesSec: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  acaoSecButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  acaoSecText: {
    color: '#6B7280',
    fontSize: 14,
    marginLeft: 6,
  },
});