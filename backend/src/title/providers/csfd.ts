import { csfd, CSFDFilmTypes, CSFDGenres } from "node-csfd-api";
import { randomUUID } from "node:crypto";
import { Title, TitleGenre, TitleType } from "../title.model.js";

const CSFD_TYPE_MAP: Partial<Record<CSFDFilmTypes, TitleType>> = {
    film: "movie",
    "tv-film": "movie",
    "tv-show": "series",
    series: "series",
    theatrical: "movie",
    concert: "other",
    season: "other",
    "student-film": "other",
    "amateur-film": "other",
    "music-video": "other",
    episode: "other",
    "video-compilation": "other",
};

const CSFD_GENRE_MAP: Partial<Record<CSFDGenres, TitleGenre>> = {
    Akční: "action",
    Animovaný: "animation",
    Dobrodružný: "adventure",
    Dokumentární: "documentary",
    Drama: "drama",
    Fantasy: "fantasy",
    Historický: "history",
    Horor: "horror",
    Komedie: "comedy",
    Krimi: "crime",
    Muzikál: "musical",
    Mysteriózní: "mystery",
    Pohádka: "fairytale",
    Rodinný: "family",
    Romantický: "romance",
    "Sci-Fi": "sci_fi",
    Sportovní: "sport",
    Thriller: "thriller",
    Válečný: "war",
    Životopisný: "biography",
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
        type: CSFD_TYPE_MAP[data.type as CSFDFilmTypes] ?? "other",
        titles: Object.keys(localizedTitles).length > 0 ? localizedTitles : {},
        poster: data.poster || data.photo,
        year: data.year ? parseInt(data.year) : undefined,
        genres: data.genres?.map((g: CSFDGenres) => CSFD_GENRE_MAP[g]).filter(Boolean),
        ratings: data.rating != null ? { csfd: data.rating / 10 } : {},
        directors: data.creators?.directors?.map((d: any) => d.name),
        actors: data.creators?.actors?.map((a: any) => a.name),
        durationMinutes: data.length,
        externalIds: { csfd: String(data.id) },
        mergeCandidates: [],
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
