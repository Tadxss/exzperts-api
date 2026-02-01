# Exzperts API

Advanced filtering system for Tadabase Bid Requests with multi-layer filtering: blacklist, expert type matching, and plaintiff age validation.

## ðŸŽ¯ Purpose

This API filters bid requests based on three criteria:
1. **Blacklist Filter** - Hides bid requests from lawyers who have blacklisted the user
2. **Expert Type Matching** - Shows only bid requests with injury categories matching the user's expertise
3. **Plaintiff Age Filter** - Ensures all plaintiffs' ages fall within the user's specified age range (min/max)

## ðŸ“‹ Prerequisites

- Node.js (v14+)
- Tadabase account with API access enabled
- AWS account (for deployment)

## ðŸš€ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Tadabase credentials:

```env
TADABASE_API_KEY=your_api_key
TADABASE_APP_ID=your_app_id
TADABASE_APP_SECRET=your_app_secret
BID_REQUEST_TABLE_ID=your_bid_request_table_id
USERS_TABLE_ID=your_users_table_id
INJURY_CATEGORIES_TABLE_ID=your_injury_categories_table_id
BID_REQUEST_DETAILS_TABLE_ID=ka6jMnor75
CLAIMS_TABLE_ID=ObEjEONK5p
PLAINTIFFS_TABLE_ID=4YZjnDNPvl
OPEN_STATUS_ID=eykNOvrDY3
PORT=3000
```

### 3. Get Your Tadabase IDs

**App ID & API Key:**
- Go to Tadabase Settings â†’ API
- Enable API access
- Copy your App ID, API Key, and App Secret

**Table IDs:**
- Go to your table settings
- Look in the URL: `...tables/[TABLE_ID]/...`

**Field IDs:**
- Go to table builder
- Click on the field
- Look in the URL or use browser dev tools to inspect the field ID

## ðŸ§ª Testing Locally

### Using Local Server

```bash
npm start
```

Server runs on `http://localhost:3000`

### Using Postman

**Endpoint:** `http://localhost:3000`

**Method:** POST

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "loggedInUserId": "o6WQbOBjnB"
}
```

**Expected Response:**
```json
{
  "status": "success",
  "openBidRequests": 10,
  "filteredBidRequests": 3,
  "removedByBlacklist": 2,
  "removedByExpertType": 3,
  "removedByAge": 2,
  "totalRemoved": 7,
  "data": [...],
  "timestamp": "2026-02-01T..."
}
```

## ðŸ“¦ Deployment to AWS Lambda

### 1. Prepare Deployment Package

```bash
# Install production dependencies
npm install --production

# Create deployment zip
zip -r exzperts-api.zip . -x "*.git*" ".env*" "*.md" "server.js"
```

### 2. Create Lambda Function

1. Go to AWS Lambda Console
2. Click **Create Function**
3. Choose **Author from scratch**
4. Function name: `exzperts-bid-filter`
5. Runtime: **Node.js 18.x** (or latest)
6. Click **Create function**

### 3. Upload Code

1. In the Lambda function page, go to **Code** tab
2. Click **Upload from** â†’ **.zip file**
3. Upload `exzperts-api.zip`
4. Click **Save**

### 4. Configure Environment Variables

1. Go to **Configuration** â†’ **Environment variables**
2. Add all variables from your `.env` file:
   - `TADABASE_API_KEY`
   - `TADABASE_APP_ID`
   - `TADABASE_APP_SECRET`
   - `BID_REQUEST_TABLE_ID`
   - `USERS_TABLE_ID`
   - `INJURY_CATEGORIES_TABLE_ID`
   - `BID_REQUEST_DETAILS_TABLE_ID`
   - `CLAIMS_TABLE_ID`
   - `PLAINTIFFS_TABLE_ID`
   - `OPEN_STATUS_ID`
3. Click **Save**

### 5. Configure Timeout

1. Go to **Configuration** â†’ **General configuration**
2. Click **Edit**
3. Set **Timeout** to **30 seconds** (or more for large datasets)
4. Click **Save**

### 6. Create Function URL

1. Go to **Configuration** â†’ **Function URL**
2. Click **Create function URL**
3. Auth type: **NONE** (or configure as needed)
4. **Enable CORS** âœ…
5. Click **Save**
6. Copy the Function URL

## ðŸ”§ Integration with Tadabase

### Create a Pipe

1. In Tadabase, go to **Pipes**
2. Click **Add Pipe**
3. **Name:** Filter Bid Requests
4. **Trigger:** API Call
5. **Action:** API Request
6. **URL:** Your AWS Lambda Function URL
7. **Method:** POST
8. **Headers:**
   ```
   Content-Type: application/json
   ```
9. **Body:**
   ```json
   {
     "loggedInUserId": "{{loggedInUserId}}"
   }
   ```
10. Add parameter: `loggedInUserId`
11. **Save** and copy the **Pipe ID**

### Add JavaScript to Your Page

1. Go to your Bid Requests page
2. Add a **Rich Text** component with:
   ```html
   <div id="logged-in-user-id" style="display:none;">{loggedInUser.Record ID}</div>
   ```
3. Go to **Settings** â†’ **JavaScript**
4. Paste the filtering code (see `POSTMAN_TESTING.md` for full code)
5. Update `PIPE_ID` and `TABLE_COMPONENT_ID`
6. **Save**

## ðŸ” How It Works

### Filter Flow:

1. **Fetch User Data**
   - Gets user's expert types (field_560)
   - Gets user's min/max age (field_566, field_567)

2. **Fetch Open Bid Requests**
   - Filters by status = "Open" (field_314)

3. **Parallel Data Fetching** (Performance Optimized)
   - Fetches all injury categories at once
   - Fetches all lawyers at once
   - Fetches all bid request details, claims, and plaintiffs at once

4. **Apply Filters** (in order):
   
   **Filter 1: Blacklist**
   - Gets bid request's lawyer (field_319)
   - Checks if user is in lawyer's blacklist (field_570)
   - âŒ Hides if blacklisted
   
   **Filter 2: Expert Type**
   - Gets bid request's injury categories (field_537)
   - Checks if ANY injury category's expert types (field_534) match user's expert types
   - âŒ Hides if NO matching expert types
   
   **Filter 3: Plaintiff Age** (only if user has min/max age set)
   - Finds bid request detail (field_496)
   - Gets claim from bid request detail (field_500)
   - Gets all plaintiffs from claim (field_204)
   - Checks if ALL plaintiffs' ages (field_195) are within user's range
   - âŒ Hides if ANY plaintiff age is outside range

5. **Return Filtered Results**
   - Only bid requests that pass ALL filters are shown

### Age Filter Logic:

- **No min/max age set:** Skip age filter entirely
- **Only min age set:** Filter by `age >= minAge`
- **Only max age set:** Filter by `age <= maxAge`
- **Both set:** Filter by `minAge <= age <= maxAge`
- **Multiple plaintiffs:** ALL must be within range (if ANY is outside, hide the bid request)

## ðŸ“Š Response Breakdown

```json
{
  "status": "success",
  "openBidRequests": 10,           // Total open bid requests
  "filteredBidRequests": 3,        // Visible to user
  "removedByBlacklist": 2,         // Hidden due to blacklist
  "removedByExpertType": 3,        // Hidden due to expert type mismatch
  "removedByAge": 2,               // Hidden due to age mismatch
  "totalRemoved": 7,               // Total filtered out
  "data": [...],                   // Array of visible bid requests
  "timestamp": "2026-02-01T..."
}
```

## ðŸ› Troubleshooting

**"Failed to fetch from Tadabase"**
- Check your API key, App ID, and App Secret
- Ensure API access is enabled in Tadabase
- Verify table IDs are correct

**"502 Internal Server Error"**
- Lambda function timed out
- Increase timeout in Lambda Configuration â†’ General configuration
- Check CloudWatch logs for errors

**Empty results**
- Verify all field IDs match your Tadabase setup
- Check that connection fields are properly configured
- Look at Lambda CloudWatch logs for detailed error messages

**CORS errors in browser**
- Ensure CORS is enabled on Lambda Function URL
- Check that `getCorsHeaders()` is in all Lambda responses

**Age filter not working**
- Verify user has min/max age set in their profile
- Check that plaintiffs have age values
- Look at logs to see which ages are being compared

## ðŸ“ Field Mapping Reference

| Purpose | Table | Field Slug | Field ID |
|---------|-------|------------|----------|
| Bid Status | Bid Request | field_314 | - |
| Lawyer | Bid Request | field_319 | - |
| Injury Categories | Bid Request | field_537 | kOGQ3eVrln |
| Blacklist | Users | field_570 | 4Z9Q2eoN2m |
| Expert Types (User) | Users | field_560 | K68j94kQ2V |
| Min Age | Users | field_566 | PblNe2mQxw |
| Max Age | Users | field_567 | 4YZjnKxrPv |
| Expert Types (Injury) | Injury Categories | field_534 | W0VNqX6rml |
| Bid Request Connection | Bid Request Details | field_496 | eykNO2JrDY |
| Claim Connection | Bid Request Details | field_500 | ka6jMXZQ75 |
| Plaintiffs Connection | Claims | field_204 | 4PzQ4GgNJG |
| Age | Plaintiffs | field_195 | lGArgZkjmR |

## âš¡ Performance Optimizations

- **Parallel API calls** - Fetches all related records at once instead of sequentially
- **Data caching** - Creates lookup maps to avoid repeated API calls
- **Early filtering** - Applies status filter at API level before fetching related data
- **Optimized for AWS Lambda** - Designed to complete within timeout limits

## ðŸ” Security Recommendations

- Store API keys in environment variables (never in code)
- Use AWS Secrets Manager for production credentials
- Implement rate limiting if needed
- Add authentication to your Lambda function URL
- Use VPC if connecting to private resources
- Never expose API credentials in client-side JavaScript

## ðŸ“„ License

ISC

---

**Happy filtering! ðŸš€**