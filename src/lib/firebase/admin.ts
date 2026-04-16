import * as admin from 'firebase-admin';

let admin_db: admin.firestore.Firestore | undefined;
let admin_rtdb: admin.database.Database | undefined;
let admin_auth: admin.auth.Auth | undefined;

function initializeFirebase() {
    if (admin.apps.length) return;
    
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        console.warn('Firebase credentials not configured - Firebase features disabled');
        return;
    }
    
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });
        admin_db = admin.firestore();
        admin_rtdb = admin.database();
        admin_auth = admin.auth();
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

export function getAdminDb() {
    initializeFirebase();
    return admin_db;
}

export function getAdminRtdb() {
    initializeFirebase();
    return admin_rtdb;
}

export function getAdminAuth() {
    initializeFirebase();
    return admin_auth;
}