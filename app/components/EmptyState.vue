<template>
    <section class="empty-state">
        <Icon name="streamline-block:nature-cat" :size="30" />
        <h3>
            <slot name="title">Nothing here</slot>
        </h3>
        <p>
            <slot>Try adding something</slot>
        </p>
    </section>
</template>

<style scoped>
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem 2rem;
    text-align: center;

    h3 {
        margin-bottom: 0;
    }

    p {
        font-size: 1.1rem;
        font-style: italic;
    }
}
</style>