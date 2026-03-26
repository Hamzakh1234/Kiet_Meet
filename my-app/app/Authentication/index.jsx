// app/Authentication/index.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    Dimensions, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
    FadeIn, FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle,
    withRepeat, withTiming, withSequence,
    Easing,
} from 'react-native-reanimated';
import axios from 'axios';
import { BASE_URL, PYTHON_SERVICE_URL } from '../../config';

const { width, height } = Dimensions.get('window');

// ── Constants ──────────────────────────────────────────────
const PRIMARY      = '#ec5b13';
const BG           = '#0F0D0C';
const WHITE        = '#FFFFFF';
const MUTED        = '#94A3B8';
const SUCCESS      = '#22C55E';
const OVERLAY_COLOR = 'rgba(15,13,12,0.55)';

// ── Main Screen ────────────────────────────────────────────
export default function FaceRegistration() {
    const router = useRouter();
    const { role, mode, user_id, returnTo } = useLocalSearchParams(); 

    const [permission,    requestPermission] = useCameraPermissions();
    const [captured,      setCaptured]       = useState(false);
    const [photoUri,      setPhotoUri]       = useState(null);
    const [loading,       setLoading]        = useState(false);
    const [scanStatus,    setScanStatus]     = useState('Position your face in the frame');
    const [faceStatus,    setFaceStatus]     = useState('none'); // none, too_far, too_close, reposition, perfect
    
    const cameraRef = useRef(null);

    // ── Scanning line animation ────────────────────────────
    const scanY = useSharedValue(-10);
    const scanOpacity = useSharedValue(0);

    useEffect(() => {
        scanY.value = withRepeat(
            withSequence(
                withTiming(-10, { duration: 0 }),
                withTiming(height * 0.6, { duration: 3000, easing: Easing.linear }),
            ),
            -1,
            false
        );
        scanOpacity.value = withRepeat(
            withSequence(
                withTiming(0, { duration: 0 }),
                withTiming(0.8, { duration: 300 }),
                withTiming(0.8, { duration: 2400 }),
                withTiming(0, { duration: 300 }),
            ),
            -1,
            false
        );
    }, []);

    const scanLineStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: scanY.value }],
        opacity: scanOpacity.value,
    }));

    // ── Corner bracket pulse ───────────────────────────────
    const bracketOpacity = useSharedValue(1);
    useEffect(() => {
        bracketOpacity.value = withRepeat(
            withSequence(
                withTiming(0.4, { duration: 800 }),
                withTiming(1, { duration: 800 }),
            ),
            -1,
            true
        );
    }, []);
    const bracketStyle = useAnimatedStyle(() => ({ opacity: bracketOpacity.value }));

    // ── Simulated Alignment Guidance ───────────────────────
    useEffect(() => {
        if (!captured && !loading) {
            setScanStatus('Scanning for face...');
            setFaceStatus('none');
            
            const timer = setTimeout(() => {
                setFaceStatus('perfect');
                setScanStatus('✅ Face Aligned! Capture Now');
            }, 2500); // Give user 2.5s to position before "aligning"
            
            return () => clearTimeout(timer);
        }
    }, [captured, loading]);

    // ── Capture photo ──────────────────────────────────────
    const handleCapture = async () => {
        if (!cameraRef.current || loading || captured) return;
        try {
            setLoading(true);
            setScanStatus('Capturing...');
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                base64: true,
            });
            setPhotoUri(photo.uri);
            setCaptured(true);
            setScanStatus('Face captured ✓');
        } catch (e) {
            Alert.alert('Error', 'Failed to capture. Try again.');
            setFaceStatus('none');
            setScanStatus('Position your face in the frame');
        } finally {
            setLoading(false);
        }
    };

    // ── Submit ─────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!photoUri) {
            Alert.alert('Error', 'Please capture your face first');
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('face_image', {
                uri: photoUri,
                type: 'image/jpeg',
                name: 'face.jpg',
            });
            formData.append('role', role || 'student');
            formData.append('mode', mode || 'register');
            formData.append('user_id', user_id || 'temp_user');

            const endpoint = mode === 'verify'
                ? `${PYTHON_SERVICE_URL}/face/verify`
                : `${PYTHON_SERVICE_URL}/face/register`;

            const response = await axios.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (mode === 'verify') {
                if (response.data.verified) {
                    Alert.alert('✅ Verified', 'Identity confirmed successfully!', [
                        { 
                            text: 'OK', 
                            onPress: () => {
                                if (returnTo) {
                                    router.push({
                                        pathname: returnTo,
                                        params: { face_verified: 'true' }
                                    });
                                } else {
                                    router.back();
                                }
                            }
                        }
                    ]);
                } else {
                    Alert.alert('❌ Failed', 'Face not recognized. Try again.');
                    handleRetake();
                }
            } else {
                // Registration success 
                Alert.alert('✅ Enrolled', 'Face registered successfully!', [
                    {
                        text: 'Continue',
                        onPress: () => {
                            // If returnTo was provided (back to signup), go there. 
                            // Otherwise follow default flow (to fingerprint)
                            if (returnTo) {
                                router.push({
                                    pathname: returnTo,
                                    params: { face_done: 'true' }
                                });
                            } else {
                                router.push({
                                    pathname: '/Authentication/fingerprint',
                                    params: { role, mode, user_id }
                                });
                            }
                        }
                    }
                ]);
            }
        } catch (e) {
            Alert.alert('Error', 'Server connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Retake ─────────────────────────────────────────────
    const handleRetake = () => {
        setCaptured(false);
        setPhotoUri(null);
        setFaceStatus('none');
        setScanStatus('Position your face in the frame');
    };

    if (!permission) return <View style={styles.container} />;

    if (!permission.granted) {
        return (
            <View style={styles.permissionBox}>
                <Text style={styles.permissionEmoji}>📷</Text>
                <Text style={styles.permissionTitle}>Camera Permission</Text>
                <Text style={styles.permissionSub}>Camera access is needed for face registration</Text>
                <Pressable style={styles.permissionBtn} onPress={requestPermission}>
                    <Text style={styles.permissionBtnText}>Allow Camera</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={BG} />

            {/* ── CAMERA ── */}
            {!captured ? (
                <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    facing="front"
                />
            ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a1a1a' }]}>
                    <View style={styles.capturedBox}>
                        <Text style={styles.capturedEmoji}>✅</Text>
                        <Text style={styles.capturedText}>Face Captured</Text>
                    </View>
                </View>
            )}

            {/* ── DARK OVERLAY ── */}
            <View style={styles.overlay} />

            {/* ── SCANNING LINE ── */}
            {!captured && (
                <Animated.View style={[styles.scanLine, scanLineStyle]} />
            )}

            {/* ── HEADER ── */}
            <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                <Pressable 
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backBtnText}>✕</Text>
                </Pressable>
                <Text style={styles.headerLabel}>BIOMETRIC SECURITY</Text>
                <View style={{ width: 40 }} />
            </Animated.View>

            {/* ── TITLE ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.titleBox}>
                <Text style={styles.title}>
                    {mode === 'verify' ? 'Face Verification' : 'Face Registration'}
                </Text>
                <Text style={styles.subtitle}>
                    {mode === 'verify'
                        ? 'Verify your identity to continue'
                        : 'Register your face for secure login'
                    }
                </Text>
            </Animated.View>

            {/* ── FACE OVERLAY FRAME ── */}
            <Animated.View style={[styles.frameContainer, bracketStyle]}>
                {/* Corner brackets */}
                <View style={[
                    styles.corner, styles.cornerTL, 
                    faceStatus === 'perfect' && { borderColor: SUCCESS }
                ]} />
                <View style={[
                    styles.corner, styles.cornerTR,
                    faceStatus === 'perfect' && { borderColor: SUCCESS }
                ]} />
                <View style={[
                    styles.corner, styles.cornerBL,
                    faceStatus === 'perfect' && { borderColor: SUCCESS }
                ]} />
                <View style={[
                    styles.corner, styles.cornerBR,
                    faceStatus === 'perfect' && { borderColor: SUCCESS }
                ]} />

                {/* Center oval guide */}
                <View style={[
                    styles.ovalGuide,
                    faceStatus === 'perfect' && { borderColor: SUCCESS, borderStyle: 'solid', borderWidth: 2 }
                ]} />
            </Animated.View>

            {/* ── STATUS BADGE ── */}
            <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.statusBadge}>
                <View style={[
                    styles.statusDot,
                    { backgroundColor: captured || faceStatus === 'perfect' ? SUCCESS : PRIMARY }
                ]} />
                <Text style={styles.statusText}>{scanStatus}</Text>
            </Animated.View>

            {/* ── BOTTOM CONTROLS ── */}
            <Animated.View entering={FadeInUp.duration(500).delay(200)} style={styles.bottomControls}>

                {!captured ? (
                    <>
                        <Text style={styles.hint}>
                            {faceStatus === 'perfect' 
                             ? 'Face Aligned! Tap the button to capture.' 
                             : 'Position your face within the frame and wait for alignment.'}
                        </Text>

                        <Pressable
                            style={[styles.captureBtn, (loading || faceStatus === 'none') && { opacity: 0.6 }]}
                            onPress={handleCapture}
                            disabled={loading || faceStatus === 'none'}
                        >
                            {loading ? (
                                <ActivityIndicator color={PRIMARY} />
                            ) : (
                                <>
                                    <Text style={styles.captureBtnIcon}>📷</Text>
                                    <Text style={styles.captureBtnText}>Manual Capture</Text>
                                </>
                            )}
                        </Pressable>
                    </>
                ) : (
                    <>
                        <Pressable style={styles.retakeBtn} onPress={handleRetake}>
                            <Text style={styles.retakeBtnText}>↺  Retake Photo</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={WHITE} />
                            ) : (
                                <Text style={styles.submitBtnText}>
                                    {mode === 'verify' ? 'Submit Verification' : 'Done'}
                                </Text>
                            )}
                        </Pressable>
                    </>
                )}
            </Animated.View>

        </View>
    );
}

// ── Styles ─────────────────────────────────────────────────
const FRAME_SIZE  = width * 0.72;
const FRAME_TOP   = height * 0.22;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: OVERLAY_COLOR,
    },

    scanLine: {
        position: 'absolute',
        left: (width - FRAME_SIZE) / 2,
        width: FRAME_SIZE,
        height: 2,
        backgroundColor: 'transparent',
        borderRadius: 1,
        // gradient effect via shadow
        shadowColor: WHITE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 20,
        // actual line color
        borderTopWidth: 1.5,
        borderTopColor: 'rgba(255,255,255,0.7)',
    },

    header: {
        position: 'absolute', top: 52, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20, zIndex: 30,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    backBtnText: { fontSize: 18, color: WHITE, fontWeight: '800' },
    headerLabel: {
        fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.6)',
        letterSpacing: 2, textTransform: 'uppercase',
    },

    titleBox: {
        position: 'absolute', top: 110, left: 0, right: 0,
        alignItems: 'center', zIndex: 30, paddingHorizontal: 32,
    },
    title: { fontSize: 28, fontWeight: '900', color: WHITE, marginBottom: 6, textAlign: 'center' },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontWeight: '500' },

    // Frame
    frameContainer: {
        position: 'absolute',
        top: FRAME_TOP,
        left: (width - FRAME_SIZE) / 2,
        width: FRAME_SIZE,
        height: FRAME_SIZE * 1.2,
        zIndex: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    corner: {
        position: 'absolute',
        width: 36, height: 36,
        borderColor: WHITE,
        borderWidth: 0,
    },
    cornerTL: {
        top: 0, left: 0,
        borderTopWidth: 3, borderLeftWidth: 3,
        borderTopLeftRadius: 20,
    },
    cornerTR: {
        top: 0, right: 0,
        borderTopWidth: 3, borderRightWidth: 3,
        borderTopRightRadius: 20,
    },
    cornerBL: {
        bottom: 0, left: 0,
        borderBottomWidth: 3, borderLeftWidth: 3,
        borderBottomLeftRadius: 20,
    },
    cornerBR: {
        bottom: 0, right: 0,
        borderBottomWidth: 3, borderRightWidth: 3,
        borderBottomRightRadius: 20,
    },
    ovalGuide: {
        width: FRAME_SIZE * 0.72,
        height: FRAME_SIZE * 0.88,
        borderRadius: FRAME_SIZE * 0.5,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
        borderStyle: 'dashed',
    },

    // Status badge
    statusBadge: {
        position: 'absolute',
        bottom: height * 0.27,
        alignSelf: 'center',
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 30, zIndex: 30,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 11, fontWeight: '800', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: 0.8 },

    // Bottom controls
    bottomControls: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(15,13,12,0.94)',
        paddingHorizontal: 24, paddingTop: 24, paddingBottom: 44,
        borderTopLeftRadius: 36, borderTopRightRadius: 36,
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
        zIndex: 30, gap: 14,
    },
    hint: {
        textAlign: 'center', color: 'rgba(255,255,255,0.4)',
        fontSize: 12, fontWeight: '600', marginBottom: 6,
    },
    captureBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, height: 60,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 18, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    captureBtnIcon: { fontSize: 22 },
    captureBtnText: { fontSize: 16, fontWeight: '700', color: WHITE },

    retakeBtn: {
        height: 54, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    retakeBtnText: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },

    submitBtn: {
        height: 62, alignItems: 'center', justifyContent: 'center',
        backgroundColor: PRIMARY, borderRadius: 20,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45, shadowRadius: 18, elevation: 12,
    },
    submitBtnText: { fontSize: 17, fontWeight: '900', color: WHITE, letterSpacing: 0.5 },

    // Captured state
    capturedBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    capturedEmoji: { fontSize: 72, marginBottom: 20 },
    capturedText: { fontSize: 20, fontWeight: '800', color: SUCCESS },

    // Permission
    permissionBox: {
        flex: 1, backgroundColor: BG,
        alignItems: 'center', justifyContent: 'center', padding: 32,
    },
    permissionEmoji: { fontSize: 64, marginBottom: 24 },
    permissionTitle: { fontSize: 24, fontWeight: '800', color: WHITE, marginBottom: 12 },
    permissionSub: { fontSize: 15, color: MUTED, textAlign: 'center', marginBottom: 36, lineHeight: 22 },
    permissionBtn: {
        backgroundColor: PRIMARY, borderRadius: 16,
        paddingHorizontal: 40, paddingVertical: 16,
    },
    permissionBtnText: { color: WHITE, fontWeight: '800', fontSize: 16 },
});