import axios, { AxiosRequestConfig } from "axios";
import { load } from "cheerio";

export enum Type {
    PLAYLIST = "playlist",
    ALBUM = "album",
    SONG = "song",
}

export enum SearchType {
    ALL = "all",
    ALBUM = "album",
    ARTIST = "artist",
    PLAYLIST = "playlist",
    PODCAST = "podcast",
    RADIO = "radio",
    TRACK = "track",
    USER = "user"
}

export interface SearchOptions {
    type?: SearchType,
    limit?: number,
    index?: number,
    axiosOptions?: AxiosRequestConfig
}

export interface SearchResult {
    data: any[],
    total: number,
    prev?: string,
    next?: string,
}

export interface SearchError {
    error: {
        type: string,
        message: string
        code: number
    }
}

export interface Artist {
    name: string;
    url: string;
    image?: string;
}

export interface Track {
    name: string;
    url: string;
    duration: number;
    author: Artist[]
    thumbnail: Thumbnail[];
    type: "song";
}

export interface Playlist {
    name: string;
    url: string;
    tracks: Track[];
    artist: Artist;
    description: string;
    thumbnail: Thumbnail[];
    type: "playlist" | "album";
}

export interface Thumbnail {
    width: number;
    height: number;
    url: string;
}

const DeezerTrackRegex = /^((?:https?:)\/\/)?((?:www)\.)?((?:deezer.com))\/?((?:[a-z]+|)\/)(track)\/([0-9]+)/;
const DeezerPlaylistRegex = /^((?:https?:)\/\/)?((?:www)\.)?((?:deezer.com))\/?((?:[a-z]+|)\/)(playlist)\/([0-9]+)/;
const DeezerAlbumRegex = /^((?:https?:)\/\/)?((?:www)\.)?((?:deezer.com))\/?((?:[a-z]+|)\/)(album)\/([0-9]+)/;
const DeezerShareLinkRegex = /^((?:https?:)\/\/)?((?:deezer)\.)?((?:page.link))\/([a-zA-Z0-9]+)/;

const BASE_URL = 'https://deezer.com';
const API_BASE_URL = 'https://api.deezer.com';

const DefaultSearchOptions: SearchOptions = {
    type: SearchType.ALL,
    limit: Infinity,
    index: 0,
    axiosOptions: undefined,
}

function URLType(url: string): Type | undefined {
    if (RegExp(DeezerTrackRegex).test(url)) {
        return Type.SONG;
    } else if (RegExp(DeezerPlaylistRegex).test(url)) {
        return Type.PLAYLIST;
    } else if (RegExp(DeezerAlbumRegex).test(url)) {
        return Type.ALBUM;
    } else {
        return undefined;
    }
}

export function validateURL(url: string): Type | "share-link" | undefined {
    if (RegExp(DeezerTrackRegex).test(url)) {
        return Type.SONG;
    } else if (RegExp(DeezerPlaylistRegex).test(url)) {
        return Type.PLAYLIST;
    } else if (RegExp(DeezerAlbumRegex).test(url)) {
        return Type.ALBUM;
    } else if (RegExp(DeezerShareLinkRegex).test(url)) {
        return "share-link"
    } else {
        return undefined;
    }
}

export async function getData(url: string, options?: AxiosRequestConfig): Promise<Playlist | Track | undefined> {
    let typeURL = URLType(url);
    let shareLinkType = RegExp(DeezerShareLinkRegex).test(url);

    if (!typeURL && !shareLinkType) {
        return undefined;
    }

    if (typeURL) {
        switch (typeURL) {
            case Type.SONG:
                let trackID = url.match(DeezerTrackRegex);
                if (!trackID) return undefined;
                url = `${API_BASE_URL}/track/${trackID[6]}`
                break;
            case Type.PLAYLIST:
                let playlistID = url.match(DeezerPlaylistRegex);
                if (!playlistID) return undefined;
                url = `${API_BASE_URL}/playlist/${playlistID[6]}`
                break;
            case Type.ALBUM:
                let albumID = url.match(DeezerAlbumRegex);
                if (!albumID) return undefined;
                url = `${API_BASE_URL}/album/${albumID[6]}`
                break;
            default:
                return undefined;
        }

        let data = await axios.get(url, options).then(res => res.data).catch((e) => undefined)
        if (!data) return undefined;

        switch (data.type) {
            case "track":
                return {
                    name: data.title,
                    url: data.link,
                    duration: Number(data.duration),
                    author: data.contributors.map((artist: any) => {
                        if (artist.type !== "artist" || !artist.link || !artist.name) return undefined;

                        return {
                            name: artist.name,
                            url: artist.link,
                            image: artist.picture_big,
                        } as Artist;
                    }).filter((artist: any) => artist),
                    thumbnail: [
                        {
                            width: 500,
                            height: 500,
                            url: `https://e-cdn-images.dzcdn.net/images/cover/${data.md5_image}/500x500-000000-80-0-0.jpg`
                        } as Thumbnail,
                        {
                            width: 250,
                            height: 250,
                            url: `https://e-cdn-images.dzcdn.net/images/cover/${data.md5_image}/250x250-000000-80-0-0.jpg`
                        } as Thumbnail,
                        {
                            width: 56,
                            height: 56,
                            url: `https://e-cdn-images.dzcdn.net/images/cover/${data.md5_image}/56x56-000000-80-0-0.jpg`
                        } as Thumbnail,
                    ],
                    type: Type.SONG
                } as Track;
            case Type.PLAYLIST:
                return {
                    name: data.title,
                    url: data.link,
                    artist: {
                        name: data.creator.name,
                        url: `${BASE_URL}/profile/${data.creator.id}`,
                    } as Artist,
                    type: Type.PLAYLIST,
                    description: data.description,
                    thumbnail: [
                        {
                            width: 500,
                            height: 500,
                            url: data.picture_big ?? `https://e-cdns-images.dzcdn.net/images/playlist/${data.md5_image}/500x500-000000-80-0-0.jpg`
                        },
                        {
                            width: 250,
                            height: 250,
                            url: data.picture_medium ?? `https://e-cdns-images.dzcdn.net/images/playlist/${data.md5_image}/250x250-000000-80-0-0.jpg`
                        },
                        {
                            width: 56,
                            height: 56,
                            url: data.picture_small ?? `https://e-cdns-images.dzcdn.net/images/playlist/${data.md5_image}/56x56-000000-80-0-0.jpg`
                        },
                    ],
                    tracks: data.tracks.data.map((track: any) => {
                        return {
                            name: track.title,
                            url: track.link,
                            duration: Number(track.duration),
                            author: [
                                {
                                    name: track.artist.name,
                                    url: track.artist.link,
                                } as Artist
                            ],
                            thumbnail: [
                                {
                                    width: 500,
                                    height: 500,
                                    url: `https://e-cdn-images.dzcdn.net/images/cover/${track.md5_image}/500x500-000000-80-0-0.jpg`
                                } as Thumbnail,
                                {
                                    width: 250,
                                    height: 250,
                                    url: `https://e-cdn-images.dzcdn.net/images/cover/${track.md5_image}/250x250-000000-80-0-0.jpg`
                                } as Thumbnail,
                                {
                                    width: 56,
                                    height: 56,
                                    url: `https://e-cdn-images.dzcdn.net/images/cover/${track.md5_image}/56x56-000000-80-0-0.jpg`
                                } as Thumbnail,
                            ],
                            type: Type.SONG
                        } as Track
                    })
                } as Playlist
            case Type.ALBUM:
                return {
                    name: data.title,
                    url: data.link,
                    artist: {
                        name: data.contributors[0]?.name,
                        url: data.contributors[0]?.link,
                        image: data.contributors[0]?.picture_medium,
                    } as Artist,
                    type: Type.ALBUM,
                    description: "",
                    thumbnail: [
                        {
                            width: 500,
                            height: 500,
                            url: data.cover_big ?? `https://e-cdns-images.dzcdn.net/images/cover/${data.md5_image}/500x500-000000-80-0-0.jpg`
                        },
                        {
                            width: 250,
                            height: 250,
                            url: data.cover_medium ?? `https://e-cdns-images.dzcdn.net/images/cover/${data.md5_image}/250x250-000000-80-0-0.jpg`
                        },
                        {
                            width: 56,
                            height: 56,
                            url: data.cover_small ?? `https://e-cdns-images.dzcdn.net/images/cover/${data.md5_image}/56x56-000000-80-0-0.jpg`
                        },
                    ],
                    tracks: data.tracks.data.map((track: any) => {
                        return {
                            name: track.title,
                            url: track.link,
                            duration: Number(track.duration),
                            author: [
                                {
                                    name: track.artist.name,
                                    url: track?.artist?.link ?? `${BASE_URL}/artist/${track.artist.id}`,
                                } as Artist
                            ],
                            thumbnail: [
                                {
                                    width: 500,
                                    height: 500,
                                    url: `https://e-cdn-images.dzcdn.net/images/cover/${track.md5_image}/500x500-000000-80-0-0.jpg`
                                } as Thumbnail,
                                {
                                    width: 250,
                                    height: 250,
                                    url: `https://e-cdn-images.dzcdn.net/images/cover/${track.md5_image}/250x250-000000-80-0-0.jpg`
                                } as Thumbnail,
                                {
                                    width: 56,
                                    height: 56,
                                    url: `https://e-cdn-images.dzcdn.net/images/cover/${track.md5_image}/56x56-000000-80-0-0.jpg`
                                } as Thumbnail,
                            ],
                            type: Type.SONG
                        } as Track
                    })
                } as Playlist

            default: return undefined;
        }
    } else {
        let data = await axios.get(url, options).then(res => res.data).catch((e) => undefined)
        if (!data) return undefined;

        const $ = load(data);

        let scriptData = $("script").filter((_, el) => $(el).text().includes("window.__DZR_APP_STATE__")).text().replace("window.__DZR_APP_STATE__ =", "").trim();

        if (!scriptData || scriptData.length === 0 || scriptData === "") return undefined;

        try {
            let normalizedData = JSON.parse(scriptData).DATA;
            if (!normalizedData) return undefined;

            switch (normalizedData.__TYPE__) {
                case Type.SONG:
                    return {
                        name: normalizedData.SNG_TITLE,
                        url: `${BASE_URL}/track/${normalizedData.SNG_ID}`,
                        duration: Number(normalizedData.DURATION),
                        author: normalizedData.ARTISTS.map((artist: any) => {
                            if (artist.__TYPE__ !== "artist" || !artist.ART_ID || !artist.ART_NAME) return undefined;

                            return {
                                name: artist.ART_NAME,
                                url: `${BASE_URL}/artist/${artist.ART_ID}`,
                                image: artist.ART_PICTURE ? `https://e-cdn-images.dzcdn.net/images/artist/${artist.ART_PICTURE}/500x500-000000-80-0-0.jpg` : null,
                            } as Artist;
                        }).filter((artist: any) => artist),
                        thumbnail: [
                            {
                                width: 500,
                                height: 500,
                                url: `https://e-cdn-images.dzcdn.net/images/cover/${normalizedData.ALB_PICTURE}/500x500-000000-80-0-0.jpg`
                            },
                            {
                                width: 250,
                                height: 250,
                                url: `https://e-cdn-images.dzcdn.net/images/cover/${normalizedData.ALB_PICTURE}/250x250-000000-80-0-0.jpg`
                            },
                            {
                                width: 56,
                                height: 56,
                                url: `https://e-cdn-images.dzcdn.net/images/cover/${normalizedData.ALB_PICTURE}/56x56-000000-80-0-0.jpg`
                            },
                        ],
                        type: Type.SONG
                    } as Track;
                case Type.PLAYLIST:
                    if (!normalizedData.PLAYLIST_ID) return undefined;

                    let playlist = {
                        name: normalizedData.TITLE,
                        url: `${BASE_URL}/playlist/${normalizedData.PLAYLIST_ID}`,
                        artist: {
                            name: normalizedData.PLAYLIST_LINKED_ARTIST[0].ART_NAME,
                            url: normalizedData.PLAYLIST_LINKED_ARTIST[0] ? `${BASE_URL}/artist/${normalizedData?.PLAYLIST_LINKED_ARTIST[0]?.ART_ID}` : "",
                            image: normalizedData.PLAYLIST_LINKED_ARTIST[0] ? `https://e-cdns-images.dzcdn.net/images/artist/${normalizedData?.PLAYLIST_LINKED_ARTIST[0]?.ART_PICTURE}/500x500-000000-80-0-0.jpg` : null,
                        } as Artist,
                        type: Type.PLAYLIST,
                        description: normalizedData.DESCRIPTION ?? "",
                        thumbnail: [
                            {
                                width: 500,
                                height: 500,
                                url: normalizedData.PLAYLIST_PICTURE ? `https://e-cdns-images.dzcdn.net/images/playlist/${normalizedData.PLAYLIST_PICTURE}/500x500-000000-80-0-0.jpg` : ""
                            },
                            {
                                width: 250,
                                height: 250,
                                url: normalizedData.PLAYLIST_PICTURE ? `https://e-cdns-images.dzcdn.net/images/playlist/${normalizedData.PLAYLIST_PICTURE}/250x250-000000-80-0-0.jpg` : ""
                            },
                            {
                                width: 56,
                                height: 56,
                                url: normalizedData.PLAYLIST_PICTURE ? `https://e-cdns-images.dzcdn.net/images/playlist/${normalizedData.PLAYLIST_PICTURE}/56x56-000000-80-0-0.jpg` : ""
                            },
                        ],
                        tracks: []
                    } as Playlist

                    let playlistTracks = await axios.get(`${API_BASE_URL}/playlist/${normalizedData.PLAYLIST_ID}`, options).then(res => res.data).catch(() => undefined);
                    if (!playlistTracks) return undefined;

                    playlist.tracks = playlistTracks.tracks.data.map((track: any) => {
                        return {
                            name: track.title,
                            url: track.link,
                            duration: Number(track.duration),
                            author: [
                                {
                                    name: track.artist.name,
                                    url: track.artist.link,
                                } as Artist
                            ],
                            thumbnail: [
                                {
                                    width: 500,
                                    height: 500,
                                    url: `https://e-cdn-images.dzcdn.net/images/cover/${track.md5_image}/500x500-000000-80-0-0.jpg`
                                } as Thumbnail,
                                {
                                    width: 250,
                                    height: 250,
                                    url: `https://e-cdn-images.dzcdn.net/images/cover/${track.md5_image}/250x250-000000-80-0-0.jpg`
                                } as Thumbnail,
                                {
                                    width: 56,
                                    height: 56,
                                    url: `https://e-cdn-images.dzcdn.net/images/cover/${track.md5_image}/56x56-000000-80-0-0.jpg`
                                } as Thumbnail,
                            ],
                            type: Type.SONG
                        } as Track
                    })

                    return playlist;
                case Type.ALBUM:
                    if (!normalizedData.ALB_ID) return undefined;

                    let album = {
                        name: normalizedData.ALB_TITLE,
                        url: `${BASE_URL}/album/${normalizedData.ALB_ID}`,
                        artist: {
                            name: normalizedData.ARTISTS[0].ART_NAME,
                            url: normalizedData.ARTISTS[0] ? `${BASE_URL}/artist/${normalizedData?.ARTISTS[0]?.ART_ID}` : "",
                            image: normalizedData.ARTISTS[0] ? `https://e-cdns-images.dzcdn.net/images/artist/${normalizedData?.ARTISTS[0]?.ART_PICTURE}/500x500-000000-80-0-0.jpg` : null,
                        } as Artist,
                        type: Type.ALBUM,
                        description: normalizedData.DESCRIPTION ?? "",
                        thumbnail: [
                            {
                                width: 500,
                                height: 500,
                                url: normalizedData.ALB_PICTURE ? `https://e-cdns-images.dzcdn.net/images/cover/${normalizedData.ALB_PICTURE}/500x500-000000-80-0-0.jpg` : ""
                            },
                            {
                                width: 250,
                                height: 250,
                                url: normalizedData.ALB_PICTURE ? `https://e-cdns-images.dzcdn.net/images/cover/${normalizedData.ALB_PICTURE}/250x250-000000-80-0-0.jpg` : ""
                            },
                            {
                                width: 56,
                                height: 56,
                                url: normalizedData.ALB_PICTURE ? `https://e-cdns-images.dzcdn.net/images/cover/${normalizedData.ALB_PICTURE}/56x56-000000-80-0-0.jpg` : ""
                            },
                        ],
                        tracks: []
                    } as Playlist

                    let albumTracks = await axios.get(`${API_BASE_URL}/album/${normalizedData.ALB_ID}`, options).then(res => res.data).catch(() => undefined);
                    if (!albumTracks) return undefined;

                    album.tracks = albumTracks.tracks.data.map((track: any) => {
                        return {
                            name: track.title,
                            url: track.link,
                            duration: Number(track.duration),
                            author: [
                                {
                                    name: track.artist.name,
                                    url: track?.artist?.link ?? `${BASE_URL}/artist/${track.artist.id}`,
                                } as Artist
                            ],
                            thumbnail: [
                                {
                                    width: 500,
                                    height: 500,
                                    url: `https://e-cdn-images.dzcdn.net/images/cover/${track.md5_image}/500x500-000000-80-0-0.jpg`
                                } as Thumbnail,
                                {
                                    width: 250,
                                    height: 250,
                                    url: `https://e-cdn-images.dzcdn.net/images/cover/${track.md5_image}/250x250-000000-80-0-0.jpg`
                                } as Thumbnail,
                                {
                                    width: 56,
                                    height: 56,
                                    url: `https://e-cdn-images.dzcdn.net/images/cover/${track.md5_image}/56x56-000000-80-0-0.jpg`
                                } as Thumbnail,
                            ],
                            type: Type.SONG
                        } as Track
                    })

                    return album;
                default: return undefined;
            }
        } catch (e) {
            return undefined;
        }
    }
}

export async function search(query: string, options: SearchOptions = DefaultSearchOptions): Promise<SearchResult | SearchError | undefined> {
    options = Object.assign(DefaultSearchOptions, options);

    const { type, limit, index, axiosOptions } = options;
    const SEARCH_URL = new URL(`${API_BASE_URL}/search`);

    switch (type) {
        case SearchType.ALL:
            SEARCH_URL.pathname = "/search"
            break;
        case SearchType.ALBUM:
            SEARCH_URL.pathname = "/search/album"
            break;
        case SearchType.ARTIST:
            SEARCH_URL.pathname = "/search/artist"
            break;
        case SearchType.PLAYLIST:
            SEARCH_URL.pathname = "/search/playlist"
            break;
        case SearchType.PODCAST:
            SEARCH_URL.pathname = "/search/podcast"
            break;
        case SearchType.RADIO:
            SEARCH_URL.pathname = "/search/radio"
            break;
        case SearchType.TRACK:
            SEARCH_URL.pathname = "/search/track"
            break;
        case SearchType.USER:
            SEARCH_URL.pathname = "/search/user"
            break;
        default:
            SEARCH_URL.pathname = "/search"
            break;
    }

    SEARCH_URL.searchParams.append("q", query);
    if (limit && !isNaN(limit) && isFinite(limit)) {
        SEARCH_URL.searchParams.append("limit", String(limit));
    } else {
        SEARCH_URL.searchParams.append("limit", String(100))
    }

    if (index && !isNaN(index) && isFinite(index) && index > 0) {
        SEARCH_URL.searchParams.append("index", String(index));
    }

    let data = await axios.get(SEARCH_URL.href, axiosOptions).then(res => res.data).catch(() => undefined);

    if (!data) return undefined;

    if (data.error) return data as SearchError;

    return data as SearchResult;


}