<style scoped></style>

<template>
  <input type="text" v-model="query">
  <button @click="search">Search</button>

  <div>
    <div v-for="t in titles" :key="t.id">{{ t.title }} --- {{ t.year }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, type Ref } from "vue";
import { Title, TitlesService } from "./api";

const query = ref("");
const titles: Ref<Title[]> = ref([]);

async function search() {
  if (query.value.trim().length == 0) return;
  titles.value = await TitlesService.getTitlesSearch(query.value);
};
</script>
