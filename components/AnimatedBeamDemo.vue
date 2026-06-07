<script setup lang="ts">
const containerRef = useTemplateRef<HTMLDivElement>("containerRef");
const div1Ref = useTemplateRef<HTMLDivElement>("div1Ref");
const div2Ref = useTemplateRef<HTMLDivElement>("div2Ref");
const div3Ref = useTemplateRef<HTMLDivElement>("div3Ref");
const div4Ref = useTemplateRef<HTMLDivElement>("div4Ref");
const div5Ref = useTemplateRef<HTMLDivElement>("div5Ref");
const div6Ref = useTemplateRef<HTMLDivElement>("div6Ref");
const div7Ref = useTemplateRef<HTMLDivElement>("div7Ref");

type BeamRefs = {
  container: HTMLDivElement;
  div1: HTMLDivElement;
  div2: HTMLDivElement;
  div3: HTMLDivElement;
  div4: HTMLDivElement;
  div5: HTMLDivElement;
  div6: HTMLDivElement;
  div7: HTMLDivElement;
};

const beamRefs = computed<BeamRefs | null>(() => {
  if (
    !containerRef.value ||
    !div1Ref.value ||
    !div2Ref.value ||
    !div3Ref.value ||
    !div4Ref.value ||
    !div5Ref.value ||
    !div6Ref.value ||
    !div7Ref.value
  ) {
    return null;
  }

  return {
    container: containerRef.value,
    div1: div1Ref.value,
    div2: div2Ref.value,
    div3: div3Ref.value,
    div4: div4Ref.value,
    div5: div5Ref.value,
    div6: div6Ref.value,
    div7: div7Ref.value,
  };
});
</script>

<template>
  <div
    ref="containerRef"
    class="bg-background relative flex h-[500px] w-full items-center justify-center overflow-hidden rounded-lg border p-10 md:shadow-xl"
  >
    <div
      class="flex size-full max-h-[200px] max-w-lg flex-col items-stretch justify-between gap-10"
    >
      <div class="flex flex-row justify-between items-center">
        <div
          ref="div1Ref"
          class="z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-2 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:text-black"
        >
          <Icon
            name="devicon:googlecloud"
            size="24"
          />
        </div>
        <div
          ref="div5Ref"
          class="z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-2 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]"
        >
          <Icon
            name="logos:google-drive"
            size="24"
          />
        </div>
      </div>
      <div class="flex flex-row justify-between items-center">
        <div
          ref="div2Ref"
          class="z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-2 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:text-black"
        >
          <Icon
            name="logos:notion-icon"
            size="24"
          />
        </div>
        <div
          ref="div4Ref"
          class="z-10 flex size-16 items-center justify-center rounded-full border-2 bg-white p-2 text-black shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]"
        >
          <Icon
            name="simple-icons:openai"
            size="30"
          />
        </div>
        <div
          ref="div6Ref"
          class="z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-2 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]"
        >
          <Icon
            name="logos:google-gmail"
            size="24"
          />
        </div>
      </div>
      <div class="flex flex-row justify-between items-center">
        <div
          ref="div3Ref"
          class="z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-2 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)] dark:text-black"
        >
          <Icon
            name="logos:whatsapp-icon"
            size="24"
          />
        </div>
        <div
          ref="div7Ref"
          class="z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-2 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]"
        >
          <Icon
            name="logos:messenger"
            size="24"
          />
        </div>
      </div>
    </div>

    <template v-if="beamRefs">
      <AnimatedBeam
        :container-ref="beamRefs.container"
        :from-ref="beamRefs.div1"
        :to-ref="beamRefs.div4"
        :curvature="-75"
        :end-y-offset="-10"
      />
      <AnimatedBeam
        :container-ref="beamRefs.container"
        :from-ref="beamRefs.div2"
        :to-ref="beamRefs.div4"
      />
      <AnimatedBeam
        :container-ref="beamRefs.container"
        :from-ref="beamRefs.div3"
        :to-ref="beamRefs.div4"
        :curvature="75"
        :end-y-offset="10"
      />
      <AnimatedBeam
        :container-ref="beamRefs.container"
        :from-ref="beamRefs.div5"
        :to-ref="beamRefs.div4"
        :curvature="-75"
        :end-y-offset="-10"
      />
      <AnimatedBeam
        :container-ref="beamRefs.container"
        :from-ref="beamRefs.div6"
        :to-ref="beamRefs.div4"
      />
      <AnimatedBeam
        :container-ref="beamRefs.container"
        :from-ref="beamRefs.div7"
        :to-ref="beamRefs.div4"
        :curvature="75"
        :end-y-offset="10"
      />
    </template>
  </div>
</template>

