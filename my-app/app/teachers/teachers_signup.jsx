import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Pressable,
    ScrollView, StyleSheet, KeyboardAvoidingView,
    Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import axios from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';
import { BASE_URL } from '../../config';
import useStore from '../../store/useStore';

// ── Constants ──────────────────────────────────────────────
const PRIMARY     = '#ec5b13';
const BG          = '#f8f6f6';
const WHITE       = '#FFFFFF';
const BORDER      = '#E2E8F0';
const LABEL       = '#374151';
const MUTED       = '#64748B';
const PLACEHOLDER = '#94A3B8';
const ERROR_COLOR = '#EF4444';

const API_URL = `${BASE_URL}/teacher`;

// ── Label ──────────────────────────────────────────────────
const Label = ({ text }) => <Text style={styles.label}>{text}</Text>;

// ── Reusable Input ─────────────────────────────────────────
const InputField = ({
    icon, placeholder, value, onChangeText,
    keyboardType, secureTextEntry, error, hint,
}) => (
    <View>
        <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
            <Text style={styles.inputIcon}>{icon}</Text>
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={PLACEHOLDER}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType || 'default'}
                secureTextEntry={secureTextEntry || false}
                autoCapitalize="none"
            />
        </View>
        {error
            ? <Text style={styles.errorText}>⚠️ {error}</Text>
            : hint
                ? <Text style={styles.hintText}>{hint}</Text>
                : null
        }
        <View style={{ height: 12 }} />
    </View>
);

const TeacherSignup = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // ── Global Store ──
    const { 
        teacherSignupData, 
        setTeacherSignupData, 
        clearTeacherSignup 
    } = useStore();

    // ── Local State (Initial load from store) ──
    const [fullName, setFullName] = useState(teacherSignupData.fullName || '');
    const [email,    setEmail]    = useState(teacherSignupData.email || '');
    const [password, setPassword] = useState(teacherSignupData.password || '');
    const [errors,    setErrors]  = useState({});
    const [loading,   setLoading] = useState(false);

    // ── Biometric Status (Synchronized with Store) ──
    const faceDone   = teacherSignupData.face_done;
    const fingerDone = teacherSignupData.finger_done;
    const voiceDone  = teacherSignupData.voice_done;

    // ── Sync with Store ──
    useEffect(() => {
        // Sync form data
        setTeacherSignupData({ fullName, email, password });
        
        // Sync biometric params from navigation (Face/Voice)
        if (params.face_done === 'true') setTeacherSignupData({ face_done: true });
        if (params.voice_done === 'true') setTeacherSignupData({ voice_done: true });
        if (params.finger_done === 'true') setTeacherSignupData({ finger_done: true });
    }, [fullName, email, password, params.face_done, params.voice_done, params.finger_done]);

    const validate = () => {
        const e = {};
        if (!fullName.trim()) e.fullName = 'Full name is required';
        if (!email.trim()) e.email = 'Email is required';
        else if (!email.includes('@')) e.email = 'Email must contain @';
        if (!password) e.password = 'Password is required';
        else if (password.length < 6) e.password = 'Password must be at least 6 characters';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

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
                promptMessage: 'Enroll your biometric',
                fallbackLabel: 'Use Passcode',
            });

            if (result.success) {
                setTeacherSignupData({ finger_done: true });
                Alert.alert('✅ Done', 'Fingerprint linked to your account locally.');
            }
        } catch (e) {
            Alert.alert("Error", "Biometric service error.");
        }
    };

    const handleSignup = async () => {
        if (!validate()) return;

        if (!faceDone || !fingerDone || !voiceDone) {
            Alert.alert('Missing Biometrics', 'Please complete Face, Fingerprint, and Voice registration before signing up.');
            return;
        }

        setLoading(true);
        try {
            const signupPayload = {
                fullName: fullName.trim(),
                email: email.trim().toLowerCase(),
                password,
                faceRegistered: faceDone,
                voiceRegistered: voiceDone,
                fingerprintVerified: fingerDone,
            };
            const response = await axios.post(`${API_URL}/signup`, signupPayload);
            clearTeacherSignup();
            Alert.alert('✅ Account Created!', response.data.message || 'Signup successful!', [
                { text: 'Login Now', onPress: () => router.replace('/teachers/') }
            ]);
        } catch (error) {
            const msg = error.response?.data?.message || 'Signup failed. Try again.';
            Alert.alert('❌ Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Animated.View entering={FadeIn.duration(400)} style={styles.container}>

                <View style={styles.decorShape} pointerEvents="none">
                    <View style={styles.decorLine1} />
                    <View style={styles.decorLine2} />
                    <View style={styles.decorLine3} />
                </View>

                {/* ── HEADER ── */}
                <Animated.View entering={FadeInDown.duration(500).delay(50)} style={styles.header}>
                    <Pressable style={styles.backBtn} onPress={() => router.replace('/home')}>
                        <Text style={styles.backArrow}>←</Text>
                    </Pressable>
                    <Text style={styles.headerTitle}>Teacher Sign Up</Text>
                    <View style={{ width: 40 }} />
                </Animated.View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── HERO ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.hero}>
                        <Text style={styles.heroTitle}>Create Account</Text>
                        <Text style={styles.heroSub}>
                            Join the Kiety Meet academic community and start managing your classes.
                        </Text>
                    </Animated.View>

                    {/* ── FORM FIELDS ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.formSection}>
                        <Label text="Full Name" />
                        <InputField
                            icon="👤" placeholder="Dr. Sarah Jenkins"
                            value={fullName} onChangeText={setFullName}
                            error={errors.fullName}
                        />

                        <Label text="Email Address" />
                        <InputField
                            icon="✉️" placeholder="s.jenkins@institution.edu"
                            value={email} onChangeText={setEmail}
                            keyboardType="email-address"
                            error={errors.email}
                        />

                        <Label text="Password" />
                        <InputField
                            icon="🔒" placeholder="Min. 6 characters"
                            value={password} onChangeText={setPassword}
                            secureTextEntry
                            hint="At least 6 characters"
                            error={errors.password}
                        />
                    </Animated.View>

                    {/* ── BIOMETRIC OPTIONS ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.bioSection}>
                        <Text style={styles.bioSectionLabel}>BIOMETRIC REGISTRATION (REQUIRED)</Text>
                        <View style={styles.bioRow}>
                            {[
                                { 
                                    icon: '😊', 
                                    label: 'Face ID', 
                                    done: faceDone, 
                                    route: '/Authentication/', 
                                    params: { role: 'teacher', mode: 'register', returnTo: '/teachers/teachers_signup' } 
                                },
                                { 
                                    icon: '👆', 
                                    label: 'Finger', 
                                    done: fingerDone, 
                                    route: '/Authentication/fingerprint', 
                                    params: { role: 'teacher', mode: 'register', returnTo: '/teachers/teachers_signup' }
                                },
                                { 
                                    icon: '🎙️', 
                                    label: 'Voice', 
                                    done: voiceDone, 
                                    route: '/Authentication/voice_recog', 
                                    params: { role: 'teacher', mode: 'register', returnTo: '/teachers/teachers_signup' }
                                },
                            ].map((item) => {
                                return (
                                <Pressable 
                                    key={item.label} 
                                    style={[styles.bioCard, item.done && styles.bioCardDone]}
                                    onPress={() => {
                                        if (item.label === 'Finger') {
                                            handleFingerprint();
                                        } else {
                                            router.push({ pathname: item.route, params: item.params });
                                        }
                                    }}
                                >
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={[styles.bioCardIcon, { opacity: item.done ? 1 : 0.5 }]}>{item.icon}</Text>
                                        {item.done && (
                                            <View style={styles.doneCheck}>
                                                <Text style={styles.doneCheckText}>✓</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.bioCardLabel, item.done && styles.bioCardLabelDone]}>{item.label}</Text>
                                </Pressable>
                            )})}
                        </View>
                    </Animated.View>

                    {/* ── SIGNUP BUTTON ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(250)} style={styles.actionSection}>
                        <Pressable
                            style={[styles.signupBtn, loading && styles.signupBtnDisabled]}
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color={WHITE} />
                                : <>
                                    <Text style={styles.signupBtnText}>Sign Up</Text>
                                    <Text style={styles.signupBtnArrow}>›</Text>
                                  </>
                            }
                        </Pressable>

                        <View style={styles.loginRow}>
                            <Text style={styles.loginRowText}>Already a user? </Text>
                            <Pressable onPress={() => router.push('/teachers/')}>
                                <Text style={styles.loginLink}>Login</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </Animated.View>
        </KeyboardAvoidingView>
    );
};

export default TeacherSignup;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    decorShape: { position: 'absolute', bottom: 0, right: 0, width: 160, height: 160, opacity: 0.08, zIndex: 0 },
    decorLine1: { position: 'absolute', bottom: 80, right: 10, width: 120, height: 2, borderRadius: 1, backgroundColor: PRIMARY, transform: [{ rotate: '-30deg' }] },
    decorLine2: { position: 'absolute', bottom: 50, right: 30, width: 100, height: 2, borderRadius: 1, backgroundColor: PRIMARY, transform: [{ rotate: '10deg' }] },
    decorLine3: { position: 'absolute', bottom: 20, right: 60, width: 2, height: 80, borderRadius: 1, backgroundColor: PRIMARY },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 8 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    backArrow: { fontSize: 22, color: '#374151' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
    scroll: { paddingHorizontal: 20 },
    hero: { paddingTop: 20, paddingBottom: 8 },
    heroTitle: { fontSize: 30, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
    heroSub: { fontSize: 14, color: MUTED, lineHeight: 22 },
    formSection: { paddingTop: 16, gap: 4 },
    label: { fontSize: 13, fontWeight: '600', color: LABEL, marginBottom: 6, marginTop: 4, marginLeft: 2 },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE, borderRadius: 14, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 14, height: 56 },
    inputWrapperError: { borderColor: ERROR_COLOR },
    inputIcon: { fontSize: 18, marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: '#0F172A' },
    hintText: { fontSize: 11, color: MUTED, marginTop: 4, marginLeft: 2 },
    errorText: { fontSize: 11, color: ERROR_COLOR, marginTop: 4, marginLeft: 2 },
    bioSection: { paddingTop: 16 },
    bioSectionLabel: { fontSize: 13, fontWeight: '700', color: LABEL, marginBottom: 14, marginLeft: 2 },
    bioRow: { flexDirection: 'row', gap: 12 },
    bioCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, backgroundColor: WHITE, borderRadius: 14, borderWidth: 1, borderColor: BORDER },
    bioCardDone: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
    bioCardIcon: { fontSize: 28 },
    bioCardLabel: { fontSize: 11, fontWeight: '600', color: MUTED },
    bioCardLabelDone: { color: '#22C55E' },
    doneCheck: {
        position: 'absolute', top: -14, right: -14,
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: WHITE,
    },
    doneCheckText: { color: WHITE, fontSize: 9, fontWeight: '900' },
    actionSection: { paddingTop: 28 },
    signupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: PRIMARY, borderRadius: 14, height: 60, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 7 },
    signupBtnDisabled: { opacity: 0.6 },
    signupBtnText: { color: WHITE, fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
    signupBtnArrow: { color: WHITE, fontSize: 22, fontWeight: '300' },
    loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    loginRowText: { fontSize: 13, color: MUTED },
    loginLink: { fontSize: 13, fontWeight: '800', color: PRIMARY },
});