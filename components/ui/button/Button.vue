<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui";
import type { HTMLAttributes, ButtonHTMLAttributes } from "vue";
import type { ButtonVariants } from ".";
import { Primitive } from "reka-ui";
import { cn } from "~/lib/utils";
import { buttonVariants } from ".";
import { Loader2 } from "lucide-vue-next";

/* @vue-ignore */
interface Props extends PrimitiveProps {
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  class?: HTMLAttributes["class"];
  type?: ButtonHTMLAttributes["type"];
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
  type: "button",
  loading: false,
});
</script>

<template>
  <button
    v-if="props.as === 'button' && !props.asChild"
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :class="
      cn(
        buttonVariants({ variant: props.variant, size: props.size }),
        props.class
      )
    "
    v-bind="$attrs"
  >
    <Loader2 v-if="props.loading" class="mr-2 h-4 w-4 animate-spin" />
    <slot />
  </button>
  <Primitive
    v-else
    :as="props.as"
    :as-child="props.asChild"
    :class="
      cn(
        buttonVariants({ variant: props.variant, size: props.size }),
        props.class
      )
    "
    :disabled="props.disabled || props.loading"
    v-bind="$attrs"
  >
    <Loader2 v-if="props.loading" class="mr-2 h-4 w-4 animate-spin" />
    <slot />
  </Primitive>
</template>
