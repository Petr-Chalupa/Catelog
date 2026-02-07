<template>
    <Header>
        <template #center>
            <span>{{ list?.name }}</span>
        </template>
        <template #actions>
            <Search @click="openFilter" />
            <Settings @click="openSettings" />
        </template>
    </Header>

    <main v-if="watchlistsStore.isInitialLoading" class="loading-state">
        <LoaderIcon :size="48" class="animate-spin" />
        <p>{{ t("wl-detail.loading") }}</p>
    </main>
    <main v-else>
        <section v-if="filteredItems.length == 0" class="empty-state">
            <Library :size="48" />
            <p>{{ t("wl-detail.no-items") }}</p>
        </section>

        <DraggableList v-else :items="filteredItems" @row-click="goToItem($event.id)" @item-moved="({ element, newArray }) => watchlistsStore.updateListItemOrder(listId, newArray, element)">
            <template #body="{ item }">
                <div class="item">
                    <img v-if="item.details?.poster" :src="item.details.poster" class="poster" />
                    <Image v-else class="poster" />
                    <div class="info">
                        <div class="info">
                            <span class="title">{{ titlesStore.translateTitle(item.details) }}</span>
                            <span class="other">{{ item.details?.year ?? "?" }} | {{ titlesStore.translateType(item.details?.type) }}</span>
                            <span class="genres">
                                <span v-for="genre in item.resolvedGenres?.slice(0, 3)" :key="genre" class="genre-tag">
                                    {{ titlesStore.translateGenre(genre) }}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </template>
            <template #actions="{ item }">
                <button class="watched-btn" :class="item.state" @click.stop="handleItemState(item)" v-onlineonly>
                    <Play v-if="item.state === 'started'" :size="18" />
                    <Check v-else-if="item.state === 'finished'" :size="18" />
                </button>
            </template>
        </DraggableList>

        <button v-if="!isSearchExpanded" class="add-item-btn" @click="openSearch" v-onlineonly>
            <Plus :size="28" />
        </button>

        <Overlay v-model="isFilterExpanded" history-key="filter">
            <template #header>
                <Input v-model="filterQuery" :placeholder="$t('wl-detail.filter.input')" autoFocus>
                    <template #actions>
                        <button class="close-btn" @click="filterQuery = ''">
                            <X :size="20" />
                        </button>
                    </template>
                </Input>
            </template>
            <template #body>
                <div class="filter-body">
                    <div class="filter-content">
                        <div class="filter-section state">
                            <label class="section-label">{{ t("wl-detail.filter.state") }}</label>
                            <Triage :items="['planned', 'started', 'finished']" v-model="stateFilters">
                                <template #body="{ item }">
                                    {{ watchlistsStore.translateState(item) }}
                                </template>
                            </Triage>
                        </div>
                        <div class="filter-section">
                            <RangeInput :label="$t('wl-detail.filter.max-length')" v-model="maxDurationFilter" :min="availableFilters.durationRange.min" :max="availableFilters.durationRange.max"
                                unit="min" />
                        </div>
                        <div class="filter-section">
                            <RangeInput :label="$t('wl-detail.filter.min-rating')" v-model="minRatingFilter" :min="availableFilters.ratingRange.min" :max="availableFilters.ratingRange.max"
                                :step="0.1" />
                        </div>
                        <div class="filter-section">
                            <label class="section-label">{{ t("wl-detail.filter.year") }} [{{ availableFilters.yearRange.min }} - {{ availableFilters.yearRange.max }}]</label>
                            <div class="year-input-group">
                                <input type="number" v-model.number="minYearFilter" :min="availableFilters.yearRange.min" :max="maxYearFilter" />
                                <span class="year-separator">—</span>
                                <input type="number" v-model.number="maxYearFilter" :min="minYearFilter" :max="availableFilters.yearRange.max" />
                            </div>
                        </div>
                        <div class="filter-section">
                            <label class="section-label">{{ t("wl-detail.filter.genres") }}</label>
                            <Triage :items="availableFilters.genres" v-model="genreFilters" class="genre-triage-item">
                                <template #body="{ item }">
                                    {{ titlesStore.translateGenre(item) }}
                                </template>
                            </Triage>
                        </div>
                        <div class="filter-section">
                            <label class="section-label">{{ t("wl-detail.filter.directors") }}</label>
                            <Triage :items="availableFilters.directors" v-model="directorFilters" />
                        </div>
                        <div class="filter-section">
                            <label class="section-label">{{ t("wl-detail.filter.actors") }}</label>
                            <Triage :items="availableFilters.actors" v-model="actorFilters" />
                        </div>
                    </div>

                    <div class="filter-actions">
                        <button class="reset-btn" @click="resetFilters">
                            <RotateCcw :size="18" />
                            <span>{{ t("wl-detail.filter.reset") }}</span>
                        </button>
                        <button class="pick-btn" @click="openPick">
                            <Dices :size="18" />
                            <span>{{ t("wl-detail.filter.pick") }}</span>
                        </button>
                    </div>
                </div>
            </template>
        </Overlay>

        <Overlay v-model="isSearchExpanded" history-key="search" @close="closeSearch">
            <template #header>
                <Input v-model="searchQuery" :placeholder="$t('wl-detail.search.input')" @enter="handleSearch" autoFocus>
                    <template #actions>
                        <button class="search-btn" @click="handleSearch" :disabled="titlesStore.isProcessing" v-onlineonly>
                            <Search v-if="!titlesStore.isProcessing" :size="20" />
                            <LoaderIcon v-else :size="20" class="animate-spin" />
                        </button>
                        <button class="close-btn" @click="searchQuery = ''">
                            <X :size="20" />
                        </button>
                    </template>
                </Input>
            </template>
            <template #body>
                <div class="search-content">
                    <div v-if="titlesStore.isProcessing" class="search-loading">
                        <LoaderIcon :size="24" class="animate-spin" />
                        <span>{{ t("wl-detail.search.loading") }}</span>
                    </div>

                    <ul v-else-if="titlesStore.searchResults.length > 0" class="results">
                        <li v-for="title in titlesStore.searchResults" :key="title.id" class="result-item" @click="selectTitle(title)" v-onlineonly>
                            <img v-if="title.poster" :src="title.poster" class="poster" />
                            <Image v-else class="poster" />
                            <div class="info">
                                <span class="title">{{ titlesStore.translateTitle(title) }}</span>
                                <span class="other">{{ title.year ?? "?" }} | {{ titlesStore.translateType(title.type) }}</span>
                            </div>
                            <Plus :size="20" class="add-icon" />
                        </li>
                    </ul>

                    <div v-if="searchQuery.trim()" class="quick-add-option" @click="handleQuickAdd" v-onlineonly>
                        <div class="quick-add-icon">
                            <Plus :size="20" />
                        </div>
                        <span>{{ t("wl-detail.search.add-as-placeholder") }}: "<strong>{{ searchQuery }}</strong>"</span>
                    </div>
                </div>
            </template>
        </Overlay>
    </main>
</template>

<style scoped src="../styles/watchlistDetail.css"></style>

<script setup lang="ts">
import { Check, Dices, Image, Library, LoaderIcon, Play, Plus, RotateCcw, Search, Settings, X } from "lucide-vue-next";
import { useI18n } from "vue-i18n";
import { useWatchlistsStore } from "../stores/watchlists.store";
import Header from "../components/Header.vue";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useTitlesStore } from "../stores/titles.store";
import type { Title, WatchListItem } from "../api";
import DraggableList from "../components/DraggableList.vue";
import Overlay from "../components/Overlay.vue";
import Input from "../components/Input.vue";
import Triage from "../components/Triage.vue";
import RangeInput from "../components/RangeInput.vue";

const props = defineProps<{ listId: string }>();

const { t } = useI18n();
const router = useRouter();
const watchlistsStore = useWatchlistsStore();
const titlesStore = useTitlesStore();
const list = computed(() => watchlistsStore.lists.find((l) => l.id === props.listId));
const availableFilters = computed(() => watchlistsStore.availableListFilters(props.listId));
const isFilterExpanded = ref(false);
const isFilterFirstOpen = ref(true);
const filterQuery = ref("");
const stateFilters = ref<Record<string, string>>({ planned: "neutral", started: "neutral", finished: "negative" });
const genreFilters = ref<Record<string, string>>({});
const maxDurationFilter = ref<number>(Infinity);
const minYearFilter = ref<number>(0);
const maxYearFilter = ref<number>(Infinity);
const directorFilters = ref<Record<string, string>>({});
const actorFilters = ref<Record<string, string>>({});
const minRatingFilter = ref<number>(0);
const isSearchExpanded = ref(false);
const searchQuery = ref("");
const filteredItems = computed({
    get() {
        return watchlistsStore.enrichedListItems(props.listId)
            .filter(i => {
                const translateTitle = titlesStore.translateTitle(i.details);
                const matchesText = translateTitle.toLowerCase().includes(filterQuery.value.toLowerCase());
                if (!matchesText) return false;

                if (i.details?.durationMinutes && i.details.durationMinutes > maxDurationFilter.value) return false;

                const year = i.details?.year;
                if (year && (year < minYearFilter.value || year > maxYearFilter.value)) return false;

                const rating = i.details?.avgRating;
                if (rating && rating < minRatingFilter.value) return false;

                const checkTriage = (filters: Record<string, string>, itemValues: string[]) => {
                    const active = Object.entries(filters).filter(([_, s]) => s !== "neutral");
                    if (active.length === 0) return true;

                    const positives = active.filter(([_, s]) => s === "positive").map(([v]) => v);
                    if (positives.length > 0 && !positives.some(p => itemValues.includes(p))) return false;

                    const negatives = active.filter(([_, s]) => s === "negative").map(([v]) => v);
                    if (negatives.length > 0 && negatives.some(n => itemValues.includes(n))) return false;

                    return true;
                };

                if (!checkTriage(stateFilters.value, [i.state])) return false;
                if (!checkTriage(genreFilters.value, i.resolvedGenres)) return false;
                if (!checkTriage(directorFilters.value, i.details?.directors || [])) return false;
                if (!checkTriage(actorFilters.value, i.details?.actors || [])) return false;

                return true;
            })
            .sort((a, b) => (a.sortKey || "").localeCompare(b.sortKey || ""));
    },
    set(newArray) {
        watchlistsStore.listItems[props.listId] = newArray;
    }
});

onMounted(() => watchlistsStore.fetchSingleList(props.listId));

function openPick() {
    router.push({ name: "watchlistPick", params: { listId: props.listId } });
}

function openSettings() {
    router.push({ name: "watchlistSettings", params: { listId: props.listId } });
}

function goToItem(id: string) {
    router.push({ name: "watchlistItem", params: { listId: props.listId, itemId: id } });
}

function openFilter() {
    if (isFilterFirstOpen.value) {
        resetFilters();
        isFilterFirstOpen.value = false;
    }
    isFilterExpanded.value = true;
}

function openSearch() {
    isSearchExpanded.value = true;
}

function closeSearch() {
    isSearchExpanded.value = false;
    searchQuery.value = "";
    titlesStore.clearSearchResults();
}

function resetFilters() {
    filterQuery.value = "";
    maxDurationFilter.value = availableFilters.value.durationRange.max;
    minYearFilter.value = availableFilters.value.yearRange.min;
    maxYearFilter.value = availableFilters.value.yearRange.max;
    minRatingFilter.value = availableFilters.value.ratingRange.min;
    stateFilters.value = { planned: "neutral", started: "neutral", finished: "negative" };
    genreFilters.value = {};
    directorFilters.value = {};
    actorFilters.value = {};
}

async function handleQuickAdd() {
    if (!searchQuery.value.trim()) return;

    await watchlistsStore.addItemToList(props.listId, { name: searchQuery.value });
    searchQuery.value = "";
    isSearchExpanded.value = false;
}

async function handleSearch() {
    if (!searchQuery.value.trim()) return;

    await titlesStore.search(searchQuery.value);
    isSearchExpanded.value = true;
}

async function selectTitle(title: Title) {
    await watchlistsStore.addItemToList(props.listId, { title });

    searchQuery.value = "";
    isSearchExpanded.value = false;
    titlesStore.clearSearchResults();
}

async function handleItemState(item: WatchListItem) {
    await watchlistsStore.cycleWatchlistItemState(props.listId, item);
}
</script>