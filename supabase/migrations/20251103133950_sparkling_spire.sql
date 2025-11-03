/*
  # Melhorias no sistema de corridas

  1. Nova tabela `tarifas`
    - Configuração de tarifas por tipo de serviço
    - Taxas base e por km configuráveis

  2. Melhorias na tabela `corridas`
    - Adicionar coordenadas de origem e destino
    - Localização do motoboy em tempo real
    - Distância real percorrida

  3. Nova tabela `saldos_motoboys`
    - Controle de saldo individual dos motoboys
    - Apenas corridas finalizadas

  4. Segurança
    - RLS apropriado para todas as tabelas
*/

-- Tabela de tarifas configuráveis
CREATE TABLE IF NOT EXISTS tarifas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_servico text NOT NULL CHECK (tipo_servico IN ('pessoa', 'mercadoria')),
  taxa_base numeric(10,2) NOT NULL DEFAULT 5.00,
  taxa_por_km numeric(10,2) NOT NULL DEFAULT 2.50,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir tarifas padrão
INSERT INTO tarifas (tipo_servico, taxa_base, taxa_por_km) VALUES
('pessoa', 8.00, 3.50),
('mercadoria', 5.00, 2.00),
ON CONFLICT DO NOTHING;

-- Adicionar colunas à tabela corridas
ALTER TABLE corridas ADD COLUMN IF NOT EXISTS origem_coords jsonb;
ALTER TABLE corridas ADD COLUMN IF NOT EXISTS destino_coords jsonb;
ALTER TABLE corridas ADD COLUMN IF NOT EXISTS localizacao_motoboy jsonb;
ALTER TABLE corridas ADD COLUMN IF NOT EXISTS distancia_real numeric(10,2);
ALTER TABLE corridas ADD COLUMN IF NOT EXISTS rota_percorrida jsonb;

-- Atualizar constraint de status
ALTER TABLE corridas DROP CONSTRAINT IF EXISTS corridas_status_corrida_check;
ALTER TABLE corridas ADD CONSTRAINT corridas_status_corrida_check 
  CHECK (status_corrida IN ('pendente', 'aceito', 'em_andamento', 'concluido', 'cancelado', 'cancelado_com_multa'));

-- Tabela de saldos dos motoboys
CREATE TABLE IF NOT EXISTS saldos_motoboys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  motoboy_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  corrida_id uuid NOT NULL REFERENCES corridas(id) ON DELETE CASCADE,
  valor_corrida numeric(10,2) NOT NULL,
  taxa_app numeric(10,2) NOT NULL DEFAULT 0,
  valor_motoboy numeric(10,2) NOT NULL,
  data_corrida timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(corrida_id)
);

-- Enable RLS
ALTER TABLE tarifas ENABLE ROW LEVEL SECURITY;
ALTER TABLE saldos_motoboys ENABLE ROW LEVEL SECURITY;

-- Políticas para tarifas
CREATE POLICY "Todos podem ver tarifas"
  ON tarifas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admins podem alterar tarifas"
  ON tarifas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND tipo_usuario = 'admin'
    )
  );

-- Políticas para saldos
CREATE POLICY "Motoboys podem ver próprio saldo"
  ON saldos_motoboys
  FOR SELECT
  TO authenticated
  USING (motoboy_id = auth.uid());

CREATE POLICY "Sistema pode inserir saldos"
  ON saldos_motoboys
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins podem ver todos os saldos"
  ON saldos_motoboys
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND tipo_usuario = 'admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_tarifas_updated_at
  BEFORE UPDATE ON tarifas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular saldo do motoboy
CREATE OR REPLACE FUNCTION calcular_saldo_motoboy(motoboy_uuid uuid)
RETURNS numeric AS $$
DECLARE
  saldo_total numeric := 0;
BEGIN
  SELECT COALESCE(SUM(valor_motoboy), 0)
  INTO saldo_total
  FROM saldos_motoboys
  WHERE motoboy_id = motoboy_uuid;
  
  RETURN saldo_total;
END;
$$ LANGUAGE plpgsql;

-- Função para processar pagamento de corrida
CREATE OR REPLACE FUNCTION processar_pagamento_corrida(corrida_uuid uuid)
RETURNS void AS $$
DECLARE
  corrida_data record;
  taxa_app_percent numeric := 0.15; -- 15% para o app
  valor_app numeric;
  valor_motoboy numeric;
BEGIN
  -- Buscar dados da corrida
  SELECT c.*, u.id as motoboy_id
  INTO corrida_data
  FROM corridas c
  JOIN usuarios u ON c.motoboy_id = u.id
  WHERE c.id = corrida_uuid AND c.status_corrida = 'concluido';
  
  IF corrida_data.id IS NULL THEN
    RAISE EXCEPTION 'Corrida não encontrada ou não concluída';
  END IF;
  
  -- Calcular valores
  valor_app := corrida_data.valor_final * taxa_app_percent;
  valor_motoboy := corrida_data.valor_final - valor_app;
  
  -- Inserir no saldo do motoboy
  INSERT INTO saldos_motoboys (
    motoboy_id,
    corrida_id,
    valor_corrida,
    taxa_app,
    valor_motoboy,
    data_corrida
  ) VALUES (
    corrida_data.motoboy_id,
    corrida_uuid,
    corrida_data.valor_final,
    valor_app,
    valor_motoboy,
    corrida_data.updated_at
  ) ON CONFLICT (corrida_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tarifas_tipo ON tarifas(tipo_servico);
CREATE INDEX IF NOT EXISTS idx_saldos_motoboy ON saldos_motoboys(motoboy_id);
CREATE INDEX IF NOT EXISTS idx_corridas_coords ON corridas USING GIN (origem_coords, destino_coords);