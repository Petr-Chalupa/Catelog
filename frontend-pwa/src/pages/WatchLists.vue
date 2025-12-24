<template>
    <header class="header">
        <router-link to="/profile" class="profile">
            <CircleUserRound />
            <div class="info">
                <span class="name">{{ userStore.profile.name }}</span>
                <span class="email">{{ userStore.profile.email }}</span>
            </div>
        </router-link>

        <WifiOff v-if="!isOnline" class="offline" />
    </header>

    <main class="main-content">
        WATCHLISTS
    </main>
</template>

<style scoped src="../styles/watchlists.css"></style>

<script setup lang="ts">
import { ref, type Ref } from "vue";
import { AuthService, Title, TitlesService } from "../api";
import { useAuthStore } from "../stores/auth.store";
import { router } from "../router";
import { useOnline } from "../composables/useOnline";
import { useI18n } from 'vue-i18n';
import { useUserStore } from "../stores/user.store";
import { CircleUserRound, SunMoon, WifiOff } from "lucide-vue-next";

const { locale } = useI18n();
const isOnline = useOnline();
const userStore = useUserStore();
const authStore = useAuthStore();
</script>
