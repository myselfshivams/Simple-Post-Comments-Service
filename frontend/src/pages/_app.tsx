import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
       <Head>
       <title>Post Comments Service</title>
       <meta name="description" content="Post-Comments Service - Share posts, comment, and engage" />
       <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
   </Head>
      <Component {...pageProps} />
    </>
  );
}
