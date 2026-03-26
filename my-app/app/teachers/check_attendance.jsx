import React, { useState } from 'react';
import { 
    View, Text, ScrollView, Pressable, StyleSheet, 
    TextInput, Image, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

const PRIMARY = '#ec5b13';
const BG_LIGHT = '#f8f6f6';
const DARK_SLATE = '#0F172A';
const MUTED = '#64748B';

const STUDENTS = [
    { id: 'KM-2024-001', name: 'Marcus Aurelius', ratio: '92%', status: 'Present', img: 'https://i.pravatar.cc/150?u=1' },
    { id: 'KM-2024-042', name: 'Elena Gilbert', ratio: '78%', status: 'Absent', img: 'https://i.pravatar.cc/150?u=2' },
    { id: 'KM-2024-015', name: 'Jordan Smith', ratio: '100%', status: 'Present', img: 'https://i.pravatar.cc/150?u=3' },
    { id: 'KM-2024-009', name: 'Sarah Jenkins', ratio: '85%', status: 'Present', img: 'https://i.pravatar.cc/150?u=4' },
];

export default function CheckAttendance() {
    const router = useRouter();
    const [search, setSearch] = useState('');

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.iconBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={PRIMARY} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Attendance</Text>
                    <Text style={styles.headerSub}>Advanced Mathematics - Section B</Text>
                </View>
                <Pressable style={styles.iconBtn}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={22} color={PRIMARY} />
                </Pressable>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                    <MaterialCommunityIcons name="magnify" size={20} color={MUTED} style={{ marginRight: 8 }} />
                    <TextInput 
                        placeholder="Search by student name or ID..."
                        style={styles.input}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 150 }}>
                {/* Stats Cards */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>TOTAL</Text>
                        <Text style={styles.statValue}>42</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#ec5b1315', borderColor: '#ec5b1330' }]}>
                        <Text style={[styles.statLabel, { color: PRIMARY }]}>PRESENT</Text>
                        <Text style={[styles.statValue, { color: PRIMARY }]}>38</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>ABSENT</Text>
                        <Text style={styles.statValue}>4</Text>
                    </View>
                </View>

                {/* Session Title */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Current Session</Text>
                    <View style={styles.liveBadge}>
                        <Text style={styles.liveText}>Live Now</Text>
                    </View>
                </View>

                {/* Students List */}
                <View style={styles.listContainer}>
                    {STUDENTS.map((student, index) => (
                        <Animated.View 
                            key={student.id} 
                            entering={FadeInDown.delay(index * 100)} 
                            style={[styles.studentCard, student.status === 'Absent' && { opacity: 0.7 }]}
                        >
                            <View style={styles.avatarWrapper}>
                                <Image source={{ uri: student.img }} style={styles.avatar} />
                                {student.status === 'Present' && <View style={styles.onlineDot} />}
                            </View>

                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.studentName}>{student.name}</Text>
                                <Text style={styles.studentID}>ID: {student.id}</Text>
                                <View style={styles.progressRow}>
                                    <View style={styles.progressBar}>
                                        <View style={[styles.progressFill, { width: student.ratio }]} />
                                    </View>
                                    <Text style={styles.ratioText}>{student.ratio}</Text>
                                </View>
                            </View>

                            <Pressable style={[
                                styles.statusBtn, 
                                student.status === 'Present' ? styles.presentBtn : styles.absentBtn
                            ]}>
                                <Text style={[
                                    styles.statusBtnText, 
                                    student.status === 'Present' ? { color: 'white' } : { color: MUTED }
                                ]}>
                                    {student.status}
                                </Text>
                            </Pressable>
                        </Animated.View>
                    ))}
                </View>
            </ScrollView>

            {/* Floating Save Button */}
            <View style={styles.fabContainer}>
                <Pressable style={styles.saveBtn}>
                    <MaterialCommunityIcons name="cloud-upload-outline" size={20} color="white" />
                    <Text style={styles.saveBtnText}>Save Session Attendance</Text>
                </Pressable>
            </View>

            {/* Bottom Nav Simulation */}
            <View style={styles.bottomNav}>
                <Pressable style={styles.navItem}>
                    <MaterialCommunityIcons name="book-open-variant" size={22} color={MUTED} />
                    <Text style={styles.navLabel}>Classes</Text>
                </Pressable>
                <Pressable style={styles.navItem}>
                    <MaterialCommunityIcons name="checkbox-marked-outline" size={22} color={PRIMARY} />
                    <Text style={[styles.navLabel, { color: PRIMARY }]}>Attendance</Text>
                </Pressable>
                <Pressable style={styles.navItem}>
                    <MaterialCommunityIcons name="chart-bar" size={22} color={MUTED} />
                    <Text style={styles.navLabel}>Reports</Text>
                </Pressable>
                <Pressable style={styles.navItem}>
                    <MaterialCommunityIcons name="account-outline" size={22} color={MUTED} />
                    <Text style={styles.navLabel}>Profile</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG_LIGHT },
    header: {
        flexDirection: 'row', alignItems: 'center', padding: 16,
        backgroundColor: 'rgba(248, 246, 246, 0.8)', borderBottomWidth: 1, borderBottomColor: '#ec5b1315',
    },
    iconBtn: { padding: 8, borderRadius: 20 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: DARK_SLATE },
    headerSub: { fontSize: 12, color: MUTED, fontWeight: '500' },
    searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
    searchBox: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
        paddingHorizontal: 12, borderRadius: 12, height: 48,
        borderWidth: 1, borderColor: '#ec5b1320',
    },
    input: { flex: 1, fontSize: 14, color: DARK_SLATE },
    statsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginVertical: 8 },
    statCard: {
        flex: 1, backgroundColor: 'white', padding: 12, borderRadius: 16,
        alignItems: 'center', borderWidth: 1, borderColor: '#ec5b1305', elevation: 2,
    },
    statLabel: { fontSize: 10, fontWeight: '700', color: MUTED, letterSpacing: 0.5 },
    statValue: { fontSize: 22, fontWeight: '800', color: DARK_SLATE, marginTop: 2 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, pt: 24, pb: 8, alignItems: 'center', marginTop: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#334155' },
    liveBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    liveText: { color: '#15803d', fontSize: 10, fontWeight: '700' },
    listContainer: { paddingHorizontal: 16, marginTop: 10 },
    studentCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
        padding: 14, borderRadius: 16, marginBottom: 10, elevation: 1,
        borderWidth: 1, borderColor: '#ec5b1305',
    },
    avatarWrapper: { position: 'relative' },
    avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#ec5b1320' },
    onlineDot: { 
        position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, 
        backgroundColor: '#22c55e', borderRadius: 6, borderWidth: 2, borderColor: 'white' 
    },
    studentName: { fontSize: 14, fontWeight: '700', color: DARK_SLATE },
    studentID: { fontSize: 11, color: MUTED },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    progressBar: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 3 },
    ratioText: { fontSize: 10, fontWeight: '700', color: MUTED },
    statusBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    presentBtn: { backgroundColor: PRIMARY, shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
    absentBtn: { backgroundColor: '#E2E8F0' },
    statusBtnText: { fontSize: 12, fontWeight: '800' },
    fabContainer: { position: 'absolute', bottom: 90, width: '100%', paddingHorizontal: 16 },
    saveBtn: {
        backgroundColor: DARK_SLATE, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16,
        elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10,
    },
    saveBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
    bottomNav: {
        flexDirection: 'row', backgroundColor: 'white', paddingBottom: 30, paddingTop: 10,
        borderTopWidth: 1, borderTopColor: '#ec5b1310', position: 'absolute', bottom: 0, width: '100%'
    },
    navItem: { flex: 1, alignItems: 'center', gap: 2 },
    navLabel: { fontSize: 10, fontWeight: '600', color: MUTED }
});