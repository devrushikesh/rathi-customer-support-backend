import admin from 'firebase-admin';
import serviceAccount from '../../serviceAccountKey.json' with { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});


const fcm = admin.messaging();


function sendPushNotification(token: string, payload: admin.messaging.Message) {
  return fcm.send
}

