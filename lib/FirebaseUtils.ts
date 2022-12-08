import { getDownloadURL, getStorage, uploadBytes, ref, deleteObject } from "firebase/storage";

const FirebaseUtils = {
    uploadBytes: async (file: Uint8Array, path: string): Promise<string> => {
        const storage = getStorage();
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        console.log("Uploaded file at " + path);
        return url;
    },
    deleteFile: async (path: string): Promise<void> => {
        const storage = getStorage();
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        console.log("Deleted file at " + path);
    },
};

export default FirebaseUtils;
