# Payment Webhook Architecture

## Overview

This document outlines the architecture for connecting local NFC card readers to the web-based POS system through a secure webhook system. The solution uses an Electron app as a bridge between local hardware and the cloud-based Next.js application, with Supabase Realtime for real-time updates to the POS UI.

## System Components

### 1. Electron App (NFC Driver)

- **Purpose:** Local bridge between NFC hardware and web application
- **Key Features:**
  - Vendor selection interface
  - NFC reader initialization
  - Webhook communication
  - Local server for card reading

### 2. Next.js Webhook Endpoint

- **Purpose:** Secure endpoint for receiving card scan data
- **Location:** `/api/webhooks/card-scan`
- **Security:** Token-based authentication
- **Data Processing:** Validates and processes incoming scan data
- **Supabase Integration:** Stores scans in realtime-enabled table

### 3. Supabase Realtime

- **Purpose:** Real-time communication between webhook and POS UI
- **Components:**
  - `card_scans` table with realtime enabled
  - Row Level Security (RLS) for vendor isolation
  - Realtime subscriptions in POS UI

## Flow Architecture

### 1. Electron App Flow

1. **Initialization:**

   - User launches Electron app
   - App fetches current vendor list from web application
   - Displays vendor selection dropdown

2. **Vendor Selection:**

   - User selects their vendor from dropdown
   - If vendor not found, redirects to web POS setup
   - Stores selected vendor ID locally

3. **Reader Initialization:**

   - User clicks "Start" button
   - Initializes NFC reader connection
   - Starts local server for card reading
   - Displays ready status

4. **Card Reading:**
   - Listens for NFC card scans
   - Captures card UID
   - Formats data with vendor ID
   - Sends to webhook endpoint

### 2. Webhook Communication

#### Request Format:

```json
{
  "vendor_id": "uuid",
  "card_uid": "string",
  "timestamp": "ISO-8601",
  "auth_token": "string"
}
```

#### Security Measures:

- JWT-based authentication
- Rate limiting
- IP validation (optional)
- Request signing

### 3. Supabase Integration

#### Card Scans Table:

```sql
create table card_scans (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid references vendors(id),
  card_uid text not null,
  reader_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  processed boolean default false
);

-- Enable realtime
alter publication supabase_realtime add table card_scans;

-- RLS Policies
create policy "Vendors can only see their own scans"
  on card_scans for select
  using (auth.uid() = vendor_id);
```

### 4. POS UI Integration

- **Realtime Subscription:**

  ```typescript
  const subscription = supabase
    .from("card_scans")
    .on("INSERT", (payload) => {
      // Handle new scan
      if (payload.new.vendor_id === currentVendorId) {
        // Update UI
      }
    })
    .subscribe();
  ```

## Testing Flow

### 1. Webhook Testing

1. **Setup:**

   - Deploy webhook endpoint
   - Configure Supabase table and policies
   - Set up test vendor in database

2. **Manual Testing:**

   - Use Postman to send test requests
   - Verify webhook response
   - Check Supabase table for new records

3. **Realtime Testing:**

   - Open POS UI in browser
   - Send test scan via Postman
   - Verify UI updates in real-time

### 2. NFC Reader Testing

1. **Local Setup:**

   - Configure Electron app with test vendor
   - Connect NFC reader
   - Start reader service

2. **Integration Testing:**

   - Scan test cards
   - Verify webhook receives data
   - Confirm POS UI updates

## Security Considerations

1. **Authentication:**

   - JWT tokens for vendor authentication
   - Token rotation mechanism
   - Secure token storage in Electron app

2. **Data Protection:**

   - HTTPS for all communications
   - Encrypted local storage
   - Secure vendor ID storage

3. **Access Control:**
   - Vendor-specific tokens
   - Rate limiting per vendor
   - IP-based restrictions (optional)

## Error Handling

1. **Local Errors:**

   - NFC reader connection issues
   - Network connectivity problems
   - Invalid vendor selection

2. **Webhook Errors:**
   - Authentication failures
   - Rate limiting
   - Invalid data format
   - Server errors

## Future Enhancements

1. **Offline Support:**

   - Local queue for failed webhook calls
   - Automatic retry mechanism
   - Sync when connection restored

2. **Monitoring:**

   - Connection status dashboard
   - Scan success rate tracking
   - Error logging and reporting

3. **Vendor Features:**
   - Multiple reader support
   - Custom reader configurations
   - Reader status monitoring

## Implementation Notes

1. **Electron App:**

   - Use `nfc-pcsc` for card reading
   - Implement secure token storage
   - Handle connection state management

2. **Webhook Endpoint:**

   - Implement rate limiting
   - Add request validation
   - Set up proper error responses

3. **Vendor Management:**
   - Token generation system
   - Vendor status tracking
   - Reader registration process

## Next Steps

1. Set up webhook endpoint in Next.js
2. Create Supabase table and policies
3. Implement POS UI realtime subscription
4. Test with Postman
5. Build Electron app
6. Test full integration
