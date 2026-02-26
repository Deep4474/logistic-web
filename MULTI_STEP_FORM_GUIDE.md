# Multi-Step Quote Form Implementation Guide

## Overview
The quote form has been converted to a 3-step process where users cannot see or proceed to the next step unless they complete the current step. After uploading pictures, users can submit their quote and confirmation emails are sent.

---

## Form Flow

### Step 1: Quote Information
- User fills in sender details (name, email, phone, address)
- User fills in receiver details (name, email, phone, address)
- User can add special requirements/notes
- **Button:** "Next: Upload Package" (validates all fields)
- **Back Button:** "Cancel"

### Step 2: Upload Package Pictures
- User must upload 3 pictures (Front, Side, Top/Other)
- Picture previews show after selection
- **Condition:** Cannot proceed unless all 3 pictures are uploaded
- **Buttons:** 
  - "Back" - returns to Step 1
  - "Continue" - proceeds to submission

### Step 3: Review & Submit
- Displays confirmation message
- Shows that pictures have been received
- **Button:** "Submit Quote Request"
- **Buttons:**
  - "Back" - returns to Step 2
  - "Submit Quote Request" - finalizes and sends emails

---

## Key Features

### Validation
✅ All sender fields required (name, email, phone, address)
✅ All receiver fields required (name, email, phone, address)
✅ Email format validation
✅ Phone number minimum 10 digits
✅ All 3 pictures must be uploaded before proceeding

### Email Notifications
When user clicks "Submit Quote Request":

1. **User Confirmation Email** is sent to sender with:
   - Tracking ID
   - Service name
   - Package details
   - Sender/Receiver addresses
   
2. **Admin Notification Email** is sent to `support@logiflow.com` with:
   - New order alert
   - Tracking ID
   - Service type
   - Customer email

### Form Data Storage
All form data is stored in `window.multiStepFormData` throughout the process, ensuring no data loss between steps.

---

## JavaScript Functions

### Navigation Functions
```javascript
showQuoteStep()           // Show Step 1 (Quote Form)
proceedToUploadStep()     // Go from Step 1 → Step 2
backToQuoteStep()         // Go from Step 2 → Step 1
backToUploadStep()        // Go from Step 3 → Step 2
```

### Submission Functions
```javascript
submitQuoteWithPicture()  // Final submit with all data
sendOrderConfirmationEmail()   // Send to customer
sendAdminNotificationEmail()   // Send to admin
resetQuoteForm()          // Clear all data and reset steps
```

---

## File Changes

### HTML Files Modified
- **service-package-delivery.html** - Added multi-step form structure

### JavaScript Files Modified
- **script.js** - Added multi-step form logic and email functions

### CSS Files Modified
- **styles.css** - Added styles for multi-step form layout

---

## Usage Example

1. User clicks pricing card
2. Quote modal opens with Step 1
3. User fills form and clicks "Next: Upload Package"
4. Step 2 appears with upload boxes
5. User uploads 3 pictures
6. Step 3 appears with submit button
7. User clicks "Submit Quote Request"
8. Order created, emails sent to user and admin
9. Modal closes and form resets

---

## Email Configuration

To enable email sending, ensure your backend API has:
- `/api/send-email` endpoint
- Support for `order_confirmation` and `admin_notification` email types

Example request format:
```json
{
  "to": "user@example.com",
  "subject": "Order Confirmation",
  "type": "order_confirmation",
  "data": {
    "senderName": "John Doe",
    "trackingId": "TRK-123456",
    "service": "Express Delivery",
    "from": "...",
    "to": "...",
    "special": "..."
  }
}
```

---

## Testing Checklist

- [ ] Click pricing card opens form
- [ ] Fill quote form and click "Next"
- [ ] Validate error messages appear for empty fields
- [ ] Upload 3 pictures sees previews
- [ ] Cannot click Continue without all 3 pictures
- [ ] Click Back returns to previous step
- [ ] Click Submit creates order
- [ ] Confirmation appears with Tracking ID
- [ ] Check emails in admin inbox
- [ ] Form properly resets after submit

