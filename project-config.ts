import type { Props as PricingProps } from './src/components/PricingCard.types.ts';

interface ProjectConfig {
  adapter: 'static' | 'node';
  adSense: {
    enabled: boolean;
    publisherId: string;
    adsTxt: string;
  };
  analytics: {
    hostUrl: string;
    id: string;
  };
  head: {
    titleSeperator: string;
    titleSuffix: string;
    description: string;
  };
  modules: {
    blog: {
      enabled: boolean;
    };
    pricing: {
      enabled: boolean;
      pages?: {
        Monthly: PricingProps[];
        Yearly: PricingProps[];
      };
    };
  };
}

export default {
  adapter: 'node',
  adSense: {
    enabled: false,
    publisherId: (import.meta.env.ADSENSE_PUBLISHER_ID as string) ?? '',
    adsTxt: (import.meta.env.ADSENSE_ADS_TXT as string) ?? '',
  },
  // Umami Analytics Configuration
  analytics: {
    hostUrl: 'https://hello.mikayil.dev',
    id: 'd7ee7302-08fb-4898-aefd-9fc6a97d960d',
  },
  head: {
    // Default Values for Head Metadata
    titleSeperator: ' | ',
    titleSuffix: 'ImgThemer',
    description:
      'Apply fitting colorthemes to your images easily with ImgThemer! Over 540+ color themes available - Gruvbox, Catppuccin, Tokyo-Night, and more.',
  },
  modules: {
    blog: {
      enabled: false,
    },
    pricing: {
      enabled: false,
    },
  },
} as ProjectConfig;
