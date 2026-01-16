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

const containerRef = useTemplateRef("containerRef");
const cpuRef = useTemplateRef("cpuRef");
const gpuRef = useTemplateRef("gpuRef");
const ramRef = useTemplateRef("ramRef");
const pcCaseRef = useTemplateRef("pcCaseRef");
const ssdRef = useTemplateRef("ssdRef");
const motherboardRef = useTemplateRef("motherboardRef");
const psuRef = useTemplateRef("psuRef");
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
    <template
      v-if="
        containerRef &&
        cpuRef &&
        gpuRef &&
        ramRef &&
        pcCaseRef &&
        ssdRef &&
        motherboardRef &&
        psuRef
      "
    >
      <!-- Beams from left side to center (flow inward) -->
      <AnimatedBeam
        :container-ref="containerRef"
        :from-ref="cpuRef"
        :to-ref="pcCaseRef"
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
        :container-ref="containerRef"
        :from-ref="gpuRef"
        :to-ref="pcCaseRef"
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
        :container-ref="containerRef"
        :from-ref="ramRef"
        :to-ref="pcCaseRef"
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
        :container-ref="containerRef"
        :from-ref="ssdRef"
        :to-ref="pcCaseRef"
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
        :container-ref="containerRef"
        :from-ref="motherboardRef"
        :to-ref="pcCaseRef"
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
        :container-ref="containerRef"
        :from-ref="psuRef"
        :to-ref="pcCaseRef"
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
