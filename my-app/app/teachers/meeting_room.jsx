// app/teachers/meeting_room.jsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, Pressable, ScrollView,
    StyleSheet, Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '../../config';

import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

// ── Sidebar Nav Items ────────────────────────────────────────────
const SIDEBAR_ITEMS = [
    { key: 'participants',     icon: '👥', label: 'Check Participants' },
    { key: 'attendance',       icon: '📋', label: 'Attendance'       },
    { key: 'recording',        icon: '🎞️', label: 'Recording'        },
    { key: 'myclasses',        icon: '📖', label: 'My Classes'       },
    { key: 'schedule_meeting', icon: '📅', label: 'Schedule Meeting' },
];

// ── Constants ──────────────────────────────────────────────
const PRIMARY      = '#ec5b13';
const BG           = '#f8f6f6';
const WHITE        = '#FFFFFF';
const DARK         = '#0F172A';
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
export default function MeetingRoom() {
    const router = useRouter();
    const { classId, className, classCode } = useLocalSearchParams();

    const [showModal,     setShowModal]     = useState(false);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [sidebarOpen,   setSidebarOpen]   = useState(false);
    const [annText,       setAnnText]       = useState('');
    const [announcements, setAnnouncements] = useState([]);
    const [loadingAnn,    setLoadingAnn]    = useState(true);
    const [postingAnn,    setPostingAnn]    = useState(false);
    const [meetingStatus, setMeetingStatus] = useState('idle');
    const [copied,        setCopied]        = useState(false);
    const [selectedAnno,  setSelectedAnno]  = useState(null);

    // Schedule Meeting States
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedDate,      setSelectedDate]      = useState(new Date());
    const [viewDate,          setViewDate]          = useState(new Date()); // For calendar navigation
    const [schedTime,         setSchedTime]         = useState('');
    const [schedPeriod,       setSchedPeriod]       = useState('AM');
    const [scheduling,        setScheduling]        = useState(false);

    useEffect(() => {
        if (classId) {
            fetchAnnouncements();
            fetchClassStatus();
        }
    }, [classId]);

    const fetchClassStatus = async () => {
        try {
            const response = await axios.get(`${API_URL}/${classId}`);
            setMeetingStatus(response.data.class.meetingStatus || 'idle');
        } catch (error) {
            console.log('Fetch status error:', error);
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

    const handlePostAnnouncement = async () => {
        if (!annText.trim()) {
            Alert.alert('❌ Error', 'Please write something');
            return;
        }
        setPostingAnn(true);
        try {
            const response = await axios.post(`${API_URL}/${classId}/announcements`, {
                text: annText.trim(),
            });
            setAnnouncements(response.data.announcements);
            setShowModal(false);
            setAnnText('');
        } catch (error) {
            Alert.alert('❌ Error', 'Failed to post announcement');
        } finally {
            setPostingAnn(false);
        }
    };

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(classCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSidebarNav = (key) => {
        setSidebarOpen(false);
        if (key === 'participants') {
            router.push({
                pathname: '/teachers/check_participants',
                params: { classId, className, classCode }
            });
        } else if (key === 'myclasses') {
            router.push('/teachers/teachers_classes');
        } else if (key === 'schedule_meeting') {
            setShowScheduleModal(true);
        }
    };

    const handleScheduleMeeting = async () => {
        if (!schedTime.trim()) {
            Alert.alert('❌ Error', 'Please enter a start time');
            return;
        }
        
        setScheduling(true);
        const dateStr = selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const timeStr = `${schedTime} ${schedPeriod}`;
        const announcementText = `Class on ${dateStr} at ${timeStr}`;
        
        // Create actual Date object for the backend
        const [hoursStr, minutesStr] = schedTime.split(':');
        let hours = parseInt(hoursStr);
        const minutes = parseInt(minutesStr || '0');
        if (schedPeriod === 'PM' && hours < 12) hours += 12;
        if (schedPeriod === 'AM' && hours === 12) hours = 0;
        
        const scheduleDateObj = new Date(selectedDate);
        scheduleDateObj.setHours(hours, minutes, 0, 0);

        try {
            const response = await axios.post(`${API_URL}/${classId}/schedule`, {
                scheduledDate: scheduleDateObj.toISOString(),
                text: announcementText,
            });
            setAnnouncements(response.data.announcements);
            Alert.alert('✅ Success', 'Meeting scheduled successfully!');
            setShowScheduleModal(false);
            setSchedTime('');
        } catch (error) {
            Alert.alert('❌ Error', 'Failed to schedule meeting');
        } finally {
            setScheduling(false);
        }
    };

    // Calendar Helpers
    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const changeMonth = (offset) => {
        const nextDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(nextDate);
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        
        const days = [];
        // Fill empty slots
        for (let i = 0; i < startDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
        }
        
        for (let d = 1; d <= totalDays; d++) {
            const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
            days.push(
                <Pressable 
                    key={d} 
                    style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
                    onPress={() => setSelectedDate(new Date(year, month, d))}
                >
                    <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>{d}</Text>
                </Pressable>
            );
        }
        return days;
    };

    return (
        <Animated.View entering={FadeIn.duration(350)} style={styles.container}>

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
                            {SIDEBAR_ITEMS.map((item) => (
                                <Pressable
                                    key={item.key}
                                    style={styles.sidebarItem}
                                    onPress={() => handleSidebarNav(item.key)}
                                >
                                    <Text style={styles.sidebarItemIcon}>{item.icon}</Text>
                                    <Text style={styles.sidebarItemLabel}>{item.label}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* ── CLASS CODE MODAL ── */}
            <Modal visible={showCodeModal} transparent animationType="fade" onRequestClose={() => setShowCodeModal(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowCodeModal(false)}>
                    <Animated.View entering={FadeInDown.duration(280)} style={styles.codeModal}>
                        <Text style={styles.codeModalLabel}>CLASS CODE</Text>
                        
                        <Pressable 
                            style={styles.codeCopyContainer} 
                            onPress={copyToClipboard}
                        >
                            <Text style={styles.codeModalCode}>{classCode}</Text>
                            <View style={styles.copyIconBox}>
                                <Text style={styles.copyIconText}>{copied ? '✅' : '📋'}</Text>
                            </View>
                        </Pressable>

                        {copied && (
                            <Animated.Text entering={FadeIn} style={styles.copiedHint}>
                                Copied to clipboard!
                            </Animated.Text>
                        )}
                        
                        <Text style={styles.codeModalHint}>Share this code with your students to join</Text>
                        <Pressable style={styles.codeModalBtn} onPress={() => setShowCodeModal(false)}>
                            <Text style={styles.codeModalBtnText}>Done</Text>
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* ── ANNOUNCEMENT MODAL ── */}
            <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
                    <Animated.View entering={FadeInDown.duration(280)} style={styles.modal}>
                        <Text style={styles.modalTitle}>New Announcement</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Write your announcement..."
                            placeholderTextColor="#94A3B8"
                            value={annText}
                            onChangeText={setAnnText}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                        <Pressable
                            style={[styles.modalBtn, postingAnn && { opacity: 0.6 }]}
                            onPress={handlePostAnnouncement}
                            disabled={postingAnn}
                        >
                            {postingAnn
                                ? <ActivityIndicator color={WHITE} />
                                : <Text style={styles.modalBtnText}>Post Announcement</Text>
                            }
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* ── SCHEDULE MEETING MODAL ── */}
            <Modal visible={showScheduleModal} transparent animationType="slide" onRequestClose={() => setShowScheduleModal(false)}>
                <Pressable style={styles.modalOverlay} onPress={() => setShowScheduleModal(false)}>
                    <Animated.View entering={FadeInUp.duration(300)} style={styles.scheduleSheet}>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.sheetTitle}>Schedule Meeting</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Calendar UI */}
                            <View style={styles.calendarContainer}>
                                <View style={styles.calendarHeader}>
                                    <Pressable onPress={() => changeMonth(-1)} style={styles.monthBtn}><Text>◀</Text></Pressable>
                                    <Text style={styles.monthLabel}>
                                        {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </Text>
                                    <Pressable onPress={() => changeMonth(1)} style={styles.monthBtn}><Text>▶</Text></Pressable>
                                </View>
                                <View style={styles.calendarWeekdays}>
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                        <Text key={d} style={styles.weekdayText}>{d}</Text>
                                    ))}
                                </View>
                                <View style={styles.calendarGrid}>
                                    {renderCalendar()}
                                </View>
                            </View>

                            {/* Time Input */}
                            <Text style={styles.inputLabel}>Start Time</Text>
                            <View style={styles.timeInputRow}>
                                <TextInput
                                    style={styles.timeInput}
                                    placeholder="e.g. 10:30"
                                    placeholderTextColor="#94A3B8"
                                    value={schedTime}
                                    onChangeText={setSchedTime}
                                    keyboardType="numbers-and-punctuation"
                                />
                                <View style={styles.periodPicker}>
                                    {['AM', 'PM'].map(p => (
                                        <Pressable 
                                            key={p} 
                                            style={[styles.periodBtn, schedPeriod === p && styles.periodBtnActive]}
                                            onPress={() => setSchedPeriod(p)}
                                        >
                                            <Text style={[styles.periodTxt, schedPeriod === p && styles.periodTxtActive]}>{p}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <Pressable 
                                style={[styles.scheduleBtn, scheduling && { opacity: 0.7 }]} 
                                onPress={handleScheduleMeeting}
                                disabled={scheduling}
                            >
                                {scheduling ? <ActivityIndicator color={WHITE} /> : <Text style={styles.scheduleBtnText}>Done</Text>}
                            </Pressable>

                            <Pressable style={styles.sheetCloseBtn} onPress={() => setShowScheduleModal(false)}>
                                <Text style={styles.sheetCloseTxt}>Cancel</Text>
                            </Pressable>
                        </ScrollView>
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* ── HEADER ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(50)} style={styles.header}>
                <Pressable style={styles.menuBtn} onPress={() => setSidebarOpen(true)}>
                    <Text style={styles.menuIcon}>☰</Text>
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerKiety}>KIETY MEET</Text>
                    <Text style={styles.headerClass}>{className || 'Classroom'}</Text>
                </View>
                <Pressable style={styles.viewCodeBtn} onPress={() => setShowCodeModal(true)}>
                    <Text style={styles.viewCodeText}>Code</Text>
                </Pressable>
            </Animated.View>

            {/* ── MAIN SCROLL ── */}
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Hero */}
                <Animated.View entering={FadeInDown.duration(500).delay(100)} style={styles.heroCard}>
                    <View style={styles.heroBlob} />
                    <View style={styles.heroTopRow}>
                        <View style={styles.heroIconBox}>
                            <Text style={{ fontSize: 18 }}>📹</Text>
                        </View>
                        <Text style={styles.heroTag}>LIVE SESSION</Text>
                    </View>
                    <Text style={styles.heroTitle}>Ready to start?</Text>
                    <Text style={styles.heroSub}>
                        Launch your virtual classroom and engage with your students instantly.
                    </Text>
                    <Pressable
                        style={styles.startBtn}
                        onPress={() => router.push({
                            pathname: '/teachers/meeting',
                            params: { classId, className, classCode }
                        })}
                    >
                        <Text style={styles.startBtnIcon}>{meetingStatus === 'live' ? '🔄' : '🎥'}</Text>
                        <Text style={styles.startBtnText}>
                            {meetingStatus === 'live' ? 'Join Again' : 'Start Meeting'}
                        </Text>
                    </Pressable>
                </Animated.View>

                {/* Announcements */}
                <View style={styles.annoHeader}>
                    <Text style={styles.annoSectionTitle}>Announcements</Text>
                    <Text style={styles.annoCount}>
                        {announcements.length > 0 ? `${announcements.length} total` : ''}
                    </Text>
                </View>

                {loadingAnn ? (
                    <ActivityIndicator color={PRIMARY} style={{ marginTop: 20 }} />

                ) : announcements.length === 0 ? (
                    <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyAnno}>
                        <Text style={styles.emptyAnnoEmoji}>📭</Text>
                        <Text style={styles.emptyAnnoText}>No announcements yet</Text>
                        <Text style={styles.emptyAnnoSub}>Tap ＋ to post your first announcement</Text>
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

            {/* ── FAB ── */}
            <Pressable style={styles.fab} onPress={() => setShowModal(true)}>
                <Text style={styles.fabIcon}>＋</Text>
            </Pressable>

        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },

    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14, paddingTop: 52, paddingBottom: 12,
        backgroundColor: WHITE,
        borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backArrow: { fontSize: 24, color: DARK },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerKiety: { fontSize: 10, fontWeight: '800', color: PRIMARY, letterSpacing: 2 },
    headerClass: { fontSize: 16, fontWeight: '800', color: DARK },
    viewCodeBtn: {
        backgroundColor: ACCENT_BROWN, borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    viewCodeText: { fontSize: 10, fontWeight: '800', color: WHITE },

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
    startBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: PRIMARY, borderRadius: 16,
        paddingVertical: 14, paddingHorizontal: 24, alignSelf: 'flex-start',
    },
    startBtnIcon: { fontSize: 16 },
    startBtnText: { color: WHITE, fontSize: 15, fontWeight: '800' },

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

    fab: {
        position: 'absolute', bottom: 30, right: 20,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: PRIMARY, alignItems: 'center',
        justifyContent: 'center', elevation: 10,
    },
    fabIcon: { color: WHITE, fontSize: 30 },

    // ── Sidebar styles ──
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
        backgroundColor: `${PRIMARY}18`, alignItems: 'center', justifyContent: 'center',
    },
    sidebarLogoText: { fontSize: 16, fontWeight: '900', color: PRIMARY },
    sidebarBrandText: { fontSize: 16, fontWeight: '800', color: DARK },
    sidebarCloseX: { fontSize: 18, color: MUTED },
    sidebarItem: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 16, paddingVertical: 13,
        marginHorizontal: 8, marginVertical: 2, borderRadius: 12,
    },
    sidebarItemIcon: { fontSize: 18 },
    sidebarItemLabel: { fontSize: 14, fontWeight: '600', color: DARK },

    // ── Header menu button ──
    menuBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    menuIcon: { fontSize: 20, color: DARK },

    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center', padding: 20,
    },
    modal: { backgroundColor: WHITE, borderRadius: 24, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16, textAlign: 'center', color: DARK },
    modalInput: {
        backgroundColor: BG, borderRadius: 12,
        padding: 16, minHeight: 120, marginBottom: 16,
    },
    modalBtn: {
        backgroundColor: PRIMARY, borderRadius: 12,
        padding: 16, alignItems: 'center',
    },
    modalBtnText: { color: WHITE, fontWeight: '800', fontSize: 15 },

    codeModal: {
        backgroundColor: WHITE, borderRadius: 24,
        padding: 32, alignItems: 'center', marginHorizontal: 20,
    },
    codeModalLabel: {
        fontSize: 10, fontWeight: '800', color: MUTED,
        letterSpacing: 2, marginBottom: 12,
    },
    codeModalCode: {
        fontSize: 36, fontWeight: '900', color: PRIMARY,
        letterSpacing: 6,
    },
    codeCopyContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: `${PRIMARY}08`, paddingHorizontal: 20,
        paddingVertical: 10, borderRadius: 16, marginBottom: 12,
        borderWidth: 1, borderColor: `${PRIMARY}20`,
    },
    copyIconBox: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: WHITE, alignItems: 'center',
        justifyContent: 'center', elevation: 2,
    },
    copyIconText: { fontSize: 16 },
    copiedHint: {
        fontSize: 12, fontWeight: '700', color: '#10B981',
        marginBottom: 12,
    },
    codeModalHint: { fontSize: 13, color: MUTED, textAlign: 'center', marginBottom: 24 },
    codeModalBtn: {
        backgroundColor: PRIMARY, borderRadius: 12,
        paddingHorizontal: 32, paddingVertical: 12,
    },
    codeModalBtnText: { color: WHITE, fontWeight: '800', fontSize: 14 },

    // ── Schedule Modal Styles ──
    scheduleSheet: {
        backgroundColor: WHITE, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: 24, maxHeight: '85%', width: '100%',
    },
    sheetHandle: {
        width: 40, height: 4, backgroundColor: '#E2E8F0',
        borderRadius: 2, alignSelf: 'center', marginBottom: 20,
    },
    sheetTitle: { fontSize: 22, fontWeight: '800', color: DARK, marginBottom: 20, textAlign: 'center' },
    calendarContainer: {
        backgroundColor: '#F8FAFC', borderRadius: 20, padding: 16, marginBottom: 20,
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    monthBtn: { padding: 10, backgroundColor: WHITE, borderRadius: 10, elevation: 1 },
    monthLabel: { fontSize: 16, fontWeight: '700', color: DARK },
    calendarWeekdays: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
    weekdayText: { fontSize: 12, fontWeight: '700', color: MUTED, width: 35, textAlign: 'center' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    calendarDay: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
    calendarDayEmpty: { width: '14.28%', aspectRatio: 1 },
    calendarDaySelected: { backgroundColor: PRIMARY },
    calendarDayText: { fontSize: 14, fontWeight: '600', color: DARK },
    calendarDayTextSelected: { color: WHITE },
    
    inputLabel: { fontSize: 14, fontWeight: '700', color: MUTED, marginBottom: 8, marginLeft: 4 },
    timeInputRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    timeInput: {
        flex: 1, backgroundColor: '#F8FAFC', borderRadius: 14,
        paddingHorizontal: 16, height: 52, fontSize: 16, color: DARK,
        borderWidth: 1, borderColor: '#F1F5F9',
    },
    periodPicker: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: '#F1F5F9' },
    periodBtn: { paddingHorizontal: 16, justifyContent: 'center', borderRadius: 10 },
    periodBtnActive: { backgroundColor: WHITE, elevation: 2 },
    periodTxt: { fontSize: 13, fontWeight: '700', color: MUTED },
    periodTxtActive: { color: PRIMARY },
    
    scheduleBtn: {
        backgroundColor: PRIMARY, borderRadius: 16, paddingVertical: 16,
        alignItems: 'center', shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    scheduleBtnText: { color: WHITE, fontSize: 16, fontWeight: '800' },
    sheetCloseBtn: { alignItems: 'center', marginTop: 16, padding: 10 },
    sheetCloseTxt: { color: MUTED, fontWeight: '600' },

    // ── View Announcement Modal ──
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
        backgroundColor: BG, borderRadius: 12,
        paddingVertical: 14, alignItems: 'center',
    },
    viewAnnoCloseTxt: { color: DARK, fontWeight: '700', fontSize: 14 },
});