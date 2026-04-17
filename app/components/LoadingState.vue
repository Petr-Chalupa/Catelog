<template>
    <section class="loading-state">
        <Icon name="lucide:loader-circle" :size="30" class="animate-spin" />
        <h3>
            <slot>Loading...</slot>
        </h3>
    </section>
</template>

<style scoped>
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    text-align: center;
}

.animate-spin {
    animation: spin 1.5s linear infinite;
    justify-self: center;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}
</style>