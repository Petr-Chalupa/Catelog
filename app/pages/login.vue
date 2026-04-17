<template>
    <header>
        <div class="logo">
            <img src="/favicon.svg" alt="Logo" />
        </div>
        <h1>Sign in to continue</h1>
        <p v-if="error" class="error">{{ error.message }}</p>
    </header>

    <main>
        <div class="social">
            <button @click="handleSocial('google')" :disabled="isPending" data-theme="ghost" v-online-only>
                <img src="~/assets/img/google.svg" alt="Google" />
                GOOGLE
            </button>

            <button @click="handleSocial('microsoft')" :disabled="isPending" data-theme="ghost" v-online-only>
                <img src="~/assets/img/microsoft.svg" alt="Microsoft" />
                MICROSOFT
            </button>
        </div>
    </main>
</template>

<style scoped src="~/assets/styles/login.css"></style>

<script setup lang="ts">
const { execute: socialSignIn, status, error } = useSignIn("social");
const isPending = computed(() => status.value === "pending");

function handleSocial(provider: any) {
    socialSignIn({
        provider,
        callbackURL: "/app"
    });
}
</script>