import admin from "firebase-admin";

let adminDb = null;

// const projectId =
//   process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const projectId =
  process.env.FIREBASE_PROJECT_ID;

const clientEmail =
  process.env.FIREBASE_CLIENT_EMAIL;

const privateKey =
  process.env.FIREBASE_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

console.log("ENV CHECK:", {
  projectId,
  clientEmail,
  hasPrivateKey: !!privateKey,
});

if (
  projectId &&
  clientEmail &&
  privateKey
) {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential:
        admin.credential.cert({
          projectId: String(projectId),
          clientEmail: String(clientEmail),
          privateKey: String(privateKey),
        })
    });
  }

  adminDb = admin.firestore();
}

export { adminDb };