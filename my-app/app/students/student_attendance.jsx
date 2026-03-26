import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

// ── Theme Colors ──────────────────────────────────────────
const COLORS = {
    brown: '#5D4037',
    brownLight: '#8D6E63',
    cream: '#FDFBF7',
    tan: '#EFEBE9',
    accent: '#D7CCC8',
    success: '#E8F5E9',
    successText: '#2E7D32',
    danger: '#FFEBEE',
    dangerText: '#C62828',
};

// ── Mock Data ─────────────────────────────────────────────
const ATTENDANCE_DATA = [
    { id: '1', subject: 'Artificial Intelligence', code: 'CS-402', date: 'Oct 24, 09:30 AM', status: 'Present', short: 'AI' },
    { id: '2', subject: 'Data Structures', code: 'CS-201', date: 'Oct 23, 11:00 AM', status: 'Present', short: 'DS' },
    { id: '3', subject: 'Operating Systems', code: 'CS-305', date: 'Oct 22, 02:00 PM', status: 'Absent', short: 'OS' },
    { id: '4', subject: 'Artificial Intelligence', code: 'CS-402', date: 'Oct 21, 09:30 AM', status: 'Present', short: 'AI' },
    { id: '5', subject: 'Data Structures', code: 'CS-201', date: 'Oct 20, 11:00 AM', status: 'Present', short: 'DS' },
];

const StudentAttendance = () => {
    const router = useRouter();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.cream }}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.brown} />
                </Pressable>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Attendance Report</Text>
                    <Text style={styles.headerUser}>TAHA ADIL</Text>
                </View>
                <View style={{ width: 40 }} /> 
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Summary Card */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.summaryCard}>
                    <View style={styles.summaryContent}>
                        <View>
                            <Text style={styles.summaryLabel}>Overall Average</Text>
                            <Text style={styles.summaryValue}>94%</Text>
                            <View style={styles.summaryStats}>
                                <View>
                                    <Text style={styles.statMiniLabel}>TOTAL HELD</Text>
                                    <Text style={styles.statMiniVal}>120</Text>
                                </View>
                                <View style={styles.divider} />
                                <View>
                                    <Text style={styles.statMiniLabel}>ATTENDED</Text>
                                    <Text style={styles.statMiniVal}>113</Text>
                                </View>
                            </View>
                        </View>
                        
                        {/* Circle Visual */}
                        <View style={styles.progressCircle}>
                            <MaterialCommunityIcons name="school-outline" size={30} color={COLORS.accent} />
                            <View style={styles.progressRingBorder} />
                        </View>
                    </View>
                </Animated.View>

                {/* Filters Section (Corrected from h3 to Text) */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Classes</Text>
                    <View style={styles.filterBadge}>
                        <Text style={styles.filterText}>All Courses ▼</Text>
                    </View>
                </View>

                {/* Attendance List */}
                <View style={styles.listContainer}>
                    {ATTENDANCE_DATA.map((item, index) => (
                        <Animated.View 
                            key={item.id} 
                            entering={FadeInDown.delay(200 + index * 100)}
                            style={styles.listItem}
                        >
                            <View style={styles.itemLeft}>
                                <View style={styles.iconBox}>
                                    <Text style={styles.iconText}>{item.short}</Text>
                                </View>
                                <View>
                                    <Text style={styles.subjectName}>{item.subject}</Text>
                                    <Text style={styles.subjectMeta}>{item.code} • {item.date}</Text>
                                </View>
                            </View>
                            <View style={[
                                styles.statusBadge, 
                                { backgroundColor: item.status === 'Present' ? COLORS.success : COLORS.danger }
                            ]}>
                                <Text style={[
                                    styles.statusText, 
                                    { color: item.status === 'Present' ? COLORS.successText : COLORS.dangerText }
                                ]}>
                                    {item.status}
                                </Text>
                            </View>
                        </Animated.View>
                    ))}
                </View>

                {/* PDF Footer CTA */}
                <View style={styles.pdfBanner}>
                    <Text style={styles.pdfText}>You have maintained an excellent record this month!</Text>
                    <Pressable>
                        <Text style={styles.pdfLink}>Download Full PDF Report</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, 
        borderBottomWidth: 1, borderBottomColor: COLORS.accent + '40',
        backgroundColor: COLORS.cream,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.brown },
    headerUser: { fontSize: 10, color: COLORS.brownLight, letterSpacing: 1.5, fontWeight: '600', textTransform: 'uppercase' },
    
    summaryCard: {
        margin: 20, padding: 25, borderRadius: 30, backgroundColor: COLORS.brown,
        shadowColor: COLORS.brown, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8,
        position: 'relative', overflow: 'hidden'
    },
    summaryContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { color: COLORS.accent, fontSize: 14, fontWeight: '500' },
    summaryValue: { color: '#FFF', fontSize: 48, fontWeight: 'bold', marginVertical: 5 },
    summaryStats: { flexDirection: 'row', gap: 15, marginTop: 10 },
    statMiniLabel: { color: COLORS.accent, fontSize: 9, fontWeight: 'bold' },
    statMiniVal: { color: '#FFF', fontSize: 18, fontWeight: '600' },
    divider: { width: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center' },
    
    progressCircle: {
        width: 85, height: 85, borderRadius: 45, borderWidth: 6, borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center', justifyContent: 'center', position: 'relative'
    },
    progressRingBorder: {
        position: 'absolute', width: 85, height: 85, borderRadius: 45,
        borderWidth: 6, borderColor: COLORS.accent, borderTopColor: 'transparent',
        transform: [{ rotate: '45deg' }]
    },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.brown },
    filterBadge: { backgroundColor: COLORS.tan, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    filterText: { fontSize: 12, fontWeight: 'bold', color: COLORS.brownLight },
    
    listContainer: { paddingHorizontal: 20, marginTop: 15, gap: 12 },
    listItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFF', padding: 16, borderRadius: 20, 
        borderWidth: 1, borderColor: COLORS.accent + '30',
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4
    },
    itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 45, height: 45, backgroundColor: COLORS.tan, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    iconText: { color: COLORS.brown, fontWeight: 'bold', fontSize: 16 },
    subjectName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    subjectMeta: { fontSize: 10, color: COLORS.brownLight, marginTop: 2 },
    
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    
    pdfBanner: { 
        margin: 20, padding: 20, borderRadius: 20, 
        borderStyle: 'dashed', borderWidth: 2, borderColor: COLORS.accent, 
        alignItems: 'center', backgroundColor: COLORS.accent + '15' 
    },
    pdfText: { fontSize: 12, color: COLORS.brownLight, textAlign: 'center' },
    pdfLink: { color: COLORS.brown, fontWeight: 'bold', textDecorationLine: 'underline', marginTop: 8 }
});

export default StudentAttendance;