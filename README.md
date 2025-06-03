# Alg to Img

A web app that converts Rubik's Cube algorithms into visual cube images using the [VisualCube API](https://visualcube.api.cubing.net/).

## Overview

- Input one or more cube algorithms
- Configure image size (px), puzzle type (2x2-7x7), stage (LL, OLL, COLL), and top color
- Toggles for inverse alg, mirror R/L, and plan view
- Preview generated images in the browser
- Download individual or zipped PNG images

## Tech Stack

- **Frontend**: React (TypeScript), PicoCSS, Axios, JSZip, FileSaver
- **Backend**: Express (TypeScript), CORS, Sharp
- **API**: [VisualCube](https://visualcube.api.cubing.net/)

## How to Use

1. Paste algorithms into the text field.
2. Adjust settings.
3. Click "Generate Images" to preview results.
4. Click "Download" to save images to your device.
