from enum import Enum
from typing import Any, Dict, List, Union, Optional
from pydantic import BaseModel, Field


class ResponseModel(BaseModel):
    code: int = 0
    message: str = ''
    data: Any


class HttpRequestModel(BaseModel):
    """HTTP request model for generic HTTP request API"""
    method: str = Field(..., description='HTTP method, such as GET, POST, PUT, DELETE, etc.', examples=['GET', 'POST'])
    url: str = Field(..., description='Target URL address', examples=['http://example.com/api'])
    headers: Optional[Dict[str, str]] = Field(None, description='Request headers, key-value dictionary', examples=[{'Content-Type': 'application/json'}])
    payload: Optional[Union[str, Dict, List]] = Field(None, description='Request body, can be string, dict or list', examples=['{"key": "value"}'])
    timeout: Optional[int] = Field(30, description='Request timeout in seconds', examples=[30])


class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    messages: List[ChatMessage]
    stream: bool = False
    session_id: Optional[str] = None

class AppConfig(BaseModel):
    base_url: str = ""
    model_name: str = ""
    api_key: str = ""
    system_prompt: str = ""
    extra_params: Optional[Dict[str, Any]] = Field(default_factory=dict)
