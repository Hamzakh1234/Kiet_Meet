// app/students/index.jsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Pressable,
    StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';
import useStore from '../../store/useStore';
import { BASE_URL } from '../../config';

// ── Constants ──────────────────────────────────────────────
const PRIMARY     = '#ec5b13';
const BG          = '#f8f6f6';
const WHITE       = '#FFFFFF';
const MUTED       = '#64748B';
const PLACEHOLDER = '#94A3B8';
const SUCCESS     = '#22C55E';

const API_URL = `${BASE_URL}/auth`;

const StudentLogin = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { setUser, loginData, setLoginData, clearLoginData } = useStore();

    const [email,    setEmail]    = useState(loginData.email || '');
    const [password, setPassword] = useState(loginData.password || '');
    const [showPass, setShowPass] = useState(false);
    const [loading,  setLoading]  = useState(false);

    // ── Biometric Verification Status (Synchronized with Store) ──
    const faceVerified   = loginData.face_verified;
    const fingerVerified = loginData.finger_verified;
    const voiceVerified  = loginData.voice_verified;

    const secFactorVerified = fingerVerified || voiceVerified;

    // ── Sync with Store ──
    useEffect(() => {
        if (params.face_verified === 'true') setLoginData({ face_verified: true });
        if (params.sec_factor_verified === 'true') setLoginData({ finger_verified: true });
        if (params.voice_verified === 'true') setLoginData({ voice_verified: true });
    }, [params.face_verified, params.sec_factor_verified, params.voice_verified]);

    useEffect(() => {
        setLoginData({ email, password });
    }, [email, password]);

    // ── Login Execution ──────────────────────────────
    const handleFingerprint = async () => {
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

        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirm identity',
                fallbackLabel: 'Use Passcode',
            });

            if (result.success) {
                setLoginData({ finger_verified: true });
                Alert.alert('✅ Done', 'Fingerprint verified locally.');
            }
        } catch (e) {
            Alert.alert("Error", "Biometric service error.");
        }
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        if (!faceVerified) {
            Alert.alert('Face Required', 'Face verification is mandatory for login.');
            return;
        }

        if (!secFactorVerified) {
            Alert.alert('Second Factor Required', 'Please complete either Fingerprint or Voice verification.');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/login`, {
                email: email.trim().toLowerCase(),
                password,
                faceVerified: faceVerified,
                secFactorVerified: secFactorVerified
            });

            setUser(response.data.user);
            clearLoginData();
            router.replace('/students/student_dashboard');

        } catch (error) {
            const msg = error.response?.data?.message || 'Invalid credentials. Please try again.';
            Alert.alert('Login Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
                <View style={styles.blobTopLeft} />
                <View style={styles.blobBottomRight} />

                <Pressable onPress={() => { clearLoginData(); router.replace('/home'); }} style={styles.backBtn}>
                    <Text style={styles.backArrow}>←</Text>
                </Pressable>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.topSection}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>🎓</Text>
                        </View>
                        <Text style={styles.welcomeTitle}>Student Login</Text>
                        <Text style={styles.welcomeSub}>Guided Secure Access</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.card}>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>University Email</Text>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputIcon}>✉️</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="your@uni.edu"
                                    placeholderTextColor={PLACEHOLDER}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                        <View style={styles.fieldGroup}>
                            <Text style={styles.fieldLabel}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Text style={styles.inputIcon}>🔒</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••"
                                    placeholderTextColor={PLACEHOLDER}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPass}
                                />
                                <Pressable onPress={() => setShowPass(!showPass)}>
                                    <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* ── Biometric Section ── */}
                        <View style={styles.bioSection}>
                            <Text style={styles.bioHeader}>BIOMETRIC VERIFICATION</Text>
                            <Text style={styles.bioSubheader}>Face (Mandatory) + Finger or Voice</Text>
                            
                            <View style={styles.bioRow}>
                                {/* Face Icon */}
                                <Pressable 
                                    style={styles.bioItem}
                                    onPress={() => router.push({
                                        pathname: '/Authentication/',
                                        params: { role: 'student', mode: 'verify', returnTo: '/students/' }
                                    })}
                                >
                                    <View style={[styles.bioCircle, faceVerified && styles.bioCircleDone]}>
                                        <Text style={{ fontSize: 24, opacity: faceVerified ? 1 : 0.5 }}>😊</Text>
                                        {faceVerified && <View style={styles.doneCheck}><Text style={styles.doneCheckText}>✓</Text></View>}
                                    </View>
                                    <Text style={[styles.bioLabel, faceVerified && styles.bioLabelDone]}>Face</Text>
                                </Pressable>

                                <View style={styles.bioDivider} />

                                {/* Fingerprint Icon */}
                                <Pressable 
                                    style={styles.bioItem}
                                    onPress={handleFingerprint}
                                >
                                    <View style={[styles.bioCircle, fingerVerified && styles.bioCircleDone]}>
                                        <Text style={{ fontSize: 24, opacity: fingerVerified ? 1 : 0.5 }}>👆</Text>
                                        {fingerVerified && <View style={styles.doneCheck}><Text style={styles.doneCheckText}>✓</Text></View>}
                                    </View>
                                    <Text style={[styles.bioLabel, fingerVerified && styles.bioLabelDone]}>Finger</Text>
                                </Pressable>

                                <View style={styles.bioOr}><Text style={styles.bioOrText}>OR</Text></View>

                                {/* Voice Icon */}
                                <Pressable 
                                    style={styles.bioItem}
                                    onPress={() => router.push({
                                        pathname: '/Authentication/voice_recog',
                                        params: { role: 'student', mode: 'verify', returnTo: '/students/' }
                                    })}
                                >
                                    <View style={[styles.bioCircle, voiceVerified && styles.bioCircleDone]}>
                                        <Text style={{ fontSize: 24, opacity: voiceVerified ? 1 : 0.5 }}>🎙️</Text>
                                        {voiceVerified && <View style={styles.doneCheck}><Text style={styles.doneCheckText}>✓</Text></View>}
                                    </View>
                                    <Text style={[styles.bioLabel, voiceVerified && styles.bioLabelDone]}>Voice</Text>
                                </Pressable>
                            </View>
                        </View>
                        <Pressable style={[styles.loginBtn, loading && styles.loginBtnDisabled]} onPress={handleLogin} disabled={loading}>
                            {loading ? <ActivityIndicator color={WHITE} /> : <Text style={styles.loginBtnText}>Login</Text>}
                        </Pressable>

                        <View style={styles.signupRow}>
                            <Text style={styles.signupText}>New student? </Text>
                            <Pressable onPress={() => router.replace('/students/signup')}>
                                <Text style={styles.signupLink}>Create account</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                </ScrollView>
            </Animated.View>
        </KeyboardAvoidingView>
    );
};

export default StudentLogin;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    blobTopLeft: { position: 'absolute', top: -40, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: `${PRIMARY}12` },
    blobBottomRight: { position: 'absolute', bottom: -60, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: `${PRIMARY}08` },
    backBtn: { position: 'absolute', top: 52, left: 20, zIndex: 10, padding: 8 },
    backArrow: { fontSize: 24, color: MUTED, fontWeight: '600' },
    scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 20 },
    topSection: { alignItems: 'center', marginBottom: 28 },
    logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: `${PRIMARY}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    logoEmoji: { fontSize: 34 },
    welcomeTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5, marginBottom: 6 },
    welcomeSub: { fontSize: 14, color: MUTED, fontWeight: '500' },
    card: { width: '100%', backgroundColor: WHITE, borderRadius: 20, borderWidth: 1, borderColor: `${PRIMARY}15`, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6 },
    fieldGroup: { marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, marginLeft: 2 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: BG, borderRadius: 12, paddingHorizontal: 14, height: 52 },
    inputIcon: { fontSize: 16, marginRight: 10 },
    input: { flex: 1, fontSize: 14, color: '#0F172A' },
    eyeIcon: { fontSize: 18, paddingLeft: 8 },
    loginBtn: { backgroundColor: PRIMARY, borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginVertical: 10, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 7 },
    loginBtnDisabled: { opacity: 0.6 },
    loginBtnText: { color: WHITE, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    signupText: { fontSize: 13, color: MUTED },
    signupLink: { fontSize: 13, fontWeight: '800', color: PRIMARY },
    progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 30 },
    progressStep: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
    stepCheck: { color: WHITE, fontSize: 12, fontWeight: 'bold' },
    progressLine: { width: 40, height: 2, backgroundColor: '#E2E8F0' },

    // Biometric Styles
    bioSection: { marginTop: 10, marginBottom: 20, padding: 15, backgroundColor: '#fcfcfc', borderRadius: 16, borderWidth: 1, borderColor: '#f1f1f1' },
    bioHeader: { fontSize: 10, fontWeight: '800', color: MUTED, letterSpacing: 1.5, textAlign: 'center', marginBottom: 4 },
    bioSubheader: { fontSize: 9, color: MUTED, textAlign: 'center', marginBottom: 15, fontStyle: 'italic' },
    bioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
    bioItem: { alignItems: 'center', gap: 6 },
    bioCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#e2e8f0' },
    bioCircleDone: { borderColor: SUCCESS, backgroundColor: '#F0FDF4' },
    bioLabel: { fontSize: 9, fontWeight: '700', color: MUTED, textTransform: 'uppercase' },
    bioLabelDone: { color: SUCCESS },
    doneCheck: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: SUCCESS, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: WHITE },
    doneCheckText: { color: WHITE, fontSize: 9, fontWeight: '900' },
    bioDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0' },
    bioOr: { backgroundColor: '#f1f1f1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    bioOrText: { fontSize: 8, fontWeight: '800', color: MUTED },
});