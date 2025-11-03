import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Tarifa {
  id: string;
  // Ajustado para incluir a nova opção conforme sua outra solicitação
  tipo_servico: 'pessoa' | 'mercadoria'; 
  taxa_base: number;
  taxa_por_km: number;
  ativo: boolean;
}

export function useTarifas() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [loading, setLoading] = useState(false);

  // O useEffect agora chama loadTarifas diretamente na montagem
  useEffect(() => {
    loadTarifas();
  }, []); // Array de dependência vazio, executa apenas uma vez

  const loadTarifas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tarifas')
        .select('*')
        .eq('ativo', true)
        .order('tipo_servico');
        
      if (error) throw error;
      setTarifas(data || []);
    } catch (error) {
      console.error('Erro ao carregar tarifas:', error);
      // Se houver erro, o estado de tarifas permanecerá como []
      setTarifas([]); 
    } finally {
      setLoading(false);
    }
  };

  const getTarifaPorTipo = (tipoServico: 'pessoa' | 'mercadoria'): Tarifa | null => {
    return tarifas.find(t => t.tipo_servico === tipoServico) || null;
  };

  const calcularValorEstimado = (tipoServico: 'pessoa' | 'mercadoria', distanciaKm: number): number => {
    const tarifa = getTarifaPorTipo(tipoServico);
    if (!tarifa) return 0;
    
    return tarifa.taxa_base + (tarifa.taxa_por_km * distanciaKm);
  };

  const atualizarTarifa = async (id: string, novosDados: Partial<Tarifa>) => {
    // Removemos a lógica de 'isDemoMode'
    try {
      const { error } = await supabase
        .from('tarifas')
        .update(novosDados)
        .eq('id', id);
        
      if (error) throw error;
      // Recarrega as tarifas após a atualização para manter o estado sincronizado
      await loadTarifas(); 
    } catch (error) {
      console.error('Erro ao atualizar tarifa:', error);
      throw error; // Lança o erro para ser tratado pelo componente que chamou
    }
  };

  return {
    tarifas,
    loading,
    getTarifaPorTipo,
    calcularValorEstimado,
    atualizarTarifa,
    reloadTarifas: loadTarifas, // Permite recarregar as tarifas manualmente
  };
}