# Card Activation MVP Architecture

## Overview

This document outlines the architecture and flow for the MVP of the card activation system for Vegas Baby, optimized for mobile users at a Bitcoin conference. This is intended for future agents and contributors.

---

## 1. QR Code & Routing

- **QR code is not unique:** All users will land on `/activate` (no query params required).
- **Manual entry:** Users will manually enter their card UID (RFID) and Mezo ID during activation.

---

## 2. Activation Flow (MVP)

1. **User lands on `/activate` (mobile-first page).**
2. **Form fields:**
   - Card UID (manual entry)
   - Email
   - Preferred Mezo ID
3. **On submit:**
   - Validate email and Mezo ID format.
   - Call a stub function to simulate remote Mezo ID check (see below).
   - Check Mezo ID in local Supabase DB for uniqueness.
   - If both checks pass, activate card and show confirmation.
   - If not, show error and allow retry.

---

## 3. Remote Mezo ID Check (Stub)

- Implement a function:
  ```ts
  async function checkMezoIdRemote(mezoId: string): Promise<boolean> {
    // Stub: Replace with real API call later
    return true; // or random true/false for testing
  }
  ```
- This function will later be replaced with a real API call to the Mezo system.

---

## 4. Supabase Integration

- Check Mezo ID uniqueness in the local Supabase DB.
- Store activation data with fields:
  - `card_uid` (string)
  - `mezo_id` (string)
  - `email` (string)
  - `activated` (boolean)
  - `balance` (double)
  - `last_modified` (timestamp)
  - `created_at` (timestamp)

---

## 5. UI/UX Notes

- **Mobile-first:** Large, touch-friendly inputs and buttons.
- **Validation:** Real-time feedback for email and Mezo ID.
- **Loading/Error states:** Clear messaging for all outcomes.
- **Manual entry:** All fields are entered by hand for MVP.

---

## 6. Next Steps

- Wireframe/outline the `/activate` page UI.
- Implement the stub for remote Mezo ID check.
- Set up Supabase schema for activations.
- Build the activation form and flow.

---

## 7. Future Enhancements

- Replace stub with real Mezo API call.
- Add QR code scanning for card UID entry.
- Add confirmation email and analytics.

---

## 8. NFC Reader Local Server

A local Node.js server will handle NFC card reading and push card data to the web application:

- Uses `nfc-pcsc` to connect to NFC reader hardware
- Runs on `localhost:3001`
- Exposes WebSocket endpoint for real-time card reading
- Pushes card readings to connected clients
- Manual card entry handled separately in web application
- Server only accepts localhost connections for security

---

# Point of Sale (POS) MVP Architecture

## Overview

This section outlines the architecture and flow for the MVP of the Point of Sale (POS) system for Vegas Baby, optimized for desktop and tablet use by event staff and vendors. This is intended for future agents and contributors.

---

## 1. Routing

- **Route:** All POS users will land on `/pos` (desktop/tablet-first page).
- **Access:** Route is intended for staff/merchants, not general attendees.
- **Device Support:**
  - Primary: Desktop (≥ 1024px)
  - Secondary: Tablet (≥ 768px)
  - Not optimized for mobile (< 768px)
- **Route Structure:**
  - `/pos` - Main POS dashboard
  - `/pos/setup` - Vendor setup/configuration
  - `/pos/transactions` - Transaction history (future enhancement)

---

## 2. Vendor Setup

1. **First-time vendor setup:**

   - Vendor name (e.g., "Sarah's Massage")
   - Vendor type (dropdown with common options):
     - Massage
     - Hair Styling
     - Coffee/Refreshments
     - Medical/Nursing
     - Other (custom)
   - Default price (optional)
   - Save vendor profile

2. **Edit vendor profile:**
   - Access profile settings from POS page
   - Edit vendor name
   - Change vendor type
   - Set or update default price
   - Save changes

---

## 3. POS Flow (Daily Use)

1. **User lands on `/pos` (desktop/tablet-first page).**
2. **Card Input:**
   - Manual entry of card number
   - OR use card scanner (reusing activation scanner)
   - Quick balance check before transaction
3. **Transaction:**
   - Amount input (pre-filled with vendor's default price if set)
   - Description (auto-filled based on vendor type)
   - Process transaction
4. **Confirmation:**
   - Show amount charged
   - Show remaining balance
   - Option to start new transaction

---

## 4. Supabase Integration

- **Vendor Schema:**

  - `id` (uuid, primary key)
  - `name` (string, required)
  - `type` (string, required)
  - `default_price` (decimal, optional)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- **Transaction Schema:**

  - `id` (uuid)
  - `card_uid` (string)
  - `amount` (double)
  - `description` (string, optional)
  - `vendor_id` (uuid, foreign key)
  - `timestamp` (timestamp)

- **Card Operations:**
  - Check card exists and is activated
  - Verify sufficient balance
  - Update balance after transaction
  - Record transaction history

---

## 5. UI/UX Notes

- **Desktop/tablet-first:** Large, touch-friendly inputs and buttons.
- **Card Input:**
  - Manual entry with formatting
  - Card scanner option (reusing activation scanner)
  - Clear balance display
- **Transaction:**
  - Quick amount buttons for common prices
  - Clear success/error states
  - Simple confirmation flow
- **Vendor Setup:**
  - Simple form with common vendor types
  - Easy access to edit profile
  - Clear save/cancel actions

---

## 6. Next Steps

1. Create vendor setup flow
2. Implement card scanning/entry
3. Build transaction processing
4. Set up Supabase schemas
5. Create POS interface

---

## 7. Future Enhancements

- Support refunds/voids
- Add transaction history view
- Add audit logging
