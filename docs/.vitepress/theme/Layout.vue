<script setup lang="ts">
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import HomePage from './components/HomePage.vue'

const { frontmatter } = useData()
</script>

<template>
  <template v-if="frontmatter.home">
    <HomePage />
  </template>
  <DefaultTheme.Layout v-else />
</template>
