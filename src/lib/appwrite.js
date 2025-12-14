import { Client, Databases } from 'appwrite';

const client = new Client();

// 1. Masukkan Project ID (Cari di Settings Project Appwrite)
const PROJECT_ID = '693d1093002c0ee17cdb'; 

// 2. Endpoint (Biarkan default jika pakai Cloud)
const ENDPOINT = 'https://nyc.cloud.appwrite.io/v1'; 

client
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);

export const databases = new Databases(client);

// 3. Masukkan ID Database & Collection (Cari di tab Database Appwrite)
export const DB_ID = '693d1139002f8cdf71ab';       // Pastikan ID-nya persis ini
export const COLL_ID = '693d117700258a10fe5a';   // Pastikan ID-nya persis ini