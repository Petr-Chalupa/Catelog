<style src="./styles/main.css"></style>

<template>
  <NotificationToast />

  <RouterView />
</template>

<script setup lang="ts">
import NotificationToast from "./components/NotificationToast.vue";
import { useUserStore } from "./stores/user.store";

useUserStore();
</script>