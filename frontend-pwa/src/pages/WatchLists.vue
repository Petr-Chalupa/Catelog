<template>
    Online: {{ isOnline }} <br>
    Locale: {{ locale }} <br>
    User: {{ userStore.profile }} <br>

    <button @click="logout">LOGOUT</button>

    <input type="text" v-model="query">
    <button @click="search">Search</button>

    <div>
        <div v-for="t in titles" :key="t.id">{{ displayTitle(t) }} --- {{ t.year }}</div>
    </div>

</template>

<script setup lang="ts">
import { ref, type Ref } from "vue";
import { AuthService, Title, TitlesService } from "../api";
import { useAuthStore } from "../stores/auth.store";
import { router } from "../router";
import { useOnline } from "../composables/useOnline";
import { useI18n } from 'vue-i18n';
import { useUserStore } from "../stores/user.store";

const { locale } = useI18n();
const isOnline = useOnline();
const userStore = useUserStore();
const query = ref("");
const titles: Ref<Title[]> = ref([]);

async function search() {
    if (query.value.trim().length == 0) return;
    titles.value = await TitlesService.getTitlesSearch(query.value);
};

function displayTitle(title: Title) {
    return title.localizedTitles ? title.localizedTitles[locale.value] || title.title : title.title;
}

function logout() {
    const authStore = useAuthStore();
    authStore.clearToken();
    AuthService.postUserAuthLogout();
    router.push("/login");
}
</script>
