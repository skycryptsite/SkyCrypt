<script lang="ts">
  import { getProfileCtx } from "$ctx/profile.svelte";
  import Skillbar from "$lib/components/Skillbar.svelte";

  const ctx = getProfileCtx();
  const profile = $derived(ctx.profile);
</script>

<div class="skills space-y-2 pr-2 @md:pr-0">
  {#if profile.skyblock_level.level > 0}
    <Skillbar class="@md:w-full" skill="Level" skillData={profile.skyblock_level} />
  {/if}

  <div class="flex flex-col flex-wrap gap-x-4 gap-y-2 @md:flex-row">
    {#each Object.entries(profile.skills.skills) as [skillName, skillData], index (index)}
      <Skillbar skill={skillName} {skillData} apiEnabled={profile.apiSettings.skills} />
    {/each}
  </div>
</div>
