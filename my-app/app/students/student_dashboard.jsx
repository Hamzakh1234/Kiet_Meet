// app/students/student_dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Pressable, ScrollView,
    StyleSheet, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import useStore from '../../store/useStore';
import axios from 'axios';
import { BASE_URL } from '../../config';


// ── Constants ──────────────────────────────────────────────
const PRIMARY     = '#ec5b13';
const BG          = '#f8f6f6';
const WHITE       = '#FFFFFF';
const DARK        = '#221610';
const MUTED       = '#64748B';
const BORDER      = '#E2E8F0';
const PLACEHOLDER = '#94A3B8';

const API_URL = `${BASE_URL}/classes`;


// ── Sidebar Data ───────────────────────────────────────────
const SIDEBAR_ITEMS = [
    { icon: '🏠', label: 'Home',       active: true  },
    { icon: '🎓', label: 'My Classes', active: false },
    { icon: '✨', label: 'AI Summaries', active: false },
];
const SIDEBAR_BOTTOM = [
    { icon: '👤', label: 'Profile',  active: false },
    { icon: '⚙️', label: 'Settings', active: false },
    { icon: '🚪', label: 'Logout',   active: false, danger: true },
];

// ── Main Component ─────────────────────────────────────────
const StudentDashboard = () => {
    const router  = useRouter();
    const user    = useStore((state) => state.user);
    const logout  = useStore((state) => state.logout);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [classCode,   setClassCode]   = useState('');
    const [joining,     setJoining]     = useState(false);
    const [joinedCount, setJoinedCount] = useState(0);
    
    // Notifications State
    const [announcements, setAnnouncements] = useState([]);
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [loadingAnnos, setLoadingAnnos] = useState(false);

    useEffect(() => {
        if ((user?._id || user?.id) && user?.role === 'student') {
            fetchJoinedClasses();
            fetchAnnouncements();
            
            // Poll for notifications every 30 seconds
            const interval = setInterval(fetchAnnouncements, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchJoinedClasses = async () => {
        try {
            const sid = user?._id || user?.id;
            const response = await axios.get(`${API_URL}/joined-classes/${sid}`);
            setJoinedCount(response.data.classes.length);
        } catch (error) {
            console.error('Fetch count error:', error);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const sid = user?._id || user?.id;
            const response = await axios.get(`${API_URL}/all-announcements/${sid}`);
            setAnnouncements(response.data.announcements);
        } catch (error) {
            console.error('Fetch announcements error:', error);
        }
    };

    // ── Join Class ─────────────────────────────────────────
    const handleJoinNow = async () => {
        if (!classCode.trim()) {
            Alert.alert('❌ Error', 'Please enter a class code');
            return;
        }

        setJoining(true);
        try {
            const response = await axios.post(`${API_URL}/join`, {
                classCode: classCode.trim().toUpperCase(),
                studentId: user?._id || user?.id,
            });
            const cls = response.data.class;

            fetchJoinedClasses();
            fetchAnnouncements();
            setClassCode('');

            router.push({
                pathname: '/students/students_meeting_room',
                params: {
                    classId:     cls._id,
                    className:   cls.className,
                    classCode:   cls.classCode,
                    teacherName: cls.teacherName,
                }
            });

        } catch (error) {
            const msg = error.response?.data?.message || 'Class not found. Check the code and try again.';
            Alert.alert('❌ Error', msg);
        } finally {
            setJoining(false);
        }
    };

    const handleDeleteNotification = async (index) => {
        try {
            const anno = announcements[index];
            const sid = user?._id || user?.id;
            
            // Call backend to dismiss permanently
            await axios.post(`${BASE_URL}/classes/dismiss-announcement`, {
                studentId: sid,
                announcementId: anno._id || anno.id,
            });

            // Update local state
            const newAnnos = [...announcements];
            newAnnos.splice(index, 1);
            setAnnouncements(newAnnos);
        } catch (error) {
            console.error('Dismiss notification error:', error);
        }
    };

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>

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
                            {SIDEBAR_ITEMS.map((item) => (
                                <Pressable
                                    key={item.label}
                                    style={[styles.sidebarItem, item.active && styles.sidebarItemActive]}
                                    onPress={() => {
                                        setSidebarOpen(false);
                                        if (item.label === 'AI Summaries') router.push('/students/summaries');
                                        else if (item.label === 'Home') router.push('/students/student_dashboard');
                                        else if (item.label === 'My Classes') router.push('/students/student_classes');
                                    }}
                                >
                                    <Text style={styles.sidebarItemIcon}>{item.icon}</Text>
                                    <Text style={[styles.sidebarItemLabel, item.active && styles.sidebarItemLabelActive]}>
                                        {item.label}
                                    </Text>
                                </Pressable>
                            ))}
                            <View style={styles.sidebarDivider} />
                            {SIDEBAR_BOTTOM.map((item) => (
                                <Pressable
                                    key={item.label}
                                    style={[styles.sidebarItem, item.danger && styles.sidebarItemDanger]}
                                    onPress={() => {
                                        if (item.label === 'Logout') {
                                            setSidebarOpen(false);
                                            logout();
                                            router.replace('/students');
                                        }
                                    }}
                                >
                                    <Text style={styles.sidebarItemIcon}>{item.icon}</Text>
                                    <Text style={[styles.sidebarItemLabel, item.danger && styles.sidebarItemLabelDanger]}>
                                        {item.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* ── HEADER ── */}
            <View style={styles.header}>
                <Pressable onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
                    <Text style={styles.menuIcon}>☰</Text>
                </Pressable>
                <View style={styles.headerCenter}>
                    <View style={styles.avatarCircle}>
                        <Text style={{ fontSize: 20 }}>👤</Text>
                    </View>
                    <View>
                        <Text style={styles.headerPortalLabel}>STUDENT PORTAL</Text>
                        <Text style={styles.headerBrand}>Kiety Meet</Text>
                    </View>
                </View>
                <Pressable style={styles.notifBtn} onPress={() => setShowNotifModal(true)}>
                    <Text style={styles.notifIcon}>🔔</Text>
                    {announcements.length > 0 && <View style={styles.notifDot} />}
                </Pressable>
            </View>

            {/* ── MAIN SCROLL ── */}
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Welcome */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)}>
                    <Text style={styles.welcomeTitle}>
                        Welcome back, <Text style={styles.welcomeName}>{user?.fullName || 'Student'}</Text>
                    </Text>
                    <Text style={styles.welcomeSub}>Ready to join your next class?</Text>
                </Animated.View>

                {/* Stats Summary */}
                <Animated.View entering={FadeInDown.duration(500).delay(150)} style={styles.statsSummaryCard}>
                    <View style={styles.statsSummaryLeft}>
                        <Text style={styles.statsSummaryValue}>{joinedCount}</Text>
                        <Text style={styles.statsSummaryLabel}>Joined Classes</Text>
                    </View>
                    <View style={styles.statsSummaryDivider} />
                    <View style={styles.statsSummaryRight}>
                        <Text style={styles.statsSummaryValue}>{announcements.length}</Text>
                        <Text style={styles.statsSummaryLabel}>Alerts</Text>
                    </View>
                </Animated.View>

                {/* ── JOIN CLASS ── */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.joinBox}>
                    <Text style={styles.joinTitle}>🏫  Join a New Class</Text>
                    <Text style={styles.joinDescription}>Enter the class code provided by your teacher to enroll in a new classroom.</Text>
                    <View style={styles.joinRow}>
                        <TextInput
                            style={styles.joinInput}
                            placeholder="Class Code (e.g. AB12CD)"
                            placeholderTextColor={PLACEHOLDER}
                            value={classCode}
                            onChangeText={setClassCode}
                            autoCapitalize="characters"
                        />
                        <Pressable
                            style={[styles.joinBtn, joining && { opacity: 0.6 }]}
                            onPress={handleJoinNow}
                            disabled={joining}
                        >
                            {joining
                                ? <ActivityIndicator color={WHITE} size="small" />
                                : <Text style={styles.joinBtnText}>Join Now</Text>
                            }
                        </Pressable>
                    </View>
                </Animated.View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ── NOTIFICATIONS MODAL ── */}
            <Modal visible={showNotifModal} transparent animationType="slide" onRequestClose={() => setShowNotifModal(false)}>
                <View style={styles.modalOverlay}>
                    <Animated.View entering={FadeInUp} style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Notifications</Text>
                            <Pressable onPress={() => setShowNotifModal(false)} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>✕</Text>
                            </Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {announcements.length === 0 ? (
                                <View style={styles.emptyNotif}>
                                    <Text style={styles.emptyNotifEmoji}>📭</Text>
                                    <Text style={styles.emptyNotifText}>All caught up!</Text>
                                    <Text style={styles.emptyNotifSub}>No new announcements from your teachers.</Text>
                                </View>
                            ) : (
                                announcements.map((anno, idx) => (
                                    <Pressable 
                                        key={idx} 
                                        style={styles.notifItem}
                                        onPress={() => {
                                            setShowNotifModal(false);
                                            router.push({
                                                pathname: '/students/students_meeting_room',
                                                params: {
                                                    classId:     anno.classId,
                                                    className:   anno.className,
                                                    classCode:   anno.classCode,
                                                    teacherName: anno.teacherName,
                                                }
                                            });
                                        }}
                                    >
                                        <View style={styles.notifIconBox}>
                                            <Text style={styles.notifIconSmall}>📢</Text>
                                        </View>
                                        <View style={styles.notifBody}>
                                            <Text style={styles.notifClass}>{anno.className}</Text>
                                            <Text style={styles.notifText} numberOfLines={2}>{anno.text}</Text>
                                            <Text style={styles.notifTime}>{new Date(anno.createdAt).toLocaleDateString()}</Text>
                                        </View>
                                        <Pressable 
                                            style={styles.deleteNotifBtn} 
                                            onPress={() => handleDeleteNotification(idx)}
                                        >
                                            <Text style={styles.deleteNotifTxt}>✕</Text>
                                        </Pressable>
                                        <Text style={styles.notifArrow}>›</Text>
                                    </Pressable>
                                ))
                            )}
                            <View style={{ height: 20 }} />
                            <Pressable 
                                style={styles.modalBottomCloseBtn} 
                                onPress={() => setShowNotifModal(false)}
                            >
                                <Text style={styles.modalBottomCloseTxt}>Close</Text>
                            </Pressable>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>

        </Animated.View>
    );
};

export default StudentDashboard;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
        backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: `${PRIMARY}18`,
    },
    menuBtn: { padding: 8 },
    menuIcon: { fontSize: 22, color: MUTED },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarCircle: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: `${PRIMARY}18`, alignItems: 'center', justifyContent: 'center',
    },
    headerPortalLabel: { fontSize: 9, fontWeight: '800', color: PRIMARY, letterSpacing: 1.5 },
    headerBrand: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    notifBtn: { padding: 8, backgroundColor: `${PRIMARY}10`, borderRadius: 20, position: 'relative' },
    notifIcon: { fontSize: 20 },
    notifDot: {
        position: 'absolute', top: 8, right: 8,
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: PRIMARY, borderWidth: 2, borderColor: WHITE,
    },

    scroll: { paddingHorizontal: 16, paddingTop: 20 },
    welcomeTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
    welcomeName: { color: PRIMARY },
    welcomeSub: { fontSize: 13, color: MUTED, marginBottom: 20 },

    statsSummaryCard: {
        flexDirection: 'row', backgroundColor: WHITE,
        borderRadius: 20, paddingVertical: 20, marginBottom: 24,
        borderWidth: 1, borderColor: `${PRIMARY}15`,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    },
    statsSummaryLeft: { flex: 1, alignItems: 'center' },
    statsSummaryRight: { flex: 1, alignItems: 'center' },
    statsSummaryDivider: { width: 1, height: '60%', backgroundColor: BORDER, alignSelf: 'center' },
    statsSummaryValue: { fontSize: 24, fontWeight: '900', color: PRIMARY },
    statsSummaryLabel: { fontSize: 11, fontWeight: '700', color: MUTED, marginTop: 2, textTransform: 'uppercase' },

    joinBox: {
        backgroundColor: WHITE, borderWidth: 1, borderColor: `${PRIMARY}25`,
        borderRadius: 24, padding: 24, marginBottom: 16,
    },
    joinTitle: { fontSize: 18, fontWeight: '800', color: DARK, marginBottom: 8 },
    joinDescription: { fontSize: 13, color: MUTED, marginBottom: 20, lineHeight: 18 },
    joinRow: { flexDirection: 'row', gap: 10 },
    joinInput: {
        flex: 1, backgroundColor: WHITE, borderRadius: 12,
        paddingHorizontal: 14, height: 48, fontSize: 13, color: '#0F172A',
        borderWidth: 1, borderColor: `${PRIMARY}20`,
    },
    joinBtn: {
        backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 18, height: 48,
        alignItems: 'center', justifyContent: 'center',
    },
    joinBtnText: { color: WHITE, fontWeight: '800', fontSize: 13 },

    sidebarOverlay: { flex: 1, backgroundColor: 'rgba(34,22,16,0.5)', flexDirection: 'row' },
    sidebar: { width: 280, height: '100%', backgroundColor: WHITE },
    sidebarHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, paddingTop: 52, borderBottomWidth: 1, borderBottomColor: `${PRIMARY}10`,
    },
    sidebarLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sidebarLogoBox: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: `${PRIMARY}15`, alignItems: 'center', justifyContent: 'center',
    },
    sidebarLogoText: { fontSize: 16, fontWeight: '900', color: PRIMARY },
    sidebarBrand: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
    sidebarClose: { fontSize: 18, color: MUTED },
    sidebarNav: { flex: 1, padding: 12 },
    sidebarItem: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12,
    },
    sidebarItemActive: { backgroundColor: `${PRIMARY}10` },
    sidebarItemIcon: { fontSize: 18 },
    sidebarItemLabel: { fontSize: 14, fontWeight: '600', color: MUTED },
    sidebarItemLabelActive: { color: PRIMARY, fontWeight: '700' },
    sidebarItemLabelDanger: { color: '#EF4444', fontWeight: '700' },
    sidebarDivider: { height: 1, backgroundColor: `${PRIMARY}05`, marginVertical: 8 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: WHITE, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: 24, height: '75%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 24,
    },
    modalTitle: { fontSize: 22, fontWeight: '900', color: DARK },
    closeBtn: { padding: 4 },
    closeBtnText: { fontSize: 20, color: MUTED },

    notifItem: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    notifIconBox: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: `${PRIMARY}10`, alignItems: 'center', justifyContent: 'center',
    },
    notifIconSmall: { fontSize: 20 },
    notifBody: { flex: 1 },
    notifClass: { fontSize: 12, fontWeight: '800', color: PRIMARY, marginBottom: 2 },
    notifText: { fontSize: 14, color: DARK, fontWeight: '600' },
    notifTime: { fontSize: 10, color: MUTED, marginTop: 4 },
    notifArrow: { fontSize: 22, color: `${PRIMARY}40`, fontWeight: '300' },

    emptyNotif: { alignItems: 'center', paddingTop: 60 },
    emptyNotifEmoji: { fontSize: 60, marginBottom: 16 },
    emptyNotifText: { fontSize: 18, fontWeight: '800', color: DARK, marginBottom: 6 },
    emptyNotifSub: { fontSize: 14, color: MUTED, textAlign: 'center', paddingHorizontal: 40 },
    
    deleteNotifBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#FEE2E2',
        marginLeft: 4,
    },
    deleteNotifTxt: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '900',
    },
    modalBottomCloseBtn: {
        backgroundColor: '#F1F5F9',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        marginHorizontal: 10,
    },
    modalBottomCloseTxt: {
        fontSize: 15,
        fontWeight: '800',
        color: DARK,
    },
});