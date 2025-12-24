<style src="./styles/main.css"></style>

<template>
  <RouterView />
</template>

<script setup lang="ts">
import { useUserStore } from "./stores/user.store";

useUserStore();
</script>