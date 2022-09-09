import { getDownloadURL, getStorage, uploadBytes, ref } from "firebase/storage";

const FirebaseUtils = {
    uploadBytes: async (file: Uint8Array, path: string): Promise<string> => {
        const storage = getStorage();
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return url;
    },
};

export default FirebaseUtils;
