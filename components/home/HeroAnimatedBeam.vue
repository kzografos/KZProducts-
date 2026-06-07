<script setup lang="ts">
import {
  Cpu,
  MonitorSpeaker,
  MemoryStick,
  HardDrive,
  CircuitBoard,
  Zap,
  Server,
} from "lucide-vue-next";

const containerRef = useTemplateRef<HTMLDivElement>("containerRef");
const cpuRef = useTemplateRef<HTMLDivElement>("cpuRef");
const gpuRef = useTemplateRef<HTMLDivElement>("gpuRef");
const ramRef = useTemplateRef<HTMLDivElement>("ramRef");
const pcCaseRef = useTemplateRef<HTMLDivElement>("pcCaseRef");
const ssdRef = useTemplateRef<HTMLDivElement>("ssdRef");
const motherboardRef = useTemplateRef<HTMLDivElement>("motherboardRef");
const psuRef = useTemplateRef<HTMLDivElement>("psuRef");

type BeamRefs = {
  container: HTMLDivElement;
  cpu: HTMLDivElement;
  gpu: HTMLDivElement;
  ram: HTMLDivElement;
  pcCase: HTMLDivElement;
  ssd: HTMLDivElement;
  motherboard: HTMLDivElement;
  psu: HTMLDivElement;
};

const beamRefs = computed<BeamRefs | null>(() => {
  if (
    !containerRef.value ||
    !cpuRef.value ||
    !gpuRef.value ||
    !ramRef.value ||
    !pcCaseRef.value ||
    !ssdRef.value ||
    !motherboardRef.value ||
    !psuRef.value
  ) {
    return null;
  }

  return {
    container: containerRef.value,
    cpu: cpuRef.value,
    gpu: gpuRef.value,
    ram: ramRef.value,
    pcCase: pcCaseRef.value,
    ssd: ssdRef.value,
    motherboard: motherboardRef.value,
    psu: psuRef.value,
  };
});
</script>

<template>
  <div ref="containerRef" class="relative w-full h-[400px]">
    <!-- Left Column - positioned absolutely with specific top values -->
    <div
      class="absolute left-4 lg:left-8 flex flex-col items-start"
      style="top: 0"
    >
      <!-- CPU - Top -->
      <div
        ref="cpuRef"
        class="z-10 flex size-14 items-center justify-center rounded-full border border-violet-500/30 bg-slate-800/80 p-3 shadow-lg shadow-violet-500/10 backdrop-blur-sm"
      >
        <Cpu class="size-7 text-violet-400" />
      </div>
    </div>

    <div
      class="absolute left-4 lg:left-8 flex flex-col items-start"
      style="top: 120px"
    >
      <!-- GPU -->
      <div
        ref="gpuRef"
        class="z-10 flex size-14 items-center justify-center rounded-full border border-violet-500/30 bg-slate-800/80 p-3 shadow-lg shadow-violet-500/10 backdrop-blur-sm"
      >
        <MonitorSpeaker class="size-7 text-violet-400" />
      </div>
    </div>

    <div
      class="absolute left-4 lg:left-8 flex flex-col items-start"
      style="top: 240px"
    >
      <!-- RAM -->
      <div
        ref="ramRef"
        class="z-10 flex size-14 items-center justify-center rounded-full border border-violet-500/30 bg-slate-800/80 p-3 shadow-lg shadow-violet-500/10 backdrop-blur-sm"
      >
        <MemoryStick class="size-7 text-violet-400" />
      </div>
    </div>

    <!-- Center: PC Case - positioned in the middle -->
    <div class="absolute left-1/2 -translate-x-1/2" style="top: 140px">
      <div
        ref="pcCaseRef"
        class="z-10 flex size-24 items-center justify-center rounded-full border-2 border-violet-500/50 bg-slate-800 p-5 shadow-xl shadow-violet-500/20 backdrop-blur-sm"
      >
        <Server class="size-12 text-violet-300" />
      </div>
    </div>

    <!-- Right Column - positioned absolutely with specific top values -->
    <div
      class="absolute right-4 lg:right-8 flex flex-col items-end"
      style="top: 0"
    >
      <!-- SSD - Top -->
      <div
        ref="ssdRef"
        class="z-10 flex size-14 items-center justify-center rounded-full border border-violet-500/30 bg-slate-800/80 p-3 shadow-lg shadow-violet-500/10 backdrop-blur-sm"
      >
        <HardDrive class="size-7 text-violet-400" />
      </div>
    </div>

    <div
      class="absolute right-4 lg:right-8 flex flex-col items-end"
      style="top: 120px"
    >
      <!-- Motherboard -->
      <div
        ref="motherboardRef"
        class="z-10 flex size-14 items-center justify-center rounded-full border border-violet-500/30 bg-slate-800/80 p-3 shadow-lg shadow-violet-500/10 backdrop-blur-sm"
      >
        <CircuitBoard class="size-7 text-violet-400" />
      </div>
    </div>

    <div
      class="absolute right-4 lg:right-8 flex flex-col items-end"
      style="top: 240px"
    >
      <!-- PSU -->
      <div
        ref="psuRef"
        class="z-10 flex size-14 items-center justify-center rounded-full border border-violet-500/30 bg-slate-800/80 p-3 shadow-lg shadow-violet-500/10 backdrop-blur-sm"
      >
        <Zap class="size-7 text-violet-400" />
      </div>
    </div>

    <!-- Animated Beams - only render when all refs are available -->
    <template v-if="beamRefs">
      <!-- Beams from left side to center (flow inward) -->
      <AnimatedBeam
        :container-ref="beamRefs.container"
        :from-ref="beamRefs.cpu"
        :to-ref="beamRefs.pcCase"
        :curvature="-80"
        :reverse="false"
        :delay="0"
        :end-x-offset="-48"
        :end-y-offset="-30"
        gradient-start-color="#8b5cf6"
        gradient-stop-color="#a855f7"
        path-color="rgba(139, 92, 246, 0.35)"
        :path-width="3"
      />
      <AnimatedBeam
        :container-ref="beamRefs.container"
        :from-ref="beamRefs.gpu"
        :to-ref="beamRefs.pcCase"
        :curvature="-40"
        :reverse="false"
        :delay="1"
        :end-x-offset="-48"
        :end-y-offset="0"
        gradient-start-color="#8b5cf6"
        gradient-stop-color="#a855f7"
        path-color="rgba(139, 92, 246, 0.35)"
        :path-width="3"
      />
      <AnimatedBeam
        :container-ref="beamRefs.container"
        :from-ref="beamRefs.ram"
        :to-ref="beamRefs.pcCase"
        :curvature="40"
        :reverse="false"
        :delay="2"
        :end-x-offset="-48"
        :end-y-offset="30"
        gradient-start-color="#8b5cf6"
        gradient-stop-color="#a855f7"
        path-color="rgba(139, 92, 246, 0.35)"
        :path-width="3"
      />

      <!-- Beams from right side to center (flow inward) -->
      <AnimatedBeam
        :container-ref="beamRefs.container"
        :from-ref="beamRefs.ssd"
        :to-ref="beamRefs.pcCase"
        :curvature="-80"
        :reverse="false"
        :delay="3"
        :end-x-offset="48"
        :end-y-offset="-30"
        gradient-start-color="#a855f7"
        gradient-stop-color="#8b5cf6"
        path-color="rgba(139, 92, 246, 0.35)"
        :path-width="3"
      />
      <AnimatedBeam
        :container-ref="beamRefs.container"
        :from-ref="beamRefs.motherboard"
        :to-ref="beamRefs.pcCase"
        :curvature="-40"
        :reverse="false"
        :delay="4"
        :end-x-offset="48"
        :end-y-offset="0"
        gradient-start-color="#a855f7"
        gradient-stop-color="#8b5cf6"
        path-color="rgba(139, 92, 246, 0.35)"
        :path-width="3"
      />
      <AnimatedBeam
        :container-ref="beamRefs.container"
        :from-ref="beamRefs.psu"
        :to-ref="beamRefs.pcCase"
        :curvature="40"
        :reverse="false"
        :delay="5"
        :end-x-offset="48"
        :end-y-offset="30"
        gradient-start-color="#a855f7"
        gradient-stop-color="#8b5cf6"
        path-color="rgba(139, 92, 246, 0.35)"
        :path-width="3"
      />
    </template>
  </div>
</template>
