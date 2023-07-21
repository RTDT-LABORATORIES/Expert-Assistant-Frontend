"use client";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  origin: "USER" | "AI";
  text: string;
  intermediateSteps: any[];
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [indexedDocs, setIndexedDocs] = useState<string[]>([]);
  const [history, setHistory] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<any>();
  const historyRef = useRef<Message[]>([]);

  historyRef.current = history;

  function pushHistory(message) {
    setHistory([...historyRef.current, message]);
  }

  // async function createIndexAndEmbeddings() {
  //   try {
  //     const result = await fetch(process.env.PROMPT_ENDPOINT as string, {
  //       method: "POST",
  //     });
  //     const json = await result.json();
  //     console.log("result: ", json);
  //   } catch (err) {
  //     console.log("err:", err);
  //   }
  // }

  async function sendQuery(ev) {
    ev.preventDefault();
    const queryEl = ev.target.query;
    const query = queryEl.value;
    if (!query) return;
    pushHistory({ origin: "USER", text: query });
    setLoading(true);
    queryEl.value = "";

    try {
      const result = await fetch(
        process.env.NEXT_PUBLIC_PROMPT_ENDPOINT as string,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            sessionId,
          }),
        }
      );
      const json = await result.json();
      console.log(json);
      pushHistory({
        origin: "AI",
        text: json.output,
        intermediateSteps: json.intermediateSteps.map((intermediateStep) => {
          const getObservation = () => {
            try {
              return JSON.parse(intermediateStep.observation);
            } catch (err) {
              return intermediateStep.observation;
            }
          };

          return {
            ...intermediateStep,
            observation: getObservation(),
          };
        }),
      });
      setLoading(false);
    } catch (err) {
      alert(err);
      console.log("err:", err);
      setLoading(false);
    }
  }

  async function fetchIndexedDocs() {
    const result = await fetch("/api/indexed-documents", {
      method: "GET",
    });
    const json = await result.json();
    setIndexedDocs(json.data);
  }

  useEffect(() => {
    fetchIndexedDocs();
    setSessionId(Date.now());
  }, []);

  return (
    <main className="flex flex-col items-center justify-between text-slate-700">
      <section className="w-full max-w-[700px] space-y-3 h-[90vh] flex flex-col px-2">
        <div className="pt-10 px-4 space-y-6 flex flex-col w-full grow overflow-y-auto">
          <h1 className="text-4xl font-bold text-center">
            RTDT expert assistant
          </h1>
          {history.map((message, key) => (
            <article
              key={key}
              className={`message max-w-[80%] rounded-lg px-3 ${
                message.origin === "USER"
                  ? "self-end bg-primary text-white"
                  : "self-start bg-slate-100"
              }`}
            >
              <ReactMarkdown>{message.text}</ReactMarkdown>
              {message.intermediateSteps?.length > 0 ? (
                <div className="my-3">
                  <hr className="border border-b-slate-200"></hr>
                  <details className="mt-3">
                    <summary className="cursor-pointer">
                      Intermediate steps
                    </summary>
                    <pre className="text-sm mt-2 bg-slate-200 rounded-lg px-3 py-2 break-words whitespace-pre-wrap text-slate-500">
                      {JSON.stringify(message.intermediateSteps, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : null}
            </article>
          ))}
        </div>
        <form
          onSubmit={sendQuery}
          className="flex items-center space-x-3"
          autoComplete="off"
        >
          <input
            className="border px-4 h-10 grow rounded-full"
            name="query"
            autoFocus
          />
          <button
            className="px-7 h-10 rounded-full bg-primary text-white mt-2 mb-2 disabled:bg-gray-200 disabled:text-gray-500"
            disabled={loading}
            type="submit"
          >
            {loading ? "Asking AI..." : "Ask AI"}
          </button>
        </form>
      </section>
      <section className="w-full max-w-[700px] px-2 pt-6 pb-12">
        <details className="">
          <summary>Indexed documents</summary>
          <ol className="space-y-2 list-decimal list-inside text-sm mt-4">
            {indexedDocs.map((indexedDoc) => (
              <li key={indexedDoc}>
                <a
                  href={`/documents/${indexedDoc}`}
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  {indexedDoc}
                </a>
              </li>
            ))}
          </ol>
        </details>
      </section>

      {/* {result && <p>{result}</p>} */}
      {/* consider removing this button from the UI once the embeddings are created ... */}
      {/* <button onClick={createIndexAndEmbeddings}>
        Create index and embeddings
      </button> */}
    </main>
  );
}
