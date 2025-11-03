/*
  # Criação da tabela de usuários

  1. Nova tabela `usuarios`
    - `id` (uuid, chave primária, referencia auth.users)
    - `nome` (text, nome completo do usuário)
    - `telefone` (text, telefone do usuário)
    - `tipo_usuario` (text, 'cliente' ou 'motoboy')
    - `avaliacao` (numeric, média das avaliações - apenas para motoboys)
    - `cnh_verificada` (boolean, se a CNH foi verificada - apenas para motoboys)
    - `documento_moto_verificado` (boolean, se o documento da moto foi verificado - apenas para motoboys)
    - `created_at` (timestamp with time zone)
    - `updated_at` (timestamp with time zone)

  2. Segurança
    - Habilita RLS na tabela `usuarios`
    - Usuários podem ler e atualizar apenas seus próprios dados
*/

CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  telefone text NOT NULL,
  tipo_usuario text NOT NULL CHECK (tipo_usuario IN ('cliente', 'motoboy')),
  avaliacao numeric(3,2) DEFAULT 5.0,
  cnh_verificada boolean DEFAULT false,
  documento_moto_verificado boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuarios podem ver próprios dados"
  ON usuarios
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Usuarios podem atualizar próprios dados"
  ON usuarios
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();