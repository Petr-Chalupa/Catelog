<template>
    Online: {{ isOnline }} <br>
    Locale: {{ locale }} <br>
    User: {{ user }} <br>

    <button @click="logout">LOGOUT</button>

    <input type="text" v-model="query">
    <button @click="search">Search</button>

    <div>
        <div v-for="t in titles" :key="t.id">{{ displayTitle(t) }} --- {{ t.year }}</div>
    </div>

</template>

<script setup lang="ts">
import { onMounted, ref, type Ref } from "vue";
import { AuthService, Title, TitlesService, UserService, type User } from "../api";
import { useAuthStore } from "../stores/auth.store";
import { router } from "../router";
import { useOnline } from "../composables/useOnline";
import { useI18n } from 'vue-i18n';


const { locale } = useI18n();
const isOnline = useOnline();
const user: Ref<User | null> = ref(null);
const query = ref("");
const titles: Ref<Title[]> = ref([]);

onMounted(async () => {
    user.value = await UserService.getUserMe();
});

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
