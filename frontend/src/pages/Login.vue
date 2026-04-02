<template>
    <main>
        <header class="header">
            <div class="logo-wrapper">
                <img src="/favicon.svg" alt="Logo" />
            </div>
            <h1>{{ $t("login.welcome") }}</h1>
            <p>{{ $t("login.msg") }}</p>
        </header>

        <div class="auth">
            <button @click="login('google')" :disabled="userStore.isAuthLoading">
                <img src="../assets/google.svg" alt="Google" />
                <span>{{ $t("login.google-msg") }}</span>
            </button>

            <button @click="login('microsoft')" :disabled="userStore.isAuthLoading">
                <img src="../assets/microsoft.svg" alt="Microsoft" />
                <span>{{ $t("login.microsoft-msg") }}</span>
            </button>
        </div>
    </main>
</template>

<style scoped src="/src/styles/login.css"></style>

<script setup lang="ts">
import { authClient } from "../utils/auth";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "../stores/user.store";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

async function login(provider: "google" | "microsoft") {
    const redirectTo = route.query.redirect as string;
    await authClient.signIn.social(
        {
            provider: provider,
            callbackURL: `${window.location.origin}/login/callback${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`,
        },
        {
            onSuccess: () => {
                console.log("f");

                router.push(redirectTo || "/");
            },
        },
    );
}
</script>
