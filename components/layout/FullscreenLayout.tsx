import { ReactNode } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import packageJson from "package.json";
import Header from "./Header";

const Layout = ({ children }: { children: ReactNode }): JSX.Element => {
    const router = useRouter();

    return (
        <>
            <Head>
                <title>MidiRecorder</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Header pathName={router ? router.pathname : "/"} />
            <main className="flex flex-col w-screen min-h-main bg-neutral-900 text-white">
                <div className="w-full flex-grow flex flex-col">{children}</div>
            </main>
            <footer className="px-4 flex items-center h-footer bg-neutral-800 text-neutral-200">
                <div className="container mx-auto flex justify-between">
                    <p>&copy; LachlanSleight 2022</p>
                    <p>v{packageJson.version}</p>
                </div>
            </footer>
        </>
    );
};

export default Layout;
