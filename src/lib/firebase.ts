/**
 * DEPRECATED: Use hooks and services from @/firebase instead.
 * This file is maintained for temporary backward compatibility during migration.
 */
import { initializeFirebase } from "@/firebase";

const { auth, firestore: db } = initializeFirebase();
const googleProvider = null; // Replaced with inline instantiation in AuthProvider

export { auth, db, googleProvider };
