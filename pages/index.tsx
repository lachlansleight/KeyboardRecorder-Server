import { useState, useEffect } from "react";
import Head from "next/head";
import Layout from "../components/Layout";
import { Recording } from "../lib/data/types";
import axios from "axios";

export const Home = (): JSX.Element => {

    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRecordings = async () => {
            setLoading(true);
            const response = await axios("https://midirecorder-default-rtdb.firebaseio.com/recordings.json");
            setRecordings(Object.keys(response.data).map(key => response.data[key]));
            setLoading(false);
        }

        loadRecordings();
    }, [])

    return (
        <div>
            <Head>
                <title>Keyboard Recorder</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Layout>
                <h1>Welcome to the Keyboard Recorder front-end</h1>
                <pre>{JSON.stringify(recordings.map(r => ({...r, messages: []})), null, 2)}</pre>
            </Layout>
        </div>
    );
};

export default Home;
