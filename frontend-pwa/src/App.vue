<style src="./styles/main.css"></style>

<template>
  <RouterView />
</template>

<script setup lang="ts">
import { useTheme } from './composables/useTheme';

useTheme();
</script>