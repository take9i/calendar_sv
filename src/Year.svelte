<script>
  export let year;
  export let birthYear;
</script>

<style>
  .yheader {
    font-size: small;
    margin: 0.1em;
  }
</style>

<div>
  <h5 class="yheader">{`${year}(${year - birthYear})`}</h5>
  <div>
    <slot />
  </div>
  <hr />
</div>
