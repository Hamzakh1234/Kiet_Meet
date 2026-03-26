// app/students/student_classes.jsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, Pressable, ScrollView,
    StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import useStore from '../../store/useStore';
import axios from 'axios';
import { BASE_URL } from '../../config';

import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// ── Constants ──────────────────────────────────────────────
const PRIMARY = '#ec5b13';
const BG      = '#f8f6f6';
const WHITE   = '#FFFFFF';
const DARK    = '#0F172A';
const MUTED   = '#64748B';
const BORDER  = `${PRIMARY}12`;

const API_URL = `${BASE_URL}/classes`;




// ── Class Card ─────────────────────────────────────────────
const ClassCard = ({ item, index, onPress }) => (
    <Animated.View entering={FadeInDown.duration(450).delay(index * 80)}>
        <Pressable style={styles.card} onPress={onPress}>
            <View style={[styles.cardThumb, { backgroundColor: `${PRIMARY}18` }]}>
                <Text style={styles.cardEmoji}>📖</Text>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.cardTopRow}>
                    <Text style={styles.cardName}>{item.className}</Text>
                    <Text style={styles.chevron}>›</Text>
                </View>
                <Text style={styles.cardMeta}>👨‍🏫 {item.teacherName || 'Instructor'}</Text>
            </View>
        </Pressable>
    </Animated.View>
);

// ── Main Screen ────────────────────────────────────────────
export default function StudentClasses() {
    const router         = useRouter();
    const user           = useStore((state) => state.user);
    const [classes,      setClasses]      = useState([]);
    const [loading,      setLoading]      = useState(true);


    useEffect(() => {
        if ((user?._id || user?.id) && user?.role === 'student') fetchClasses();
    }, [user]);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const sid = user?._id || user?.id;
            const response = await axios.get(`${API_URL}/joined-classes/${sid}`);
            setClasses(response.data.classes);
        } catch (error) {
            console.log('Fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Animated.View entering={FadeIn.duration(350)} style={styles.container}>



            {/* ── HEADER ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(50)} style={styles.header}>
                <View style={styles.headerLeft}>
                    <Pressable
                        style={styles.backBtnHeader}
                        onPress={() => router.replace('/students/student_dashboard')}
                    >
                        <Text style={styles.backArrowHeader}>←</Text>
                    </Pressable>

                    <Text style={styles.headerTitle}>My Classes</Text>
                </View>
                <Text style={styles.classCount}>{classes.length} Joined</Text>
            </Animated.View>

            {/* ── CLASSES LIST ── */}
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <ActivityIndicator color={PRIMARY} style={{ marginTop: 40 }} />
                ) : classes.length === 0 ? (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>🏫</Text>
                        <Text style={styles.emptyTitle}>No classes yet</Text>
                        <Text style={styles.emptySub}>Enter a class code on the dashboard to join your first classroom.</Text>
                        <Pressable
                            style={styles.goBtn}
                            onPress={() => router.replace('/students/student_dashboard')}
                        >
                            <Text style={styles.goBtnText}>Go to Dashboard</Text>
                        </Pressable>
                    </Animated.View>
                ) : (
                    classes.map((item, index) => (
                        <ClassCard
                            key={item._id || index}
                            item={item}
                            index={index}
                            onPress={() => router.push({
                                pathname: '/students/students_meeting_room',
                                params: {
                                    classId:     item._id,
                                    className:   item.className,
                                    classCode:   item.classCode,
                                    teacherName: item.teacherName,
                                }
                            })}
                        />
                    ))
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
        backgroundColor: `${BG}CC`,
        borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    backBtnHeader: { padding: 8, marginRight: -4 },
    backArrowHeader: { fontSize: 24, color: DARK, fontWeight: '600' },
    menuBtn: { padding: 8 },
    menuIcon: { fontSize: 22, color: DARK },
    headerTitle: { fontSize: 20, fontWeight: '800', color: DARK, letterSpacing: -0.3 },
    classCount: { fontSize: 13, fontWeight: '700', color: PRIMARY },

    scroll: { paddingHorizontal: 16, paddingTop: 16 },

    card: {
        backgroundColor: WHITE, borderRadius: 16,
        borderWidth: 1, borderColor: `${PRIMARY}08`,
        overflow: 'hidden', marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    cardThumb: {
        width: '100%', aspectRatio: 21 / 9,
        alignItems: 'center', justifyContent: 'center',
    },
    cardEmoji: { fontSize: 46 },
    cardBody: { padding: 16 },
    cardTopRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 4,
    },
    cardName: { fontSize: 17, fontWeight: '800', color: DARK },
    chevron: { fontSize: 22, color: `${PRIMARY}50`, fontWeight: '300' },
    cardMeta: { fontSize: 13, color: MUTED, marginTop: 1 },

    emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: DARK, marginBottom: 8 },
    emptySub: { fontSize: 14, color: MUTED, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    goBtn: { backgroundColor: PRIMARY, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
    goBtnText: { color: WHITE, fontSize: 14, fontWeight: '700' },

    sidebarOverlay: { flex: 1, backgroundColor: 'rgba(34,22,16,0.5)', flexDirection: 'row' },
    sidebar: {
        width: 280, height: '100%', backgroundColor: WHITE,
        shadowColor: '#000', shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
    },
    sidebarHeader: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20, paddingTop: 52,
        borderBottomWidth: 1, borderBottomColor: `${PRIMARY}12`,
    },
    sidebarLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sidebarLogoBox: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: `${PRIMARY}15`,
        alignItems: 'center', justifyContent: 'center',
    },
    sidebarLogoText: { fontSize: 16, fontWeight: '900', color: PRIMARY },
    sidebarBrand: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
    sidebarClose: { fontSize: 18, color: MUTED },
    sidebarNav: { flex: 1, padding: 12 },
    sidebarItem: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 14, paddingVertical: 13,
        borderRadius: 12, marginBottom: 2,
    },
    sidebarItemActive: { backgroundColor: `${PRIMARY}10` },
    sidebarItemIcon: { fontSize: 18 },
    sidebarItemLabel: { fontSize: 14, fontWeight: '600', color: MUTED },
    sidebarItemLabelActive: { color: PRIMARY, fontWeight: '700' },
    sidebarItemLabelDanger: { color: '#EF4444', fontWeight: '700' },
    sidebarDivider: { height: 1, backgroundColor: BORDER, marginVertical: 8, marginHorizontal: 14 },
});
