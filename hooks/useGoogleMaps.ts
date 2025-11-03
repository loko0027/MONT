import { useState } from 'react';

interface Coordenada {
  latitude: number;
  longitude: number;
}

interface RotaInfo {
  distancia: number; // em km
  duracao: number; // em minutos
  polyline: string;
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export function useGoogleMaps() {
  const [loading, setLoading] = useState(false);

  const calcularRota = async (origem: Coordenada, destino: Coordenada): Promise<RotaInfo | null> => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API Key não configurada, usando valores simulados');
      // Simular cálculo de distância usando fórmula de Haversine
      const distanciaSimulada = calcularDistanciaHaversine(origem, destino);
      const duracaoSimulada = Math.round(distanciaSimulada * 2.5); // ~2.5 min por km
      
      return {
        distancia: distanciaSimulada,
        duracao: duracaoSimulada,
        polyline: '', // Vazio para simulação
      };
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?` +
        `origin=${origem.latitude},${origem.longitude}&` +
        `destination=${destino.latitude},${destino.longitude}&` +
        `key=${GOOGLE_MAPS_API_KEY}&` +
        `language=pt-BR`
      );

      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        return {
          distancia: leg.distance.value / 1000, // Converter metros para km
          duracao: Math.round(leg.duration.value / 60), // Converter segundos para minutos
          polyline: route.overview_polyline.points,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao calcular rota:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const obterEndereco = async (coordenada: Coordenada): Promise<string> => {
    if (!GOOGLE_MAPS_API_KEY) {
      return `Lat: ${coordenada.latitude.toFixed(4)}, Lng: ${coordenada.longitude.toFixed(4)}`;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?` +
        `latlng=${coordenada.latitude},${coordenada.longitude}&` +
        `key=${GOOGLE_MAPS_API_KEY}&` +
        `language=pt-BR`
      );

      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      
      return `Lat: ${coordenada.latitude.toFixed(4)}, Lng: ${coordenada.longitude.toFixed(4)}`;
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
      return `Lat: ${coordenada.latitude.toFixed(4)}, Lng: ${coordenada.longitude.toFixed(4)}`;
    }
  };

  const buscarEndereco = async (query: string): Promise<Coordenada | null> => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API Key não configurada');
      return null;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?` +
        `address=${encodeURIComponent(query)}&` +
        `key=${GOOGLE_MAPS_API_KEY}&` +
        `language=pt-BR`
      );

      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      return null;
    }
  };

  return {
    calcularRota,
    obterEndereco,
    buscarEndereco,
    loading,
  };
}

// Função auxiliar para calcular distância usando fórmula de Haversine
function calcularDistanciaHaversine(coord1: Coordenada, coord2: Coordenada): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}