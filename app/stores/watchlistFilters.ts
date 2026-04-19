export const useWatchlistFiltersStore = defineStore(
    "watchlistFilters",
    () => {
        const filters = ref<WatchlistFilters>({});

        const passesTriage = (filterMap: Record<string, string> | undefined, itemValues: string[]) => {
            if (!filterMap) return true;
            return Object.entries(filterMap).every(([val, state]) => {
                if (state === "positive") return itemValues.includes(val);
                if (state === "negative") return !itemValues.includes(val);
                return true; // Neutral
            });
        };

        const getFilteredItems = (items: WatchlistItemPublic[]) => {
            const f = filters.value;

            return items.filter((item) => {
                if (
                    f.search &&
                    !Object.values(item.title.titles).some((t) => t.toLowerCase().includes(f.search!.toLowerCase()))
                ) {
                    return false;
                }
                if (f.maxDuration && (item.title.durationMinutes ?? 0) > f.maxDuration) return false;
                if (f.minRating && (item.personalRating ?? item.title.avgRating ?? 0) < f.minRating) return false;
                if (f.minYear && (item.title.year ?? 0) < f.minYear) return false;
                if (f.maxYear && (item.title.year ?? 9999) > f.maxYear) return false;

                const effectiveGenres = [...item.title.genres, ...item.addedGenres].filter(
                    (g) => !item.excludedGenres.includes(g),
                );

                return (
                    passesTriage(f.states, [item.state]) &&
                    passesTriage(f.types, [item.title.type]) &&
                    passesTriage(f.genres, effectiveGenres) &&
                    passesTriage(f.directors, item.title.directors) &&
                    passesTriage(f.actors, item.title.actors)
                );
            });
        };

        return {
            filters,
            getFilteredItems,
        };
    },
    { persist: true },
);
