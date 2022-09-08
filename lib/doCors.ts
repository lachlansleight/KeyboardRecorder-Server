import Cors from "cors";
import { NextApiRequest, NextApiResponse } from "next";

// Initializing the cors middleware
const cors = Cors({
    methods: ["GET", "POST", "HEAD"],
});

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
const doCors = (req: NextApiRequest, res: NextApiResponse): Promise<any> => {
    return new Promise((resolve, reject) => {
        cors(req, res, (result: any) => {
            if (result instanceof Error) {
                return reject(result);
            }

            return resolve(result);
        });
    });
};

export default doCors;
