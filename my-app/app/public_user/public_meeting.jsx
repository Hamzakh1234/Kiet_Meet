// app/public_user/public_meeting.jsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, Pressable, StyleSheet, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
    FadeIn, FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle,
    withRepeat, withTiming,
} from 'react-native-reanimated';

// ── Constants ──────────────────────────────────────────────
const PRIMARY = '#ec5b13';
const DARK    = '#221610';
const WHITE   = '#FFFFFF';
const MUTED   = '#64748B';

// ── Live Timer Hook ────────────────────────────────────────
const useLiveTimer = () => {
    const [seconds, setSeconds] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(interval);
    }, []);
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
};

// ── Control Button ─────────────────────────────────────────
const CtrlBtn = ({ icon, label, active, onPress }) => (
    <Pressable style={styles.ctrlItem} onPress={onPress}>
        <View style={[styles.ctrlCircle, active && styles.ctrlCircleActive]}>
            <Text style={styles.ctrlIcon}>{icon}</Text>
        </View>
        <Text style={[styles.ctrlLabel, active && styles.ctrlLabelActive]}>{label}</Text>
    </Pressable>
);

// ── Main Screen ────────────────────────────────────────────
const PublicMeeting = () => {
    const router = useRouter();
    const timer  = useLiveTimer();

    const [micOn,  setMicOn]  = useState(false);
    const [camOn,  setCamOn]  = useState(true);
    const [handUp, setHandUp] = useState(false);

    // Pulsing dot
    const pulseOpacity = useSharedValue(1);
    useEffect(() => {
        pulseOpacity.value = withRepeat(withTiming(0.2, { duration: 800 }), -1, true);
    }, []);
    const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

    const goBack = () => router.replace('/public_user/');

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={DARK} />

            {/* ── VIDEO BG ── */}
            <View style={styles.videoBg}>
                <View style={styles.videoOverlay} />

                {/* ── HEADER ── */}
                <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                    <Pressable style={styles.headerBtn} onPress={goBack}>
                        <Text style={styles.headerBtnIcon}>←</Text>
                    </Pressable>

                    <View style={styles.headerTitle}>
                        <Text style={styles.headerTitleText}>Kiety Meet</Text>
                        <View style={styles.liveRow}>
                            <Animated.View style={[styles.liveDot, pulseStyle]} />
                            <Text style={styles.liveText}>LIVE {timer}</Text>
                        </View>
                    </View>

                    <View style={styles.headerRight}>
                        <Pressable style={styles.headerBtn}>
                            <Text style={styles.headerBtnIcon}>👥</Text>
                        </Pressable>
                        <Pressable style={styles.headerBtn}>
                            <Text style={styles.headerBtnIcon}>⚙️</Text>
                        </Pressable>
                    </View>
                </Animated.View>

                {/* ── PiP ── */}
                <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.pip}>
                    <View style={styles.pipVideo}>
                        <Text style={styles.pipEmoji}>🧑‍💻</Text>
                    </View>
                    <View style={styles.pipLabel}>
                        <Text style={styles.pipLabelText}>🎤 You</Text>
                    </View>
                </Animated.View>

                {/* ── NAME TAG ── */}
                <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.nameTag}>
                    <View style={[styles.nameDot, { backgroundColor: PRIMARY }]} />
                    <Text style={styles.nameTagText}>Prof. Alistair Kiety</Text>
                </Animated.View>

                {/* ── TRANSCRIPT ── */}
                <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.transcript}>
                    <Text style={styles.transcriptText}>
                        "...and that's why the Big O complexity of a balanced binary search tree is always logarithmic."
                    </Text>
                </Animated.View>

                {/* ── REACTIONS ── */}
                <Animated.View entering={FadeInUp.duration(500).delay(500)} style={styles.reactionsBar}>
                    {['👏', '🔥', '❤️', '💡', '💯'].map((emoji) => (
                        <Pressable key={emoji} style={styles.reactionBtn}>
                            <Text style={styles.reactionEmoji}>{emoji}</Text>
                        </Pressable>
                    ))}
                    <View style={styles.reactionDivider} />
                    <Pressable style={styles.reactionBtn}>
                        <Text style={styles.reactionEmoji}>➕</Text>
                    </Pressable>
                </Animated.View>
            </View>

            {/* ── BOTTOM CONTROLS ── */}
            <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.controls}>
                <View style={styles.ctrlRow}>
                    <CtrlBtn icon={micOn ? '🎤' : '🔇'} label="Mute"  onPress={() => setMicOn(!micOn)} />
                    <CtrlBtn icon={camOn ? '📹' : '📷'} label="Video" active={camOn} onPress={() => setCamOn(!camOn)} />
                    <CtrlBtn icon="✋" label="Raise" active={handUp} onPress={() => setHandUp(!handUp)} />
                    <CtrlBtn icon="💬" label="Chat" />
                    <CtrlBtn icon="•••" label="More" />
                </View>

                <View style={styles.actionRow}>
                    <Pressable style={styles.notesBtn}>
                        <Text style={styles.notesBtnIcon}>📝</Text>
                        <Text style={styles.notesBtnText}>Shared Notes</Text>
                    </Pressable>
                    <Pressable style={styles.endCallBtn} onPress={goBack}>
                        <Text style={styles.endCallIcon}>📵</Text>
                    </Pressable>
                </View>

                <View style={styles.homeIndicator} />
            </Animated.View>
        </View>
    );
};

export default PublicMeeting;

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DARK },

    videoBg: { flex: 1, backgroundColor: '#1a2535', position: 'relative' },
    videoOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 1,
    },

    header: {
        position: 'absolute', top: 0, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
        zIndex: 10,
    },
    headerBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    headerBtnIcon: { fontSize: 18 },
    headerTitle: { alignItems: 'center' },
    headerTitleText: { fontSize: 14, fontWeight: '800', color: WHITE },
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444' },
    liveText: { fontSize: 9, fontWeight: '800', color: '#CBD5E1', letterSpacing: 1.5 },
    headerRight: { flexDirection: 'row', gap: 8 },

    pip: {
        position: 'absolute', top: 110, right: 16,
        width: 90, aspectRatio: 3 / 4,
        borderRadius: 14, overflow: 'hidden',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
        zIndex: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
    },
    pipVideo: {
        flex: 1, backgroundColor: '#2d3748',
        alignItems: 'center', justifyContent: 'center',
    },
    pipEmoji: { fontSize: 36 },
    pipLabel: {
        position: 'absolute', bottom: 6, left: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    },
    pipLabelText: { fontSize: 8, color: WHITE, fontWeight: '700' },

    nameTag: {
        position: 'absolute', bottom: 180, left: 16,
        flexDirection: 'row', alignItems: 'center', gap: 7,
        backgroundColor: 'rgba(34,22,16,0.82)',
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
        borderWidth: 1, borderColor: `${PRIMARY}40`, zIndex: 10,
    },
    nameDot: { width: 8, height: 8, borderRadius: 4 },
    nameTagText: { fontSize: 12, fontWeight: '700', color: WHITE },

    transcript: {
        position: 'absolute', bottom: 120, left: 16, right: 16,
        backgroundColor: 'rgba(34,22,16,0.82)',
        borderLeftWidth: 4, borderLeftColor: PRIMARY,
        borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: `${PRIMARY}30`, zIndex: 10,
    },
    transcriptText: {
        fontSize: 12, color: 'rgba(255,255,255,0.9)',
        lineHeight: 18, fontStyle: 'italic',
    },

    reactionsBar: {
        position: 'absolute', bottom: 58, alignSelf: 'center',
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.75)',
        paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 50, zIndex: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
        gap: 4,
    },
    reactionBtn: { padding: 4 },
    reactionEmoji: { fontSize: 20 },
    reactionDivider: { width: 1, height: 18, backgroundColor: '#CBD5E1', marginHorizontal: 4 },

    controls: {
        backgroundColor: WHITE,
        paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.08, shadowRadius: 20, elevation: 10,
    },
    ctrlRow: {
        flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18,
    },
    ctrlItem: { alignItems: 'center', gap: 5 },
    ctrlCircle: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: '#F1F5F9',
        alignItems: 'center', justifyContent: 'center',
    },
    ctrlCircleActive: {
        backgroundColor: PRIMARY,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
    },
    ctrlIcon: { fontSize: 20 },
    ctrlLabel: {
        fontSize: 9, fontWeight: '800',
        color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8,
    },
    ctrlLabelActive: { color: PRIMARY },

    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    notesBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        backgroundColor: '#F1F5F9', paddingVertical: 14,
        borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0',
    },
    notesBtnIcon: { fontSize: 16 },
    notesBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },
    endCallBtn: {
        width: 56, height: 52, backgroundColor: '#FEE2E2',
        borderRadius: 14, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#FECACA',
    },
    endCallIcon: { fontSize: 22 },

    homeIndicator: {
        width: 120, height: 4, borderRadius: 2,
        backgroundColor: '#E2E8F0', alignSelf: 'center', marginTop: 4,
    },
});