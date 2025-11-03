import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface AdminStats {
  id: string;
  data_referencia: string;
  total_usuarios: number;
  total_clientes: number;
  total_motoboys: number;
  total_corridas: number;
  corridas_pendentes: number;
  corridas_em_andamento: number;
  corridas_concluidas: number;
  receita_total: number;
  receita_dia: number;
  created_at: string;
  updated_at: string;
}

interface CorridaAdmin {
  id: string;
  usuario_id: string;
  motoboy_id?: string;
  origem: string;
  destino: string;
  tipo_servico: string;
  valor_estimado: number;
  valor_final?: number;
  status_corrida: string;
  created_at: string;
  updated_at: string;
  cliente?: {
    nome: string;
    telefone: string;
  };
  motoboy?: {
    nome: string;
    telefone: string;
    avaliacao: number;
  };
}

interface UsuarioAdmin {
  id: string;
  nome: string;
  telefone: string;
  tipo_usuario: string;
  avaliacao?: number;
  cnh_verificada?: boolean;
  documento_moto_verificado?: boolean;
  created_at: string;
}

export function useAdminData() {
  const { user, userType } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [corridasAdmin, setCorridasAdmin] = useState<CorridaAdmin[]>([]);
  const [usuariosAdmin, setUsuariosAdmin] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(false);

  const [configuracoes, setConfiguracoes] = useState({
    taxa_base: 5.0,
    taxa_por_km: 2.5,
    niveis_qualidade: []
  });

  const loadAdminData = async () => {
    if (!user || userType !== 'admin') return;

    setLoading(true);

    try {
      // Carregar estatísticas
      const { data: statsData, error: statsError } = await supabase
        .from('admin_stats')
        .select('*')
        .order('data_referencia', { ascending: false })
        .limit(1);
      if (statsError) throw statsError;
      setStats(statsData[0] || null);

      // Carregar corridas com dados dos usuários
      const { data: corridasData, error: corridasError } = await supabase
        .from('corridas')
        .select(`
          *,
          cliente:usuarios!corridas_usuario_id_fkey(nome, telefone),
          motoboy:usuarios!corridas_motoboy_id_fkey(nome, telefone, avaliacao)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      if (corridasError) throw corridasError;
      setCorridasAdmin(corridasData || []);

      // Carregar usuários
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (usuariosError) throw usuariosError;
      setUsuariosAdmin(usuariosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatusCorrida = async (corridaId: string, novoStatus: string) => {
    try {
      const { error } = await supabase
        .from('corridas')
        .update({ status_corrida: novoStatus, updated_at: new Date().toISOString() })
        .eq('id', corridaId);
      if (error) throw error;

      setCorridasAdmin(prev =>
        prev.map(corrida =>
          corrida.id === corridaId
            ? { ...corrida, status_corrida: novoStatus, updated_at: new Date().toISOString() }
            : corrida
        )
      );

      await registrarLog('atualizar_status_corrida', { corrida_id: corridaId, novo_status: novoStatus });
    } catch (error) {
      console.error('Erro ao atualizar status da corrida:', error);
      throw error;
    }
  };

  const suspenderUsuario = async (usuarioId: string) => {
    try {
      // Implementar lógica de suspensão
      await registrarLog('suspender_usuario', { usuario_id: usuarioId });
    } catch (error) {
      console.error('Erro ao suspender usuário:', error);
      throw error;
    }
  };

  const aprovarMotoboy = async (motoboyId: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ 
          cnh_verificada: true, 
          documento_moto_verificado: true,
          updated_at: new Date().toISOString() 
        })
        .eq('id', motoboyId);
      if (error) throw error;

      setUsuariosAdmin(prev =>
        prev.map(usuario =>
          usuario.id === motoboyId
            ? { ...usuario, cnh_verificada: true, documento_moto_verificado: true }
            : usuario
        )
      );

      await registrarLog('aprovar_motoboy', { motoboy_id: motoboyId });
    } catch (error) {
      console.error('Erro ao aprovar motoboy:', error);
      throw error;
    }
  };

  const rejeitarMotoboy = async (motoboyId: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', motoboyId);
      if (error) throw error;

      setUsuariosAdmin(prev => prev.filter(usuario => usuario.id !== motoboyId));
      await registrarLog('rejeitar_motoboy', { motoboy_id: motoboyId });
    } catch (error) {
      console.error('Erro ao rejeitar motoboy:', error);
      throw error;
    }
  };

  const banirUsuario = async (usuarioId: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ banido: true, updated_at: new Date().toISOString() })
        .eq('id', usuarioId);
      if (error) throw error;

      setUsuariosAdmin(prev =>
        prev.map(usuario =>
          usuario.id === usuarioId
            ? { ...usuario, banido: true }
            : usuario
        )
      );

      await registrarLog('banir_usuario', { usuario_id: usuarioId });
    } catch (error) {
      console.error('Erro ao banir usuário:', error);
      throw error;
    }
  };

  const registrarLog = async (acao: string, detalhes: any) => {
    try {
      await supabase
        .from('admin_logs')
        .insert({ admin_id: user?.id, acao, detalhes });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  };

  const atualizarEstatisticas = async () => {
    try {
      const { error } = await supabase.rpc('update_daily_stats');
      if (error) throw error;

      await loadAdminData();
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
      throw error;
    }
  };

  const atualizarConfiguracoes = async (novasConfiguracoes: any) => {
    try {
      // Em um app real, salvaria no banco de dados
      setConfiguracoes(prev => ({ ...prev, ...novasConfiguracoes }));
      await registrarLog('atualizar_configuracoes', novasConfiguracoes);
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (userType === 'admin') loadAdminData();
  }, [user, userType]);

  return {
    stats,
    corridasAdmin,
    usuariosAdmin,
    loading,
    atualizarStatusCorrida,
    suspenderUsuario,
    atualizarEstatisticas,
    aprovarMotoboy,
    rejeitarMotoboy,
    banirUsuario,
    configuracoes,
    atualizarConfiguracoes,
    reloadData: loadAdminData,
  };
}