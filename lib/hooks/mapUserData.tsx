import { User } from "firebase/auth";
import { FbUser } from "./authTypes";

export const mapUserData = async (user: User) => {
    const { uid, email } = user;
    const token = await user.getIdToken(true);
    const output: FbUser = {
        uid,
        email: email || "",
        token,
    };
    return output;
};
