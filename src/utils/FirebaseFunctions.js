import {
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { EmailAuthProvider } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";
import { signInWithPopup } from "firebase/auth";
import {
  addDoc,
  collection,
  setDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { auth, db } from "../utils/firebase";
import { AboutSectionData } from "@/app/clubs/[slug]/data";
import { uploadToImgBB } from './imgbbUpload';
import { getApps } from "firebase/app";

export const handleLogin = async (formData) => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(
      auth,
      formData.email,
      formData.password
    );
    const user = userCredential.user;
    const society = await getSociety(user.uid);
    return userCredential; // Return the full userCredential
  } catch (error) {
    throw new Error(error.message);
  }
};



export const handleGoogleSignUp = async (router) => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if the email ends with @sahrdaya.ac.in
    if (!user.email.endsWith('@sahrdaya.ac.in')) {
      toast.error('Only @sahrdaya.ac.in emails are allowed to sign up.');
      return; // Stop the sign-up process for invalid emails
    }

    // Check if user exists in Firebase Auth (should exist after signInWithPopup)
    // This step is mostly for completeness, signInWithPopup handles auth creation

    // Check if user exists in 'users' collection
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnapshot = await getDoc(userDocRef);

    // Create user document only if it doesn't exist
    if (!userDocSnapshot.exists()) {
      await setDoc(userDocRef, { email: user.email, society: "student" });
      await sendPasswordResetEmail(auth, user.email); // This line is already there, just ensure it's inside the if
      toast.info("Check your email to set a password."); // Move this line inside
    }

    // Send password reset email for new users and redirect
    if (userDocSnapshot.exists() && userDocSnapshot.data()?.society === "student") {
      router.push("/studentdashboard");
    } else if (!userDocSnapshot.exists()){
      await sendPasswordResetEmail(auth, user.email);
      router.push("/studentdashboard");
    } else {
      router.push("/dashboard");
    }

  } catch (error) {
    throw new Error(error.message);
  }
};

export const linkEmailPassword = async (user, email, password) => {
  try {
    const credential = EmailAuthProvider.credential(email, password);
    await user.linkWithCredential(credential);
    return { success: true };
  } catch (error) {
    console.error("Error linking email and password:", error);
    return { success: false, error: error.message };
  }
};



export const getSociety = async (userId) => {
  const userDocRef = doc(db, "users", userId);
  const userDocSnapshot = await getDoc(userDocRef);
  const userData = userDocSnapshot.data();
  const userSociety = userData?.society || null;
  return userSociety;
};

export const createEvent = async (formData, Poster) => {
  try {
    const imageUrl = await uploadToImgBB(Poster);
    const updatedFormData = { ...formData, mediaPath: imageUrl };
    await addDoc(collection(db, "events"), updatedFormData);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const deleteEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, "events", eventId));
    return true;
  } catch (error) {
    return false;
  }
};
export const fetchEventsBySociety = (society, handleEventsUpdate) => {
  const EventsRef = collection(db, "events");
  const q = query(EventsRef, where("society", "==", society));

  return onSnapshot(q, (querySnapshot) => {
    const events = [];

    querySnapshot.forEach((eventDoc) => {
      const eventData = eventDoc.data();
      const eventId = eventDoc.id;
      events.push({ id: eventId, ...eventData });
    });
    // Sort events by date, most recent first
    events.sort((a, b) => new Date(b.date) - new Date(a.date));
    handleEventsUpdate(events);
  });
};

export const fetchAllEvents = (handleEventsUpdate) => {
  const EventsRef = collection(db, "events");
  const q = query(EventsRef);

  return onSnapshot(q, (querySnapshot) => {
    const events = [];

    querySnapshot.forEach((eventDoc) => {
      const eventData = eventDoc.data();
      const eventId = eventDoc.id;
      events.push({ id: eventId, ...eventData });
    });

    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    handleEventsUpdate(events);
  });
};

export const createPerson = async (formData, Picture) => {
  try {
    const imageUrl = await uploadToImgBB(Picture);
    const updatedFormData = { ...formData, mediaPath: imageUrl };
    await addDoc(collection(db, "members"), updatedFormData);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const deletePerson = async (personId) => {
  try {
    await deleteDoc(doc(db, "members", personId));
    return true;
  } catch (error) {
    return false;
  }
};

export const fetchPeopleBySociety = (society, handlePeopleUpdate) => {
  const Membersref = collection(db, "members");
  const q = query(Membersref, where("society", "==", society));

  return onSnapshot(q, (querySnapshot) => {
    const people = [];

    querySnapshot.forEach((doc) => {
      const personData = doc.data();
      const personId = doc.id;
      people.push({ id: personId, ...personData });
    });

    // Custom sorting function
    const sortOrder = {
      "Nodal Officer 1": 1,
"Nodal Officer 2": 2,
"Joint Coordinator": 3,
"Chief Mentor": 4,
"CEO": 5,
"CMO": 6,
"CCMO": 7,
"CFO": 8,
"CCO": 9,
"CTO": 10,
"COO": 11,
"Senior Community Mentor": 12,
"Senior Finance & Documentation Mentor": 13,
"Senior Operations Mentor": 14,
"Senior Marketing & Branding Mentor": 15,
"Senior Mentor": 16,
"Faculty Advisor":17,
"Club Lead": 18,
"Joint Club Lead": 19

    };

    people.sort((a, b) => {
      const orderA = sortOrder[a.role] || 100;
      const orderB = sortOrder[b.role] || 100;

      if (orderA !== orderB) {
        return orderA - orderB; // Sort by predefined order
      }
      return a.name.localeCompare(b.name);
    });

    handlePeopleUpdate(people);
  });
};
export const fetchSocietyData = async (societyKey) => {
  try { 
    // Query the 'societies' collection for a document where the 'society' field matches the societyKey
    const societiesRef = collection(db, "societies");
    const q = query(societiesRef, where("society", "==", societyKey));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0]; // Assuming only one document per society name
      const data = docSnap.data();
      return { 
        id: docSnap.id, // Include the document ID
        aboutText: data.aboutText || "",
        backgroundImage: data.backgroundImage || "",
        heroImage: data.heroImage || "",
        society: data.society || "",
        email: data.email || ""
      };
    } else {
      console.log("No matching documents found in clubs!");
      return {
        aboutText: "",
        backgroundImage: "",
        heroImage: "",
        society: "",
        email: ""
      };
    }
  } catch (error) {
    console.error("Error fetching console data:", error);
    throw error;
  }
};

export const getAllCollectionNames = async () => {
  try {
    // In Firebase Web SDK, there is no direct way to list all collections.
    // We need to know the collection names beforehand.
    // For the purpose of this function, we will return a predefined list
    // of expected collection names. You might need to update this list
    // if you add new collections to your database.
    const collectionNames = [
      'events',
      'members',
      'users',
      'admin',
      'pastExecom', // Note: 'pastExecom' is a collection, but its subcollections (years) also contain data.
      'gallery',
      'upcoming',
      'societies',
      // Add any other top-level collection names here
    ];

    // To include subcollections like 'pastExecom/2023/members', we would need
    // to fetch the years from 'pastExecom' and construct the full paths.
    // This is a more complex operation and might require iterating through
    // documents to find subcollections, which is not a standard Firebase
    // operation for the Web SDK.
    // For a simple list of *top-level* collections, the above array suffices.
    // If you need to export subcollections, you would need to handle that
    // separately, potentially by providing the full path like 'pastExecom/2023/members'.

    return collectionNames;
  } catch (error) {
    console.error("Error fetching collection names:", error);
    throw error;
  }
};

export const exportCollectionToCsv = async (collectionPath) => {
  try {
    const collectionRef = collection(db, collectionPath);
    const snapshot = await getDocs(collectionRef);
    const data = snapshot.docs.map(doc => doc.data());
    return data; // Return the data to be converted to CSV
  } catch (error) {
    console.error(`Error exporting collection ${collectionPath}:`, error);
    throw error;
  }
};

export const isAuthenticatedGodmod = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('isGodmodAuthenticated') === 'true';
  }
  return false; // Return false if not in a browser environment
};

export const logoutGodmod = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('isGodmodAuthenticated');
  }
};

export const addUser = async (userData) => {
  try {
    await addDoc(collection(db, "users"), userData);
  } catch (error) {
    console.error("Error adding user:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(db, "users", userId));
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching all users:", error);
    throw error;
  }
};

export const updateUserSociety = async (userId, newSociety) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { society: newSociety });
  } catch (error) {
    console.error(`Error updating user ${userId} society:`, error);
    throw error;
  }
};

export const getAdminPassword = async (username) => {
  try {
    const adminDocRef = doc(db, "admin", username);
    const adminDocSnapshot = await getDoc(adminDocRef);

    if (adminDocSnapshot.exists()) {
      const adminData = adminDocSnapshot.data();
      return adminData?.pswd || null;
    } else {
      return null; // Document with the provided username doesn't exist
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getPastExecoms = async () => {
  try {
    const pastExecomCollection = collection(db, 'pastExecom');
    const yearSnapshots = await getDocs(pastExecomCollection);
    return yearSnapshots.docs.map(doc => doc.id);
  } catch (error) {
    console.error("Error fetching past execom years:", error);
    throw error; // Re-throw the error to be caught in the component
  }
};

export const createPastExecomYear = async (year) => {
  try {
    const yearDocRef = doc(db, 'pastExecom', year);
    await setDoc(yearDocRef, {}); // Create an empty document for the year
  } catch (error) {
    console.error(`Error creating past execom year ${year}:`, error);
    throw error;
  }
};

export const addPastExecomMember = async (year, memberData) => {
  try {
    const membersCollectionRef = collection(db, 'pastExecom', year, 'members');
    // If memberData includes a file for mediaPath, upload it first
    if (memberData.mediaPath instanceof File) {
      const imageUrl = await uploadToImgBB(memberData.mediaPath);
      memberData.mediaPath = imageUrl;
    }
    await addDoc(membersCollectionRef, memberData);
  } catch (error) {
    console.error(`Error adding member for year ${year}:`, error);
    throw error;
  }
};

export const updatePastExecomMember = async (year, memberId, updatedMemberData) => {
  try {
    const memberDocRef = doc(db, 'pastExecom', year, 'members', memberId);
        // If updatedMemberData includes a file for mediaPath, upload it first
    if (updatedMemberData.mediaPath instanceof File) {
      const imageUrl = await uploadToImgBB(updatedMemberData.mediaPath);
      updatedMemberData.mediaPath = imageUrl;
    }
    await updateDoc(memberDocRef, updatedMemberData);
  } catch (error) {
    console.error(`Error updating member ${memberId} for year ${year}:`, error);
    throw error;
  }
};

export const deletePastExecomMember = async (year, memberId) => {
  const memberDocRef = doc(db, 'pastExecom', year, 'members', memberId);
  await deleteDoc(memberDocRef);
};

// Gallery Image Management Functions

export const addGalleryImage = async (imageData, imageFile) => {
  try {
    const imageUrl = await uploadToImgBB(imageFile);
    const timestamp = new Date().toISOString(); // Add a timestamp
    const dataToSave = { ...imageData, imageUrl, timestamp };
    await addDoc(collection(db, 'gallery'), dataToSave);
  } catch (error) {
    console.error('Error adding gallery image:', error);
    throw error;
  }
};

export const getPastExecomMembersByYear = async (year) => {
  try {
    const membersCollectionRef = collection(db, 'pastExecom', year, 'members');
    const memberSnapshots = await getDocs(membersCollectionRef);
    return memberSnapshots.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error fetching members for year ${year}:`, error);
    throw error;
  }
};

export const updateGalleryImage = async (imageId, updatedData, imageFile) => {
  try {
    const imageRef = doc(db, 'gallery', imageId);
    const updateObject = { ...updatedData };

    if (imageFile) {
      const newImageUrl = await uploadToImgBB(imageFile);
      updateObject.imageUrl = newImageUrl;
    }

    await updateDoc(imageRef, updateObject);
  } catch (error) {
    console.error('Error updating gallery image:', error);
    throw error;
  }
};

export const deleteGalleryImage = async (imageId) => {
  const imageRef = doc(db, 'gallery', imageId);
  await deleteDoc(imageRef);
};

export const fetchGalleryImages = async () => {
  try {
    const galleryRef = collection(db, "gallery");
    // Add orderBy to sort by timestamp in descending order
    const q = query(galleryRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    throw error;
  }
};

export const deleteUpcomingEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, "upcoming", eventId));
  } catch (error) {
    console.error("Error deleting upcoming event:", error);
    throw error;
  }
};

export const updateUpcomingEvent = async (eventId, updatedFields) => {
  try {
    const eventRef = doc(db, "upcoming", eventId);
    await updateDoc(eventRef, updatedFields);
  } catch (error) {
    console.error("Error updating upcoming event:", error);
  }
};

export const getUpcomingEvents = async () => {
  try {
    const upcomingEventsRef = collection(db, "upcoming");
    const snapshot = await getDocs(upcomingEventsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    throw error;
  }
};

export const getUpcomingEventById = async (eventId) => {
  try {
    const eventRef = doc(db, "upcoming", eventId);
    const docSnap = await getDoc(eventRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      console.log(`No upcoming event found with ID: ${eventId}`);
      return null; // Return null if no document is found
    }
  } catch (error) {
    console.error(`Error fetching upcoming event by ID ${eventId}:`, error);
    throw error; // Re-throw the error to be caught in the component
  }
};


export const addUpcomingEvent = async (eventData) => {
  try {
    await addDoc(collection(db, "upcoming"), eventData);
  } catch (error) {
    console.error("Error adding upcoming event:", error);
    throw error;
  }
};


export const fetchSocietyDataById = async (documentId) => {
  try {
    // Fetch the document directly from the 'societies' collection using the documentId
    const societyRef = doc(db, "societies", documentId);
    const docSnap = await getDoc(societyRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id, // Include the document ID
        aboutText: data.aboutText || "",
        backgroundImage: data.backgroundImage || "",
        heroImage: data.heroImage || "",
        society: data.society || "",
        email: data.email || ""
      };
    } else {
      console.log(`No document found with ID: ${documentId}`);
      return null; // Return null if no document is found
    }
  } catch (error) {
    console.error("Error fetching clubs data by ID:", error);
    throw error;
  }
};
export const updateSocietyData = async (society, newData) => {
  try {
    // Query the 'societies' collection to find the document with the matching 'society' field
    const societiesRef = collection(db, "societies");
    const q = query(societiesRef, where("society", "==", society));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Society document does not exist for the given society code!");
    }

    const societyDoc = querySnapshot.docs[0]; // Get the first document from the query result
    const societyRef = doc(db, "societies", societyDoc.id); // Use the document's ID
    const societySnap = await getDoc(societyRef); // Fetch the document again using its ID to confirm existence (optional but safe)
    if (!societySnap.exists()) {
      throw new Error("Society document does not exist!");
    }

    const updateObject = {
      aboutText: newData.aboutText,
      backgroundImage: typeof newData.backgroundImage === "string"
        ? newData.backgroundImage
        : await uploadToImgBB(newData.backgroundImage),
      heroImage: typeof newData.heroImage === "string"
        ? newData.heroImage
        : await uploadToImgBB(newData.heroImage),
    };

    await updateDoc(societyRef, updateObject);
    return updateObject;
  } catch (error) {
    console.error("Error updating club data:", error);
    throw error;
  }
};

export const fetchAllPeople = async () => {
  try {
    const peopleRef = collection(db, "members");
    const snapshot = await getDocs(peopleRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching all people:", error);
    throw error;
  }
};