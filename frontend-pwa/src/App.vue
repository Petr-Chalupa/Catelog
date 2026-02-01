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
</script>