This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Functionality Overview

### NFC-Electron Driver

- Desktop Electron app to connect to an NFC card reader (e.g., ACS ACR122U)
- Reads NFC cards and sends scan data to the backend via secure webhooks
- Supports vendor selection and API key management
- Designed for daily setup and minimal user interaction after initial configuration

### Webhooks for Desktop App Integration & Card Scanning

- Secure webhooks receive card scan events from the Electron app
- Handles authentication and validation of card scan data
- Integrates with backend for real-time processing and logging

### Card Activation Page

- **URL:** `/activate` (mobile optimized)
- Mobile-first web interface for activating new cards
- Guides users through the card activation process
- Responsive design for optimal experience on mobile devices

### Card Scanning via Image

- Allows users to scan cards using device camera or upload an image
- Extracts card data for activation or verification
- Useful for remote or manual card management scenarios

### Vendor Point of Sale (POS)

- **URL:** `/pos`
- Desktop/tablet interface for vendors to process card transactions
- Real-time card scan integration with POS workflows
- Supports vendor-specific operations and reporting

### Vendor Setup

- **URL:** `/pos/setup`
- Admin and vendor onboarding flows
- Vendor selection and configuration in the Electron app
- API key generation and secure storage for each vendor

## Deployment

This project is deployed at [https://mezo-vegas-baby.com/](https://mezo-vegas-baby.com/)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
