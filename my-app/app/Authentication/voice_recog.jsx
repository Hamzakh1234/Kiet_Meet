import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    Dimensions, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
    FadeIn, FadeInDown, 
    useSharedValue, useAnimatedStyle, 
    withRepeat, withTiming, withSequence
} from 'react-native-reanimated';
import { Audio } from 'expo-av';
import axios from 'axios';
import { PYTHON_SERVICE_URL } from '../../config';

const { width } = Dimensions.get('window');

// ── Theme Colors ──────────────────────────────────────────
const PRIMARY = '#72554b';
const ACCENT = '#A68966';
const BG = '#faf9f6';
const SURFACE = '#ffffff';
const TEXT = '#1a1c1a';

export default function VoiceRegistration() {
    const router = useRouter();
    const { role, mode, user_id, returnTo } = useLocalSearchParams();
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedUri, setRecordedUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [permissionResponse, requestPermission] = Audio.usePermissions();

    // ── Waveform Animation ──────────────────────────────────
    const waveAnim = useSharedValue(1);
    useEffect(() => {
        if (isRecording) {
            waveAnim.value = withRepeat(
                withSequence(
                    withTiming(1.5, { duration: 500 }),
                    withTiming(1, { duration: 500 })
                ),
                -1, true
            );
        } else {
            waveAnim.value = 1;
        }
    }, [isRecording]);

    const animatedWaveStyle = (height) => useAnimatedStyle(() => ({
        height: isRecording ? height * waveAnim.value : height,
    }));

    // ── Voice Recording Logic ───────────────────────────────
    async function startRecording() {
        try {
            if (permissionResponse.status !== 'granted') {
                await requestPermission();
            }
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
        } catch (err) {
            Alert.alert('Failed to start recording', err.message);
        }
    }

    async function stopRecording() {
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecordedUri(uri);
        setRecording(undefined);
        console.log('Recording stopped and stored at', uri);
        // Removed Alert to allow "Close Recording" to feel like a refresh/stop
    }

    const handleSubmit = async () => {
        if (!recordedUri) {
            Alert.alert('Error', 'Please record your voice first');
            return;
        }
        
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('voice_sample', {
                uri: recordedUri,
                name: 'voice.wav',
                type: 'audio/wav',
            });
            formData.append('role', role || 'student');
            formData.append('user_id', user_id || 'temp_user');

            const endpoint = mode === 'verify' 
                ? `${PYTHON_SERVICE_URL}/voice/verify` 
                : `${PYTHON_SERVICE_URL}/voice/register`;

            const response = await axios.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (mode === 'verify') {
                if (response.data.verified) {
                    Alert.alert('✅ Verified', 'Voice identity confirmed!', [
                        {
                            text: 'OK',
                            onPress: () => {
                                if (returnTo) {
                                    router.push({
                                        pathname: returnTo,
                                        params: { sec_factor_verified: 'true' }
                                    });
                                } else {
                                    router.back();
                                }
                            }
                        }
                    ]);
                } else {
                    Alert.alert('❌ Failed', 'Voice not recognized. Try again.');
                    setRecordedUri(null);
                }
            } else {
                // Registration success 
                Alert.alert('✅ Enrolled', 'Voice pattern registered!', [
                    {
                        text: 'Continue',
                        onPress: () => {
                            if (returnTo) {
                                router.push({
                                    pathname: returnTo,
                                    params: { voice_done: 'true' }
                                });
                            } else {
                                // Default flow
                                router.back(); 
                            }
                        }
                    }
                ]);
            }
        } catch (e) {
            console.log(e);
            Alert.alert('Error', 'Server connection failed.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />

            {/* ── Top Bar ── */}
            <View style={styles.header}>
                <Pressable 
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backBtnText}>✕</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Biometric Security</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.mainTitle}>Record Voice</Text>

                {/* ── Central Visualization Card ── */}
                <Animated.View entering={FadeInDown.duration(600)} style={styles.card}>
                    {/* Abstract Blur Circle */}
                    <View style={styles.blurCircle} />

                    {/* Mic Icon */}
                    <View style={[styles.micCircle, { backgroundColor: isRecording ? '#ba1a1a' : PRIMARY }]}>
                        <Text style={{ color: '#fff', fontSize: 40 }}>🎙️</Text>
                    </View>

                    {/* Waveform Bars */}
                    <View style={styles.waveformContainer}>
                        {[20, 40, 60, 30, 80, 45, 90, 55, 70, 35, 50, 25].map((h, i) => (
                            <Animated.View 
                                key={i} 
                                style={[styles.waveBar, animatedWaveStyle(h)]} 
                            />
                        ))}
                    </View>

                    {/* Phrase Section */}
                    <View style={styles.phraseBox}>
                        <Text style={styles.phraseLabel}>PLEASE READ ALOUD</Text>
                        <Text style={styles.phraseText}>
                            "Say your name and password for Kiet Meet"
                        </Text>
                    </View>

                    {/* Record Button */}
                    <Pressable 
                        onPress={isRecording ? stopRecording : startRecording}
                        style={[styles.recordBtn, isRecording && { opacity: 0.8 }]}
                    >
                        <View style={[styles.recordDot, { backgroundColor: isRecording ? '#fff' : '#fff' }]} />
                        <Text style={styles.recordBtnText}>
                            {isRecording ? "Stop Recording" : "Start Recording"}
                        </Text>
                    </Pressable>
                </Animated.View>

                {/* ── Submit Button ── */}
                <Pressable 
                    style={[styles.submitBtn, (!recordedUri || loading) && { opacity: 0.5 }]} 
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Done</Text>}
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 50, paddingHorizontal: 16, height: 100,
        borderBottomWidth: 1, borderBottomColor: '#eee'
    },
    backBtn: { 
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center', justifyContent: 'center' 
    },
    backBtnText: { fontSize: 18, color: TEXT, fontWeight: '700' },
    headerTitle: { fontSize: 13, fontWeight: '700', color: TEXT, letterSpacing: 1 },
    content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
    mainTitle: { fontSize: 36, fontWeight: '800', color: TEXT, marginBottom: 40 },
    
    card: {
        backgroundColor: SURFACE, borderRadius: 24, padding: 32,
        alignItems: 'center', position: 'relative', overflow: 'hidden',
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1, shadowRadius: 30, elevation: 10
    },
    blurCircle: {
        position: 'absolute', top: -40, right: -40,
        width: 150, height: 150, borderRadius: 75,
        backgroundColor: `${PRIMARY}10`, zIndex: -1
    },
    micCircle: {
        width: 90, height: 90, borderRadius: 45,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 30, elevation: 5
    },
    waveformContainer: {
        flexDirection: 'row', alignItems: 'flex-end',
        height: 100, marginBottom: 40, width: '100%', justifyContent: 'center'
    },
    waveBar: {
        width: 4, backgroundColor: '#e4beb2',
        borderRadius: 2, marginHorizontal: 2
    },
    phraseBox: { alignItems: 'center', marginBottom: 30 },
    phraseLabel: { fontSize: 10, letterSpacing: 2, color: '#666', marginBottom: 10 },
    phraseText: { fontSize: 22, fontWeight: '700', color: TEXT, textAlign: 'center' },
    
    recordBtn: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: PRIMARY, paddingVertical: 14, paddingHorizontal: 24,
        borderRadius: 100, gap: 10
    },
    recordDot: { width: 12, height: 12, borderRadius: 6 },
    recordBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    submitBtn: {
        backgroundColor: ACCENT, width: '100%',
        paddingVertical: 18, borderRadius: 12,
        marginTop: 30, alignItems: 'center'
    },
    submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});