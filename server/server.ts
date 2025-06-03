import express, { Request, Response } from 'express';
import cors from 'cors';
import axios from 'axios';
import sharp from 'sharp';

const app = express();
app.use(cors())
app.use(express.json());

const PORT = process.env.PORT || 5000;

enum Stage {
  None = "",
  LL = "ll",
  OLL = "oll",
  COLL = "coll",
}

enum TopColor {
  Yellow = "yellow",
  White = "white",
  Green = "green",
  Blue = "blue",
  Red = "red",
  Orange = "orange",
}

interface GenerateRequest {
  algs: string[];
  pzl: number;
  view: boolean;
  stage: Stage;
  size: number;
  inverse: boolean;
  mirror: boolean;
  topColor: TopColor;
}

function mirrorAlgorithm(alg: string): string {
  const moveMap: Record<string, string> = {
    R: 'L', L: 'R',
    U: 'U', D: 'D',
    F: 'F', B: 'B',
  };

  return alg
    .split(' ')
    .map(move => {
      const base = move[0];
      const suffix = move.slice(1);

      let mirroredBase = moveMap[base] || base;
      let mirroredSuffix = suffix;

      if (suffix === "'") {
        mirroredSuffix = "";
      } else if (suffix === "") {
        mirroredSuffix = "'";
      } else if (suffix === "2") {
        mirroredSuffix = "2";
      }

      return mirroredBase + mirroredSuffix;
    })
    .join(' ');
}

function getColorScheme(topColor: TopColor): string | undefined {
  switch (topColor) {
    case TopColor.Yellow: return undefined;
    case TopColor.White:  return "wrgyob";
    case TopColor.Green:  return "grybow";
    case TopColor.Blue:   return "brwgoy";
    case TopColor.Red:    return "rwboyg";
    case TopColor.Orange: return "oybrwg";
  }
}

app.post('/api/generate', (req: Request<{}, {}, GenerateRequest>, res: Response): void => {
  const { algs, pzl, view, stage, size, inverse, mirror, topColor } = req.body;

  if (!algs || !Array.isArray(algs)) {
    res.status(400).json({ error: 'A list of algorithms is required.' });
    return;
  }

  const images = algs.map((alg: string) => {
    let finalAlg = mirror ? mirrorAlgorithm(alg) : alg;
    const scheme = getColorScheme(topColor);

    let urlParam = inverse ? "alg" : "case";
    let url = `https://visualcube.api.cubing.net/visualcube.php?fmt=svg&size=${size}&pzl=${pzl}&${urlParam}=${encodeURIComponent(finalAlg)}`;

    if (view) url += `&view=plan`;
    if (stage !== "") url += `&stage=${stage}`;
    if (scheme) url += `&sch=${scheme}`;

    return { alg, url };
  });

  res.status(200).json({ images });
});

app.get('/api/image', async (req: Request, res: Response) => {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "Image URL required" });
    return;
  }

  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const pngBuffer = await sharp(response.data).png().toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.send(pngBuffer);
  } 
  catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ error: "Failed to fetch image" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});