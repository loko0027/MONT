/*
  # Adicionar tipo de usuário admin

  1. Modificações na tabela usuarios
    - Adicionar 'admin' como tipo de usuário válido
    - Criar usuário admin padrão

  2. Novas tabelas para dashboard
    - `admin_stats` - estatísticas do sistema
    - `admin_logs` - logs de atividades

  3. Segurança
    - Políticas RLS específicas para admins
    - Acesso total aos dados para usuários admin
*/

-- Atualizar constraint para incluir admin
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_tipo_usuario_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_tipo_usuario_check 
  CHECK (tipo_usuario IN ('cliente', 'motoboy', 'admin'));

-- Criar tabela de estatísticas do sistema
CREATE TABLE IF NOT EXISTS admin_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_referencia date NOT NULL DEFAULT CURRENT_DATE,
  total_usuarios integer DEFAULT 0,
  total_clientes integer DEFAULT 0,
  total_motoboys integer DEFAULT 0,
  total_corridas integer DEFAULT 0,
  corridas_pendentes integer DEFAULT 0,
  corridas_em_andamento integer DEFAULT 0,
  corridas_concluidas integer DEFAULT 0,
  receita_total numeric(12,2) DEFAULT 0,
  receita_dia numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de logs de atividades
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  acao text NOT NULL,
  detalhes jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para admins verem todos os dados
CREATE POLICY "Admins podem ver todas as corridas"
  ON corridas
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND tipo_usuario = 'admin'
    )
  );

CREATE POLICY "Admins podem ver todos os usuários"
  ON usuarios
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND tipo_usuario = 'admin'
    )
  );

CREATE POLICY "Admins podem ver stats"
  ON admin_stats
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND tipo_usuario = 'admin'
    )
  );

CREATE POLICY "Admins podem ver logs"
  ON admin_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND tipo_usuario = 'admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_admin_stats_updated_at
  BEFORE UPDATE ON admin_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_stats_data ON admin_stats(data_referencia DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- Função para atualizar estatísticas diárias
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS void AS $$
DECLARE
  stats_data record;
BEGIN
  -- Calcular estatísticas do dia
  SELECT 
    COUNT(*) FILTER (WHERE tipo_usuario = 'cliente') as total_clientes,
    COUNT(*) FILTER (WHERE tipo_usuario = 'motoboy') as total_motoboys,
    COUNT(*) as total_usuarios
  INTO stats_data
  FROM usuarios;

  -- Inserir ou atualizar estatísticas do dia
  INSERT INTO admin_stats (
    data_referencia,
    total_usuarios,
    total_clientes,
    total_motoboys,
    total_corridas,
    corridas_pendentes,
    corridas_em_andamento,
    corridas_concluidas,
    receita_total,
    receita_dia
  )
  SELECT 
    CURRENT_DATE,
    stats_data.total_usuarios,
    stats_data.total_clientes,
    stats_data.total_motoboys,
    COUNT(*),
    COUNT(*) FILTER (WHERE status_corrida = 'pendente'),
    COUNT(*) FILTER (WHERE status_corrida IN ('aceito', 'em_andamento')),
    COUNT(*) FILTER (WHERE status_corrida = 'concluido'),
    COALESCE(SUM(valor_final), 0),
    COALESCE(SUM(valor_final) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0)
  FROM corridas
  ON CONFLICT (data_referencia) 
  DO UPDATE SET
    total_usuarios = EXCLUDED.total_usuarios,
    total_clientes = EXCLUDED.total_clientes,
    total_motoboys = EXCLUDED.total_motoboys,
    total_corridas = EXCLUDED.total_corridas,
    corridas_pendentes = EXCLUDED.corridas_pendentes,
    corridas_em_andamento = EXCLUDED.corridas_em_andamento,
    corridas_concluidas = EXCLUDED.corridas_concluidas,
    receita_total = EXCLUDED.receita_total,
    receita_dia = EXCLUDED.receita_dia,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;