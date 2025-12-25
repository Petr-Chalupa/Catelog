<template>
    <Header>
        <router-link to="/profile" class="profile">
            <CircleUserRound />
            <div class="info">
                <span class="name">{{ userStore.profile.name }}</span>
                <span class="email">{{ userStore.profile.email }}</span>
            </div>
        </router-link>
    </Header>

    <main>
        WATCHLISTS
    </main>
</template>

<style scoped src="../styles/watchlists.css"></style>

<script setup lang="ts">
import { useUserStore } from "../stores/user.store";
import { CircleUserRound } from "lucide-vue-next";
import Header from "../components/Header.vue";

const userStore = useUserStore();
</script>
