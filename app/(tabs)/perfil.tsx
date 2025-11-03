import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { 
  User, 
  Phone, 
  DollarSign,
  Star, 
  FileText, 
  Camera,
  LogOut,
  Settings
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useSaldoMotoboy } from '@/hooks/useSaldoMotoboy';

export default function PerfilScreen() {
  const { user, userType, signOut, userProfile } = useAuth();
  const { saldoTotal, saldoItems } = useSaldoMotoboy();

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleUploadDocument = (tipo: string) => {
    Alert.alert(
      'Upload de Documento',
      `Funcionalidade de upload de ${tipo} será implementada aqui`
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.userName}>{userProfile?.nome || 'Usuário'}</Text>
        <Text style={styles.userType}>
          {userType === 'cliente' ? 'Cliente' : 'Motoboy'}
        </Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>
        
        <View style={styles.infoItem}>
          <Phone size={20} color="#6B7280" />
          <Text style={styles.infoText}>{userProfile?.telefone || 'Não informado'}</Text>
        </View>

        <View style={styles.infoItem}>
          <User size={20} color="#6B7280" />
          <Text style={styles.infoText}>{user?.email}</Text>
        </View>

        {userType === 'motoboy' && userProfile?.avaliacao && (
          <View style={styles.infoItem}>
            <Star size={20} color="#F59E0B" />
            <Text style={styles.infoText}>
              {userProfile.avaliacao.toFixed(1)} estrelas
            </Text>
          </View>
        )}
      </View>

      {/* Seção de Saldo para Motoboys */}
      {userType === 'motoboy' && (
        <View style={styles.saldoSection}>
          <Text style={styles.sectionTitle}>Meu Saldo</Text>
          
          <View style={styles.saldoCard}>
            <View style={styles.saldoHeader}>
              <DollarSign size={24} color="#059669" />
              <Text style={styles.saldoTotal}>R$ {saldoTotal.toFixed(2)}</Text>
            </View>
            <Text style={styles.saldoDescricao}>
              Saldo disponível de corridas concluídas
            </Text>
          </View>

          <Text style={styles.saldoHistoricoTitle}>Últimas Corridas</Text>
          {saldoItems.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.saldoItem}>
              <View style={styles.saldoItemInfo}>
                <Text style={styles.saldoItemData}>
                  {new Date(item.data_corrida).toLocaleDateString('pt-BR')}
                </Text>
                <Text style={styles.saldoItemValor}>
                  R$ {item.valor_motoboy.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.saldoItemTotal}>
                Total: R$ {item.valor_corrida.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {userType === 'motoboy' && (
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Documentos</Text>
          
          <TouchableOpacity 
            style={styles.documentItem}
            onPress={() => handleUploadDocument('CNH')}
          >
            <FileText size={20} color="#2563EB" />
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>CNH</Text>
              <Text style={styles.documentStatus}>
                {userProfile?.cnh_verificada ? 'Verificada' : 'Pendente'}
              </Text>
            </View>
            <Camera size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.documentItem}
            onPress={() => handleUploadDocument('Documento da Moto')}
          >
            <FileText size={20} color="#2563EB" />
            <View style={styles.documentInfo}>
              <Text style={styles.documentTitle}>Documento da Moto</Text>
              <Text style={styles.documentStatus}>
                {userProfile?.documento_moto_verificado ? 'Verificado' : 'Pendente'}
              </Text>
            </View>
            <Camera size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.actionButton}>
          <Settings size={20} color="#4B5563" />
          <Text style={styles.actionText}>Configurações</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#EF4444" />
          <Text style={[styles.actionText, styles.logoutText]}>Sair</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#2563EB', alignItems: 'center', paddingTop: 60, paddingBottom: 40, paddingHorizontal: 20 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1D4ED8', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  userType: { fontSize: 16, color: '#BFDBFE', fontWeight: '500' },
  infoSection: { backgroundColor: '#FFFFFF', margin: 16, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomColor: '#F3F4F6', borderBottomWidth: 1 },
  infoText: { marginLeft: 16, fontSize: 16, color: '#4B5563', flex: 1 },
  documentsSection: { backgroundColor: '#FFFFFF', margin: 16, marginTop: 0, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  documentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomColor: '#F3F4F6', borderBottomWidth: 1 },
  documentInfo: { flex: 1, marginLeft: 16 },
  documentTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  documentStatus: { fontSize: 14, color: '#6B7280' },
  actionsSection: { backgroundColor: '#FFFFFF', margin: 16, marginTop: 0, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomColor: '#F3F4F6', borderBottomWidth: 1 },
  logoutButton: { borderBottomWidth: 0 },
  actionText: { marginLeft: 16, fontSize: 16, color: '#4B5563', fontWeight: '500' },
  logoutText: { color: '#EF4444' },
  saldoSection: { backgroundColor: '#FFFFFF', margin: 16, marginTop: 0, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  saldoCard: { backgroundColor: '#F0FDF4', padding: 20, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  saldoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  saldoTotal: { fontSize: 32, fontWeight: 'bold', color: '#059669', marginLeft: 12 },
  saldoDescricao: { fontSize: 14, color: '#059669', textAlign: 'center' },
  saldoHistoricoTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  saldoItem: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 8 },
  saldoItemInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  saldoItemData: { fontSize: 14, color: '#6B7280' },
  saldoItemValor: { fontSize: 16, fontWeight: 'bold', color: '#059669' },
  saldoItemTotal: { fontSize: 12, color: '#9CA3AF' },
});
