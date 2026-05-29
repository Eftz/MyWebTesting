import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin with Service Account
// TODO: คุณต้องดาวน์โหลดไฟล์ Service Account ของ Firebase มาใส่ไว้ในโฟลเดอร์เดียวกัน
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync('./firebase-service-account.json', 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin Initialized Successfully");
} catch (error) {
  console.error("Failed to initialize Firebase Admin. Please ensure firebase-service-account.json exists and is valid.");
}

const db = admin.apps.length ? admin.firestore() : null;

const app = express();
app.use(cors());
app.use(express.json());

// API Endpoint สำหรับให้ cron-job.org เรียกทุกๆ 1 นาที
app.get('/check-todos', async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Firebase Admin not initialized' });
  }

  try {
    console.log(`[${new Date().toISOString()}] Checking for pending Todos...`);
    const now = new Date();
    // ปรับเวลาให้เป็น Timezone เดี่ยวกับผู้ใช้ (สมมติว่าเป็นเวลาเครื่องมือถือ) 
    // หรือใช้วิธีเปรียบเทียบจาก Timestamp ใน DB
    // ในที่นี้สมมติว่า Todo บันทึก time_ms (Unix Timestamp) ไว้
    const currentTimeMs = now.getTime();

    // ค้นหา Todo ที่ยังไม่ได้แจ้งเตือน และถึงเวลาแล้ว
    // ใช้ collectionGroup เพื่อดึง todos ของ users ทุกคน
    const todosRef = db.collectionGroup('todos');
    const q = todosRef.where('notified', '==', false);
    
    const snapshot = await q.get();

    if (snapshot.empty) {
      return res.status(200).json({ message: 'No pending notifications.' });
    }

    let notificationsSent = 0;

    // ลูปส่ง Push ให้กับทุก Todo ที่ถึงเวลา
    for (const doc of snapshot.docs) {
      const todo = doc.data();
      
      // เช็คเวลา (ทำแบบ in-memory เพราะ Firestore อาจไม่ได้ทำ index)
      if (todo.time_ms && todo.time_ms > currentTimeMs) continue;
      
      // ดึง User ID จาก Path ของ Document: users/{userId}/todos/{todoId}
      const userId = doc.ref.parent.parent.id;
      
      // ดึง FCM Token ของผู้ใช้คนนั้น
      // หมายเหตุ: โค้ดฝั่งแอปปัจจุบันเซฟ fcmToken ลงใน users/{email} ซึ่งเราต้องไปปรับให้ตรงกัน
      // เพื่อความชัวร์ เราจะสมมติว่า id ตรงนี้คือ email (หรือถ้าไม่ใช่ก็ค้นหาจาก users collection)
      const userDoc = await db.collection('users').doc(userId).get();
      
      let fcmToken = null;
      if (userDoc.exists) {
        fcmToken = userDoc.data().fcmToken;
      } else {
        // ลองหาแบบ Email ถ้าเซฟไว้แบบ email
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
          
          // อัปเดตสถานะใน DB ว่าแจ้งเตือนแล้ว จะได้ไม่แจ้งซ้ำ
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
