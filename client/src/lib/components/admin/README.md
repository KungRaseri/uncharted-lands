# Admin UI Components

This directory contains reusable components for the admin interface to maintain consistency and reduce code duplication.

## Components

### StatsCard

Displays a statistic with an icon, label, and value. Can be clickable (link) or static.

**Props:**
- `label: string` - The label text (e.g., "Total Servers")
- `value: number | string` - The statistic value
- `icon: Component` - Lucide icon component
- `href?: string` - Optional link URL (makes card clickable)
- `iconColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'` - Icon background color (default: 'primary')

**Example:**
```svelte
<StatsCard 
  label="Total Servers" 
  value={42} 
  icon={Server} 
  href="/admin/servers" 
/>
```

---

### SearchBar

A consistent search input with icon and optional result count display.

**Props:**
- `value: string` (bindable) - The search term
- `placeholder?: string` - Input placeholder text (default: "Search...")
- `resultCount?: number` - Number of filtered results (displayed when searching)
- `totalCount?: number` - Total number of items (displayed when filtering)

**Example:**
```svelte
<SearchBar 
  bind:value={searchTerm}
  placeholder="Search by name or ID..."
  resultCount={filteredItems.length}
  totalCount={data.items.length}
/>
```

---

### EmptyState

Displays an empty state with icon, message, and optional action button.

**Props:**
- `icon: Component` - Lucide icon component (48px)
- `title: string` - Main heading
- `message: string` - Description text
- `actionHref?: string` - Optional button link
- `actionText?: string` - Button text
- `actionIcon?: Component` - Optional button icon

**Example:**
```svelte
<EmptyState 
  icon={Server}
  title="No servers yet"
  message="Create your first server to get started"
  actionHref="/admin/servers/create"
  actionText="Create Server"
  actionIcon={Plus}
/>
```

---

### Breadcrumb

Modern text-based breadcrumb navigation.

**Props:**
- `items: BreadcrumbItem[]` - Array of breadcrumb items
  - `label: string` - Item label
  - `href?: string` - Optional link (last item typically has no href)

**Example:**
```svelte
<Breadcrumb items={[
  { label: 'Dashboard', href: '/admin' },
  { label: 'Servers', href: '/admin/servers' },
  { label: 'Server Details' }
]} />
```

---

### PageHeader

Page header with icon, title, description, and optional action buttons.

**Props:**
- `title: string` - Page title
- `description?: string` - Optional description text
- `icon?: Component` - Optional icon
- `actions?: Snippet` - Optional action buttons (use snippet slot)

**Example:**
```svelte
<PageHeader 
  title="Servers" 
  description="Manage game servers"
  icon={Server}
>
  {#snippet actions()}
    <a href="/create" class="btn preset-filled-primary-500">
      <Plus size={20} />
      Create
    </a>
  {/snippet}
</PageHeader>
```

---

### DetailHeader

Header for detail pages with large icon, title, subtitle, and metadata.

**Props:**
- `title: string` - Main title (e.g., server name)
- `subtitle?: string` - Optional subtitle (e.g., ID)
- `icon: Component` - Icon component
- `iconColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'` - Icon color (default: 'primary')
- `metadata?: Snippet` - Optional metadata section (use snippet slot)

**Example:**
```svelte
<DetailHeader 
  title={server.name}
  subtitle={server.id}
  icon={Server}
>
  {#snippet metadata()}
    <div class="flex items-center gap-2">
      <Globe size={16} />
      <a href="/worlds/{server.worldId}">View World</a>
    </div>
  {/snippet}
</DetailHeader>
```

---

## Usage Patterns

### List Page Pattern

```svelte
<script lang="ts">
  import PageHeader from '$lib/components/admin/PageHeader.svelte';
  import SearchBar from '$lib/components/admin/SearchBar.svelte';
  import EmptyState from '$lib/components/admin/EmptyState.svelte';
  
  let searchTerm = $state('');
  let filteredItems = $derived(/* filter logic */);
</script>

<div class="space-y-4">
  <PageHeader title="Items" description="Manage items" icon={ItemIcon}>
    {#snippet actions()}
      <a href="/create" class="btn preset-filled-primary-500">Create</a>
    {/snippet}
  </PageHeader>

  <SearchBar bind:value={searchTerm} resultCount={filteredItems.length} totalCount={data.items.length} />

  <div class="card preset-filled-surface-100-900">
    {#if filteredItems.length === 0}
      <EmptyState 
        icon={ItemIcon}
        title="No items found"
        message="Try a different search"
      />
    {:else}
      <!-- Table or grid -->
    {/if}
  </div>
</div>
```

### Detail Page Pattern

```svelte
<script lang="ts">
  import Breadcrumb from '$lib/components/admin/Breadcrumb.svelte';
  import DetailHeader from '$lib/components/admin/DetailHeader.svelte';
  import StatsCard from '$lib/components/admin/StatsCard.svelte';
</script>

<div class="space-y-6">
  <Breadcrumb items={[
    { label: 'Dashboard', href: '/admin' },
    { label: 'Items', href: '/admin/items' },
    { label: data.item.name }
  ]} />

  <DetailHeader 
    title={data.item.name}
    subtitle={data.item.id}
    icon={ItemIcon}
  >
    {#snippet metadata()}
      <div>Related info...</div>
    {/snippet}
  </DetailHeader>

  <div class="grid grid-cols-3 gap-4">
    <StatsCard label="Metric 1" value={42} icon={Icon1} />
    <StatsCard label="Metric 2" value={100} icon={Icon2} />
  </div>
</div>
```

### Dashboard Pattern

```svelte
<script lang="ts">
  import StatsCard from '$lib/components/admin/StatsCard.svelte';
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <StatsCard 
    label="Total Items" 
    value={stats.items} 
    icon={Icon} 
    href="/admin/items" 
  />
  <!-- More cards... -->
</div>
```

---

## Design Tokens

### Icon Colors
- `primary` - Blue (default for main entities)
- `secondary` - Purple (for secondary entities)
- `success` - Green (for positive metrics)
- `warning` - Yellow/Orange (for caution states)
- `error` - Red (for critical states)

### Common Icons
- `Server` - Servers
- `Globe` - Worlds
- `Users` - Players
- `MapPin` - Regions
- `Layers` - Tiles
- `Grid3x3` - Plots
- `Plus` - Create actions
- `Search` - Search inputs
- `ExternalLink` - View/navigate actions
- `ArrowLeft` - Back buttons

---

## Benefits

1. **Consistency** - All pages use the same component patterns
2. **Maintainability** - Update styling in one place
3. **Reusability** - Less code duplication
4. **Type Safety** - Full TypeScript support
5. **Flexibility** - Components accept snippets for custom content
6. **Accessibility** - Semantic HTML and ARIA attributes built-in
