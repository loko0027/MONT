import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    Modal, // Importação adicionada
    Dimensions, // Importação adicionada
} from 'react-native';
import { MapPin, Navigation, Car, Package, User as UserIcon, X, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons'; // Ícone para a carteira
import * as Location from 'expo-location';
import { Region } from 'react-native-maps';

// Importações dos seus hooks (mantidas)
import { useAuth, User } from '@/hooks/useAuth';
import { useCorridas, Corrida } from '@/hooks/useCorridas';
import { useTarifas } from '@/hooks/useTarifas';
import { MapaComponent } from '@/components/MapaComponent';
import { StatusCorrida } from '@/components/StatusCorrida';

interface Coordenada {
    latitude: number;
    longitude: number;
}

const REGIAO_INICIAL: Region = {
    latitude: -15.793889,
    longitude: -47.882778,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

// --- Funções Utilitárias (Mantidas do seu código) ---
const getAddressFromCoords = async (coords: Coordenada): Promise<string> => {
    try {
        const geocode = await Location.reverseGeocodeAsync(coords);
        if (geocode && geocode.length > 0) {
            const address = geocode[0];
            const street = address.street || address.name || "Rua Desconhecida";
            const number = address.streetNumber ? `, ${address.streetNumber}` : '';
            const city = address.city || "Cidade Desconhecida";
            return `${street}${number}, ${city}`;
        }
    } catch (error) {
        console.error("Erro no Geocoding Reverso:", error);
    }
    return `Coordenada: Lat ${coords.latitude.toFixed(4)}, Lon ${coords.longitude.toFixed(4)}`;
};

const calcularDistanciaHaversine = (coord1: Coordenada, coord2: Coordenada): number => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // Km
    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);
    const lat1 = toRad(coord1.latitude);
    const lat2 = toRad(coord2.latitude);
    const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};


// --- LÓGICA E COMPONENTE DA CARTEIRA DO MOTOBOY (NOVO) ---

// ⚠️ SUBSTITUIR: Essa função deve chamar o seu backend para buscar os ganhos reais
const getBalance = (filter: 'day' | 'week' | 'month'): number => {
    switch (filter) {
        case 'day':
            return 87.50; 
        case 'week':
            return 452.90; 
        case 'month':
            return 1850.25; 
        default:
            return 0.00;
    }
};

const formatCurrency = (value: number): string => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
};

const MotoboyWalletPill = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [filter, setFilter] = useState<'day' | 'week' | 'month'>('day'); 
    
    const currentBalance = getBalance(filter);

    const handleFilterChange = (newFilter: 'day' | 'week' | 'month') => {
        setFilter(newFilter);
        setModalVisible(false);
    };

    const renderFilterButton = (key: 'day' | 'week' | 'month', label: string) => (
        <TouchableOpacity 
            key={key}
            style={[
                styles.walletFilterButton, 
                filter === key && styles.walletFilterActive
            ]}
            onPress={() => handleFilterChange(key)}
        >
            <Text style={[
                styles.walletFilterText, 
                filter === key && styles.walletFilterTextActive
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View>
            {/* 1. O Botão da Pílula que Exibe o Saldo Atual */}
            <TouchableOpacity 
                style={styles.walletPillContainer} 
                onPress={() => setModalVisible(true)}
            >
                <FontAwesome5 name="wallet" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.walletPillText}>
                    {formatCurrency(currentBalance)} 
                    <Text style={styles.walletPillSubText}> ({filter.toUpperCase().substring(0, 3)})</Text>
                </Text>
            </TouchableOpacity>

            {/* 2. O Modal UI pequeno para Seleção de Filtro */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity 
                    style={styles.walletModalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setModalVisible(false)}
                >
                    <View style={styles.walletModalContent}>
                        <Text style={styles.walletModalTitle}>Ver Saldo por:</Text>
                        <View style={styles.walletFilterGroup}>
                            {renderFilterButton('day', 'Dia')}
                            {renderFilterButton('week', 'Semana')}
                            {renderFilterButton('month', 'Mês')}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};


// --- COMPONENTE PRINCIPAL (PrincipalScreen) ---

export default function PrincipalScreen() {
    // Hooks existentes (Mantidos)
    const { user, userType } = useAuth<User>();
    const {
        solicitarCorrida,
        aceitarCorrida,
        atualizarStatusCorrida,
        corridaAtiva,
        corridasDisponiveis,
        cancelarCorrida
    } = useCorridas();
    const { calcularValorEstimado } = useTarifas();

    // Estados existentes (Mantidos)
    const [origem, setOrigem] = useState('');
    const [destino, setDestino] = useState('');
    const [origemCoords, setOrigemCoords] = useState<Coordenada | null>(null);
    const [destinoCoords, setDestinoCoords] = useState<Coordenada | null>(null);
    const [tipoServico, setTipoServico] = useState<'pessoa' | 'mercadoria'>('pessoa');
    const [valorEstimado, setValorEstimado] = useState(0);
    const [regiao, setRegiao] = useState<Region>(REGIAO_INICIAL);
    const [localizacaoUsuario, setLocalizacaoUsuario] = useState<Coordenada | null>(null);
    const [modoSelecao, setModoSelecao] = useState<'origem' | 'destino' | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const insets = useSafeAreaInsets();

    // Efeitos e Handlers (Mantidos)
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                try {
                    let location = await Location.getCurrentPositionAsync({});
                    const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
                    setLocalizacaoUsuario(coords);
                    setRegiao({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });

                    if (userType === 'cliente' && !origem) {
                        const nomeDaRua = await getAddressFromCoords(coords);
                        setOrigem(nomeDaRua);
                        setOrigemCoords(coords);
                    }
                } catch (error) {
                    console.error("Erro ao pegar localização: ", error);
                }
            } else {
                Alert.alert('Permissão Negada', 'Para usar o mapa, precisamos da sua localização.');
            }
        })();
    }, [userType]);

    const handleCentralizarUsuario = () => {
        if (localizacaoUsuario) {
            setRegiao({ ...localizacaoUsuario, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        } else {
            Alert.alert("Erro", "Localização do usuário não disponível.");
        }
    };

    const handleConfirmarLocalizacao = async () => {
        if (!modoSelecao) return;

        const centroAtual = { latitude: regiao.latitude, longitude: regiao.longitude };
        const nomeEndereco = await getAddressFromCoords(centroAtual);

        if (modoSelecao === 'origem') {
            setOrigem(nomeEndereco);
            setOrigemCoords(centroAtual);
        } else if (modoSelecao === 'destino') {
            setDestino(nomeEndereco);
            setDestinoCoords(centroAtual);
        }

        setModoSelecao(null);
    };

    const startMapSelection = (tipo: 'origem' | 'destino') => {
        setModoSelecao(tipo);
        const coords = tipo === 'origem' ? origemCoords : destinoCoords;
        if (coords) setRegiao({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        else if (localizacaoUsuario) setRegiao({ ...localizacaoUsuario, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    };

    const startAddressSearch = (tipo: 'origem' | 'destino') => {
        Alert.alert(
            "Em Desenvolvimento",
            `O modo de busca de texto para ${tipo === 'origem' ? 'ORIGEM' : 'DESTINO'} requer o Google Places Autocomplete.`,
            [{ text: "OK" }]
        );
    };

    useEffect(() => {
        const calcularEstimativaLocal = () => {
            if (!origemCoords || !destinoCoords) {
                setValorEstimado(0);
                return;
            }

            const distanciaKm = calcularDistanciaHaversine(origemCoords, destinoCoords);
            const valor = calcularValorEstimado(tipoServico, distanciaKm);
            setValorEstimado(valor);
        };
        calcularEstimativaLocal();
    }, [origemCoords, destinoCoords, tipoServico, calcularValorEstimado]);

    const handleSolicitarCorrida = async () => {
        if (!origemCoords || !destinoCoords || !origem || !destino) {
            Alert.alert('Erro', 'Selecione a origem e o destino no mapa.');
            return;
        }
        setIsSubmitting(true);
        try {
            await solicitarCorrida({
                origem,
                destino,
                tipoServico,
                origemCoords,
                destinoCoords
            });
        } catch (error: any) {
            console.error("Erro ao solicitar corrida:", error);
            Alert.alert('Erro ao Solicitar', error.message || 'Não foi possível criar a corrida.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelarCorrida = async () => {
        if (!corridaAtiva || !userType) return;

        Alert.alert(
            "Cancelar Corrida",
            "Tem certeza que deseja cancelar esta corrida?",
            [
                { text: "Não", style: "cancel" },
                {
                    text: "Sim, Cancelar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setIsSubmitting(true);
                            await cancelarCorrida(corridaAtiva, userType as 'cliente' | 'motoboy' | 'admin');
                        } catch (error: any) {
                            Alert.alert("Erro ao Cancelar", error.message || "Não foi possível cancelar.");
                        } finally {
                            setIsSubmitting(false);
                        }
                    }
                }
            ]
        );
    };

    const dadosParaMapa: Corrida | null = corridaAtiva ? corridaAtiva : (
        (origemCoords && destinoCoords && !modoSelecao) ? {
            id: 'preview-id',
            usuario_id: user?.id || 'preview-user',
            origem,
            destino,
            origemCoords,
            destinoCoords,
            status_corrida: 'pendente',
            tipo_servico: tipoServico,
            valor_estimado: valorEstimado,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        } : null
    );

    // --- RENDERIZAÇÃO DO CLIENTE (Mantida) ---
    if (userType === 'cliente') {
        return (
            <View style={styles.container}>
                <MapaComponent
                    corridaAtiva={dadosParaMapa}
                    modoSelecao={modoSelecao}
                    regiaoAtual={regiao}
                    onRegiaoChange={setRegiao}
                    onCentralizarUsuario={handleCentralizarUsuario}
                />

                {corridaAtiva ? (
                    <StatusCorrida
                        corrida={corridaAtiva}
                        onAtualizarStatus={atualizarStatusCorrida}
                        onCancelarCorrida={handleCancelarCorrida}
                        userType={userType}
                    />
                ) : modoSelecao ? (
                    <View style={[styles.selecaoPanel, { paddingBottom: insets.bottom + 10 }]}>
                        <Text style={styles.title}>{modoSelecao === 'origem' ? 'Definir Origem' : 'Definir Destino'}</Text>
                        <Text style={styles.enderecoEmSelecao}>Arraste o mapa para posicionar o pino.</Text>
                        <TouchableOpacity style={styles.confirmarButton} onPress={handleConfirmarLocalizacao}>
                            <Check size={24} color="#FFFFFF" />
                            <Text style={styles.confirmarButtonText}>Confirmar Localização</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setModoSelecao(null)} style={styles.cancelarButton}>
                            <Text style={styles.cancelarButtonText}><X size={16} color="#6B7280" /> Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView style={styles.bottomPanelContainer}>
                        <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + 20 }]}>
                            <Text style={styles.title}>Solicitar Corrida</Text>
                            {/* ... Lógica de seleção de Origem/Destino do Cliente ... */}
                            <TouchableOpacity style={styles.inputContainer} onPress={() => {
                                Alert.alert("Escolha a Origem", "Como você deseja definir a origem?", [
                                    { text: "No Mapa (Pin)", onPress: () => startMapSelection('origem') },
                                    { text: "Digitar Endereço", onPress: () => startAddressSearch('origem') },
                                    { text: "Cancelar", style: 'cancel' },
                                ]);
                            }}>
                                <MapPin size={20} color="#2563EB" />
                                <Text style={origem ? styles.inputPlaceholderText : styles.inputEmptyText}>
                                    {origem || "Origem (Toque para selecionar)"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.inputContainer} onPress={() => {
                                Alert.alert("Escolha o Destino", "Como você deseja definir o destino?", [
                                    { text: "No Mapa (Pin)", onPress: () => startMapSelection('destino') },
                                    { text: "Digitar Endereço", onPress: () => startAddressSearch('destino') },
                                    { text: "Cancelar", style: 'cancel' },
                                ]);
                            }}>
                                <Navigation size={20} color="#2563EB" />
                                <Text style={destino ? styles.inputPlaceholderText : styles.inputEmptyText}>
                                    {destino || "Destino (Toque para selecionar)"}
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.sectionTitle}>Tipo de Serviço</Text>
                            <View style={styles.tipoServicoContainer}>
                                {[
                                    { key: 'pessoa', label: 'Pessoa', icon: UserIcon },
                                    { key: 'mercadoria', label: 'Mercadoria', icon: Package },
                                ].map(({ key, label, icon: Icon }) => (
                                    <TouchableOpacity
                                        key={key}
                                        style={[
                                            styles.tipoServicoButton,
                                            tipoServico === key && styles.tipoServicoButtonActive,
                                        ]}
                                        onPress={() => setTipoServico(key as 'pessoa' | 'mercadoria')}
                                    >
                                        <Icon size={24} color={tipoServico === key ? '#FFFFFF' : '#2563EB'} />
                                        <Text style={[styles.tipoServicoText, tipoServico === key && styles.tipoServicoTextActive]}>{label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {valorEstimado > 0 && (
                                <View style={styles.valorContainer}>
                                    <Text style={styles.valorLabel}>Valor Estimado:</Text>
                                    <Text style={styles.valorText}>R$ {valorEstimado.toFixed(2)}</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.solicitarButton, (!origemCoords || !destinoCoords || isSubmitting) && styles.buttonDisabled]}
                                onPress={handleSolicitarCorrida}
                                disabled={!origemCoords || !destinoCoords || isSubmitting}
                            >
                                <Car size={24} color="#FFFFFF" />
                                <Text style={styles.solicitarButtonText}>
                                    {isSubmitting ? 'Solicitando...' : (!origemCoords || !destinoCoords) ? 'Selecione Endereços' : 'Solicitar Corrida'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}
            </View>
        );
    }

    // --- RENDERIZAÇÃO DO MOTOBOY (Alterada para incluir a Pílula) ---
    if (userType === 'motoboy') {
        return (
            <View style={styles.container}>
                <MapaComponent
                    corridaAtiva={corridaAtiva}
                    modoSelecao={null}
                    regiaoAtual={regiao}
                    onRegiaoChange={setRegiao}
                    onCentralizarUsuario={handleCentralizarUsuario}
                />
                
                {/* 🌟 NOVO: PÍLULA DE SALDO DO MOTOBOY FIXA NO CANTO SUPERIOR DIREITO */}
                <MotoboyWalletPill />

                {corridaAtiva ? (
                    <StatusCorrida
                        corrida={corridaAtiva}
                        onAtualizarStatus={atualizarStatusCorrida}
                        onCancelarCorrida={handleCancelarCorrida}
                        userType={userType}
                    />
                ) : (
                    <View style={styles.bottomPanel}>
                        <Text style={styles.title}>Corridas Disponíveis</Text>
                        <ScrollView style={styles.corridasList}>
                            {corridasDisponiveis.map((corrida) => (
                                <View key={corrida.id} style={styles.corridaCard}>
                                    <View style={styles.corridaInfo}>
                                        <Text style={styles.corridaOrigem}>{corrida.origem}</Text>
                                        <Text style={styles.corridaDestino}>{corrida.destino}</Text>
                                        <Text style={styles.corridaTipo}>Tipo: {corrida.tipo_servico}</Text>
                                        <Text style={styles.corridaValor}>R$ {corrida.valor_estimado.toFixed(2)}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.aceitarButton} onPress={() => aceitarCorrida(corrida.id)}>
                                        <Text style={styles.aceitarButtonText}>Aceitar</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        );
    }
    
    // --- RENDERIZAÇÃO PADRÃO (Admin ou Outros) ---
    return (
        <View style={styles.container}>
            <View style={styles.bottomPanel}>
                <Text style={styles.title}>Painel de Controle</Text>
                <Text>Conteúdo de {userType || 'admin/outro'} estaria aqui.</Text>
            </View>
        </View>
    );
}

// --- ESTILOS COMPLEMENTARES DA CARTEIRA ---
const walletStylesPill = {
    // Estilos da Pílula (A "abinha pequena" no canto superior)
    walletPillContainer: {
        position: 'absolute' as 'absolute',
        top: 50, // Ajuste para ficar abaixo da StatusBar
        right: 15,
        backgroundColor: '#007BFF', 
        flexDirection: 'row' as 'row',
        alignItems: 'center' as 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        zIndex: 10, 
        elevation: 5,
    },
    walletPillText: {
        color: '#FFFFFF',
        fontWeight: 'bold' as 'bold',
        fontSize: 16,
    },
    walletPillSubText: {
        fontSize: 10,
        fontWeight: '500' as '500',
    },
    // Estilos do Modal (Pop-up de Filtro)
    walletModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    walletModalContent: {
        position: 'absolute' as 'absolute',
        top: 90, // Posiciona logo abaixo da Pílula
        right: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        width: 180, 
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    walletModalTitle: {
        fontSize: 14,
        fontWeight: 'bold' as 'bold',
        marginBottom: 10,
        color: '#333',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    walletFilterGroup: {
        flexDirection: 'column' as 'column',
    },
    walletFilterButton: {
        paddingVertical: 8,
        paddingHorizontal: 5,
        borderRadius: 5,
        marginTop: 5,
    },
    walletFilterActive: {
        backgroundColor: '#E6F0FF',
    },
    walletFilterText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500' as '500',
    },
    walletFilterTextActive: {
        color: '#007BFF', 
        fontWeight: 'bold' as 'bold',
    },
};

// --- Estilos Base (Seu código original + merge da carteira) ---
const styles = StyleSheet.create({
    ...walletStylesPill, // Incluindo os estilos da carteira
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    bottomPanelContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '60%' },
    bottomPanel: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
    selecaoPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
    enderecoEmSelecao: { fontSize: 16, color: '#6B7280', marginBottom: 20, textAlign: 'center' as 'center' },
    confirmarButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, width: '100%', marginBottom: 10, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
    confirmarButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' as 'bold', marginLeft: 10 },
    cancelarButton: { paddingVertical: 10 },
    cancelarButtonText: { flexDirection: 'row', alignItems: 'center', color: '#6B7280', fontSize: 16, fontWeight: '600' as '600' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12, minHeight: 50 },
    inputPlaceholderText: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1F2937' },
    inputEmptyText: { flex: 1, marginLeft: 12, fontSize: 16, color: '#9CA3AF' },
    title: { fontSize: 24, fontWeight: 'bold' as 'bold', color: '#1F2937', marginBottom: 20, textAlign: 'center' as 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '600' as '600', color: '#1F2937', marginTop: 20, marginBottom: 12 },
    tipoServicoContainer: { flexDirection: 'row' as 'row', justifyContent: 'space-between' as 'space-between', marginBottom: 20 },
    tipoServicoButton: { flex: 1, alignItems: 'center' as 'center', padding: 16, marginHorizontal: 4, borderRadius: 12, borderWidth: 2, borderColor: '#2563EB' },
    tipoServicoButtonActive: { backgroundColor: '#2563EB' },
    tipoServicoText: { marginTop: 8, fontSize: 14, fontWeight: '600' as '600', color: '#2563EB' },
    tipoServicoTextActive: { color: '#FFFFFF' },
    valorContainer: { flexDirection: 'row' as 'row', justifyContent: 'space-between' as 'space-between', alignItems: 'center' as 'center', backgroundColor: '#F0FDF4', padding: 16, borderRadius: 12, marginBottom: 20 },
    valorLabel: { fontSize: 16, color: '#059669', fontWeight: '600' as '600' },
    valorText: { fontSize: 20, color: '#059669', fontWeight: 'bold' as 'bold' },
    solicitarButton: { flexDirection: 'row' as 'row', alignItems: 'center' as 'center', justifyContent: 'center' as 'center', backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
    solicitarButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' as 'bold', marginLeft: 10 },
    buttonDisabled: { backgroundColor: '#9CA3AF', shadowColor: '#9CA3AF' },
    corridasList: { maxHeight: 300 },
    corridaCard: { flexDirection: 'row' as 'row', justifyContent: 'space-between' as 'space-between', alignItems: 'center' as 'center', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, marginBottom: 12 },
    corridaInfo: { flex: 1 },
    corridaOrigem: { fontSize: 14, fontWeight: '600' as '600' },
    corridaDestino: { fontSize: 14, fontWeight: '600' as '600' },
    corridaTipo: { fontSize: 14 },
    corridaValor: { fontSize: 14, fontWeight: 'bold' as 'bold' },
    aceitarButton: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    aceitarButtonText: { color: '#FFFFFF', fontWeight: '600' as '600' },
});