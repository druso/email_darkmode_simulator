# Schema Documentation

This project does not currently use a database or external schema.

## Data Models
- **Client-side state**: Managed in-browser. Consists of the user-selected background color, text color, font family, and sample text.

## Color Conversion Helpers
- `invertHexColor(hex)`: Inverts RGB hex colors.
- `hexToHsl(hex)`: Converts hex to HSL, providing lightness used in smart inversion.

If persistent storage or backend APIs are introduced later, document their schemas here.
