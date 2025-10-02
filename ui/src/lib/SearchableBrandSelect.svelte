<!-- SearchableBrandSelect.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  export let brands: string[] = [];
  export let selectedBrand: string = '';
  
  let isOpen = false;
  let searchTerm = '';
  let filteredBrands: string[] = [];
  let componentElement: HTMLDivElement;
  
  // Filter brands based on search term
  $: {
    if (searchTerm.trim()) {
      filteredBrands = brands.filter(brand => 
        brand.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10); // Limit to 10 results for performance
    } else {
      filteredBrands = brands.slice(0, 10); // Show first 10 by default
    }
  }
  
  function selectBrand(brand: string) {
    selectedBrand = brand;
    searchTerm = brand;
    isOpen = false;
  }
  
  function clearSelection() {
    selectedBrand = '';
    searchTerm = '';
    isOpen = false;
  }
  
  function handleInputFocus() {
    isOpen = true;
    if (selectedBrand) {
      searchTerm = '';
    }
  }
  
  function handleInputClick(event: MouseEvent) {
    event.stopPropagation();
    isOpen = true;
  }
  
  onMount(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (componentElement && !componentElement.contains(event.target as Node)) {
        if (!selectedBrand && searchTerm) {
          searchTerm = '';
        }
        isOpen = false;
      }
    }
    
    document.addEventListener('click', handleDocumentClick);
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  });
</script>

<div class="relative" bind:this={componentElement}>
  <div class="relative">
    <input
      type="text"
      placeholder="Search brands..."
      bind:value={searchTerm}
      on:focus={handleInputFocus}
      on:click={handleInputClick}
      on:input={() => isOpen = true}
      class="w-full min-w-[160px] px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-md text-white text-sm transition-colors focus:outline-none focus:border-blue-500 placeholder-zinc-400"
    />
    
    {#if selectedBrand || searchTerm}
      <button
        on:click={clearSelection}
        class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
      >
        ✕
      </button>
    {/if}
  </div>
  
  {#if isOpen && filteredBrands.length > 0}
    <div class="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
      {#if !selectedBrand}
        <button
          on:click={() => selectBrand('')}
          class="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          All Brands
        </button>
      {/if}
      
      {#each filteredBrands as brand}
        <button
          on:click={() => selectBrand(brand)}
          class="w-full px-3 py-2 text-left text-sm text-white hover:bg-zinc-700 transition-colors border-t border-zinc-700 first:border-t-0"
        >
          {brand}
        </button>
      {/each}
      
      {#if searchTerm && filteredBrands.length === 0}
        <div class="px-3 py-2 text-sm text-zinc-400">
          No brands found
        </div>
      {/if}
    </div>
  {/if}
</div>
<style>
  /* Ensure dropdown appears above other elements */
  .relative {
    position: relative;
  }
</style>