<template>
  <NotificationToast />
  <Confirm />

  <RouterView />
</template>

<style src="./styles/main.css"></style>

<script setup lang="ts">
import Confirm from "./components/Confirm.vue";
import NotificationToast from "./components/NotificationToast.vue";
import { useUserStore } from "./stores/user.store";

useUserStore();

window.addEventListener("keyup", (e: KeyboardEvent) => {
  if (e.key === "m" && e.ctrlKey) useUserStore().toggleTheme();
  else if (e.key === "m" && e.altKey) useUserStore().setLocale(useUserStore().locale === "cs" ? "en" : "cs");
})
</script>