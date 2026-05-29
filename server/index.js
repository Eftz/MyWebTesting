import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

let serviceAccount;
try {
  // โหลดจาก ENV Variable ที่คุณตั้งไว้บน Render
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin Initialized Successfully (from ENV)");
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error.message);
}

const db = admin.apps.length ? admin.firestore() : null;

const app = express();
app.use(cors());
app.use(express.json());

// Root route สำหรับทดสอบว่า server ทำงาน
app.get('/', (req, res) => {
  res.send('SmartLife Push Server is running 🚀');
});

// API Endpoint สำหรับ cron-job.org
app.get('/check-todos', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Firebase Admin not initialized' });
  }

  try {
    console.log(`[${new Date().toISOString()}] Checking for pending Todos...`);
    const now = new Date();
    const currentTimeMs = now.getTime();

    const todosRef = db.collectionGroup('todos');
    const q = todosRef.where('notified', '==', false);
    const snapshot = await q.get();

    if (snapshot.empty) {
      return res.status(200).json({ message: 'No pending notifications.' });
    }

    let notificationsSent = 0;

    for (const doc of snapshot.docs) {
      const todo = doc.data();
      if (todo.time_ms && todo.time_ms > currentTimeMs) continue;

      const userId = doc.ref.parent.parent.id;
      const userDoc = await db.collection('users').doc(userId).get();

      let fcmToken = null;
      if (userDoc.exists) {
        fcmToken = userDoc.data().fcmToken;
      } else {
        const usersSnapshot = await db.collection('users').get();
        usersSnapshot.forEach(uDoc => {
          if (uDoc.data().uid === userId && uDoc.data().fcmToken) {
            fcmToken = uDoc.data().fcmToken;
          }
        });
      }

      if (fcmToken) {
        const message = {
          notification: {
            title: `ถึงเวลา: ${todo.task}`,
            body: todo.energy || 'ได้เวลาทำภารกิจแล้ว!',
          },
          token: fcmToken
        };

        try {
          await admin.messaging().send(message);
          console.log(`Successfully sent push for Todo ${doc.id}`);
          await doc.ref.update({ notified: true });
          notificationsSent++;
        } catch (error) {
          console.error(`Error sending push for Todo ${doc.id}:`, error);
        }
      }
    }

    res.status(200).json({ message: `Checked successfully. Sent ${notificationsSent} notifications.` });

  } catch (error) {
    console.error("Error in /check-todos:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SmartLife Push Server running on port ${PORT}`);
});
