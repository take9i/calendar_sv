<script>
  import * as R from "ramda";
  import { onMount } from "svelte";
  import Year from "./Year.svelte";
  import Month from "./Month.svelte";
  export let birthYear;

  const BIRTH_STR = "1971/02/18";
  let page = 4;
  let date2Holiday;

  const handleKeyup = event => {
    if (event.key == "ArrowLeft") {
      page = page - 1;
    } else if (event.key == "ArrowRight") {
      page = page + 1;
    }
  };

  onMount(async () => {
    const res = await fetch("./holidays.json");
    const holidays = await res.json();
    date2Holiday = Object.fromEntries(
      holidays.map(holiday => [holiday.id, holiday.name])
    );
  });
</script>

<style>
  main {
    background-color: white;
    font-size: small;
  }
</style>

<svelte:window on:keyup={handleKeyup} />
<main>
  {#if date2Holiday}
    {#each R.range(birthYear + page * 10, birthYear + page * 10 + 10) as year}
      <Year {year} {birthYear}>
        {#each R.range(0, 12) as month}
          <Month {year} {month} {date2Holiday} />
        {/each}
      </Year>
    {/each}
  {/if}
</main>
