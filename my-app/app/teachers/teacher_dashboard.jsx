// app/teachers/teacher_dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, Pressable, ScrollView,
    StyleSheet, Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import useStore from '../../store/useStore';
import axios from 'axios';
import { BASE_URL } from '../../config';

import Animated, {
    FadeIn, FadeInDown, FadeInUp,
    useSharedValue, useAnimatedStyle,
    withRepeat, withTiming, withSequence,
} from 'react-native-reanimated';

// ── Constants ──────────────────────────────────────────────
const PRIMARY = '#ec5b13';
const BG      = '#f8f6f6';
const WHITE   = '#FFFFFF';
const DARK    = '#0F172A';
const MUTED   = '#64748B';
const BORDER  = `${PRIMARY}18`;
const LIGHT   = `${PRIMARY}08`;

const API_URL = `${BASE_URL}/classes`;


// ── Sidebar Nav Items ──────────────────────────────────────
const NAV_ITEMS = [
    { icon: '🏠', label: 'Dashboard', active: true },
];

// ── Bottom Tabs ────────────────────────────────────────────
const TABS = [
    { key: 'classes',  icon: '📖', label: 'Classes'  },
    { key: 'profile',  icon: '👤', label: 'Profile'  },
    { key: 'settings', icon: '⚙️', label: 'Settings'  },
    { key: 'logout',   icon: '🚪', label: 'Logout', danger: true },
];

// ── Ping Animation ─────────────────────────────────────────
const PingDot = () => {
    const scale   = useSharedValue(1);
    const opacity = useSharedValue(0.5);

    useEffect(() => {
        scale.value = withRepeat(
            withSequence(withTiming(2.2, { duration: 900 }), withTiming(1, { duration: 0 })),
            -1, false,
        );
        opacity.value = withRepeat(
            withSequence(withTiming(0, { duration: 900 }), withTiming(0.5, { duration: 0 })),
            -1, false,
        );
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return <Animated.View style={[styles.pingRing, animStyle]} />;
};

// ── Main Screen ────────────────────────────────────────────
const TeacherDashboard = () => {
    const router = useRouter();
    const user   = useStore((state) => state.user);
    const logout = useStore((state) => state.logout);

    const [activeTab,            setActiveTab]            = useState('home');
    const [sidebarOpen,          setSidebarOpen]          = useState(false);
    const [showCreateClassModal, setShowCreateClassModal] = useState(false);
    const [className,            setClassName]            = useState('');
    const [classLimit,           setClassLimit]           = useState('');
    const [loading,              setLoading]              = useState(false);
    const [classes,              setClasses]              = useState([]);
    const [fetchingClasses,      setFetchingClasses]      = useState(true);

    // ── Load teacher's classes on mount ───────────────────
    useEffect(() => {
        if ((user?._id || user?.id) && user?.role === 'teacher') fetchClasses();
    }, [user]);

    const fetchClasses = async () => {
        try {
            setFetchingClasses(true);
            const teacherId = user?._id || user?.id;
            const response = await axios.get(`${API_URL}/my-classes/${teacherId}`);
            setClasses(response.data.classes);
        } catch (error) {
            console.log('Fetch classes error:', error);
        } finally {
            setFetchingClasses(false);
        }
    };

    // ── Create Class ───────────────────────────────────────
    const handleCreateClass = async () => {
        if (!className.trim()) {
            Alert.alert('❌ Error', 'Class name is required');
            return;
        }
        if (!classLimit.trim() || isNaN(classLimit) || Number(classLimit) <= 0) {
            Alert.alert('❌ Error', 'Enter a valid class limit');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/create`, {
                className:   className.trim(),
                limit:       Number(classLimit),
                teacherId:   user?._id || user?.id,
                teacherName: user.fullName,
            });

            setClasses((prev) => [...prev, response.data.class]);
            Alert.alert('✅ Class Created!', `Class Code: ${response.data.class.classCode}`);
            setShowCreateClassModal(false);
            setClassName('');
            setClassLimit('');

        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to create class';
            Alert.alert('❌ Error', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Animated.View entering={FadeIn.duration(350)} style={styles.container}>

            {/* ── SIDEBAR MODAL ── */}
            <Modal visible={sidebarOpen} transparent animationType="fade" onRequestClose={() => setSidebarOpen(false)}>
                <Pressable style={styles.sidebarOverlay} onPress={() => setSidebarOpen(false)}>
                    <Animated.View entering={FadeInDown.duration(280)} style={styles.sidebar}>

                        <View style={styles.sidebarTop}>
                            <View style={styles.sidebarBrandRow}>
                                <View style={styles.sidebarLogoBox}>
                                    <Text style={styles.sidebarLogoText}>K</Text>
                                </View>
                                <Text style={styles.sidebarBrandText}>Kiety Meet</Text>
                            </View>
                            <Pressable onPress={() => setSidebarOpen(false)}>
                                <Text style={styles.sidebarCloseX}>✕</Text>
                            </Pressable>
                        </View>

                        <ScrollView style={{ flex: 1, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
                            {NAV_ITEMS.map((item) => (
                                <Pressable
                                    key={item.label}
                                    style={[styles.sidebarItem, item.active && styles.sidebarItemActive]}
                                    onPress={() => setSidebarOpen(false)}
                                >
                                    <Text style={styles.sidebarItemIcon}>{item.icon}</Text>
                                    <Text style={[styles.sidebarItemLabel, item.active && styles.sidebarItemLabelActive]}>
                                        {item.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        <View style={styles.sidebarFooter}>
                            <View style={styles.sidebarDivider} />
                            <Pressable
                                style={styles.sidebarItem}
                                onPress={() => { 
                                    setSidebarOpen(false); 
                                    logout();
                                    router.replace('/teachers/'); 
                                }}
                            >
                                <Text style={styles.sidebarItemIcon}>🚪</Text>
                                <Text style={styles.sidebarLogoutLabel}>Logout</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* ── CREATE CLASS MODAL ── */}
            <Modal visible={showCreateClassModal} transparent animationType="fade" onRequestClose={() => setShowCreateClassModal(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowCreateClassModal(false)}>
                    <Animated.View entering={FadeInDown.duration(280)} style={styles.createClassModal}>
                        <Text style={styles.modalTitle}>Create a Classroom</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Name of the class"
                            placeholderTextColor="#888"
                            value={className}
                            onChangeText={setClassName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Student limit (e.g. 30)"
                            placeholderTextColor="#888"
                            keyboardType="numeric"
                            value={classLimit}
                            onChangeText={setClassLimit}
                        />

                        <Pressable
                            style={[styles.createBtn, loading && { opacity: 0.6 }]}
                            onPress={handleCreateClass}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color={WHITE} />
                                : <Text style={styles.createBtnText}>Create Class</Text>
                            }
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* ── HEADER ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(50)} style={styles.header}>
                <Pressable style={styles.headerLeft} onPress={() => setSidebarOpen(true)}>
                    <View style={styles.menuIconBox}>
                        <Text style={styles.menuIcon}>☰</Text>
                    </View>
                    <Text style={styles.headerBrand}>Kiety Meet</Text>
                </Pressable>
                <View style={styles.avatarBox}>
                    <Text style={{ fontSize: 20 }}>👨‍🏫</Text>
                </View>
            </Animated.View>

            {/* ── MAIN SCROLL ── */}
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.welcomeSection}>
                    <Text style={styles.welcomeTitle}>Welcome back, {user?.fullName || 'Teacher'} 👋</Text>
                </Animated.View>


                {/* Simplified Plus Button Section */}
                {fetchingClasses ? (
                    <ActivityIndicator color={PRIMARY} style={{ marginTop: 40 }} />
                ) : (
                    <Animated.View entering={FadeInDown.duration(500).delay(220)} style={styles.emptyCard}>
                        <View style={styles.plusWrap}>
                            <Pressable style={styles.plusBtn} onPress={() => setShowCreateClassModal(true)}>
                                <Text style={styles.plusIcon}>＋</Text>
                            </Pressable>
                            <View style={styles.pingContainer}>
                                <PingDot />
                                <View style={styles.pingDotCore} />
                            </View>
                        </View>
                        <Text style={styles.emptyTitle}>
                            {classes.length === 0 ? "Create your first class" : "Create more classes"}
                        </Text>
                        <Text style={styles.emptySub}>
                            {classes.length === 0 
                                ? "Start building your digital classroom. Invite students once your class is set up."
                                : "If you like the platform, you may create more classes."}
                        </Text>
                    </Animated.View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ── BOTTOM NAV ── */}
            <Animated.View entering={FadeInUp.duration(500).delay(350)} style={styles.bottomNav}>
                {TABS.map((tab) => (
                    <Pressable
                        key={tab.key}
                        style={styles.tabItem}
                        onPress={() => {
                            if (tab.key === 'logout') {
                                logout();
                                router.replace('/teachers/');
                            } else if (tab.key === 'classes') {
                                router.push('/teachers/teachers_classes');
                            } else {
                                setActiveTab(tab.key);
                            }
                        }}
                    >
                        <Text style={[styles.tabIcon, activeTab === tab.key && styles.tabIconActive]}>
                            {tab.icon}
                        </Text>
                        <Text style={[
                            styles.tabLabel,
                            activeTab === tab.key && styles.tabLabelActive,
                            tab.danger && styles.tabLabelDanger,
                        ]}>
                            {tab.label}
                        </Text>
                    </Pressable>
                ))}
            </Animated.View>

        </Animated.View>
    );
};

export default TeacherDashboard;

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },

    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
        backgroundColor: WHITE,
        borderBottomWidth: 1, borderBottomColor: BORDER,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    menuIconBox: { padding: 8, borderRadius: 10, backgroundColor: LIGHT },
    menuIcon: { fontSize: 18, color: PRIMARY },
    headerBrand: { fontSize: 19, fontWeight: '800', color: DARK, letterSpacing: -0.3 },
    avatarBox: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: `${PRIMARY}22`,
        borderWidth: 2, borderColor: `${PRIMARY}35`,
        alignItems: 'center', justifyContent: 'center',
    },

    scroll: { paddingHorizontal: 16, paddingTop: 22 },

    welcomeSection: { marginBottom: 20 },
    welcomeTitle: { fontSize: 22, fontWeight: '800', color: DARK, letterSpacing: -0.3 },
    welcomeSub: { fontSize: 14, color: MUTED, marginTop: 4 },

    actionCard: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: LIGHT,
        borderWidth: 1, borderColor: `${PRIMARY}25`,
        borderRadius: 16, padding: 18,
        marginBottom: 16, gap: 12,
    },
    actionCardTitle: { fontSize: 15, fontWeight: '800', color: DARK, marginBottom: 3 },
    actionCardSub: { fontSize: 12, color: MUTED },
    instantBtn: {
        backgroundColor: PRIMARY, borderRadius: 10,
        paddingHorizontal: 16, paddingVertical: 11,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    instantBtnText: { color: WHITE, fontSize: 12, fontWeight: '800' },

    emptyCard: {
        alignItems: 'center',
        borderWidth: 2, borderStyle: 'dashed',
        borderColor: `${PRIMARY}25`, borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.55)',
        padding: 36, marginBottom: 16,
    },
    plusWrap: {
        position: 'relative', alignItems: 'center',
        justifyContent: 'center', marginBottom: 28,
    },
    plusBtn: {
        width: 88, height: 88, borderRadius: 20,
        backgroundColor: PRIMARY,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
    },
    plusIcon: { color: WHITE, fontSize: 46, fontWeight: '100', lineHeight: 52 },
    pingContainer: {
        position: 'absolute', bottom: -6, right: -6,
        width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
    },
    pingDotCore: {
        position: 'absolute', width: 14, height: 14,
        borderRadius: 7, backgroundColor: `${PRIMARY}30`,
    },
    pingRing: {
        position: 'absolute', width: 14, height: 14,
        borderRadius: 7, backgroundColor: `${PRIMARY}25`,
    },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: DARK, marginBottom: 10, textAlign: 'center' },
    emptySub: { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 22, maxWidth: 290 },

    classesHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12,
    },
    classesTitle: { fontSize: 17, fontWeight: '800', color: DARK },
    addClassBtn: {
        backgroundColor: PRIMARY, borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    addClassBtnText: { color: WHITE, fontSize: 12, fontWeight: '700' },
    classCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: WHITE,
        borderRadius: 14, borderWidth: 1, borderColor: BORDER,
        padding: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    classCardLeft: {
        width: 48, height: 48, borderRadius: 12,
        backgroundColor: LIGHT,
        alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    classCardEmoji: { fontSize: 24 },
    classCardInfo: { flex: 1 },
    classCardName: { fontSize: 15, fontWeight: '800', color: DARK, marginBottom: 3 },
    classCardCode: { fontSize: 12, color: PRIMARY, fontWeight: '700', marginBottom: 2 },
    classCardLimit: { fontSize: 11, color: MUTED },
    classCardArrow: { fontSize: 24, color: MUTED },

    statsRow: {
        flexDirection: 'row', justifyContent: 'space-around',
        paddingVertical: 10, marginTop: 16, opacity: 0.6,
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 26, fontWeight: '900', color: PRIMARY },
    statLabel: {
        fontSize: 9, fontWeight: '800', color: MUTED,
        textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 3,
    },

    sidebarOverlay: {
        flex: 1, backgroundColor: 'rgba(34,22,16,0.5)', flexDirection: 'row',
    },
    sidebar: {
        width: 272, height: '100%', backgroundColor: WHITE,
        shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.15, shadowRadius: 20, elevation: 20,
    },
    sidebarTop: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    sidebarBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sidebarLogoBox: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: LIGHT, alignItems: 'center', justifyContent: 'center',
    },
    sidebarLogoText: { fontSize: 16, fontWeight: '900', color: PRIMARY },
    sidebarBrandText: { fontSize: 16, fontWeight: '800', color: DARK },
    sidebarCloseX: { fontSize: 18, color: MUTED },
    sidebarItem: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 16, paddingVertical: 13,
        marginHorizontal: 8, marginVertical: 2, borderRadius: 12,
    },
    sidebarItemActive: { backgroundColor: PRIMARY },
    sidebarItemIcon: { fontSize: 18 },
    sidebarItemLabel: { fontSize: 14, fontWeight: '600', color: MUTED },
    sidebarItemLabelActive: { color: WHITE, fontWeight: '700' },
    sidebarFooter: { paddingBottom: 24 },
    sidebarDivider: {
        height: 1, backgroundColor: '#E2E8F0',
        marginVertical: 8, marginHorizontal: 16,
    },
    sidebarLogoutLabel: { fontSize: 14, fontWeight: '700', color: '#EF4444' },

    bottomNav: {
        flexDirection: 'row', backgroundColor: WHITE,
        borderTopWidth: 1, borderTopColor: BORDER,
        paddingTop: 10, paddingBottom: 24, paddingHorizontal: 8,
    },
    tabItem: { flex: 1, alignItems: 'center', gap: 3 },
    tabIcon: { fontSize: 22, opacity: 0.45 },
    tabIconActive: { opacity: 1 },
    tabLabel: {
        fontSize: 9, fontWeight: '700', color: MUTED,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    tabLabelActive: { color: PRIMARY },
    tabLabelDanger: { color: '#EF4444', opacity: 1 },

    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', alignItems: 'center',
    },
    createClassModal: {
        width: '85%', backgroundColor: WHITE,
        borderRadius: 16, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
    },
    modalTitle: {
        fontSize: 18, fontWeight: '800', color: DARK,
        marginBottom: 16, textAlign: 'center',
    },
    input: {
        borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 12,
        marginBottom: 12, fontSize: 14, color: DARK,
    },
    createBtn: {
        backgroundColor: PRIMARY, borderRadius: 10,
        paddingVertical: 14, alignItems: 'center', marginTop: 4,
    },
    createBtnText: { color: WHITE, fontSize: 15, fontWeight: '700' },
});