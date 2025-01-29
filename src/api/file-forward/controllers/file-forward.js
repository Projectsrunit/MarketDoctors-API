"use strict";

const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} = require("firebase/storage");
const { Buffer } = require("buffer");
const fs = require("fs");
const streamToBuffer = require("stream-to-buffer");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

async function readStreamToBuffer(readStream) {
  return new Promise((resolve, reject) => {
    streamToBuffer(readStream, (err, buffer) => {
      if (err) return reject(err);
      resolve(buffer);
    });
  });
}

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

module.exports = {
  pushFile: async (ctx) => {
    try {
      const file = ctx.request.files.file;
      if (!file) {
        ctx.badRequest("No file");
        return;
      }

      const fileStream = fs.createReadStream(file.path);
      const buffer = await readStreamToBuffer(fileStream);
      const uint8arr = new Uint8Array(buffer);
      const uniqueFileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `medical_certificate/${uniqueFileName}`);
      const snapshot = await uploadBytes(storageRef, uint8arr);
      const fileUrl = await getDownloadURL(snapshot.ref);
      // const comment = 'done uploading'
      ctx.body = { fileUrl };
      ctx.status = 200;
    } catch (error) {
      ctx.body = { error };
      ctx.status = error.status || 400;
    }
  },

  pushImage: async (ctx) => {
    try {
      const file = ctx.request.files.file;
      if (!file) {
        ctx.badRequest("No file");
        return;
      }

      const fileStream = fs.createReadStream(file.path);
      const buffer = await readStreamToBuffer(fileStream);
      const uint8arr = new Uint8Array(buffer);
      const uniqueFileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `images/${uniqueFileName}`);
      const snapshot = await uploadBytes(storageRef, uint8arr);
      const fileUrl = await getDownloadURL(snapshot.ref);
      // const comment = 'done uploading'
      ctx.body = { fileUrl };
      ctx.status = 200;
    } catch (error) {
      ctx.body = { error };
      ctx.status = error.status || 400;
    }
  },
  pushCertificiate: async (ctx) => {
    try {
      const file = ctx.request.files.file;
      if (!file) {
        ctx.badRequest("No file");
        return;
      }

      const fileStream = fs.createReadStream(file.path);
      const buffer = await readStreamToBuffer(fileStream);
      const uint8arr = new Uint8Array(buffer);
      const uniqueFileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `practicing_license/${uniqueFileName}`);
      const snapshot = await uploadBytes(storageRef, uint8arr);
      const fileUrl = await getDownloadURL(snapshot.ref);
      // const comment = 'done uploading'
      ctx.body = { fileUrl };
      ctx.status = 200;
    } catch (error) {
      ctx.body = { error };
      ctx.status = error.status || 400;
    }
  },
};
