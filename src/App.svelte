<script lang="ts">
  import { onMount } from 'svelte';
  import type { UkuleleReview, FilterOptions } from './lib/types';
  import { loadReviewsData, loadFilterOptions, filterReviews } from './lib/data';
  import ReviewCard from './lib/ReviewCard.svelte';
  import SearchableBrandSelect from './lib/SearchableBrandSelect.svelte';

  let reviews: UkuleleReview[] = [];
  let filteredReviews: UkuleleReview[] = [];
  let filterOptions: FilterOptions = { brands: [], sizes: [], priceRanges: [] };
  let loading = true;

  // Filter state
  let searchTerm = '';
  let selectedBrand = '';
  let selectedSize = '';
  let selectedPriceRange = '';

  // Load data on component mount
  onMount(async () => {
    try {
      const [reviewsData, options] = await Promise.all([
        loadReviewsData(),
        loadFilterOptions()
      ]);
      
      reviews = reviewsData.reviews;
      filterOptions = options;
      filteredReviews = reviews;
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  });

  // Reactive filtering
  $: {
    filteredReviews = filterReviews(reviews, filterOptions.priceRanges,  {
      search: searchTerm,
      brand: selectedBrand,
      size: selectedSize,
      priceRange: selectedPriceRange
    });
  }

  // Clear all filters
  function clearFilters() {
    searchTerm = '';
    selectedBrand = '';
    selectedSize = '';
    selectedPriceRange = '';
  }

  // Format price range for display
  function formatPriceRange(range: string): string {
    if (range === '<50') return 'Under $50';
    if (range === '500+') return '$500+';
    if (range.includes('-')) {
      const [min, max] = range.split('-');
      return `$${min} - $${max}`;
    }
    return range;
  }

  // Format size for display
  function formatSize(size: string): string {
    return size.charAt(0).toUpperCase() + size.slice(1);
  }
</script>

<main class="p-4 lg:p-6 min-h-screen bg-zinc-900 text-white">
  <div class="max-w-7xl mx-auto">
  <header class="text-center mb-8 lg:mb-12">
    <h1 class="text-3xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
      🎵 Ukulele Reviews
    </h1>
    <p class="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
      Browse and filter comprehensive ukulele reviews from 
      <a href="https://www.gotaukulele.com" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300 transition-colors underline">
        Got A Ukulele
      </a>.
      Visit the original source for more details. This site makes the reviews easier to browse and filter.
    </p>
  </header>

  {#if loading}
    <div class="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <div class="w-10 h-10 border-3 border-zinc-600 border-t-blue-400 rounded-full animate-spin"></div>
      <p class="text-zinc-300">Loading reviews...</p>
    </div>
  {:else}
    <!-- Filters Section -->
    <section class="bg-zinc-800 p-4 lg:p-6 rounded-xl mb-6 lg:mb-8">
      <div class="mb-6">
        <input 
          type="text" 
          placeholder="Search by brand or model..." 
          bind:value={searchTerm}
          class="w-full max-w-lg px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 transition-colors focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
      
      <div class="flex flex-wrap gap-4 items-end">
        <!-- Searchable Brand Filter -->
        <div class="flex flex-col gap-2">
          <span class="text-sm font-medium text-zinc-300">Brand</span>
          <SearchableBrandSelect brands={filterOptions.brands} bind:selectedBrand />
        </div>

        <!-- Size Filter -->
        <div class="flex flex-col gap-2">
          <label for="size-select" class="text-sm font-medium text-zinc-300">Size</label>
          <select id="size-select" bind:value={selectedSize} class="min-w-[140px] px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white text-sm transition-colors focus:outline-none focus:border-blue-500 cursor-pointer">
            <option value="">All Sizes</option>
            {#each filterOptions.sizes as size}
              <option value={size}>{formatSize(size)}</option>
            {/each}
          </select>
        </div>

        <!-- Price Range Filter -->
        <div class="flex flex-col gap-2">
          <label for="price-select" class="text-sm font-medium text-zinc-300">Price</label>
          <select id="price-select" bind:value={selectedPriceRange} class="min-w-[140px] px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white text-sm transition-colors focus:outline-none focus:border-blue-500 cursor-pointer">
            <option value="">All Prices</option>
            {#each filterOptions.priceRanges as range}
              <option value={range}>{formatPriceRange(range)}</option>
            {/each}
          </select>
        </div>

        <!-- Clear Filters Button -->
        <button 
          class="px-4 py-2 bg-transparent border border-zinc-600 rounded-md text-zinc-300 text-sm transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed" 
          on:click={clearFilters} 
          disabled={!searchTerm && !selectedBrand && !selectedSize && !selectedPriceRange}
        >
          Clear Filters
        </button>
      </div>
    </section>

    <!-- Results Counter -->
    <div class="mb-6 text-zinc-400 text-sm">
      <p>Showing {filteredReviews.length} of {reviews.length} reviews</p>
    </div>

    <!-- Reviews Grid -->
    <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
      {#each filteredReviews as review, index (`${review.url}-${index}`)}
        <ReviewCard {review} />
      {/each}

      {#if filteredReviews.length === 0}
        <div class="col-span-full text-center py-12 lg:py-16">
          <p class="text-zinc-400 text-lg mb-6">No reviews found matching your criteria.</p>
          <button 
            class="px-4 py-2 bg-transparent border border-zinc-600 rounded-md text-zinc-300 text-sm transition-colors hover:bg-zinc-700 hover:text-white" 
            on:click={clearFilters}
          >
            Clear all filters
          </button>
        </div>
      {/if}
    </section>
  {/if}
  </div>
</main>