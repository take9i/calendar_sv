<script>
  import { onMount } from "svelte";
  import { Calendar } from "./calendar";
  export let year;
  export let month;
  export let date2Holiday;

  const cal = new Calendar();

  const isHoliday = day => {
    const k = `${year}/${month + 1}/${day}`;
    return k in date2Holiday;
  };
</script>

<style>
  .month {
    display: inline-block;
    position: relative;
    vertical-align: top;
    text-align: left;
  }
  .mtable {
    margin: 0.2em;
    padding: 0.2em;
    font-family: "Courier New", Consolas, monospace;
    font-size: x-small;
  }
  .mbg {
    display: block;
    position: absolute;
    color: lightgray;
    opacity: 0.5;
    top: 0px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 8ex;
  }
  .unday {
    color: lightgray;
  }
  .saturday {
    color: #008bdb;
  }
  .sunday {
    color: #e60012;
  }
</style>

<div class="month">
  <table class="mtable">
    {#each cal.monthDays(year, month) as week}
      <tr>
        {#each week as day, i}
          {#if day != 0}
            {#if i == 5}
              <td align="right" class="saturday">{day}</td>
            {:else if i == 6 || isHoliday(day)}
              <td align="right" class="sunday">{day}</td>
            {:else if day != 0}
              <td align="right">{day}</td>
            {/if}
          {:else}
            <td />
          {/if}
        {/each}
      </tr>
    {/each}
  </table>
  <h1 class="mbg">{month + 1}</h1>
</div>
