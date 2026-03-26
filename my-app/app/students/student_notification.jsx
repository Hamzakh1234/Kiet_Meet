import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

const INITIAL_NOTIFICATIONS = [
    { id: '1', title: 'Class Starting Soon', desc: 'Calculus II begins in 10 minutes. Tap to join meeting.', time: '2 min ago', type: 'video', color: '#3b82f6', bg: '#dbeafe' },
    { id: '2', title: 'New Assignment Posted', desc: 'Professor Miller added "Midterm Research Proposal".', time: '1 hour ago', type: 'file-document', color: '#ea580c', bg: '#ffedd5' },
    { id: '3', title: 'Attendance Marked', desc: 'You were marked present for English Literature.', time: 'Yesterday', type: 'check-circle', color: '#16a34a', bg: '#dcfce7' },
];

const StudentNotification = () => {
    const router = useRouter();
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

    const clearNotification = (id) => {
        setNotifications(notifications.filter(item => item.id !== id));
    };

    const markAllRead = () => {
        setNotifications([]);
    };

    return (
        <View className="flex-1 bg-[#8B5E3C]/20 justify-center items-center px-6">
            <Animated.View 
                entering={SlideInUp.springify()} 
                className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl"
                style={{ elevation: 10 }}
            >
                {/* Header */}
                <View className="pt-8 pb-4 px-8 flex-row justify-between items-center">
                    <Text className="text-xl font-bold text-[#8B5E3C]">Notifications</Text>
                    {notifications.length > 0 && (
                        <View className="bg-[#D7A86E]/20 px-2 py-1 rounded-full">
                            <Text className="text-[#8B5E3C] text-[10px] font-bold">{notifications.length} New</Text>
                        </View>
                    )}
                </View>

                {/* Notification List */}
                <ScrollView className="max-h-96 px-6">
                    <View className="space-y-3 py-2">
                        {notifications.map((item) => (
                            <View key={item.id} className="flex-row items-start p-4 rounded-2xl bg-[#FDF8F3] border border-[#BC8F68]/10 relative">
                                <View 
                                    style={{ backgroundColor: item.bg }} 
                                    className="w-10 h-10 rounded-xl items-center justify-center"
                                >
                                    <MaterialCommunityIcons name={item.type} size={20} color={item.color} />
                                </View>
                                
                                <View className="flex-1 ml-4 pr-4">
                                    <Text className="text-sm font-bold text-gray-800">{item.title}</Text>
                                    <Text className="text-[11px] text-gray-500 mt-0.5 leading-4">{item.desc}</Text>
                                    <Text className="text-[10px] text-[#BC8F68] mt-1">{item.time}</Text>
                                </View>

                                {/* Close X Symbol */}
                                <Pressable 
                                    onPress={() => clearNotification(item.id)}
                                    className="absolute right-2 top-2 p-1"
                                >
                                    <MaterialCommunityIcons name="close" size={16} color="#BC8F68" />
                                </Pressable>
                            </View>
                        ))}

                        {notifications.length === 0 && (
                            <View className="py-10 items-center">
                                <MaterialCommunityIcons name="bell-off-outline" size={40} color="#BC8F68" />
                                <Text className="text-[#BC8F68] mt-2 font-medium">All caught up!</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                {/* Footer Actions */}
                <View className="p-6 space-y-3">
                    <Pressable 
                        onPress={markAllRead}
                        className="w-full py-4 bg-[#8B5E3C] rounded-2xl shadow-lg items-center active:scale-95"
                    >
                        <Text className="text-white font-bold">Mark all as read</Text>
                    </Pressable>

                    <Pressable 
                        onPress={() => router.back()} // Close and go back to dashboard
                        className="w-full py-3 items-center active:bg-[#FDF8F3] rounded-2xl"
                    >
                        <Text className="text-[#BC8F68] font-bold">Close</Text>
                    </Pressable>
                </View>
            </Animated.View>
        </View>
    );
};

export default StudentNotification;