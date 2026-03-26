// app/teachers/check_participants.jsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, Pressable, ScrollView,
    StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '../../config';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const PRIMARY      = '#ec5b13';
const BG           = '#f8f6f6';
const WHITE        = '#FFFFFF';
const DARK         = '#0F172A';
const MUTED        = '#64748B';
const BORDER       = '#E2E8F0';

const API_URL = `${BASE_URL}/classes`;

export default function CheckParticipants() {
    const router = useRouter();
    const { classId, className } = useLocalSearchParams();

    const [participants, setParticipants] = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [removingId,   setRemovingId]   = useState(null);

    useEffect(() => {
        if (classId) {
            fetchParticipants();
        }
    }, [classId]);

    const fetchParticipants = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/participants/${classId}`);
            setParticipants(response.data.participants);
        } catch (error) {
            console.error('Fetch participants error:', error);
            // Fallback for now if API isn't ready
            // setParticipants([]); 
        } finally {
            setLoading(false);
        }
    };

    const confirmRemove = (student) => {
        Alert.alert(
            'Confirm Removal',
            `Are you sure you want to remove ${student.firstName} ${student.lastName} from this class? They will be kicked out of the meeting.`,
            [
                { text: 'No', style: 'cancel' },
                { 
                    text: 'Yes, Remove', 
                    style: 'destructive',
                    onPress: () => handleRemoveStudent(student._id || student.id)
                },
            ]
        );
    };

    const handleRemoveStudent = async (studentId) => {
        setRemovingId(studentId);
        try {
            await axios.post(`${API_URL}/remove-student`, {
                classId,
                studentId,
            });
            
            // Update local state
            setParticipants(prev => prev.filter(p => (p._id || p.id) !== studentId));
            Alert.alert('✅ Removed', 'Student has been removed from the class.');
        } catch (error) {
            Alert.alert('❌ Error', 'Failed to remove student');
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </Pressable>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Participants</Text>
                    <Text style={styles.headerSub}>{className}</Text>
                </View>
                <View style={styles.backBtn} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Enrolled Students</Text>
                    <Text style={styles.studentCount}>{participants.length} total</Text>
                </View>

                {loading ? (
                    <ActivityIndicator color={PRIMARY} style={{ marginTop: 40 }} />
                ) : participants.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyEmoji}>👥</Text>
                        <Text style={styles.emptyText}>No students joined yet</Text>
                        <Text style={styles.emptySub}>Share the class code with your students to get started.</Text>
                    </View>
                ) : (
                    participants.map((item, index) => (
                        <Animated.View 
                            key={item._id || index} 
                            entering={FadeInDown.duration(400).delay(index * 50)}
                            style={styles.participantCard}
                        >
                            <View style={styles.avatarContainer}>
                                {item.photo ? (
                                    <Image source={{ uri: item.photo }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarText}>
                                            {item.firstName?.[0]}{item.lastName?.[0]}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.infoContainer}>
                                <Text style={styles.studentName}>{item.firstName} {item.lastName}</Text>
                                <Text style={styles.studentEmail}>{item.email}</Text>
                            </View>

                            <Pressable 
                                style={styles.deleteBtn} 
                                onPress={() => confirmRemove(item)}
                                disabled={removingId === (item._id || item.id)}
                            >
                                {removingId === (item._id || item.id) ? (
                                    <ActivityIndicator size="small" color="#EF4444" />
                                ) : (
                                    <Text style={styles.deleteIcon}>🗑️</Text>
                                )}
                            </Pressable>
                        </Animated.View>
                    ))
                )}
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BG },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16,
        backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER,
    },
    backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 24, color: DARK },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: DARK },
    headerSub: { fontSize: 12, color: MUTED, fontWeight: '600', marginTop: 2 },

    scroll: { padding: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: DARK },
    studentCount: { fontSize: 14, fontWeight: '700', color: PRIMARY },

    participantCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE,
        padding: 14, borderRadius: 16, marginBottom: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    avatarContainer: { marginRight: 14 },
    avatar: { width: 48, height: 48, borderRadius: 24 },
    avatarPlaceholder: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: `${PRIMARY}15`, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontSize: 16, fontWeight: '800', color: PRIMARY },
    infoContainer: { flex: 1 },
    studentName: { fontSize: 16, fontWeight: '700', color: DARK },
    studentEmail: { fontSize: 12, color: MUTED, marginTop: 2 },
    deleteBtn: {
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center',
    },
    deleteIcon: { fontSize: 18 },

    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyEmoji: { fontSize: 60, marginBottom: 16 },
    emptyText: { fontSize: 18, fontWeight: '800', color: DARK, marginBottom: 8 },
    emptySub: { fontSize: 14, color: MUTED, textAlign: 'center', paddingHorizontal: 40 },
});
