# LLM Chat Backend API Documentation

This document lists the core backend API endpoints for `llm-chat`, including descriptions, request bodies, and response examples.

---

## Table of Contents
- [Base Service Endpoints](#base-service-endpoints)
  - [1. Server Health](#1-server-health)
  - [2. Version Info](#2-version-info)
  - [3. Server Status](#3-server-status)
- [LLM Config Management](#llm-config-management)
  - [4. Get Global Config](#4-get-global-config)
  - [5. Update Global Config](#5-update-global-config)
- [Session Management](#session-management)
  - [6. List All Sessions](#6-list-all-sessions)
  - [7. Get Session Details](#7-get-session-details)
  - [8. Save or Update Session](#8-save-or-update-session)
  - [9. Delete Single Session](#9-delete-single-session)
  - [10. Clear All Sessions](#10-clear-all-sessions)
- [Chat Completion API](#chat-completion-api)
  - [11. Proxy Chat Request (Streaming Supported)](#11-proxy-chat-request-streaming-supported)
- [Generic HTTP Proxy](#generic-http-proxy)
  - [12. Generic Backend HTTP Proxy Request](#12-generic-backend-http-proxy-request)

---

## Base Service Endpoints

### 1. Server Health
Checks if the backend server is alive and reachable.
- **URL**: `/health`
- **Method**: `GET`
- **Response**: `200 OK`

### 2. Version Info
Retrieves Git date and commit hash of the running backend.
- **URL**: `/version`
- **Method**: `GET`
- **Response Example**:
```json
{
  "git_data": "2024-05-10 12:00:00",
  "git_hash": "a1b2c3d4e5f6g7h8"
}
```

### 3. Server Status
Retrieves server start time and process information.
- **URL**: `/status`
- **Method**: `GET`
- **Response Example**:
```json
{
  "start_time": "2024-05-15 10:23:45",
  "pid": 10567
}
```

---

## LLM Config Management

> **Important Clarification**:
> The backend only provides a single global config via `/api/config` (stored in `config.yaml`).
> The "multiple LLM profiles" feature is frontend-local behavior (stored in browser `localStorage`) and does **not** introduce backend profile CRUD endpoints.

### 4. Get Global Config
Loads the default LLM connection and authentication settings from `config.yaml`.
- **URL**: `/api/config`
- **Method**: `GET`
- **Response Example**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "base_url": "http://127.0.0.1:8000/v1",
    "model_name": "qwen3.5-7b-chat",
    "api_key": "sk-local-dev-key",
    "system_prompt": "You are a helpful assistant.",
    "extra_params": {
        "temperature": 0.6,
        "top_k": 20
    }
  }
}
```

### 5. Update Global Config
Overwrites the default parameters in `config.yaml`, globally resetting LLM behavior.
- **URL**: `/api/config`
- **Method**: `POST`
- **Request Body Example**:
```json
{
  "base_url": "http://127.0.0.1:8000/v1",
  "model_name": "qwen3.5-14b-chat",
  "api_key": "new-secret-key",
  "system_prompt": "You are a helpful programming assistant.",
  "extra_params": {}
}
```

---

## Session Management

### 6. List All Sessions
Retrieves all local sessions ordered by modification time (descending).
- **URL**: `/api/sessions`
- **Method**: `GET`
- **Field Note**:
  - `config_name` is the profile name used by the frontend when this session was saved.
  - The backend stores and returns this value as session metadata, but does not manage profile definitions.
- **Response Example**:
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "1774167627186344",
      "title": "Introduction",
      "config_name": "My Custom GPT",
      "create_time": "2026-03-22 16:20:27.199",
      "update_time": 1715423851.0
    }
  ]
}
```

### 7. Get Session Details
Retrieves full chat history for a specific `session_id`.
- **URL**: `/api/sessions/{session_id}`
- **Method**: `GET`
- **Field Note**:
  - `config_name` is optional metadata used by frontend to restore the corresponding local profile.
- **Response Format**:
```json
{
  "code": 0,
  "data": {
    "title": "Session Title",
    "config_name": "My Custom GPT",
    "messages": [
      {
        "role": "user",
        "content": "Hello", 
        "time": "2026-03-22 10:00:00"
      },
      {
        "role": "assistant",
        "content": "Hi!",
        "reasoning_content": "Internal thought...",
        "time": "2026-03-22 10:00:01",
        "meta": {
           "ttft": 0.5,
           "total_time": 2.0,
           "total_chars": 3,
           "speed_chars": 1.5,
           "total_tokens": null,
           "speed_tokens": null
        }
      }
    ]
  }
}
```
*Note: `content` can be a string or an array of objects for multimodal input (e.g., `[{"type": "text", "text": "..."}, {"type": "image_url", "image_url": {"url": "..."}}]`).*

### 8. Save or Update Session
Overwrites JSON data for a specific `session_id`.
- **URL**: `/api/sessions/{session_id}`
- **Method**: `POST`
- **Request Body**: Same structure as the `data` field in **Get Session Details**.

### 9. Delete Single Session
Permanently deletes a session and its corresponding JSON file.
- **URL**: `/api/sessions/{session_id}`
- **Method**: `DELETE`

### 10. Clear All Sessions
Deletes all JSON files in the `sessions/` directory.
- **URL**: `/api/sessions`
- **Method**: `DELETE`

---

## Chat Completion API

### 11. Proxy Chat Request (Streaming Supported)
Core API for LLM communication. Requests are proxied to the configured internal LLM endpoint. Supports SSE (Server-Sent Events) when `stream=true`.

- **URL**: `/api/chat/completions`
- **Method**: `POST`
- **Request Body**: Compatible with OpenAI format.
- **Overrides**: You can optionally include the following in the request body to override global backend settings:
  - `base_url`, `api_key`, `model_name`, `system_prompt`, `extra_params` (entire object)
  - Individual parameters: `temperature`, `top_p`, `max_tokens`, `presence_penalty`, `frequency_penalty`.
- **Response (Streamed)**: Returns `text/event-stream`.
  - Incremental content follows standard OpenAI streaming format.
  - Ends with a `data: [TELEMETRY] { "ttft": ..., "total_time": ..., "total_chars": ..., "total_tokens": ... }` line before disconnection.
- **llama.cpp / llama-server (`timings_per_token`)**: If the upstream supports it, pass `"timings_per_token": true` inside `extra_params` (or the vendor’s equivalent). SSE chunks may then include a top-level `timings` object, e.g. `predicted_n` (token count so far) and `predicted_per_second`. The web UI prefers these over `usage` for token count and token speed in the message meta row when `timings` is present.

---

## Generic HTTP Proxy

### 12. Generic Backend HTTP Proxy Request
Allows the frontend to bypass CORS by sending requests via the backend.
- **URL**: `/api/request`
- **Method**: `POST`
- **Request Body**:
```json
{
  "method": "POST",
  "url": "https://external-api.com/v1",
  "headers": {"Content-Type": "application/json"},
  "payload": {"param": "value"},
  "timeout": 30
}
```
