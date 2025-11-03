import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Platform, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region, AnimatedRegion } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { MapPin, Locate, ZoomIn, ZoomOut } from 'lucide-react-native';
import { Corrida } from '@/hooks/useCorridas';

interface MapaComponentProps {
  corridaAtiva?: Corrida | null;
  modoSelecao: 'origem' | 'destino' | null;
  regiaoAtual: Region;
  onRegiaoChange: (novaRegiao: Region) => void;
  onCentralizarUsuario: () => void;
}

export function MapaComponent({
  corridaAtiva,
  modoSelecao,
  regiaoAtual,
  onRegiaoChange,
  onCentralizarUsuario,
}: MapaComponentProps) {
  const mapRef = useRef<MapView>(null);
  const [rotaPercorrida, setRotaPercorrida] = useState<{ latitude: number; longitude: number }[]>([]);
  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const [motoboyAnimado] = useState(
    new AnimatedRegion({
      latitude: regiaoAtual.latitude,
      longitude: regiaoAtual.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
  );

  useEffect(() => {
    if (corridaAtiva?.localizacao_motoboy && !modoSelecao) {
      const novaPos = corridaAtiva.localizacao_motoboy;

      if (corridaAtiva.status_corrida === 'em_andamento') {
        setRotaPercorrida(prev => [...prev, novaPos]);
      }

      motoboyAnimado.timing({
        latitude: novaPos.latitude,
        longitude: novaPos.longitude,
        duration: 1500,
        useNativeDriver: false,
      }).start();
    }

    if (
      corridaAtiva?.status_corrida === 'concluido' ||
      corridaAtiva?.status_corrida === 'cancelado' ||
      corridaAtiva?.status_corrida === 'cancelado_com_multa'
    ) {
      setRotaPercorrida([]);
    }
  }, [corridaAtiva?.localizacao_motoboy, corridaAtiva?.status_corrida, modoSelecao]);

  const handleZoomIn = () => {
    mapRef.current?.getCamera().then(cam => {
      cam.zoom = (cam.zoom || 15) + 1;
      mapRef.current?.animateCamera(cam);
    }).catch(console.error);
  };

  const handleZoomOut = () => {
    mapRef.current?.getCamera().then(cam => {
      cam.zoom = (cam.zoom || 15) - 1;
      if (cam.zoom < 0) cam.zoom = 0;
      mapRef.current?.animateCamera(cam);
    }).catch(console.error);
  };

  const ajustarMapaParaRota = (coordinates: { latitude: number; longitude: number }[]) => {
    if (coordinates.length === 0 || !mapRef.current) return;
    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
      animated: true,
    });
  };

  const handleRegionChangeComplete = async (region: Region) => {
    onRegiaoChange(region);
  };

  // --- LÓGICA DAS ROTAS ---
  const deveMostrarRotaMotoboy = !modoSelecao &&
    corridaAtiva &&
    corridaAtiva.localizacao_motoboy &&
    corridaAtiva.destinoCoords &&
    ['aceito', 'em_andamento'].includes(corridaAtiva.status_corrida);

  const deveMostrarRotaCompleta = !modoSelecao &&
    corridaAtiva &&
    corridaAtiva.origemCoords &&
    corridaAtiva.destinoCoords &&
    !deveMostrarRotaMotoboy; 

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <Text>Mapa indisponível na Web</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        region={regiaoAtual}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={!modoSelecao}
        showsMyLocationButton={false}
      >
        {/* Rastro por onde o motoboy passou */}
        {rotaPercorrida.length > 1 && (
          <Polyline coordinates={rotaPercorrida} strokeColor="#1E40AF" strokeWidth={4} />
        )}

        {/* --- Rota Principal (Origem -> Destino) --- */}
        {deveMostrarRotaCompleta && (
          <MapViewDirections
            origin={corridaAtiva.origemCoords}
            destination={corridaAtiva.destinoCoords}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={6}
            strokeColor="#2563EB"
            onReady={(result) => ajustarMapaParaRota(result.coordinates)}
            onError={(err) => console.error('Erro ao desenhar rota principal:', err)}
          />
        )}

        {/* Rota do Motoboy (Motoboy -> Destino) */}
        {deveMostrarRotaMotoboy && (
          <MapViewDirections
            origin={corridaAtiva.localizacao_motoboy}
            destination={corridaAtiva.destinoCoords}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={6}
            strokeColor="#2563EB"
            onReady={(result) => ajustarMapaParaRota(result.coordinates)} 
            onError={(err) => console.error('Erro ao desenhar rota do motoboy:', err)}
          />
        )}

        {/* Marcador do Motoboy */}
        {!modoSelecao && corridaAtiva?.localizacao_motoboy && (
          <Marker.Animated
            coordinate={motoboyAnimado}
            title="Motoboy"
            description="Em deslocamento"
            pinColor="green"
          />
        )}

        {/* Marcador de Origem */}
        {!modoSelecao && corridaAtiva?.origemCoords && (
          <Marker 
            coordinate={corridaAtiva.origemCoords} 
            title="Você está aqui" 
            description="Ponto de partida"
            pinColor="#3B82F6" 
          />
        )}

        {/* Marcador de Destino */}
        {!modoSelecao && corridaAtiva?.destinoCoords && (
          <Marker 
            coordinate={corridaAtiva.destinoCoords} 
            title="Seu destino" 
            description="Ponto de chegada"
            pinColor="#EF4444" 
          />
        )}
      </MapView>

      {/* Seletor de Endereço (Pin Central) */}
      {modoSelecao && (
        <>
          <View style={styles.marcadorSelecaoContainer} pointerEvents="none">
            <MapPin size={40} color={modoSelecao === 'origem' ? '#2563EB' : '#EF4444'} />
            <View style={styles.marcadorSelecaoSombra} />
          </View>
        </>
      )}

      {/* Controles de Zoom e Localização */}
      <View style={styles.controles}>
        <TouchableOpacity style={styles.controleButton} onPress={handleZoomIn}>
          <ZoomIn size={20} color="#4B5563" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controleButton} onPress={handleZoomOut}>
          <ZoomOut size={20} color="#4B5563" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controleButton, styles.localizarButton]}
          onPress={onCentralizarUsuario}
        >
          <Locate size={20} color="#2563EB" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%' },
  webFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  marcadorSelecaoContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 40,
    height: 40,
    marginTop: -40,
    marginLeft: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  marcadorSelecaoSombra: {
    width: 15,
    height: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    transform: [{ scaleX: 1.5 }],
    marginTop: -12,
  },
  controles: {
    position: 'absolute',
    right: 16,
    bottom: 20,
    flexDirection: 'column',
  },
  controleButton: {
    backgroundColor: '#FFFFFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  localizarButton: { marginTop: 8 },
});