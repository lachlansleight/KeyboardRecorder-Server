import { getDownloadURL, getStorage, uploadBytes, ref } from "firebase/storage";

const FirebaseUtils = {
    uploadBytes: async (file: Uint8Array, path: string): Promise<string> => {
        console.log("Uploading file", typeof file, file);
        const storage = getStorage();
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        console.log("Upload snapshot", snapshot);
        const url = await getDownloadURL(storageRef);
        return url;
    },
};

export default FirebaseUtils;
