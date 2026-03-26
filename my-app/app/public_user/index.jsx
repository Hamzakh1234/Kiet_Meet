// app/public_user/index.jsx
import React, { useState } from 'react';
import {
    View, Text, TextInput, Pressable,
    StyleSheet, Modal, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

// ── Constants ──────────────────────────────────────────────
const BROWN       = '#5D4037';
const BROWN_LIGHT = '#8D6E63';
const CREAM       = '#FDFBF7';
const GOLD        = '#C5A059';
const WHITE       = '#FFFFFF';
const BORDER      = 'rgba(93,64,55,0.15)';
const PLACEHOLDER = 'rgba(141,110,99,0.5)';

// ── Main Screen ────────────────────────────────────────────
const PublicUserHome = () => {
    const router = useRouter();
    const [joinCode, setJoinCode]       = useState('');
    const [dropdownOpen, setDropdown]   = useState(false);

    // Get current time
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>

            {/* ── DROPDOWN MODAL (outside so it overlays everything) ── */}
            <Modal
                visible={dropdownOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setDropdown(false)}
            >
                <Pressable style={styles.dropdownOverlay} onPress={() => setDropdown(false)}>
                    <Animated.View
                        entering={FadeInDown.duration(200)}
                        style={styles.dropdown}
                    >
                        {/* Instant Meeting */}
                        <Pressable
                            style={[styles.dropdownItem, styles.dropdownItemBorder]}
                            onPress={() => {
                                setDropdown(false);
                                router.push('/public_user/public_meeting');
                            }}
                        >
                            <Text style={styles.dropdownItemIcon}>⚡</Text>
                            <Text style={styles.dropdownItemText}>Start an instant meeting</Text>
                        </Pressable>

                        {/* Schedule Meeting */}
                        <Pressable
                            style={styles.dropdownItem}
                            onPress={() => {
                                setDropdown(false);
                                router.push('/public_user/schedule_meeting');
                            }}
                        >
                            <Text style={styles.dropdownItemIcon}>📅</Text>
                            <Text style={styles.dropdownItemText}>Schedule Meeting</Text>
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* ── HEADER ── */}
            <Animated.View entering={FadeInDown.duration(500).delay(50)} style={styles.header}>
                <View style={styles.headerLogo}>
                    <View style={styles.logoBox}>
                        <Text style={styles.logoText}>K</Text>
                    </View>
                    <Text style={styles.brandName}>Kiety Meet</Text>
                </View>
                <Text style={styles.timeText}>{timeStr}</Text>
            </Animated.View>

            {/* ── MAIN CONTENT ── */}
            <View style={styles.mainContent}>

                {/* Hero */}
                <Animated.View entering={FadeInDown.duration(600).delay(150)} style={styles.hero}>
                    <Text style={styles.heroTitle}>Welcome to Kiety Meet</Text>
                    <Text style={styles.heroSub}>
                        Connect, collaborate, and celebrate from anywhere with premium academic-grade video calling.
                    </Text>
                </Animated.View>

                {/* ── Meeting Controls ── */}
                <Animated.View entering={FadeInDown.duration(600).delay(250)} style={styles.controls}>

                    {/* New Meeting Button */}
                    <Pressable
                        style={styles.newMeetingBtn}
                        onPress={() => setDropdown(!dropdownOpen)}
                    >
                        <Text style={styles.newMeetingIcon}>📹</Text>
                        <Text style={styles.newMeetingText}>New meeting</Text>
                    </Pressable>

                    {/* Join Input Row */}
                    <View style={styles.joinRow}>
                        <View style={styles.joinInputWrapper}>
                            <Text style={styles.joinInputIcon}>🔑</Text>
                            <TextInput
                                style={styles.joinInput}
                                placeholder="Enter a code or link"
                                placeholderTextColor={PLACEHOLDER}
                                value={joinCode}
                                onChangeText={setJoinCode}
                                autoCapitalize="none"
                            />
                        </View>
                        <Pressable
                            style={[styles.joinBtn, !joinCode && styles.joinBtnDisabled]}
                            onPress={() => {
                                if (joinCode.trim()) {
                                    router.push('/public_user/public_meeting');
                                }
                            }}
                            disabled={!joinCode}
                        >
                            <Text style={[styles.joinBtnText, !joinCode && styles.joinBtnTextDisabled]}>
                                Join
                            </Text>
                        </Pressable>
                    </View>
                </Animated.View>

                {/* ── Decorative Illustration ── */}
                <Animated.View entering={FadeInUp.duration(600).delay(350)} style={styles.illustrationWrap}>
                    <View style={styles.illustrationCircle}>
                        {/* SVG-like decorative element with RN */}
                        <View style={styles.dottedRing} />
                        <View style={styles.innerCircle} />
                        <View style={styles.crossH} />
                        <View style={styles.crossV} />
                    </View>

                    {/* Carousel nav arrows */}
                    <View style={styles.carouselNav}>
                        <Pressable style={styles.carouselBtn}>
                            <Text style={styles.carouselArrow}>‹</Text>
                        </Pressable>
                        <Pressable style={styles.carouselBtn}>
                            <Text style={styles.carouselArrow}>›</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </View>

            {/* ── BOTTOM NAV ── */}
            <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.bottomNav}>
                {/* Home — active */}
                <Pressable
                    style={styles.tabItem}
                    onPress={() => router.replace('/home')}
                >
                    <Text style={styles.tabIconActive}>🏠</Text>
                    <Text style={styles.tabLabelActive}>HOME</Text>
                </Pressable>

                {/* Settings */}
                <Pressable style={styles.tabItem}>
                    <Text style={styles.tabIcon}>⚙️</Text>
                    <Text style={styles.tabLabel}>SETTINGS</Text>
                </Pressable>
            </Animated.View>

        </Animated.View>
    );
};

export default PublicUserHome;

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: CREAM },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
        backgroundColor: WHITE,
        borderBottomWidth: 1, borderBottomColor: BORDER,
        shadowColor: BROWN, shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoBox: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: BROWN,
        alignItems: 'center', justifyContent: 'center',
    },
    logoText: { color: WHITE, fontWeight: '900', fontSize: 17 },
    brandName: { fontSize: 17, fontWeight: '600', color: BROWN, letterSpacing: 0.3 },
    timeText: { fontSize: 12, fontWeight: '500', color: BROWN_LIGHT },

    // Main
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },

    // Hero
    hero: { alignItems: 'center', marginBottom: 36 },
    heroTitle: {
        fontSize: 26, fontWeight: '700', color: BROWN,
        textAlign: 'center', marginBottom: 12,
        letterSpacing: -0.3,
    },
    heroSub: {
        fontSize: 14, color: BROWN_LIGHT,
        textAlign: 'center', lineHeight: 22,
        maxWidth: 280,
    },

    // Controls
    controls: { width: '100%', gap: 14, marginBottom: 40 },

    newMeetingBtn: {
        width: '100%', flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        gap: 12, backgroundColor: BROWN,
        paddingVertical: 18, borderRadius: 14,
        shadowColor: BROWN, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    newMeetingIcon: { fontSize: 22 },
    newMeetingText: { color: WHITE, fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

    joinRow: { flexDirection: 'row', gap: 10 },
    joinInputWrapper: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        backgroundColor: WHITE,
        borderWidth: 1, borderColor: BORDER,
        borderRadius: 14, paddingHorizontal: 14, height: 54,
    },
    joinInputIcon: { fontSize: 18, marginRight: 8 },
    joinInput: { flex: 1, fontSize: 14, color: BROWN },
    joinBtn: {
        paddingHorizontal: 20, height: 54,
        alignItems: 'center', justifyContent: 'center',
    },
    joinBtnDisabled: { opacity: 0.4 },
    joinBtnText: { fontSize: 15, fontWeight: '800', color: BROWN_LIGHT },
    joinBtnTextDisabled: { color: BROWN_LIGHT },

    // Illustration
    illustrationWrap: { alignItems: 'center' },
    illustrationCircle: {
        width: 160, height: 160, borderRadius: 80,
        borderWidth: 3, borderColor: 'rgba(93,64,55,0.08)',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative',
    },
    dottedRing: {
        position: 'absolute',
        width: 130, height: 130, borderRadius: 65,
        borderWidth: 2, borderColor: BROWN,
        borderStyle: 'dashed',
        opacity: 0.2,
    },
    innerCircle: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: `${BROWN}12`,
    },
    crossH: {
        position: 'absolute',
        width: 80, height: 4, borderRadius: 2,
        backgroundColor: GOLD, opacity: 0.7,
    },
    crossV: {
        position: 'absolute',
        width: 4, height: 80, borderRadius: 2,
        backgroundColor: GOLD, opacity: 0.7,
    },

    carouselNav: { flexDirection: 'row', gap: 16, marginTop: 20 },
    carouselBtn: {
        width: 36, height: 36, borderRadius: 18,
        borderWidth: 1, borderColor: BORDER,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: WHITE,
    },
    carouselArrow: { fontSize: 22, color: BROWN, fontWeight: '300' },

    // Dropdown
    dropdownOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 160,
        paddingHorizontal: 24,
    },
    dropdown: {
        backgroundColor: WHITE,
        borderRadius: 16,
        borderWidth: 1, borderColor: BORDER,
        overflow: 'hidden',
        shadowColor: BROWN, shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
    },
    dropdownItem: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        paddingHorizontal: 20, paddingVertical: 18,
    },
    dropdownItemBorder: {
        borderBottomWidth: 1, borderBottomColor: 'rgba(93,64,55,0.06)',
    },
    dropdownItemIcon: { fontSize: 20 },
    dropdownItemText: { fontSize: 15, fontWeight: '600', color: BROWN },

    // Bottom Nav
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: WHITE,
        borderTopWidth: 1, borderTopColor: BORDER,
        paddingTop: 12, paddingBottom: 28,
        paddingHorizontal: 60,
        justifyContent: 'space-between',
    },
    tabItem: { alignItems: 'center', gap: 4 },
    tabIconActive: { fontSize: 22 },
    tabIcon: { fontSize: 22, opacity: 0.5 },
    tabLabelActive: {
        fontSize: 9, fontWeight: '800',
        color: BROWN, letterSpacing: 1.2,
    },
    tabLabel: {
        fontSize: 9, fontWeight: '800',
        color: BROWN_LIGHT, letterSpacing: 1.2, opacity: 0.6,
    },
});