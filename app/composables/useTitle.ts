export default function () {
    const GENRE_MAP: Record<TitleGenre, string> = {
        action: "Action",
        adventure: "Adventure",
        biography: "Biography",
        comedy: "Comedy",
        drama: "Drama",
        fantasy: "Fantasy",
        fairytale: "Fairytale",
        horror: "Horror",
        history: "History",
        sci_fi: "Sci-Fi",
        sport: "Sport",
        romance: "Romance",
        thriller: "Thriller",
        animation: "Animation",
        documentary: "Documentary",
        crime: "Crime",
        mystery: "Mystery",
        family: "Family",
        musical: "Musical",
        war: "War",
    };

    const STATE_MAP: Record<WatchState, string> = {
        planned: "Planned",
        started: "Started",
        finished: "Finished",
    };

    const TYPE_MAP: Record<TitleType, string> = {
        movie: "Movie",
        series: "Series",
        other: "Other",
    };

    const localeTitle = (titlesObj: TitlePublic["titles"]) => {
        const locale = useState<string>("locale");

        if (titlesObj[locale.value]) {
            return titlesObj[locale.value];
        }

        if (titlesObj["en"]) {
            return titlesObj["en"];
        }

        const keys = Object.keys(titlesObj);
        return keys.length > 0 ? titlesObj[keys[0]!] : "Unknown Title";
    };

    const resolveGenres = (titleGenres: TitleGenre[], addedGenres: TitleGenre[], excludedGenres: TitleGenre[]) => {
        return [...new Set([...titleGenres, ...addedGenres])]
            .filter((g) => !excludedGenres.includes(g))
            .map((g) => GENRE_MAP[g]);
    };

    const resolveGenre = (genre: TitleGenre) => {
        return GENRE_MAP[genre];
    };

    const resolveState = (state: WatchState) => {
        return STATE_MAP[state];
    };

    const resolveType = (type: TitleType) => {
        return TYPE_MAP[type];
    };

    return {
        localeTitle,
        resolveGenres,
        resolveGenre,
        resolveState,
        resolveType,
    };
}
