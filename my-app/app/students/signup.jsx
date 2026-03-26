// app/students/signup.jsx
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
const PLACEHOLDER = '#94A3B8';
const MUTED       = '#64748B';
const ERROR_COLOR = '#EF4444';

const API_URL   = `${BASE_URL}/auth`;

// ── Label ──────────────────────────────────────────────────
const Label = ({ text }) => <Text style={styles.label}>{text}</Text>;

// ── Input Field ────────────────────────────────────────────
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

// ── Main Screen ────────────────────────────────────────────
const StudentSignup = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // ── Global Store ──
    const { 
        studentSignupData, 
        setStudentSignupData, 
        clearStudentSignup 
    } = useStore();

    // ── Local State (Initial load from store) ──
    const [firstName,  setFirstName]  = useState(studentSignupData.firstName);
    const [lastName,   setLastName]   = useState(studentSignupData.lastName);
    const [email,      setEmail]      = useState(studentSignupData.email);
    const [university, setUniversity] = useState(studentSignupData.university);
    const [password,   setPassword]   = useState(studentSignupData.password);
    
    const [errors,     setErrors]     = useState({});
    const [loading,    setLoading]    = useState(false);

    // ── Biometric Status (Synchronized with Store) ──
    const faceDone   = studentSignupData.face_done;
    const fingerDone = studentSignupData.finger_done;
    const voiceDone  = studentSignupData.voice_done;

    // ── Sync with Store ──
    useEffect(() => {
        // Sync form data
        setStudentSignupData({ firstName, lastName, email, university, password });
        
        // Sync biometric params from navigation (Face/Voice)
        if (params.face_done === 'true') setStudentSignupData({ face_done: true });
        if (params.voice_done === 'true') setStudentSignupData({ voice_done: true });
        if (params.finger_done === 'true') setStudentSignupData({ finger_done: true });
    }, [firstName, lastName, email, university, password, params.face_done, params.voice_done, params.finger_done]);

    const validate = () => {
        const e = {};
        if (!firstName.trim()) e.firstName = 'First name is required';
        if (!lastName.trim()) e.lastName = 'Last name is required';
        if (!email.trim()) e.email = 'Email is required';
        else if (!email.includes('@')) e.email = 'Email must contain @';
        if (!university.trim()) e.university = 'University name is required';
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
                setStudentSignupData({ finger_done: true });
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
                firstName:  firstName.trim(),
                lastName:   lastName.trim(),
                email:      email.trim().toLowerCase(),
                university: university.trim(),
                password,
                faceRegistered: faceDone,
                voiceRegistered: voiceDone,
                fingerprintVerified: fingerDone,
            };
            const response = await axios.post(`${API_URL}/signup`, signupPayload);
            clearStudentSignup();
            Alert.alert(
                '✅ Account Created!',
                response.data.message || 'Signup successful!',
                [{ text: 'Login Now', onPress: () => router.push('/students/') }]
            );
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

                {/* ── Header ── */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.replace('/')} style={styles.backBtn}>
                        <Text style={styles.backArrow}>←</Text>
                    </Pressable>
                    <View style={styles.headerCenter}>
                        <View style={styles.headerIconBox}>
                            <Text style={{ fontSize: 20 }}>🎓</Text>
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>Kiety Meet</Text>
                            <Text style={styles.headerSub}>Student Registration</Text>
                        </View>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Hero Banner ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.heroBanner}>
                        <Text style={styles.heroTitle}>Create your account</Text>
                        <Text style={styles.heroSub}>
                            Join the academic portal to manage your courses, attendance, and biometric profile.
                        </Text>
                        <Text style={styles.heroBgEmoji}>🏛️</Text>
                    </Animated.View>

                    {/* ── Personal Info ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.section}>

                        {/* First + Last Name */}
                        <View style={styles.row}>
                            <View style={styles.halfField}>
                                <Label text="First Name" />
                                <InputField
                                    icon="👤" placeholder="John"
                                    value={firstName} onChangeText={setFirstName}
                                    error={errors.firstName}
                                />
                            </View>
                            <View style={styles.halfField}>
                                <Label text="Last Name" />
                                <InputField
                                    icon="👤" placeholder="Doe"
                                    value={lastName} onChangeText={setLastName}
                                    error={errors.lastName}
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <Label text="Email" />
                        <InputField
                            icon="✉️" placeholder="student@uni.edu"
                            value={email} onChangeText={setEmail}
                            keyboardType="email-address"
                            error={errors.email}
                        />

                        {/* University */}
                        <Label text="University Name" />
                        <InputField
                            icon="🏛️" placeholder="Fast NUCES"
                            value={university} onChangeText={setUniversity}
                            error={errors.university}
                        />

                        {/* Password */}
                        <Label text="Password" />
                        <InputField
                            icon="🔒" placeholder="Min. 6 characters"
                            value={password} onChangeText={setPassword}
                            secureTextEntry
                            hint="At least 6 characters"
                            error={errors.password}
                        />
                    </Animated.View>

                    {/* ── Biometric Section ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(300)} style={styles.biometricBox}>
                        <Text style={styles.biometricTitle}>VERIFICATION REQUIRED</Text>
                        <View style={styles.biometricRow}>
                            {[
                                { 
                                    icon: '😊', 
                                    label: 'Face', 
                                    done: faceDone, 
                                    route: '/Authentication/', 
                                    params: { role: 'student', mode: 'register', returnTo: '/students/signup' } 
                                },
                                { 
                                    icon: '👆', 
                                    label: 'Finger', 
                                    done: fingerDone, 
                                    route: '/Authentication/fingerprint', 
                                    params: { role: 'student', mode: 'register', returnTo: '/students/signup' }
                                },
                                { 
                                    icon: '🎙️', 
                                    label: 'Voice', 
                                    done: voiceDone, 
                                    route: '/Authentication/voice_recog', 
                                    params: { role: 'student', mode: 'register', returnTo: '/students/signup' }
                                },
                            ].map((item, i) => {
                                return (
                                <React.Fragment key={item.label}>
                                    <Pressable 
                                        style={styles.bioItem}
                                        onPress={() => {
                                            if (item.label === 'Finger') {
                                                handleFingerprint();
                                            } else {
                                                router.push({ pathname: item.route, params: item.params });
                                            }
                                        }}
                                    >
                                        <View style={[styles.bioCircle, item.done && styles.bioCircleDone]}>
                                            <Text style={{ fontSize: 26, opacity: item.done ? 1 : 0.5 }}>{item.icon}</Text>
                                            {item.done && (
                                                <View style={styles.doneCheck}>
                                                    <Text style={styles.doneCheckText}>✓</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.bioLabel, item.done && styles.bioLabelDone]}>{item.label}</Text>
                                    </Pressable>
                                    {i < 2 && <View style={styles.bioLine} />}
                                </React.Fragment>
                            )})}
                        </View>
                        <Text style={styles.biometricNote}>
                            Tap each icon to register your biometrics. All 3 are required.
                        </Text>
                    </Animated.View>

                    {/* ── Submit ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(350)} style={{ paddingHorizontal: 20 }}>
                        <Pressable
                            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color={WHITE} />
                                : <Text style={styles.submitText}>
                                    Complete Signup
                                  </Text>
                            }
                        </Pressable>
                    </Animated.View>

                    {/* ── Login Link ── */}
                    <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.loginLinkRow}>
                        <Text style={styles.loginLinkText}>Already have an account? </Text>
                        <Pressable onPress={() => router.push('/students/')}>
                            <Text style={styles.loginLink}>Login here</Text>
                        </Pressable>
                    </Animated.View>

                    <View style={styles.footer} />
                </ScrollView>
            </Animated.View>
        </KeyboardAvoidingView>
    );
};

export default StudentSignup;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
        backgroundColor: 'rgba(248,246,246,0.95)',
        borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    backArrow: { fontSize: 22, color: MUTED },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerIconBox: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: `${PRIMARY}18`,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
    headerSub: { fontSize: 11, color: MUTED, fontWeight: '500' },
    scroll: { paddingBottom: 40 },
    heroBanner: {
        margin: 20, borderRadius: 16,
        backgroundColor: `${PRIMARY}12`,
        borderWidth: 1, borderColor: `${PRIMARY}20`,
        padding: 24, overflow: 'hidden',
    },
    heroTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
    heroSub: { fontSize: 14, color: MUTED, lineHeight: 20 },
    heroBgEmoji: {
        position: 'absolute', right: -10, bottom: -10,
        fontSize: 80, opacity: 0.08,
    },
    section: { paddingHorizontal: 20, marginBottom: 4 },
    row: { flexDirection: 'row', gap: 12 },
    halfField: { flex: 1 },
    label: { fontSize: 13, fontWeight: '600', color: LABEL, marginBottom: 6 },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: WHITE, borderWidth: 1, borderColor: BORDER,
        borderRadius: 12, paddingHorizontal: 12, height: 50,
    },
    inputWrapperError: { borderColor: ERROR_COLOR },
    inputIcon: { fontSize: 16, marginRight: 8 },
    input: { flex: 1, fontSize: 14, color: '#0F172A' },
    hintText: { fontSize: 11, color: MUTED, marginTop: 4, marginLeft: 2 },
    errorText: { fontSize: 11, color: ERROR_COLOR, marginTop: 4, marginLeft: 2 },
    biometricBox: {
        marginHorizontal: 20, marginTop: 8, marginBottom: 24,
        backgroundColor: `${PRIMARY}08`, borderRadius: 16, padding: 24,
        borderWidth: 1, borderColor: `${PRIMARY}15`,
    },
    biometricTitle: {
        fontSize: 10, fontWeight: '800', letterSpacing: 1.5,
        color: LABEL, textAlign: 'center', marginBottom: 20,
    },
    biometricRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    },
    bioItem: { alignItems: 'center', gap: 8 },
    bioCircle: {
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: BORDER,
    },
    bioCircleDone: {
        borderColor: '#22C55E',
        backgroundColor: '#F0FDF4',
    },
    bioLabel: {
        fontSize: 10, fontWeight: '700', color: MUTED,
        textTransform: 'uppercase', letterSpacing: 1,
    },
    bioLabelDone: {
        color: '#22C55E',
    },
    doneCheck: {
        position: 'absolute', top: -4, right: -4,
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: WHITE,
    },
    doneCheckText: { color: WHITE, fontSize: 10, fontWeight: '900' },
    bioLine: { width: 20, height: 1, backgroundColor: BORDER, marginHorizontal: 4, marginBottom: 20 },
    biometricNote: { fontSize: 10, color: MUTED, textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
    submitBtn: {
        backgroundColor: PRIMARY, paddingVertical: 18,
        borderRadius: 14, alignItems: 'center',
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { color: WHITE, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
    loginLinkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
    loginLinkText: { fontSize: 13, color: MUTED },
    loginLink: { fontSize: 13, fontWeight: '700', color: PRIMARY },
    footer: { marginTop: 32, paddingVertical: 24, backgroundColor: '#F1F5F9' },
});