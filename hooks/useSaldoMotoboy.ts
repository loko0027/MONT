import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface SaldoItem {
  id: string;
  corrida_id: string;
  valor_corrida: number;
  taxa_app: number;
  valor_motoboy: number;
  data_corrida: string;
}

export function useSaldoMotoboy() {
  const { user, userType } = useAuth();
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [saldoItems, setSaldoItems] = useState<SaldoItem[]>([]);
  const [loading, setLoading] = useState(false);

  // O array 'saldoDemo' foi removido.

  useEffect(() => {
    // A verificação 'isDemoMode' foi removida.
    // 'loadSaldo' é chamado diretamente se o usuário for um motoboy.
    if (user && userType === 'motoboy') {
      loadSaldo();
    }
  }, [user, userType]); // 'isDemoMode' removido das dependências

  const loadSaldo = async () => {
    if (!user || userType !== 'motoboy') return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('saldos_motoboys')
        .select('*')
        .eq('motoboy_id', user.id)
        .order('data_corrida', { ascending: false });
        
      if (error) throw error;
        
      setSaldoItems(data || []);
      const total = (data || []).reduce((sum, item) => sum + item.valor_motoboy, 0);
      setSaldoTotal(total);
    } catch (error) {
      console.error('Erro ao carregar saldo:', error);
      // Em caso de erro, o saldo fica zerado
      setSaldoItems([]);
      setSaldoTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const adicionarSaldo = async (corridaId: string, valorCorrida: number) => {
    // A verificação 'isDemoMode' foi removida.
    
    try {
      // Chama a função do banco para processar o pagamento
      const { error } = await supabase.rpc('processar_pagamento_corrida', {
        corrida_uuid: corridaId
      });
        
      if (error) throw error;
      await loadSaldo(); // Recarrega o saldo após processar
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      throw error;
    }
  };

  return {
    saldoTotal,
    saldoItems,
    loading,
    adicionarSaldo,
    reloadSaldo: loadSaldo,
  };
}