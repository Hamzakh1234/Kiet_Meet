// app/public_user/_layout.jsx
import { Stack } from 'expo-router';

export default function PublicUserLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }} />
    );
}