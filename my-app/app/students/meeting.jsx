// app/students/meeting.jsx
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View, Text, Pressable, StyleSheet,
    StatusBar, Modal, ScrollView, ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { BASE_URL, LIVEKIT_URL } from '../../config';

import Animated, {
    FadeIn, FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle, withRepeat, withTiming,
} from 'react-native-reanimated';
import {
    LiveKitRoom,
    VideoTrack,
    useLocalParticipant,
    useParticipants,
    useTracks,
    useRoomContext,
} from '@livekit/react-native';
import { Track } from 'livekit-client';
import useStore from '../../store/useStore';

// ── Constants ──────────────────────────────────────────────
const PRIMARY     = '#ec5b13';
const DARK        = '#221610';
const WHITE       = '#FFFFFF';
const MUTED       = '#64748B';
const DANGER      = '#EF4444';

const TOKEN_API   = `${BASE_URL}/livekit/token`;


// ── Live Timer ─────────────────────────────────────────────
const useLiveTimer = () => {
    const [seconds, setSeconds] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setSeconds(s => s + 1), 1000);
        return () => clearInterval(interval);
    }, []);
    return `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
};

// ── Participant Tile (remote) ──────────────────────────────
const RemoteTile = ({ participant }) => {
    const tracks = useTracks([{ source: Track.Source.Camera }], { participant });
    const videoTrack = tracks[0];

    return (
        <View style={[styles.pip, participant.isSpeaking && styles.pipSpeaking]}>
            {videoTrack ? (
                <VideoTrack trackRef={videoTrack} style={StyleSheet.absoluteFill} />
            ) : (
                <View style={styles.pipVideo}>
                    <Text style={styles.pipAvatarText}>
                        {participant.identity?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                </View>
            )}
            <View style={styles.pipLabel}>
                <Text style={styles.pipLabelText}>{participant.identity}</Text>
            </View>
        </View>
    );
};

// ── Inner Meeting (needs LiveKitRoom context) ──────────────
function MeetingInner({ className, classId, onEnd, onBack }) {
    const router             = useRouter();
    const timer              = useLiveTimer();
    const { localParticipant } = useLocalParticipant();
    const participants         = useParticipants();
    const room                 = useRoomContext();

    const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled: isSharing } = localParticipant;
    const [handUp,           setHandUp]            = useState(false);
    const [showParticipants, setShowParticipants]  = useState(false);

    // Local video
    const localVideoTracks = useTracks(
        [{ source: Track.Source.Camera }],
        { participant: localParticipant }
    );
    const localVideoTrack = localVideoTracks[0];

    // Remote participants (teacher + other students)
    const remoteParticipants = participants.filter(
        (p) => p.identity !== localParticipant?.identity
    );

    // Pulsing dot for header
    const pulseOpacity = useSharedValue(1);
    useEffect(() => {
        pulseOpacity.value = withRepeat(withTiming(0.2, { duration: 800 }), -1, true);
    }, []);
    const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

    // Sharing pulse for button
    const sharingPulse = useSharedValue(1);
    useEffect(() => {
        if (isSharing) {
            sharingPulse.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);
        } else {
            sharingPulse.value = 1;
        }
    }, [isSharing]);
    const buttonPulseStyle = useAnimatedStyle(() => ({ opacity: sharingPulse.value }));

    useEffect(() => {
        if (room && room.state === 'connected') {
            const enableMedia = async () => {
                try {
                    console.log('Room connected, enabling local tracks...');
                    await localParticipant.setMicrophoneEnabled(true);
                    await localParticipant.setCameraEnabled(true);
                } catch (e) {
                    console.error('Failed to enable initial tracks:', e);
                }
            };
            enableMedia();
        }
    }, [room?.state]);

    const toggleMic = async () => {
        try {
            await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
        } catch (e) {
            console.error('Failed to toggle mic:', e);
        }
    };

    const toggleCamera = async () => {
        try {
            await localParticipant.setCameraEnabled(!isCameraEnabled);
        } catch (e) {
            console.error('Failed to toggle camera:', e);
        }
    };

    const toggleScreenShare = async () => {
        try {
            const currentlySharing = localParticipant.isScreenShareEnabled;

            // Exclusive Sharing Logic: Check if anyone else is already sharing
            const otherSharer = participants.find(p => p.isScreenShareEnabled && p.identity !== localParticipant.identity);
            
            if (!currentlySharing && otherSharer) {
                Alert.alert(
                    "Cannot Share Screen",
                    `${otherSharer.identity} is already sharing their screen. Only one person can share at a time.`
                );
                return;
            }

            await localParticipant.setScreenShareEnabled(!currentlySharing);
        } catch (e) {
            console.error('Sharing error:', e);
            Alert.alert("Permission Error", "Could not start screen sharing. Please check your device permissions.");
        }
    };

    // Find teacher (first remote or any named "Teacher")
    const teacher = remoteParticipants[0];

    // Teacher's video track
    const teacherVideoTracks = useTracks(
        [{ source: Track.Source.Camera }],
        { participant: teacher }
    );
    const teacherVideoTrack = teacher ? teacherVideoTracks[0] : null;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={DARK} />

            {/* ── STOP SHARING BANNER (Step 2) ── */}
            {isSharing && (
                <SafeAreaView edges={['top']} style={{ backgroundColor: PRIMARY }}>
                    <Animated.View entering={FadeInUp.duration(300)} style={styles.stopSharingBar}>
                        <View style={styles.stopSharingContent}>
                            <Text style={styles.stopSharingIcon}>🖥️</Text>
                            <Text style={styles.stopSharingText}>You are sharing your screen</Text>
                        </View>
                        <Pressable style={styles.stopSharingBtn} onPress={toggleScreenShare}>
                            <Text style={styles.stopSharingBtnText}>Stop Presenting</Text>
                        </Pressable>
                    </Animated.View>
                </SafeAreaView>
            )}

            {/* ── PARTICIPANTS MODAL ── */}
            <Modal visible={showParticipants} transparent animationType="slide" onRequestClose={() => setShowParticipants(false)}>
                <View style={styles.modalOverlay}>
                    <Animated.View entering={FadeInUp} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Participants ({participants.length})</Text>
                            <Pressable onPress={() => setShowParticipants(false)} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>✕</Text>
                            </Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {participants.map((p) => {
                                const isLocal = p.identity === localParticipant?.identity;
                                return (
                                    <View key={p.identity} style={styles.participantItem}>
                                        <View style={styles.pAvatar}>
                                            <Text style={styles.pAvatarInitial}>
                                                {p.identity?.charAt(0)?.toUpperCase() || '?'}
                                            </Text>
                                        </View>
                                        <View style={styles.pInfo}>
                                            <Text style={styles.pName}>
                                                {p.identity}{isLocal ? ' (You)' : ''}
                                            </Text>
                                            {remoteParticipants.indexOf(p) === 0 && !isLocal && (
                                                <View style={styles.pBadge}>
                                                    <Text style={styles.pBadgeText}>HOST</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={{ fontSize: 14 }}>
                                            {p.isMicrophoneEnabled ? '🎙️' : '🔇'}
                                        </Text>
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>

            {/* ── MAIN VIDEO BG (Teacher feed) ── */}
            <View style={styles.videoBg}>
                <View style={styles.videoOverlay} />

                {teacher && teacherVideoTrack ? (
                    <VideoTrack trackRef={teacherVideoTrack} style={StyleSheet.absoluteFill} />
                ) : (
                    <View style={styles.noTeacherBox}>
                        <View style={styles.noTeacherAvatar}>
                            <Text style={styles.noTeacherInitial}>
                                {teacher?.identity?.charAt(0)?.toUpperCase() || '👨‍🏫'}
                            </Text>
                        </View>
                        <Text style={styles.noTeacherTxt}>
                            {teacher ? teacher.identity : 'Waiting for teacher...'}
                        </Text>
                    </View>
                )}

                {/* ── HEADER ── */}
                <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
                    <Pressable style={styles.headerBtn} onPress={onBack}>
                        <Text style={styles.headerBtnIcon}>←</Text>
                    </Pressable>
                    <View style={styles.headerTitle}>
                        <Text style={styles.headerTitleText}>{className || 'Classroom'}</Text>
                        <View style={styles.liveRow}>
                            <Animated.View style={[styles.liveDot, pulseStyle]} />
                            <Text style={styles.liveText}>LIVE {timer}</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight}>
                        {/* UI Cleanup: Redundant icons removed */}
                    </View>
                </Animated.View>

                {/* ── LOCAL PiP ── */}
                <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.pip}>
                    {localVideoTrack && isCameraEnabled ? (
                        <VideoTrack trackRef={localVideoTrack} style={StyleSheet.absoluteFill} mirror />
                    ) : (
                        <View style={styles.pipVideo}>
                            <Text style={styles.pipAvatarText}>
                                {localParticipant?.identity?.charAt(0)?.toUpperCase() || 'S'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.pipLabel}>
                        <Text style={styles.pipLabelText}>You</Text>
                    </View>
                </Animated.View>

                {/* ── REMOTE PiPs Scroll ── */}
                {remoteParticipants.length > 1 && (
                    <ScrollView horizontal style={styles.remoteList} contentContainerStyle={{ gap: 10 }} showsHorizontalScrollIndicator={false}>
                        {remoteParticipants.slice(1).map(p => (
                            <RemoteTile key={p.identity} participant={p} />
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* ── CONTROLS ── */}
            <View style={styles.controls}>
                <View style={styles.ctrlRow}>
                    <Pressable style={styles.ctrlItem} onPress={toggleMic}>
                        <View style={[styles.ctrlCircle, isMicrophoneEnabled && styles.ctrlCircleActive]}>
                            <Text style={styles.ctrlIcon}>{isMicrophoneEnabled ? '🎙️' : '🔇'}</Text>
                        </View>
                        <Text style={styles.ctrlLabel}>{isMicrophoneEnabled ? 'Mute' : 'Unmute'}</Text>
                    </Pressable>

                    <Pressable style={styles.ctrlItem} onPress={toggleCamera}>
                        <View style={[styles.ctrlCircle, isCameraEnabled && styles.ctrlCircleActive]}>
                            <Text style={styles.ctrlIcon}>{isCameraEnabled ? '📹' : '📷'}</Text>
                        </View>
                        <Text style={styles.ctrlLabel}>Video</Text>
                    </Pressable>

                    <Pressable style={styles.endBtn} onPress={onEnd}>
                        <Text style={{ fontSize: 28, transform: [{ rotate: '135deg' }] }}>📞</Text>
                    </Pressable>

                    <Pressable style={styles.ctrlItem} onPress={() => setShowParticipants(true)}>
                        <View style={styles.ctrlCircle}>
                            <Text style={styles.ctrlIcon}>👥</Text>
                        </View>
                        <Text style={styles.ctrlLabel}>People</Text>
                    </Pressable>

                    <Pressable style={styles.ctrlItem} onPress={toggleScreenShare}>
                        <View style={[styles.ctrlCircle, isSharing && styles.ctrlCircleActive]}>
                            <Text style={styles.ctrlIcon}>🖥️</Text>
                            {isSharing && (
                                <Animated.View style={[styles.pulseDotIcon, buttonPulseStyle]} />
                            )}
                        </View>
                        <Text style={[styles.ctrlLabel, isSharing && { color: PRIMARY, fontWeight: '800' }]}>
                            {isSharing ? 'Sharing' : 'Share'}
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.actionRow}>
                    <Pressable style={[styles.actionBtn, handUp && styles.actionBtnActive]} onPress={() => setHandUp(!handUp)}>
                        <Text style={styles.actionBtnIcon}>✋</Text>
                        <Text style={[styles.actionBtnText, handUp && styles.actionBtnTextActive]}>Raise Hand</Text>
                    </Pressable>
                    <Pressable style={styles.actionBtn}>
                        <Text style={styles.actionBtnIcon}>💬</Text>
                        <Text style={styles.actionBtnText}>Chat</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

// ── Main Export ────────────────────────────────────────────
export default function Meeting() {
    const router = useRouter();
    const { classId, className, classCode } = useLocalSearchParams();
    const user = useStore((state) => state.user);

    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (classId) fetchToken();
    }, [classId]);

    const fetchToken = async () => {
        try {
            const response = await axios.post(TOKEN_API, {
                roomName: classCode,
                participantName: user?.fullName || `Student_${Math.floor(Math.random()*1000)}`,
            });
            setToken(response.data.token);
        } catch (e) {
            console.error('Token error:', e);
            setError('Connection failed. Please retry.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => router.back();
    const handleEnd = () => router.replace('/students/students_classes');

    if (loading) return (
        <View style={styles.centered}>
            <ActivityIndicator color={PRIMARY} size="large" />
            <Text style={styles.loadingTxt}>Entering Classroom...</Text>
        </View>
    );

    if (error) return (
        <View style={styles.centered}>
            <Text style={styles.errorTxt}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => { setLoading(true); setError(null); fetchToken(); }}>
                <Text style={styles.retryTxt}>Retry</Text>
            </Pressable>
        </View>
    );

    return (
        <LiveKitRoom
            serverUrl={LIVEKIT_URL}
            token={token}
            connect={true}
            audio={false}
            video={false}
            connectOptions={{ autoSubscribe: true }}
        >
            <MeetingInner
                className={className}
                classId={classId}
                onEnd={handleEnd}
                onBack={handleBack}
            />
        </LiveKitRoom>
    );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DARK },
    centered : { flex: 1, backgroundColor: DARK, alignItems: 'center', justifyContent: 'center', gap: 16 },
    loadingTxt: { color: WHITE, fontSize: 14, fontWeight: '600' },
    errorTxt: { color: DANGER, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
    retryBtn: { backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    retryTxt: { color: WHITE, fontWeight: 'bold' },

    videoBg: { flex: 1, backgroundColor: '#1a1a1a' },
    videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },

    noTeacherBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
    noTeacherAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center' },
    noTeacherInitial: { fontSize: 40, color: WHITE, fontWeight: 'bold' },
    noTeacherTxt: { color: WHITE, fontSize: 16, fontWeight: '600' },

    header: {
        position: 'absolute', top: 50, left: 20, right: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 10,
    },
    headerBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
    headerBtnIcon: { color: WHITE, fontSize: 20 },
    headerTitle: { alignItems: 'center' },
    headerTitleText: { color: WHITE, fontSize: 16, fontWeight: '800' },
    liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: DANGER },
    liveText: { color: WHITE, fontSize: 11, fontWeight: '700' },
    headerRight: { width: 88, flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },

    pip: {
        position: 'absolute', bottom: 100, right: 20,
        width: 100, height: 150, borderRadius: 12,
        backgroundColor: '#333', overflow: 'hidden',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
        zIndex: 20,
    },
    pipVideo: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#444' },
    pipAvatarText: { color: WHITE, fontSize: 24, fontWeight: 'bold' },
    pipLabel: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    pipLabelText: { color: WHITE, fontSize: 10, fontWeight: '600' },
    pipSpeaking: { borderColor: PRIMARY },

    remoteList: { position: 'absolute', bottom: 100, left: 20, right: 130 },

    controls: {
        backgroundColor: WHITE,
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        paddingTop: 24, paddingBottom: 40,
    },
    ctrlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', marginBottom: 24 },
    ctrlItem: { alignItems: 'center', gap: 8 },
    ctrlCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    ctrlCircleActive: { backgroundColor: PRIMARY },
    ctrlIcon: { fontSize: 22 },
    ctrlLabel: { fontSize: 11, fontWeight: '600', color: MUTED },
    endBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: DANGER, alignItems: 'center', justifyContent: 'center', elevation: 4 },

    actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 24 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F8FAFC', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    actionBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
    actionBtnIcon: { fontSize: 18 },
    actionBtnText: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    actionBtnTextActive: { color: WHITE },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: WHITE, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    closeBtnText: { fontSize: 14, color: '#64748B' },
    participantItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    pAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
    pAvatarInitial: { fontSize: 16, fontWeight: 'bold', color: PRIMARY },
    pInfo: { flex: 1 },
    pName: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    pBadge: { alignSelf: 'flex-start', backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
    pBadgeText: { fontSize: 10, fontWeight: '800', color: '#0369A1' },

    pulseDotIcon: {
        position: 'absolute', top: 5, right: 5,
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: WHITE, borderWidth: 2, borderColor: PRIMARY,
    },

    // Step 2: Stop Sharing Banner Styles
    stopSharingBar: {
        backgroundColor: PRIMARY,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    stopSharingContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    stopSharingIcon: { fontSize: 16 },
    stopSharingText: { color: WHITE, fontSize: 13, fontWeight: '700' },
    stopSharingBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    stopSharingBtnText: { color: WHITE, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
});