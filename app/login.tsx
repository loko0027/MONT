import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Mail,
  Lock,
  User,
  Phone,
  UserCheck,
  Bike,
  Camera
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<'cliente' | 'motoboy'>('cliente');
  
  // Este é o loading local, para o botão do formulário
  const [loading, setLoading] = useState(false);

  // Corrigido: Chamando o hook apenas uma vez e pegando só o que precisa
  const { signIn, signUp } = useAuth();

  const handleSubmit = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }

    if (!isLogin && (!nome || !telefone)) {
      Alert.alert('Erro', 'Preencha todos os campos para cadastro');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, senha);
      } else {
        await signUp(email, senha, {
          nome,
          telefone,
          tipo_usuario: tipoUsuario,
        });

        // Corrigido: Removida a checagem 'isDemoMode'
        Alert.alert(
          'Cadastro realizado!',
          'Sua conta foi criada com sucesso. Você pode fazer login agora.',
          [{ text: 'OK', onPress: () => setIsLogin(true) }]
        );
      }
    } catch (error: any) {
      console.error('Erro de autenticação:', error);
      Alert.alert('Erro', error.message || 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = (tipo: string) => {
    Alert.alert(
      'Upload de Documento',
      `Funcionalidade de upload de ${tipo} será implementada após o cadastro`
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Removido o DemoModeToggle e o Bloco de Informação Demo */}

        <View style={styles.header}>
          <Text style={styles.title}>
            {isLogin ? 'Fazer Login' : 'Cadastrar-se'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? 'Entre na sua conta'
              : 'Crie uma nova conta'
            }
          </Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <>
              <View style={styles.inputContainer}>
                <User size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Nome completo"
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Phone size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  placeholder="Telefone"
                  value={telefone}
                  onChangeText={setTelefone}
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={styles.sectionTitle}>Tipo de Usuário</Text>
              <View style={styles.tipoUsuarioContainer}>
                <TouchableOpacity
                  style={[
                    styles.tipoUsuarioButton,
                    tipoUsuario === 'cliente' && styles.tipoUsuarioButtonActive,
                  ]}
                  onPress={() => setTipoUsuario('cliente')}
                >
                  <UserCheck
                    size={24}
                    color={tipoUsuario === 'cliente' ? '#FFFFFF' : '#2563EB'}
                  />
                  <Text
                    style={[
                      styles.tipoUsuarioText,
                      tipoUsuario === 'cliente' && styles.tipoUsuarioTextActive,
                    ]}
                  >
                    Cliente
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tipoUsuarioButton,
                    tipoUsuario === 'motoboy' && styles.tipoUsuarioButtonActive,
                  ]}
                  onPress={() => setTipoUsuario('motoboy')}
                >
                  <Bike
                    size={24}
                    color={tipoUsuario === 'motoboy' ? '#FFFFFF' : '#2563EB'}
                  />
                  <Text
                    style={[
                      styles.tipoUsuarioText,
                      tipoUsuario === 'motoboy' && styles.tipoUsuarioTextActive,
                    ]}
                  >
                    Motoboy
                  </Text>
                </TouchableOpacity>

                {/* Removido o botão de Admin que só aparecia em Modo Demo */}

              </View>

              {tipoUsuario === 'motoboy' && (
                <View style={styles.documentsInfo}>
                  <Text style={styles.documentsTitle}>Documentos Necessários:</Text>

                  <TouchableOpacity
                    style={styles.documentUpload}
                    onPress={() => handleUploadDocument('CNH')}
                  >
                    <Camera size={20} color="#2563EB" />
                    <Text style={styles.documentUploadText}>
                      Upload da CNH (após cadastro)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.documentUpload}
                    onPress={() => handleUploadDocument('Documento da Moto')}
                  >
                    <Camera size={20} color="#2563EB" />
                    <Text style={styles.documentUploadText}>
                      Upload do Documento da Moto (após cadastro)
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Corrigido: Aviso de Admin agora checa apenas 'tipoUsuario' */}
              {tipoUsuario === 'admin' && (
                <View style={styles.adminWarning}>
                  <Text style={styles.adminWarningText}>
                    ⚠️ Contas de administrador devem ser criadas apenas por desenvolvedores autorizados.
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={styles.inputContainer}>
            <Mail size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#6B7280" />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading
                ? 'Processando...'
                : isLogin
                  ? 'Entrar'
                  : 'Cadastrar'
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchButtonText}>
              {isLogin
                ? 'Não tem uma conta? Cadastre-se'
                : 'Já tem uma conta? Faça login'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5.46,
    elevation: 9,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 12,
  },
  tipoUsuarioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tipoUsuarioButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  tipoUsuarioButtonActive: {
    backgroundColor: '#2563EB',
  },
  tipoUsuarioText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  tipoUsuarioTextActive: {
    color: '#FFFFFF',
  },
  documentsInfo: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  documentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  documentUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  documentUploadText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2563EB',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  switchButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '500',
  },
  // Removidos os estilos de Demo que não são mais usados
  adminWarning: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  adminWarningText: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
  },
});