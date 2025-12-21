import { csfd } from "node-csfd-api";
import { randomUUID } from "node:crypto";
import { Title, TitleGenre } from "../title.model";

function mapCSFDToTitle(data: any): Title {
    const localizedTitles: Record<string, string> = {};
    for (let t of data.titlesOther ?? []) {
        const lang = mapCSFDLanguage(t.country) || t.country;
        localizedTitles[lang] = t.title;
    }

    return {
        id: randomUUID(),
        title: data.title,
        year: parseInt(data.year),
        type: data.type === "film" ? "movie" : "series",
        genres: data.genres?.map(mapCSFDGenre).filter(Boolean),
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

function mapCSFDGenre(raw: string): TitleGenre | undefined {
    const map: Record<string, TitleGenre> = {
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
    return map[raw];
}

function mapCSFDLanguage(raw: string): string | undefined {
    const map: Record<string, string> = {
        USA: "en",
        "Velká Británie": "en",
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
    return map[raw];
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
