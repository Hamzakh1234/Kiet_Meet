// index.jsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Index = () => {
    const router = useRouter();
    const scale = useSharedValue(1);

    const animatedButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.96);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <Animated.View
            entering={FadeIn.duration(600)}
            style={styles.container}
        >
            {/* Decorative top-right circle */}
            <View style={styles.decorCircleTopRight} />
            {/* Decorative bottom-left circle */}
            <View style={styles.decorCircleBottomLeft} />

            {/* ── MAIN CONTENT ── */}
            <View style={styles.mainContent}>

                {/* Logo Block */}
                <Animated.View
                    entering={FadeInDown.duration(700).delay(100)}
                    style={styles.logoWrapper}
                >
                    <View style={styles.logoBox}>
                        <Text style={styles.logoInitials}>KM</Text>
                    </View>
                </Animated.View>

                {/* App Title */}
                <Animated.Text
                    entering={FadeInDown.duration(700).delay(250)}
                    style={styles.appTitle}
                >
                    Kiet-Meet
                </Animated.Text>

                {/* Tagline */}
                <Animated.Text
                    entering={FadeInDown.duration(700).delay(400)}
                    style={styles.tagline}
                >
                    Advanced Academic{'\n'}Conferencing Ecosystem
                </Animated.Text>

                {/* Divider */}
                <Animated.View
                    entering={FadeInDown.duration(700).delay(500)}
                    style={styles.divider}
                />
            </View>

            {/* ── FOOTER ── */}
            <Animated.View
                entering={FadeInUp.duration(700).delay(600)}
                style={styles.footer}
            >
                {/* Get Started Button */}
                <AnimatedPressable
                    onPress={() => router.replace('/home')}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    style={[styles.getStartedBtn, animatedButtonStyle]}
                >
                    <Text style={styles.getStartedText}>Get Started</Text>
                </AnimatedPressable>

                {/* Footnote */}
                <Text style={styles.footnote }>Move Towards Excellence </Text>
            </Animated.View>
        </Animated.View>
    );
};

export default Index;

const BROWN = '#5D4037';
const LIGHT_BROWN = '#8D6E63';
const CREAM = '#FDFBF9';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: CREAM,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 48,
        paddingHorizontal: 24,
        overflow: 'hidden',
    },

    /* ── Decorative circles ── */
    decorCircleTopRight: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: BROWN,
        opacity: 0.06,
        top: -60,
        right: -60,
    },
    decorCircleBottomLeft: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: LIGHT_BROWN,
        opacity: 0.08,
        bottom: -50,
        left: -50,
    },

    /* ── Main content ── */
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* Logo */
    logoWrapper: {
        marginBottom: 24,
    },
    logoBox: {
        width: 96,
        height: 96,
        borderRadius: 20,
        backgroundColor: BROWN,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: BROWN,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
        transform: [{ rotate: '3deg' }],
    },
    logoInitials: {
        color: '#fff',
        fontSize: 38,
        fontWeight: '700',
        letterSpacing: 2,
    },

    /* Title */
    appTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: BROWN,
        letterSpacing: 1,
        marginBottom: 12,
        textAlign: 'center',
    },

    /* Tagline */
    tagline: {
        fontSize: 16,
        fontWeight: '500',
        color: LIGHT_BROWN,
        lineHeight: 26,
        textAlign: 'center',
        letterSpacing: 0.5,
        marginBottom: 28,
    },

    /* Divider */
    divider: {
        width: 48,
        height: 2,
        borderRadius: 4,
        backgroundColor: LIGHT_BROWN,
        opacity: 0.25,
    },

    /* ── Footer ── */
    footer: {
        width: '100%',
        alignItems: 'center',
        paddingBottom: 8,
    },

    getStartedBtn: {
        width: '100%',
        backgroundColor: BROWN,
        paddingVertical: 18,
        borderRadius: 50,
        alignItems: 'center',
        shadowColor: BROWN,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 16,
    },
    getStartedText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.8,
    },

    footnote: {
        color: LIGHT_BROWN,
        fontSize: 10,
        letterSpacing: 3,
        textTransform: 'uppercase',
        opacity: 0.6,
    },
});



// cd "C:\Users\ma\Desktop\MY PERHAI\react native course\zoom-backend"
// node server.js


// cd "C:\Users\ma\Desktop\MY PERHAI\react native course\zoom-backend\python-service"
// python face_service.py

// cd "C:\Users\ma\Desktop\MY PERHAI\react native course\my-app"
// npx expo start -c
// npx expo run:android


//apni repo mein commit karne k liye
// git add .
// git commit -m "your message"
// git push


//taha ki repo mein commit karne k liye
// cd "C:\Users\ma\Desktop\MY PERHAI\react native course\KIETY-Meet"
// git add .
// git commit -m "Added new features to mobile app"
// git push origin main
