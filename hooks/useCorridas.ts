import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { useTarifas } from './useTarifas';
import { useGoogleMaps } from './useGoogleMaps';

// NOVO: Interface para dados do usuário aninhados (nome, que virá do JOIN)
export interface UsuarioInfo {
  nome: string;
}

// Interface ajustada para usar 'mercadoria' (consistente com PrincipalScreen.tsx)
export interface Corrida {
  id: string;
  usuario_id: string;
  motoboy_id?: string;
  origem: string;
  destino: string;
  tipo_servico: 'pessoa' | 'mercadoria'; // <<<< TIPO CORRETO AQUI
  valor_estimado: number;
  valor_final?: number;
  status_corrida: 'pendente' | 'aceito' | 'em_andamento' | 'concluido' | 'cancelado' | 'cancelado_com_multa';
  distancia?: number;
  duracao?: number;
  avaliacao?: number;
  created_at: string;
  updated_at: string;
  // Campos adicionais para o mapa
  origemCoords?: { latitude: number; longitude: number };
  destinoCoords?: { latitude: number; longitude: number };
  localizacao_motoboy?: { latitude: number; longitude: number };
  distancia_real?: number;
  rota_percorrida?: { latitude: number; longitude: number }[];

  // 🛠️ CAMPOS CORRIGIDOS PARA O NOME
  motoboy?: UsuarioInfo | null; // Dados do motoboy para o cliente
  usuario?: UsuarioInfo | null; // Dados do cliente para o motoboy
}

export function useCorridas() {
  const { user, userType } = useAuth();
  const { calcularValorEstimado } = useTarifas();
  const { calcularRota } = useGoogleMaps();
  const [corridaAtiva, setCorridaAtiva] = useState<Corrida | null>(null);
  const [corridasDisponiveis, setCorridasDisponiveis] = useState<Corrida[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (userType === 'cliente') {
        loadCorridaAtiva();
      } else if (userType === 'motoboy') {
        loadCorridasDisponiveis();
        loadCorridaAtivaDoMotoboy();
      }
    }
  }, [user, userType]);

  // Hook do Realtime (Ajuste para tratar o novo formato do payload)
  useEffect(() => {
    if (!corridaAtiva) {
      return;
    }
    
    // ATENÇÃO: O Realtime do Supabase não faz JOIN, então atualizações no nome
    // não virão automaticamente por aqui. Apenas dados da tabela 'corridas'.
    // Para ter o nome atualizado, a corrida deve ser recarregada manualmente.
    
    console.log(`Escutando canal: corrida:${corridaAtiva.id}`);
    const channel = supabase
      .channel(`corrida:${corridaAtiva.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'corridas',
          filter: `id=eq.${corridaAtiva.id}`,
        },
        async (payload) => {
          console.log('Recebeu atualização da corrida:', payload.new);
          
          // Se a atualização mudar o motoboy_id (aceite), é melhor recarregar
          // para pegar o nome correto do JOIN.
          if (payload.new.motoboy_id !== payload.old.motoboy_id) {
            if (userType === 'cliente') await loadCorridaAtiva();
            if (userType === 'motoboy') await loadCorridaAtivaDoMotoboy();
          } else {
            // Se for atualização de coords ou status, atualiza o estado local
            const { origem_coords, destino_coords, ...rest } = payload.new as any;
            
            const corridaAtualizada: Corrida = {
                ...(rest as Corrida),
                origemCoords: origem_coords,
                destinoCoords: destino_coords,
                // Mantém os dados de motoboy/usuario que já existiam
                motoboy: corridaAtiva.motoboy, 
                usuario: corridaAtiva.usuario,
            };
            setCorridaAtiva(corridaAtualizada);
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`Removendo canal: corrida:${corridaAtiva.id}`);
      supabase.removeChannel(channel);
    };
  }, [corridaAtiva, userType]); 

  // --- Funções de Carregamento (convertendo snake_case para camelCase) ---
  const converterParaCorrida = (data: any): Corrida | null => {
    if (!data) return null;
    
    // Tratamento de campos com snake_case e JOINs
    const { 
        origem_coords, 
        destino_coords, 
        motoboy_id, 
        usuario_id, 
        motoboy, 
        usuario, 
        ...rest 
    } = data;
    
    return {
      ...(rest as Corrida),
      origemCoords: origem_coords,
      destinoCoords: destino_coords,
      // Passa os resultados dos JOINs para os campos tipados
      motoboy: motoboy || null, 
      usuario: usuario || null, 
    } as Corrida; // Força a tipagem
  }

  // 1. 🛠️ CORREÇÃO: loadCorridaAtiva (Cliente) - Busca nome do Motoboy
  const loadCorridaAtiva = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('corridas')
        .select('*, motoboy:motoboy_id(nome)')
        .eq('usuario_id', user.id)
        .in('status_corrida', ['pendente', 'aceito', 'em_andamento'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      setCorridaAtiva(converterParaCorrida(data[0]) || null);
    } catch (error) {
      console.error('Erro ao carregar corrida ativa (Cliente):', error);
    }
  };

  // 2. 🛠️ CORREÇÃO: loadCorridaAtivaDoMotoboy (Motoboy) - Busca nome do Cliente
  const loadCorridaAtivaDoMotoboy = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('corridas')
        .select('*, usuario:usuario_id(nome)')
        .eq('motoboy_id', user.id)
        .in('status_corrida', ['aceito', 'em_andamento'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      setCorridaAtiva(converterParaCorrida(data[0]) || null);
    } catch (error) {
      console.error('Erro ao carregar corrida ativa do motoboy:', error);
    }
  };

  // 3. 🛠️ CORREÇÃO: loadCorridasDisponiveis (Motoboy) - Busca nome do Cliente
  const loadCorridasDisponiveis = async () => {
    try {
      const { data, error } = await supabase
        .from('corridas')
        .select('*, usuario:usuario_id(nome)')
        .eq('status_corrida', 'pendente')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCorridasDisponiveis((data || []).map(converterParaCorrida).filter(c => c !== null) as Corrida[]);
    } catch (error) {
      console.error('Erro ao carregar corridas disponíveis:', error);
    }
  };

  // --- Funções de Ação ---
  const solicitarCorrida = async (dadosCorrida: {
    origem: string;
    destino: string;
    origemCoords: { latitude: number; longitude: number };
    destinoCoords: { latitude: number; longitude: number };
    tipoServico: 'pessoa' | 'mercadoria'; // <<<< CORRIGIDO AQUI!
  }) => {
    if (!user) throw new Error('Usuário não autenticado');

    // Calcular rota e valor estimado
    const rotaInfo = await calcularRota(dadosCorrida.origemCoords, dadosCorrida.destinoCoords);
    const distanciaKm = rotaInfo?.distancia || 5;
    // Usa o tipo de serviço correto ('pessoa' | 'mercadoria')
    const valorEstimado = calcularValorEstimado(dadosCorrida.tipoServico, distanciaKm); 

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('corridas')
        .insert({
          usuario_id: user.id,
          origem: dadosCorrida.origem,
          destino: dadosCorrida.destino,
          origem_coords: dadosCorrida.origemCoords,
          destino_coords: dadosCorrida.destinoCoords,
          tipo_servico: dadosCorrida.tipoServico, // Valor é 'pessoa' ou 'mercadoria'
          valor_estimado: valorEstimado,
          status_corrida: 'pendente',
          distancia: distanciaKm,
          duracao: rotaInfo?.duracao,
        })
        // O select padrão após o insert deve ser simples, mas vamos forçar a seleção do nome do cliente
        .select('*, usuario:usuario_id(nome)')
        .single();

      if (error) throw error;
      setCorridaAtiva(converterParaCorrida(data));
      await enviarNotificacaoParaMotoboys(converterParaCorrida(data));

    } catch (error) {
      console.error('Erro ao solicitar corrida:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const aceitarCorrida = async (corridaId: string) => {
    if (!user) throw new Error("Usuário não autenticado");

    try {
      const { data, error } = await supabase
        .from('corridas')
        .update({
          status_corrida: 'aceito',
          motoboy_id: user.id
        })
        .eq('id', corridaId)
        .eq('status_corrida', 'pendente')
        // Garantindo que após o aceite, a corrida retorne com o nome do cliente
        .select('*, usuario:usuario_id(nome)') 
        .single();

      if (error) throw error;
      if (!data) throw new Error("Corrida já foi aceita por outro motoboy.");

      setCorridaAtiva(converterParaCorrida(data));
      await loadCorridasDisponiveis();

      return { message: "Corrida aceita com sucesso." };
    } catch (error) {
      console.error("Erro ao aceitar corrida:", error);
      throw error;
    }
  };

  const atualizarStatusCorrida = async (corridaId: string, novoStatus: string) => {
    try {
      await supabase
        .from('corridas')
        .update({ status_corrida: novoStatus })
        .eq('id', corridaId);
        
      if (novoStatus === 'concluido' || novoStatus === 'cancelado') {
          setCorridaAtiva(null);
      } else {
          // Recarrega para pegar qualquer JOIN que tenha sido perdido
          await loadCorridaAtiva();
          if (userType === 'motoboy') await loadCorridaAtivaDoMotoboy();
      }
        
      if (userType === 'motoboy') await loadCorridasDisponiveis();
    } catch (error) {
      console.error('Erro ao atualizar status da corrida:', error);
    }
  };

  const cancelarCorrida = async (corrida: Corrida, tipoUser: 'cliente' | 'motoboy' | 'admin') => {
    if (!user) throw new Error("Usuário não autenticado.");

    try {
      await supabase
        .from('corridas')
        .update({ 
          status_corrida: 'cancelado', 
          motoboy_id: tipoUser === 'motoboy' ? null : corrida.motoboy_id 
        })
        .eq('id', corrida.id);

      setCorridaAtiva(null);
      if (tipoUser === 'motoboy') await loadCorridasDisponiveis();

      return { message: "Corrida cancelada com sucesso." };
    } catch (error) {
      console.error("Erro ao cancelar corrida:", error);
      throw new Error("Não foi possível cancelar a corrida.");
    }
  };
  
  // Funções não essenciais para o fluxo principal (Mantidas)
  const encontrarMotoboyMaisProximo = async (origemCoords: { latitude: number; longitude: number }) => {
    // ...
    return null;
  };

  const calcularValorFinal = async (corridaId: string, rotaPercorrida: { latitude: number; longitude: number }[]) => {
    // ...
  };

  const enviarNotificacaoParaMotoboys = async (corrida: Corrida) => {
    // ...
  };
  
  const getEnderecoPorCoordenadas = async (coordenadas: { latitude: number; longitude: number }) => {
    // ...
  };

  const calcularEstimativaRota = async (origem: string, destino: string) => {
    // ...
  };

  return {
    corridaAtiva,
    corridasDisponiveis,
    loading,
    solicitarCorrida,
    aceitarCorrida,
    atualizarStatusCorrida,
    getEnderecoPorCoordenadas,
    calcularEstimativaRota,
    cancelarCorrida,
    encontrarMotoboyMaisProximo,
    calcularValorFinal,
    reloadCorridasDisponiveis: loadCorridasDisponiveis,
    reloadCorridaAtiva: loadCorridaAtiva,
  };
}