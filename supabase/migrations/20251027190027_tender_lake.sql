/*
  # Criação da tabela de localizações em tempo real

  1. Nova tabela `localizacoes`
    - `id` (uuid, chave primária)
    - `usuario_id` (uuid, referencia usuarios - motoboy)
    - `corrida_id` (uuid, referencia corridas, opcional)
    - `latitude` (numeric, coordenada de latitude)
    - `longitude` (numeric, coordenada de longitude)
    - `timestamp` (timestamp with time zone, momento da localização)
    - `created_at` (timestamp with time zone)

  2. Segurança
    - Habilita RLS na tabela `localizacoes`
    - Apenas motoboys podem inserir suas localizações
    - Clientes podem ver localizações de suas corridas ativas
    - Motoboys podem ver suas próprias localizações
*/

CREATE TABLE IF NOT EXISTS localizacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  corrida_id uuid REFERENCES corridas(id) ON DELETE CASCADE,
  latitude numeric(10,8) NOT NULL,
  longitude numeric(11,8) NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE localizacoes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Motoboys podem inserir suas localizações"
  ON localizacoes
  FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Motoboys podem ver suas localizações"
  ON localizacoes
  FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "Clientes podem ver localizações de suas corridas"
  ON localizacoes
  FOR SELECT
  TO authenticated
  USING (
    corrida_id IN (
      SELECT id FROM corridas WHERE usuario_id = auth.uid()
    )
  );

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_localizacoes_usuario ON localizacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_localizacoes_corrida ON localizacoes(corrida_id);
CREATE INDEX IF NOT EXISTS idx_localizacoes_timestamp ON localizacoes(timestamp DESC);

-- Índice geográfico para consultas por proximidade (se necessário no futuro)
-- CREATE INDEX IF NOT EXISTS idx_localizacoes_coords ON localizacoes USING GIST (
--   point(longitude, latitude)
-- );