import { csfd, CSFDFilmTypes } from "node-csfd-api";
import { randomUUID } from "node:crypto";
import { Title, TitleGenre, TitleType } from "../title.model";

const CSFD_TYPE_MAP: Record<CSFDFilmTypes, TitleType> = {
    film: "movie",
    "TV film": "movie",
    seriál: "series",
    série: "series",
    epizoda: "other",
    pořad: "other",
    koncert: "other",
    "divadelní záznam": "other",
    "hudební videoklip": "other",
    "studentský film": "other",
    "amatérský film": "other",
};

const CSFD_GENRE_MAP: Record<string, TitleGenre> = {
    Akční: "action",
    Drama: "drama",
    "Sci-Fi": "sci_fi",
    Komedie: "comedy",
    Horor: "horror",
    Romantický: "romance",
    Dobrodružný: "adventure",
    Thriller: "thriller",
    Fantasy: "fantasy",
    Rodinný: "family",
    Historický: "history",
    Krimi: "crime",
    Animovaný: "animation",
    Muzikál: "musical",
    Dokument: "documentary",
    Mysteriózní: "mystery",
};

const CSFD_LANG_MAP: Record<string, string> = {
    USA: "en",
    "Velká Británie": "en",
    angličtina: "en",
    UK: "en",
    Česko: "cs",
    Československo: "cs",
    Slovensko: "sk",
    Francie: "fr",
    Německo: "de",
    Itálie: "it",
    Španělsko: "es",
    Japonsko: "ja",
    "Jižní Korea": "ko",
    Polsko: "pl",
    Maďarsko: "hu",
    Dánsko: "da",
    Švédsko: "sv",
    Norsko: "no",
    Kanada: "en",
    Austrálie: "en",
    "Nový Zéland": "en",
};

function mapCSFDToTitle(data: any): Title {
    const localizedTitles: Record<string, string> = {};
    for (let t of data.titlesOther ?? []) {
        const lang = CSFD_LANG_MAP[t.country] || t.country;
        localizedTitles[lang] = t.title;
    }
    if (!localizedTitles["cs"]) localizedTitles["cs"] = data.title;

    return {
        id: randomUUID(),
        title: data.title,
        year: data.year ? parseInt(data.year) : undefined,
        type: CSFD_TYPE_MAP[data.type as CSFDFilmTypes] ?? "other",
        genres: data.genres?.map((g: string) => CSFD_GENRE_MAP[g]).filter(Boolean),
        directors: data.creators?.directors?.map((d: any) => d.name),
        actors: data.creators?.actors?.map((a: any) => a.name),
        durationMinutes: data.length,
        ratings: data.rating != null ? { csfd: data.rating / 10 } : undefined,
        poster: data.poster || data.photo,
        localizedTitles: Object.keys(localizedTitles).length > 0 ? localizedTitles : undefined,
        externalIds: { csfd: String(data.id) },
        public: true,
    };
}

export async function searchCSFD(query: string, details: boolean): Promise<Title[]> {
    const res = await csfd.search(query);

    const searchResults = [...(res.movies || []), ...(res.tvSeries || [])];

    let finalData: Title[] = [];

    if (details) {
        const detailedResults = await Promise.all(searchResults.map((r) => searchCSFDById(r.id.toString())));
        finalData = detailedResults.filter((r) => r != null);
    } else {
        finalData = searchResults.map(mapCSFDToTitle);
    }

    return finalData;
}

export async function searchCSFDById(csfdId: string): Promise<Title | null> {
    const id = Number(csfdId);
    if (isNaN(id)) return null;

    const data = await csfd.movie(id);
    if (!data) return null;

    return mapCSFDToTitle(data);
}
