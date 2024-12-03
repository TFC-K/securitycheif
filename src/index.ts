import 'dotenv/config';
import * as http from './src/http';
import Test from './src/interfaces/test';
import { ArtifactType } from './src/interfaces/interfaces';

// Test.getTestById('09001563b89d78f6c38b0f54edbb5ff3')!.artifacts = [
//     {
//         content: `# Dillinger
// ## _The Last Markdown Editor, Ever_

// [![N|Solid](https://cldup.com/dTxpPi9lDf.thumb.png)](https://nodesource.com/products/nsolid)

// [![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

// Dillinger is a cloud-enabled, mobile-ready, offline-storage compatible,
// AngularJS-powered HTML5 Markdown editor.`,
//         type: ArtifactType.Markdown,
//         title: 'dit is een markdown sectie'
//     },
//     {
//         content: 'https://file-examples.com/storage/feb06822a967475629bfe71/2017/04/file_example_MP4_480_1_5MG.mp4',
//         type: ArtifactType.Video,
//         title: 'dit is een video sectie'
//     },
//     {
//         content: 'https://i.postimg.cc/V6Ft1Bhb/vibe3.jpg',
//         type: ArtifactType.Image,
//         title: 'dit is een foto'
//     }
// ];

http.listen(parseInt(process.env.HTTP_PORT ?? '80'));