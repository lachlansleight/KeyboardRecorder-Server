import axios from "axios";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { useCallback, useEffect, useState } from "react";
import { Recording } from "lib/data/types";
import Layout from "components/layout/FullscreenLayout";
import usePiano from "lib/piano/usePiano";
import Button from "components/controls/Button";

const RecordingAnalysisPage = ({ recording }: { recording: Recording }): JSX.Element => {
    const { piano, ctx } = usePiano();
    const [loading, setLoading] = useState(false);
    const [totalSampleCount, setTotalSampleCount] = useState(0);
    const [currentSample, setCurrentSample] = useState(0);
    const [allAverages, setAllAverages] = useState<
        { url: string; pitch: number; velocity: number; values: number[] }[]
    >([]);
    const [formattedAverages, setFormattedAverages] = useState<
        Record<string, Record<string, number[]>>
    >({});
    const [absoluteMax, setAbsoluteMax] = useState(0);

    //useEffect(() => {
    //
    //}, [recording]);

    console.log(recording);

    const loadAll = useCallback(() => {
        if (!ctx) return;
        if (!piano) return;
        if (!piano.loaded) return;

        const baseUrl = "https://tambien.github.io/Piano/audio/";
        const letters = ["C", "Ds", "Fs", "A"];
        const octaves = ["0", "1", "2", "3", "4", "5", "6", "7", "8"];
        const velocities = ["v1", "v3", "v5", "v7", "v9", "v11", "v13", "v15"];
        const sampleUrls: { pitch: number; velocity: number; url: string }[] = [];
        octaves.forEach((o, oi) => {
            letters.forEach((l, li) => {
                velocities.forEach((v, vi) => {
                    if (o === "0" && li < 9) return;
                    if (o === "8" && li > 0) return;
                    sampleUrls.push({
                        pitch: 12 + 3 * li + 12 * oi,
                        velocity: 16 * (vi + 1) - 1,
                        url: `${baseUrl}${l}${o}${v}.mp3`,
                    });
                });
            });
        });
        setTotalSampleCount(sampleUrls.length);

        const getSampleAverages = async (url: string) => {
            const buffer = await axios(url, { responseType: "arraybuffer" });
            const audioBuffer = await ctx.decodeAudioData(buffer.data);
            const samples = audioBuffer.getChannelData(0);
            const times = [0.2, 0.4, 0.8, 1.6, 3.2, 6.4, 12.8, 25.6];
            const sums: number[][] = [];
            let index = 0;
            sums.push([0, 0]);
            for (let i = 0; i < samples.length; i++) {
                if (i > audioBuffer.sampleRate * times[index]) {
                    sums.push([0, 0]);
                    index++;
                }
                sums[index][0] += samples[i] * samples[i];
                sums[index][1]++;
            }
            const averages = sums.map(sum => Math.sqrt(sum[0] / sum[1]));
            setAbsoluteMax(cur => Math.max(cur, Math.max(...averages)));
            return averages;
        };

        const runAnalysis = async (urls: { pitch: number; velocity: number; url: string }[]) => {
            setLoading(true);
            for (let i = 0; i < urls.length; i++) {
                setCurrentSample(i);
                const averages = await getSampleAverages(urls[i].url);
                setAllAverages(cur => [
                    ...cur,
                    {
                        url: urls[i].url,
                        pitch: urls[i].pitch,
                        velocity: urls[i].velocity,
                        values: averages,
                    },
                ]);
            }
            setLoading(false);
        };

        runAnalysis(sampleUrls);
    }, [piano, ctx]);

    useEffect(() => {
        const output: Record<string, Record<string, number[]>> = {};
        allAverages.forEach(average => {
            if (!output[average.pitch]) {
                output[average.pitch] = {};
            }
            output[average.pitch][average.velocity] = average.values.map(v => v / absoluteMax);
        });
        setFormattedAverages(output);
    }, [allAverages]);

    return (
        <Layout>
            {loading ? (
                <p>
                    Loading sample {currentSample + 1} of {totalSampleCount}
                </p>
            ) : (
                <Button onClick={loadAll} className="bg-primary-800 mx-4 text-4xl">
                    Load!
                </Button>
            )}
            {allAverages.length > 0
                ? allAverages.map((averages, i) => {
                      return (
                          <div key={i} className="flex gap-4">
                              <p className="w-24">{averages.url.split("/").slice(-1)[0]}</p>
                              <div className="flex items-end">
                                  {averages.values.map((value, j) => (
                                      <div
                                          key={j}
                                          className="bg-primary-500"
                                          style={{
                                              width: Math.pow(2, j),
                                              height: 1 + 20 * (value / absoluteMax),
                                          }}
                                      />
                                  ))}
                              </div>
                          </div>
                      );
                  })
                : null}
            {allAverages.length > 0 && <pre>{JSON.stringify(formattedAverages, null, 2)}</pre>}
        </Layout>
    );
};

export default RecordingAnalysisPage;

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
