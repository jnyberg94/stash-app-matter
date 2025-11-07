<!-- <script>
  import { getContext } from 'svelte';
  
  let { 
    icon: IconComponent,
    variant = 'white', 
    size = 'md',       // 'xs', 'sm', 'md', 'lg'
    weight = 'regular',
    class: className = ''
  } = $props();
  
  const sizes = {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
    xl: 24
  };
  
  const colors = {
    white: '#ffffff',
    gray: '#808080'
  };
</script>

<IconComponent 
  size={sizes[size]} 
  color={colors[variant]} 
  {weight}
  class= 'icon {className}'
/> -->

<script>
  import { config } from '$lib/utils/configStore';
  
  let { 
    icon: IconComponent,
    variant = 'white', 
    size = 'md',
    weight = 'regular',
    class: className = ''
  } = $props();

  const sizes = {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
    xl: 24
  };

  // Theme-aware colors
  const colors = {
    dark: {
      white: '#ffffff',
      grey: '#808080',
      red: '#ED2222'
    },
    light: {
      white: '#000000',
      grey: '#666666',
      red: '#ED2222'
    }
  };

  // Derive the color based on current theme
  const iconColor = $derived(colors[$config.theme]?.[variant] || colors.dark[variant]);
</script>

<IconComponent 
  size={sizes[size]} 
  color={iconColor}
  {weight}
  class='icon {className}'
/>