// app/students/students_meeting_room.jsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, Pressable, ScrollView,
    StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '../../config';

import useStore from '../../store/useStore';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

// ── Constants ──────────────────────────────────────────────
const PRIMARY      = '#ec5b13';
const BG           = '#f8f6f6';
const WHITE        = '#FFFFFF';
const DARK         = '#221610';
const ACCENT_BROWN = '#472724';
const MUTED_BROWN  = '#c89893';
const MUTED        = '#64748B';
const BORDER       = `${ACCENT_BROWN}18`;

const API_URL = `${BASE_URL}/classes`;


// ── Announcement Card ──────────────────────────────────────
const AnnoCard = ({ item, index, onPress }) => (
    <Animated.View entering={FadeInDown.duration(450).delay(200 + index * 80)}>
        <Pressable style={styles.annoCard} onPress={() => onPress(item)}>
            <View style={styles.annoIconBox}>
                <Text style={styles.annoIcon}>📢</Text>
            </View>
            <View style={styles.annoBody}>
                <View style={styles.annoTopRow}>
                    <Text style={styles.annoTitle} numberOfLines={2}>{item.text}</Text>
                    <Text style={styles.annoTime}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </Pressable>
    </Animated.View>
);

// ── Main Screen ────────────────────────────────────────────
export default function StudentsMeetingRoom() {
    const router = useRouter();
    const user = useStore((state) => state.user);
    const { classId, className, classCode, teacherName } = useLocalSearchParams();

    const [announcements, setAnnouncements] = useState([]);
    const [loadingAnn,    setLoadingAnn]    = useState(true);
    const [meetingStatus,    setMeetingStatus]    = useState('idle');
    const [participants,     setParticipants]     = useState([]);
    const [loadingStatus,    setLoadingStatus]    = useState(true);
    const [currentClassCode, setCurrentClassCode] = useState(classCode || '');
    const [selectedAnno,     setSelectedAnno]     = useState(null);
    const [sidebarOpen,      setSidebarOpen]      = useState(false);

    useEffect(() => {
        if (classId) {
            fetchAnnouncements();
            fetchMeetingStatus();
            
            // Poll for status every 5 seconds
            const interval = setInterval(fetchMeetingStatus, 5000);
            return () => clearInterval(interval);
        }
    }, [classId]);

    const fetchMeetingStatus = async () => {
        try {
            const response = await axios.get(`${API_URL}/${classId}`);
            setMeetingStatus(response.data.class.meetingStatus);
            if (response.data.class.classCode) {
                setCurrentClassCode(response.data.class.classCode);
            }
            if (response.data.class.students) {
                const students = response.data.class.students;
                setParticipants(students);

                // Check if current student was removed
                const sid = user?._id || user?.id;
                if (sid) {
                    const isStillMember = students.some(s => (s._id || s.id || s) === sid);
                    if (!isStillMember) {
                        router.replace('/students/student_dashboard');
                    }
                }
            }
        } catch (error) {
            console.log('Status fetch error:', error);
        } finally {
            setLoadingStatus(false);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            setLoadingAnn(true);
            const response = await axios.get(`${API_URL}/${classId}/announcements`);
            setAnnouncements(response.data.announcements);
        } catch (error) {
            console.log('Fetch announcements error:', error);
        } finally {
            setLoadingAnn(false);
        }
    };

    return (
        <Animated.View entering={FadeIn.duration(350)} style={styles.container}>

            {/* ── SIDEBAR MODAL ── */}
            <Modal visible={sidebarOpen} transparent animationType="fade" onRequestClose={() => setSidebarOpen(false)}>
                <Pressable style={styles.sidebarOverlay} onPress={() => setSidebarOpen(false)}>
                    <Pressable style={styles.sidebar} onPress={() => {}}>
                        <View style={styles.sidebarHeader}>
                            <View style={styles.sidebarLogoRow}>
                                <View style={styles.sidebarLogoBox}>
                                    <Text style={styles.sidebarLogoText}>K</Text>
                                </View>
                                <Text style={styles.sidebarBrand}>Kiety Meet</Text>
                            </View>
                            <Pressable onPress={() => setSidebarOpen(false)}>
                                <Text style={styles.sidebarClose}>✕</Text>
                            </Pressable>
                        </View>

                        <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
                            {[
                                { icon: '🏠', label: 'Home',       route: '/students/student_classes' },
                                { icon: '🎓', label: 'My Classes', route: '/students/student_classes' },
                                { icon: '✨', label: 'AI Summaries', route: '/students/summaries' },
                            ].map((item) => (
                                <Pressable
                                    key={item.label}
                                    style={styles.sidebarItem}
                                    onPress={() => {
                                        setSidebarOpen(false);
                                        router.push(item.route);
                                    }}
                                >
                                    <Text style={styles.sidebarItemIcon}>{item.icon}</Text>
                                    <Text style={styles.sidebarItemLabel}>{item.label}</Text>
                                </Pressable>
                            ))}
                            <View style={styles.sidebarDivider} />
                            <Pressable
                                style={[styles.sidebarItem, { marginTop: 'auto' }]}
                                onPress={() => {
                                    setSidebarOpen(false);
                                    router.replace('/');
                                }}
                            >
                                <Text style={styles.sidebarItemIcon}>🚪</Text>
                                <Text style={[styles.sidebarItemLabel, { color: '#EF4444' }]}>Logout</Text>
                            </Pressable>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ── VIEW ANNOUNCEMENT MODAL ── */}
            <Modal visible={!!selectedAnno} transparent animationType="fade" onRequestClose={() => setSelectedAnno(null)}>
                <Pressable style={styles.modalOverlay} onPress={() => setSelectedAnno(null)}>
                    <Animated.View entering={FadeInDown.duration(280)} style={styles.viewAnnoModal}>
                        <View style={styles.viewAnnoHeader}>
                            <View style={styles.annoIconBox}>
                                <Text style={styles.annoIcon}>📢</Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.viewAnnoTitle}>Announcement</Text>
                                <Text style={styles.viewAnnoDate}>
                                    {selectedAnno && new Date(selectedAnno.createdAt).toLocaleDateString('en-US', { 
                                        month: 'long', day: 'numeric', year: 'numeric' 
                                    })}
                                </Text>
                            </View>
                        </View>
                        <ScrollView style={styles.viewAnnoScroll}>
                            <Text style={styles.viewAnnoText}>{selectedAnno?.text}</Text>
                        </ScrollView>
                        <Pressable style={styles.viewAnnoCloseBtn} onPress={() => setSelectedAnno(null)}>
                            <Text style={styles.viewAnnoCloseTxt}>Close</Text>
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* ── HEADER ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(50)} style={styles.header}>
                <View style={styles.headerLeft}>
                    <Pressable 
                        style={styles.backBtnHeader}
                        onPress={() => router.replace('/students/student_classes')}
                    >
                        <Text style={styles.backArrowHeader}>←</Text>
                    </Pressable>
                    <Pressable
                        style={styles.menuBtn}
                        onPress={() => setSidebarOpen(true)}
                    >
                        <Text style={styles.menuIcon}>☰</Text>
                    </Pressable>
                </View>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerBrand}>{className}</Text>
                    <Text style={styles.headerSub}>Classroom</Text>
                </View>
                <View style={styles.headerRight}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>{(meetingStatus || 'idle').toUpperCase()}</Text>
                </View>
            </Animated.View>

            {/* ── MAIN SCROLL ── */}
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Hero — Join Meeting */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.heroCard}>
                    <View style={styles.heroBlob} />

                    <View style={styles.heroTopRow}>
                        <View style={styles.heroIconBox}>
                            <Text style={{ fontSize: 18 }}>🎓</Text>
                        </View>
                        <Text style={styles.heroTag}>LIVE SESSION</Text>
                    </View>

                    <Text style={styles.heroTitle}>Ready to join?</Text>
                    <Text style={styles.heroSub}>
                        Your teacher has set up a virtual classroom. Join now to attend the session.
                    </Text>

                    <Pressable
                        style={[
                            styles.joinBtn,
                            meetingStatus === 'idle' && styles.joinBtnDisabled
                        ]}
                        disabled={meetingStatus === 'idle'}
                        onPress={() => router.push({
                            pathname: '/students/meeting',
                            params: { classId, className, classCode: currentClassCode }
                        })}
                    >
                        {loadingStatus ? (
                            <ActivityIndicator color={WHITE} size="small" />
                        ) : (
                            <>
                                <Text style={styles.joinBtnIcon}>
                                    {meetingStatus === 'live' ? '🎥' : '⏳'}
                                </Text>
                                <Text style={styles.joinBtnText}>
                                    {meetingStatus === 'live' ? 'Join Meeting' : 'Waiting for Teacher...'}
                                </Text>
                            </>
                        )}
                    </Pressable>
                </Animated.View>

                {/* Announcements */}
                <View style={styles.annoHeader}>
                    <Text style={styles.annoSectionTitle}>Announcements</Text>
                    {announcements.length > 0 && (
                        <Text style={styles.annoCount}>{announcements.length} total</Text>
                    )}
                </View>

                {loadingAnn ? (
                    <ActivityIndicator color={PRIMARY} style={{ marginTop: 20 }} />

                ) : announcements.length === 0 ? (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyAnno}>
                        <Text style={styles.emptyAnnoEmoji}>📭</Text>
                        <Text style={styles.emptyAnnoText}>No announcements yet</Text>
                        <Text style={styles.emptyAnnoSub}>Your teacher hasn't posted anything yet</Text>
                    </Animated.View>

                ) : (
                    announcements.map((item, index) => (
                        <AnnoCard 
                            key={item._id || index} 
                            item={item} 
                            index={index} 
                            onPress={setSelectedAnno}
                        />
                    ))
                )}


                <View style={{ height: 120 }} />
            </ScrollView>

            <Animated.View entering={FadeInUp.duration(500).delay(300)} style={styles.bottomNav}>
                {[
                    { icon: '📋', label: 'Attendance', active: true  },
                    { icon: '🎞️', label: 'Recording',   active: false },
                    { icon: '⚙️', label: 'Settings',    active: false },
                ].map((tab) => (
                    <Pressable key={tab.label} style={styles.botTab}>
                        <Text style={[styles.botTabIcon, tab.active && styles.botTabIconActive]}>
                            {tab.icon}
                        </Text>
                        <Text style={[styles.botTabLabel, tab.active && styles.botTabLabelActive]}>
                            {tab.label.toUpperCase()}
                        </Text>
                    </Pressable>
                ))}
            </Animated.View>
        </Animated.View>
    );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },

    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14, paddingTop: 52, paddingBottom: 12,
        backgroundColor: WHITE,
        borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    backBtnHeader: { padding: 8, marginRight: -4 },
    backArrowHeader: { fontSize: 24, color: DARK, fontWeight: '600' },
    menuBtn: { padding: 8 },
    menuIcon: { fontSize: 22, color: MUTED },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerBrand: { fontSize: 16, fontWeight: '800', color: DARK },
    headerSub: { fontSize: 11, color: MUTED, marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: PRIMARY,
    },
    statusText: { fontSize: 10, fontWeight: '800', color: PRIMARY },
    codePill: {
        backgroundColor: `${PRIMARY}15`, borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 6,
        borderWidth: 1, borderColor: `${PRIMARY}30`,
    },
    codePillText: { fontSize: 10, fontWeight: '800', color: PRIMARY },

    scroll: { paddingHorizontal: 16, paddingTop: 20 },

    heroCard: {
        borderRadius: 24, padding: 24, backgroundColor: ACCENT_BROWN,
        marginBottom: 28, elevation: 8, overflow: 'hidden',
    },
    heroBlob: {
        position: 'absolute', right: -20, bottom: -20,
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: `${PRIMARY}20`,
    },
    heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    heroIconBox: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: `${PRIMARY}30`,
        alignItems: 'center', justifyContent: 'center',
    },
    heroTag: { fontSize: 10, fontWeight: '700', color: MUTED_BROWN, letterSpacing: 1.5 },
    heroTitle: { fontSize: 26, fontWeight: '800', color: WHITE, marginBottom: 8 },
    heroSub: { fontSize: 14, color: MUTED_BROWN, lineHeight: 20, marginBottom: 20, maxWidth: '80%' },

    joinBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: PRIMARY, borderRadius: 16,
        paddingVertical: 14, paddingHorizontal: 24, alignSelf: 'flex-start',
    },
    joinBtnDisabled: {
        backgroundColor: `${MUTED_BROWN}60`,
        opacity: 0.8,
    },
    joinBtnIcon: { fontSize: 16 },
    joinBtnText: { color: WHITE, fontSize: 15, fontWeight: '800' },

    annoHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16,
    },
    annoSectionTitle: { fontSize: 20, fontWeight: '800', color: DARK },
    annoCount: { fontSize: 13, fontWeight: '700', color: PRIMARY },

    annoCard: {
        flexDirection: 'row', gap: 14, backgroundColor: WHITE,
        borderRadius: 18, padding: 16, marginBottom: 12, elevation: 1,
    },
    annoIconBox: {
        width: 48, height: 48, borderRadius: 14,
        backgroundColor: `${PRIMARY}10`,
        alignItems: 'center', justifyContent: 'center',
    },
    annoIcon: { fontSize: 22 },
    annoBody: { flex: 1 },
    annoTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    annoTitle: { fontSize: 14, fontWeight: '700', color: DARK, flex: 1, marginRight: 8 },
    annoTime: { fontSize: 10, color: MUTED },

    emptyAnno: { alignItems: 'center', paddingTop: 32, paddingBottom: 16 },
    emptyAnnoEmoji: { fontSize: 44, marginBottom: 12 },
    emptyAnnoText: { fontSize: 16, fontWeight: '800', color: DARK, marginBottom: 6 },
    emptyAnnoSub: { fontSize: 13, color: MUTED, textAlign: 'center' },

    bottomNav: {
        flexDirection: 'row', backgroundColor: WHITE,
        paddingBottom: 30, paddingTop: 12,
        borderTopWidth: 1, borderTopColor: BORDER,
        position: 'absolute', bottom: 0, width: '100%',
    },
    botTab: { flex: 1, alignItems: 'center' },
    botTabIcon: { fontSize: 22, marginBottom: 4 },
    botTabLabel: { fontSize: 10, fontWeight: '700', color: MUTED },
    botTabIconActive: {},
    botTabLabelActive: { color: PRIMARY },

    participantList: { flexDirection: 'row', marginBottom: 20 },
    participantItem: { alignItems: 'center', marginRight: 20, width: 60 },
    pAvatar: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: `${PRIMARY}15`,
        alignItems: 'center', justifyContent: 'center', marginBottom: 6,
        borderWidth: 1, borderColor: `${PRIMARY}20`,
    },
    pAvatarText: { fontSize: 20 },
    pName: { fontSize: 10, color: MUTED, fontWeight: '600', textAlign: 'center' },
    noParticipants: { color: MUTED, fontSize: 13, fontStyle: 'italic', marginVertical: 10 },

    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
    },
    viewAnnoModal: {
        backgroundColor: WHITE, borderRadius: 24,
        padding: 24, width: '90%', maxHeight: '70%',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1, shadowRadius: 20, elevation: 15,
    },
    viewAnnoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    viewAnnoTitle: { fontSize: 18, fontWeight: '800', color: DARK },
    viewAnnoDate: { fontSize: 12, color: MUTED, marginTop: 2 },
    viewAnnoScroll: { marginBottom: 20 },
    viewAnnoText: { fontSize: 15, color: DARK, lineHeight: 24 },
    viewAnnoCloseBtn: {
        backgroundColor: '#F1F5F9', borderRadius: 12,
        paddingVertical: 14, alignItems: 'center',
    },
    viewAnnoCloseTxt: { color: DARK, fontWeight: '700', fontSize: 14 },

    sidebarOverlay: { flex: 1, backgroundColor: 'rgba(34,22,16,0.5)', flexDirection: 'row' },
    sidebar: { width: 280, height: '100%', backgroundColor: WHITE },
    sidebarHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    sidebarLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sidebarLogoBox: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: `${PRIMARY}15`, alignItems: 'center', justifyContent: 'center',
    },
    sidebarLogoText: { fontSize: 16, fontWeight: '900', color: PRIMARY },
    sidebarBrand: { fontSize: 17, fontWeight: '800', color: DARK },
    sidebarClose: { fontSize: 18, color: MUTED },
    sidebarNav: { flex: 1, padding: 12 },
    sidebarItem: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12,
    },
    sidebarItemIcon: { fontSize: 18 },
    sidebarItemLabel: { fontSize: 14, fontWeight: '600', color: MUTED },
    sidebarDivider: { height: 1, backgroundColor: BORDER, marginVertical: 8 },
});