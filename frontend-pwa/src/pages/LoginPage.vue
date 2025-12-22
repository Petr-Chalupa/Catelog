<template>
    <div class="login-container">
        <h1>LOGIN</h1>
        <button @click="login('google')">Login with Google</button>
        <button @click="login('microsoft')">Login with Microsoft</button>
    </div>
</template>


<script setup lang="ts">
const login = (provider: 'google' | 'microsoft') => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const callback = encodeURIComponent(`${window.location.origin}/login/callback`);

    window.location.href = `${baseUrl}/user/auth?provider=${provider}&redirect=${callback}`;
};
</script>
