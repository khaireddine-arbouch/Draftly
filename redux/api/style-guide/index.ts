export interface ColorSwatch {
  name: string;
  hexColor: string;
  description?: string;
}

export interface ColorSection {
  title:
    | "Primary Colours"
    | "Secondary & Accent Colors"
    | "UI Component Colors"
    | "Utility & Form Colors"
    | "Status & Feedback Colors";
  swatches: ColorSwatch[]; // Array of ColorSwatch
}

export interface TypographyStyle {
  name: string;
  fontFamily: string;
  fontSize: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
}

export interface TypographySection {
  title: string;
  styles: TypographyStyle[];
}

export interface ColorSection {
  name: string;
  colors: string[]; // hex codes or color names
}

export interface StyleGuide {
  theme: string;
  description: string;
  colorSections: [
    ColorSection,
    ColorSection,
    ColorSection,
    ColorSection,
    ColorSection
  ]; // array of ColorSection
  typographySections: TypographySection[]; // array of TypographySection
}
