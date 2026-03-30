// app/teachers/meeting.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, Pressable,
    StatusBar, ScrollView, Modal, ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { BASE_URL, LIVEKIT_URL } from '../../config';

import useStore from '../../store/useStore';
import Animated, { 
    FadeIn, FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle, withRepeat, withTiming 
} from 'react-native-reanimated';
import {
    LiveKitRoom,
    VideoTrack,
    AudioTrack,
    useLocalParticipant,
    useParticipants,
    useTracks,
    TrackToggle,
    useRoomContext,
} from '@livekit/react-native';
import { Track } from 'livekit-client';

// ── Constants ──────────────────────────────────────────────
const PRIMARY  = '#ec5b13';
const BG_DARK  = '#0F172A';
const BG_CARD  = '#1E293B';
const WHITE    = '#FFFFFF';
const DANGER   = '#EF4444';
const MUTED    = '#94A3B8';
const BORDER   = 'rgba(236,91,19,0.15)';
const GLASS    = 'rgba(255,255,255,0.08)';
const API_URL       = `${BASE_URL}/classes`;

const TOKEN_API     = `${BASE_URL}/livekit/token`;

// ── Participant Tile ───────────────────────────────────────
const ParticipantTile = ({ participant }) => {
    const tracks = useTracks(
        [{ source: Track.Source.Camera }],
        { participant }
    );
    const videoTrack = tracks[0];
    const isSpeaking = participant.isSpeaking;

    return (
        <View style={[styles.tile, isSpeaking && styles.tileSpeaking]}>
            {videoTrack ? (
                <VideoTrack trackRef={videoTrack} style={StyleSheet.absoluteFill} />
            ) : (
                <View style={styles.tileAvatar}>
                    <Text style={styles.tileAvatarText}>
                        {participant.identity?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                </View>
            )}
            <View style={styles.tileNamePill}>
                <Text style={styles.tileName} numberOfLines={1}>
                    {participant.identity}
                </Text>
            </View>
        </View>
    );
};

// ── Participant Row (in modal) ─────────────────────────────
const ParticipantRow = ({ participant, isLocal = false }) => {
    const isMuted = !participant.isMicrophoneEnabled;
    return (
        <View style={styles.participantRow}>
            <View style={styles.participantAvatar}>
                <Text style={styles.participantAvatarText}>
                    {participant.identity?.charAt(0)?.toUpperCase() || '?'}
                </Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.participantName}>
                    {participant.identity}{isLocal ? ' (You)' : ''}
                </Text>
                <Text style={styles.participantRole}>{isLocal ? 'Host' : 'Student'}</Text>
            </View>
            <Text style={{ fontSize: 16 }}>{isMuted ? '🔇' : '🎙️'}</Text>
        </View>
    );
};

// ── Inner Meeting (needs LiveKitRoom context) ──────────────
function MeetingInner({ className, classCode, classId, onEnd, onBack }) {
    const router = useRouter();
    const { localParticipant } = useLocalParticipant();
    const participants          = useParticipants();
    const room                  = useRoomContext();

    const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled: isSharing } = localParticipant;

    const [timer,            setTimer]            = useState(0);
    const [showParticipants, setShowParticipants] = useState(false);
    const [showActions,      setShowActions]      = useState(false);
    const [activeTab,        setActiveTab]        = useState('chat');

    // Step 2: Pulsing for sharing
    const sharingPulse = useSharedValue(1);
    useEffect(() => {
        if (isSharing) {
            sharingPulse.value = withRepeat(withTiming(0.4, { duration: 800 }), -1, true);
        } else {
            sharingPulse.value = withTiming(1);
        }
    }, [isSharing]);

    const pulseStyle = useAnimatedStyle(() => ({
        opacity: sharingPulse.value,
    }));

    // Local video track
    const localVideoTracks = useTracks(
        [{ source: Track.Source.Camera }],
        { participant: localParticipant }
    );
    const localVideoTrack = localVideoTracks[0];

    // Remote participants (exclude self)
    const remoteParticipants = participants.filter(
        (p) => p.identity !== localParticipant?.identity
    );

    // Timer
    useEffect(() => {
        const interval = setInterval(() => setTimer(p => p + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    };

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
            const isSharingState = localParticipant.isScreenShareEnabled;

            // Exclusive Sharing Logic: Check if anyone else is already sharing
            const otherSharer = participants.find(p => p.isScreenShareEnabled && p.identity !== localParticipant.identity);
            if (!isSharingState && otherSharer) {
                Alert.alert(
                    "Cannot Share Screen",
                    `${otherSharer.identity} is already sharing their screen. Only one person can share at a time.`
                );
                return;
            }

            await localParticipant.setScreenShareEnabled(!isSharingState);
        } catch (error) {
            console.error('Screen share error:', error);
            Alert.alert(
                'Screen Share Error',
                'Could not start screen sharing. Please ensure you have granted the necessary permissions.'
            );
        }
    };

    const BOTTOM_TABS = [
        { key: 'chat',  icon: '💬', label: 'Chat'     },
        { key: 'more',  icon: '⚙️',  label: 'Settings'},
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />

            {/* ── PARTICIPANTS MODAL ── */}
            <Modal visible={showParticipants} transparent animationType="slide" onRequestClose={() => setShowParticipants(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowParticipants(false)}>
                    <Animated.View entering={FadeInUp.duration(300)} style={styles.participantsSheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>
                            Participants ({participants.length})
                        </Text>

                        {localParticipant && (
                            <ParticipantRow participant={localParticipant} isLocal />
                        )}

                        {remoteParticipants.length > 0 ? (
                            remoteParticipants.map((p) => (
                                <ParticipantRow key={p.identity} participant={p} />
                            ))
                        ) : (
                            <>
                                <View style={styles.sheetDivider} />
                                <Text style={styles.waitingText}>Waiting for students to join...</Text>
                            </>
                        )}

                        <Pressable style={styles.sheetCloseBtn} onPress={() => setShowParticipants(false)}>
                            <Text style={styles.sheetCloseTxt}>Close</Text>
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* ── ACTIONS SHEET ── */}
            <Modal visible={showActions} transparent animationType="slide" onRequestClose={() => setShowActions(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowActions(false)}>
                    <Animated.View entering={FadeInUp.duration(300)} style={styles.actionsSheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>Teacher Controls</Text>
                        {[
                            { icon: '👥', bg: '#DBEAFE', label: 'See Participants', onPress: () => { setShowActions(false); setShowParticipants(true); } },
                            { icon: '✅', bg: '#DCFCE7', label: 'Mark Attendance',  onPress: () => setShowActions(false) },
                            { icon: '⚙️', bg: '#F1F5F9', label: 'Session Settings', onPress: () => setShowActions(false) },
                        ].map((item) => (
                            <Pressable key={item.label} style={styles.actionRow} onPress={item.onPress}>
                                <View style={[styles.actionIconBox, { backgroundColor: item.bg }]}>
                                    <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                                </View>
                                <Text style={styles.actionLabel}>{item.label}</Text>
                                <Text style={styles.actionChevron}>›</Text>
                            </Pressable>
                        ))}
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* ── HEADER ── */}
            <SafeAreaView>
                {isSharing && (
                    <Animated.View 
                        entering={FadeInUp.duration(300)}
                        style={styles.stopSharingBar}
                    >
                        <View style={styles.stopSharingContent}>
                            <Text style={styles.stopSharingIcon}>🖥️</Text>
                            <Text style={styles.stopSharingText}>You are sharing your screen</Text>
                        </View>
                        <Pressable style={styles.stopSharingBtn} onPress={toggleScreenShare}>
                            <Text style={styles.stopSharingBtnText}>Stop Presenting</Text>
                        </Pressable>
                    </Animated.View>
                )}

                <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
                    <Pressable style={styles.backCircle} onPress={onBack}>
                        <Text style={{ fontSize: 18, color: WHITE }}>←</Text>
                    </Pressable>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.headerClass}>{className || 'Classroom'}</Text>
                        <Text style={styles.headerSub}>{classCode}</Text>
                    </View>
                    <View style={styles.timerPill}>
                        <View style={styles.timerDot} />
                        <Text style={styles.timerText}>{formatTime(timer)}</Text>
                    </View>
                </Animated.View>
            </SafeAreaView>

            {/* ── VIDEO AREA ── */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.videoScroll} showsVerticalScrollIndicator={false}>

                {/* Main feed area: Either Sharing Placeholder OR Camera feed */}
                {isSharing ? (
                    <Animated.View entering={FadeIn.duration(400)} style={[styles.mainFeed, styles.sharingActiveContainer]}>
                        <View style={styles.sharingIconCircle}>
                            <Text style={{ fontSize: 40 }}>🖥️</Text>
                        </View>
                        <Text style={styles.sharingMainTxt}>Screen Sharing Active</Text>
                        <Text style={styles.sharingSubTxt}>The class can see your entire screen</Text>
                        <Pressable style={styles.sharingStopBtnInline} onPress={toggleScreenShare}>
                            <Text style={styles.sharingStopBtnInlineText}>Stop Sharing</Text>
                        </Pressable>
                    </Animated.View>
                ) : (
                    <Animated.View entering={FadeIn.duration(500)} style={styles.mainFeed}>
                        {localVideoTrack && isCameraEnabled ? (
                            <VideoTrack trackRef={localVideoTrack} style={StyleSheet.absoluteFill} mirror />
                        ) : (
                            <View style={styles.camOffBox}>
                                <View style={styles.avatarLarge}>
                                    <Text style={styles.avatarLargeTxt}>
                                        {localParticipant?.identity?.charAt(0)?.toUpperCase() || 'T'}
                                    </Text>
                                </View>
                                <Text style={styles.camOffTxt}>Camera is off</Text>
                            </View>
                        )}
                        <View style={styles.namePill}>
                            <Text style={{ fontSize: 10 }}>🎙️</Text>
                            <Text style={styles.namePillTxt}>{localParticipant?.identity || 'Teacher'} (You)</Text>
                        </View>
                        <View style={styles.hostBadge}>
                            <Text style={styles.hostBadgeTxt}>HOST</Text>
                        </View>
                        {isCameraEnabled && (
                            <View style={styles.liveBadge}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveTxt}>LIVE</Text>
                            </View>
                        )}
                    </Animated.View>
                )}

                {/* Remote participants grid */}
                {remoteParticipants.length > 0 && (
                    <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.tilesGrid}>
                        {remoteParticipants.map((p) => (
                            <ParticipantTile key={p.identity} participant={p} />
                        ))}
                    </Animated.View>
                )}

            </ScrollView>

            {/* ── CONTROLS ── */}
            <Animated.View entering={FadeInUp.duration(400).delay(200)} style={styles.controls}>
                <View style={styles.controlsRow}>

                    <Pressable style={styles.ctrlWrap} onPress={toggleMic}>
                        <View style={[styles.ctrlBtn, isMicrophoneEnabled && styles.ctrlBtnActive]}>
                            <Text style={styles.ctrlIcon}>{!isMicrophoneEnabled ? '🔇' : '🎙️'}</Text>
                        </View>
                        <Text style={styles.ctrlLabel}>{isMicrophoneEnabled ? 'Mute' : 'Unmute'}</Text>
                    </Pressable>

                    <Pressable style={styles.ctrlWrap} onPress={toggleCamera}>
                        <View style={[styles.ctrlBtn, isCameraEnabled && styles.ctrlBtnActive]}>
                            <Text style={styles.ctrlIcon}>{!isCameraEnabled ? '📷' : '📹'}</Text>
                        </View>
                        <Text style={styles.ctrlLabel}>Video</Text>
                    </Pressable>

                    <Pressable style={styles.endBtn} onPress={onEnd}>
                        <Text style={{ fontSize: 26, transform: [{ rotate: '135deg' }] }}>📞</Text>
                    </Pressable>

                    <Pressable style={styles.ctrlWrap} onPress={toggleScreenShare}>
                        <View style={[styles.ctrlBtn, isSharing && styles.ctrlBtnActiveSharing]}>
                            <Text style={[styles.ctrlIcon, isSharing && { color: WHITE }]}>🖥️</Text>
                            {isSharing && (
                                <Animated.View style={[styles.pulseDot, pulseStyle]} />
                            )}
                        </View>
                        <Text style={[styles.ctrlLabel, isSharing && { color: PRIMARY, fontWeight: '900' }]}>
                            {isSharing ? 'Sharing' : 'Share'}
                        </Text>
                    </Pressable>

                    <Pressable style={styles.ctrlWrap} onPress={() => setShowActions(true)}>
                        <View style={styles.ctrlBtn}>
                            <Text style={styles.ctrlIcon}>⋯</Text>
                        </View>
                        <Text style={styles.ctrlLabel}>More</Text>
                    </Pressable>

                </View>

                {/* Tab bar */}
                <View style={styles.tabBar}>
                    {BOTTOM_TABS.map((tab) => (
                        <Pressable
                            key={tab.key}
                            style={styles.tabItem}
                            onPress={() => {
                                setActiveTab(tab.key);
                                if (tab.key === 'class') setShowParticipants(true);
                                if (tab.key === 'more')  setShowActions(true);
                            }}
                        >
                            <Text style={styles.tabIcon}>{tab.icon}</Text>
                            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                                {tab.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </Animated.View>

        </View>
    );
}

// ── Main Wrapper ───────────────────────────────────────────
export default function Meeting() {
    const router = useRouter();
    const { classId, className, classCode } = useLocalSearchParams();
    const user = useStore((state) => state.user);

    const [token,   setToken]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    // Fetch LiveKit token + set DB live
    useEffect(() => {
        if (classId) {
            fetchToken();
            updateStatus('live');
        }
    }, [classId]);

    const fetchToken = async () => {
        try {
            const response = await axios.post(TOKEN_API, {
                roomName:        classCode,
                participantName: user?.fullName || 'Teacher',
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

    const updateStatus = async (status) => {
        try {
            await axios.patch(`${API_URL}/${classId}/status`, { status });
        } catch (e) {
            console.log('Status error:', e);
        }
    };

    const handleBack = () => {
        router.replace('/teachers/teachers_classes');
    };

    const handleEnd = async () => {
        await updateStatus('idle');
        router.replace('/teachers/teachers_classes');
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator color={PRIMARY} size="large" />
                <Text style={styles.loadingTxt}>Connecting to meeting...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorTxt}>{error}</Text>
                <Pressable style={styles.retryBtn} onPress={() => { setLoading(true); setError(null); fetchToken(); }}>
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
                console.log('Disconnected from LiveKit:', reason);
                if (reason === 'user_initiated' || reason === 'room_closed') {
                    handleEnd();
                }
            }}
            onError={(e) => {
                console.error('LiveKitRoom Error:', e);
                if (e.message?.includes('token') || e.message?.includes('url')) {
                    setError(`Connection Error: ${e.message}`);
                }
            }}
        >
            <MeetingInner
                className={className}
                classCode={classCode}
                classId={classId}
                onEnd={handleEnd}
                onBack={handleBack}
            />
        </LiveKitRoom>
    );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG_DARK },
    centered: { flex: 1, backgroundColor: BG_DARK, alignItems: 'center', justifyContent: 'center', gap: 16 },
    loadingTxt: { color: MUTED, fontSize: 14, fontWeight: '600' },
    errorTxt: { color: DANGER, fontSize: 14, fontWeight: '600', textAlign: 'center', paddingHorizontal: 32 },
    retryBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
    retryTxt: { color: WHITE, fontWeight: '800' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    backCircle: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: GLASS, alignItems: 'center', justifyContent: 'center',
    },
    headerClass: { fontSize: 16, fontWeight: '800', color: WHITE },
    headerSub: { fontSize: 10, color: MUTED, fontWeight: '600', marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.5 },
    timerPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(236,91,19,0.15)',
        borderWidth: 1, borderColor: 'rgba(236,91,19,0.3)',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    timerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: DANGER },
    timerText: { color: PRIMARY, fontSize: 13, fontWeight: '800' },

    videoScroll: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8, gap: 12 },

    mainFeed: {
        width: '100%', aspectRatio: 16 / 9,
        borderRadius: 16, overflow: 'hidden',
        backgroundColor: '#334155',
        borderWidth: 2, borderColor: 'rgba(236,91,19,0.25)',
    },
    camOffBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    avatarLarge: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
    avatarLargeTxt: { fontSize: 32, fontWeight: '800', color: WHITE },
    camOffTxt: { fontSize: 14, color: MUTED, fontWeight: '600' },
    liveBadge: {
        position: 'absolute', top: 10, left: 10,
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: DANGER,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: WHITE },
    liveTxt: { color: WHITE, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    namePill: {
        position: 'absolute', bottom: 10, left: 10,
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    },
    namePillTxt: { color: WHITE, fontSize: 11, fontWeight: '600' },
    hostBadge: {
        position: 'absolute', top: 10, right: 10,
        backgroundColor: PRIMARY, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
    },
    hostBadgeTxt: { color: WHITE, fontSize: 9, fontWeight: '900', letterSpacing: 1 },

    tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tile: {
        width: '31%', aspectRatio: 1, borderRadius: 12,
        backgroundColor: BG_CARD, alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', borderWidth: 1.5, borderColor: 'transparent',
    },
    tileSpeaking: { borderColor: PRIMARY },
    tileAvatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: 'rgba(236,91,19,0.25)',
        alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    },
    tileAvatarText: { fontSize: 18, fontWeight: '800', color: PRIMARY },
    tileNamePill: {
        position: 'absolute', bottom: 6, left: 4, right: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, alignItems: 'center',
    },
    tileName: { fontSize: 9, color: WHITE, fontWeight: '600' },

    controls: {
        backgroundColor: 'rgba(15,23,42,0.97)',
        borderTopWidth: 1, borderTopColor: BORDER,
        paddingTop: 16, paddingBottom: 4,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
    },
    controlsRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-evenly', paddingHorizontal: 16, marginBottom: 12,
    },
    ctrlWrap: { alignItems: 'center', gap: 5 },
    ctrlBtn: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: GLASS, alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    ctrlBtnActive: { backgroundColor: WHITE },
    ctrlIcon: { fontSize: 22 },
    ctrlLabel: { color: MUTED, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
    endBtn: {
        width: 62, height: 62, borderRadius: 31,
        backgroundColor: DANGER, alignItems: 'center', justifyContent: 'center',
        shadowColor: DANGER, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45, shadowRadius: 12, elevation: 10,
    },

    tabBar: {
        flexDirection: 'row',
        borderTopWidth: 1, borderTopColor: BORDER,
        paddingTop: 10, paddingBottom: 20,
    },
    tabItem: { flex: 1, alignItems: 'center', gap: 3 },
    tabIcon: { fontSize: 20 },
    tabLabel: { fontSize: 9, fontWeight: '700', color: MUTED, textTransform: 'uppercase' },
    tabLabelActive: { color: PRIMARY },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    participantsSheet: {
        backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, minHeight: '50%',
    },
    sheetHandle: {
        width: 40, height: 4, backgroundColor: '#E2E8F0',
        borderRadius: 2, alignSelf: 'center', marginBottom: 20,
    },
    sheetTitle: { fontSize: 20, fontWeight: '800', color: BG_DARK, marginBottom: 20 },
    sheetDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
    waitingText: { textAlign: 'center', color: MUTED, fontSize: 13, marginTop: 24, fontStyle: 'italic' },
    sheetCloseBtn: {
        backgroundColor: '#F1F5F9', padding: 16,
        borderRadius: 16, alignItems: 'center', marginTop: 24,
    },
    sheetCloseTxt: { color: BG_DARK, fontWeight: '800', fontSize: 15 },
    participantRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
    participantAvatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
    },
    participantAvatarText: { color: WHITE, fontWeight: '700', fontSize: 16 },
    participantName: { fontSize: 15, fontWeight: '700', color: BG_DARK },
    participantRole: { fontSize: 11, color: MUTED, fontWeight: '600', marginTop: 2 },
    actionsSheet: {
        backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingBottom: 40,
    },
    actionRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        padding: 14, borderRadius: 14,
        backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10,
    },
    actionIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: BG_DARK },
    actionChevron: { fontSize: 22, color: MUTED },

    // Screen Share Helpers
    stopSharingBar: {
        backgroundColor: PRIMARY,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 14,
        marginHorizontal: 14,
        marginBottom: 10,
        elevation: 10,
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
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
    ctrlBtnActiveSharing: {
        backgroundColor: PRIMARY,
        borderColor: PRIMARY,
    },
    pulseDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fecaca',
        borderWidth: 1,
        borderColor: WHITE,
    },
    sharingActiveContainer: {
        backgroundColor: '#1e293b',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    sharingIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(236,91,19,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sharingMainTxt: { color: WHITE, fontSize: 18, fontWeight: '800' },
    sharingSubTxt: { color: MUTED, fontSize: 12, fontWeight: '500', textAlign: 'center', paddingHorizontal: 40 },
    sharingStopBtnInline: {
        marginTop: 10,
        backgroundColor: DANGER,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    sharingStopBtnInlineText: { color: WHITE, fontWeight: '800', fontSize: 13 },
});
