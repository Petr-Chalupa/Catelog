<template>
    <div class="container">
        <header class="header">
            <div class="logo-wrapper">
                <img src="/favicon.svg" alt="Logo" />
            </div>
            <h1>Welcome</h1>
            <p>Sign in to manage your watchlist</p>
        </header>

        <div class="auth">
            <button @click="login('google')">
                <img src="../assets/google.svg" alt="Google" />
                <span>Continue with Google</span>
            </button>

            <button @click="login('microsoft')">
                <img src="../assets/microsoft.svg" alt="Microsoft" />
                <span>Continue with Microsoft</span>
            </button>
        </div>
    </div>
</template>

<style scoped src="/src/styles/login.css"></style>

<script setup lang="ts">
const login = (provider: "google" | "microsoft") => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const callback = encodeURIComponent(`${window.location.origin}/login/callback`);

    window.location.href = `${baseUrl}/user/auth?provider=${provider}&redirect=${callback}`;
};
</script>
