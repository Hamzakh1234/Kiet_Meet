import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, CheckBox } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

const COLORS = {
    brand: '#634A42',
    brandLight: '#FCFAF8',
    brandAccent: '#EBE3DB',
    success: '#2D6A4F',
    text: '#4A3E39',
};

const Summaries = () => {
    const router = useRouter();
    const [tasks, setTasks] = useState([
        { id: 1, text: 'Complete Chapter 4 Exercises', completed: true },
        { id: 2, text: 'Implement a Balanced BST in Python', completed: false },
        { id: 3, text: 'Submit Lab Report #5 by Friday', completed: false },
    ]);

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.brandLight }}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.brand} />
                </Pressable>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>SUMMARIES</Text>
                    <Text style={styles.headerSub}>Kiety Meet Academic</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Main Summary Card */}
                <Animated.View entering={FadeInDown.duration(600)} style={styles.mainCardContainer}>
                    <LinearGradient
                        colors={['#634A42', '#4A3731']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.mainCard}
                    >
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={styles.cardTag}>LECTURE SUMMARY</Text>
                                <Text style={styles.cardTitle}>Data Structures -{'\n'}Binary Trees</Text>
                            </View>
                            <View style={styles.cardActions}>
                                <Pressable style={styles.iconBtn}><MaterialCommunityIcons name="download" size={20} color="white" /></Pressable>
                                <Pressable style={styles.iconBtn}><MaterialCommunityIcons name="pencil" size={20} color="white" /></Pressable>
                            </View>
                        </View>

                        <View style={styles.cardFooter}>
                            <View style={styles.footerStat}>
                                <Text style={styles.statLabel}>DATE</Text>
                                <Text style={styles.statValue}>Oct 23, 2023</Text>
                            </View>
                            <View style={styles.footerDivider} />
                            <View style={styles.footerStat}>
                                <Text style={styles.statLabel}>DURATION</Text>
                                <Text style={styles.statValue}>55 Minutes</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Key Discussion Points */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeading}>Key Discussion Points</Text>
                    <View style={styles.pointsList}>
                        {['Defining recursive structures in binary search trees.', 'Comparison between Pre-order, In-order, and Post-order.'].map((point, i) => (
                            <View key={i} style={styles.pointCard}>
                                <View style={styles.checkIcon}><MaterialCommunityIcons name="check" size={12} color={COLORS.success} /></View>
                                <Text style={styles.pointText}>{point}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Topics Covered (Pills) */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeading}>Topics Covered</Text>
                    <View style={styles.pillsContainer}>
                        {['Root Nodes', 'Leaf Management', 'Tree Balancing', 'Complexity Analysis', 'AVL Trees'].map((topic, i) => (
                            <Animated.View entering={FadeInRight.delay(i * 100)} key={i} style={styles.pill}>
                                <Text style={styles.pillText}>{topic}</Text>
                            </Animated.View>
                        ))}
                    </View>
                </View>

                {/* Assignments Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeading}>Assignments & Action Items</Text>
                    {tasks.map((task) => (
                        <Pressable key={task.id} onPress={() => toggleTask(task.id)} style={styles.taskCard}>
                            <MaterialCommunityIcons 
                                name={task.completed ? "checkbox-marked" : "checkbox-blank-outline"} 
                                size={22} 
                                color={COLORS.brand} 
                            />
                            <Text style={[styles.taskText, task.completed && styles.taskCompleted]}>
                                {task.text}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Bottom CTA */}
                <View style={styles.dashedFooter}>
                    <Text style={styles.footerInfo}>Would you like a consolidated summary for this course?</Text>
                    <Pressable><Text style={styles.footerLink}>Download Full PDF Report</Text></Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.brandAccent + '50' },
    headerTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.brand, letterSpacing: 1 },
    headerSub: { fontSize: 10, color: COLORS.brand + '99', fontWeight: '500' },
    mainCardContainer: { padding: 20 },
    mainCard: { borderRadius: 32, padding: 24, elevation: 10, shadowColor: COLORS.brand, shadowOpacity: 0.2, shadowRadius: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    cardTag: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    cardTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginTop: 5 },
    cardActions: { flexDirection: 'row', gap: 10 },
    iconBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
    cardFooter: { flexDirection: 'row', gap: 24 },
    footerStat: { flex: 1 },
    statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold' },
    statValue: { color: 'white', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
    footerDivider: { width: 1, height: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'center' },
    section: { paddingHorizontal: 20, marginTop: 25 },
    sectionHeading: { fontSize: 18, fontWeight: 'bold', color: COLORS.brand, marginBottom: 15 },
    pointCard: { flexDirection: 'row', gap: 12, backgroundColor: 'white', padding: 16, borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: COLORS.brandAccent + '40' },
    checkIcon: { backgroundColor: '#E8F5E9', padding: 4, borderRadius: 50, height: 20, width: 20, alignItems: 'center', justifyContent: 'center' },
    pointText: { flex: 1, fontSize: 14, color: COLORS.brand, lineHeight: 20 },
    pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: { backgroundColor: COLORS.brandAccent + '60', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50, borderWidth: 1, borderColor: COLORS.brandAccent },
    pillText: { fontSize: 12, fontWeight: '600', color: COLORS.brand },
    taskCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', padding: 16, borderRadius: 20, marginBottom: 10, borderBottomWidth: 2, borderBottomColor: COLORS.brandAccent + '30' },
    taskText: { fontSize: 14, fontWeight: '500', color: COLORS.brand },
    taskCompleted: { textDecorationLine: 'line-through', opacity: 0.5 },
    dashedFooter: { margin: 20, padding: 30, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.brandAccent, alignItems: 'center' },
    footerInfo: { fontSize: 13, color: COLORS.brand + '99', textAlign: 'center' },
    footerLink: { color: COLORS.brand, fontWeight: 'bold', borderBottomWidth: 2, borderBottomColor: COLORS.brand, marginTop: 10 }
});

export default Summaries;