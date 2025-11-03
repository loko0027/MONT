import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface CorridaHistorico {
  id: string;
  usuario_id: string;
  motoboy_id?: string;
  origem: string;
  destino: string;
  tipo_servico: 'pessoa' | 'mercadoria';
  valor_estimado: number;
  valor_final?: number;
  status_corrida: string;
  distancia?: number;
  duracao?: number;
  avaliacao?: number;
  created_at: string;
  updated_at: string;
}

export function useHistorico() {
  const { user, userType } = useAuth();
  const [historicoCorridas, setHistoricoCorridas] = useState<CorridaHistorico[]>([]);
  const [totalGanhos, setTotalGanhos] = useState(0);
  const [totalCorridas, setTotalCorridas] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Se o usuário existir, carrega o histórico
    if (user) {
      loadHistorico();
    }
  }, [user, userType]); // Depende do usuário e do tipo dele

  const loadHistorico = async () => {
    if (!user) return;

    setLoading(true);

    try {
      let query = supabase
        .from('corridas')
        .select('*')
        // Filtra apenas corridas concluídas ou canceladas para o histórico
        .in('status_corrida', ['concluido', 'cancelado']) 
        .order('created_at', { ascending: false });

      if (userType === 'cliente') {
        query = query.eq('usuario_id', user.id);
      } else if (userType === 'motoboy') {
        query = query.eq('motoboy_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const corridas = data || [];
      setHistoricoCorridas(corridas);

      // Calcular estatísticas para motoboys
      if (userType === 'motoboy') {
        const corridasConcluidas = corridas.filter(
          corrida => corrida.status_corrida === 'concluido'
        );
        
        const ganhos = corridasConcluidas.reduce(
          (total, corrida) => total + (corrida.valor_final || corrida.valor_estimado), 
          0
        );
        
        setTotalCorridas(corridasConcluidas.length);
        setTotalGanhos(ganhos);
      }

    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarAvaliacao = async (corridaId: string, avaliacao: number) => {
    try {
      const { error } = await supabase
        .from('corridas')
        .update({ avaliacao })
        .eq('id', corridaId);

      if (error) throw error;

      // Atualizar estado local
      setHistoricoCorridas(prev =>
        prev.map(corrida =>
          corrida.id === corridaId 
            ? { ...corrida, avaliacao }
            : corrida
        )
      );

    } catch (error) {
      console.error('Erro ao adicionar avaliação:', error);
      throw error;
    }
  };

  return {
    historicoCorridas,
    totalGanhos,
    totalCorridas,
    loading,
    adicionarAvaliacao,
    reloadHistorico: loadHistorico,
  };
}
