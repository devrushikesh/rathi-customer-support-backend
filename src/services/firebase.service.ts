import admin from 'firebase-admin';
import serviceAccount from '../../serviceAccountKey.json' with { type: 'json' };


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
});


const fcm = admin.messaging();

export function sendPushNotification(token: string, notification: Record<string, string>, data: Record<string, any>) {
  const message: admin.messaging.Message = {
    token, notification, data
  };

  fcm.send(message)
    .then(res => console.log('Notification sent', res))
    .catch(err => console.error('Failed to send', err));
}

