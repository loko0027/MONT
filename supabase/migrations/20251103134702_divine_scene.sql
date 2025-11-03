/*
  # Ajustar tipos de serviço para apenas Pessoas e Mercadorias

  1. Modificações na tabela corridas
    - Atualizar constraint para aceitar apenas 'pessoa' e 'mercadoria'
    - Migrar dados existentes de 'entrega' e 'retirada' para 'mercadoria'

  2. Modificações na tabela tarifas
    - Atualizar constraint para aceitar apenas 'pessoa' e 'mercadoria'
    - Migrar dados existentes

  3. Limpeza
    - Remover registros duplicados se necessário
*/

-- Primeiro, migrar dados existentes
UPDATE corridas SET tipo_servico = 'mercadoria' WHERE tipo_servico IN ('entrega', 'retirada');

-- Atualizar constraint da tabela corridas
ALTER TABLE corridas DROP CONSTRAINT IF EXISTS corridas_tipo_servico_check;
ALTER TABLE corridas ADD CONSTRAINT corridas_tipo_servico_check 
  CHECK (tipo_servico IN ('pessoa', 'mercadoria'));

-- Migrar dados da tabela tarifas
UPDATE tarifas SET tipo_servico = 'mercadoria' WHERE tipo_servico IN ('entrega', 'retirada');

-- Atualizar constraint da tabela tarifas
ALTER TABLE tarifas DROP CONSTRAINT IF EXISTS tarifas_tipo_servico_check;
ALTER TABLE tarifas ADD CONSTRAINT tarifas_tipo_servico_check 
  CHECK (tipo_servico IN ('pessoa', 'mercadoria'));

-- Remover tarifas duplicadas, mantendo apenas uma para mercadoria
DELETE FROM tarifas 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM tarifas 
  GROUP BY tipo_servico
);

-- Garantir que temos as duas tarifas necessárias
INSERT INTO tarifas (tipo_servico, taxa_base, taxa_por_km) VALUES
('pessoa', 8.00, 3.50),
('mercadoria', 5.00, 2.00)
ON CONFLICT DO NOTHING;