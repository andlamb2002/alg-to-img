import { useState, useEffect } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import '@picocss/pico';
import './index.css';  

const API_BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "https://alg-to-img.onrender.com/";

type Stage = "ll" | "oll" | "coll";
type TopColor = "yellow" | "white" | "green" | "blue" | "red" | "orange";

interface Params {
  pzl: number;
  view: boolean;
  stage: Stage;
  size: number;
  inverse: boolean;
  mirror: boolean;
  topColor: TopColor;
}

interface CubeImage {
  alg: string;
  url: string;
}

async function downloadImages(images: { alg: string; url: string }[]): Promise<void>  {
  if (images.length === 0) return;

  if (images.length === 1) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/image?url=${encodeURIComponent(images[0].url)}`, {
        responseType: "blob"
      });
      saveAs(response.data, `alg.png`);
    } 
    catch (error) {
      console.error("Error downloading single image:", error);
    }
    return;
  }

  const zip = new JSZip();

  for (let i = 0; i < images.length; i++) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/image?url=${encodeURIComponent(images[i].url)}`, {
        responseType: "blob"
      });      
      zip.file(`alg${i + 1}.png`, response.data);
    } 
    catch (error) {
      console.error(`Error downloading image ${i + 1}:`, error);
      continue;
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "alg-imgs.zip");
}

function App() {
  const [algInput, setAlgInput] = useState<string>(() => {
    return localStorage.getItem("algInput") || "";
  });

  const defaultParams: Params = {
    pzl: 3,
    view: true,
    stage: "ll",
    size: 128,
    inverse: false,
    mirror: false,
    topColor: "yellow",
  };

  const [params, setParams] = useState<Params>(() => {
    const saved = localStorage.getItem("cubeParams");

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed as Params;
      } catch {
        console.warn("Failed to parse cubeParams from localStorage. Using defaults.");
      }
    }

    return defaultParams;
  });

  const [images, setImages] = useState<CubeImage[]>(() => {
    const saved = localStorage.getItem("cubeImages");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cubeParams", JSON.stringify(params));
  }, [params]);

  useEffect(() => {
    localStorage.setItem("algInput", algInput);
  }, [algInput]);

  useEffect(() => {
    localStorage.setItem("cubeImages", JSON.stringify(images));
  }, [images]);

  const handleSubmit = async () => {
    const LEGAL_MOVES: RegExp = /^[UDLRFBudlrfbMESxyz2']+$/;

    const algs = algInput
      .split('\n')
      .map(line => line.trim())
      .map(line =>
        line
          .split(' ')
          .filter(move => LEGAL_MOVES.test(move))
          .join(' ')
      )
      .filter(line => line.length > 0);

    setAlgInput(algs.join('\n'));

    const res = await axios.post(`${API_BASE_URL}/api/generate`, {
      algs,
      ...params,
    });

    setImages(res.data.images);
  };

  return (
    <main className="app-container">

      <h1>Alg to Img</h1>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>

        <div className="form-row-1">
          <label>
            Algorithms: 
            <textarea
              value={algInput}
              onChange={(e) => setAlgInput(e.target.value)}
              rows={8}
              cols={40}
            />
          </label>

          <div className="toggle-container">
            <label role="switch">
              <input
                type="checkbox"
                checked={params.inverse}
                onChange={() => setParams(p => ({ ...p, inverse: !p.inverse }))}
              />
              Inverse
            </label>

            <label role="switch">
              <input
                type="checkbox"
                checked={params.mirror}
                onChange={() => setParams(p => ({ ...p, mirror: !p.mirror }))}
              />
              Mirror
            </label>

            <label role="switch">
              <input
                type="checkbox"
                checked={params.view}
                onChange={(e) =>
                  setParams(p => ({ ...p, view: e.target.checked ? true : false }))
                }
              />
              Plan View
            </label>
          </div>

        </div>

        <div className="form-row-2">

          <fieldset className="radio-group">
            <legend>Size</legend>
            {[128, 256, 512, 1024].map(s => (
              <label key={s}>
                <input
                  type="radio"
                  name="size"
                  value={s}
                  checked={params.size === s}
                  onChange={() => setParams(p => ({ ...p, size: s }))}
                />
                {s}px
              </label>
            ))}
          </fieldset>

          <fieldset className="radio-group">
            <legend>Puzzle</legend>
            {[2, 3, 4, 5, 6, 7].map(n => (
              <label key={n}>
                <input
                  type="radio"
                  name="pzl"
                  value={n}
                  checked={params.pzl === n}
                  onChange={() => setParams(p => ({ ...p, pzl: n }))}
                />
                {n}x{n}
              </label>
            ))}
          </fieldset>

          <fieldset className="radio-group">
            <legend>Stage</legend>
            {["ll", "oll", "coll"].map(stage => (
              <label key={stage}>
                <input
                  type="radio"
                  name="stage"
                  value={stage}
                  checked={params.stage === stage}
                  onChange={() => setParams(p => ({ ...p, stage: stage as Stage }))}
                />
                {stage.toUpperCase()}
              </label>
            ))}
          </fieldset>

          <fieldset className="radio-group">
            <legend>Top Color</legend>
            {["yellow", "white", "green", "blue", "red", "orange"].map(color => (
              <label key={color}>
                <input
                  type="radio"
                  name="topColor"
                  value={color}
                  checked={params.topColor === color}
                  onChange={() => setParams(p => ({ ...p, topColor: color as TopColor }))}
                />
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </label>
            ))}
          </fieldset>
        </div>

        <button type="submit">Generate Images</button>

      </form>

      <div>
        {images.map((img, idx) => (
          <div key={idx}>
            <img src={img.url} alt={img.alg} />
          </div>
        ))}

        {images.length > 0 && (
          <button onClick={() => downloadImages(images)}>
            Download
          </button>
        )}

      </div>
    </main>
  );
}

export default App;
