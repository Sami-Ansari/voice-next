"use client";

import {
  CreateProjectKeyResponse,
  LiveClient,
  LiveTranscriptionEvents,
  createClient,
} from "@deepgram/sdk";
import { useState, useEffect, useCallback, use } from "react";
import { useQueue } from "@uidotdev/usehooks";
import Dg from "@/media/dp.svg";
import Recording from "@/media/recording.svg";
import Image from "next/image";
import axios from "axios";
import Siriwave from 'react-siriwave';

import ChatGroq from "groq-sdk";


export default function Microphone() {
  const { add, remove, first, size, queue } = useQueue<any>([]);
  const [apiKey, setApiKey] = useState<CreateProjectKeyResponse | null>();
  const [neetsApiKey, setNeetsApiKey] = useState<string | null>();
  const [groqClient, setGroqClient] = useState<ChatGroq>();
  const [connection, setConnection] = useState<LiveClient | null>();
  const [isListening, setListening] = useState(false);
  const [isLoadingKey, setLoadingKey] = useState(true);
  const [isLoading, setLoading] = useState(true);
  const [isProcessing, setProcessing] = useState(false);
  const [micOpen, setMicOpen] = useState(false);
  const [microphone, setMicrophone] = useState<MediaRecorder | null>();
  const [userMedia, setUserMedia] = useState<MediaStream | null>();
  const [caption, setCaption] = useState<string | null>();
  const [audio, setAudio] = useState<HTMLAudioElement | null>();

  const toggleMicrophone = useCallback(async () => {
    if (microphone && userMedia) {
      setUserMedia(null);
      setMicrophone(null);

      microphone.stop();
    } else {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const microphone = new MediaRecorder(userMedia);
      microphone.start(500);

      microphone.onstart = () => {
        setMicOpen(true);
      };

      microphone.onstop = () => {
        setMicOpen(false);
      };

      microphone.ondataavailable = (e) => {
        add(e.data);
      };

      setUserMedia(userMedia);
      setMicrophone(microphone);
    }
  }, [add, microphone, userMedia]);

  useEffect(() => {
    if (!groqClient) {
      console.log("getting a new groqClient");
      fetch("/api/groq", { cache: "no-store" })
        .then((res) => res.json())
        .then((object) => {
          const groq = new ChatGroq({ apiKey: object.apiKey, dangerouslyAllowBrowser: true});

          setGroqClient(groq);
          setLoadingKey(false);
        })
        .catch((e) => {
          console.error(e);
        });
      
    }
  }, [groqClient]);

  useEffect(() => {
    if (!neetsApiKey) {
      console.log("getting a new neets api key");
      fetch("/api/neets", { cache: "no-store" })
        .then((res) => res.json())
        .then((object) => {
          if (!("apiKey" in object)) throw new Error("No api key returned");

          setNeetsApiKey(object.apiKey);
          setLoadingKey(false);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [neetsApiKey]);

  useEffect(() => {
    if (!apiKey) {
      console.log("getting a new api key");
      fetch("/api", { cache: "no-store" })
        .then((res) => res.json())
        .then((object) => {
          if (!("key" in object)) throw new Error("No api key returned");

          setApiKey(object);
          setLoadingKey(false);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [apiKey]);

  useEffect(() => {
    
    if (apiKey && "key" in apiKey) {
      console.log("connecting to deepgram");
      const deepgram = createClient(apiKey?.key ?? "");
      const connection = deepgram.listen.live({
        model: "nova-2",
        interim_results: false,
        language: "en-US",
        smart_format: true,
      });

      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log("connection established");
        setListening(true);
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log("connection closed");
        setListening(false);
        setApiKey(null);
        setConnection(null);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const words = data.channel.alternatives[0].words;
        const caption = words
          .map((word: any) => word.punctuated_word ?? word.word)
          .join(" ");
        if (caption !== "") {
          setCaption(caption);
          if (data.is_final) {            
            if (groqClient) {
              const completion = groqClient.chat.completions
              .create({
                messages: [
                  {
                    role: "assistant",
                    content: `You are communicating with the user on a phone, so your answers should not be too long and go directly to the essence of the sentences.You are Agakhan chat bot assistant.Read the entire context and then understand it and then answer the question. Provide all the necessary details related to the question. answer the question from your own knowledge  Hospital Entrance Gates and Drop-off Points
There are 3 main entrances on Stadium Road:
1. University Entrance Gate 1, to The Princess Zahra Pavilion, the medical and nursing schools,
CIME and the University Cenre.
2. Hospital Entrance Gate 2, to Emergency Services, Main Hospital and Clinics
3. University Sports Complex Entrance Gate 3, to Nazerali Walji, Ibn-e-Zuhr and Jena Bai Hussainali
Shariff (JHS) Buildings.
Parking
For Patients and Visitors
Free Main Parking Grounds (adjacent to the Soparivala Building and Khimji Gardens), Entrance
Gate 3
Free Parking Grounds (besides the Juma Building), Entrance Gate 1
Our tow trucks will remove cars or bikes causing an obstruction.
Paid Valet Parking Service
Princess Zahra Pavilion, Entrance Gate 1.
Main Hospital, Entrance Gate 2
Sports Complex, Entrance Gate 3, to Nazerali Walji, Ibn-e-Zuhr and Jena Bai Hussainali Shariff
(JHS),
For Faculty and Staff
Faculty and staff parking, Entrance Gate 1
Parking Grounds (besides the Juma Building), Entrance Gate 1
Faculty and staff vehicles should have a car-parking sticker which can be obtained from Security
Services.
Keep your cars and bikes safe. The hospital cannot take responsibility for the loss, theft or damage
to any vehicle or bike parked on our campus grounds.
On Campus Shuttle Service
The University Hospital offers a shuttle service that transports patients and visitors on campus.
Pick up and Drop-off Points
 Nazerali Walji Building
 Sports Centre
 School of Nursing
 Dean’s Office
Public Transportation
Patients, families, attendants and or visitors can access public transport from the main Stadium
Road. There is a rickshaw and taxi stand immediately outside the hospital entrance gate 2.
Safety and Security
Safety and Security is critical to the daily operations of the Hospital. The main purpose of the
security team is to protect patients, visitors, staff, property and information on the campus. We
request that you fully cooperate with the directions provided by our Security Guards.
Information Services
Patients queries can be answered by our information receptionists, positioned at any one of our
information desks:
 Main Hospital Courtyard
 Jenabai Hussainali Shariff Building, Ground Floor
 Princess Zahra Pavilion
For inquiries, please email: akuh.information@aku.edu
Wheelchairs
Wheelchairs can be found at the drop-off points near the Main Hospital Entrance, Emergency
Services, Princess Zahra Pavilion and Nazerali Walji Building. The campus has purpose-built ramps
to accommodate wheelchair access.
All wheelchairs are hospital property and cannot be taken outside the campus. The wheelchairs
must be returned to any of the drop-off points before leaving the hospital.`,
                  },
                  {
                    role: "user",
                    content: caption,
                  }
                ],
                model: "llama-3.1-70b-versatile",
              })
              .then((chatCompletion) => {
                if (neetsApiKey) {
                  setCaption(chatCompletion.choices[0]?.message?.content || "");
                  axios.post("https://api.neets.ai/v1/tts", {
                      text: chatCompletion.choices[0]?.message?.content || "",
                      voice_id: 'us-female-2',
                      params: {
                        model: 'style-diff-500'
                      }
                    },
                    {
                      headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': neetsApiKey
                      },
                      responseType: 'arraybuffer'
                    }
                    ).then((response) => {
                      const blob = new Blob([response.data], { type: 'audio/mp3' });
                      const url = URL.createObjectURL(blob);

                      const audio = new Audio(url);
                      setAudio(audio);
                      console.log('Playing audio.');
                      
                      audio.play();
                    })
                    .catch((error) => {
                      console.error(error);
                    });
                }
              });

            }
          }
        }
      });

      setConnection(connection);
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    const processQueue = async () => {
      if (size > 0 && !isProcessing) {
        setProcessing(true);

        if (isListening) {
          const blob = first;
          connection?.send(blob);
          remove();
        }

        const waiting = setTimeout(() => {
          clearTimeout(waiting);
          setProcessing(false);
        }, 250);
      }
    };

    processQueue();
  }, [connection, queue, remove, first, size, isProcessing, isListening]);

  function handleAudio() {
    return audio && audio.currentTime > 0 && !audio.paused && !audio.ended && audio.readyState > 2;
  }

  if (isLoadingKey)
    return (
      <span className="w-full text-center">Loading temporary API key...</span>
    );
  if (isLoading)
    return <span className="w-full text-center">Loading the app...</span>;

  return (
    <div className="w-full relative">
      <div className="relative flex w-screen  justify-center items-center max-w-screen-lg place-items-center content-center before:pointer-events-none after:pointer-events-none before:absolute before:right-0 after:right-1/4 before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px]">
      <Siriwave
        theme="ios9"
        autostart={handleAudio() || false}
       />
      </div>
      <div className="mt-10 flex flex-col align-middle items-center">
        <button className="w-24 h-24" onClick={() => toggleMicrophone()}>
          <Recording
            width="96"
            height="96"
            className={
              `cursor-pointer` + !!userMedia && !!microphone && micOpen
                ? "fill-red-400 drop-shadow-glowRed"
                : "fill-gray-600"
            }
          />
        </button>
        <div className="mt-20 p-6 text-xl text-center">
          {caption}
        </div>
      </div>
      
    </div>
  );
}