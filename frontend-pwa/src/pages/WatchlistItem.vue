<template>
    <Header>
        <template #center>
            <span>{{ titlesStore.displayTitle(item?.details) }}</span>
        </template>
        <template #actions>
            <Merge :size="20" v-if="!item?.details?.public && mergeCandidates.length > 0" @click="openMerge" />
            <Trash2 :size="20" @click="deleteItem" v-onlineonly />
        </template>
    </Header>

    <main v-if="watchlistsStore.isInitialLoading" class="loading-state">
        <LoaderIcon :size="48" class="animate-spin" />
        <p>Loading...</p>
    </main>
    <main v-else-if="item">
        <section class="hero" :style="{ '--poster-url': `url(${item.details?.poster})` }">
            <img v-if="item.details?.poster" :src="item.details.poster" class="poster" />
            <Image v-else class="poster" />

            <div class="hero-content">
                <div class="text">
                    <h1>{{ titlesStore.displayTitle(item.details) }}</h1>
                    <div class="quick-meta">
                        <span>{{ item.details?.year }}</span>
                        <Dot />
                        <span>{{ item.details?.durationMinutes }} min</span>
                        <span v-if="item.details?.avgRating" class="rating">
                            <Star :size="14" fill="currentColor" /> {{ item.details.avgRating }}
                        </span>
                    </div>
                </div>
                <button class="watched-btn" :class="item.state" @click.stop="toggleState()" v-onlineonly>
                    <Calendar v-if="item.state === 'planned'" :size="24" />
                    <Play v-else-if="item.state === 'started'" :size="24" />
                    <Check v-else-if="item.state === 'finished'" :size="24" />
                </button>
            </div>
        </section>

        <section class="details-content">
            <div class="info-group">
                <h3>Žánry</h3>
                <Triage v-model="genres" :items="ALL_GENRES" :states="['neutral', 'positive']" />
            </div>

            <RangeInput v-model="personalRating" label="Vlastní hodnocení" :min="0" :max="10" :step="0.1" />

            <div class="info-grid">
                <div v-if="item.details?.directors?.length">
                    <span class="label">Režie</span>
                    <span class="value">{{ item.details.directors.join(', ') }}</span>
                </div>

                <div v-if="item.details?.actors?.length">
                    <span class="label">Hrají</span>
                    <span class="value">{{ item.details.actors.join(', ') }}</span>
                </div>

                <div>
                    <span class="label">Přidáno</span>
                    <span class="value">{{ new Date(item.createdAt).toLocaleDateString(locale) }}, {{ addedBy?.name }}</span>
                </div>
            </div>
        </section>

        <Overlay v-model="isMergeExpanded" history-key="merge">
            <template #header>
                <h3>Merge candidates</h3>
            </template>
            <template #body>
                <ul v-if="mergeCandidates.length > 0" class="merge-list">
                    <li v-for="candidate in mergeCandidates" :key="candidate.displayData.titles[0]" class="merge-item" @click="confirmMerge(candidate)">
                        <img v-if="candidate.displayData.poster" :src="candidate.displayData.poster" class="poster" />
                        <Image v-else class="poster" />

                        <div class="info">
                            <span class="title">{{ titlesStore.displayTitle(candidate.displayData) }}</span>
                            <span class="other">{{ candidate.displayData.year ?? "-" }} | {{ candidate.displayData.type ?? "-" }}</span>
                        </div>

                        <Merge :size="20" class="merge-icon" />
                    </li>
                </ul>
                <p v-else class="empty-state">Žádní kandidáti k propojení nebyli nalezeni.</p>
            </template>
        </Overlay>
    </main>
</template>

<style scoped src="../styles/watchlistItem.css"></style>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useWatchlistsStore } from "../stores/watchlists.store";
import Header from "../components/Header.vue";
import { Trash2, LoaderIcon, Merge, Image, Check, Play, Dot, Star, Calendar, X } from "lucide-vue-next";
import { type MergeCandidate, TitleGenre, UserService, type User, type WatchListItem } from "../api";
import Overlay from "../components/Overlay.vue";
import Triage from "../components/Triage.vue";
import RangeInput from "../components/RangeInput.vue";
import { useI18n } from "vue-i18n";
import { useTitlesStore } from "../stores/titles.store";
import { useConfirmStore } from "../stores/confirm.store";

const props = defineProps<{ listId: string; itemId: string; }>();

const router = useRouter();
const { locale } = useI18n();
const watchlistsStore = useWatchlistsStore();
const titlesStore = useTitlesStore();
const confirmStore = useConfirmStore();
const ALL_GENRES = Object.values(TitleGenre);
const item = computed(() => watchlistsStore.enrichedListItem(props.listId, props.itemId));
const mergeCandidates = computed(() => {
    if (item.value?.details?.public) return [];
    else return item.value?.details?.mergeCandidates ?? [];
});
const genres = computed({
    get() {
        const mapping: Record<string, string> = {};
        ALL_GENRES.forEach(genre => {
            const isFromApi = item.value?.details?.genres?.includes(genre);
            const isExcluded = item.value?.excludedGenres?.includes(genre);
            const isAdded = item.value?.addedGenres?.includes(genre);
            mapping[genre] = (isFromApi && !isExcluded) || isAdded ? "positive" : "neutral";
        });
        return mapping;
    },
    async set(newMapping) {
        if (!item.value) return;

        let newAdded: TitleGenre[] = [];
        let newExcluded: TitleGenre[] = [];

        for (const [genre, state] of Object.entries(newMapping)) {
            const g = genre as TitleGenre;
            const isFromApi = item.value.details?.genres?.includes(g);
            const isActive = state === "positive";

            if (isFromApi) {
                if (isActive) newExcluded = newExcluded.filter((i) => i != g);
                else newExcluded.push(g);
            } else {
                if (isActive) newAdded.push(g);
                else newAdded = newAdded.filter((i) => i != g);
            }
        }

        await watchlistsStore.patchWatchlistItem(props.listId, props.itemId, { addedGenres: newAdded, excludedGenres: newExcluded });
    }
});
const personalRating = ref(item.value?.personalRating ?? 0);
let ratingTimeout: ReturnType<typeof setTimeout> | null = null;
const addedBy = ref<User | null>(null);
const isMergeExpanded = ref(false);

onMounted(() => watchlistsStore.fetchSingleList(props.listId));

watch(() => item.value, async (newVal) => {
    if (newVal?.personalRating !== undefined) personalRating.value = newVal.personalRating;
    if (newVal?.addedBy !== undefined) addedBy.value = await UserService.getUser(newVal.addedBy);
});

watch(personalRating, (newVal) => {
    if (ratingTimeout) clearTimeout(ratingTimeout);

    ratingTimeout = setTimeout(() => {
        watchlistsStore.patchWatchlistItem(props.listId, props.itemId, { personalRating: newVal });
    }, 500);
});

function openMerge() {
    isMergeExpanded.value = true;
}

async function confirmMerge(candidate: MergeCandidate) {
    const ok = await confirmStore.ask("Merge title", `Opravdu chcete propojit tento titul s ${titlesStore.displayTitle(candidate.displayData)}?`);
    if (ok) {
        await watchlistsStore.mergeWatchlistItemPlaceholder(props.listId, props.itemId, candidate);
        isMergeExpanded.value = false;
    }
}

async function toggleState() {
    if (!item.value) return;
    const states = ["planned", "started", "finished"] as WatchListItem.state[];
    const currentIndex = states.indexOf(item.value.state);
    const newState = states[(currentIndex + 1) % states.length];

    await watchlistsStore.patchWatchlistItem(props.listId, props.itemId, { state: newState });
}

async function deleteItem() {
    const ok = await confirmStore.ask("Delete title", "Opravdu smazat z listu?");
    if (ok) {
        await watchlistsStore.deleteWatchlistItem(props.listId, props.itemId);
        router.back();
    }
} 
</script>