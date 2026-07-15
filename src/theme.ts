import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

export const ScholarPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "#fff7ed",
      100: "#ffedd5",
      200: "#fed7aa",
      300: "#fdba74",
      400: "#fb923c",
      500: "#e76f45",
      600: "#c55232",
      700: "#9f3f2b",
      800: "#7f3528",
      900: "#672e25",
      950: "#38150f",
    },
    focusRing: {
      width: "2px",
      style: "solid",
      color: "{primary.500}",
      offset: "2px",
    },
    colorScheme: {
      light: {
        surface: {
          0: "#ffffff",
          50: "#fbfaf7",
          100: "#f5f1e9",
          200: "#e7e0d4",
          300: "#d3c8b8",
          400: "#a99c8b",
          500: "#7c7164",
          600: "#5d554d",
          700: "#403b37",
          800: "#292725",
          900: "#1b1a19",
          950: "#11100f",
        },
        formField: {
          background: "#fffefa",
          disabledBackground: "#f1eee7",
          borderColor: "#d8d0c4",
          hoverBorderColor: "{primary.400}",
          focusBorderColor: "{primary.500}",
          color: "#202a34",
          placeholderColor: "#998f83",
        },
      },
      dark: {
        surface: {
          0: "#ffffff",
          50: "#eef2f6",
          100: "#d9e0e7",
          200: "#bcc7d1",
          300: "#94a3b1",
          400: "#6f7f8e",
          500: "#536270",
          600: "#3d4954",
          700: "#2d3740",
          800: "#202830",
          900: "#171d23",
          950: "#0e1318",
        },
        formField: {
          background: "#171e25",
          disabledBackground: "#202830",
          borderColor: "#36414b",
          hoverBorderColor: "{primary.400}",
          focusBorderColor: "{primary.400}",
          color: "#edf1f4",
          placeholderColor: "#73808c",
        },
      },
    },
  },
});
