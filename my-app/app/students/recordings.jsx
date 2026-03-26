// app/students/recording.jsx
import React, { useState } from 'react';
import {
    View, Text, TextInput, Pressable,
    ScrollView, StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// ── Constants ──────────────────────────────────────────────
const PRIMARY     = '#ec5b13';
const BG          = '#f8f6f6';
const WHITE       = '#FFFFFF';
const BORDER      = '#E2E8F0';
const MUTED       = '#64748B';
const PLACEHOLDER = '#94A3B8';

// ── Data ──────────────────────────────────────────────────
const FILTERS = ['All Subjects', 'Computer Science', 'Mathematics', 'Physics'];

const LECTURES = [
    {
        id: '1',
        code: 'CS401',
        title: 'Advanced Algorithms',
        instructor: 'Dr. Sarah Jenkins',
        topic: 'Unit 4: Graph Theory',
        date: 'Oct 24, 2023',
        time: '10:30 AM',
        views: '1.2k',
        duration: '45:12',
        emoji: '💻',
        bg: '#1e293b',
    },
    {
        id: '2',
        code: 'MATH302',
        title: 'Complex Variables',
        instructor: 'Prof. Michael Chen',
        topic: 'Cauchy-Riemann Eq.',
        date: 'Oct 22, 2023',
        time: '02:15 PM',
        views: '856',
        duration: '58:40',
        emoji: '📐',
        bg: '#1e3a5f',
    },
    {
        id: '3',
        code: 'CHEM201',
        title: 'Organic Chemistry II',
        instructor: 'Dr. Elena Rodriguez',
        topic: 'Reaction Mechanisms',
        date: 'Oct 21, 2023',
        time: '09:00 AM',
        views: '2.4k',
        duration: '52:15',
        emoji: '🧪',
        bg: '#1a3a2a',
    },
    {
        id: '4',
        code: 'IT105',
        title: 'Intro to Networking',
        instructor: 'Prof. Alan Turing',
        topic: 'TCP/IP Basics',
        date: 'Oct 19, 2023',
        time: '11:45 AM',
        views: '3.1k',
        duration: '38:22',
        emoji: '🖧',
        bg: '#1a2035',
    },
];

const BOTTOM_TABS = [
    { key: 'home',       icon: '🏠', label: 'Home' },
    { key: 'schedule',   icon: '📅', label: 'Schedule' },
    { key: 'recordings', icon: '🎬', label: 'Recordings', active: true },
    { key: 'profile',    icon: '👤', label: 'Profile' },
];

// ── Lecture Card ───────────────────────────────────────────
const LectureCard = ({ item, index }) => (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 80)}>
        <Pressable style={styles.card}>
            {/* Thumbnail */}
            <View style={[styles.thumbnail, { backgroundColor: item.bg }]}>
                <Text style={styles.thumbEmoji}>{item.emoji}</Text>
                {/* Play button overlay */}
                <View style={styles.playOverlay}>
                    <View style={styles.playBtn}>
                        <Text style={styles.playIcon}>▶</Text>
                    </View>
                </View>
                {/* Duration badge */}
                <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{item.duration}</Text>
                </View>
            </View>

            {/* Info */}
            <View style={styles.cardInfo}>
                <View style={styles.cardTopRow}>
                    <View style={styles.codeBadge}>
                        <Text style={styles.codeText}>{item.code}</Text>
                    </View>
                    <Text style={styles.dateText}>{item.date}</Text>
                </View>

                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>
                    {item.instructor} • {item.topic}
                </Text>

                <View style={styles.cardMeta}>
                    <Text style={styles.metaText}>🕐 {item.time}</Text>
                    <Text style={styles.metaText}>👁 {item.views} views</Text>
                </View>
            </View>
        </Pressable>
    </Animated.View>
);

// ── Main Screen ────────────────────────────────────────────
const RecordingScreen = () => {
    const router = useRouter();
    const [search, setSearch]           = useState('');
    const [activeFilter, setActiveFilter] = useState('All Subjects');
    const [activeTab, setActiveTab]     = useState('recordings');

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>

            {/* ── HEADER ── */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Pressable
                        onPress={() => router.replace('/students/student_dashboard')}
                        style={styles.backBtn}
                    >
                        <Text style={styles.backArrow}>←</Text>
                    </Pressable>
                    <View>
                        <Text style={styles.headerTitle}>Recorded Lectures</Text>
                        <Text style={styles.headerSub}>Kiety Meet Student Dashboard</Text>
                    </View>
                </View>

                <View style={styles.headerRight}>
                    <Pressable style={styles.notifBtn}>
                        <Text style={{ fontSize: 18 }}>🔔</Text>
                    </Pressable>
                    <View style={styles.avatarCircle}>
                        <Text style={{ fontSize: 18 }}>👤</Text>
                    </View>
                </View>
            </View>

            {/* ── SEARCH + FILTERS (sticky) ── */}
            <View style={styles.stickyBar}>
                {/* Search */}
                <View style={styles.searchWrapper}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search course, ID or instructor..."
                        placeholderTextColor={PLACEHOLDER}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Filter Pills */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    {FILTERS.map((f) => (
                        <Pressable
                            key={f}
                            onPress={() => setActiveFilter(f)}
                            style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
                        >
                            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                                {f}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* ── LECTURE LIST ── */}
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionLabel}>Recent Recordings</Text>

                {LECTURES.map((item, index) => (
                    <LectureCard key={item.id} item={item} index={index} />
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ── BOTTOM NAV ── */}
            <View style={styles.bottomNav}>
                {BOTTOM_TABS.map((tab) => (
                    <Pressable
                        key={tab.key}
                        style={styles.tabItem}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={styles.tabIcon}>{tab.icon}</Text>
                        <Text style={[
                            styles.tabLabel,
                            (activeTab === tab.key || tab.active) && styles.tabLabelActive,
                        ]}>
                            {tab.label}
                        </Text>
                        {(activeTab === tab.key || tab.active) && (
                            <View style={styles.tabDot} />
                        )}
                    </Pressable>
                ))}
            </View>

        </Animated.View>
    );
};

export default RecordingScreen;

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
        backgroundColor: WHITE,
        borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: {
        width: 38, height: 38,
        alignItems: 'center', justifyContent: 'center',
    },
    backArrow: { fontSize: 22, color: MUTED },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    headerSub: { fontSize: 11, color: MUTED, fontWeight: '500' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    notifBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: `${PRIMARY}12`,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarCircle: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#E2E8F0',
        borderWidth: 2, borderColor: `${PRIMARY}30`,
        alignItems: 'center', justifyContent: 'center',
    },

    // Sticky search/filter bar
    stickyBar: {
        backgroundColor: 'rgba(248,246,246,0.95)',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
        borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    searchWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: WHITE,
        borderRadius: 14, borderWidth: 1, borderColor: BORDER,
        paddingHorizontal: 14, height: 48, marginBottom: 10,
    },
    searchIcon: { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },

    filterScroll: { gap: 8, paddingVertical: 2 },
    filterPill: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 50, backgroundColor: WHITE,
        borderWidth: 1, borderColor: BORDER,
    },
    filterPillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
    filterText: { fontSize: 12, fontWeight: '600', color: MUTED },
    filterTextActive: { color: WHITE },

    // Scroll
    scroll: { paddingHorizontal: 16, paddingTop: 16 },
    sectionLabel: {
        fontSize: 10, fontWeight: '800', letterSpacing: 1.5,
        color: MUTED, textTransform: 'uppercase', marginBottom: 14,
    },

    // Lecture Card
    card: {
        flexDirection: 'row', gap: 14,
        backgroundColor: WHITE,
        borderRadius: 16, borderWidth: 1, borderColor: BORDER,
        padding: 14, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },

    // Thumbnail
    thumbnail: {
        width: 96, height: 96,
        borderRadius: 12, overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, position: 'relative',
    },
    thumbEmoji: { fontSize: 36, opacity: 0.6 },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    playBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: PRIMARY,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
    },
    playIcon: { color: WHITE, fontSize: 13, marginLeft: 2 },
    durationBadge: {
        position: 'absolute', bottom: 6, right: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
    },
    durationText: { color: WHITE, fontSize: 9, fontWeight: '700' },

    // Card Info
    cardInfo: { flex: 1, justifyContent: 'space-between' },
    cardTopRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 4,
    },
    codeBadge: {
        backgroundColor: `${PRIMARY}12`,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    },
    codeText: { fontSize: 9, fontWeight: '800', color: PRIMARY, textTransform: 'uppercase' },
    dateText: { fontSize: 9, color: MUTED, fontWeight: '500' },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 3 },
    cardSub: { fontSize: 12, color: MUTED, marginBottom: 8 },
    cardMeta: { flexDirection: 'row', gap: 12 },
    metaText: { fontSize: 11, color: MUTED },

    // Bottom Nav
    bottomNav: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderTopWidth: 1, borderTopColor: BORDER,
        paddingTop: 10, paddingBottom: 24,
        paddingHorizontal: 8,
    },
    tabItem: { flex: 1, alignItems: 'center', gap: 3 },
    tabIcon: { fontSize: 20 },
    tabLabel: {
        fontSize: 9, fontWeight: '700',
        color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    tabLabelActive: { color: PRIMARY },
    tabDot: {
        width: 4, height: 4, borderRadius: 2,
        backgroundColor: PRIMARY, marginTop: 1,
    },
});