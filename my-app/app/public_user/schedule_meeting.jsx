// app/public_user/schedule_meeting.jsx
import React, { useState } from 'react';
import {
    View, Text, TextInput, Pressable,
    ScrollView, StyleSheet, ToastAndroid, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';

// ── Constants ──────────────────────────────────────────────
const PRIMARY     = '#ec5b13';
const BG          = '#f8f6f6';
const WHITE       = '#FFFFFF';
const BORDER      = '#E2E8F0';
const MUTED       = '#64748B';
const PLACEHOLDER = '#94A3B8';

// ── Helpers ────────────────────────────────────────────────
const DAYS    = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS  = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDay    = (year, month) => new Date(year, month, 1).getDay();

// ── Show Toast ─────────────────────────────────────────────
const showToast = (msg) => {
    if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
        Alert.alert('✅ Success', msg);
    }
};

// ── Main Screen ────────────────────────────────────────────
const ScheduleMeeting = () => {
    const router = useRouter();

    const today = new Date();
    const [title,       setTitle]       = useState('');
    const [startTime,   setStartTime]   = useState('10:00 AM');
    const [endTime,     setEndTime]     = useState('11:30 AM');
    const [reminder,    setReminder]    = useState(true);
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const [viewMonth,   setViewMonth]   = useState(today.getMonth());
    const [viewYear,    setViewYear]    = useState(today.getFullYear());

    const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
    const firstDaySlot = getFirstDay(viewYear, viewMonth);

    const handleSchedule = () => {
        if (!title.trim()) {
            showToast('Please enter a meeting title');
            return;
        }
        showToast('Meeting scheduled successfully!');
        setTimeout(() => router.replace('/public_user/'), 800);
    };

    // Build calendar grid
    const calCells = [];
    // Previous month filler
    const prevMonthDays = getDaysInMonth(viewYear, viewMonth - 1);
    for (let i = firstDaySlot - 1; i >= 0; i--) {
        calCells.push({ day: prevMonthDays - i, filler: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        calCells.push({ day: d, filler: false });
    }

    return (
        <Animated.View entering={FadeIn.duration(300)} style={styles.overlay}>

            {/* Tap outside to go back */}
            <Pressable style={styles.backdrop} onPress={() => router.replace('/public_user/')} />

            {/* ── SHEET ── */}
            <Animated.View entering={SlideInUp.duration(400).springify()} style={styles.sheet}>

                {/* Drag handle */}
                <View style={styles.dragHandle} />

                {/* Decorative bg icon */}
                <View style={styles.decorIcon}>
                    <Text style={styles.decorEmoji}>🎓</Text>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── HEADER ── */}
                    <View style={styles.header}>
                        <Pressable
                            style={styles.backBtn}
                            onPress={() => router.replace('/public_user/')}
                        >
                            <Text style={styles.backArrow}>←</Text>
                        </Pressable>
                        <Text style={styles.headerTitle}>Schedule Meeting</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* ── HERO TEXT ── */}
                    <Animated.View entering={FadeInDown.duration(400).delay(100)}>
                        <Text style={styles.heroTitle}>Kiety Meet</Text>
                        <Text style={styles.heroSub}>Create a new academic session</Text>
                    </Animated.View>

                    {/* ── MEETING TITLE ── */}
                    <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.fieldGroup}>
                        <Text style={styles.fieldLabel}>Meeting Title</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="e.g. Thesis Discussion"
                            placeholderTextColor={PLACEHOLDER}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </Animated.View>

                    {/* ── CALENDAR ── */}
                    <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.calCard}>

                        {/* Month Nav */}
                        <View style={styles.calHeader}>
                            <Pressable
                                style={styles.calNavBtn}
                                onPress={() => {
                                    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
                                    else setViewMonth(m => m - 1);
                                }}
                            >
                                <Text style={styles.calNavArrow}>‹</Text>
                            </Pressable>
                            <Text style={styles.calMonthLabel}>
                                {MONTHS[viewMonth]} {viewYear}
                            </Text>
                            <Pressable
                                style={styles.calNavBtn}
                                onPress={() => {
                                    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
                                    else setViewMonth(m => m + 1);
                                }}
                            >
                                <Text style={styles.calNavArrow}>›</Text>
                            </Pressable>
                        </View>

                        {/* Day labels */}
                        <View style={styles.calDayRow}>
                            {DAYS.map(d => (
                                <Text key={d} style={styles.calDayLabel}>{d}</Text>
                            ))}
                        </View>

                        {/* Date grid */}
                        <View style={styles.calGrid}>
                            {calCells.map((cell, i) => (
                                <Pressable
                                    key={i}
                                    style={[
                                        styles.calCell,
                                        !cell.filler && selectedDay === cell.day && styles.calCellActive,
                                    ]}
                                    onPress={() => !cell.filler && setSelectedDay(cell.day)}
                                    disabled={cell.filler}
                                >
                                    <Text style={[
                                        styles.calCellText,
                                        cell.filler && styles.calCellFiller,
                                        !cell.filler && selectedDay === cell.day && styles.calCellTextActive,
                                    ]}>
                                        {cell.day}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </Animated.View>

                    {/* ── TIME ROW ── */}
                    <Animated.View entering={FadeInDown.duration(400).delay(250)} style={styles.timeRow}>
                        <View style={styles.timeField}>
                            <Text style={styles.fieldLabel}>Starts at</Text>
                            <View style={styles.timeInputWrapper}>
                                <TextInput
                                    style={styles.timeInput}
                                    value={startTime}
                                    onChangeText={setStartTime}
                                />
                                <Text style={styles.timeIcon}>🕐</Text>
                            </View>
                        </View>
                        <View style={styles.timeField}>
                            <Text style={styles.fieldLabel}>Ends at</Text>
                            <View style={styles.timeInputWrapper}>
                                <TextInput
                                    style={styles.timeInput}
                                    value={endTime}
                                    onChangeText={setEndTime}
                                />
                                <Text style={styles.timeIcon}>🕐</Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* ── REMINDER TOGGLE ── */}
                    <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.reminderRow}>
                        <View style={styles.reminderIconBox}>
                            <Text style={{ fontSize: 16 }}>🔔</Text>
                        </View>
                        <Text style={styles.reminderText}>Remind participants 15m before</Text>
                        <Pressable
                            style={[styles.toggle, reminder && styles.toggleOn]}
                            onPress={() => setReminder(!reminder)}
                        >
                            <View style={[styles.toggleThumb, reminder && styles.toggleThumbOn]} />
                        </Pressable>
                    </Animated.View>

                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* ── FOOTER BUTTON ── */}
                <View style={styles.footer}>
                    <Pressable style={styles.scheduleBtn} onPress={handleSchedule}>
                        <Text style={styles.scheduleBtnIcon}>📅</Text>
                        <Text style={styles.scheduleBtnText}>Schedule Meeting</Text>
                    </Pressable>
                </View>

            </Animated.View>
        </Animated.View>
    );
};

export default ScheduleMeeting;

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    // Full screen overlay
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },

    // Bottom sheet
    sheet: {
        backgroundColor: BG,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '95%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 20,
    },
    dragHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: '#CBD5E1',
        alignSelf: 'center', marginTop: 10, marginBottom: 4,
    },
    decorIcon: {
        position: 'absolute', top: 16, right: 16,
        opacity: 0.08, zIndex: 0,
    },
    decorEmoji: { fontSize: 80 },

    scroll: { paddingHorizontal: 20, paddingBottom: 20 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: WHITE,
        borderWidth: 1, borderColor: BORDER,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    },
    backArrow: { fontSize: 20, color: MUTED },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },

    // Hero
    heroTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
    heroSub: { fontSize: 14, color: MUTED, fontWeight: '500', marginBottom: 24 },

    // Field
    fieldGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8, marginLeft: 2 },
    textInput: {
        backgroundColor: WHITE,
        borderRadius: 14, paddingHorizontal: 16,
        height: 54, fontSize: 14, color: '#0F172A',
        borderWidth: 1, borderColor: BORDER,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },

    // Calendar
    calCard: {
        backgroundColor: WHITE,
        borderRadius: 20, padding: 16,
        borderWidth: 1, borderColor: BORDER,
        marginBottom: 20,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
    },
    calHeader: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 14,
    },
    calNavBtn: { padding: 4 },
    calNavArrow: { fontSize: 24, color: PRIMARY, fontWeight: '300' },
    calMonthLabel: { fontSize: 15, fontWeight: '800', color: '#0F172A' },

    calDayRow: {
        flexDirection: 'row', marginBottom: 6,
    },
    calDayLabel: {
        flex: 1, textAlign: 'center',
        fontSize: 9, fontWeight: '800',
        color: MUTED, textTransform: 'uppercase', letterSpacing: 1,
    },

    calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calCell: {
        width: `${100 / 7}%`, height: 40,
        alignItems: 'center', justifyContent: 'center',
        borderRadius: 8,
    },
    calCellActive: {
        backgroundColor: PRIMARY,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
    },
    calCellText: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
    calCellFiller: { color: '#CBD5E1' },
    calCellTextActive: { color: WHITE, fontWeight: '800' },

    // Time row
    timeRow: { flexDirection: 'row', gap: 14, marginBottom: 20 },
    timeField: { flex: 1 },
    timeInputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: WHITE, borderRadius: 14,
        borderWidth: 1, borderColor: BORDER,
        paddingHorizontal: 14, height: 54,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    timeInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0F172A' },
    timeIcon: { fontSize: 16 },

    // Reminder
    reminderRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: `${PRIMARY}10`,
        borderWidth: 1, borderColor: `${PRIMARY}20`,
        borderRadius: 16, padding: 14, gap: 12,
    },
    reminderIconBox: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: PRIMARY,
        alignItems: 'center', justifyContent: 'center',
    },
    reminderText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#374151' },
    toggle: {
        width: 44, height: 24, borderRadius: 12,
        backgroundColor: '#CBD5E1',
        justifyContent: 'center', paddingHorizontal: 2,
    },
    toggleOn: { backgroundColor: PRIMARY },
    toggleThumb: {
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: WHITE,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
    },
    toggleThumbOn: { alignSelf: 'flex-end' },

    // Footer
    footer: {
        paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32,
        backgroundColor: `${BG}F5`,
        borderTopWidth: 1, borderTopColor: BORDER,
    },
    scheduleBtn: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 10,
        backgroundColor: PRIMARY, borderRadius: 16,
        paddingVertical: 18,
        shadowColor: PRIMARY, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35, shadowRadius: 14, elevation: 7,
    },
    scheduleBtnIcon: { fontSize: 20 },
    scheduleBtnText: { color: WHITE, fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
});