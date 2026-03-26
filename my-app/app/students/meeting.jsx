// app/students/meeting.jsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, Pressable, StyleSheet,
    StatusBar, Modal, ScrollView, ActivityIndicator,
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

    const { isMicrophoneEnabled, isCameraEnabled } = localParticipant;
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

    // Pulsing dot
    const pulseOpacity = useSharedValue(1);
    useEffect(() => {
        pulseOpacity.value = withRepeat(withTiming(0.2, { duration: 800 }), -1, true);
    }, []);
    const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

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
        const isSharing = localParticipant.isScreenShareEnabled;
        await localParticipant.setScreenShareEnabled(!isSharing);
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
                        <Pressable style={styles.headerBtn} onPress={() => setShowParticipants(true)}>
                            <Text style={styles.headerBtnIcon}>👥</Text>
                        </Pressable>
                        <Pressable style={styles.headerBtn} onPress={toggleScreenShare}>
                            <Text style={styles.headerBtnIcon}>🖥️</Text>
                        </Pressable>
                    </View>
                </Animated.View>

                {/* ── LOCAL PiP (student's own feed) ── */}
                <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.pip}>
                    {localVideoTrack && isCameraEnabled ? (
                        <VideoTrack trackRef={localVideoTrack} style={StyleSheet.absoluteFill} mirror />
                    ) : (
                        <View style={styles.pipVideo}>
                            <Text style={styles.pipAvatarText}>
                                {localParticipant?.identity?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.pipLabel}>
                        <Text style={styles.pipLabelText}>You</Text>
                    </View>
                </Animated.View>

                {/* ── TEACHER NAME TAG ── */}
                {teacher && (
                    <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.nameTag}>
                        <View style={[styles.nameDot, { backgroundColor: PRIMARY }]} />
                        <Text style={styles.nameTagText}>{teacher.identity}</Text>
                    </Animated.View>
                )}

                {/* ── REACTIONS BAR ── */}
                <Animated.View entering={FadeInUp.duration(500).delay(500)} style={styles.reactionsBar}>
                    {['👏', '🔥', '❤️', '💡', '💯'].map((emoji) => (
                        <Pressable key={emoji} style={styles.reactionBtn}>
                            <Text style={styles.reactionEmoji}>{emoji}</Text>
                        </Pressable>
                    ))}
                </Animated.View>
            </View>

            {/* ── BOTTOM CONTROLS ── */}
            <Animated.View entering={FadeInUp.duration(600).delay(200)} style={styles.controls}>
                <View style={styles.ctrlRow}>

                    <Pressable style={styles.ctrlItem} onPress={toggleMic}>
                        <View style={[styles.ctrlCircle, isMicrophoneEnabled && styles.ctrlCircleActive]}>
                            <Text style={styles.ctrlIcon}>{!isMicrophoneEnabled ? '🔇' : '🎙️'}</Text>
                        </View>
                        <Text style={styles.ctrlLabel}>{isMicrophoneEnabled ? 'Mute' : 'Unmute'}</Text>
                    </Pressable>

                    <Pressable style={styles.ctrlItem} onPress={toggleCamera}>
                        <View style={[styles.ctrlCircle, isCameraEnabled && styles.ctrlCircleActive]}>
                            <Text style={styles.ctrlIcon}>{!isCameraEnabled ? '📷' : '📹'}</Text>
                        </View>
                        <Text style={styles.ctrlLabel}>Video</Text>
                    </Pressable>

                    <Pressable style={styles.ctrlItem} onPress={() => setHandUp(!handUp)}>
                        <View style={[styles.ctrlCircle, handUp && styles.ctrlCircleActive]}>
                            <Text style={styles.ctrlIcon}>✋</Text>
                        </View>
                        <Text style={styles.ctrlLabel}>Raise</Text>
                    </Pressable>

                    <Pressable style={styles.ctrlItem} onPress={() => setShowParticipants(true)}>
                        <View style={styles.ctrlCircle}>
                            <Text style={styles.ctrlIcon}>👥</Text>
                        </View>
                        <Text style={styles.ctrlLabel}>People</Text>
                    </Pressable>

                    <Pressable style={styles.ctrlItem} onPress={toggleScreenShare}>
                        <View style={styles.ctrlCircle}>
                            <Text style={styles.ctrlIcon}>🖥️</Text>
                        </View>
                        <Text style={styles.ctrlLabel}>Share</Text>
                    </Pressable>

                </View>

                <View style={styles.actionRow}>
                    <Pressable style={styles.notesBtn}>
                        <Text style={styles.notesBtnIcon}>📝</Text>
                        <Text style={styles.notesBtnText}>Shared Notes</Text>
                    </Pressable>
                    <Pressable style={styles.endCallBtn} onPress={onEnd}>
                        <Text style={styles.endCallIcon}>📵</Text>
                    </Pressable>
                </View>

                <View style={styles.homeIndicator} />
            </Animated.View>

        </View>
    );
}

// ── Main Wrapper ───────────────────────────────────────────
export default function MeetingScreen() {
    const router = useRouter();
    const { classId, className, classCode, teacherName } = useLocalSearchParams();
    const user = useStore((state) => state.user);

    const [token,   setToken]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    useEffect(() => {
        if (classCode) fetchToken();
    }, [classCode]);

    useEffect(() => {
        if (classId && user) {
            const checkEnrollment = async () => {
                try {
                    const response = await axios.get(`${BASE_URL}/classes/${classId}`);
                    const students = response.data.class.students;
                    const sid = user?._id || user?.id;
                    if (sid && students) {
                        const isStillMember = students.some(s => (s._id || s.id || s) === sid);
                        if (!isStillMember) {
                            router.replace('/students/student_dashboard');
                        }
                    }
                } catch (e) {
                    console.log('Enrollment check error:', e);
                }
            };
            const interval = setInterval(checkEnrollment, 5000);
            return () => clearInterval(interval);
        }
    }, [classId, user]);

    const fetchToken = async () => {
        try {
            const response = await axios.post(TOKEN_API, {
                roomName:        classCode,
                participantName: user?.firstName
                    ? `${user.firstName} ${user.lastName || ''}`.trim()
                    : 'Student',
            });
            setToken(response.data.token);
        } catch (e) {
            setError('Failed to connect. Please try again.');
            console.error('Token fetch error:', e);
            setError(`Token failed: ${e.response?.data?.message || e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        router.replace({
            pathname: '/students/students_meeting_room',
            params: { classId, className, classCode, teacherName }
        });
    };

    const handleEnd = () => {
        router.replace({
            pathname: '/students/students_meeting_room',
            params: { classId, className, classCode, teacherName }
        });
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={PRIMARY} size="large" />
                <Text style={styles.loadingTxt}>Joining meeting...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorTxt}>{error}</Text>
                <Pressable
                    style={styles.retryBtn}
                    onPress={() => { setLoading(true); setError(null); fetchToken(); }}
                >
                    <Text style={styles.retryTxt}>Retry</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <LiveKitRoom
            serverUrl={LIVEKIT_URL}
            token={token}
            connect={true}
            audio={false} // Delay till connected
            video={false} // Delay till connected
            connectOptions={{
                autoSubscribe: true,
                connectTimeout: 30000,
                publishDefaults: {
                    videoEncoding: { maxBitrate: 1500000 },
                    dtx: true,
                },
            }}
            onDisconnected={(reason) => {
                console.log('Student disconnected:', reason);
                if (reason === 'user_initiated' || reason === 'room_closed') {
                    handleEnd();
                }
            }}
            onError={(e) => {
                console.error('LiveKitRoom Error:', e);
                if (e.message?.includes('token')) {
                    setError(`Connection Error: ${e.message}`);
                }
            }}
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
    centered: { flex: 1, backgroundColor: DARK, alignItems: 'center', justifyContent: 'center', gap: 16 },
    loadingTxt: { color: MUTED, fontSize: 14, fontWeight: '600' },
    errorTxt: { color: DANGER, fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32 },
    retryBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
    retryTxt: { color: WHITE, fontWeight: '800' },

    videoBg: { flex: 1, backgroundColor: '#1a2535', position: 'relative' },
    videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)', zIndex: 1 },

    noTeacherBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    noTeacherAvatar: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    },
    noTeacherInitial: { fontSize: 36, fontWeight: '800', color: WHITE },
    noTeacherTxt: { color: MUTED, fontSize: 14, fontWeight: '600' },

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
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: DANGER },
    liveText: { fontSize: 9, fontWeight: '800', color: '#CBD5E1', letterSpacing: 1.5 },
    headerRight: { flexDirection: 'row', gap: 8 },

    pip: {
        position: 'absolute', top: 110, right: 16,
        width: 90, aspectRatio: 3 / 4,
        borderRadius: 14, overflow: 'hidden',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
        zIndex: 10,
    },
    pipSpeaking: { borderColor: PRIMARY },
    pipVideo: {
        flex: 1, backgroundColor: '#2d3748',
        alignItems: 'center', justifyContent: 'center',
    },
    pipAvatarText: { fontSize: 30, fontWeight: '800', color: WHITE },
    pipLabel: {
        position: 'absolute', bottom: 6, left: 4, right: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, alignItems: 'center',
    },
    pipLabelText: { fontSize: 8, color: WHITE, fontWeight: '700' },

    nameTag: {
        position: 'absolute', bottom: 100, left: 16,
        flexDirection: 'row', alignItems: 'center', gap: 7,
        backgroundColor: 'rgba(34,22,16,0.82)',
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 10, borderWidth: 1, borderColor: `${PRIMARY}40`,
        zIndex: 10,
    },
    nameDot: { width: 8, height: 8, borderRadius: 4 },
    nameTagText: { fontSize: 12, fontWeight: '700', color: WHITE },

    reactionsBar: {
        position: 'absolute', bottom: 14, alignSelf: 'center',
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.75)',
        paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 50, zIndex: 10, gap: 4,
    },
    reactionBtn: { padding: 4 },
    reactionEmoji: { fontSize: 20 },

    controls: {
        backgroundColor: WHITE,
        paddingHorizontal: 24, paddingVertical: 20,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
    },
    ctrlRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
    ctrlItem: { alignItems: 'center', gap: 5 },
    ctrlCircle: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
    },
    ctrlCircleActive: {
        backgroundColor: PRIMARY,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
    },
    ctrlIcon: { fontSize: 20 },
    ctrlLabel: { fontSize: 9, fontWeight: '800', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.8 },

    actionRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    notesBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 14,
        borderWidth: 1, borderColor: '#E2E8F0',
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

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: WHITE, borderTopLeftRadius: 30, borderTopRightRadius: 30,
        padding: 24, height: '70%',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: DARK },
    closeBtn: { padding: 5 },
    closeBtnText: { fontSize: 20, color: MUTED },
    participantItem: {
        flexDirection: 'row', alignItems: 'center', gap: 15,
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    pAvatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: `${PRIMARY}20`, alignItems: 'center', justifyContent: 'center',
    },
    pAvatarInitial: { fontSize: 18, fontWeight: '800', color: PRIMARY },
    pInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    pName: { fontSize: 15, fontWeight: '700', color: DARK },
    pBadge: { backgroundColor: `${PRIMARY}15`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    pBadgeText: { fontSize: 10, fontWeight: '800', color: PRIMARY },
});