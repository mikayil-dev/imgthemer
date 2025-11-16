export interface Props {
  id?: string;
  productTitle: string;
  price: string;
  neutralList?: string[];
  featureList: string[];
  nonFeatureList?: string[];
  featureTitle?: string;
  featureSubtitle?: string;
  ctaText: string;
  ctaStyle?: 'primary' | 'secondary';
  link: string;
  eyebrowText?: string;
  timeframe?: string;
}
