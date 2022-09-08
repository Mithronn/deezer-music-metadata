# deezer-music-metadata

A Typescript package for scraping Deezer musics (Support Tracks, Albums, Playlists, and Share Links) also include search option

# Installation

```
npm install @mithron/deezer-music-metadata
```

# Usage

```typescript
import { getData, Artist, Thumbnail } from "@mithron/deezer-music-metadata";

// Also works with share link
// getData("https://deezer.page.link/Vky9nsABeh4m1y9r7").then(console.log)
getData("https://www.deezer.com/us/track/916424").then(console.log);

// Returns undefined if any error is encountered
/*
  name: 'Without Me',
  url: 'https://www.deezer.com/track/916424',
  duration: 290, in seconds
  type: 'song',
  author: [
    {
      name: 'Eminem',
      url: 'https://www.deezer.com/artist/13',
      image?: 'https://e-cdns-images.dzcdn.net/images/artist/19cc38f9d69b352f718782e7a22f9c32/500x500-000000-80-0-0.jpg'
    }
  ] as Artist[],
  thumbnail: [
    {
      width: 500,
      height: 500,
      url: 'https://e-cdn-images.dzcdn.net/images/cover/ec3c8ed67427064c70f67e5815b74cef/500x500-000000-80-0-0.jpg'
    },
    {
      width: 250,
      height: 250,
      url: 'https://e-cdn-images.dzcdn.net/images/cover/ec3c8ed67427064c70f67e5815b74cef/250x250-000000-80-0-0.jpg'
    },
    {
      width: 56,
      height: 56,
      url: 'https://e-cdn-images.dzcdn.net/images/cover/ec3c8ed67427064c70f67e5815b74cef/56x56-000000-80-0-0.jpg'
    }
  ] as Thumbnail[]
*/
```

## Playlist and Album

```typescript
import {
  getData,
  Artist,
  Thumbnail,
  Track,
} from "@mithron/deezer-music-metadata";

// Also works with share link
// getData("https://deezer.page.link/x6JDXfCCawbdpwRj8").then(console.log)
getData(
  "https://www.deezer.com/us/playlist/1313621735?utm_campaign=clipboard-generic&utm_source=user_sharing"
);

// Returns undefined if any error is encountered
/*
  name: 'Top USA',
  url: 'https://www.deezer.com/playlist/1313621735',
  artist: {
    name: 'Deezer Charts',
    url: 'https://deezer.com/profile/637006841'
  } as Artist,
  type: 'playlist',
  description: '',
  thumbnail: [
    {
      width: 500,
      height: 500,
      url: 'https://e-cdns-images.dzcdn.net/images/playlist/5db67fb2a5d10d69fe4780dc11b2b174/500x500-000000-80-0-0.jpg'
    },
    {
      width: 250,
      height: 250,
      url: 'https://e-cdns-images.dzcdn.net/images/playlist/5db67fb2a5d10d69fe4780dc11b2b174/250x250-000000-80-0-0.jpg'
    },
    {
      width: 56,
      height: 56,
      url: 'https://e-cdns-images.dzcdn.net/images/playlist/5db67fb2a5d10d69fe4780dc11b2b174/56x56-000000-80-0-0.jpg'
    }
  ] as Thumbnail[],
  tracks: [
    {
      name: 'Add It Up',
      url: 'https://www.deezer.com/track/1796268537',
      duration: 165,
      author: [Array],
      thumbnail: [Array],
      type: 'song'
    },
    ...
  ] as Track[]
*/
```

## Search

```typescript
import {
  search,
  SearchOptions,
  SearchError,
  SearchType,
} from "@mithron/deezer-music-metadata";
import { AxiosRequestConfig } from "axios";

let options: SearchOptions = {
  type: SearchType.TRACK, // @default SearchType.ALL
  limit: 50, // @default 100
  index: 10, // search start index @default 0
  axiosOptions: undefined, // AxiosRequestConfig | undefined @default undefined
};

search("eminem", options).then(console.log);

// Returns undefined or SearchError if any error is encountered
/*
  data: [
    {
      id: 916424,
      readable: true,
      title: 'Without Me',
      title_short: 'Without Me',
      title_version: '',
      link: 'https://www.deezer.com/track/916424',
      duration: 290,
      rank: 961431,
      explicit_lyrics: true,
      explicit_content_lyrics: 1,
      explicit_content_cover: 0,
      preview: 'https://cdns-preview-c.dzcdn.net/stream/c-cca63b2c92773d54e61c5b4d17695bd2-8.mp3',
      md5_image: 'ec3c8ed67427064c70f67e5815b74cef',
      artist: [Object],
      album: [Object],
      type: 'track'
    },
    ...
  ],
  total: 300,
  prev?: 'https://api.deezer.com/search/track?q=eminem&limit=50&index=0',
  next?: 'https://api.deezer.com/search/track?q=eminem&limit=50&index=60'
}
*/
```
