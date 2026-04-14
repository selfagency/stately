<script lang="ts">
import { browser } from '$app/environment';
import ShowcaseSection from '$lib/components/ShowcaseSection.svelte';
import { Button } from '$lib/components/ui/button/index.js';
import * as Field from '$lib/components/ui/field/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { mountStatelyInspector } from '$lib/inspector/bootstrap-client.js';
import {
  createStatelyInspectorHook,
  getStatelyInspectorHook,
  installStatelyInspectorHook
} from '$lib/inspector/hook.js';
import { onMount } from 'svelte';
import { createValidationDemo } from './validation-demo.svelte.js';

if (browser) {
  installStatelyInspectorHook(getStatelyInspectorHook() ?? createStatelyInspectorHook());
}

const demo = createValidationDemo();

let countInput = $state('');
let nameInput = $state('');
let emailInput = $state('');
let ageInput = $state('');

const counterCode = `const useStore = defineStore('my-store', {
  state: () => ({ count: 0 }),
  validate: (state) =>
    state.count >= 0 ? true : 'Count must be non-negative'
});
const manager = createStateManager().use(createValidationPlugin());
const store = useStore(manager);

store.$patch({ count: -1 }); // throws 'Count must be non-negative'`;

const formCode = `const useForm = defineStore('my-form', {
  state: () => ({ name: '', email: '' }),
  validate(state) {
    if (!state.name) return 'Name is required';
    if (!state.email.includes('@')) return 'A valid email is required';
    return true;
  }
});`;

onMount(() => {
  mountStatelyInspector();
  return () => demo.destroy();
});
</script>

<svelte:head>
  <title>Validation — Stately showcase</title>
</svelte:head>

<div class="container mx-auto space-y-8 px-4 py-8 md:px-6">
  <div class="space-y-2">
    <h1 class="text-3xl font-bold tracking-tight">Validation</h1>
    <p class="text-muted-foreground">
      Reject invalid mutations before they reach the store with the validation plugin.
    </p>
  </div>

  <!-- Counter validation -->
  <ShowcaseSection
    label="01"
    tag="Counter with guard"
    title="Reject mutations that violate invariants"
    description="The validate function runs before $patch commits. Attempting to set count to a negative number throws and the store is unchanged."
    code={counterCode}>
    <div class="space-y-4">
      <div>
        <p class="text-sm text-muted-foreground">Current count</p>
        <p data-testid="validation-counter-value" class="text-4xl font-semibold">{demo.counterStore.count}</p>
      </div>
      <div class="flex items-end gap-2">
        <Field.Field data-invalid={!!demo.counterError}>
          <Field.Label for="count-input">New count</Field.Label>
          <Input
            id="count-input"
            data-testid="validation-counter-input"
            type="number"
            aria-invalid={!!demo.counterError || undefined}
            bind:value={countInput}
            placeholder="Enter a number"
            class="w-40" />
        </Field.Field>
        <Button onclick={() => demo.trySetCount(Number(countInput))} data-testid="validation-counter-submit">
          Apply
        </Button>
        <Button
          variant="outline"
          onclick={() => {
            countInput = '-5';
            demo.trySetCount(-5);
          }}
          data-testid="validation-counter-invalid">
          Try -5 (invalid)
        </Button>
      </div>
      {#if demo.counterError}
        <Field.Error data-testid="validation-counter-error">{demo.counterError}</Field.Error>
      {/if}
    </div>
  </ShowcaseSection>

  <!-- Form validation -->
  <ShowcaseSection
    label="02"
    tag="Form validation"
    title="Validate multi-field form state"
    description="The validate function checks all fields before committing. Partial patches with invalid data are rejected, keeping the store consistent."
    code={formCode}>
    <div class="space-y-4">
      <Field.Group>
        <div class="grid gap-3 sm:grid-cols-3">
          <Field.Field>
            <Field.Label for="name-input">Name</Field.Label>
            <Input id="name-input" data-testid="validation-form-name" bind:value={nameInput} placeholder="Your name" />
          </Field.Field>
          <Field.Field>
            <Field.Label for="email-input">Email</Field.Label>
            <Input
              id="email-input"
              data-testid="validation-form-email"
              bind:value={emailInput}
              placeholder="you@example.com" />
          </Field.Field>
          <Field.Field>
            <Field.Label for="age-input">Age (optional)</Field.Label>
            <Input
              id="age-input"
              data-testid="validation-form-age"
              type="number"
              bind:value={ageInput}
              placeholder="25" />
          </Field.Field>
        </div>
      </Field.Group>

      <Button
        onclick={() =>
          demo.tryPatchForm({
            name: nameInput,
            email: emailInput,
            age: ageInput ? Number(ageInput) : ''
          })}
        data-testid="validation-form-submit">
        Submit
      </Button>

      {#if demo.formError}
        <Field.Error data-testid="validation-form-error">{demo.formError}</Field.Error>
      {/if}

      {#if !demo.formError && demo.formStore.name && demo.formStore.email}
        <p data-testid="validation-form-success" class="text-sm font-medium text-green-600">
          Saved: {demo.formStore.name} &lt;{demo.formStore.email}&gt;
          {#if demo.formStore.age}, age: {demo.formStore.age}{/if}
        </p>
      {/if}
    </div>
  </ShowcaseSection>
</div>
