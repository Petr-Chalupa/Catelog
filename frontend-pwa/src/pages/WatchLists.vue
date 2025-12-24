<template>
    <button @click="authStore.logout()">LOGOUT</button>

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
const authStore = useAuthStore();
</script>
