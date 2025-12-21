import { csfd } from "node-csfd-api";
import type { Title, TitleGenre } from "../models/Title";

function mapToTitle(data: any): Title {
    const localizedTitles: Record<string, string> = {};
    for (const t of data.titlesOther ?? []) {
        localizedTitles[t.country] = t.title;
    }

    return {
        id: "",
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

export function mapCSFDGenre(raw: string): TitleGenre | undefined {
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

export async function searchCSFD(query: string): Promise<Title[]> {
    const res = await csfd.search(query);

    const results: Title[] = [];
    res.movies?.forEach((m) => results.push(mapToTitle(m)));
    res.tvSeries?.forEach((s) => results.push(mapToTitle(s)));

    return results;
}

export async function fetchCSFDDetails(csfdId: string): Promise<Title | null> {
    const id = Number(csfdId);
    if (isNaN(id)) return null;

    const data = await csfd.movie(id);
    if (!data) return null;

    return mapToTitle(data);
}
