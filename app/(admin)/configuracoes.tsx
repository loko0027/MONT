import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { 
  DollarSign, 
  Star, 
  Settings, 
  Save,
  TrendingUp,
  Award
} from 'lucide-react-native';
import { useAdminData } from '@/hooks/useAdminData';
import { useTarifas } from '@/hooks/useTarifas';

export default function ConfiguracoesScreen() {
  const { tarifas, atualizarTarifa } = useTarifas();
  
  const [tarifaPessoa, setTarifaPessoa] = useState({
    taxa_base: '8.00',
    taxa_por_km: '3.50'
  });
  const [tarifaMercadoria, setTarifaMercadoria] = useState({
    taxa_base: '5.00',
    taxa_por_km: '2.00'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tarifas.length > 0) {
      const pessoaTarifa = tarifas.find(t => t.tipo_servico === 'pessoa');
      const mercadoriaTarifa = tarifas.find(t => t.tipo_servico === 'mercadoria');
      
      if (pessoaTarifa) {
        setTarifaPessoa({
          taxa_base: pessoaTarifa.taxa_base.toString(),
          taxa_por_km: pessoaTarifa.taxa_por_km.toString()
        });
      }
      
      if (mercadoriaTarifa) {
        setTarifaMercadoria({
          taxa_base: mercadoriaTarifa.taxa_base.toString(),
          taxa_por_km: mercadoriaTarifa.taxa_por_km.toString()
        });
      }
    }
  }, [tarifas]);

  // Níveis de qualidade de serviço
  const [niveisQualidade, setNiveisQualidade] = useState([
    { id: 'pessimo', nome: 'Péssimo', multiplicador: 0.8, cor: '#EF4444' },
    { id: 'mais_ou_menos', nome: 'Mais ou Menos', multiplicador: 0.9, cor: '#F59E0B' },
    { id: 'bom', nome: 'Bom', multiplicador: 1.0, cor: '#10B981' },
    { id: 'muito_bom', nome: 'Muito Bom', multiplicador: 1.2, cor: '#3B82F6' },
  ]);

  const handleSalvarConfiguracoes = async () => {
    setLoading(true);
    try {
      // Atualizar tarifas
      const pessoaTarifa = tarifas.find(t => t.tipo_servico === 'pessoa');
      const mercadoriaTarifa = tarifas.find(t => t.tipo_servico === 'mercadoria');
      
      if (pessoaTarifa) {
        await atualizarTarifa(pessoaTarifa.id, {
          taxa_base: parseFloat(tarifaPessoa.taxa_base),
          taxa_por_km: parseFloat(tarifaPessoa.taxa_por_km)
        });
      }
      
      if (mercadoriaTarifa) {
        await atualizarTarifa(mercadoriaTarifa.id, {
          taxa_base: parseFloat(tarifaMercadoria.taxa_base),
          taxa_por_km: parseFloat(tarifaMercadoria.taxa_por_km)
        });
      }
      
      Alert.alert('Sucesso', 'Configurações salvas com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const atualizarMultiplicador = (id: string, novoMultiplicador: string) => {
    setNiveisQualidade(prev => 
      prev.map(nivel => 
        nivel.id === id 
          ? { ...nivel, multiplicador: parseFloat(novoMultiplicador) || 1.0 }
          : nivel
      )
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configurações do Sistema</Text>
        <Text style={styles.subtitle}>Gerencie taxas e níveis de qualidade</Text>
      </View>

      {/* Configurações de Taxa */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <DollarSign size={24} color="#2563EB" />
          <Text style={styles.sectionTitle}>Configuração de Taxas</Text>
        </View>

        {/* Configurações para Pessoa */}
        <Text style={styles.tipoServicoTitle}>Transporte de Pessoa</Text>
        <View style={styles.tarifaGroup}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Taxa Base (R$)</Text>
            <TextInput
              style={styles.input}
              value={tarifaPessoa.taxa_base}
              onChangeText={(value) => setTarifaPessoa(prev => ({ ...prev, taxa_base: value }))}
              keyboardType="decimal-pad"
              placeholder="8.00"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Taxa por Km (R$)</Text>
            <TextInput
              style={styles.input}
              value={tarifaPessoa.taxa_por_km}
              onChangeText={(value) => setTarifaPessoa(prev => ({ ...prev, taxa_por_km: value }))}
              keyboardType="decimal-pad"
              placeholder="3.50"
            />
          </View>
        </View>

        {/* Configurações para Mercadoria */}
        <Text style={styles.tipoServicoTitle}>Mercadoria</Text>
        <View style={styles.tarifaGroup}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Taxa Base (R$)</Text>
            <TextInput
              style={styles.input}
              value={tarifaMercadoria.taxa_base}
              onChangeText={(value) => setTarifaMercadoria(prev => ({ ...prev, taxa_base: value }))}
              keyboardType="decimal-pad"
              placeholder="5.00"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Taxa por Km (R$)</Text>
            <TextInput
              style={styles.input}
              value={tarifaMercadoria.taxa_por_km}
              onChangeText={(value) => setTarifaMercadoria(prev => ({ ...prev, taxa_por_km: value }))}
              keyboardType="decimal-pad"
              placeholder="2.00"
            />
          </View>
        </View>

        <View style={styles.calculoExemplo}>
          <Text style={styles.calculoTitulo}>Exemplo de Cálculo:</Text>
          <Text style={styles.calculoTexto}>
            Pessoa (5km) = R$ {tarifaPessoa.taxa_base} + (R$ {tarifaPessoa.taxa_por_km} × 5) = R$ {(parseFloat(tarifaPessoa.taxa_base) + parseFloat(tarifaPessoa.taxa_por_km) * 5).toFixed(2)}
          </Text>
          <Text style={styles.calculoTexto}>
            Mercadoria (5km) = R$ {tarifaMercadoria.taxa_base} + (R$ {tarifaMercadoria.taxa_por_km} × 5) = R$ {(parseFloat(tarifaMercadoria.taxa_base) + parseFloat(tarifaMercadoria.taxa_por_km) * 5).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Níveis de Qualidade */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Star size={24} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Níveis de Qualidade</Text>
        </View>

        <Text style={styles.sectionDescription}>
          Configure os multiplicadores baseados na avaliação dos motoboys
        </Text>

        {niveisQualidade.map((nivel) => (
          <View key={nivel.id} style={styles.nivelCard}>
            <View style={styles.nivelHeader}>
              <View style={[styles.nivelIndicador, { backgroundColor: nivel.cor }]} />
              <Text style={styles.nivelNome}>{nivel.nome}</Text>
              <View style={styles.nivelMultiplicador}>
                <Text style={styles.multiplicadorLabel}>×</Text>
                <TextInput
                  style={styles.multiplicadorInput}
                  value={nivel.multiplicador.toString()}
                  onChangeText={(value) => atualizarMultiplicador(nivel.id, value)}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            
            <Text style={styles.nivelExemplo}>
              Exemplo: R$ 15,00 × {nivel.multiplicador} = R$ {(15 * nivel.multiplicador).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Configurações Avançadas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Settings size={24} color="#6B7280" />
          <Text style={styles.sectionTitle}>Configurações Avançadas</Text>
        </View>

        <View style={styles.configItem}>
          <TrendingUp size={20} color="#10B981" />
          <View style={styles.configInfo}>
            <Text style={styles.configNome}>Preço Dinâmico</Text>
            <Text style={styles.configDescricao}>
              Ajustar preços baseado na demanda (em desenvolvimento)
            </Text>
          </View>
        </View>

        <View style={styles.configItem}>
          <Award size={20} color="#3B82F6" />
          <View style={styles.configInfo}>
            <Text style={styles.configNome}>Sistema de Recompensas</Text>
            <Text style={styles.configDescricao}>
              Bonificações para motoboys com alta avaliação (em desenvolvimento)
            </Text>
          </View>
        </View>
      </View>

      {/* Botão Salvar */}
      <TouchableOpacity
        style={[styles.salvarButton, loading && styles.salvarButtonDisabled]}
        onPress={handleSalvarConfiguracoes}
        disabled={loading}
      >
        <Save size={20} color="#FFFFFF" />
        <Text style={styles.salvarButtonText}>
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </Text>
      </TouchableOpacity>
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
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  tipoServicoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  tarifaGroup: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputHelp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  calculoExemplo: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  calculoTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  calculoTexto: {
    fontSize: 14,
    color: '#059669',
  },
  nivelCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  nivelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nivelIndicador: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  nivelNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  nivelMultiplicador: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  multiplicadorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
    marginRight: 8,
  },
  multiplicadorInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: 80,
    textAlign: 'center',
  },
  nivelExemplo: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 28,
  },
  configItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
  },
  configInfo: {
    flex: 1,
    marginLeft: 16,
  },
  configNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  configDescricao: {
    fontSize: 14,
    color: '#6B7280',
  },
  salvarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  salvarButtonDisabled: {
    opacity: 0.6,
  },
  salvarButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});