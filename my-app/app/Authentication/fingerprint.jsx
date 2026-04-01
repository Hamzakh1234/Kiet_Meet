import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    Dimensions, StatusBar, Alert, ActivityIndicator,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
    FadeIn, FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle,
    withRepeat, withTiming, withSequence,
    withSpring,
} from 'react-native-reanimated';
import * as LocalAuthentication from 'expo-local-authentication';
import axios from 'axios';
import { PYTHON_SERVICE_URL } from '../../config';

const { width, height } = Dimensions.get('window');

// ── Colors from your HTML & Theme ──────────────────────────
const PRIMARY = '#A68966'; // Gold/Tan from your HTML
const BG = '#faf9f6';      // Background from your HTML
const DARK = '#1a1c1a';
const MUTED = '#4e453c';

export default function FingerprintRegistration() {
    const router = useRouter();
    const { role, mode, user_id, returnTo } = useLocalSearchParams();
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('Position your finger on the sensor');

    // ── Animations ──────────────────────────────────────────
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    useEffect(() => {
        if (params.face_verified === 'true') setLoginData({ face_verified: true });
        if (params.finger_verified === 'true') setLoginData({ finger_verified: true });
        if (params.voice_verified === 'true') setLoginData({ voice_verified: true });
    }, [params.face_verified, params.finger_verified, params.voice_verified]);

    useEffect(() => {
        // Continuous slow rotation for the dashed ring
        rotation.value = withRepeat(
            withTiming(360, { duration: 15000 }),
            -1,
            false
        );

        // Auto-trigger scan on mount
        const timer = setTimeout(() => {
            handleScan();
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    const scannerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    // ── Handle Fingerprint Scan ──────────────────────────────
    const handleScan = async () => {
        if (loading) return;

        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware) {
            Alert.alert("Not Supported", "Your device does not support fingerprint scanning.");
            return;
        }
        if (!isEnrolled) {
            Alert.alert("No Fingerprints", "Please set up fingerprints in your device settings first.");
            return;
        }

        setScanning(true);
        scale.value = withSpring(1.1);
        setStatus('Authenticating...');

        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: mode === 'verify' ? 'Confirm identity' : 'Enroll your biometric',
                fallbackLabel: 'Use Passcode',
                disableDeviceFallback: false,
            });

            if (result.success) {
                setLoading(true);
                scale.value = withSpring(1.2);
                setStatus('Success! Submitting...');
                
                const formData = new FormData();
                formData.append('role', role || 'student');
                formData.append('user_id', user_id || 'temp_user');
                formData.append('biometric_type', 'fingerprint');

                const endpoint = mode === 'verify'
                    ? `${PYTHON_SERVICE_URL}/finger/verify`
                    : `${PYTHON_SERVICE_URL}/finger/register`;

                const response = await axios.post(endpoint, formData);

                if (mode === 'verify') {
                    if (response.data.verified) {
                        Alert.alert('✅ Verified', 'Biometric identity confirmed!', [
                            {
                                text: 'OK',
                                onPress: () => {
                                    if (returnTo) {
                                        router.push({
                                            pathname: returnTo,
                                            params: { finger_verified: 'true' }
                                        });
                                    } else {
                                        router.back();
                                    }
                                }
                            }
                        ]);
                    } else {
                        Alert.alert('❌ Failed', 'Fingerprint not recognized in our database.');
                        setStatus('Ready for scan');
                    }
                } else {
                    // Registration Mode
                    Alert.alert('✅ Enrolled', 'Fingerprint linked to your account!', [
                        {
                            text: 'Continue',
                            onPress: () => {
                                if (returnTo) {
                                    router.push({
                                        pathname: returnTo,
                                        params: { finger_done: 'true' }
                                    });
                                } else {
                                    router.push({
                                        pathname: '/Authentication/voice_recog',
                                        params: { role, mode, user_id }
                                    });
                                }
                            }
                        }
                    ]);
                }
            } else {
                setStatus('Scan failed. Try again.');
            }
        } catch (e) {
            Alert.alert("Error", "Biometric service error. Please try again.");
            setStatus('Ready for scan');
        } finally {
            setLoading(false);
            setScanning(false);
            scale.value = withSpring(1);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />

            {/* ── Background Glows ── */}
            <View style={styles.topGlow} />
            <View style={styles.bottomGlow} />

            {/* ── Header ── */}
            <View style={styles.header}>
                <Pressable 
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backBtnText}>✕</Text>
                </Pressable>
                <Text style={styles.headerTitle}>BIOMETRIC SECURITY</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* ── Main Content ── */}
            <View style={styles.content}>
                <Animated.Text entering={FadeInDown.delay(200)} style={styles.title}>
                    {mode === 'verify' ? 'Fingerprint Verification' : 'Fingerprint Registration'}
                </Animated.Text>

                {/* ── Scanner UI ── */}
                <View style={styles.scannerWrapper}>
                    <View style={styles.outerRing} />
                    <Animated.View style={[styles.dashedRing, ringStyle]} />

                    <Pressable 
                        onPressIn={() => scale.value = withSpring(0.95)} 
                        onPressOut={() => scale.value = withSpring(1)} 
                        onPress={handleScan}
                        disabled={loading || scanning}
                    >
                        <Animated.View style={[
                            styles.scannerCore, 
                            scannerStyle,
                            loading && { borderColor: PRIMARY, borderWidth: 2 }
                        ]}>
                            <Text style={[
                                styles.fingerprintIcon,
                                loading && { opacity: 0.3 }
                            ]}>☝️</Text>
                            {(scanning || loading) && (
                                <ActivityIndicator 
                                    size="large" 
                                    color={PRIMARY} 
                                    style={styles.loader} 
                                />
                            )}
                        </Animated.View>
                    </Pressable>
                </View>

                {/* ── Instructions ── */}
                <Animated.View entering={FadeInUp.delay(400)} style={styles.instructionBox}>
                    <Text style={styles.instructionMain}>{status}</Text>
                    <Text style={styles.instructionSub}>
                        {loading ? "Completing secure registration..." : "Scan your fingerprint to continue"}
                    </Text>
                </Animated.View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    
    topGlow: {
        position: 'absolute', top: -50, left: -50,
        width: 300, height: 300, borderRadius: 150,
        backgroundColor: `${PRIMARY}15`, zIndex: -1,
    },
    bottomGlow: {
        position: 'absolute', bottom: -50, right: -50,
        width: 250, height: 250, borderRadius: 125,
        backgroundColor: `${PRIMARY}10`, zIndex: -1,
    },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 50, paddingHorizontal: 20,
    },
    backBtn: { 
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center', justifyContent: 'center' 
    },
    backBtnText: { fontSize: 18, color: DARK, fontWeight: '700' },
    headerTitle: { fontSize: 10, fontWeight: '800', color: MUTED, letterSpacing: 2 },

    content: { flex: 1, alignItems: 'center', paddingHorizontal: 30 },
    title: { 
        fontSize: 28, fontWeight: '800', color: DARK, 
        textAlign: 'center', marginTop: 40, marginBottom: 60 
    },

    scannerWrapper: {
        width: 260, height: 260,
        alignItems: 'center', justifyContent: 'center',
        position: 'relative',
    },
    outerRing: {
        position: 'absolute', width: 320, height: 320,
        borderRadius: 160, borderWidth: 1, borderColor: '#e3e2e0', opacity: 0.5,
    },
    dashedRing: {
        position: 'absolute', width: 230, height: 230,
        borderRadius: 115, borderWidth: 2, borderColor: `${PRIMARY}60`,
        borderStyle: 'dashed',
    },
    scannerCore: {
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: '#FFFFFF',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 20,
        elevation: 10,
        borderWidth: 1, borderColor: `${PRIMARY}20`,
    },
    fingerprintIcon: {
        fontSize: 70, color: PRIMARY, 
    },
    loader: { position: 'absolute' },

    instructionBox: { marginTop: 60, alignItems: 'center' },
    instructionMain: { fontSize: 18, fontWeight: '700', color: DARK, marginBottom: 8, textAlign: 'center' },
    instructionSub: { fontSize: 14, color: MUTED, textAlign: 'center' },
});