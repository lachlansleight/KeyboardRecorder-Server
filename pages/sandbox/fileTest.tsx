import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import axios from "axios";
import { useEffect, useState } from "react";
import { createMidiFile, getMidiFileBlocks, parseMidiFile } from "lib/midi/midiFile";
import { Recording } from "lib/data/types";
import Layout from "components/layout/Layout";

const FileTest = ({ recording }: { recording: Recording }): JSX.Element => {
    const [midiBuffer, setMidiBuffer] = useState<number[][]>([]);
    const [midiUrl, setMidiUrl] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [fileRec, setFileRec] = useState<Recording | null>(null);

    const updateMidiBuffer = (rec: Recording) => {
        setMidiBuffer(getMidiFileBlocks(rec));
        const data = createMidiFile(rec);
        //setMidiBuffer(getTestMidiBlocks());
        //const data = getTestMidiFile();
        setMidiUrl(URL.createObjectURL(new Blob([data], { type: "audio/midi" })));
    };
    useEffect(() => {
        updateMidiBuffer(recording);
    }, [recording]);

    useEffect(() => {
        if (!file) {
            setFileRec(null);
            return;
        }

        const readFile = async (file: File) => {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            setFileRec(parseMidiFile(bytes));
        };

        readFile(file);
    }, [file]);

    return (
        <Layout>
            <button
                style={{ display: "block", textAlign: "center", backgroundColor: "forestgreen" }}
                onClick={() => updateMidiBuffer(recording)}
            >
                Update
            </button>
            <a
                href={midiUrl}
                style={{ display: "block", textAlign: "center", backgroundColor: "forestgreen" }}
                download={`${recording.id}.mid`}
            >
                Download MIDI
            </a>
            <input
                type="file"
                onChange={e => {
                    setFile((e.target.files || [null])[0]);
                }}
            />
            {fileRec && <pre>{JSON.stringify(fileRec, null, 2)}</pre>}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                }}
            >
                {midiBuffer.map((block, i) => (
                    <div
                        key={i}
                        style={{
                            display: "flex",
                            gap: "1rem",
                        }}
                    >
                        {block.map((byte, j) => (
                            <div
                                key={i + "_" + j}
                                style={{
                                    width: "2rem",
                                    display: "flex",
                                    flexDirection: "column",
                                    placeItems: "center",
                                    textAlign: "center",
                                }}
                            >
                                <span>{byte.toString(16).toUpperCase()}</span>
                                <span>{byte}</span>
                                <span>{String.fromCharCode(byte)}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </Layout>
    );
};

export default FileTest;

export async function getServerSideProps(
    ctx: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{ recording: Recording }>> {
    try {
        const response = await axios(
            `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/recordings/${ctx.query.recordingId}.json`
        );
        return {
            props: {
                recording: { ...response.data, id: ctx.query.recordingId },
            },
        };
    } catch (error) {
        return {
            notFound: true,
        };
    }
}
