# Image Processing Service

An asynchronous microservice that efficiently processes image data from CSV files. This service accepts CSV files containing product information and image URLs, processes the images by compressing them to 50% of their original quality, and provides output CSV files with both input and output image URLs.

## Features

- **Asynchronous Processing**: Non-blocking architecture that immediately returns a request ID while processing continues in the background
- **CSV Validation**: Ensures uploaded CSVs contain correctly formatted data
- **Image Compression**: Processes images by compressing them to 50% of original quality
- **Webhook Integration**: Notifies external systems when processing is complete
- **Status Tracking**: API endpoint to check processing status using request ID
- **Output Generation**: Generates output CSV with processed image URLs

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB (for tracking request status and storing product information)
- **Queue System**: Bull (Redis-based) for job management
- **Image Processing**: Sharp library for efficient image compression
- **File Handling**: Multer for file uploads and parsing
- **Validation**: Joi for data validation

## Prerequisites

- Node.js (v14+)
- MongoDB
- Redis

## Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/SANGEETHA2000/image-processor.git
   cd image-processor
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment configuration**:
   Create a `.env` file in the project root with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb_connection_string
   REDIS_URL=redis_connection_string
   IMAGE_STORAGE_PATH=./uploads
   OUTPUT_IMAGE_BASE_URL=http://localhost:3000/images/
   ```

4. **Start the application**:
   
   ```bash
   # Start the main server
   npm run dev
   
   # Start the worker (in a separate terminal)
   node workers/processingWorker.js
   ```

## API Documentation

### 1. Upload CSV

**Endpoint**: `POST /api/upload`

**Description**: Uploads a CSV file containing product information and image URLs for processing.

**Request**:
- Content-Type: `multipart/form-data`
- Body: CSV file with field name `csv`

**CSV Format**:
```
S. No.,Product Name,Input Image Urls
1,SKU1,https://www.example.com/image1.jpg,https://www.example.com/image2.jpg
2,SKU2,https://www.example.com/image3.jpg,https://www.example.com/image4.jpg
```

**Response**:
```json
{
  "success": true,
  "message": "CSV uploaded successfully. Processing started.",
  "data": {
    "requestId": "unique-request-id"
  }
}
```

### 2. Check Status

**Endpoint**: `GET /api/status/:requestId`

**Description**: Checks the status of an image processing request.

**Response**:
```json
{
  "success": true,
  "message": "Request status retrieved successfully",
  "data": {
    "requestId": "unique-request-id",
    "status": "processing",
    "progress": {
      "total": 10,
      "completed": 5,
      "failed": 0,
      "percentage": 50
    },
    "createdAt": "2025-02-28T04:23:54.123Z",
    "updatedAt": "2025-02-28T04:24:28.456Z",
    "outputCSV": "/api/download/unique-request-id"
  }
}
```

### 3. Register Webhook

**Endpoint**: `POST /api/webhook`

**Description**: Registers a webhook URL to receive a notification when processing is complete.

**Request**:
```json
{
  "requestId": "unique-request-id",
  "webhookUrl": "https://1a31d422fa6500060693539b49f17e50.m.pipedream.net"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Webhook registered successfully",
  "data": {
    "requestId": "unique-request-id",
    "webhookUrl": "https://1a31d422fa6500060693539b49f17e50.m.pipedream.net"
  }
}
```

### 4. Download Output CSV

**Endpoint**: `GET /api/download/:requestId`

**Description**: Downloads the output CSV file containing both input and output image URLs.

**Response**: CSV file download

**Output CSV Format**:
```
S. No.,Product Name,Input Image Urls,Output Image Urls
1,SKU1,https://www.example.com/image1.jpg,http://{{localhost/image-processor-oykz.onrender.com}}/images/processed/image1.jpg
2,SKU2,https://www.example.com/image3.jpg,http://{{localhost/image-processor-oykz.onrender.com}}/images/processed/image3.jpg
```

## Architecture

The system follows an event-driven, asynchronous architecture with these components:

1. **API Layer**: Express.js REST API for client interactions
2. **Queue System**: Bull queue backed by Redis for job management
3. **Worker Process**: Background process that handles image downloading and processing
4. **Database Layer**: MongoDB for storing request status and product information
5. **Storage Layer**: File system storage for processed images
6. **Webhook System**: HTTP notifications for external systems

## Deployment

### Deploying to Render

This service can be deployed as two separate services on Render:

1. **Web Service** (Main API Server):
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Background Worker**:
   - Build Command: `npm install`
   - Start Command: `node -e "require('http').createServer((req, res) => res.end('ok')).listen(process.env.PORT); require('./workers/processingWorker.js')"`

Required environment variables:
- `PORT` (supplied by Render)
- `MONGODB_URI` (MongoDB connection string)
- `REDIS_URL` (Redis connection string)
- `IMAGE_STORAGE_PATH` (path for storing processed images)
- `OUTPUT_IMAGE_BASE_URL` (base URL for accessing processed images)

## Testing

### Using Postman

1. Import the included Postman collection:
   - File: `Image_Processing_Service.postman_collection.json`
   - Set up environment variable for `requestId`

2. Test the workflow:
   - Upload a CSV file using the "Upload CSV" request
   - Copy the returned `requestId` and set the environment variable value
   - Check status using the "Check Status" request
   - Register a webhook using the "Register Webhook" request
   - Download results using the "Download Output CSV" request


## Performance Considerations

- **Database Indexes**: The system creates indexes on frequently queried fields for optimal performance.
- **Connection Resilience**: Redis and MongoDB connections are configured with timeouts and retry logic for stability.
- **Worker Scaling**: The worker process can be horizontally scaled for higher throughput.
