<template>
    <header>
        <h1>Catelog</h1>
        <NuxtLink to="/login">Log in</NuxtLink>
    </header>

    <main>
        <h2>Movie night. Purr-fectly organized.</h2>

        <p>
            Watch your favourite movies with your best friends!
            Catelog will help you keep your watchlists clean and in sync.
        </p>

        <NuxtLink to="/app">
            <button data-theme="primary">Start Watching</button>
        </NuxtLink>
    </main>
</template>

<style scoped src="~/assets/styles/landing.css"></style>