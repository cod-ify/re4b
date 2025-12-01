// src/hooks/useCloudData.js
import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const useCloudData = (key, initialValue, user) => {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no user is logged in, don't try to fetch data
    if (!user) {
      setLoading(false);
      return;
    }

    // Reference to: users -> [USER_ID] -> appData -> [KEY]
    // Example: users -> abc123xyz -> appData -> budget
    const docRef = doc(db, 'users', user.uid, 'appData', key);

    // Real-time listener: updates automatically when data changes on any device
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data().value);
      } else {
        // If this is the first time, save the default value to the cloud
        setDoc(docRef, { value: initialValue }, { merge: true });
        setData(initialValue);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching cloud data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, key]);

  // Function to update data (works just like setState)
  const updateData = async (newValue) => {
    // 1. Update local UI immediately (Optimistic UI)
    const valueToStore = newValue instanceof Function ? newValue(data) : newValue;
    setData(valueToStore);

    // 2. Sync to Cloud in background
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid, 'appData', key);
        await setDoc(docRef, { value: valueToStore }, { merge: true });
      } catch (error) {
        console.error("Error saving to cloud:", error);
        // Ideally show a toast here if save fails
      }
    }
  };

  return [data, updateData, loading];
};