import { create } from 'zustand';

const useStore = create((set) => ({
    // Logged in user
    user: null,
    setUser: (userData) => set({ user: userData }),
    logout: () => set({ user: null }),
    
    // Classes
    classes: [],
    addClass: (newClass) => set((state) => ({
        classes: [...state.classes, { ...newClass, id: Math.random().toString(36).substr(2, 9) }]
    })),

    // Signup Form Persistence (Student)
    studentSignupData: {
        fullName: '',
        email: '',
        password: '',
        face_done: false,
        finger_done: false,
        voice_done: false
    },
    setStudentSignupData: (data) => set((state) => ({
        studentSignupData: { ...state.studentSignupData, ...data }
    })),
    clearStudentSignup: () => set({ 
        studentSignupData: { fullName: '', email: '', password: '', face_done: false, finger_done: false, voice_done: false } 
    }),

    // Signup Form Persistence (Teacher)
    teacherSignupData: {
        fullName: '',
        email: '',
        password: '',
        face_done: false,
        finger_done: false,
        voice_done: false
    },
    setTeacherSignupData: (data) => set((state) => ({
        teacherSignupData: { ...state.teacherSignupData, ...data }
    })),
    clearTeacherSignup: () => set({ 
        teacherSignupData: { fullName: '', email: '', password: '', face_done: false, finger_done: false, voice_done: false } 
    }),
    // Login State persistence
    loginData: {
        email: '',
        password: '',
        role: '',
        face_verified: false,
        finger_verified: false,
        voice_verified: false,
        second_factor_verified: false,
    },
    setLoginData: (data) => set((state) => ({
        loginData: { ...state.loginData, ...data }
    })),
    clearLoginData: () => set({ 
        loginData: { email: '', password: '', role: '', face_verified: false, finger_verified: false, voice_verified: false, second_factor_verified: false } 
    }),
}));

export default useStore;
