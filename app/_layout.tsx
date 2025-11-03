import React, { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady'; // Supondo que você tenha esse hook
import { AuthProvider, useAuth } from '../hooks/useAuth'; // Supondo que você tenha esse hook
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

// Impede o splash screen de esconder automaticamente
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading, userType } = useAuth();
  const segments = useSegments();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Estado de carregamento do app (fontes e autenticação)
  const appIsLoading = !fontsLoaded || loading;

  useEffect(() => {
    // Se ainda está carregando, não faz nada
    if (appIsLoading) return;

    // Define se o usuário está "dentro" das rotas protegidas
    const inApp = segments.length > 0 && (segments[0] === '(tabs)' || segments[0] === '(admin)');

    if (user) {
      // Usuário está LOGADO

      // Define a rota de destino baseada no tipo de usuário
      const targetRoute = userType === 'admin' ? '/(admin)/dashboard' : '/(tabs)';
      
      // Se o usuário está na raiz, index ou login, redireciona para a rota principal
      if (segments.length === 0 || segments[0] === 'index' || segments[0] === 'login') {
        router.replace(targetRoute);
      }

      // Verifica se o usuário está no grupo (layout) correto (admin vs tabs)
      const currentGroup = segments[0];
      const targetGroup = userType === 'admin' ? '(admin)' : '(tabs)';
      
      // Se estiver em um grupo de app, mas for o grupo errado, corrige
      if (inApp && currentGroup !== targetGroup) {
        router.replace(targetRoute);
      }

    } else {
      // Usuário NÃO está LOGADO

      // Verifica se a rota atual é a tela de login 
      // (ou outras rotas de autenticação, como 'register', se você tiver)
      const isAuthRoute = segments.length > 0 && segments[0] === 'login';

      // Se o usuário NÃO estiver em uma rota de autenticação,
      // ele deve ser enviado para o login.
      if (!isAuthRoute) {
        router.replace('/login');
      }
    }

  }, [appIsLoading, user, userType, segments, router]); // Dependências do Effect

  useEffect(() => {
    // Esconde o splash screen nativo assim que o app estiver pronto
    if (!appIsLoading) {
      SplashScreen.hideAsync();
    }
  }, [appIsLoading]);

  // Se o app estiver carregando (fontes ou auth), retorna null.
  // O SplashScreen.preventAutoHideAsync() vai segurar a tela de splash.
  if (appIsLoading) {
    return null;
  }

  // App pronto, renderiza o Stack de navegação
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

// Layout Raiz principal
export default function RootLayout() {
  // Hook customizado (mantido conforme seu código)
  useFrameworkReady();

  return (
    // Provedor de Autenticação envolvendo toda a aplicação
    <AuthProvider>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
