// app/home.jsx
// app/home.jsx
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import Animated, {
    FadeInDown,
    FadeIn,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';

// ── Role Data ──────────────────────────────────────────────
const ROLES = [
    {
        key: 'student',
        title: 'Student',
        description: 'Join academic sessions and track your learning progress.',
        icon: '🎓',
        accentColor: '#FF5C00',
        bgColor: '#FFF0E6',
        route: '/students/',
    },
    {
        key: 'teacher',
        title: 'Teacher',
        description: 'Manage classrooms, take attendance, and host lectures.',
        icon: '🖥️',
        accentColor: '#3B82F6',
        bgColor: '#EFF6FF',
        route: '/teachers/',
    },
    {
        key: 'public',
        title: 'Public User',
        description: 'Access public webinars and open academic conferences.',
        icon: '🌐',
        accentColor: '#10B981',
        bgColor: '#ECFDF5',
        route: '/public_user/',
    },
];

// ── Animated Role Card ─────────────────────────────────────
const RoleCard = ({ role, index, onSelect }) => {
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View
            entering={FadeInDown.duration(500).delay(index * 100)}
            style={animStyle}
        >
            <Pressable
                onPressIn={() => { scale.value = withSpring(0.97); }}
                onPressOut={() => { scale.value = withSpring(1); }}
                onPress={() => onSelect(role.route)}
                style={styles.card}
            >
                {/* Left: Text content */}
                <View style={styles.cardLeft}>
                    <View style={styles.cardTitleRow}>
                        <Text style={styles.cardIcon}>{role.icon}</Text>
                        <Text style={styles.cardTitle}>
                            {role.title}
                        </Text>
                    </View>
                    <Text style={styles.cardDesc}>{role.description}</Text>

                    {/* Select Button */}
                    <Pressable
                        onPress={() => onSelect(role.route)}
                        style={[styles.selectBtn, { backgroundColor: role.accentColor }]}
                    >
                        <Text style={styles.selectBtnText}>Select</Text>
                    </Pressable>
                </View>

                {/* Right: Icon box */}
                <View style={[styles.iconBox, { backgroundColor: role.bgColor }]}>
                    <Text style={styles.iconBoxEmoji}>{role.icon}</Text>
                </View>
            </Pressable>
        </Animated.View>
    );
};

// ── Main Screen ────────────────────────────────────────────
const Home = () => {
    const router = useRouter();

    const handleSelect = (route) => {
        router.push(route);
    };

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>

            {/* Top Nav */}
            <View style={styles.topNav}>
                <Pressable onPress={() => router.replace('/')} style={styles.backBtn}>
                    <Text style={styles.backArrow}>←</Text>
                </Pressable>
                <Text style={styles.navTitle}>Kiet-Meet</Text>
                <View style={styles.backBtn} />
            </View>

            {/* Header */}
            <Animated.View
                entering={FadeInDown.duration(500).delay(50)}
                style={styles.header}
            >
                <Text style={styles.heading}>Choose Your Role</Text>
                <Text style={styles.subheading}>
                    Select your profile and continue with the academic conferencing ecosystem.
                </Text>
            </Animated.View>

            {/* Role Cards */}
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {ROLES.map((role, index) => (
                    <RoleCard
                        key={role.key}
                        role={role}
                        index={index}
                        onSelect={handleSelect}
                    />
                ))}
                <View style={{ height: 40 }} />
            </ScrollView>
        </Animated.View>
    );
};

export default Home;

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCF9F7',
    },

    // Top Nav
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 52,
        paddingBottom: 8,
    },
    backBtn: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backArrow: {
        fontSize: 22,
        color: '#64748B',
    },
    navTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0F172A',
        letterSpacing: 0.3,
    },

    // Header
    header: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        alignItems: 'center',
    },
    heading: {
        fontSize: 34,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: 10,
    },
    subheading: {
        fontSize: 15,
        fontWeight: '500',
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 8,
    },

    // Scroll
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        gap: 14,
    },

    // Card
    card: {
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        gap: 16,
    },
    cardLeft: {
        flex: 2,
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 8,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    cardIcon: {
        fontSize: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: 0.1,
    },
    cardDesc: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 12,
    },
    selectBtn: {
        alignSelf: 'flex-start',
        paddingHorizontal: 22,
        paddingVertical: 9,
        borderRadius: 50,
    },
    selectBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    // Icon box (right side)
    iconBox: {
        width: 100,
        height: 100,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    iconBoxEmoji: {
        fontSize: 46,
    },
});