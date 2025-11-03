/*
  # Criação da tabela de corridas

  1. Nova tabela `corridas`
    - `id` (uuid, chave primária)
    - `usuario_id` (uuid, referencia usuarios - cliente que solicitou)
    - `motoboy_id` (uuid, referencia usuarios - motoboy que aceitou, opcional)
    - `origem` (text, endereço de origem)
    - `destino` (text, endereço de destino)
    - `tipo_servico` (text, 'pessoa', 'entrega' ou 'retirada')
    - `valor_estimado` (numeric, valor calculado inicialmente)
    - `valor_final` (numeric, valor final da corrida, opcional)
    - `status_corrida` (text, estado atual da corrida)
    - `distancia` (numeric, distância em km, opcional)
    - `duracao` (integer, duração em minutos, opcional)
    - `avaliacao` (integer, avaliação do cliente de 1-5 estrelas, opcional)
    - `created_at` (timestamp with time zone)
    - `updated_at` (timestamp with time zone)

  2. Segurança
    - Habilita RLS na tabela `corridas`
    - Clientes podem ver suas próprias corridas
    - Motoboys podem ver corridas pendentes e suas próprias corridas aceitas
    - Apenas proprietários podem atualizar corridas
*/

CREATE TABLE IF NOT EXISTS corridas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  motoboy_id uuid REFERENCES usuarios(id) ON DELETE SET NULL,
  origem text NOT NULL,
  destino text NOT NULL,
  tipo_servico text NOT NULL CHECK (tipo_servico IN ('pessoa', 'entrega', 'retirada')),
  valor_estimado numeric(10,2) NOT NULL,
  valor_final numeric(10,2),
  status_corrida text NOT NULL DEFAULT 'pendente' CHECK (
    status_corrida IN ('pendente', 'aceito', 'em_andamento', 'concluido', 'cancelado')
  ),
  distancia numeric(10,2),
  duracao integer,
  avaliacao integer CHECK (avaliacao >= 1 AND avaliacao <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE corridas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Clientes podem ver suas corridas"
  ON corridas
  FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "Motoboys podem ver corridas pendentes"
  ON corridas
  FOR SELECT
  TO authenticated
  USING (
    status_corrida = 'pendente' 
    OR motoboy_id = auth.uid()
  );

CREATE POLICY "Clientes podem criar corridas"
  ON corridas
  FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Apenas proprietários podem atualizar corridas"
  ON corridas
  FOR UPDATE
  TO authenticated
  USING (
    usuario_id = auth.uid() 
    OR motoboy_id = auth.uid()
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_corridas_updated_at
  BEFORE UPDATE ON corridas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_corridas_status ON corridas(status_corrida);
CREATE INDEX IF NOT EXISTS idx_corridas_usuario ON corridas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_corridas_motoboy ON corridas(motoboy_id);
CREATE INDEX IF NOT EXISTS idx_corridas_created_at ON corridas(created_at DESC);