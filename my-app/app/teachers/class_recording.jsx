import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

const COLORS = {
    brown: '#5D4037',
    lightBrown: '#8D6E63',
    cream: '#F5F5DC',
    offWhite: '#FAF9F6',
    accent: '#A1887F',
};

const RECORDINGS = [
    { id: 'DS-402', title: 'Data Structures', date: 'Oct 24, 2023', duration: '52m 14s' },
    { id: 'AA-105', title: 'Advanced Algorithms', date: 'Oct 22, 2023', duration: '1h 05m' },
    { id: 'OS-201', title: 'Operating Systems', date: 'Oct 20, 2023', duration: '45m 30s' },
];

export default function ClassRecordings() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={30} color={COLORS.brown} />
                </Pressable>
                <Text style={styles.headerTitle}>Class Recordings</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroCard}>
                        <View>
                            <Text style={styles.heroTag}>TEACHER DASHBOARD</Text>
                            <Text style={styles.heroTitle}>Recent Sessions</Text>
                        </View>
                        <View style={styles.heroIconBox}>
                            <MaterialCommunityIcons name="video-camera" size={32} color={COLORS.cream} />
                        </View>
                    </View>
                </View>

                {/* Recordings List */}
                <View style={styles.listContainer}>
                    {RECORDINGS.map((item, index) => (
                        <Animated.View 
                            key={item.id} 
                            entering={FadeInDown.delay(index * 100)} 
                            style={styles.recordingCard}
                        >
                            <View style={styles.cardTop}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <View style={styles.metaRow}>
                                        <Text style={styles.idBadge}>ID: {item.id}</Text>
                                        <Text style={styles.dot}>•</Text>
                                        <Text style={styles.dateText}>{item.date}</Text>
                                    </View>
                                </View>
                                <Pressable style={styles.playBtn}>
                                    <MaterialCommunityIcons name="play" size={24} color="white" />
                                </Pressable>
                            </View>

                            <View style={styles.durationRow}>
                                <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.lightBrown} />
                                <Text style={styles.durationText}>Duration: {item.duration}</Text>
                            </View>

                            <Pressable style={styles.analyticsBtn}>
                                <MaterialCommunityIcons name="chart-bar" size={18} color={COLORS.brown} />
                                <Text style={styles.analyticsText}>View Engagement Analytics</Text>
                            </Pressable>
                        </Animated.View>
                    ))}
                </View>
            </ScrollView>

            {/* Floating Action Button */}
            <Pressable style={styles.fab}>
                <MaterialCommunityIcons name="plus" size={32} color="white" />
            </Pressable>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.offWhite },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(93, 64, 55, 0.1)',
        backgroundColor: COLORS.offWhite,
    },
    backBtn: { padding: 4, marginRight: 8 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.brown, fontFamily: 'serif' },
    heroSection: { padding: 24 },
    heroCard: {
        backgroundColor: COLORS.brown, borderRadius: 20, padding: 24,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        elevation: 5, shadowColor: COLORS.brown, shadowOpacity: 0.2, shadowRadius: 10,
    },
    heroTag: { color: 'rgba(245, 245, 220, 0.8)', fontSize: 10, fontWeight: '600', letterSpacing: 1 },
    heroTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 4, fontFamily: 'serif' },
    heroIconBox: { backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 12, borderRadius: 15 },
    listContainer: { paddingHorizontal: 24 },
    recordingCard: {
        backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(93, 64, 55, 0.05)', elevation: 2,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.brown },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    idBadge: { backgroundColor: COLORS.cream, color: COLORS.brown, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontSize: 10, fontWeight: '600' },
    dot: { marginHorizontal: 6, color: COLORS.lightBrown },
    dateText: { fontSize: 12, color: COLORS.lightBrown, fontWeight: '500' },
    playBtn: { backgroundColor: COLORS.brown, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    durationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
    durationText: { fontSize: 13, color: COLORS.lightBrown },
    analyticsBtn: {
        backgroundColor: COLORS.cream, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12,
    },
    analyticsText: { color: COLORS.brown, fontSize: 14, fontWeight: '700' },
    fab: {
        position: 'absolute', bottom: 30, right: 24, backgroundColor: COLORS.brown,
        width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center',
        elevation: 8, shadowColor: COLORS.brown, shadowOpacity: 0.3, shadowRadius: 10,
    }
});