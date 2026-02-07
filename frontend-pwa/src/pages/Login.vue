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
            <button @click="login('google')">
                <img src="../assets/google.svg" alt="Google" />
                <span>{{ $t("login.google-msg") }}</span>
            </button>

            <button @click="login('microsoft')">
                <img src="../assets/microsoft.svg" alt="Microsoft" />
                <span>{{ $t("login.microsoft-msg") }}</span>
            </button>
        </div>
    </main>
</template>

<style scoped src="/src/styles/login.css"></style>

<script setup lang="ts">
function login(provider: "google" | "microsoft") {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const urlParams = new URLSearchParams(window.location.search);
    const finalTarget = urlParams.get("redirect");

    let callbackUrl = `${window.location.origin}/login/callback`;
    if (finalTarget) callbackUrl += `?redirect=${encodeURIComponent(finalTarget)}`;

    const encodedCallback = encodeURIComponent(callbackUrl);

    window.location.href = `${baseUrl}/user/auth?provider=${provider}&redirect=${encodedCallback}`;
}
</script>
